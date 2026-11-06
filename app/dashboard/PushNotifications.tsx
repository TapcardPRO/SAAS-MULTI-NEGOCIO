"use client";

import { useEffect, useState } from "react";

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function PushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (!available) return;

    setPermission(Notification.permission);
    if (Notification.permission !== "granted") return;

    navigator.serviceWorker.getRegistration("/").then(async (registration) => {
      if (!registration) return;
      const subscription = await registration.pushManager.getSubscription();
      setIsEnabled(Boolean(subscription));
    }).catch(() => {
      // A ativação manual continua disponível caso a leitura falhe.
    });
  }, []);

  async function enableNotifications() {
    setBusy(true);
    setMessage("");
    try {
      if (!supported) throw new Error("Este navegador não oferece suporte a notificações push. Tente o Chrome no Android ou um navegador compatível.");
      if (!window.isSecureContext) throw new Error("As notificações precisam de uma conexão HTTPS.");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("As notificações ainda não foram configuradas no servidor.");

      let result = Notification.permission;
      if (result !== "granted") result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") throw new Error("Permissão não concedida. Libere as notificações nas configurações do navegador.");

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(publicKey),
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.message || "Não foi possível salvar a assinatura de notificações.");

      setIsEnabled(true);
      setMessage("Notificações ativadas neste dispositivo. O Vellto enviará avisos conforme as permissões do seu perfil.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ativar as notificações.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🔔</span>
            <h2 className="text-lg font-bold">Notificações neste dispositivo</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Receba avisos de novos agendamentos mesmo quando o Vellto não estiver aberto. O proprietário recebe os agendamentos da empresa; cada profissional recebe somente os atendimentos vinculados a ele.
          </p>
          {!supported ? (
            <p className="mt-2 text-xs text-amber-300">
              Este navegador não oferece suporte a notificações push. Use um navegador compatível e uma conexão HTTPS.
            </p>
          ) : permission === "denied" ? (
            <p className="mt-2 text-xs text-amber-300">
              As notificações estão bloqueadas pelo navegador. Altere a permissão do site nas configurações do navegador.
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              {isEnabled ? "Este dispositivo possui uma assinatura de notificações." : "A ativação é feita individualmente em cada celular ou computador."}
            </p>
          )}
          {message ? <p role="status" className="mt-3 text-sm text-emerald-300">{message}</p> : null}
        </div>
        <button
          type="button"
          onClick={enableNotifications}
          disabled={!supported || busy || permission === "denied"}
          className="shrink-0 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Ativando..." : isEnabled ? "Atualizar dispositivo" : "Ativar notificações"}
        </button>
      </div>
    </section>
  );
}
