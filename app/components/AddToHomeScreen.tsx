"use client";

import { useEffect, useState } from "react";

type Props = { area: "cliente" | "profissional" | "publico"; slug?: string };

export default function AddToHomeScreen({ area, slug }: Props) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setIos(isIOS);
    if (standalone) return;
    setVisible(true);
    const key = `vellto-home-prompt-${area}`;
    try {
      if (!window.localStorage.getItem(key)) {
        setOpen(true);
        window.localStorage.setItem(key, "shown");
      }
    } catch {
      // Keep the persistent install button available when storage is blocked.
    }
    const manifestHref =
      area === "profissional"
        ? "/api/manifest?area=profissional"
        : area === "cliente"
          ? "/api/manifest?area=cliente&slug=" + encodeURIComponent(slug || "")
          : "/api/manifest?area=publico&slug=" + encodeURIComponent(slug || "");
    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestHref;
  }, [area, slug]);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[80] rounded-full bg-[#8df542] px-4 py-3 text-sm font-semibold text-black shadow-lg transition hover:brightness-95"
        aria-label="Ver como adicionar o Vellto à tela inicial"
      >
        + Instalar Vellto
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="vellto-install-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Vellto</p>
                <h2 id="vellto-install-title" className="mt-1 text-xl font-bold">Tenha o Vellto na tela inicial</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100" aria-label="Fechar">×</button>
            </div>
            <p className="text-sm text-gray-600">Acesse sua agenda mais rápido, como se fosse um aplicativo.</p>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6">
              {ios ? (
                <>
                  <li>Abra esta página no <strong>Safari</strong>.</li>
                  <li>Toque em <strong>Compartilhar</strong> (ícone de seta para cima).</li>
                  <li>Escolha <strong>Adicionar à Tela de Início</strong> e confirme.</li>
                </>
              ) : (
                <>
                  <li>Abra o Vellto no <strong>Google Chrome</strong>.</li>
                  <li>Toque no menu <strong>⋮</strong> do navegador.</li>
                  <li>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong> e confirme.</li>
                </>
              )}
            </ol>
            <button type="button" onClick={() => setOpen(false)} className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
