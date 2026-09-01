"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Business = {
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
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
  const [serviceId, setServiceId] =
    useState("");

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

  /*
  =====================================================
  INICIALIZAÇÃO
  =====================================================
  */

  useEffect(() => {
    const current =
      todaySaoPaulo();

    setCalendarMonth(
      current.slice(0, 7)
    );

    loadCustomer();
  }, []);

  /*
  =====================================================
  CARREGAR DISPONIBILIDADE
  =====================================================
  */

  useEffect(() => {
    if (
      !serviceId ||
      !professionalId ||
      !date
    ) {
      setSlots([]);
      setTime("");
      return;
    }

    loadSlots();
  }, [
    serviceId,
    professionalId,
    date,
  ]);

  /*
  =====================================================
  DADOS SELECIONADOS
  =====================================================
  */

  const service =
    useMemo(() => {
      return services.find(
        (item) =>
          item.id === serviceId
      );
    }, [
      services,
      serviceId,
    ]);

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

  /*
  =====================================================
  CLIENTE LOGADO
  =====================================================
  */

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
        response.status === 401 ||
        response.status === 403
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

  /*
  =====================================================
  HORÁRIOS DISPONÍVEIS
  =====================================================
  */

  async function loadSlots() {
    try {
      setLoadingSlots(true);
      setMessage("");
      setSlots([]);
    

      const query =
        new URLSearchParams({
          serviceId,
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
      setLoadingSlots(false);
    }
  }

  /*
  =====================================================
  CRIAR AGENDAMENTO
  =====================================================
  */

  async function submit() {
    if (!customer) {
      setMessage(
        "Sua conta não foi carregada."
      );
      return;
    }

    if (!serviceId) {
      setMessage(
        "Escolha um serviço."
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
                serviceId,
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

  /*
  =====================================================
  CALENDÁRIO
  =====================================================
  */

  function selectDay(
    item: CalendarDay
  ) {
    if (item.past) {
      return;
    }

    setDate(item.date);
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

  /*
  =====================================================
  SUCESSO
  =====================================================
  */

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050b10] px-5 py-10 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-500/20 bg-[#0a141d] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl font-black text-zinc-950">
            ✓
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
            Agendamento realizado
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Tudo certo
            {customer?.name
              ? `, ${customer.name.split(" ")[0]}`
              : ""}
            !
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Seu horário foi enviado para{" "}
            {business.name}.
          </p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5 text-left">
            <SummaryRow
              label="Serviço"
              value={
                service?.name ||
                "-"
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
                formatDate(date)
              }
            />

            <SummaryRow
              label="Horário"
              value={time}
            />

            {service ? (
              <SummaryRow
                label="Valor"
                value={money(
                  service.price
                )}
              />
            ) : null}
          </div>

          <a
            href={`/${business.slug}`}
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-6 py-4 font-bold text-zinc-950 transition hover:bg-emerald-400"
          >
            Voltar para {business.name}
          </a>
        </div>
      </main>
    );
  }

  /*
  =====================================================
  TELA
  =====================================================
  */

  return (
    <main className="min-h-screen bg-[#050b10] text-white">
      <div className="border-b border-white/10 bg-[#081119]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            {business.logoUrl ? (
              <img
                src={
                  business.logoUrl
                }
                alt={
                  business.name
                }
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-zinc-950"
                style={{
                  backgroundColor:
                    business.primaryColor ||
                    "#10b981",
                }}
              >
                {business.name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                Agendamento online
              </p>

              <h1 className="truncate text-xl font-bold sm:text-2xl">
                {business.name}
              </h1>
            </div>
          </div>

          {!loadingCustomer &&
          customer ? (
            <div className="hidden text-right sm:block">
              <p className="text-xs text-zinc-500">
                Logado como
              </p>

              <p className="text-sm font-semibold">
                {customer.name}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">
        <a
          href={`/${business.slug}`}
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← Voltar
        </a>

        <div className="mt-7">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Agende seu horário
          </h2>

          <p className="mt-3 text-sm text-zinc-500">
            Escolha o serviço, profissional, dia e horário.
          </p>
        </div>

        {/* 1 SERVIÇO */}

        <section className="mt-10">
          <SectionTitle
            number="1"
            title="Escolha o serviço"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {services.map(
              (item) => {
                const selected =
                  serviceId ===
                  item.id;

                return (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() => {
                      setServiceId(
                        item.id
                      );

                      setTime(
                        ""
                      );

                      setMessage(
                        ""
                      );
                    }}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-500/[0.07]"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold">
                          {
                            item.name
                          }
                        </h3>

                        {item.description ? (
                          <p className="mt-1 text-sm text-zinc-500">
                            {
                              item.description
                            }
                          </p>
                        ) : null}
                      </div>

                      {selected ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-zinc-950">
                          ✓
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        {
                          item.duration
                        }{" "}
                        minutos
                      </span>

                      <strong className="text-emerald-400">
                        {money(
                          item.price
                        )}
                      </strong>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* 2 PROFISSIONAL */}

        <section className="mt-12">
          <SectionTitle
            number="2"
            title="Escolha o profissional"
          />

          {!serviceId ? (
            <EmptyState text="Escolha um serviço primeiro." />
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                      className={`relative rounded-2xl border p-5 text-center transition ${
                        selected
                          ? "border-emerald-500 bg-emerald-500/[0.07]"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20"
                      }`}
                    >
                      {selected ? (
                        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-zinc-950">
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
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-2xl font-bold text-zinc-500">
                          {item.name
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>
                      )}

                      <h3 className="mt-4 font-bold">
                        {
                          item.name
                        }
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        {item.role ||
                          "Profissional"}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* 3 DATA */}

        <section className="mt-12">
          <SectionTitle
            number="3"
            title="Escolha o dia"
          />

          {!professionalId ? (
            <EmptyState text="Escolha um profissional primeiro." />
          ) : (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={
                    previousMonth
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
                >
                  ←
                </button>

                <h3 className="font-bold capitalize">
                  {formatMonth(
                    calendarMonth
                  )}
                </h3>

                <button
                  type="button"
                  onClick={
                    nextMonth
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
                >
                  →
                </button>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-zinc-600 sm:gap-2">
                <span>Dom</span>
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
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
                        className={`relative aspect-square rounded-xl border text-xs font-semibold transition sm:text-sm ${
                          selected
                            ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                            : item.past
                              ? "cursor-not-allowed border-transparent text-zinc-800"
                              : item.currentMonth
                                ? "border-white/10 bg-[#081119] text-zinc-300 hover:border-emerald-500/50"
                                : "border-transparent text-zinc-700"
                        }`}
                      >
                        {
                          item.day
                        }

                        {item.today &&
                        !selected ? (
                          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
                        ) : null}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </section>

        {/* 4 HORÁRIOS */}

        <section className="mt-12">
          <SectionTitle
            number="4"
            title="Escolha o horário"
          />

          {!date ? (
            <EmptyState text="Escolha uma data primeiro." />
          ) : loadingSlots ? (
            <EmptyState text="Buscando horários..." />
          ) : slots.length ===
            0 ? (
            <EmptyState
              text={
                message ||
                "Nenhum horário disponível nesta data."
              }
            />
          ) : (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {slots.map(
                (slot) => (
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
                    className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                      time ===
                      slot.time
                        ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                        : "border-white/10 bg-white/[0.025] text-zinc-300 hover:border-emerald-500/40"
                    }`}
                  >
                    {slot.time}
                  </button>
                )
              )}
            </div>
          )}
        </section>

        {/* 5 CONTA */}

        <section className="mt-12">
          <SectionTitle
            number="5"
            title="Sua conta"
          />

          {loadingCustomer ? (
            <EmptyState text="Carregando seus dados..." />
          ) : customer ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl font-black text-zinc-950">
                    {customer.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <h3 className="font-bold">
                    {
                      customer.name
                    }
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {
                      customer.phone
                    }
                  </p>

                  {customer.email ? (
                    <p className="text-sm text-zinc-500">
                      {
                        customer.email
                      }
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <label className="block">
                  <span className="mb-2 block text-sm text-zinc-400">
                    Observação (opcional)
                  </span>

                  <input
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
                    placeholder="Alguma observação para o profissional?"
                    className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3.5 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            </div>
          ) : (
            <EmptyState text="Não foi possível carregar sua conta." />
          )}
        </section>

        {/* RESUMO */}

        <section className="mt-12 rounded-3xl border border-white/10 bg-[#0a141d] p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Seu agendamento
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Confira os dados
          </h2>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <SummaryRow
              label="Cliente"
              value={
                customer?.name ||
                "-"
              }
            />

            <SummaryRow
              label="Serviço"
              value={
                service?.name ||
                "-"
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
                time || "-"
              }
            />

            {service ? (
              <>
                <SummaryRow
                  label="Duração"
                  value={`${service.duration} min`}
                />

                <SummaryRow
                  label="Valor"
                  value={money(
                    service.price
                  )}
                />
              </>
            ) : null}
          </div>

          {message &&
          slots.length >
            0 ? (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={
              submitting ||
              loadingCustomer ||
              !customer ||
              !serviceId ||
              !professionalId ||
              !date ||
              !time
            }
            className="mt-6 w-full rounded-xl bg-emerald-500 px-6 py-4 font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Confirmando..."
              : "Confirmar agendamento"}
          </button>
        </section>
      </div>
    </main>
  );
}

/*
=========================================================
COMPONENTES
=========================================================
*/

function SectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-zinc-950">
        {number}
      </span>

      <h2 className="text-xl font-bold">
        {title}
      </h2>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center text-sm text-zinc-500">
      {text}
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
    <div className="flex items-start justify-between gap-5 border-b border-white/5 py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <strong className="max-w-[65%] text-right text-sm">
        {value}
      </strong>
    </div>
  );
}

/*
=========================================================
HELPERS
=========================================================
*/

function buildCalendar(
  monthValue: string
): CalendarDay[] {
  const [year, month] =
    monthValue
      .split("-")
      .map(Number);

  if (!year || !month) {
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
    new Date(firstDay);

  calendarStart.setUTCDate(
    calendarStart.getUTCDate() -
      firstWeekDay
  );

  const today =
    todaySaoPaulo();

  const result: CalendarDay[] =
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

  const [year, month] =
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

  const [year, month] =
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
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
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
      style: "currency",
      currency: "BRL",
    }
  ).format(
    value || 0
  );
}

function formatDate(
  value: string
) {
  const [year, month, day] =
    value.split("-");

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