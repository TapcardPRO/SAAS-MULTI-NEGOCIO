"use client";

import Link from "next/link";
import {
  CSSProperties,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  children: ReactNode;

  user: {
    name: string;
    email: string;
    role: string;
  };

  business: {
    name: string;
    slug: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
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
    label: "Despesas",
    href: "/dashboard/despesas",
    icon: "−",
  },
  {
    label: "Relatórios",
    href: "/dashboard/relatorios",
    icon: "▥",
  },
  {
    label: "Fechamento mensal",
    href: "/dashboard/fechamento",
    icon: "✓",
  },
  {
    label: "Assinatura Vellto",
    href: "/dashboard/assinatura",
    icon: "◆",
  },
  {
    label: "Meu perfil",
    href: "/dashboard/perfil",
    icon: "☺",
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

  const isEmployee =
    user.role === "employee";

  const visibleMenu =
    isEmployee
      ? menu.filter(
          (item) =>
            item.href ===
              "/dashboard/agenda" ||
            item.href ===
              "/dashboard/mensalistas" ||
            item.href ===
              "/dashboard/financeiro" ||
            item.href ===
              "/dashboard/perfil"
        )
      : menu;

  useEffect(() => {
    if (!isEmployee) {
      return;
    }

    const allowed =
      pathname.startsWith(
        "/dashboard/agenda"
      ) ||
      pathname.startsWith(
        "/dashboard/mensalistas"
      ) ||
      pathname.startsWith(
        "/dashboard/financeiro"
      ) ||
      pathname.startsWith(
        "/dashboard/perfil"
      );

    if (!allowed) {
      router.replace(
        "/dashboard/agenda"
      );
    }
  }, [
    isEmployee,
    pathname,
    router,
  ]);

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

  const theme =
    createDashboardTheme({
      primary:
        business.primaryColor,

      secondary:
        business.secondaryColor,

      background:
        business.backgroundColor,

      text:
        business.textColor,
    });

  return (
    <div
      className="vellto-dashboard-theme min-h-screen overflow-x-hidden"
      style={
        {
          "--vellto-primary":
            theme.primary,

          "--vellto-primary-hover":
            theme.primaryHover,

          "--vellto-primary-soft":
            theme.primarySoft,

          "--vellto-primary-soft-strong":
            theme.primarySoftStrong,

          "--vellto-on-primary":
            theme.onPrimary,

          "--vellto-background":
            theme.background,

          "--vellto-surface":
            theme.surface,

          "--vellto-surface-2":
            theme.surface2,

          "--vellto-surface-3":
            theme.surface3,

          "--vellto-sidebar":
            theme.sidebar,

          "--vellto-text":
            theme.text,

          "--vellto-text-secondary":
            theme.textSecondary,

          "--vellto-text-muted":
            theme.textMuted,

          "--vellto-border":
            theme.border,

          "--vellto-border-strong":
            theme.borderStrong,

          "--vellto-shadow":
            theme.shadow,
        } as CSSProperties
      }
    >
      <style>{`
        /*
        ===================================================
        VELLTO - TEMA HARMONIZADO
        ===================================================
        As cores escolhidas pelo dono servem como base.
        Os tons de superfície, contraste e hierarquia são
        calculados automaticamente no JavaScript.
        ===================================================
        */

        .vellto-dashboard-theme {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 85% -10%,
              var(--vellto-primary-soft),
              transparent 32rem
            ),
            var(--vellto-background);
          color: var(--vellto-text);
        }

        .vellto-dashboard-theme > div {
          background: transparent;
        }

        /*
        ===================================================
        CONTEÚDO PRINCIPAL
        ===================================================
        */

        .vellto-dashboard-theme main {
          color: var(--vellto-text);
          background-color: transparent;
        }

        /*
        ===================================================
        SIDEBAR
        ===================================================
        */

        .vellto-dashboard-theme aside {
          background:
            linear-gradient(
              180deg,
              var(--vellto-sidebar),
              color-mix(
                in srgb,
                var(--vellto-sidebar) 94%,
                var(--vellto-background)
              )
            ) !important;

          border-color:
            var(--vellto-border) !important;

          box-shadow:
            16px 0 50px
            var(--vellto-shadow);
        }

        /*
        ===================================================
        TOPO MOBILE
        ===================================================
        */

        .vellto-dashboard-theme > header {
          background-color:
            color-mix(
              in srgb,
              var(--vellto-sidebar) 94%,
              transparent
            ) !important;

          border-color:
            var(--vellto-border) !important;
        }

        /*
        ===================================================
        CORES ESCURAS FIXAS EXISTENTES
        Transformamos todas em superfícies do tema.
        ===================================================
        */

        .vellto-dashboard-theme [class*="bg-[#050b10]"],
        .vellto-dashboard-theme [class*="bg-[#071018]"] {
          background-color:
            var(--vellto-background) !important;
        }

        .vellto-dashboard-theme [class*="bg-[#09131d]"],
        .vellto-dashboard-theme [class*="bg-[#081119]"] {
          background-color:
            var(--vellto-surface) !important;
        }

        .vellto-dashboard-theme [class*="bg-[#0a141d]"],
        .vellto-dashboard-theme [class*="bg-[#0b1620]"] {
          background-color:
            var(--vellto-surface-2) !important;
        }

        /*
        Cabeçalhos das páginas que usam o fundo antigo.
        */

        .vellto-dashboard-theme
        [class*="bg-[#09131d]/70"],
        .vellto-dashboard-theme
        [class*="bg-[#09131d]/95"] {
          background-color:
            color-mix(
              in srgb,
              var(--vellto-surface) 92%,
              transparent
            ) !important;
        }

        /*
        ===================================================
        CARDS E PAINÉIS
        ===================================================
        */

        .vellto-dashboard-theme
        [class*="bg-white/[0.015]"],

        .vellto-dashboard-theme
        [class*="bg-white/[0.02]"],

        .vellto-dashboard-theme
        [class*="bg-white/[0.025]"],

        .vellto-dashboard-theme
        [class*="bg-white/[0.03]"] {
          background-color:
            var(--vellto-surface-2) !important;
        }

        .vellto-dashboard-theme
        [class*="bg-white/[0.05]"],

        .vellto-dashboard-theme
        [class*="bg-white/[0.06]"] {
          background-color:
            var(--vellto-surface-3) !important;
        }

        .vellto-dashboard-theme
        [class*="bg-black/20"] {
          background-color:
            color-mix(
              in srgb,
              var(--vellto-background) 84%,
              black
            ) !important;
        }

        /*
        ===================================================
        COR PRINCIPAL
        ===================================================
        */

        .vellto-dashboard-theme .bg-emerald-500,
        .vellto-dashboard-theme .bg-emerald-400 {
          background-color:
            var(--vellto-primary) !important;
        }

        .vellto-dashboard-theme .text-emerald-400,
        .vellto-dashboard-theme .text-emerald-300 {
          color:
            var(--vellto-primary) !important;
        }

        .vellto-dashboard-theme
        [class*="bg-emerald-500/5"],

        .vellto-dashboard-theme
        [class*="bg-emerald-500/10"],

        .vellto-dashboard-theme
        [class*="bg-emerald-500/15"] {
          background-color:
            var(--vellto-primary-soft) !important;
        }

        /*
        Elemento ativo ganha um pouco mais de força.
        */

        .vellto-dashboard-theme
        nav [class*="bg-emerald-500/15"] {
          background-color:
            var(--vellto-primary-soft-strong) !important;
        }

        /*
        ===================================================
        CONTRASTE DE BOTÕES
        Não importa se primary é amarela, branca, azul,
        vinho ou quase preta.
        ===================================================
        */

        .vellto-dashboard-theme
        .bg-emerald-500.text-zinc-950,

        .vellto-dashboard-theme
        .bg-emerald-400.text-zinc-950,

        .vellto-dashboard-theme
        button.bg-emerald-500,

        .vellto-dashboard-theme
        a.bg-emerald-500 {
          color:
            var(--vellto-on-primary) !important;
        }

        /*
        ===================================================
        BORDAS
        ===================================================
        */

        .vellto-dashboard-theme
        [class*="border-white/5"],

        .vellto-dashboard-theme
        [class*="border-white/10"],

        .vellto-dashboard-theme
        [class*="border-white/15"] {
          border-color:
            var(--vellto-border) !important;
        }

        .vellto-dashboard-theme
        [class*="border-emerald-500"] {
          border-color:
            var(--vellto-primary) !important;
        }

        /*
        ===================================================
        TEXTO
        ===================================================
        */

        .vellto-dashboard-theme .text-white {
          color:
            var(--vellto-text) !important;
        }

        .vellto-dashboard-theme .text-zinc-200,
        .vellto-dashboard-theme .text-zinc-300 {
          color:
            var(--vellto-text) !important;
        }

        .vellto-dashboard-theme .text-zinc-400 {
          color:
            var(--vellto-text-secondary) !important;
        }

        .vellto-dashboard-theme .text-zinc-500,
        .vellto-dashboard-theme .text-zinc-600,
        .vellto-dashboard-theme .text-zinc-700 {
          color:
            var(--vellto-text-muted) !important;
        }

        /*
        Não sobrescrevemos vermelho/âmbar:
        continuam indicando erro, exclusão, alerta etc.
        */

        /*
        ===================================================
        INPUTS
        ===================================================
        */

        .vellto-dashboard-theme input,
        .vellto-dashboard-theme textarea,
        .vellto-dashboard-theme select {
          color:
            var(--vellto-text);

          border-color:
            var(--vellto-border);
        }

        .vellto-dashboard-theme input::placeholder,
        .vellto-dashboard-theme textarea::placeholder {
          color:
            var(--vellto-text-muted);
        }

        .vellto-dashboard-theme select option {
          color:
            var(--vellto-text);

          background-color:
            var(--vellto-surface-2);
        }

        /*
        ===================================================
        FOCO
        ===================================================
        */

        .vellto-dashboard-theme
        input:focus,

        .vellto-dashboard-theme
        textarea:focus,

        .vellto-dashboard-theme
        select:focus {
          border-color:
            var(--vellto-primary) !important;

          box-shadow:
            0 0 0 3px
            var(--vellto-primary-soft);
        }

        /*
        ===================================================
        HOVER
        ===================================================
        */

        .vellto-dashboard-theme
        .hover\\:bg-emerald-400:hover,

        .vellto-dashboard-theme
        .hover\\:bg-emerald-500:hover {
          background-color:
            var(--vellto-primary-hover) !important;
        }

        .vellto-dashboard-theme
        .hover\\:text-emerald-300:hover,

        .vellto-dashboard-theme
        .hover\\:text-emerald-400:hover {
          color:
            var(--vellto-primary-hover) !important;
        }

        /*
        ===================================================
        TABELAS
        ===================================================
        */

        .vellto-dashboard-theme table {
          color:
            var(--vellto-text);
        }

        .vellto-dashboard-theme thead {
          color:
            var(--vellto-text-muted);
        }

        /*
        ===================================================
        SCROLLBAR
        ===================================================
        */

        .vellto-dashboard-theme * {
          scrollbar-color:
            var(--vellto-border-strong)
            transparent;
        }

        /*
        ===================================================
        SELEÇÃO DE TEXTO
        ===================================================
        */

        .vellto-dashboard-theme ::selection {
          background:
            var(--vellto-primary);

          color:
            var(--vellto-on-primary);
        }
      `}</style>
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
                  V
                </div>

                <div>
                  <h1 className="text-lg font-black tracking-wide sm:text-xl">
                    VELLTO
                  </h1>

                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Agenda & Gestão
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
              {visibleMenu.map((item) => {
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
            {business.slug && !isEmployee ? (
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
                    {isEmployee ? "Profissional" : "Proprietário"}
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


/*
=========================================================
MOTOR DE TEMA
=========================================================

A empresa escolhe as cores.
O Vellto determina como elas devem conviver no painel.

Isso evita:
- cards sem contraste
- texto ilegível
- sidebar da mesma cor do fundo
- botão claro com texto claro
- painel visualmente pesado
=========================================================
*/

type RGB = {
  r: number;
  g: number;
  b: number;
};

type ThemeInput = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
};

function createDashboardTheme(
  input: ThemeInput
) {
  const primary =
    normalizeHex(
      input.primary,
      "#10b981"
    );

  let background =
    normalizeHex(
      input.background,
      "#050b10"
    );

  let secondary =
    normalizeHex(
      input.secondary,
      "#0a141d"
    );

  let text =
    normalizeHex(
      input.text,
      bestContrastColor(
        background
      )
    );

  /*
  Se o texto escolhido não tiver contraste suficiente,
  escolhemos automaticamente preto ou branco.
  */
  if (
    contrastRatio(
      text,
      background
    ) < 4.5
  ) {
    text =
      bestContrastColor(
        background
      );
  }

  const darkTheme =
    luminance(
      background
    ) < 0.45;

  /*
  Se secundária e fundo forem praticamente iguais,
  criamos separação automática.
  */
  if (
    colorDistance(
      secondary,
      background
    ) < 28
  ) {
    secondary =
      mixHex(
        background,
        darkTheme
          ? "#ffffff"
          : "#000000",
        darkTheme
          ? 0.085
          : 0.065
      );
  }

  /*
  Superfícies derivadas.
  Elas recebem influência da secondaryColor,
  sem deixar cada bloco com uma cor aleatória.
  */
  const surface =
    mixHex(
      background,
      secondary,
      0.62
    );

  const surface2 =
    mixHex(
      surface,
      darkTheme
        ? "#ffffff"
        : "#000000",
      darkTheme
        ? 0.035
        : 0.025
    );

  const surface3 =
    mixHex(
      surface2,
      darkTheme
        ? "#ffffff"
        : "#000000",
      darkTheme
        ? 0.045
        : 0.035
    );

  /*
  Sidebar um pouco mais marcada que o conteúdo.
  */
  let sidebar =
    mixHex(
      background,
      secondary,
      0.82
    );

  if (
    colorDistance(
      sidebar,
      background
    ) < 22
  ) {
    sidebar =
      mixHex(
        background,
        darkTheme
          ? "#ffffff"
          : "#000000",
        darkTheme
          ? 0.07
          : 0.05
      );
  }

  /*
  Texto precisa funcionar também sobre cards.
  */
  if (
    contrastRatio(
      text,
      surface2
    ) < 4.5
  ) {
    text =
      bestContrastColor(
        surface2
      );
  }

  const onPrimary =
    bestContrastColor(
      primary
    );

  const primaryHover =
    mixHex(
      primary,
      onPrimary ===
        "#ffffff"
        ? "#ffffff"
        : "#000000",
      0.10
    );

  const primaryRgb =
    hexToRgb(
      primary
    );

  const textRgb =
    hexToRgb(
      text
    );

  const textSecondary =
    rgba(
      textRgb,
      0.72
    );

  const textMuted =
    rgba(
      textRgb,
      0.48
    );

  const border =
    rgba(
      textRgb,
      darkTheme
        ? 0.105
        : 0.14
    );

  const borderStrong =
    rgba(
      textRgb,
      darkTheme
        ? 0.18
        : 0.22
    );

  const primarySoft =
    rgba(
      primaryRgb,
      darkTheme
        ? 0.11
        : 0.09
    );

  const primarySoftStrong =
    rgba(
      primaryRgb,
      darkTheme
        ? 0.18
        : 0.14
    );

  const shadow =
    darkTheme
      ? "rgba(0,0,0,.28)"
      : "rgba(0,0,0,.10)";

  return {
    primary,
    primaryHover,
    primarySoft,
    primarySoftStrong,
    onPrimary,

    background,
    surface,
    surface2,
    surface3,
    sidebar,

    text,
    textSecondary,
    textMuted,

    border,
    borderStrong,

    shadow,
  };
}

function normalizeHex(
  value: string,
  fallback: string
) {
  const color =
    String(
      value || ""
    ).trim();

  if (
    /^#[0-9a-fA-F]{6}$/.test(
      color
    )
  ) {
    return color.toLowerCase();
  }

  if (
    /^#[0-9a-fA-F]{3}$/.test(
      color
    )
  ) {
    return (
      "#" +
      color
        .slice(1)
        .split("")
        .map(
          (char) =>
            char + char
        )
        .join("")
        .toLowerCase()
    );
  }

  return fallback;
}

function hexToRgb(
  hex: string
): RGB {
  const normalized =
    normalizeHex(
      hex,
      "#000000"
    )
      .replace(
        "#",
        ""
      );

  return {
    r:
      parseInt(
        normalized.slice(
          0,
          2
        ),
        16
      ),

    g:
      parseInt(
        normalized.slice(
          2,
          4
        ),
        16
      ),

    b:
      parseInt(
        normalized.slice(
          4,
          6
        ),
        16
      ),
  };
}

function rgbToHex(
  rgb: RGB
) {
  const part = (
    value: number
  ) =>
    Math.round(
      Math.max(
        0,
        Math.min(
          255,
          value
        )
      )
    )
      .toString(16)
      .padStart(
        2,
        "0"
      );

  return `#${part(
    rgb.r
  )}${part(
    rgb.g
  )}${part(
    rgb.b
  )}`;
}

function mixHex(
  first: string,
  second: string,
  amount: number
) {
  const a =
    hexToRgb(
      first
    );

  const b =
    hexToRgb(
      second
    );

  const weight =
    Math.max(
      0,
      Math.min(
        1,
        amount
      )
    );

  return rgbToHex({
    r:
      a.r +
      (
        b.r -
        a.r
      ) *
        weight,

    g:
      a.g +
      (
        b.g -
        a.g
      ) *
        weight,

    b:
      a.b +
      (
        b.b -
        a.b
      ) *
        weight,
  });
}

function rgba(
  rgb: RGB,
  alpha: number
) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function relativeChannel(
  value: number
) {
  const channel =
    value /
    255;

  return channel <=
    0.03928
    ? channel /
        12.92
    : Math.pow(
        (
          channel +
          0.055
        ) /
          1.055,
        2.4
      );
}

function luminance(
  color: string
) {
  const rgb =
    hexToRgb(
      color
    );

  return (
    0.2126 *
      relativeChannel(
        rgb.r
      ) +
    0.7152 *
      relativeChannel(
        rgb.g
      ) +
    0.0722 *
      relativeChannel(
        rgb.b
      )
  );
}

function contrastRatio(
  first: string,
  second: string
) {
  const a =
    luminance(
      first
    );

  const b =
    luminance(
      second
    );

  const lighter =
    Math.max(
      a,
      b
    );

  const darker =
    Math.min(
      a,
      b
    );

  return (
    (
      lighter +
      0.05
    ) /
    (
      darker +
      0.05
    )
  );
}

function bestContrastColor(
  background: string
) {
  const white =
    contrastRatio(
      "#ffffff",
      background
    );

  const black =
    contrastRatio(
      "#111111",
      background
    );

  return white >=
    black
    ? "#ffffff"
    : "#111111";
}

function colorDistance(
  first: string,
  second: string
) {
  const a =
    hexToRgb(
      first
    );

  const b =
    hexToRgb(
      second
    );

  return Math.sqrt(
    Math.pow(
      a.r -
        b.r,
      2
    ) +
    Math.pow(
      a.g -
        b.g,
      2
    ) +
    Math.pow(
      a.b -
        b.b,
      2
    )
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