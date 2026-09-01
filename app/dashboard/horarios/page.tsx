"use client";

import { useEffect, useMemo, useState } from "react";

type Professional = {
  _id: string;
  name: string;
  photoUrl?: string;
  active?: boolean;
};

type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
};

type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

type Block = {
  _id?: string;
  date: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  reason?: string;
};

const dayLabels: {
  key: keyof WeeklySchedule;
  label: string;
}[] = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

function createDefaultDay(
  enabled = true
): DaySchedule {
  return {
    enabled,
    start: "09:00",
    end: "18:00",
    breakEnabled: true,
    breakStart: "12:00",
    breakEnd: "13:00",
  };
}

function createDefaultSchedule(): WeeklySchedule {
  return {
    monday: createDefaultDay(),
    tuesday: createDefaultDay(),
    wednesday: createDefaultDay(),
    thursday: createDefaultDay(),
    friday: createDefaultDay(),
    saturday: {
      ...createDefaultDay(),
      end: "14:00",
      breakEnabled: false,
    },
    sunday: createDefaultDay(false),
  };
}

export default function HorariosPage() {
  const [professionals, setProfessionals] = useState<
    Professional[]
  >([]);

  const [selectedProfessional, setSelectedProfessional] =
    useState("");

  const [schedule, setSchedule] =
    useState<WeeklySchedule>(
      createDefaultSchedule()
    );

  const [blocks, setBlocks] =
    useState<Block[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [newBlock, setNewBlock] =
    useState<Block>({
      date: "",
      start: "09:00",
      end: "10:00",
      allDay: false,
      reason: "",
    });

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (!selectedProfessional) {
      return;
    }

    loadSchedule(
      selectedProfessional
    );
  }, [selectedProfessional]);

  async function loadProfessionals() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "/api/dashboard/professionals",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar profissionais"
        );
        return;
      }

      const list =
        data.professionals || [];

      setProfessionals(list);

      const firstActive =
        list.find(
          (professional: Professional) =>
            professional.active !== false
        ) || list[0];

      if (firstActive) {
        setSelectedProfessional(
          firstActive._id
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao carregar profissionais"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedule(
    professionalId: string
  ) {
    try {
      setLoading(true);
      setMessage("");
      setSuccess("");

      const response = await fetch(
        `/api/dashboard/schedules?professionalId=${professionalId}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar horários"
        );
        return;
      }

      setSchedule(
        data.schedule?.weekly ||
          createDefaultSchedule()
      );

      setBlocks(
        data.schedule?.blocks || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao carregar horários"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSchedule() {
    if (!selectedProfessional) {
      setMessage(
        "Selecione um profissional."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccess("");

      const response = await fetch(
        "/api/dashboard/schedules",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            professionalId:
              selectedProfessional,
            weekly: schedule,
            blocks,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao salvar horários"
        );
        return;
      }

      setSuccess(
        "Horários salvos com sucesso."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao salvar horários"
      );
    } finally {
      setSaving(false);
    }
  }

  function updateDay(
    day: keyof WeeklySchedule,
    field: keyof DaySchedule,
    value: string | boolean
  ) {
    setSchedule(
      (current) => ({
        ...current,

        [day]: {
          ...current[day],
          [field]: value,
        },
      })
    );
  }

  function addBlock() {
    if (!newBlock.date) {
      setMessage(
        "Escolha a data do bloqueio."
      );
      return;
    }

    if (
      !newBlock.allDay &&
      (!newBlock.start ||
        !newBlock.end)
    ) {
      setMessage(
        "Informe o horário inicial e final."
      );
      return;
    }

    setMessage("");
    setSuccess("");

    setBlocks(
      (current) => [
        ...current,
        {
          ...newBlock,
          _id: crypto.randomUUID(),
        },
      ]
    );

    setNewBlock({
      date: "",
      start: "09:00",
      end: "10:00",
      allDay: false,
      reason: "",
    });
  }

  function removeBlock(
    index: number
  ) {
    setBlocks(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  }

  const selected =
    useMemo(
      () =>
        professionals.find(
          (professional) =>
            professional._id ===
            selectedProfessional
        ),
      [
        professionals,
        selectedProfessional,
      ]
    );

  const activeDays =
    useMemo(
      () =>
        Object.values(
          schedule
        ).filter(
          (day) =>
            day.enabled
        ).length,
      [schedule]
    );

  const totalWeeklyHours =
    useMemo(() => {
      return Object.values(
        schedule
      ).reduce(
        (total, day) => {
          if (!day.enabled) {
            return total;
          }

          let minutes =
            differenceInMinutes(
              day.start,
              day.end
            );

          if (
            day.breakEnabled
          ) {
            minutes -=
              differenceInMinutes(
                day.breakStart,
                day.breakEnd
              );
          }

          return (
            total +
            Math.max(
              minutes,
              0
            )
          );
        },
        0
      );
    }, [schedule]);

  return (
    <main className="min-h-screen">
      {/* CABEÇALHO */}
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Horários
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Defina a disponibilidade
              semanal, intervalos e
              bloqueios dos profissionais.
            </p>
          </div>

          <button
            type="button"
            onClick={
              saveSchedule
            }
            disabled={
              saving ||
              !selectedProfessional
            }
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Salvando..."
              : "Salvar horários"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* PROFISSIONAL */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Profissional
              </label>

              <select
                value={
                  selectedProfessional
                }
                onChange={(
                  event
                ) =>
                  setSelectedProfessional(
                    event.target.value
                  )
                }
                disabled={
                  loading ||
                  professionals.length ===
                    0
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                {professionals.length ===
                0 ? (
                  <option value="">
                    Nenhum profissional
                  </option>
                ) : (
                  professionals.map(
                    (professional) => (
                      <option
                        key={
                          professional._id
                        }
                        value={
                          professional._id
                        }
                      >
                        {
                          professional.name
                        }
                      </option>
                    )
                  )
                )}
              </select>
            </div>

            {selected ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
                {selected.photoUrl ? (
                  <img
                    src={
                      selected.photoUrl
                    }
                    alt={
                      selected.name
                    }
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-400">
                    {selected.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-sm font-bold">
                    {selected.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Configuração individual
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* MÉTRICAS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Dias ativos"
            value={`${activeDays}/7`}
            detail="Dias com atendimento"
          />

          <StatCard
            label="Carga semanal"
            value={formatMinutes(
              totalWeeklyHours
            )}
            detail="Descontando intervalos"
          />

          <StatCard
            label="Bloqueios"
            value={blocks.length}
            detail="Datas e horários indisponíveis"
          />
        </div>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        {/* SEMANA */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] sm:mt-6">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <h2 className="font-bold">
              Semana de trabalho
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Configure os horários de
              atendimento de cada dia.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-zinc-500">
              Carregando horários...
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {dayLabels.map(
                ({ key, label }) => {
                  const day =
                    schedule[key];

                  return (
                    <div
                      key={key}
                      className="p-5"
                    >
                      <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
                        {/* DIA */}
                        <div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateDay(
                                  key,
                                  "enabled",
                                  !day.enabled
                                )
                              }
                              className={`relative h-6 w-11 rounded-full transition ${
                                day.enabled
                                  ? "bg-emerald-500"
                                  : "bg-zinc-700"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                  day.enabled
                                    ? "left-6"
                                    : "left-1"
                                }`}
                              />
                            </button>

                            <div>
                              <p className="font-semibold">
                                {label}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                {day.enabled
                                  ? "Atendimento ativo"
                                  : "Folga"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* HORÁRIOS */}
                        {day.enabled ? (
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                Expediente
                              </p>

                              <div className="mt-3 grid grid-cols-2 gap-3">
                                <TimeField
                                  label="Início"
                                  value={
                                    day.start
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateDay(
                                      key,
                                      "start",
                                      value
                                    )
                                  }
                                />

                                <TimeField
                                  label="Fim"
                                  value={
                                    day.end
                                  }
                                  onChange={(
                                    value
                                  ) =>
                                    updateDay(
                                      key,
                                      "end",
                                      value
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    Intervalo
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-600">
                                    Ex.: almoço
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDay(
                                      key,
                                      "breakEnabled",
                                      !day.breakEnabled
                                    )
                                  }
                                  className={`relative h-6 w-11 rounded-full transition ${
                                    day.breakEnabled
                                      ? "bg-emerald-500"
                                      : "bg-zinc-700"
                                  }`}
                                >
                                  <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                      day.breakEnabled
                                        ? "left-6"
                                        : "left-1"
                                    }`}
                                  />
                                </button>
                              </div>

                              {day.breakEnabled ? (
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  <TimeField
                                    label="Início"
                                    value={
                                      day.breakStart
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      updateDay(
                                        key,
                                        "breakStart",
                                        value
                                      )
                                    }
                                  />

                                  <TimeField
                                    label="Fim"
                                    value={
                                      day.breakEnd
                                    }
                                    onChange={(
                                      value
                                    ) =>
                                      updateDay(
                                        key,
                                        "breakEnd",
                                        value
                                      )
                                    }
                                  />
                                </div>
                              ) : (
                                <p className="mt-4 text-sm text-zinc-600">
                                  Sem intervalo nesse dia.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center rounded-xl border border-dashed border-white/10 bg-black/10 px-5 py-4 text-sm text-zinc-500">
                            Este profissional não
                            atende neste dia.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* BLOQUEIOS */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <h2 className="font-bold">
              Bloqueios e folgas extras
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Bloqueie datas específicas,
              horários particulares,
              férias ou compromissos.
            </p>
          </div>

          <div className="p-5">
            <div className="grid gap-4 xl:grid-cols-[180px_140px_140px_160px_1fr_auto] xl:items-end">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Data
                </label>

                <input
                  type="date"
                  value={
                    newBlock.date
                  }
                  onChange={(
                    event
                  ) =>
                    setNewBlock(
                      (current) => ({
                        ...current,
                        date:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <TimeField
                label="Início"
                value={
                  newBlock.start ||
                  ""
                }
                disabled={
                  newBlock.allDay
                }
                onChange={(
                  value
                ) =>
                  setNewBlock(
                    (current) => ({
                      ...current,
                      start: value,
                    })
                  )
                }
              />

              <TimeField
                label="Fim"
                value={
                  newBlock.end ||
                  ""
                }
                disabled={
                  newBlock.allDay
                }
                onChange={(
                  value
                ) =>
                  setNewBlock(
                    (current) => ({
                      ...current,
                      end: value,
                    })
                  )
                }
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tipo
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setNewBlock(
                      (current) => ({
                        ...current,
                        allDay:
                          !current.allDay,
                      })
                    )
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    newBlock.allDay
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 text-zinc-300"
                  }`}
                >
                  Dia inteiro
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Motivo
                </label>

                <input
                  type="text"
                  value={
                    newBlock.reason ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    setNewBlock(
                      (current) => ({
                        ...current,
                        reason:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Ex.: consulta, viagem, férias..."
                  className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={
                  addBlock
                }
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
              >
                Adicionar
              </button>
            </div>

            {/* LISTA DE BLOQUEIOS */}
            <div className="mt-6">
              {blocks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-sm font-semibold">
                    Nenhum bloqueio cadastrado
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    Use os campos acima para
                    bloquear uma data ou
                    horário.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map(
                    (
                      block,
                      index
                    ) => (
                      <div
                        key={
                          block._id ||
                          `${block.date}-${index}`
                        }
                        className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {formatDate(
                                block.date
                              )}
                            </p>

                            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                              {block.allDay
                                ? "Dia inteiro"
                                : `${block.start} - ${block.end}`}
                            </span>
                          </div>

                          {block.reason ? (
                            <p className="mt-2 text-sm text-zinc-500">
                              {
                                block.reason
                              }
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeBlock(
                              index
                            )
                          }
                          className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                        >
                          Remover
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* IMPORTANTE */}
        <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Disponibilidade
          </p>

          <h2 className="mt-2 font-bold">
            Esses horários serão usados no
            agendamento público
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Quando conectarmos essa tela ao
            agendamento público, o cliente só
            verá horários que estejam dentro
            do expediente, fora dos intervalos,
            fora dos bloqueios e que ainda não
            tenham outro agendamento.
          </p>
        </section>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={
              saveSchedule
            }
            disabled={
              saving ||
              !selectedProfessional
            }
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </div>
    </main>
  );
}

function TimeField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-30"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value:
    | string
    | number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight">
        {value}
      </p>

      {detail ? (
        <p className="mt-3 text-xs text-emerald-400">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function differenceInMinutes(
  start: string,
  end: string
) {
  const [
    startHour,
    startMinute,
  ] = start
    .split(":")
    .map(Number);

  const [
    endHour,
    endMinute,
  ] = end
    .split(":")
    .map(Number);

  return (
    endHour * 60 +
    endMinute -
    (startHour * 60 +
      startMinute)
  );
}

function formatMinutes(
  minutes: number
) {
  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;

  if (!remaining) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}min`;
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
  ] = value
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}