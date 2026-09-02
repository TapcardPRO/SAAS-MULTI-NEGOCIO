import type {
  ReactNode,
} from "react";

import {
  getDb,
} from "@/lib/db";

import {
  notFound,
} from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BusinessPage({
  params,
}: PageProps) {
  const {
    slug,
  } = await params;

  const db =
    await getDb();

  const business =
    await db
      .collection(
        "businesses"
      )
      .findOne({
        slug,

        active: {
          $ne: false,
        },
      });

  if (!business) {
    notFound();
  }

  const businessId =
    business._id;

  const tenantFilter = {
    $or: [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
      {
        businessSlug:
          slug,
      },
    ],
  };

  const [
    services,
    professionals,
  ] = await Promise.all([
    db
      .collection(
        "services"
      )
      .find({
        ...tenantFilter,

        active: {
          $ne: false,
        },
      } as any)
      .sort({
        order: 1,
        createdAt: 1,
      })
      .toArray(),

    db
      .collection(
        "professionals"
      )
      .find({
        ...tenantFilter,

        active: {
          $ne: false,
        },
      } as any)
      .sort({
        order: 1,
        createdAt: 1,
      })
      .toArray(),
  ]);

  /*
  =========================================================
  TEMA
  =========================================================
  */

  const primaryColor =
    normalizeHex(
      business.primaryColor,
      "#10b981"
    );

  const backgroundColor =
    normalizeHex(
      business.backgroundColor,
      "#071018"
    );

  const secondaryColor =
    normalizeHex(
      business.secondaryColor,
      "#0d1822"
    );

  const configuredText =
    normalizeHex(
      business.textColor,
      "#ffffff"
    );

  const textColor =
    contrastRatio(
      configuredText,
      backgroundColor
    ) >= 4.2
      ? configuredText
      : bestContrastColor(
          backgroundColor
        );

  const darkTheme =
    luminance(
      backgroundColor
    ) < 0.48;

  const surfaceColor =
    mixHex(
      backgroundColor,
      secondaryColor,
      0.72
    );

  const elevatedColor =
    mixHex(
      surfaceColor,
      darkTheme
        ? "#ffffff"
        : "#000000",
      darkTheme
        ? 0.045
        : 0.025
    );

  const softSurface =
    mixHex(
      backgroundColor,
      darkTheme
        ? "#ffffff"
        : "#000000",
      darkTheme
        ? 0.035
        : 0.025
    );

  const mutedText =
    rgba(
      hexToRgb(
        textColor
      ),
      0.60
    );

  const softerText =
    rgba(
      hexToRgb(
        textColor
      ),
      0.42
    );

  const borderColor =
    rgba(
      hexToRgb(
        textColor
      ),
      darkTheme
        ? 0.10
        : 0.14
    );

  const borderStrong =
    rgba(
      hexToRgb(
        textColor
      ),
      darkTheme
        ? 0.16
        : 0.20
    );

  const primarySoft =
    rgba(
      hexToRgb(
        primaryColor
      ),
      darkTheme
        ? 0.12
        : 0.09
    );

  const primarySoftStrong =
    rgba(
      hexToRgb(
        primaryColor
      ),
      darkTheme
        ? 0.20
        : 0.15
    );

  const onPrimary =
    bestContrastColor(
      primaryColor
    );

  const gallery =
    Array.isArray(
      business.gallery
    )
      ? business.gallery
          .filter(Boolean)
          .map(String)
      : [];

  const showProfessionals =
    business.showProfessionals !==
    false;

  const bookingHref =
    `/${slug}/agendar`;

  const whatsappHref =
    getWhatsAppHref(
      business.whatsapp
    );

  const instagramHref =
    getInstagramHref(
      business.instagram
    );

  const mapsHref =
    business.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          String(
            business.address
          )
        )}`
      : "";

  const wazeHref =
    business.address
      ? `https://www.waze.com/ul?q=${encodeURIComponent(
          String(
            business.address
          )
        )}&navigate=yes`
      : "";

  const cssVariables = {
    "--public-primary":
      primaryColor,

    "--public-primary-soft":
      primarySoft,

    "--public-primary-soft-strong":
      primarySoftStrong,

    "--public-on-primary":
      onPrimary,

    "--public-background":
      backgroundColor,

    "--public-surface":
      surfaceColor,

    "--public-elevated":
      elevatedColor,

    "--public-soft-surface":
      softSurface,

    "--public-text":
      textColor,

    "--public-muted":
      mutedText,

    "--public-softer":
      softerText,

    "--public-border":
      borderColor,

    "--public-border-strong":
      borderStrong,
  } as React.CSSProperties;

  return (
    <main
      className="vellto-public min-h-screen overflow-x-hidden"
      style={
        cssVariables
      }
    >
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .vellto-public {
          background:
            radial-gradient(
              circle at 90% 2%,
              var(--public-primary-soft),
              transparent 28rem
            ),
            var(--public-background);

          color:
            var(--public-text);
        }

        .vellto-public ::selection {
          background:
            var(--public-primary);

          color:
            var(--public-on-primary);
        }

        .vellto-public a,
        .vellto-public button {
          -webkit-tap-highlight-color:
            transparent;
        }

        .vellto-public .glass {
          background:
            color-mix(
              in srgb,
              var(--public-surface) 88%,
              transparent
            );

          backdrop-filter:
            blur(18px);
        }

        .vellto-public .surface {
          background:
            var(--public-surface);
        }

        .vellto-public .elevated {
          background:
            var(--public-elevated);
        }

        .vellto-public .public-border {
          border-color:
            var(--public-border);
        }

        .vellto-public .primary-shadow {
          box-shadow:
            0 20px 50px
            color-mix(
              in srgb,
              var(--public-primary) 22%,
              transparent
            );
        }
      `}</style>

      {/* ==================================================
          HEADER
      ================================================== */}

      <header
        className="sticky top-0 z-50 border-b glass"
        style={{
          borderColor,
        }}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href={`/${slug}`}
            className="flex min-w-0 items-center gap-3"
          >
            {business.logoUrl ? (
              <img
                src={
                  String(
                    business.logoUrl
                  )
                }
                alt={
                  String(
                    business.name
                  )
                }
                className="h-10 w-10 rounded-xl border object-cover"
                style={{
                  borderColor,
                }}
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black"
                style={{
                  backgroundColor:
                    primarySoftStrong,

                  color:
                    primaryColor,
                }}
              >
                {getInitials(
                  String(
                    business.name ||
                      ""
                  )
                )}
              </div>
            )}

            <div className="min-w-0">
              <p className="max-w-[180px] truncate text-sm font-extrabold tracking-tight sm:max-w-[260px] sm:text-base">
                {business.name}
              </p>

              <p
                className="mt-0.5 hidden max-w-[230px] truncate text-[10px] font-semibold uppercase tracking-[0.16em] sm:block"
                style={{
                  color:
                    softerText,
                }}
              >
                {business.category ||
                  "Agendamento online"}
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            <NavLink href="#servicos">
              Serviços
            </NavLink>

            <NavLink href="#sobre">
              Sobre
            </NavLink>

            {showProfessionals &&
            professionals.length >
              0 ? (
              <NavLink href="#equipe">
                Equipe
              </NavLink>
            ) : null}

            {gallery.length >
            0 ? (
              <NavLink href="#galeria">
                Galeria
              </NavLink>
            ) : null}

            {business.address ? (
              <NavLink href="#localizacao">
                Localização
              </NavLink>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`/${slug}/cliente`}
              className="hidden rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 sm:inline-flex"
              style={{
                borderColor,

                color:
                  textColor,
              }}
            >
              Minha conta
            </a>

            <a
              href={
                bookingHref
              }
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl px-4 text-sm font-extrabold transition hover:-translate-y-0.5 sm:px-5"
              style={{
                backgroundColor:
                  primaryColor,

                color:
                  onPrimary,
              }}
            >
              Agendar
            </a>
          </div>
        </div>
      </header>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em]"
              style={{
                borderColor:
                  rgba(
                    hexToRgb(
                      primaryColor
                    ),
                    0.28
                  ),

                backgroundColor:
                  primarySoft,

                color:
                  primaryColor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    primaryColor,
                }}
              />

              {business.category ||
                "Atendimento profissional"}
            </div>

            <h1 className="mt-6 max-w-2xl text-[2.6rem] font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-[4.7rem]">
              {business.name}
            </h1>

            <p
              className="mt-6 max-w-xl text-base leading-7 sm:text-lg sm:leading-8"
              style={{
                color:
                  mutedText,
              }}
            >
              {business.description ||
                "Atendimento profissional, organizado e com agendamento online para tornar sua experiência mais simples."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={
                  bookingHref
                }
                className="primary-shadow inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl px-7 font-extrabold transition hover:-translate-y-1"
                style={{
                  backgroundColor:
                    primaryColor,

                  color:
                    onPrimary,
                }}
              >
                Agendar horário

                <span>
                  →
                </span>
              </a>

              {whatsappHref ? (
                <a
                  href={
                    whatsappHref
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border px-7 font-bold transition hover:-translate-y-1"
                  style={{
                    borderColor:
                      borderStrong,

                    backgroundColor:
                      elevatedColor,

                    color:
                      textColor,
                  }}
                >
                  WhatsApp
                </a>
              ) : null}
            </div>

            <div
              className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm"
              style={{
                color:
                  softerText,
              }}
            >
              {services.length >
              0 ? (
                <TrustItem
                  accent={
                    primaryColor
                  }
                >
                  {services.length}{" "}
                  {services.length ===
                  1
                    ? "serviço disponível"
                    : "serviços disponíveis"}
                </TrustItem>
              ) : null}

              {professionals.length >
              0 ? (
                <TrustItem
                  accent={
                    primaryColor
                  }
                >
                  Atendimento com
                  hora marcada
                </TrustItem>
              ) : null}
            </div>
          </div>

          {/* FOTO DE CAPA */}

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[44px] opacity-70 blur-3xl"
              style={{
                background:
                  `radial-gradient(circle, ${primarySoftStrong}, transparent 68%)`,
              }}
            />

            <div
              className="relative overflow-hidden rounded-[28px] border p-2 shadow-2xl sm:rounded-[36px]"
              style={{
                borderColor,

                backgroundColor:
                  elevatedColor,

                boxShadow:
                  darkTheme
                    ? "0 40px 90px rgba(0,0,0,.38)"
                    : "0 30px 70px rgba(0,0,0,.12)",
              }}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] sm:rounded-[29px] lg:aspect-[1.08/1]">
                {business.coverUrl ? (
                  <img
                    src={
                      String(
                        business.coverUrl
                      )
                    }
                    alt={`Capa de ${business.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center"
                    style={{
                      background: `
                        radial-gradient(
                          circle at 70% 20%,
                          ${primarySoftStrong},
                          transparent 40%
                        ),
                        linear-gradient(
                          135deg,
                          ${surfaceColor},
                          ${backgroundColor}
                        )
                      `,
                    }}
                  >
                    {business.logoUrl ? (
                      <img
                        src={
                          String(
                            business.logoUrl
                          )
                        }
                        alt={
                          String(
                            business.name
                          )
                        }
                        className="h-28 w-28 rounded-[28px] object-cover shadow-2xl sm:h-36 sm:w-36"
                      />
                    ) : (
                      <span
                        className="text-7xl font-black opacity-80"
                        style={{
                          color:
                            primaryColor,
                        }}
                      >
                        {getInitials(
                          String(
                            business.name ||
                              ""
                          )
                        )}
                      </span>
                    )}
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              </div>
            </div>

            <div
              className="absolute -bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-xl sm:left-8 sm:right-auto sm:min-w-[280px]"
              style={{
                borderColor,

                backgroundColor:
                  elevatedColor,
              }}
            >
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{
                    color:
                      primaryColor,
                  }}
                >
                  Agendamento
                </p>

                <p className="mt-1 text-sm font-bold">
                  Reserve online
                </p>
              </div>

              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-black"
                style={{
                  backgroundColor:
                    primarySoftStrong,

                  color:
                    primaryColor,
                }}
              >
                ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          INFORMAÇÕES RÁPIDAS
      ================================================== */}

      <section className="px-4 py-4 sm:px-6">
        <div
          className="mx-auto grid max-w-7xl overflow-hidden rounded-[26px] border sm:grid-cols-2 lg:grid-cols-4"
          style={{
            borderColor,

            backgroundColor:
              surfaceColor,
          }}
        >
          <InfoCard
            label="Agendamento"
            title="100% online"
            description="Escolha serviço, profissional, data e horário."
            accent={
              primaryColor
            }
          />

          <InfoCard
            label="Atendimento"
            title="Horário reservado"
            description="Mais organização e menos tempo esperando."
            accent={
              primaryColor
            }
          />

          {business.address ? (
            <InfoCard
              label="Localização"
              title="Como chegar"
              description={
                String(
                  business.address
                )
              }
              href={
                mapsHref
              }
              accent={
                primaryColor
              }
            />
          ) : (
            <InfoCard
              label="Serviços"
              title={`${services.length} opções`}
              description="Confira todos os serviços disponíveis."
              href="#servicos"
              accent={
                primaryColor
              }
            />
          )}

          {instagramHref ? (
            <InfoCard
              label="Instagram"
              title={
                cleanInstagram(
                  business.instagram
                )
              }
              description="Acompanhe novidades e trabalhos."
              href={
                instagramHref
              }
              external
              accent={
                primaryColor
              }
            />
          ) : (
            <InfoCard
              label="Experiência"
              title="Atendimento profissional"
              description="Praticidade do início ao fim."
              accent={
                primaryColor
              }
            />
          )}
        </div>
      </section>

      {/* ==================================================
          SERVIÇOS
      ================================================== */}

      <section
        id="servicos"
        className="scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="Serviços"
            title={
              business.servicesTitle ||
              "Escolha o serviço ideal para você"
            }
            description="Conheça nossas opções e reserve seu horário de forma simples."
            accent={
              primaryColor
            }
            muted={
              mutedText
            }
          />

          {services.length >
          0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(
                (
                  service,
                  index
                ) => (
                  <article
                    key={
                      String(
                        service._id
                      )
                    }
                    className="group overflow-hidden rounded-[26px] border transition duration-300 hover:-translate-y-1.5"
                    style={{
                      borderColor,

                      backgroundColor:
                        surfaceColor,
                    }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {service.photoUrl ? (
                        <img
                          src={
                            String(
                              service.photoUrl
                            )
                          }
                          alt={
                            String(
                              service.name
                            )
                          }
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div
                          className="flex h-full items-center justify-center"
                          style={{
                            background: `
                              radial-gradient(
                                circle at 75% 25%,
                                ${primarySoftStrong},
                                transparent 38%
                              ),
                              ${elevatedColor}
                            `,
                          }}
                        >
                          <span
                            className="text-5xl font-black"
                            style={{
                              color:
                                primaryColor,

                              opacity:
                                0.3,
                            }}
                          >
                            {String(
                              index +
                                1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                      <div
                        className="absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-xs font-black"
                        style={{
                          backgroundColor:
                            primaryColor,

                          color:
                            onPrimary,
                        }}
                      >
                        {Number(
                          service.duration ||
                            0
                        ) > 0
                          ? `${Number(
                              service.duration
                            )} min`
                          : "Serviço"}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <h3 className="text-lg font-extrabold tracking-tight sm:text-xl">
                        {service.name}
                      </h3>

                      <p
                        className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6"
                        style={{
                          color:
                            mutedText,
                        }}
                      >
                        {service.description ||
                          "Atendimento com horário reservado e toda atenção que você merece."}
                      </p>

                      <div
                        className="mt-5 flex items-end justify-between gap-5 border-t pt-5"
                        style={{
                          borderColor,
                        }}
                      >
                        <div>
                          <p
                            className="text-[9px] font-black uppercase tracking-[0.17em]"
                            style={{
                              color:
                                softerText,
                            }}
                          >
                            Valor
                          </p>

                          <p
                            className="mt-1 text-xl font-black"
                            style={{
                              color:
                                primaryColor,
                            }}
                          >
                            {formatPrice(
                              Number(
                                service.price ||
                                  0
                              )
                            )}
                          </p>
                        </div>

                        <a
                          href={
                            bookingHref
                          }
                          className="flex h-11 items-center justify-center rounded-xl px-4 text-sm font-extrabold transition group-hover:-translate-y-0.5"
                          style={{
                            backgroundColor:
                              primarySoftStrong,

                            color:
                              primaryColor,
                          }}
                        >
                          Agendar
                        </a>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <div
              className="mt-10 rounded-[26px] border border-dashed p-10 text-center"
              style={{
                borderColor:
                  borderStrong,

                color:
                  mutedText,
              }}
            >
              Nenhum serviço disponível no momento.
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          CTA CENTRAL
      ================================================== */}

      <section className="px-4 sm:px-6">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[30px] border px-6 py-10 sm:px-10 sm:py-12 lg:px-14"
          style={{
            borderColor:
              rgba(
                hexToRgb(
                  primaryColor
                ),
                0.24
              ),

            background:
              `linear-gradient(
                135deg,
                ${surfaceColor},
                ${elevatedColor}
              )`,
          }}
        >
          <div
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl"
            style={{
              backgroundColor:
                primarySoftStrong,
            }}
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{
                  color:
                    primaryColor,
                }}
              >
                Seu horário, do seu jeito
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                Agende em poucos passos.
              </h2>

              <p
                className="mt-3 max-w-xl text-sm leading-6 sm:text-base"
                style={{
                  color:
                    mutedText,
                }}
              >
                Escolha seus serviços, profissional e o melhor horário sem precisar ligar ou esperar.
              </p>
            </div>

            <a
              href={
                bookingHref
              }
              className="primary-shadow inline-flex min-h-[54px] shrink-0 items-center justify-center rounded-2xl px-7 font-extrabold transition hover:-translate-y-1"
              style={{
                backgroundColor:
                  primaryColor,

                color:
                  onPrimary,
              }}
            >
              Reservar horário
              <span className="ml-3">
                →
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ==================================================
          SOBRE
      ================================================== */}

      <section
        id="sobre"
        className="scroll-mt-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="relative">
            <div
              className="overflow-hidden rounded-[30px] border p-2"
              style={{
                borderColor,

                backgroundColor:
                  elevatedColor,
              }}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[23px]">
                {business.coverUrl ? (
                  <img
                    src={
                      String(
                        business.coverUrl
                      )
                    }
                    alt={
                      String(
                        business.name
                      )
                    }
                    className="h-full w-full object-cover"
                  />
                ) : business.logoUrl ? (
                  <div
                    className="flex h-full items-center justify-center"
                    style={{
                      backgroundColor:
                        surfaceColor,
                    }}
                  >
                    <img
                      src={
                        String(
                          business.logoUrl
                        )
                      }
                      alt={
                        String(
                          business.name
                        )
                      }
                      className="h-32 w-32 rounded-[26px] object-cover shadow-xl"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-full items-center justify-center text-6xl font-black"
                    style={{
                      backgroundColor:
                        surfaceColor,

                      color:
                        primaryColor,
                    }}
                  >
                    {getInitials(
                      String(
                        business.name ||
                          ""
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Sobre nós"
              title="Um atendimento pensado em cada detalhe."
              description={
                String(
                  business.description ||
                    "Nosso compromisso é oferecer qualidade, organização e uma experiência agradável em cada atendimento."
                )
              }
              accent={
                primaryColor
              }
              muted={
                mutedText
              }
            />

            <div className="mt-8 grid gap-4">
              <Feature
                title="Horário reservado"
                description="Organização para que você seja atendido no momento combinado."
                accent={
                  primaryColor
                }
                muted={
                  mutedText
                }
                surface={
                  elevatedColor
                }
                border={
                  borderColor
                }
              />

              <Feature
                title="Agendamento online"
                description="Escolha seus serviços e marque pelo celular em poucos passos."
                accent={
                  primaryColor
                }
                muted={
                  mutedText
                }
                surface={
                  elevatedColor
                }
                border={
                  borderColor
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          EQUIPE
      ================================================== */}

      {showProfessionals &&
      professionals.length >
        0 ? (
        <section
          id="equipe"
          className="scroll-mt-24 border-y"
          style={{
            borderColor,

            backgroundColor:
              softSurface,
          }}
        >
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <SectionHeading
              eyebrow="Equipe"
              title="Quem cuida do seu atendimento"
              description="Conheça nossos profissionais e escolha quem vai atender você."
              accent={
                primaryColor
              }
              muted={
                mutedText
              }
            />

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {professionals.map(
                (
                  professional
                ) => (
                  <article
                    key={
                      String(
                        professional._id
                      )
                    }
                    className="overflow-hidden rounded-[26px] border"
                    style={{
                      borderColor,

                      backgroundColor:
                        surfaceColor,
                    }}
                  >
                    <div className="aspect-[4/4.4] overflow-hidden">
                      {professional.photoUrl ? (
                        <img
                          src={
                            String(
                              professional.photoUrl
                            )
                          }
                          alt={
                            String(
                              professional.name
                            )
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-full items-center justify-center text-5xl font-black"
                          style={{
                            background:
                              `radial-gradient(
                                circle at center,
                                ${primarySoftStrong},
                                transparent 48%
                              ),
                              ${elevatedColor}`,

                            color:
                              primaryColor,
                          }}
                        >
                          {getInitials(
                            String(
                              professional.name ||
                                ""
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-extrabold">
                        {professional.name}
                      </h3>

                      <p
                        className="mt-1 text-sm font-semibold"
                        style={{
                          color:
                            primaryColor,
                        }}
                      >
                        {professional.role ||
                          "Profissional"}
                      </p>

                      {professional.description ? (
                        <p
                          className="mt-3 line-clamp-3 text-sm leading-6"
                          style={{
                            color:
                              mutedText,
                          }}
                        >
                          {professional.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                )
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================================================
          GALERIA
      ================================================== */}

      {gallery.length >
      0 ? (
        <section
          id="galeria"
          className="scroll-mt-24"
        >
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <SectionHeading
              eyebrow="Galeria"
              title="Conheça nosso espaço"
              description="Um pouco da nossa estrutura, ambiente e trabalho."
              accent={
                primaryColor
              }
              muted={
                mutedText
              }
            />

            <div className="mt-10 grid auto-rows-[190px] gap-3 sm:grid-cols-2 sm:auto-rows-[230px] lg:grid-cols-3">
              {gallery.map(
                (
                  photo,
                  index
                ) => (
                  <div
                    key={`${photo}-${index}`}
                    className={`group overflow-hidden rounded-[22px] ${
                      index ===
                      0
                        ? "sm:row-span-2"
                        : ""
                    } ${
                      index ===
                      3
                        ? "lg:col-span-2"
                        : ""
                    }`}
                  >
                    <img
                      src={
                        photo
                      }
                      alt={`Foto ${
                        index +
                        1
                      } de ${
                        business.name
                      }`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================================================
          LOCALIZAÇÃO
      ================================================== */}

      {business.address ? (
        <section
          id="localizacao"
          className="scroll-mt-24 border-t"
          style={{
            borderColor,
          }}
        >
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <div
              className="grid overflow-hidden rounded-[30px] border lg:grid-cols-[0.9fr_1.1fr]"
              style={{
                borderColor,

                backgroundColor:
                  surfaceColor,
              }}
            >
              <div className="p-7 sm:p-10 lg:p-12">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{
                    color:
                      primaryColor,
                  }}
                >
                  Localização
                </p>

                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
                  Estamos esperando por você.
                </h2>

                <p
                  className="mt-5 max-w-lg text-base leading-7"
                  style={{
                    color:
                      mutedText,
                  }}
                >
                  {String(
                    business.address
                  )}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href={
                      mapsHref
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl px-5 py-3 text-sm font-extrabold"
                    style={{
                      backgroundColor:
                        primaryColor,

                      color:
                        onPrimary,
                    }}
                  >
                    Google Maps
                  </a>

                  <a
                    href={
                      wazeHref
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border px-5 py-3 text-sm font-bold"
                    style={{
                      borderColor:
                        borderStrong,

                      color:
                        textColor,
                    }}
                  >
                    Waze
                  </a>
                </div>
              </div>

              <div
                className="relative flex min-h-[300px] items-center justify-center overflow-hidden p-8 sm:min-h-[370px]"
                style={{
                  background: `
                    radial-gradient(
                      circle at center,
                      ${primarySoftStrong},
                      transparent 45%
                    ),
                    ${elevatedColor}
                  `,
                }}
              >
                <div className="text-center">
                  <div
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl shadow-xl"
                    style={{
                      backgroundColor:
                        primaryColor,

                      color:
                        onPrimary,
                    }}
                  >
                    ⌖
                  </div>

                  <p className="mt-5 font-extrabold">
                    Ver no mapa
                  </p>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      color:
                        mutedText,
                    }}
                  >
                    Toque em Google Maps ou Waze para navegar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================================================
          ÚLTIMO CTA
      ================================================== */}

      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div
          className="mx-auto max-w-7xl rounded-[30px] border px-6 py-12 text-center sm:px-10 sm:py-16"
          style={{
            borderColor:
              rgba(
                hexToRgb(
                  primaryColor
                ),
                0.24
              ),

            backgroundColor:
              surfaceColor,
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{
              color:
                primaryColor,
            }}
          >
            Pronto para agendar?
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-black tracking-tight sm:text-4xl">
            Escolha seu horário e cuide do seu tempo.
          </h2>

          <p
            className="mx-auto mt-4 max-w-xl text-sm leading-6 sm:text-base"
            style={{
              color:
                mutedText,
            }}
          >
            Faça seu agendamento online agora e deixe seu horário reservado.
          </p>

          <a
            href={
              bookingHref
            }
            className="primary-shadow mt-7 inline-flex min-h-[54px] items-center justify-center rounded-2xl px-8 font-extrabold transition hover:-translate-y-1"
            style={{
              backgroundColor:
                primaryColor,

              color:
                onPrimary,
            }}
          >
            Agendar agora
          </a>
        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer
        className="border-t"
        style={{
          borderColor,

          backgroundColor:
            surfaceColor,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {business.logoUrl ? (
                <img
                  src={
                    String(
                      business.logoUrl
                    )
                  }
                  alt={
                    String(
                      business.name
                    )
                  }
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl font-black"
                  style={{
                    backgroundColor:
                      primarySoftStrong,

                    color:
                      primaryColor,
                  }}
                >
                  {getInitials(
                    String(
                      business.name ||
                        ""
                    )
                  )}
                </div>
              )}

              <div>
                <p className="font-extrabold">
                  {business.name}
                </p>

                <p
                  className="mt-0.5 text-xs"
                  style={{
                    color:
                      softerText,
                  }}
                >
                  Agendamento online
                </p>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-x-6 gap-y-3 text-sm"
              style={{
                color:
                  mutedText,
              }}
            >
              <a href="#servicos">
                Serviços
              </a>

              <a href="#sobre">
                Sobre
              </a>

              {instagramHref ? (
                <a
                  href={
                    instagramHref
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              ) : null}

              {whatsappHref ? (
                <a
                  href={
                    whatsappHref
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>

          <div
            className="mt-8 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor,

              color:
                softerText,
            }}
          >
            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              {business.name}.
            </p>

            <p>
              Agendamento digital
            </p>
          </div>
        </div>
      </footer>

      {/* ==================================================
          WHATSAPP DESKTOP
      ================================================== */}

      {whatsappHref ? (
        <a
          href={
            whatsappHref
          }
          target="_blank"
          rel="noreferrer"
          aria-label="Falar pelo WhatsApp"
          className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-lg font-black text-white shadow-2xl transition hover:scale-105 sm:flex"
        >
          W
        </a>
      ) : null}

      {/* ==================================================
          CTA MOBILE
      ================================================== */}

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t p-3 backdrop-blur-xl sm:hidden"
        style={{
          borderColor,

          backgroundColor:
            rgba(
              hexToRgb(
                backgroundColor
              ),
              0.94
            ),
        }}
      >
        <a
          href={
            bookingHref
          }
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl font-black"
          style={{
            backgroundColor:
              primaryColor,

            color:
              onPrimary,
          }}
        >
          Agendar meu horário
        </a>
      </div>
    </main>
  );
}

/*
=========================================================
COMPONENTES
=========================================================
*/

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={
        href
      }
      className="text-sm font-semibold opacity-55 transition hover:opacity-100"
    >
      {children}
    </a>
  );
}

function TrustItem({
  children,
  accent,
}: {
  children: ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
        style={{
          backgroundColor:
            `${accent}18`,

          color:
            accent,
        }}
      >
        ✓
      </span>

      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  accent,
  muted,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  muted: string;
}) {
  return (
    <div className="max-w-2xl">
      <p
        className="text-[10px] font-black uppercase tracking-[0.2em]"
        style={{
          color:
            accent,
        }}
      >
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      <p
        className="mt-4 max-w-xl text-sm leading-6 sm:text-base sm:leading-7"
        style={{
          color:
            muted,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  title,
  description,
  accent,
  href,
  external,
}: {
  label: string;
  title: string;
  description: string;
  accent: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <div className="h-full p-5 sm:p-6">
      <p
        className="text-[9px] font-black uppercase tracking-[0.18em]"
        style={{
          color:
            accent,
        }}
      >
        {label}
      </p>

      <p className="mt-2 font-extrabold">
        {title}
      </p>

      <p className="mt-1.5 line-clamp-2 text-xs leading-5 opacity-50">
        {description}
      </p>
    </div>
  );

  if (!href) {
    return (
      <div className="border-b border-white/[0.06] last:border-0 sm:border-r lg:border-b-0">
        {content}
      </div>
    );
  }

  return (
    <a
      href={
        href
      }
      target={
        external
          ? "_blank"
          : undefined
      }
      rel={
        external
          ? "noreferrer"
          : undefined
      }
      className="border-b border-white/[0.06] transition hover:bg-white/[0.025] sm:border-r lg:border-b-0"
    >
      {content}
    </a>
  );
}

function Feature({
  title,
  description,
  accent,
  muted,
  surface,
  border,
}: {
  title: string;
  description: string;
  accent: string;
  muted: string;
  surface: string;
  border: string;
}) {
  return (
    <div
      className="flex gap-4 rounded-2xl border p-4"
      style={{
        borderColor:
          border,

        backgroundColor:
          surface,
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black"
        style={{
          backgroundColor:
            `${accent}18`,

          color:
            accent,
        }}
      >
        ✓
      </span>

      <div>
        <p className="font-extrabold">
          {title}
        </p>

        <p
          className="mt-1.5 text-sm leading-6"
          style={{
            color:
              muted,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/*
=========================================================
CORES
=========================================================
*/

type RGB = {
  r: number;
  g: number;
  b: number;
};

function normalizeHex(
  value: unknown,
  fallback: string
) {
  const color =
    String(
      value ||
        ""
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
    ).slice(1);

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

function channel(
  value: number
) {
  const normalized =
    value /
    255;

  return normalized <=
    0.03928
    ? normalized /
        12.92
    : Math.pow(
        (
          normalized +
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
      channel(
        rgb.r
      ) +
    0.7152 *
      channel(
        rgb.g
      ) +
    0.0722 *
      channel(
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

  return (
    (
      Math.max(
        a,
        b
      ) +
      0.05
    ) /
    (
      Math.min(
        a,
        b
      ) +
      0.05
    )
  );
}

function bestContrastColor(
  background: string
) {
  return contrastRatio(
    "#ffffff",
    background
  ) >=
    contrastRatio(
      "#111111",
      background
    )
    ? "#ffffff"
    : "#111111";
}

/*
=========================================================
GERAIS
=========================================================
*/

function getInitials(
  name: string
) {
  if (!name) {
    return "V";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(
      0,
      2
    )
    .map(
      (word) =>
        word.charAt(
          0
        )
    )
    .join("")
    .toUpperCase();
}

function formatPrice(
  price: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    price ||
      0
  );
}

function getWhatsAppHref(
  whatsapp: unknown
) {
  const digits =
    String(
      whatsapp ||
        ""
    ).replace(
      /\D/g,
      ""
    );

  if (!digits) {
    return "";
  }

  const number =
    digits.startsWith(
      "55"
    )
      ? digits
      : `55${digits}`;

  return `https://wa.me/${number}`;
}

function getInstagramHref(
  instagram: unknown
) {
  const value =
    String(
      instagram ||
        ""
    ).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith(
      "https://"
    ) ||
    value.startsWith(
      "http://"
    )
  ) {
    return value;
  }

  const username =
    value
      .replace(
        /^@/,
        ""
      )
      .replace(
        /^instagram\.com\//,
        ""
      )
      .replace(
        /\/+$/,
        ""
      );

  return `https://www.instagram.com/${username}`;
}

function cleanInstagram(
  instagram: unknown
) {
  const value =
    String(
      instagram ||
        ""
    ).trim();

  if (!value) {
    return "Instagram";
  }

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
  ) {
    try {
      const url =
        new URL(
          value
        );

      const username =
        url.pathname
          .replace(
            /\//g,
            ""
          );

      return username
        ? `@${username}`
        : "Instagram";
    } catch {
      return "Instagram";
    }
  }

  return `@${value.replace(
    /^@/,
    ""
  )}`;
}
