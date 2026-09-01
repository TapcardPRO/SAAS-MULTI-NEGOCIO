import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BusinessPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const db = await getDb();

  const business = await db
    .collection("businesses")
    .findOne({
      slug,
      active: {
        $ne: false,
      },
    });

  if (!business) {
    notFound();
  }

  const businessId = business._id;

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
        businessSlug: slug,
      },
    ],
  };

  const services = await db
    .collection("services")
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
    .toArray();

  const professionals = await db
    .collection("professionals")
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
    .toArray();

  const primaryColor =
    business.primaryColor ||
    "#10b981";

  const backgroundColor =
    business.backgroundColor ||
    "#050b10";

  const textColor =
    business.textColor ||
    "#ffffff";

  const secondaryColor =
    business.secondaryColor ||
    "#0a141d";

  const whatsappHref =
    getWhatsAppHref(
      business.whatsapp
    );

  const instagramHref =
    getInstagramHref(
      business.instagram
    );

  const bookingHref =
    `/${slug}/agendar`;

  const mapsHref =
    business.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          business.address
        )}`
      : "";

  const wazeHref =
    business.address
      ? `https://www.waze.com/ul?q=${encodeURIComponent(
          business.address
        )}&navigate=yes`
      : "";

  const gallery =
    Array.isArray(
      business.gallery
    )
      ? business.gallery.filter(
          Boolean
        )
      : [];

  const showProfessionals =
    business.showProfessionals !==
    false;

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor:
            `${textColor}12`,

          backgroundColor:
            `${backgroundColor}e8`,
        }}
      >
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-6">
          <a
            href={`/${slug}`}
            className="flex min-w-0 items-center gap-3"
          >
            {business.logoUrl ? (
              <img
                src={
                  business.logoUrl
                }
                alt={
                  business.name
                }
                className="h-11 w-11 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black"
                style={{
                  backgroundColor:
                    `${primaryColor}20`,

                  color:
                    primaryColor,
                }}
              >
                {getInitials(
                  business.name
                )}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-bold">
                {business.name}
              </p>

              <p className="truncate text-[11px] uppercase tracking-[0.16em] opacity-40">
                {business.category ||
                  "Agendamento online"}
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            <a
              href="#servicos"
              className="text-sm opacity-60 transition hover:opacity-100"
            >
              Serviços
            </a>

            {showProfessionals &&
            professionals.length >
              0 ? (
              <a
                href="#equipe"
                className="text-sm opacity-60 transition hover:opacity-100"
              >
                Equipe
              </a>
            ) : null}

            {gallery.length >
            0 ? (
              <a
                href="#galeria"
                className="text-sm opacity-60 transition hover:opacity-100"
              >
                Galeria
              </a>
            ) : null}

            {business.address ? (
              <a
                href="#localizacao"
                className="text-sm opacity-60 transition hover:opacity-100"
              >
                Localização
              </a>
            ) : null}
          </nav>

          <a
            href={bookingHref}
            className="hidden rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 sm:inline-flex"
            style={{
              backgroundColor:
                primaryColor,

              color:
                getContrastColor(
                  primaryColor
                ),
            }}
          >
            Agendar horário
          </a>
        </div>
      </header>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="relative">
        <div className="relative min-h-[680px] sm:min-h-[760px]">
          {business.coverUrl ? (
            <img
              src={
                business.coverUrl
              }
              alt={`Capa de ${business.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(
                    circle at 80% 20%,
                    ${primaryColor}35,
                    transparent 35%
                  ),
                  linear-gradient(
                    135deg,
                    ${secondaryColor},
                    ${backgroundColor}
                  )
                `,
              }}
            />
          )}

          <div
            className="absolute inset-0"
            style={{
              background:
                business.coverUrl
                  ? `
                    linear-gradient(
                      90deg,
                      rgba(0,0,0,.86) 0%,
                      rgba(0,0,0,.62) 44%,
                      rgba(0,0,0,.20) 100%
                    ),
                    linear-gradient(
                      to top,
                      ${backgroundColor} 0%,
                      transparent 42%
                    )
                  `
                  : `
                    linear-gradient(
                      to top,
                      ${backgroundColor},
                      transparent
                    )
                  `,
            }}
          />

          <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-20 sm:min-h-[760px] sm:px-6">
            <div className="max-w-3xl">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]"
                style={{
                  borderColor:
                    `${primaryColor}40`,

                  backgroundColor:
                    `${primaryColor}12`,

                  color:
                    primaryColor,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      primaryColor,
                  }}
                />

                {business.category ||
                  "Atendimento profissional"}
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                {business.name}
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                {business.description ||
                  "Qualidade, cuidado e praticidade para você. Escolha seu serviço e reserve seu horário online."}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href={
                    bookingHref
                  }
                  className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl px-7 font-bold shadow-2xl transition hover:-translate-y-1"
                  style={{
                    backgroundColor:
                      primaryColor,

                    color:
                      getContrastColor(
                        primaryColor
                      ),

                    boxShadow:
                      `0 18px 50px ${primaryColor}25`,
                  }}
                >
                  Agendar agora

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
                    className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-7 font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
                  >
                    Falar no WhatsApp
                  </a>
                ) : null}
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 text-sm text-white/55">
                {services.length >
                0 ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                      style={{
                        backgroundColor:
                          `${primaryColor}18`,

                        color:
                          primaryColor,
                      }}
                    >
                      ✓
                    </span>

                    {services.length}{" "}
                    {services.length ===
                    1
                      ? "serviço disponível"
                      : "serviços disponíveis"}
                  </div>
                ) : null}

                {professionals.length >
                0 ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                      style={{
                        backgroundColor:
                          `${primaryColor}18`,

                        color:
                          primaryColor,
                      }}
                    >
                      ✓
                    </span>

                    Atendimento com
                    horário marcado
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          ATALHOS
      ================================================== */}

      <section className="relative z-20 -mt-10 px-5 sm:px-6">
        <div
          className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border shadow-2xl sm:grid-cols-2 lg:grid-cols-4"
          style={{
            borderColor:
              `${textColor}12`,

            backgroundColor:
              secondaryColor,

            boxShadow:
              "0 30px 80px rgba(0,0,0,.30)",
          }}
        >
          <QuickInfo
            eyebrow="Agendamento"
            title="Reserve online"
            description="Escolha o melhor dia e horário."
            href={
              bookingHref
            }
            accent={
              primaryColor
            }
          />

          {whatsappHref ? (
            <QuickInfo
              eyebrow="Contato"
              title="WhatsApp"
              description={
                business.whatsapp ||
                "Fale conosco"
              }
              href={
                whatsappHref
              }
              external
              accent={
                primaryColor
              }
            />
          ) : (
            <QuickInfo
              eyebrow="Atendimento"
              title="Prático e rápido"
              description="Agende em poucos passos."
              accent={
                primaryColor
              }
            />
          )}

          {business.address ? (
            <QuickInfo
              eyebrow="Localização"
              title="Como chegar"
              description={
                business.address
              }
              href={
                mapsHref
              }
              external
              accent={
                primaryColor
              }
            />
          ) : (
            <QuickInfo
              eyebrow="Serviços"
              title={`${services.length} disponíveis`}
              description="Confira nossas opções."
              href="#servicos"
              accent={
                primaryColor
              }
            />
          )}

          {instagramHref ? (
            <QuickInfo
              eyebrow="Redes sociais"
              title="Instagram"
              description={
                cleanInstagram(
                  business.instagram
                )
              }
              href={
                instagramHref
              }
              external
              accent={
                primaryColor
              }
            />
          ) : (
            <QuickInfo
              eyebrow="Experiência"
              title="Feito para você"
              description="Atendimento personalizado."
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
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <SectionLabel
                color={
                  primaryColor
                }
              >
                Serviços
              </SectionLabel>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                {business.servicesTitle ||
                  "Escolha a experiência ideal para você"}
              </h2>

              <p className="mt-5 max-w-xl leading-7 opacity-50">
                Confira os serviços
                disponíveis e faça seu
                agendamento online de
                forma simples e rápida.
              </p>
            </div>

            <a
              href={
                bookingHref
              }
              className="hidden items-center gap-2 text-sm font-bold lg:flex"
              style={{
                color:
                  primaryColor,
              }}
            >
              Ver horários
              disponíveis
              <span>→</span>
            </a>
          </div>

          {services.length >
          0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map(
                (
                  service,
                  index
                ) => (
                  <article
                    key={String(
                      service._id
                    )}
                    className="group relative overflow-hidden rounded-[28px] border transition duration-300 hover:-translate-y-2"
                    style={{
                      borderColor:
                        `${textColor}10`,

                      backgroundColor:
                        secondaryColor,
                    }}
                  >
                    <div className="relative h-64 overflow-hidden">
                      {service.photoUrl ? (
                        <img
                          src={
                            service.photoUrl
                          }
                          alt={
                            service.name
                          }
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="flex h-full items-center justify-center"
                          style={{
                            background: `
                              radial-gradient(
                                circle at 70% 30%,
                                ${primaryColor}30,
                                transparent 40%
                              ),
                              ${secondaryColor}
                            `,
                          }}
                        >
                          <span
                            className="text-7xl font-black opacity-20"
                            style={{
                              color:
                                primaryColor,
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div
                        className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{
                          backgroundColor:
                            primaryColor,

                          color:
                            getContrastColor(
                              primaryColor
                            ),
                        }}
                      >
                        {Number(
                          service.duration
                        ) > 0
                          ? `${Number(
                              service.duration
                            )} min`
                          : "Serviço"}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold">
                        {
                          service.name
                        }
                      </h3>

                      {service.description ? (
                        <p className="mt-3 line-clamp-2 min-h-[48px] text-sm leading-6 opacity-50">
                          {
                            service.description
                          }
                        </p>
                      ) : (
                        <p className="mt-3 min-h-[48px] text-sm leading-6 opacity-40">
                          Atendimento com
                          qualidade e
                          horário reservado
                          para você.
                        </p>
                      )}

                      <div className="mt-6 flex items-center justify-between gap-5 border-t border-white/[0.07] pt-5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-30">
                            A partir de
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
                                service.price
                              )
                            )}
                          </p>
                        </div>

                        <a
                          href={
                            bookingHref
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-full border text-lg transition group-hover:translate-x-1"
                          style={{
                            borderColor:
                              `${primaryColor}35`,

                            color:
                              primaryColor,

                            backgroundColor:
                              `${primaryColor}0d`,
                          }}
                          aria-label={`Agendar ${service.name}`}
                        >
                          →
                        </a>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <div
              className="mt-12 rounded-3xl border border-dashed p-12 text-center"
              style={{
                borderColor:
                  `${textColor}15`,
              }}
            >
              <p className="opacity-40">
                Nenhum serviço
                disponível no momento.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          CTA INTERMEDIÁRIO
      ================================================== */}

      <section className="px-5 sm:px-6">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border px-7 py-12 sm:px-12 sm:py-16 lg:px-16"
          style={{
            borderColor:
              `${primaryColor}25`,

            backgroundColor:
              secondaryColor,
          }}
        >
          <div
            className="absolute -right-32 -top-32 h-80 w-80 rounded-full blur-3xl"
            style={{
              backgroundColor:
                `${primaryColor}20`,
            }}
          />

          <div
            className="absolute -bottom-40 right-1/3 h-72 w-72 rounded-full blur-3xl"
            style={{
              backgroundColor:
                `${primaryColor}10`,
            }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <SectionLabel
                color={
                  primaryColor
                }
              >
                Seu tempo importa
              </SectionLabel>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Escolha seu horário sem
                precisar esperar.
              </h2>

              <p className="mt-4 max-w-xl leading-7 opacity-50">
                Consulte os horários
                disponíveis e confirme
                seu atendimento online.
              </p>
            </div>

            <a
              href={
                bookingHref
              }
              className="inline-flex min-h-[58px] items-center justify-center rounded-2xl px-8 font-bold transition hover:-translate-y-1"
              style={{
                backgroundColor:
                  primaryColor,

                color:
                  getContrastColor(
                    primaryColor
                  ),
              }}
            >
              Reservar meu horário
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

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div
              className="overflow-hidden rounded-[34px] border"
              style={{
                borderColor:
                  `${textColor}10`,
              }}
            >
              {business.coverUrl ? (
                <img
                  src={
                    business.coverUrl
                  }
                  alt={
                    business.name
                  }
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : business.logoUrl ? (
                <div
                  className="flex aspect-[4/3] items-center justify-center"
                  style={{
                    backgroundColor:
                      secondaryColor,
                  }}
                >
                  <img
                    src={
                      business.logoUrl
                    }
                    alt={
                      business.name
                    }
                    className="h-40 w-40 rounded-[32px] object-cover shadow-2xl"
                  />
                </div>
              ) : (
                <div
                  className="flex aspect-[4/3] items-center justify-center text-7xl font-black"
                  style={{
                    background: `
                      radial-gradient(
                        circle at 50% 40%,
                        ${primaryColor}30,
                        transparent 45%
                      ),
                      ${secondaryColor}
                    `,

                    color:
                      primaryColor,
                  }}
                >
                  {getInitials(
                    business.name
                  )}
                </div>
              )}
            </div>

            <div
              className="absolute -bottom-5 -right-2 rounded-2xl border p-5 shadow-2xl sm:right-7"
              style={{
                borderColor:
                  `${textColor}10`,

                backgroundColor:
                  secondaryColor,
              }}
            >
              <p
                className="text-2xl font-black"
                style={{
                  color:
                    primaryColor,
                }}
              >
                Online
              </p>

              <p className="mt-1 text-xs opacity-45">
                Agendamento fácil
                e rápido
              </p>
            </div>
          </div>

          <div>
            <SectionLabel
              color={
                primaryColor
              }
            >
              Sobre nós
            </SectionLabel>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Uma experiência pensada
              para você.
            </h2>

            <p className="mt-7 text-base leading-8 opacity-55 sm:text-lg">
              {business.description ||
                "Nosso compromisso é oferecer um atendimento de qualidade, com atenção aos detalhes e respeito ao seu tempo."}
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <Feature
                title="Agendamento online"
                description="Escolha o melhor horário diretamente pelo celular."
                accent={
                  primaryColor
                }
              />

              <Feature
                title="Atendimento organizado"
                description="Seu horário fica reservado para oferecer mais praticidade."
                accent={
                  primaryColor
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          PROFISSIONAIS
      ================================================== */}

      {showProfessionals &&
      professionals.length >
        0 ? (
        <section
          id="equipe"
          className="scroll-mt-24 border-y"
          style={{
            borderColor:
              `${textColor}08`,

            backgroundColor:
              `${textColor}025`,
          }}
        >
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32">
            <div className="max-w-2xl">
              <SectionLabel
                color={
                  primaryColor
                }
              >
                Nossa equipe
              </SectionLabel>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Profissionais prontos
                para atender você.
              </h2>

              <p className="mt-5 max-w-xl leading-7 opacity-50">
                Conheça quem faz parte
                da nossa equipe e escolha
                seu profissional no
                momento do agendamento.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {professionals.map(
                (
                  professional
                ) => (
                  <article
                    key={String(
                      professional._id
                    )}
                    className="group overflow-hidden rounded-[30px] border"
                    style={{
                      borderColor:
                        `${textColor}10`,

                      backgroundColor:
                        secondaryColor,
                    }}
                  >
                    <div className="relative aspect-[4/4.5] overflow-hidden">
                      {professional.photoUrl ? (
                        <img
                          src={
                            professional.photoUrl
                          }
                          alt={
                            professional.name
                          }
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="flex h-full items-center justify-center text-6xl font-black"
                          style={{
                            background: `
                              radial-gradient(
                                circle at 50% 40%,
                                ${primaryColor}25,
                                transparent 45%
                              ),
                              ${secondaryColor}
                            `,

                            color:
                              primaryColor,
                          }}
                        >
                          {getInitials(
                            professional.name
                          )}
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                        <h3 className="text-xl font-bold">
                          {
                            professional.name
                          }
                        </h3>

                        <p
                          className="mt-1 text-sm font-medium"
                          style={{
                            color:
                              primaryColor,
                          }}
                        >
                          {professional.role ||
                            "Profissional"}
                        </p>
                      </div>
                    </div>

                    {professional.description ? (
                      <div className="p-6">
                        <p className="text-sm leading-6 opacity-50">
                          {
                            professional.description
                          }
                        </p>
                      </div>
                    ) : null}
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

      {gallery.length > 0 ? (
        <section
          id="galeria"
          className="scroll-mt-24"
        >
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32">
            <div className="max-w-2xl">
              <SectionLabel
                color={
                  primaryColor
                }
              >
                Galeria
              </SectionLabel>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Conheça um pouco mais
                do nosso espaço.
              </h2>
            </div>

            <div className="mt-12 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map(
                (
                  photo: string,
                  index: number
                ) => (
                  <div
                    key={`${photo}-${index}`}
                    className={`group overflow-hidden rounded-[28px] ${
                      index === 0
                        ? "sm:row-span-2"
                        : ""
                    }`}
                  >
                    <img
                      src={
                        photo
                      }
                      alt={`Foto ${
                        index + 1
                      } de ${
                        business.name
                      }`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
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
          className="scroll-mt-24 border-y"
          style={{
            borderColor:
              `${textColor}08`,

            backgroundColor:
              `${textColor}025`,
          }}
        >
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <SectionLabel
                  color={
                    primaryColor
                  }
                >
                  Localização
                </SectionLabel>

                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                  Estamos esperando
                  por você.
                </h2>

                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-30">
                    Endereço
                  </p>

                  <p className="mt-3 max-w-lg text-lg font-medium leading-8 opacity-70">
                    {
                      business.address
                    }
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={
                      mapsHref
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl px-6 py-3.5 font-bold transition hover:-translate-y-0.5"
                    style={{
                      backgroundColor:
                        primaryColor,

                      color:
                        getContrastColor(
                          primaryColor
                        ),
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
                    className="rounded-xl border px-6 py-3.5 font-semibold transition hover:bg-white/5"
                    style={{
                      borderColor:
                        `${textColor}15`,
                    }}
                  >
                    Abrir no Waze
                  </a>
                </div>
              </div>

              <div
                className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[34px] border p-8"
                style={{
                  borderColor:
                    `${textColor}10`,

                  background: `
                    radial-gradient(
                      circle at center,
                      ${primaryColor}20,
                      transparent 45%
                    ),
                    ${secondaryColor}
                  `,
                }}
              >
                <div className="relative text-center">
                  <div
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-2xl"
                    style={{
                      backgroundColor:
                        primaryColor,

                      color:
                        getContrastColor(
                          primaryColor
                        ),

                      boxShadow:
                        `0 20px 60px ${primaryColor}35`,
                    }}
                  >
                    ●
                  </div>

                  <p className="mt-6 font-bold">
                    {
                      business.name
                    }
                  </p>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 opacity-45">
                    {
                      business.address
                    }
                  </p>

                  <a
                    href={
                      mapsHref
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex text-sm font-bold"
                    style={{
                      color:
                        primaryColor,
                    }}
                  >
                    Ver rota →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ==================================================
          CTA FINAL
      ================================================== */}

      {business.showBookingSection !==
      false ? (
        <section className="px-5 py-24 sm:px-6 sm:py-32">
          <div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[40px] px-7 py-16 text-center sm:px-12 sm:py-24"
            style={{
              backgroundColor:
                primaryColor,

              color:
                getContrastColor(
                  primaryColor
                ),
            }}
          >
            <div className="relative z-10 mx-auto max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                {business.bookingSectionLabel ||
                  "Agendamento online"}
              </p>

              <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {business.bookingSectionTitle ||
                  "Seu próximo horário está a poucos cliques."}
              </h2>

              <p className="mx-auto mt-6 max-w-xl leading-7 opacity-65">
                {business.bookingSectionDescription ||
                  "Escolha seu serviço, profissional, data e horário. Simples, rápido e online."}
              </p>

              <a
                href={
                  bookingHref
                }
                className="mt-9 inline-flex min-h-[58px] items-center justify-center rounded-2xl bg-black px-9 font-bold text-white transition hover:-translate-y-1"
              >
                {business.bookingSectionButtonText ||
                  "Agendar meu horário"}

                <span className="ml-3">
                  →
                </span>
              </a>
            </div>

            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

            <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-black/10 blur-2xl" />
          </div>
        </section>
      ) : null}

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer
        className="border-t pb-24 sm:pb-0"
        style={{
          borderColor:
            `${textColor}08`,
        }}
      >
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {business.logoUrl ? (
                <img
                  src={
                    business.logoUrl
                  }
                  alt={
                    business.name
                  }
                  className="h-11 w-11 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl font-black"
                  style={{
                    backgroundColor:
                      `${primaryColor}15`,

                    color:
                      primaryColor,
                  }}
                >
                  {getInitials(
                    business.name
                  )}
                </div>
              )}

              <div>
                <p className="font-bold">
                  {
                    business.name
                  }
                </p>

                <p className="text-xs opacity-35">
                  Agendamento online
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-5 text-sm opacity-50">
              {whatsappHref ? (
                <a
                  href={
                    whatsappHref
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:opacity-100"
                >
                  WhatsApp
                </a>
              ) : null}

              {instagramHref ? (
                <a
                  href={
                    instagramHref
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:opacity-100"
                >
                  Instagram
                </a>
              ) : null}

              <a
                href="#servicos"
                className="transition hover:opacity-100"
              >
                Serviços
              </a>

              <a
                href={
                  bookingHref
                }
                className="transition hover:opacity-100"
              >
                Agendar
              </a>
            </div>
          </div>

          <div
            className="mt-9 flex flex-col gap-3 border-t pt-7 text-xs opacity-30 sm:flex-row sm:justify-between"
            style={{
              borderColor:
                `${textColor}08`,
            }}
          >
            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              {business.name}. Todos os
              direitos reservados.
            </p>

            <p>
              Agendamento digital
            </p>
          </div>
        </div>
      </footer>

      {/* ==================================================
          WHATSAPP FLUTUANTE
      ================================================== */}

      {whatsappHref ? (
        <a
          href={
            whatsappHref
          }
          target="_blank"
          rel="noreferrer"
          aria-label="Falar pelo WhatsApp"
          className="fixed bottom-24 right-5 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-xl font-black text-white shadow-2xl transition hover:scale-105 sm:flex sm:bottom-6"
        >
          W
        </a>
      ) : null}

      {/* ==================================================
          CTA FIXO MOBILE
      ================================================== */}

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t p-3 backdrop-blur-xl sm:hidden"
        style={{
          borderColor:
            `${textColor}10`,

          backgroundColor:
            `${backgroundColor}ee`,
        }}
      >
        <a
          href={
            bookingHref
          }
          className="flex min-h-[54px] w-full items-center justify-center rounded-2xl font-black"
          style={{
            backgroundColor:
              primaryColor,

            color:
              getContrastColor(
                primaryColor
              ),
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

function SectionLabel({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <p
      className="text-xs font-black uppercase tracking-[0.22em]"
      style={{
        color,
      }}
    >
      {children}
    </p>
  );
}

function QuickInfo({
  eyebrow,
  title,
  description,
  href,
  external,
  accent,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  external?: boolean;
  accent: string;
}) {
  const content = (
    <div className="group h-full p-6 sm:p-7">
      <p
        className="text-[10px] font-black uppercase tracking-[0.2em]"
        style={{
          color: accent,
        }}
      >
        {eyebrow}
      </p>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-bold">
            {title}
          </p>

          <p className="mt-2 line-clamp-2 text-sm leading-5 opacity-40">
            {description}
          </p>
        </div>

        {href ? (
          <span
            className="mt-1 shrink-0 transition group-hover:translate-x-1"
            style={{
              color: accent,
            }}
          >
            →
          </span>
        ) : null}
      </div>
    </div>
  );

  if (!href) {
    return (
      <div className="border-b border-white/[0.07] last:border-0 sm:border-r lg:border-b-0">
        {content}
      </div>
    );
  }

  return (
    <a
      href={href}
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
      className="border-b border-white/[0.07] transition hover:bg-white/[0.025] sm:border-r lg:border-b-0"
    >
      {content}
    </a>
  );
}

function Feature({
  title,
  description,
  accent,
}: {
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="flex gap-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black"
        style={{
          backgroundColor:
            `${accent}15`,

          color: accent,
        }}
      >
        ✓
      </span>

      <div>
        <p className="font-bold">
          {title}
        </p>

        <p className="mt-2 text-sm leading-6 opacity-45">
          {description}
        </p>
      </div>
    </div>
  );
}

/*
=========================================================
HELPERS
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
    .slice(0, 2)
    .map((word) =>
      word.charAt(0)
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
      style: "currency",
      currency: "BRL",
    }
  ).format(price || 0);
}

function getWhatsAppHref(
  whatsapp: unknown
) {
  const digits = String(
    whatsapp || ""
  ).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const number =
    digits.startsWith("55")
      ? digits
      : `55${digits}`;

  return `https://wa.me/${number}`;
}

