"use client";

import { useEffect, useState } from "react";

type PushNotificationsProps = {
  businessName?: string;
};

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function PushNotifications({ businessName }: PushNotificationsProps) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (available) setPermission(Notification.permission);
  }, []);

  async function enableNotifications() {
    setBusy(true);
    setMessage("");
    try {
      if (!supported) throw new Error("Este navegador não oferece suporte a notificações push. Tente o Chrome no Android ou um navegador compatível.");
      if (!window.isSecureContext) throw new Error("As notificações precisam de uma conexão HTTPS.");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("As notificações ainda não foram configuradas no servidor.");

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") throw new Error("Permissão não concedida. Você pode liberar as notificações nas configurações do navegador.");

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
      setMessage("Notificações ativadas neste dispositivo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ativar as notificações.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported || permission === "granted") {
    if (!supported) return null;
    return (
      <div className="fixed bottom-4 left-4 z-[79] max-w-[calc(100vw-2rem)]">
        <button
          type="button"
          onClick={enableNotifications}
          disabled={busy}
          className="rounded-full border border-white/15 bg-[#111b24] px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {busy ? "Ativando..." : "🔔 Notificações"}
        </button>
        {message ? <p role="status" className="mt-2 max-w-xs rounded-xl bg-[#111b24] p-3 text-xs text-white shadow-lg">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[79] max-w-[calc(100vw-2rem)]">
      <button
        type="button"
        onClick={enableNotifications}
        disabled={busy}
        className="rounded-full bg-[#8df542] px-4 py-3 text-sm font-bold text-black shadow-lg disabled:opacity-60"
      >
        {busy ? "Ativando..." : "🔔 Ativar notificações"}
      </button>
      {message ? <p role="status" className="mt-2 max-w-xs rounded-xl bg-white p-3 text-xs text-gray-800 shadow-lg">{message}</p> : null}
    </div>
  );
}
