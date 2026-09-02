"use client";

import Link from "next/link";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";

type Appointment = {
  id: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
  notes: string;
  hasActiveMembership: boolean;
  membershipPlanName: string;
  membershipUsageConsumed: boolean;
  isUpcoming: boolean;
};

type Membership = {
  id: string;
  planName: string;
  price: number;
  totalUses: number;
  usedUses: number;
  remainingUses: number;
  validityDays: number;
  startDate: string;
  expiresAt: string;
  active: boolean;
  paymentMethod: string;
  paymentStatus: string;
  displayPaymentStatus: string;
  paymentAmount: number;
  paymentDueDate: string;
  paymentPaidAt: string | null;
  isExpired: boolean;
  isPaymentOverdue: boolean;
};

type Overview = {
  ok: boolean;

  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
    primaryColor: string;
    address: string;
  };

  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    photoUrl: string;
  };

  client: {
    id: string;
    name: string;
    phone: string;
    email: string;
  } | null;

  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  appointmentHistory: Appointment[];

  membership: Membership | null;
  memberships: Membership[];
};

type Tab =
  | "inicio"
  | "agendamentos"
  | "historico"
  | "plano"
  | "perfil";

export default function CustomerAreaClient({
  slug,
}: {
  slug: string;
}) {
  const [
    data,
    setData,
  ] =
    useState<Overview | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "inicio"
    );

  const [
    profileName,
    setProfileName,
  ] = useState("");

  const [
    profilePhone,
    setProfilePhone,
  ] = useState("");

  const [
    profileEmail,
    setProfileEmail,
  ] = useState("");

  const [
    profilePhotoUrl,
    setProfilePhotoUrl,
  ] = useState("");

  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] = useState(false);

  const [
    profileMessage,
    setProfileMessage,
  ] = useState("");

  const [
    profileSuccess,
    setProfileSuccess,
  ] = useState(false);

  const [
    cancellingId,
    setCancellingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    appointmentMessage,
    setAppointmentMessage,
  ] =
    useState("");

  useEffect(() => {
    load();
  }, [slug]);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/customer/${slug}/overview`,
          {
            cache:
              "no-store",
          }
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          body.message ||
            "Erro ao carregar sua conta"
        );
      }

      setData(body);

      setProfileName(
        body.customer?.name ||
          ""
      );

      setProfilePhone(
        body.customer?.phone ||
          ""
      );

      setProfileEmail(
        body.customer?.email ||
          ""
      );

      setProfilePhotoUrl(
        body.customer?.photoUrl ||
          ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar sua conta"
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadProfilePhoto(
    file: File
  ) {
    try {
      setUploadingPhoto(true);
      setProfileMessage("");
      setProfileSuccess(false);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "folder",
        "vellto-agenda/clientes"
      );

      const response =
        await fetch(
          "/api/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          body.message ||
            "Erro ao enviar a foto"
        );
      }

      if (!body.url) {
        throw new Error(
          "Não foi possível obter a imagem enviada"
        );
      }

      setProfilePhotoUrl(
        body.url
      );

      setProfileMessage(
        "Foto enviada. Clique em Salvar alterações para confirmar."
      );

      setProfileSuccess(
        true
      );
    } catch (err) {
      setProfileMessage(
        err instanceof Error
          ? err.message
          : "Erro ao enviar a foto"
      );

      setProfileSuccess(
        false
      );
    } finally {
      setUploadingPhoto(
        false
      );
    }
  }

  async function saveProfile(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setProfileMessage("");
      setProfileSuccess(false);

      const response =
        await fetch(
          "/api/customer/profile",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                profileName,
              phone:
                profilePhone,
              email:
                profileEmail,
              photoUrl:
                profilePhotoUrl,
            }),
          }
        );

      const body =
        await response.json();

      if (!response.ok) {
        throw new Error(
          body.message ||
            "Erro ao atualizar perfil"
        );
      }

      setProfileMessage(
        "Perfil atualizado com sucesso."
      );

      setProfileSuccess(
        true
      );

      setData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          customer: {
            ...current.customer,

            name:
              body.customer
                ?.name ||
              profileName,

            phone:
              body.customer
                ?.phone ||
              profilePhone,

            email:
              body.customer
                ?.email ||
              profileEmail,

            photoUrl:
              body.customer
                ?.photoUrl ||
              profilePhotoUrl,
          },
        };
      });
    } catch (err) {
      setProfileMessage(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar perfil"
      );

      setProfileSuccess(
        false
      );
    } finally {
      setSavingProfile(
        false
      );
    }
  }

  async function cancelAppointment(
    appointment: Appointment
  ) {
    const confirmed =
      window.confirm(
        `Cancelar o agendamento de ${appointment.serviceName} em ${formatDate(
          appointment.date
        )} às ${appointment.time}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(
        appointment.id
      );

      setAppointmentMessage(
        ""
      );

      const response =
        await fetch(
          `/api/customer/${slug}/appointments/${appointment.id}/cancel`,
          {
            method:
              "POST",
          }
        );

      const body =
        await response.json();

      if (
        !response.ok
      ) {
        setAppointmentMessage(
          body.message ||
            "Não foi possível cancelar."
        );

        return;
      }

      setAppointmentMessage(
        "Agendamento cancelado com sucesso."
      );

      await load();
    } catch (error) {
      console.error(
        error
      );

      setAppointmentMessage(
        "Erro ao cancelar agendamento."
      );
    } finally {
      setCancellingId(
        null
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-emerald-400" />

            <p className="text-sm text-zinc-400">
              Carregando sua conta...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-red-500/20 bg-zinc-900 p-8 text-center">
            <div className="mb-4 text-4xl">
              ⚠️
            </div>

            <h1 className="text-xl font-semibold">
              Não foi possível carregar sua conta
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              {error}
            </p>

            <button
              type="button"
              onClick={load}
              className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  const business =
    data.business;

  const customer =
    data.customer;

  const membership =
    data.membership;

  const nextAppointment =
    data
      .upcomingAppointments[0] ||
    null;

  const firstName =
    customer.name
      ?.trim()
      .split(" ")[0] ||
    "Cliente";

  return (
    <main className="min-h-screen bg-zinc-950 pb-28 text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Link
            href={`/${slug}`}
            className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3"
          >
            {business.logoUrl ? (
              <img
                src={
                  business.logoUrl
                }
                alt={
                  business.name
                }
                className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover sm:h-10 sm:w-10"
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-black sm:h-10 sm:w-10"
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
              <p className="max-w-[135px] truncate text-sm font-semibold sm:max-w-[220px] sm:text-base">
                {business.name}
              </p>

              <p className="hidden text-xs text-zinc-500 sm:block">
                Área do cliente
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() =>
                setTab(
                  "perfil"
                )
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-2 sm:px-3"
            >
              <Avatar
                name={
                  customer.name
                }
                photoUrl={
                  customer.photoUrl
                }
                small
              />

              <span className="hidden text-sm md:inline">
                Minha conta
              </span>
            </button>

            <Link
              href={`/${slug}/agendar`}
              className="rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-black sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">+ Agendar</span><span className="hidden sm:inline">+ Agendar horário</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {appointmentMessage ? (
          <div className="mb-5 rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm">
            {appointmentMessage}
          </div>
        ) : null}

        <section className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
          <Avatar
            name={
              customer.name
            }
            photoUrl={
              customer.photoUrl
            }
          />

          <div>
            <p className="text-sm font-medium text-emerald-400">
              Minha conta
            </p>

            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
              Olá, {firstName} 👋
            </h1>

            <p className="mt-1 max-w-md text-xs leading-5 text-zinc-400 sm:text-sm">
              Acompanhe seus agendamentos e seu plano.
            </p>
          </div>
        </section>

        <nav className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-8 sm:px-0">
          <TabButton
            active={
              tab === "inicio"
            }
            onClick={() =>
              setTab(
                "inicio"
              )
            }
          >
            Início
          </TabButton>

          <TabButton
            active={
              tab ===
              "agendamentos"
            }
            onClick={() =>
              setTab(
                "agendamentos"
              )
            }
          >
            Agendamentos
          </TabButton>

          <TabButton
            active={
              tab ===
              "historico"
            }
            onClick={() =>
              setTab(
                "historico"
              )
            }
          >
            Histórico
          </TabButton>

          <TabButton
            active={
              tab ===
              "plano"
            }
            onClick={() =>
              setTab(
                "plano"
              )
            }
          >
            Meu plano
          </TabButton>

          <TabButton
            active={
              tab ===
              "perfil"
            }
            onClick={() =>
              setTab(
                "perfil"
              )
            }
          >
            Perfil
          </TabButton>
        </nav>

        {tab === "inicio" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:rounded-3xl sm:p-6 md:col-span-2 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Próximo agendamento
                </p>

                {nextAppointment ? (
                  <>
                    <h2 className="mt-4 text-xl font-semibold sm:text-2xl">
                      {
                        nextAppointment.serviceName
                      }
                    </h2>

                    <p className="mt-2 text-zinc-400">
                      com{" "}
                      {
                        nextAppointment.professionalName
                      }
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <InfoBox
                        label="Data"
                        value={formatDate(
                          nextAppointment.date
                        )}
                      />

                      <InfoBox
                        label="Horário"
                        value={
                          nextAppointment.time ||
                          "--:--"
                        }
                      />

                      <InfoBox
                        label="Status"
                        value={statusLabel(
                          nextAppointment.status
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-2xl font-semibold">
                      Nenhum horário marcado
                    </h2>

                    <p className="mt-2 text-zinc-400">
                      Seu próximo agendamento aparecerá aqui.
                    </p>
                  </>
                )}

                <Link
                  href={`/${slug}/agendar`}
                  className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black"
                >
                  {nextAppointment
                    ? "Agendar outro horário"
                    : "Agendar agora"}
                </Link>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Meu plano
                </p>

                {membership ? (
                  <>
                    <h2 className="mt-4 text-xl font-semibold">
                      {
                        membership.planName
                      }
                    </h2>

                    <div className="mt-5">
                      <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold">
                          {
                            membership.remainingUses
                          }
                        </span>

                        <span className="pb-1 text-sm text-zinc-500">
                          de{" "}
                          {
                            membership.totalUses
                          }{" "}
                          restantes
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{
                            width: `${remainingPercentage(
                              membership
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <PaymentBadge
                        membership={
                          membership
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-xl font-semibold">
                      Sem plano ativo
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Você ainda não possui uma mensalidade ativa.
                    </p>
                  </>
                )}
              </div>
            </div>

            <section>
              <SectionTitle
                title="Próximos agendamentos"
                description="Seus horários marcados."
              />

              {data
                .upcomingAppointments
                .length === 0 ? (
                <EmptyState
                  icon="✂️"
                  title="Nenhum agendamento futuro"
                  description="Escolha seu próximo horário quando quiser."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.upcomingAppointments
                    .slice(0, 2)
                    .map(
                      (
                        appointment
                      ) => (
                        <AppointmentCard
                          key={
                            appointment.id
                          }
                          appointment={
                            appointment
                          }
                        onCancel={
                          cancelAppointment
                        }
                        cancelling={
                          cancellingId ===
                          appointment.id
                        }
                        rebookHref={`/${slug}/agendar`}
                      />
                      )
                    )}
                </div>
              )}
            </section>
          </div>
        )}

        {tab ===
          "agendamentos" && (
          <section>
            <SectionTitle
              title="Meus agendamentos"
              description="Confira todos os seus próximos horários."
            />

            {data
              .upcomingAppointments
              .length === 0 ? (
              <EmptyState
                icon="📅"
                title="Nenhum agendamento futuro"
                description="Você ainda não possui horários marcados."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.upcomingAppointments.map(
                  (
                    appointment
                  ) => (
                    <AppointmentCard
                      key={
                        appointment.id
                      }
                      appointment={
                        appointment
                      }
                    onCancel={
                          cancelAppointment
                        }
                        cancelling={
                          cancellingId ===
                          appointment.id
                        }
                        rebookHref={`/${slug}/agendar`}
                      />
                  )
                )}
              </div>
            )}
          </section>
        )}

        {tab ===
          "historico" && (
          <section>
            <SectionTitle
              title="Histórico"
              description="Veja seus agendamentos anteriores."
            />

            {data
              .appointmentHistory
              .length === 0 ? (
              <EmptyState
                icon="🕒"
                title="Seu histórico está vazio"
                description="Seus atendimentos anteriores aparecerão aqui."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.appointmentHistory.map(
                  (
                    appointment
                  ) => (
                    <AppointmentCard
                      key={
                        appointment.id
                      }
                      appointment={
                        appointment
                      }
                    onCancel={
                          cancelAppointment
                        }
                        cancelling={
                          cancellingId ===
                          appointment.id
                        }
                        rebookHref={`/${slug}/agendar`}
                      />
                  )
                )}
              </div>
            )}
          </section>
        )}

        {tab === "plano" && (
          <section>
            <SectionTitle
              title="Meu plano"
              description="Acompanhe sua mensalidade e seus usos."
            />

            {membership ? (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-zinc-900 p-7 lg:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-emerald-400">
                        Plano atual
                      </p>

                      <h2 className="mt-2 text-3xl font-bold">
                        {
                          membership.planName
                        }
                      </h2>
                    </div>

                    <PaymentBadge
                      membership={
                        membership
                      }
                    />
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <StatBox
                      value={String(
                        membership.totalUses
                      )}
                      label="Cortes do plano"
                    />

                    <StatBox
                      value={String(
                        membership.usedUses
                      )}
                      label="Utilizados"
                    />

                    <StatBox
                      value={String(
                        membership.remainingUses
                      )}
                      label="Restantes"
                      highlight
                    />
                  </div>

                  <div className="mt-7">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-400">
                        Utilização
                      </span>

                      <span>
                        {
                          membership.usedUses
                        }
                        /
                        {
                          membership.totalUses
                        }
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{
                          width: `${usedPercentage(
                            membership
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                  <p className="text-sm font-semibold">
                    Mensalidade
                  </p>

                  <div className="mt-5 space-y-4">
                    <DetailRow
                      label="Valor"
                      value={formatMoney(
                        membership.paymentAmount ||
                          membership.price
                      )}
                    />

                    <DetailRow
                      label="Vencimento"
                      value={
                        membership.paymentDueDate
                          ? formatDate(
                              membership.paymentDueDate
                            )
                          : "—"
                      }
                    />

                    <DetailRow
                      label="Validade"
                      value={
                        membership.expiresAt
                          ? formatDate(
                              membership.expiresAt
                            )
                          : "—"
                      }
                    />

                    <DetailRow
                      label="Pagamento"
                      value={paymentMethodLabel(
                        membership.paymentMethod
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon="💳"
                title="Você não possui um plano ativo"
                description="Quando um plano mensal for contratado, ele aparecerá aqui."
              />
            )}
          </section>
        )}

        {tab === "perfil" && (
          <section>
            <SectionTitle
              title="Meu perfil"
              description="Atualize seus dados pessoais."
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    name={
                      profileName
                    }
                    photoUrl={
                      profilePhotoUrl
                    }
                    large
                  />

                  <h3 className="mt-4 text-xl font-semibold">
                    {profileName ||
                      "Seu perfil"}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Sua foto será exibida na sua conta.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setProfilePhotoUrl(
                        ""
                      )
                    }
                    disabled={
                      !profilePhotoUrl
                    }
                    className="mt-4 text-sm text-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Remover foto
                  </button>
                </div>
              </div>

              <form
                onSubmit={
                  saveProfile
                }
                className="rounded-3xl border border-white/10 bg-zinc-900 p-6 lg:col-span-2"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Nome completo"
                    value={
                      profileName
                    }
                    onChange={
                      setProfileName
                    }
                    placeholder="Seu nome"
                  />

                  <Field
                    label="WhatsApp"
                    value={
                      profilePhone
                    }
                    onChange={
                      setProfilePhone
                    }
                    placeholder="(21) 99999-9999"
                    type="tel"
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="E-mail"
                      value={
                        profileEmail
                      }
                      onChange={
                        setProfileEmail
                      }
                      placeholder="seuemail@gmail.com"
                      type="email"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">
                      Foto do perfil
                    </span>

                    <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/50 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Avatar
                          name={
                            profileName
                          }
                          photoUrl={
                            profilePhotoUrl
                          }
                        />

                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            Escolha uma foto
                          </p>

                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            JPG, PNG ou outra imagem de até 10 MB.
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <label
                              className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-700 ${
                                uploadingPhoto
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }`}
                            >
                              {uploadingPhoto
                                ? "Enviando..."
                                : profilePhotoUrl
                                ? "Trocar foto"
                                : "Enviar foto"}

                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={
                                  uploadingPhoto
                                }
                                onChange={async (
                                  event
                                ) => {
                                  const file =
                                    event
                                      .target
                                      .files?.[0];

                                  if (!file) {
                                    return;
                                  }

                                  await uploadProfilePhoto(
                                    file
                                  );

                                  event.target.value =
                                    "";
                                }}
                              />
                            </label>

                            {profilePhotoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setProfilePhotoUrl(
                                    ""
                                  )
                                }
                                disabled={
                                  uploadingPhoto
                                }
                                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {profileMessage && (
                  <div
                    className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                      profileSuccess
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/20 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {
                      profileMessage
                    }
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={
                      savingProfile
                    }
                    className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProfile
                      ? "Salvando..."
                      : "Salvar alterações"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileName(
                        customer.name ||
                          ""
                      );

                      setProfilePhone(
                        customer.phone ||
                          ""
                      );

                      setProfileEmail(
                        customer.email ||
                          ""
                      );

                      setProfilePhotoUrl(
                        customer.photoUrl ||
                          ""
                      );

                      setProfileMessage(
                        ""
                      );
                    }}
                    className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-zinc-300"
                  >
                    Cancelar alterações
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 p-3 backdrop-blur-xl sm:hidden">
        <Link
          href={`/${slug}/agendar`}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-black"
        >
          + Agendar horário
        </Link>
      </div>
    </main>
  );
}

function Avatar({
  name,
  photoUrl,
  small = false,
  large = false,
}: {
  name: string;
  photoUrl: string;
  small?: boolean;
  large?: boolean;
}) {
  const size =
    large
      ? "h-28 w-28 text-3xl"
      : small
      ? "h-8 w-8 text-xs"
      : "h-16 w-16 text-xl";

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${size} rounded-full border border-white/10 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 font-bold text-emerald-300`}
    >
      {getInitials(name)}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50"
      />
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-zinc-900 text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  cancelling = false,
  rebookHref,
}: {
  appointment: Appointment;
  onCancel?: (
    appointment: Appointment
  ) => void;
  cancelling?: boolean;
  rebookHref?: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {
              appointment.serviceName
            }
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            {
              appointment.professionalName
            }
          </p>
        </div>

        <StatusBadge
          status={
            appointment.status
          }
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoBox
          label="Data"
          value={formatDate(
            appointment.date
          )}
        />

        <InfoBox
          label="Horário"
          value={
            appointment.time ||
            "--:--"
          }
        />
      </div>

      {appointment.isUpcoming ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {rebookHref ? (
            <Link
              href={
                rebookHref
              }
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 px-4 text-center text-sm font-semibold transition hover:bg-white/5"
            >
              Agendar outro horário
            </Link>
          ) : null}

          {onCancel ? (
            <button
              type="button"
              disabled={
                cancelling
              }
              onClick={() =>
                onCancel(
                  appointment
                )
              }
              className="min-h-[44px] rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {cancelling
                ? "Cancelando..."
                : "Cancelar horário"}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-black/25 p-3">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function StatBox({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <p
        className={`text-3xl font-bold ${
          highlight
            ? "text-emerald-400"
            : ""
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <p className="mt-1 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/60 p-10 text-center">
      <div className="text-4xl">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status
      .toLowerCase()
      .trim();

  let classes =
    "border-amber-500/20 bg-amber-500/10 text-amber-300";

  if (
    [
      "confirmado",
      "confirmed",
    ].includes(
      normalized
    )
  ) {
    classes =
      "border-blue-500/20 bg-blue-500/10 text-blue-300";
  }

  if (
    [
      "concluido",
      "concluído",
      "completed",
      "finalizado",
    ].includes(
      normalized
    )
  ) {
    classes =
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (
    [
      "cancelado",
      "cancelled",
      "faltou",
    ].includes(
      normalized
    )
  ) {
    classes =
      "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {statusLabel(
        status
      )}
    </span>
  );
}

function PaymentBadge({
  membership,
}: {
  membership: Membership;
}) {
  if (
    membership.displayPaymentStatus ===
    "paid"
  ) {
    return (
      <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        ✓ Mensalidade paga
      </span>
    );
  }

  if (
    membership.displayPaymentStatus ===
    "overdue"
  ) {
    return (
      <span className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
        Mensalidade vencida
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
      Pagamento pendente
    </span>
  );
}

function remainingPercentage(
  membership: Membership
) {
  if (
    membership.totalUses <=
    0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (membership.remainingUses /
        membership.totalUses) *
        100
    )
  );
}

function usedPercentage(
  membership: Membership
) {
  if (
    membership.totalUses <=
    0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (membership.usedUses /
        membership.totalUses) *
        100
    )
  );
}

function getInitials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "C";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0]
      .charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const parts =
    value.split("-");

  if (
    parts.length !== 3
  ) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    Number(value || 0)
  );
}

function statusLabel(
  status: string
) {
  const normalized =
    status
      .toLowerCase()
      .trim();

  const labels: Record<
    string,
    string
  > = {
    pendente:
      "Pendente",
    confirmado:
      "Confirmado",
    confirmed:
      "Confirmado",
    concluido:
      "Concluído",
    "concluído":
      "Concluído",
    completed:
      "Concluído",
    finalizado:
      "Concluído",
    cancelado:
      "Cancelado",
    cancelled:
      "Cancelado",
    faltou:
      "Não compareceu",
  };

  return (
    labels[normalized] ||
    status ||
    "Pendente"
  );
}

function paymentMethodLabel(
  method: string
) {
  const labels: Record<
    string,
    string
  > = {
    pix: "PIX",
    cash: "Dinheiro",
    card: "Cartão",
    later: "A combinar",
  };

  return (
    labels[method] ||
    method ||
    "—"
  );
}
