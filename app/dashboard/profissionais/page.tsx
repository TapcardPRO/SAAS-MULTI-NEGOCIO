"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Professional = {
  _id: string;
  name: string;
  role?: string;
  description?: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  commission?: number;
  allowPanelAccess?: boolean;
  accessEmail?: string;
  hasPanelUser?: boolean;
  active?: boolean;
  order?: number;
};

type EditForm = {
  name: string;
  role: string;
  description: string;
  phone: string;
  email: string;
  photoUrl: string;
  commission: string;
  allowPanelAccess: boolean;
  accessEmail: string;
  password: string;
  active: boolean;
};

const emptyForm: EditForm = {
  name: "",
  role: "",
  description: "",
  phone: "",
  email: "",
  photoUrl: "",
  commission: "0",
  allowPanelAccess: false,
  accessEmail: "",
  password: "",
  active: true,
};

export default function ProfissionaisPage() {
  const [
    professionals,
    setProfessionals,
  ] = useState<Professional[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    editingProfessional,
    setEditingProfessional,
  ] = useState<Professional | null>(
    null
  );

  const [form, setForm] =
    useState<EditForm>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] = useState(false);

  const [
    modalMessage,
    setModalMessage,
  ] = useState("");

  useEffect(() => {
    loadProfessionals();
  }, []);

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

      setProfessionals(
        data.professionals || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao carregar profissionais"
      );
    } finally {
      setLoading(false);
    }
  }

  function openEdit(
    professional: Professional
  ) {
    setEditingProfessional(
      professional
    );

    setModalMessage("");

    setForm({
      name: professional.name || "",
      role: professional.role || "",
      description:
        professional.description || "",
      phone:
        professional.phone || "",
      email:
        professional.email || "",
      photoUrl:
        professional.photoUrl || "",
      commission: String(
        professional.commission || 0
      ),
      allowPanelAccess:
        professional.allowPanelAccess ===
        true,
      accessEmail:
        professional.accessEmail ||
        professional.email ||
        "",
      password: "",
      active:
        professional.active !== false,
    });
  }

  function closeEdit() {
    if (
      saving ||
      uploadingPhoto
    ) {
      return;
    }

    setEditingProfessional(null);
    setForm(emptyForm);
    setModalMessage("");
  }

  function updateForm<
    K extends keyof EditForm
  >(
    field: K,
    value: EditForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadPhoto(
    file: File
  ) {
    try {
      setUploadingPhoto(true);
      setModalMessage("");

      const uploadData =
        new FormData();

      uploadData.append(
        "file",
        file
      );

      uploadData.append(
        "folder",
        "vellto-agenda/profissionais"
      );

      const response = await fetch(
        "/api/upload",
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setModalMessage(
          data.message ||
            "Erro ao enviar foto"
        );
        return;
      }

      updateForm(
        "photoUrl",
        data.url || ""
      );

      setModalMessage(
        "Foto enviada. Clique em Salvar alterações."
      );
    } catch (error) {
      console.error(error);

      setModalMessage(
        "Erro ao enviar foto"
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveProfessional() {
    if (!editingProfessional) {
      return;
    }

    try {
      setSaving(true);
      setModalMessage("");

      const response = await fetch(
        `/api/dashboard/professionals/${editingProfessional._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            description:
              form.description,
            phone: form.phone,
            email: form.email,
            photoUrl:
              form.photoUrl,
            commission:
              form.commission === ""
                ? 0
                : Number(
                    form.commission
                  ),
            allowPanelAccess:
              form.allowPanelAccess,
            accessEmail:
              form.accessEmail,
            password:
              form.password,
            active: form.active,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setModalMessage(
          data.message ||
            "Erro ao salvar profissional"
        );
        return;
      }

      setProfessionals(
        (current) =>
          current.map(
            (professional) =>
              professional._id ===
              editingProfessional._id
                ? {
                    ...professional,
                    ...data.professional,
                  }
                : professional
          )
      );

      setModalMessage(
        "Profissional atualizado com sucesso."
      );

      setTimeout(() => {
        setEditingProfessional(null);
        setModalMessage("");
      }, 700);
    } catch (error) {
      console.error(error);

      setModalMessage(
        "Erro ao salvar profissional"
      );
    } finally {
      setSaving(false);
    }
  }

  const filtered =
    useMemo(() => {
      const term = search
        .trim()
        .toLowerCase();

      if (!term) {
        return professionals;
      }

      return professionals.filter(
        (professional) => {
          const text = [
            professional.name,
            professional.role,
            professional.description,
            professional.phone,
            professional.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(term);
        }
      );
    }, [professionals, search]);

  const activeCount =
    professionals.filter(
      (professional) =>
        professional.active !== false
    ).length;

  const inactiveCount =
    professionals.length -
    activeCount;

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Profissionais
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Gerencie equipe,
              comissão e acesso ao
              painel.
            </p>
          </div>

          <a
            href="/dashboard/minha-pagina"
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto sm:px-5"
          >
            + Novo profissional
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total"
            value={
              professionals.length
            }
            detail="Profissionais cadastrados"
          />

          <StatCard
            label="Ativos"
            value={activeCount}
            detail="Disponíveis para atendimento"
          />

          <StatCard
            label="Inativos"
            value={inactiveCount}
            detail="Não aparecem no agendamento"
          />
        </div>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:mt-6 sm:p-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Buscar profissional
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nome, cargo, telefone ou e-mail..."
            className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
          />
        </section>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] sm:mt-6">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:items-center sm:p-5">
            <div>
              <h2 className="font-bold">
                Equipe
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {filtered.length}{" "}
                profissional
                {filtered.length === 1
                  ? ""
                  : "ais"}
              </p>
            </div>
          </div>

          {loading ? (
            <EmptyState
              title="Carregando profissionais..."
              description="Aguarde enquanto buscamos sua equipe."
            />
          ) : filtered.length ===
            0 ? (
            <EmptyState
              title="Nenhum profissional encontrado"
              description="Nenhum profissional corresponde à busca."
            />
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {filtered.map(
                (professional) => (
                  <ProfessionalCard
                    key={
                      professional._id
                    }
                    professional={
                      professional
                    }
                    onEdit={() =>
                      openEdit(
                        professional
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {editingProfessional ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#09131d] shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Profissional
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Editar profissional
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {form.photoUrl ? (
                  <img
                    src={
                      form.photoUrl
                    }
                    alt={form.name}
                    className="h-24 w-24 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-emerald-500/10 text-3xl font-bold text-emerald-400">
                    {form.name
                      .charAt(0)
                      .toUpperCase() ||
                      "P"}
                  </div>
                )}

                <div>
                  <p className="font-semibold">
                    Foto do profissional
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Essa foto pode
                    aparecer na página
                    pública da empresa.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="cursor-pointer rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10">
                      {uploadingPhoto
                        ? "Enviando..."
                        : form.photoUrl
                        ? "Trocar foto"
                        : "Enviar foto"}

                      <input
                        type="file"
                        accept="image/*"
                        disabled={
                          uploadingPhoto
                        }
                        onChange={(
                          event
                        ) => {
                          const file =
                            event
                              .target
                              .files?.[0];

                          if (file) {
                            uploadPhoto(
                              file
                            );
                          }

                          event.target.value =
                            "";
                        }}
                        className="hidden"
                      />
                    </label>

                    {form.photoUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateForm(
                            "photoUrl",
                            ""
                          )
                        }
                        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/5"
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nome"
                  value={form.name}
                  onChange={(value) =>
                    updateForm(
                      "name",
                      value
                    )
                  }
                  placeholder="Nome do profissional"
                />

                <Field
                  label="Cargo / função"
                  value={form.role}
                  onChange={(value) =>
                    updateForm(
                      "role",
                      value
                    )
                  }
                  placeholder="Ex: Barbeiro"
                />

                <Field
                  label="Telefone"
                  value={form.phone}
                  onChange={(value) =>
                    updateForm(
                      "phone",
                      value
                    )
                  }
                  placeholder="(21) 99999-9999"
                />

                <Field
                  label="E-mail"
                  value={form.email}
                  onChange={(value) =>
                    updateForm(
                      "email",
                      value
                    )
                  }
                  placeholder="profissional@email.com"
                  type="email"
                />

                <Field
                  label="Comissão (%)"
                  value={
                    form.commission
                  }
                  onChange={(value) =>
                    updateForm(
                      "commission",
                      value
                    )
                  }
                  placeholder="Ex: 40"
                  type="number"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Situação
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        "active",
                        !form.active
                      )
                    }
                    className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 text-sm font-semibold transition ${
                      form.active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/20 bg-red-500/5 text-red-300"
                    }`}
                  >
                    <span>
                      {form.active
                        ? "Profissional ativo"
                        : "Profissional inativo"}
                    </span>

                    <span>
                      {form.active
                        ? "Ativo"
                        : "Inativo"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Descrição
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Especialidades, experiência ou apresentação..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <input
                    id="allowPanelAccess"
                    type="checkbox"
                    checked={
                      form.allowPanelAccess
                    }
                    onChange={(event) =>
                      updateForm(
                        "allowPanelAccess",
                        event.target
                          .checked
                      )
                    }
                    className="mt-1 h-5 w-5 accent-emerald-500"
                  />

                  <label
                    htmlFor="allowPanelAccess"
                    className="cursor-pointer"
                  >
                    <p className="font-semibold">
                      Permitir acesso
                      ao painel
                    </p>

                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Ative para criar
                      ou manter o login
                      deste profissional.
                      Ele verá apenas a
                      própria agenda e o
                      próprio financeiro.
                    </p>
                  </label>
                </div>
              </div>

              {form.allowPanelAccess ? (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
                  <p className="font-semibold text-emerald-300">
                    Dados de acesso
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Este será o login usado pelo profissional na mesma tela de acesso da Vellto.
                  </p>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <Field
                      label="E-mail de acesso"
                      value={form.accessEmail}
                      onChange={(value) =>
                        updateForm(
                          "accessEmail",
                          value
                        )
                      }
                      placeholder="profissional@email.com"
                      type="email"
                    />

                    <Field
                      label={
                        editingProfessional.hasPanelUser
                          ? "Nova senha (opcional)"
                          : "Senha inicial"
                      }
                      value={form.password}
                      onChange={(value) =>
                        updateForm(
                          "password",
                          value
                        )
                      }
                      placeholder={
                        editingProfessional.hasPanelUser
                          ? "Deixe vazio para manter"
                          : "Mínimo 6 caracteres"
                      }
                      type="password"
                    />
                  </div>

                  {editingProfessional.hasPanelUser ? (
                    <p className="mt-3 text-xs text-zinc-500">
                      O acesso já existe. Preencha uma nova senha somente se quiser alterá-la.
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">
                      Na primeira ativação é obrigatório definir uma senha de pelo menos 6 caracteres.
                    </p>
                  )}
                </div>
              ) : null}

              {modalMessage ? (
                <div
                  className={`mt-5 rounded-xl border p-4 text-sm ${
                    modalMessage.includes(
                      "sucesso"
                    ) ||
                    modalMessage.includes(
                      "enviada"
                    )
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                      : "border-red-500/20 bg-red-500/5 text-red-300"
                  }`}
                >
                  {modalMessage}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={closeEdit}
                disabled={
                  saving ||
                  uploadingPhoto
                }
                className="min-h-[48px] rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  saveProfessional
                }
                disabled={
                  saving ||
                  uploadingPhoto
                }
                className="min-h-[48px] rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ProfessionalCard({
  professional,
  onEdit,
}: {
  professional: Professional;
  onEdit: () => void;
}) {
  const active =
    professional.active !== false;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/10 p-5">
      <div className="flex items-start gap-4">
        {professional.photoUrl ? (
          <img
            src={
              professional.photoUrl
            }
            alt={
              professional.name
            }
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl font-bold text-emerald-400">
            {professional.name
              .charAt(0)
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold">
              {professional.name}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {active
                ? "Ativo"
                : "Inativo"}
            </span>
          </div>

          <p className="mt-1 text-sm text-zinc-400">
            {professional.role ||
              "Profissional"}
          </p>
        </div>
      </div>

      {professional.description ? (
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-500">
          {
            professional.description
          }
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/[0.025] p-3">
        <div>
          <p className="text-xs text-zinc-500">
            Comissão
          </p>

          <p className="mt-1 text-sm font-semibold">
            {Number(
              professional.commission ||
                0
            ).toLocaleString(
              "pt-BR",
              {
                maximumFractionDigits: 2,
              }
            )}
            %
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Painel
          </p>

          <p className="mt-1 text-sm font-semibold">
            {professional.allowPanelAccess
              ? "Permitido"
              : "Sem acesso"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
        >
          Editar
        </button>

        <a
          href="/dashboard/horarios"
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
        >
          Horários
        </a>
      </div>
    </article>
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
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        max={
          type === "number"
            ? "100"
            : undefined
        }
        step={
          type === "number"
            ? "0.01"
            : undefined
        }
        className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
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
  value: string | number;
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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-xl">
        ♧
      </div>

      <h3 className="mt-4 font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}
