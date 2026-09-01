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
    });

  if (!business) {
    notFound();
  }

  const services = await db
    .collection("services")
    .find({
      businessSlug: slug,
      active: true,
    })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .toArray();

  const professionals = await db
    .collection("professionals")
    .find({
      businessSlug: slug,
      active: true,
    })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .toArray();

  const whatsappHref = getWhatsAppHref(
    business.whatsapp
  );

  const instagramHref = getInstagramHref(
    business.instagram
  );

  const bookingHref = `/${slug}/agendar`;

  let mainButtonHref = bookingHref;

  if (
    business.mainButtonType === "whatsapp" &&
    whatsappHref
  ) {
    mainButtonHref = whatsappHref;
  }

  if (
    business.mainButtonType === "link" &&
    business.mainButtonUrl
  ) {
    mainButtonHref =
      business.mainButtonUrl;
  }

  const mainButtonText =
    business.mainButtonText ||
    business.bookingButtonText ||
    "Agendar agora";

  const showProfessionals =
    business.showProfessionals !== false;

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor:
          business.backgroundColor ||
          "#09090b",

        color:
          business.textColor ||
          "#ffffff",
      }}
    >
      {/* CAPA */}
      <section className="relative overflow-hidden">
        <div
          className="relative min-h-[620px]"
          style={{
            backgroundColor:
              business.secondaryColor ||
              "#18181b",
          }}
        >
          {business.coverUrl ? (
            <img
              src={business.coverUrl}
              alt={`Capa de ${business.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}

          <div
            className="absolute inset-0"
            style={{
              background:
                business.coverUrl
                  ? `linear-gradient(
                      to bottom,
                      rgba(0,0,0,0.10),
                      rgba(0,0,0,0.45),
                      ${
                        business.backgroundColor ||
                        "#09090b"
                      }
                    )`
                  : `linear-gradient(
                      135deg,
                      ${
                        business.primaryColor ||
                        "#22c55e"
                      }30,
                      ${
                        business.backgroundColor ||
                        "#09090b"
                      }
                    )`,
            }}
          />

          <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-end px-6 pb-16 pt-16">
            <div className="max-w-4xl">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={`Logo de ${business.name}`}
                  className="mb-6 h-28 w-28 rounded-3xl border border-white/20 object-cover shadow-2xl"
                />
              ) : (
                <div
                  className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl text-3xl font-bold"
                  style={{
                    backgroundColor: `${
                      business.primaryColor ||
                      "#22c55e"
                    }25`,

                    color:
                      business.primaryColor ||
                      "#22c55e",
                  }}
                >
                  {business.logoText ||
                    getInitials(
                      business.name
                    )}
                </div>
              )}

              <p
                className="text-sm font-bold uppercase tracking-[0.3em]"
                style={{
                  color:
                    business.primaryColor ||
                    "#22c55e",
                }}
              >
                {business.category ||
                  "Negócio"}
              </p>

              <h1 className="mt-4 text-4xl font-bold sm:text-6xl">
                {business.name}
              </h1>

              {/* BOTÕES PRINCIPAIS */}
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={mainButtonHref}
                  target={
                    business.mainButtonType ===
                      "whatsapp" ||
                    business.mainButtonType ===
                      "link"
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    business.mainButtonType ===
                      "whatsapp" ||
                    business.mainButtonType ===
                      "link"
                      ? "noreferrer"
                      : undefined
                  }
                  className="rounded-xl px-6 py-3 font-semibold transition hover:opacity-90"
                  style={{
                    backgroundColor:
                      business.primaryColor ||
                      "#22c55e",

                    color:
                      business.backgroundColor ||
                      "#09090b",
                  }}
                >
                  {mainButtonText}
                </a>

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border px-6 py-3 font-semibold transition hover:bg-white/5"
                    style={{
                      borderColor: `${
                        business.textColor ||
                        "#ffffff"
                      }25`,
                    }}
                  >
                    WhatsApp
                  </a>
                ) : null}

                {instagramHref ? (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border px-6 py-3 font-semibold transition hover:bg-white/5"
                    style={{
                      borderColor: `${
                        business.textColor ||
                        "#ffffff"
                      }25`,
                    }}
                  >
                    Instagram
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p
              className="text-sm font-bold uppercase tracking-[0.3em]"
              style={{
                color:
                  business.primaryColor ||
                  "#22c55e",
              }}
            >
              Sobre nós
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Conheça nosso negócio
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-8 opacity-70">
              {business.description ||
                "Adicione uma descrição do negócio no painel."}
            </p>
          </div>

          <div
            className="rounded-3xl border p-6"
            style={{
              borderColor: `${
                business.textColor ||
                "#ffffff"
              }15`,

              backgroundColor: `${
                business.textColor ||
                "#ffffff"
              }05`,
            }}
          >
            <div className="space-y-6">
              {business.whatsapp &&
              whatsappHref ? (
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-40">
                    WhatsApp
                  </p>

                  <a
                    href={
                      whatsappHref
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-medium hover:underline"
                  >
                    {business.whatsapp}
                  </a>
                </div>
              ) : null}

              {business.instagram &&
              instagramHref ? (
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-40">
                    Instagram
                  </p>

                  <a
                    href={
                      instagramHref
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-medium hover:underline"
                  >
                    {business.instagram}
                  </a>
                </div>
              ) : null}

              {business.address ? (
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-40">
                    Endereço
                  </p>

                  <p className="mt-1 font-medium">
                    {business.address}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* LOCALIZAÇÃO */}
      {business.address ? (
        <section
          className="border-y"
          style={{
            borderColor: `${
              business.textColor ||
              "#ffffff"
            }10`,

            backgroundColor: `${
              business.textColor ||
              "#ffffff"
            }03`,
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div
              className="rounded-3xl border p-8 sm:p-10"
              style={{
                borderColor: `${
                  business.textColor ||
                  "#ffffff"
                }15`,

                backgroundColor: `${
                  business.textColor ||
                  "#ffffff"
                }04`,
              }}
            >
              <p
                className="text-sm font-bold uppercase tracking-[0.3em]"
                style={{
                  color:
                    business.primaryColor ||
                    "#22c55e",
                }}
              >
                Localização
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Como chegar
              </h2>

              <p className="mt-5 text-lg opacity-70">
                {business.address}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    business.address
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl px-6 py-3 font-semibold transition hover:opacity-90"
                  style={{
                    backgroundColor:
                      business.primaryColor ||
                      "#22c55e",

                    color:
                      business.backgroundColor ||
                      "#09090b",
                  }}
                >
                  Abrir no Google Maps
                </a>

                <a
                  href={`https://www.waze.com/ul?q=${encodeURIComponent(
                    business.address
                  )}&navigate=yes`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border px-6 py-3 font-semibold transition hover:bg-white/5"
                  style={{
                    borderColor: `${
                      business.textColor ||
                      "#ffffff"
                    }20`,
                  }}
                >
                  Abrir no Waze
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* SERVIÇOS */}
      <section
        className="border-b"
        style={{
          borderColor: `${
            business.textColor ||
            "#ffffff"
          }10`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p
            className="text-sm font-bold uppercase tracking-[0.3em]"
            style={{
              color:
                business.primaryColor ||
                "#22c55e",
            }}
          >
            Serviços
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            {business.servicesTitle ||
              "Escolha o que você precisa"}
          </h2>

          {services.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map(
                (service) => (
                  <div
                    key={String(
                      service._id
                    )}
                    className="overflow-hidden rounded-3xl border"
                    style={{
                      borderColor: `${
                        business.textColor ||
                        "#ffffff"
                      }12`,
                    }}
                  >
                    {service.photoUrl ? (
                      <img
                        src={
                          service.photoUrl
                        }
                        alt={
                          service.name
                        }
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-52 items-center justify-center text-sm opacity-40"
                        style={{
                          backgroundColor: `${
                            business.primaryColor ||
                            "#22c55e"
                          }10`,
                        }}
                      >
                        Sem foto
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="text-xl font-bold">
                        {service.name}
                      </h3>

                      {service.description ? (
                        <p className="mt-2 text-sm leading-6 opacity-60">
                          {
                            service.description
                          }
                        </p>
                      ) : null}

                      <div className="mt-6 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-widest opacity-40">
                            Valor
                          </p>

                          <p
                            className="mt-1 text-xl font-bold"
                            style={{
                              color:
                                business.primaryColor ||
                                "#22c55e",
                            }}
                          >
                            {formatPrice(
                              Number(
                                service.price
                              )
                            )}
                          </p>
                        </div>

                        {Number(
                          service.duration
                        ) > 0 ? (
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-widest opacity-40">
                              Duração
                            </p>

                            <p className="mt-1 font-medium">
                              {Number(
                                service.duration
                              )}{" "}
                              min
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-white/20 p-10 text-center opacity-50">
              Nenhum serviço cadastrado.
            </div>
          )}
        </div>
      </section>

      {/* PROFISSIONAIS */}
      {showProfessionals ? (
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10">
            <p
              className="text-sm font-bold uppercase tracking-[0.3em]"
              style={{
                color:
                  business.primaryColor ||
                  "#22c55e",
              }}
            >
              Profissionais
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Nossa equipe
            </h2>
          </div>

          {professionals.length >
          0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {professionals.map(
                (professional) => (
                  <div
                    key={String(
                      professional._id
                    )}
                    className="overflow-hidden rounded-3xl border"
                    style={{
                      borderColor: `${
                        business.textColor ||
                        "#ffffff"
                      }12`,
                    }}
                  >
                    {professional.photoUrl ? (
                      <img
                        src={
                          professional.photoUrl
                        }
                        alt={
                          professional.name
                        }
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex aspect-square w-full items-center justify-center text-5xl font-bold"
                        style={{
                          backgroundColor: `${
                            business.primaryColor ||
                            "#22c55e"
                          }12`,

                          color:
                            business.primaryColor ||
                            "#22c55e",
                        }}
                      >
                        {getInitials(
                          professional.name
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="text-xl font-bold">
                        {
                          professional.name
                        }
                      </h3>

                      {professional.role ? (
                        <p className="mt-1 text-sm opacity-50">
                          {
                            professional.role
                          }
                        </p>
                      ) : null}

                      {professional.description ? (
                        <p className="mt-4 text-sm leading-6 opacity-60">
                          {
                            professional.description
                          }
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center opacity-50">
              Nenhum profissional cadastrado.
            </div>
          )}
        </section>
      ) : null}

      {/* GALERIA */}
      <section
        className="border-y"
        style={{
          borderColor: `${
            business.textColor ||
            "#ffffff"
          }10`,

          backgroundColor: `${
            business.textColor ||
            "#ffffff"
          }03`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p
            className="text-sm font-bold uppercase tracking-[0.3em]"
            style={{
              color:
                business.primaryColor ||
                "#22c55e",
            }}
          >
            Galeria
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Nosso espaço
          </h2>

          {Array.isArray(
            business.gallery
          ) &&
          business.gallery.length >
            0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {business.gallery.map(
                (
                  photo: string,
                  index: number
                ) => (
                  <img
                    key={`${photo}-${index}`}
                    src={photo}
                    alt={`Foto ${
                      index + 1
                    } de ${
                      business.name
                    }`}
                    className="h-72 w-full rounded-3xl object-cover"
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-white/20 p-10 text-center opacity-50">
              Nenhuma foto na galeria.
            </div>
          )}
        </div>
      </section>

      {/* AGENDAMENTO / SEÇÃO FINAL */}
      {business.showBookingSection !==
      false ? (
        <section
          id="agendamento"
          className="mx-auto max-w-7xl px-6 py-20"
        >
          <div
            className="rounded-3xl border p-8 sm:p-12"
            style={{
              borderColor: `${
                business.primaryColor ||
                "#22c55e"
              }30`,

              backgroundColor: `${
                business.primaryColor ||
                "#22c55e"
              }08`,
            }}
          >
            <p
              className="text-sm font-bold uppercase tracking-[0.3em]"
              style={{
                color:
                  business.primaryColor ||
                  "#22c55e",
              }}
            >
              {business.bookingSectionLabel ||
                "Agendamento"}
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {business.bookingSectionTitle ||
                "Escolha seu horário"}
            </h2>

            <p className="mt-4 max-w-2xl leading-7 opacity-60">
              {business.bookingSectionDescription ||
                "Selecione seu serviço e escolha o melhor dia e horário para o atendimento."}
            </p>

            <div className="mt-7">
              <a
                href={bookingHref}
                className="inline-flex rounded-xl px-7 py-3 font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor:
                    business.primaryColor ||
                    "#22c55e",

                  color:
                    business.backgroundColor ||
                    "#09090b",
                }}
              >
                {business.bookingSectionButtonText ||
                  "Agendar agora"}
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* RODAPÉ */}
      <footer
        className="border-t"
        style={{
          borderColor: `${
            business.textColor ||
            "#ffffff"
          }10`,
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm opacity-50 sm:flex-row sm:items-center sm:justify-between">
          <p>{business.name}</p>

          <p>
            Página criada com nosso
            sistema
          </p>
        </div>
      </footer>
    </main>
  );
}

function getInitials(
  name: string
) {
  if (!name) return "S";

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
    value.startsWith("http://")
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