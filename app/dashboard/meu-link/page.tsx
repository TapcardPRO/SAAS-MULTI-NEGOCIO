"use client";

import {
  useEffect,
  useState,
} from "react";

import QRCode from "qrcode";

type Business = {
  name: string;
  slug: string;
};

export default function MeuLinkPage() {
  const [
    business,
    setBusiness,
  ] =
    useState<Business | null>(
      null
    );

  const [
    qrCode,
    setQrCode,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/auth/me",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.business
      ) {
        throw new Error(
          data.message ||
            "Empresa não encontrada."
        );
      }

      const nextBusiness =
        data.business as Business;

      setBusiness(
        nextBusiness
      );

      const url =
        getPublicUrl(
          nextBusiness.slug
        );

      const dataUrl =
        await QRCode.toDataURL(
          url,
          {
            width: 700,
            margin: 2,
            errorCorrectionLevel:
              "H",
          }
        );

      setQrCode(
        dataUrl
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar link."
      );
    } finally {
      setLoading(false);
    }
  }

  const publicUrl =
    business
      ? getPublicUrl(
          business.slug
        )
      : "";

  async function copyLink() {
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        publicUrl
      );

      setMessage(
        "Link copiado!"
      );
    } catch {
      setMessage(
        "Não foi possível copiar automaticamente."
      );
    }
  }

  async function shareLink() {
    if (
      !business ||
      !publicUrl
    ) {
      return;
    }

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            business.name,

          text:
            `Agende seu horário em ${business.name}`,

          url:
            publicUrl,
        });

        return;
      }

      await copyLink();
    } catch (error) {
      /*
      Cancelar o compartilhamento
      não precisa ser exibido como erro.
      */
      console.log(error);
    }
  }

  async function downloadQr() {
    if (
      !qrCode ||
      !business
    ) {
      return;
    }

    const link =
      document.createElement(
        "a"
      );

    link.href =
      qrCode;

    link.download =
      `qr-code-${business.slug}.png`;

    link.click();
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-zinc-400">
            Preparando seu link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Divulgação
          </p>

          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            Meu link
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Compartilhe seu link de agendamento com clientes ou use o QR Code no balcão, cartão, Instagram e WhatsApp.
          </p>
        </div>

        {business ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <div className="mx-auto max-w-[280px] rounded-3xl bg-white p-5 shadow-xl">
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt={`QR Code de ${business.name}`}
                    className="aspect-square w-full"
                  />
                ) : null}
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-lg font-black">
                  {business.name}
                </h2>

                <p className="mt-1 break-all text-xs text-zinc-500">
                  {publicUrl}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Link de agendamento
              </p>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="break-all text-sm font-medium">
                  {publicUrl}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 px-4 font-bold text-zinc-950"
                >
                  Abrir link
                </a>

                <button
                  type="button"
                  onClick={copyLink}
                  className="min-h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 font-semibold"
                >
                  Copiar link
                </button>

                <button
                  type="button"
                  onClick={shareLink}
                  className="min-h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 font-semibold"
                >
                  Compartilhar
                </button>

                <button
                  type="button"
                  onClick={downloadQr}
                  className="min-h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 font-semibold"
                >
                  Salvar QR Code
                </button>
              </div>

              {message ? (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-400">
                  {message}
                </div>
              ) : null}

              <div className="mt-7 border-t border-white/10 pt-6">
                <h3 className="font-bold">
                  Onde usar
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Hint
                    icon="◎"
                    title="Instagram"
                    text="Coloque o link na bio."
                  />

                  <Hint
                    icon="▣"
                    title="QR Code"
                    text="Imprima para balcão e cartão."
                  />

                  <Hint
                    icon="↗"
                    title="Mensagens"
                    text="Envie direto para clientes."
                  />

                  <Hint
                    icon="⌂"
                    title="Google"
                    text="Use como link de agendamento."
                  />
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-red-300">
            {message ||
              "Não foi possível carregar a empresa."}
          </div>
        )}
      </div>
    </main>
  );
}

function Hint({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xl text-emerald-400">
        {icon}
      </div>

      <p className="mt-2 font-bold">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-zinc-500">
        {text}
      </p>
    </div>
  );
}

function getPublicUrl(
  slug: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  return `${window.location.origin}/${slug}`;
}
