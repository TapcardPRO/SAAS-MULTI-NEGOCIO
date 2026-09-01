"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  children: ReactNode;

  user: {
    name: string;
    email: string;
  };

  business: {
    name: string;
    slug: string;
    logoUrl: string;
  };
};

const menu = [
  {
    label: "Visão geral",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    label: "Agenda",
    href: "/dashboard/agenda",
    icon: "▣",
  },
  {
    label: "Clientes",
    href: "/dashboard/clientes",
    icon: "♙",
  },
  {
    label: "Planos",
    href: "/dashboard/planos",
    icon: "▦",
  },
  {
    label: "Mensalistas",
    href: "/dashboard/mensalistas",
    icon: "◇",
  },
  {
    label: "Serviços",
    href: "/dashboard/servicos",
    icon: "▤",
  },
  {
    label: "Profissionais",
    href: "/dashboard/profissionais",
    icon: "♧",
  },
  {
    label: "Horários",
    href: "/dashboard/horarios",
    icon: "◷",
  },
  {
    label: "Minha página",
    href: "/dashboard/minha-pagina",
    icon: "◈",
  },
  {
    label: "Financeiro",
    href: "/dashboard/financeiro",
    icon: "◉",
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    icon: "⚙",
  },
];

export default function DashboardShell({
  children,
  user,
  business,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenu, setMobileMenu] =
    useState(false);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#071018] text-white">
      {/* TOPO MOBILE */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-[#09131d]/95 px-3 backdrop-blur sm:px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Logo business={business} />

          <div className="min-w-0">
            <p className="max-w-[150px] truncate text-sm font-semibold sm:max-w-[260px]">
              {business.name}
            </p>

            <p className="text-xs text-zinc-500">
              Painel
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMobileMenu(
              (current) => !current
            )
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg transition hover:bg-white/[0.06]"
        >
          ☰
        </button>
      </header>

      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)]
            border-r border-white/10
            bg-[#09131d]
            shadow-2xl transition-transform duration-200 ease-out
            lg:sticky lg:top-0 lg:block lg:h-screen lg:translate-x-0
            ${
              mobileMenu
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          <div className="flex h-full min-h-0 flex-col">
            {/* MARCA */}
            <div className="border-b border-white/10 p-4 sm:p-6">
              <Link
                href="/dashboard"
                className="flex min-w-0 items-center gap-3"
                onClick={() =>
                  setMobileMenu(false)
                }
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 font-black text-zinc-950">
                  N
                </div>

                <div>
                  <h1 className="text-lg font-black sm:text-xl">
                    Nexora
                  </h1>

                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Gestão inteligente
                  </p>
                </div>
              </Link>
            </div>

            {/* EMPRESA */}
            <div className="px-3 py-3 sm:p-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Logo
                  business={business}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {business.name}
                  </p>

                  <p className="truncate text-xs text-zinc-500">
                    Minha empresa
                  </p>
                </div>
              </div>
            </div>

            {/* MENU */}
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-5 sm:px-4">
              {menu.map((item) => {
                const active =
                  isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setMobileMenu(false)
                    }
                    className={`flex min-h-[46px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition sm:px-4 sm:py-3 ${
                      active
                        ? "bg-emerald-500/15 font-semibold text-emerald-400"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="w-5 text-center text-base">
                      {item.icon}
                    </span>

                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* ACESSO À PÁGINA PÚBLICA */}
            {business.slug ? (
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                <a
                  href={`/${business.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10"
                >
                  Ver página pública ↗
                </a>
              </div>
            ) : null}

            {/* USUÁRIO */}
            <div className="border-t border-white/10 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold">
                  {user.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 max-w-full flex-1 overflow-x-hidden">
                  <p className="truncate text-sm font-semibold">
                    {user.name}
                  </p>

                  <p className="truncate text-xs text-zinc-500">
                    Proprietário
                  </p>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sair"
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  ↪
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* FUNDO MOBILE */}
        {mobileMenu ? (
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() =>
              setMobileMenu(false)
            }
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[1px] lg:hidden"
          />
        ) : null}

        {/* CONTEÚDO */}
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function Logo({
  business,
}: {
  business: Props["business"];
}) {
  if (business.logoUrl) {
    return (
      <img
        src={business.logoUrl}
        alt={business.name}
        className="h-10 w-10 shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-400">
      {business.name
        .charAt(0)
        .toUpperCase()}
    </div>
  );
}