function getInstagramHref(
  instagram: unknown
) {
  const value = String(
    instagram || ""
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

  const username = value
    .replace(/^@/, "")
    .replace(
      /^instagram\.com\//,
      ""
    )
    .replace(/\/+$/, "");

  return `https://www.instagram.com/${username}`;
}

function cleanInstagram(
  instagram: unknown
) {
  const value = String(
    instagram || ""
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
        new URL(value);

      const username =
        url.pathname
          .replace(/\//g, "");

      return username
        ? `@${username}`
        : "Instagram";
    } catch {
      return "Instagram";
    }
  }

  const username =
    value.replace(
      /^@/,
      ""
    );

  return `@${username}`;
}

function getContrastColor(
  hex: string
) {
  const normalized =
    hex.replace("#", "");

  if (
    normalized.length !== 6
  ) {
    return "#050505";
  }

  const red =
    parseInt(
      normalized.substring(
        0,
        2
      ),
      16
    );

  const green =
    parseInt(
      normalized.substring(
        2,
        4
      ),
      16
    );

  const blue =
    parseInt(
      normalized.substring(
        4,
        6
      ),
      16
    );

  const luminance =
    (red * 299 +
      green * 587 +
      blue * 114) /
    1000;

  return luminance > 150
    ? "#050505"
    : "#ffffff";
}