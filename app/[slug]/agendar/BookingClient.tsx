"use client";

import {
  CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";

type Business = {
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
};

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  photoUrl: string;
};

type Professional = {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  photoUrl: string;
};

type Slot = {
  time: string;
  endTime: string;
};

type CalendarDay = {
  date: string;
  day: number;
  currentMonth: boolean;
  past: boolean;
  today: boolean;
};

type Props = {
  business: Business;
  services: Service[];
  professionals: Professional[];
};

export default function BookingClient({
  business,
  services,
  professionals,
}: Props) {
  const [
    serviceIds,
    setServiceIds,
  ] = useState<string[]>([]);

  const [
    professionalId,
    setProfessionalId,
  ] = useState("");

  const [date, setDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [slots, setSlots] =
    useState<Slot[]>([]);

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState("");

  const [
    loadingSlots,
    setLoadingSlots,
  ] = useState(false);

  const [
    loadingCustomer,
    setLoadingCustomer,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [done, setDone] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [
    customer,
    setCustomer,
  ] = useState<Customer | null>(
    null
  );

  const theme =
    useMemo(
      () =>
        createTheme(
          business
        ),
      [business]
    );

  const themeStyle = {
    "--booking-primary":
      theme.primary,

    "--booking-on-primary":
      theme.onPrimary,

    "--booking-background":
      theme.background,

    "--booking-surface":
      theme.surface,

    "--booking-surface-2":
      theme.surface2,

    "--booking-text":
      theme.text,

    "--booking-muted":
      theme.muted,

    "--booking-border":
      theme.border,

    "--booking-primary-soft":
      theme.primarySoft,
  } as CSSProperties;

  useEffect(() => {
    const current =
      todaySaoPaulo();

    setCalendarMonth(
      current.slice(
        0,
        7
      )
    );

    loadCustomer();
  }, []);

  useEffect(() => {
    if (
      serviceIds.length ===
        0 ||
      !professionalId ||
      !date
    ) {
      setSlots([]);
      setTime("");
      return;
    }

    loadSlots();
  }, [
    serviceIds,
    professionalId,
    date,
  ]);

  const selectedServices =
    useMemo(() => {
      return services.filter(
        (item) =>
          serviceIds.includes(
            item.id
          )
      );
    }, [
      services,
      serviceIds,
    ]);

  const totalDuration =
    useMemo(
      () =>
        selectedServices.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.duration ||
                0
            ),
          0
        ),
      [
        selectedServices,
      ]
    );

  const totalPrice =
    useMemo(
      () =>
        selectedServices.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.price ||
                0
            ),
          0
        ),
      [
        selectedServices,
      ]
    );

  const professional =
    useMemo(() => {
      return professionals.find(
        (item) =>
          item.id ===
          professionalId
      );
    }, [
      professionals,
      professionalId,
    ]);

  const calendarDays =
    useMemo(() => {
      if (!calendarMonth) {
        return [];
      }

      return buildCalendar(
        calendarMonth
      );
    }, [
      calendarMonth,
    ]);

  function toggleService(
    id: string
  ) {
    setServiceIds(
      (current) =>
        current.includes(
          id
        )
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );

    setTime("");
    setMessage("");
  }

  async function loadCustomer() {
    try {
      setLoadingCustomer(
        true
      );

      const response =
        await fetch(
          "/api/customer/me",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (
        response.status ===
          401 ||
        response.status ===
          403
      ) {
        window.location.href =
          `/${business.slug}/entrar`;

        return;
      }

      if (
        !response.ok ||
        !data.customer
      ) {
        setMessage(
          data.message ||
            "Não foi possível carregar sua conta."
        );

        return;
      }

      setCustomer({
        id:
          String(
            data.customer.id ||
              ""
          ),

        name:
          String(
            data.customer.name ||
              ""
          ),

        phone:
          String(
            data.customer.phone ||
              ""
          ),

        email:
          String(
            data.customer.email ||
              ""
          ),

        photoUrl:
          String(
            data.customer.photoUrl ||
              ""
          ),
      });
    } catch (error) {
      console.error(
        "LOAD CUSTOMER ERROR:",
        error
      );

      setMessage(
        "Não foi possível carregar sua conta."
      );
    } finally {
      setLoadingCustomer(
        false
      );
    }
  }

  async function loadSlots() {
    try {
      setLoadingSlots(
        true
      );

      setMessage("");
      setSlots([]);
      setTime("");

      const query =
        new URLSearchParams({
          serviceIds:
            serviceIds.join(
              ","
            ),

          professionalId,

          date,
        });

      const response =
        await fetch(
          `/api/public/${business.slug}/availability?${query.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao buscar horários."
        );

        return;
      }

      const receivedSlots =
        Array.isArray(
          data.slots
        )
          ? data.slots
          : [];

      setSlots(
        receivedSlots
      );

      if (
        receivedSlots.length ===
        0
      ) {
        setMessage(
          data.message ||
            "Nenhum horário disponível nesta data."
        );
      }
    } catch (error) {
      console.error(
        "LOAD SLOTS ERROR:",
        error
      );

      setMessage(
        "Não foi possível carregar os horários."
      );
    } finally {
      setLoadingSlots(
        false
      );
    }
  }

  async function submit() {
    if (!customer) {
      setMessage(
        "Sua conta não foi carregada."
      );
      return;
    }

    if (
      serviceIds.length ===
      0
    ) {
      setMessage(
        "Escolha pelo menos um serviço."
      );
      return;
    }

    if (!professionalId) {
      setMessage(
        "Escolha um profissional."
      );
      return;
    }

    if (!date) {
      setMessage(
        "Escolha uma data."
      );
      return;
    }

    if (!time) {
      setMessage(
        "Escolha um horário."
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response =
        await fetch(
          `/api/public/${business.slug}/appointments`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                serviceIds,

                serviceId:
                  serviceIds[0],

                professionalId,

                date,

                time,

                clientName:
                  customer.name,

                clientPhone:
                  customer.phone,

                clientEmail:
                  customer.email,

                notes,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Não foi possível realizar o agendamento."
        );

        return;
      }

      setDone(true);
    } catch (error) {
      console.error(
        "SUBMIT APPOINTMENT ERROR:",
        error
      );

      setMessage(
        "Erro ao realizar agendamento."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function selectDay(
    item: CalendarDay
  ) {
    if (item.past) {
      return;
    }

    setDate(
      item.date
    );

    setTime("");
    setMessage("");
  }

  function previousMonth() {
    setCalendarMonth(
      changeMonth(
        calendarMonth,
        -1
      )
    );
  }

  function nextMonth() {
    setCalendarMonth(
      changeMonth(
        calendarMonth,
        1
      )
    );
  }

  if (done) {
    return (
      <main
        className="booking-premium flex min-h-screen items-center justify-center px-4 py-10"
        style={
          themeStyle
        }
      >
        <ThemeCss />

        <div
          className="w-full max-w-xl rounded-[30px] border p-6 text-center shadow-2xl sm:p-9"
          style={{
            borderColor:
              theme.border,

            backgroundColor:
              theme.surface,
          }}
        >
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black"
            style={{
              backgroundColor:
                theme.primary,

              color:
                theme.onPrimary,
            }}
          >
            ✓
          </div>

          <p
            className="mt-5 text-[10px] font-black uppercase tracking-[0.20em]"
            style={{
              color:
                theme.primary,
            }}
          >
            Agendamento realizado
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Horário reservado
            {customer?.name
              ? `, ${customer.name.split(
                  " "
                )[0]}`
              : ""}
            .
          </h1>

          <p
            className="mt-3 text-sm leading-6"
            style={{
              color:
                theme.muted,
            }}
          >
            Seu agendamento foi enviado para{" "}
            {business.name}.
          </p>

          <div
            className="mt-7 rounded-2xl border p-5 text-left"
            style={{
              borderColor:
                theme.border,

              backgroundColor:
                theme.surface2,
            }}
          >
            <SummaryRow
              label="Serviços"
              value={
                selectedServices
                  .map(
                    (item) =>
                      item.name
                  )
                  .join(" + ")
              }
            />

            <SummaryRow
              label="Profissional"
              value={
                professional?.name ||
                "-"
              }
            />

            <SummaryRow
              label="Data"
              value={
                formatDate(
                  date
                )
              }
            />

            <SummaryRow
              label="Horário"
              value={
                time
              }
            />

            <SummaryRow
              label="Duração"
              value={`${totalDuration} min`}
            />

            <SummaryRow
              label="Valor"
              value={
                money(
                  totalPrice
                )
              }
            />
          </div>

          <a
            href={`/${business.slug}`}
            className="mt-7 flex min-h-[52px] w-full items-center justify-center rounded-2xl font-black transition hover:-translate-y-0.5"
            style={{
              backgroundColor:
                theme.primary,

              color:
                theme.onPrimary,
            }}
          >
            Voltar para {business.name}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      className="booking-premium min-h-screen"
      style={
        themeStyle
      }
    >
      <ThemeCss />

      {/* HEADER */}

      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor:
            theme.border,

          backgroundColor:
            theme.header,
        }}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href={`/${business.slug}`}
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
                className="h-10 w-10 rounded-xl border object-cover"
                style={{
                  borderColor:
                    theme.border,
                }}
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-black"
                style={{
                  backgroundColor:
                    theme.primarySoft,

                  color:
                    theme.primary,
                }}
              >
                {business.name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="max-w-[190px] truncate text-sm font-black sm:max-w-[320px] sm:text-base">
                {business.name}
              </p>

              <p
                className="hidden text-[10px] font-bold uppercase tracking-[0.17em] sm:block"
                style={{
                  color:
                    theme.muted,
                }}
              >
                Agendamento online
              </p>
            </div>
          </a>

          <a
            href={`/${business.slug}`}
            className="rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5"
            style={{
              borderColor:
                theme.border,

              color:
                theme.text,
            }}
          >
            ← Voltar
          </a>
        </div>
      </header>

      {/* INTRO */}

      <section className="border-b"
        style={{
          borderColor:
            theme.border,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="max-w-2xl">
            <p
              className="text-[10px] font-black uppercase tracking-[0.20em]"
              style={{
                color:
                  theme.primary,
              }}
            >
              Reserve seu atendimento
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              Escolha seu melhor horário.
            </h1>

            <p
              className="mt-4 max-w-xl text-sm leading-6 sm:text-base"
              style={{
                color:
                  theme.muted,
              }}
            >
              Selecione os serviços, profissional, dia e horário. Você pode combinar vários serviços em um único agendamento.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-4 gap-2 sm:max-w-2xl">
            <ProgressStep
              number="1"
              label="Serviços"
              active={
                serviceIds.length >
                0
              }
              theme={
                theme
              }
            />

            <ProgressStep
              number="2"
              label="Profissional"
              active={
                Boolean(
                  professionalId
                )
              }
              theme={
                theme
              }
            />

            <ProgressStep
              number="3"
              label="Data"
              active={
                Boolean(
                  date
                )
              }
              theme={
                theme
              }
            />

            <ProgressStep
              number="4"
              label="Horário"
              active={
                Boolean(
                  time
                )
              }
              theme={
                theme
              }
            />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">

        {/* CONTEÚDO */}

        <div className="space-y-8">

          {/* SERVIÇOS */}

          <BookingSection
            number="1"
            title="Escolha os serviços"
            description="Selecione um ou mais serviços."
            theme={
              theme
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map(
                (item) => {
                  const selected =
                    serviceIds.includes(
                      item.id
                    );

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        toggleService(
                          item.id
                        )
                      }
                      className="group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5"
                      style={{
                        borderColor:
                          selected
                            ? theme.primary
                            : theme.border,

                        backgroundColor:
                          selected
                            ? theme.primarySoft
                            : theme.surface,
                      }}
                    >
                      <div className="flex gap-4 p-4">
                        {item.photoUrl ? (
                          <img
                            src={
                              item.photoUrl
                            }
                            alt={
                              item.name
                            }
                            className="h-20 w-20 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-xl font-black"
                            style={{
                              backgroundColor:
                                theme.surface2,

                              color:
                                theme.primary,
                            }}
                          >
                            {item.name
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-black">
                              {item.name}
                            </h3>

                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black"
                              style={{
                                borderColor:
                                  selected
                                    ? theme.primary
                                    : theme.border,

                                backgroundColor:
                                  selected
                                    ? theme.primary
                                    : "transparent",

                                color:
                                  selected
                                    ? theme.onPrimary
                                    : theme.muted,
                              }}
                            >
                              {selected
                                ? "✓"
                                : ""}
                            </span>
                          </div>

                          {item.description ? (
                            <p
                              className="mt-1 line-clamp-2 text-xs leading-5"
                              style={{
                                color:
                                  theme.muted,
                              }}
                            >
                              {item.description}
                            </p>
                          ) : null}

                          <div className="mt-3 flex items-end justify-between gap-3">
                            <span
                              className="text-xs"
                              style={{
                                color:
                                  theme.muted,
                              }}
                            >
                              {item.duration} min
                            </span>

                            <strong
                              style={{
                                color:
                                  theme.primary,
                              }}
                            >
                              {money(
                                item.price
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {selectedServices.length >
            0 ? (
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
                style={{
                  borderColor:
                    theme.border,

                  backgroundColor:
                    theme.surface2,
                }}
              >
                <div>
                  <p className="text-sm font-black">
                    {selectedServices.length}{" "}
                    {selectedServices.length ===
                    1
                      ? "serviço selecionado"
                      : "serviços selecionados"}
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{
                      color:
                        theme.muted,
                    }}
                  >
                    Duração total: {totalDuration} min
                  </p>
                </div>

                <strong
                  className="text-lg"
                  style={{
                    color:
                      theme.primary,
                  }}
                >
                  {money(
                    totalPrice
                  )}
                </strong>
              </div>
            ) : null}
          </BookingSection>

          {/* PROFISSIONAIS */}

          <BookingSection
            number="2"
            title="Escolha o profissional"
            description="Quem você prefere para realizar o atendimento?"
            theme={
              theme
            }
          >
            {serviceIds.length ===
            0 ? (
              <EmptyState
                text="Escolha pelo menos um serviço primeiro."
                theme={
                  theme
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {professionals.map(
                  (item) => {
                    const selected =
                      professionalId ===
                      item.id;

                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() => {
                          setProfessionalId(
                            item.id
                          );

                          setTime(
                            ""
                          );

                          setMessage(
                            ""
                          );
                        }}
                        className="relative rounded-2xl border p-4 text-center transition hover:-translate-y-0.5"
                        style={{
                          borderColor:
                            selected
                              ? theme.primary
                              : theme.border,

                          backgroundColor:
                            selected
                              ? theme.primarySoft
                              : theme.surface,
                        }}
                      >
                        {selected ? (
                          <span
                            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black"
                            style={{
                              backgroundColor:
                                theme.primary,

                              color:
                                theme.onPrimary,
                            }}
                          >
                            ✓
                          </span>
                        ) : null}

                        {item.photoUrl ? (
                          <img
                            src={
                              item.photoUrl
                            }
                            alt={
                              item.name
                            }
                            className="mx-auto h-20 w-20 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-xl font-black"
                            style={{
                              backgroundColor:
                                theme.surface2,

                              color:
                                theme.primary,
                            }}
                          >
                            {item.name
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>
                        )}

                        <h3 className="mt-3 font-black">
                          {item.name}
                        </h3>

                        <p
                          className="mt-1 text-xs"
                          style={{
                            color:
                              theme.muted,
                          }}
                        >
                          {item.role ||
                            "Profissional"}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </BookingSection>

          {/* DATA */}

          <BookingSection
            number="3"
            title="Escolha o dia"
            description="Selecione a melhor data para você."
            theme={
              theme
            }
          >
            {!professionalId ? (
              <EmptyState
                text="Escolha um profissional primeiro."
                theme={
                  theme
                }
              />
            ) : (
              <div
                className="rounded-2xl border p-4 sm:p-5"
                style={{
                  borderColor:
                    theme.border,

                  backgroundColor:
                    theme.surface,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={
                      previousMonth
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      borderColor:
                        theme.border,
                    }}
                  >
                    ←
                  </button>

                  <h3 className="font-black capitalize">
                    {formatMonth(
                      calendarMonth
                    )}
                  </h3>

                  <button
                    type="button"
                    onClick={
                      nextMonth
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      borderColor:
                        theme.border,
                    }}
                  >
                    →
                  </button>
                </div>

                <div
                  className="mt-5 grid grid-cols-7 text-center text-[10px] font-black uppercase"
                  style={{
                    color:
                      theme.muted,
                  }}
                >
                  <span>Dom</span>
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sáb</span>
                </div>

                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {calendarDays.map(
                    (item) => {
                      const selected =
                        date ===
                        item.date;

                      return (
                        <button
                          key={
                            item.date
                          }
                          type="button"
                          disabled={
                            item.past
                          }
                          onClick={() =>
                            selectDay(
                              item
                            )
                          }
                          className="relative aspect-square rounded-xl border text-xs font-bold transition sm:text-sm"
                          style={{
                            borderColor:
                              selected
                                ? theme.primary
                                : item.past
                                  ? "transparent"
                                  : theme.border,

                            backgroundColor:
                              selected
                                ? theme.primary
                                : item.currentMonth
                                  ? theme.surface2
                                  : "transparent",

                            color:
                              selected
                                ? theme.onPrimary
                                : item.past
                                  ? theme.disabled
                                  : item.currentMonth
                                    ? theme.text
                                    : theme.muted,
                          }}
                        >
                          {item.day}

                          {item.today &&
                          !selected ? (
                            <span
                              className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                              style={{
                                backgroundColor:
                                  theme.primary,
                              }}
                            />
                          ) : null}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </BookingSection>

          {/* HORÁRIO */}

          <BookingSection
            number="4"
            title="Escolha o horário"
            description={
              totalDuration > 0
                ? `O atendimento ocupará aproximadamente ${totalDuration} minutos.`
                : "Selecione um horário disponível."
            }
            theme={
              theme
            }
          >
            {!date ? (
              <EmptyState
                text="Escolha uma data primeiro."
                theme={
                  theme
                }
              />
            ) : loadingSlots ? (
              <EmptyState
                text="Buscando horários disponíveis..."
                theme={
                  theme
                }
              />
            ) : slots.length ===
              0 ? (
              <EmptyState
                text={
                  message ||
                  "Nenhum horário disponível nesta data."
                }
                theme={
                  theme
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                {slots.map(
                  (slot) => {
                    const selected =
                      time ===
                      slot.time;

                    return (
                      <button
                        key={`${slot.time}-${slot.endTime}`}
                        type="button"
                        onClick={() => {
                          setTime(
                            slot.time
                          );

                          setMessage(
                            ""
                          );
                        }}
                        className="rounded-xl border px-3 py-3 text-sm font-black transition hover:-translate-y-0.5"
                        style={{
                          borderColor:
                            selected
                              ? theme.primary
                              : theme.border,

                          backgroundColor:
                            selected
                              ? theme.primary
                              : theme.surface,

                          color:
                            selected
                              ? theme.onPrimary
                              : theme.text,
                        }}
                      >
                        {slot.time}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </BookingSection>

          {/* CLIENTE */}

          <BookingSection
            number="5"
            title="Seus dados"
            description="Confira os dados da conta usada para o agendamento."
            theme={
              theme
            }
          >
            {loadingCustomer ? (
              <EmptyState
                text="Carregando seus dados..."
                theme={
                  theme
                }
              />
            ) : customer ? (
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor:
                    theme.border,

                  backgroundColor:
                    theme.surface,
                }}
              >
                <div className="flex items-center gap-4">
                  {customer.photoUrl ? (
                    <img
                      src={
                        customer.photoUrl
                      }
                      alt={
                        customer.name
                      }
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-black"
                      style={{
                        backgroundColor:
                          theme.primarySoft,

                        color:
                          theme.primary,
                      }}
                    >
                      {customer.name
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="font-black">
                      {customer.name}
                    </h3>

                    <p
                      className="mt-1 text-sm"
                      style={{
                        color:
                          theme.muted,
                      }}
                    >
                      {customer.phone}
                    </p>

                    {customer.email ? (
                      <p
                        className="text-sm"
                        style={{
                          color:
                            theme.muted,
                        }}
                      >
                        {customer.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  className="mt-5 border-t pt-5"
                  style={{
                    borderColor:
                      theme.border,
                  }}
                >
                  <label className="block">
                    <span
                      className="mb-2 block text-sm font-bold"
                      style={{
                        color:
                          theme.muted,
                      }}
                    >
                      Observação opcional
                    </span>

                    <textarea
                      value={
                        notes
                      }
                      onChange={(
                        event
                      ) =>
                        setNotes(
                          event.target.value
                        )
                      }
                      rows={3}
                      placeholder="Ex.: preferência, detalhe do atendimento..."
                      className="w-full resize-none rounded-xl border px-4 py-3.5 text-sm outline-none"
                      style={{
                        borderColor:
                          theme.border,

                        backgroundColor:
                          theme.surface2,

                        color:
                          theme.text,
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <EmptyState
                text="Não foi possível carregar sua conta."
                theme={
                  theme
                }
              />
            )}
          </BookingSection>

          {/* MOBILE RESUMO */}

          <div className="lg:hidden">
            <BookingSummary
              customer={
                customer
              }
              services={
                selectedServices
              }
              professional={
                professional
              }
              date={
                date
              }
              time={
                time
              }
              totalDuration={
                totalDuration
              }
              totalPrice={
                totalPrice
              }
              message={
                message
              }
              submitting={
                submitting
              }
              disabled={
                submitting ||
                loadingCustomer ||
                !customer ||
                serviceIds.length ===
                  0 ||
                !professionalId ||
                !date ||
                !time
              }
              submit={
                submit
              }
              theme={
                theme
              }
            />
          </div>
        </div>

        {/* DESKTOP RESUMO */}

        <aside className="hidden lg:sticky lg:top-[96px] lg:block">
          <BookingSummary
            customer={
              customer
            }
            services={
              selectedServices
            }
            professional={
              professional
            }
            date={
              date
            }
            time={
              time
            }
            totalDuration={
              totalDuration
            }
            totalPrice={
              totalPrice
            }
            message={
              message
            }
            submitting={
              submitting
            }
            disabled={
              submitting ||
              loadingCustomer ||
              !customer ||
              serviceIds.length ===
                0 ||
              !professionalId ||
              !date ||
              !time
            }
            submit={
              submit
            }
            theme={
              theme
            }
          />
        </aside>
      </div>
    </main>
  );
}

/*
=========================================================
UI
=========================================================
*/

function ThemeCss() {
  return (
    <style>{`
      .booking-premium {
        background:
          radial-gradient(
            circle at 85% 0%,
            var(--booking-primary-soft),
            transparent 28rem
          ),
          var(--booking-background);

        color:
          var(--booking-text);
      }

      .booking-premium ::selection {
        background:
          var(--booking-primary);

        color:
          var(--booking-on-primary);
      }

      .booking-premium input::placeholder,
      .booking-premium textarea::placeholder {
        color:
          var(--booking-muted);
      }

      .booking-premium button:disabled {
        cursor:
          not-allowed;

        opacity:
          .42;
      }
    `}</style>
  );
}

function BookingSection({
  number,
  title,
  description,
  children,
  theme,
}: {
  number: string;
  title: string;
  description: string;
  children:
    React.ReactNode;
  theme: Theme;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
          style={{
            backgroundColor:
              theme.primarySoft,

            color:
              theme.primary,
          }}
        >
          {number}
        </span>

        <div>
          <h2 className="text-lg font-black sm:text-xl">
            {title}
          </h2>

          <p
            className="mt-1 text-sm"
            style={{
              color:
                theme.muted,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function ProgressStep({
  number,
  label,
  active,
  theme,
}: {
  number: string;
  label: string;
  active: boolean;
  theme: Theme;
}) {
  return (
    <div
      className="rounded-xl border p-2.5 text-center"
      style={{
        borderColor:
          active
            ? theme.primary
            : theme.border,

        backgroundColor:
          active
            ? theme.primarySoft
            : theme.surface,
      }}
    >
      <p
        className="text-[10px] font-black"
        style={{
          color:
            active
              ? theme.primary
              : theme.muted,
        }}
      >
        {number}
      </p>

      <p className="mt-0.5 truncate text-[10px] font-bold sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function EmptyState({
  text,
  theme,
}: {
  text: string;
  theme: Theme;
}) {
  return (
    <div
      className="rounded-2xl border border-dashed p-7 text-center text-sm"
      style={{
        borderColor:
          theme.border,

        backgroundColor:
          theme.surface,

        color:
          theme.muted,
      }}
    >
      {text}
    </div>
  );
}

function BookingSummary({
  customer,
  services,
  professional,
  date,
  time,
  totalDuration,
  totalPrice,
  message,
  submitting,
  disabled,
  submit,
  theme,
}: {
  customer:
    Customer | null;
  services:
    Service[];
  professional:
    Professional | undefined;
  date: string;
  time: string;
  totalDuration: number;
  totalPrice: number;
  message: string;
  submitting: boolean;
  disabled: boolean;
  submit: () => void;
  theme: Theme;
}) {
  return (
    <div
      className="rounded-[26px] border p-5 shadow-xl"
      style={{
        borderColor:
          theme.border,

        backgroundColor:
          theme.surface,
      }}
    >
      <p
        className="text-[10px] font-black uppercase tracking-[0.18em]"
        style={{
          color:
            theme.primary,
        }}
      >
        Seu agendamento
      </p>

      <h2 className="mt-1 text-xl font-black">
        Resumo
      </h2>

      <div
        className="mt-5 rounded-2xl border p-4"
        style={{
          borderColor:
            theme.border,

          backgroundColor:
            theme.surface2,
        }}
      >
        <SummaryRow
          label="Cliente"
          value={
            customer?.name ||
            "-"
          }
        />

        <SummaryRow
          label="Serviços"
          value={
            services.length
              ? services
                  .map(
                    (item) =>
                      item.name
                  )
                  .join(" + ")
              : "-"
          }
        />

        <SummaryRow
          label="Profissional"
          value={
            professional?.name ||
            "-"
          }
        />

        <SummaryRow
          label="Data"
          value={
            date
              ? formatDate(
                  date
                )
              : "-"
          }
        />

        <SummaryRow
          label="Horário"
          value={
            time ||
            "-"
          }
        />

        <SummaryRow
          label="Duração"
          value={
            totalDuration
              ? `${totalDuration} min`
              : "-"
          }
        />

        <SummaryRow
          label="Valor"
          value={
            services.length
              ? money(
                  totalPrice
                )
              : "-"
          }
        />
      </div>

      {message ? (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-3 text-sm text-red-300">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={
          submit
        }
        disabled={
          disabled
        }
        className="mt-5 min-h-[52px] w-full rounded-2xl px-5 font-black transition hover:-translate-y-0.5 disabled:hover:translate-y-0"
        style={{
          backgroundColor:
            theme.primary,

          color:
            theme.onPrimary,
        }}
      >
        {submitting
          ? "Confirmando..."
          : "Confirmar agendamento"}
      </button>

      <p
        className="mt-3 text-center text-[11px] leading-5"
        style={{
          color:
            theme.muted,
        }}
      >
        Após confirmar, esse período ficará reservado para o seu atendimento.
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-2.5 first:pt-0 last:border-0 last:pb-0">
      <span className="text-xs opacity-50">
        {label}
      </span>

      <strong className="max-w-[65%] text-right text-xs">
        {value}
      </strong>
    </div>
  );
}

/*
=========================================================
TEMA
=========================================================
*/

type RGB = {
  r: number;
  g: number;
  b: number;
};

type Theme = {
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  border: string;
  primarySoft: string;
  header: string;
  disabled: string;
};

function createTheme(
  business: Business
): Theme {
  const primary =
    normalizeHex(
      business.primaryColor,
      "#10b981"
    );

  const background =
    normalizeHex(
      business.backgroundColor,
      "#071018"
    );

  const secondary =
    normalizeHex(
      business.secondaryColor,
      "#0d1822"
    );

  let text =
    normalizeHex(
      business.textColor,
      bestContrastColor(
        background
      )
    );

  if (
    contrastRatio(
      text,
      background
    ) < 4.2
  ) {
    text =
      bestContrastColor(
        background
      );
  }

  const dark =
    luminance(
      background
    ) < 0.48;

  const surface =
    mixHex(
      background,
      secondary,
      0.70
    );

  const surface2 =
    mixHex(
      surface,
      dark
        ? "#ffffff"
        : "#000000",
      dark
        ? 0.045
        : 0.025
    );

  const textRgb =
    hexToRgb(
      text
    );

  return {
    primary,

    onPrimary:
      bestContrastColor(
        primary
      ),

    background,

    surface,

    surface2,

    text,

    muted:
      rgba(
        textRgb,
        0.55
      ),

    border:
      rgba(
        textRgb,
        dark
          ? 0.10
          : 0.14
      ),

    primarySoft:
      rgba(
        hexToRgb(
          primary
        ),
        dark
          ? 0.13
          : 0.10
      ),

    header:
      rgba(
        hexToRgb(
          surface
        ),
        0.94
      ),

    disabled:
      rgba(
        textRgb,
        0.20
      ),
  };
}

function normalizeHex(
  value: string,
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

  return fallback;
}

function hexToRgb(
  hex: string
): RGB {
  const value =
    normalizeHex(
      hex,
      "#000000"
    ).slice(1);

  return {
    r:
      parseInt(
        value.slice(
          0,
          2
        ),
        16
      ),

    g:
      parseInt(
        value.slice(
          2,
          4
        ),
        16
      ),

    b:
      parseInt(
        value.slice(
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

  return rgbToHex({
    r:
      a.r +
      (
        b.r -
        a.r
      ) *
        amount,

    g:
      a.g +
      (
        b.g -
        a.g
      ) *
        amount,

    b:
      a.b +
      (
        b.b -
        a.b
      ) *
        amount,
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
DATA / FORMATOS
=========================================================
*/

function buildCalendar(
  monthValue: string
): CalendarDay[] {
  const [
    year,
    month,
  ] =
    monthValue
      .split("-")
      .map(Number);

  if (
    !year ||
    !month
  ) {
    return [];
  }

  const firstDay =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12
      )
    );

  const firstWeekDay =
    firstDay.getUTCDay();

  const calendarStart =
    new Date(
      firstDay
    );

  calendarStart.setUTCDate(
    calendarStart.getUTCDate() -
      firstWeekDay
  );

  const today =
    todaySaoPaulo();

  const result:
    CalendarDay[] =
    [];

  for (
    let index = 0;
    index < 42;
    index++
  ) {
    const current =
      new Date(
        calendarStart
      );

    current.setUTCDate(
      calendarStart.getUTCDate() +
        index
    );

    const dateString =
      `${current.getUTCFullYear()}-${String(
        current.getUTCMonth() +
          1
      ).padStart(
        2,
        "0"
      )}-${String(
        current.getUTCDate()
      ).padStart(
        2,
        "0"
      )}`;

    result.push({
      date:
        dateString,

      day:
        current.getUTCDate(),

      currentMonth:
        current.getUTCMonth() ===
        month - 1,

      past:
        dateString <
        today,

      today:
        dateString ===
        today,
    });
  }

  return result;
}

function changeMonth(
  value: string,
  amount: number
) {
  if (!value) {
    return value;
  }

  const [
    year,
    month,
  ] =
    value
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12
      )
    );

  date.setUTCMonth(
    date.getUTCMonth() +
      amount
  );

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() +
      1
  ).padStart(
    2,
    "0"
  )}`;
}

function formatMonth(
  value: string
) {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
  ] =
    value
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12
      )
    );

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month:
        "long",

      year:
        "numeric",

      timeZone:
        "UTC",
    }
  ).format(
    date
  );
}

function todaySaoPaulo() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function money(
  value: number
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
    value ||
      0
  );
}

function formatDate(
  value: string
) {
  if (!value) {
    return "-";
  }

  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-"
    );

  return `${day}/${month}/${year}`;
}

async function readJsonResponse(
  response: Response
): Promise<any> {
  const text =
    await response.text();

  if (!text.trim()) {
    throw new Error(
      `A API respondeu sem conteúdo. Status ${response.status}.`
    );
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    throw new Error(
      `A API não retornou JSON válido. Status ${response.status}.`
    );
  }
}
