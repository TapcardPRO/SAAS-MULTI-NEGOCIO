"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Service = {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  photoUrl: string;
  active: boolean;
  order: number;
};

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  duration: string;
  photoUrl: string;
  active: boolean;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  photoUrl: "",
  active: true,
};

export default function ServicosPage() {
  const [services, setServices] =
    useState<Service[]>([]);

  const [form, setForm] =
    useState<ServiceForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success"
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("todos");

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/services",
          {
            cache: "no-store",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        showError(
          data.message ||
            `Erro ao carregar serviços. Status ${response.status}.`
        );

        setServices([]);

        return;
      }

      setServices(
        Array.isArray(data.services)
          ? data.services
          : []
      );
    } catch (error) {
      console.error(
        "LOAD SERVICES ERROR:",
        error
      );

      showError(
        getErrorMessage(
          error,
          "Erro ao carregar serviços"
        )
      );

      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  function openNewService() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowModal(true);
  }

  function openEditService(
    service: Service
  ) {
    setEditingId(
      service._id
    );

    setForm({
      name:
        service.name || "",

      description:
        service.description || "",

      price:
        String(
          service.price ?? ""
        ),

      duration:
        String(
          service.duration ?? ""
        ),

      photoUrl:
        service.photoUrl || "",

      active:
        service.active !== false,
    });

    setMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (
      saving ||
      uploading
    ) {
      return;
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function uploadImage(
    file: File
  ) {
    const uploadData =
      new FormData();

    uploadData.append(
      "file",
      file
    );

    uploadData.append(
      "folder",
      "saas-multi-negocio/servicos"
    );

    const response =
      await fetch(
        "/api/upload",
        {
          method: "POST",
          body: uploadData,
        }
      );

    const data =
      await readJsonResponse(
        response
      );

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Erro ao enviar imagem. Status ${response.status}.`
      );
    }

    if (!data.url) {
      throw new Error(
        "A API não retornou a URL da imagem."
      );
    }

    return String(
      data.url
    );
  }

  async function handlePhotoUpload(
    file: File | null
  ) {
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const url =
        await uploadImage(
          file
        );

      setForm(
        (current) => ({
          ...current,
          photoUrl: url,
        })
      );

      showSuccess(
        "Foto enviada com sucesso."
      );
    } catch (error) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      showError(
        getErrorMessage(
          error,
          "Erro ao enviar foto"
        )
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveService(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !form.name.trim()
    ) {
      showError(
        "Informe o nome do serviço."
      );

      return;
    }

    const price =
      parseMoney(
        form.price
      );

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      showError(
        "Informe um valor válido."
      );

      return;
    }

    const duration =
      Number(
        form.duration
      );

    if (
      !Number.isFinite(
        duration
      ) ||
      duration <= 0
    ) {
      showError(
        "Informe uma duração válida."
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const body = {
        ...(editingId
          ? {
              id:
                editingId,
            }
          : {}),

        name:
          form.name.trim(),

        description:
          form.description.trim(),

        price,

        duration,

        photoUrl:
          form.photoUrl.trim(),

        active:
          form.active,
      };

      const response =
        await fetch(
          "/api/services",
          {
            method:
              editingId
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        showError(
          data.message ||
            `Erro ao salvar serviço. Status ${response.status}.`
        );

        return;
      }

      const successText =
        editingId
          ? "Serviço atualizado com sucesso!"
          : "Serviço criado com sucesso!";

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadServices();

      showSuccess(
        successText
      );
    } catch (error) {
      console.error(
        "SAVE SERVICE ERROR:",
        error
      );

      showError(
        getErrorMessage(
          error,
          "Erro ao salvar serviço"
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    service: Service
  ) {
    try {
      setMessage("");

      const response =
        await fetch(
          "/api/services",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  service._id,

                active:
                  !service.active,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        showError(
          data.message ||
            `Erro ao alterar serviço. Status ${response.status}.`
        );

        return;
      }

      await loadServices();

      showSuccess(
        service.active
          ? "Serviço desativado."
          : "Serviço ativado."
      );
    } catch (error) {
      console.error(
        "TOGGLE SERVICE ERROR:",
        error
      );

      showError(
        getErrorMessage(
          error,
          "Erro ao alterar status do serviço"
        )
      );
    }
  }

  async function deleteService(
    service: Service
  ) {
    const confirmed =
      window.confirm(
        `Deseja realmente excluir "${service.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const response =
        await fetch(
          `/api/services?id=${encodeURIComponent(
            service._id
          )}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        showError(
          data.message ||
            `Erro ao excluir serviço. Status ${response.status}.`
        );

        return;
      }

      await loadServices();

      showSuccess(
        "Serviço excluído."
      );
    } catch (error) {
      console.error(
        "DELETE SERVICE ERROR:",
        error
      );

      showError(
        getErrorMessage(
          error,
          "Erro ao excluir serviço"
        )
      );
    }
  }

  function showSuccess(
    text: string
  ) {
    setMessageType(
      "success"
    );

    setMessage(text);
  }

  function showError(
    text: string
  ) {
    setMessageType(
      "error"
    );

    setMessage(text);
  }

  const filteredServices =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return services.filter(
        (service) => {
          if (
            statusFilter ===
              "ativos" &&
            !service.active
          ) {
            return false;
          }

          if (
            statusFilter ===
              "inativos" &&
            service.active
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          return [
            service.name,
            service.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(
              term
            );
        }
      );
    }, [
      services,
      search,
      statusFilter,
    ]);

  const stats =
    useMemo(() => {
      const active =
        services.filter(
          (service) =>
            service.active
        ).length;

      const inactive =
        services.length -
        active;

      const averagePrice =
        services.length
          ? services.reduce(
              (
                total,
                service
              ) =>
                total +
                Number(
                  service.price ||
                    0
                ),
              0
            ) /
            services.length
          : 0;

      return {
        total:
          services.length,

        active,

        inactive,

        averagePrice,
      };
    }, [services]);

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Catálogo
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Serviços
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Cadastre e gerencie os serviços oferecidos aos clientes.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNewService
            }
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto sm:px-5"
          >
            + Novo serviço
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total de serviços"
            value={
              stats.total
            }
          />

          <StatCard
            label="Ativos"
            value={
              stats.active
            }
          />

          <StatCard
            label="Inativos"
            value={
              stats.inactive
            }
          />

          <StatCard
            label="Ticket médio"
            value={
              formatPrice(
                stats.averagePrice
              )
            }
          />
        </div>

        {message ? (
          <div
            className={`mt-6 rounded-xl border p-4 text-sm ${
              messageType ===
              "success"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                : "border-red-500/20 bg-red-500/5 text-red-300"
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 lg:grid-cols-[1fr_220px]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Buscar
            </label>

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Buscar serviço..."
              className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target
                    .value
                )
              }
              className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
            >
              <option value="todos">
                Todos
              </option>

              <option value="ativos">
                Ativos
              </option>

              <option value="inativos">
                Inativos
              </option>
            </select>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">
              Seus serviços
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {
                filteredServices.length
              }{" "}
              serviço(s)
            </p>
          </div>

          {loading ? (
            <EmptyState
              title="Carregando serviços..."
              description="Aguarde enquanto buscamos seu catálogo."
            />
          ) : filteredServices.length ===
            0 ? (
            <EmptyState
              title="Nenhum serviço encontrado"
              description="Cadastre um novo serviço ou altere os filtros."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map(
                (
                  service
                ) => (
                  <ServiceCard
                    key={
                      service._id
                    }
                    service={
                      service
                    }
                    onEdit={
                      openEditService
                    }
                    onToggle={
                      toggleActive
                    }
                    onDelete={
                      deleteService
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a141d] shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:items-center sm:p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Serviços
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {editingId
                    ? "Editar serviço"
                    : "Novo serviço"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-xl border border-white/10 px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                saveService
              }
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Foto do serviço
                </label>

                {form.photoUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071018]">
                    <img
                      src={
                        form.photoUrl
                      }
                      alt="Foto do serviço"
                      className="h-56 w-full object-cover"
                    />

                    <div className="grid grid-cols-2 gap-3 p-4">
                      <label className="cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold transition hover:bg-white/5">
                        {uploading
                          ? "Enviando..."
                          : "Trocar foto"}

                        <input
                          type="file"
                          accept="image/*"
                          disabled={
                            uploading
                          }
                          onChange={(
                            event
                          ) =>
                            handlePhotoUpload(
                              event
                                .target
                                .files?.[0] ||
                                null
                            )
                          }
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              photoUrl:
                                "",
                            })
                          )
                        }
                        className="rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/5"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#071018] px-6 py-10 text-center transition hover:border-emerald-500/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                      📷
                    </div>

                    <p className="mt-4 font-semibold">
                      {uploading
                        ? "Enviando foto..."
                        : "Adicionar foto"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Clique para selecionar uma imagem
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      disabled={
                        uploading
                      }
                      onChange={(
                        event
                      ) =>
                        handlePhotoUpload(
                          event
                            .target
                            .files?.[0] ||
                            null
                        )
                      }
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nome do serviço
                </label>

                <input
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        name:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Ex: Corte Tradicional"
                  className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Descrição
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={4}
                  placeholder="Descreva o serviço..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#071018] px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Valor
                  </label>

                  <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#071018] focus-within:border-emerald-500">
                    <span className="flex items-center border-r border-white/10 px-4 text-sm text-zinc-500">
                      R$
                    </span>

                    <input
                      value={
                        form.price
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            price:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      inputMode="decimal"
                      placeholder="40,00"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Duração
                  </label>

                  <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#071018] focus-within:border-emerald-500">
                    <input
                      type="number"
                      min="1"
                      value={
                        form.duration
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            duration:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="30"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                    />

                    <span className="flex items-center border-l border-white/10 px-4 text-sm text-zinc-500">
                      min
                    </span>
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#071018] px-4 py-4">
                <div>
                  <p className="font-semibold">
                    Serviço ativo
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Serviços inativos não aparecem para o cliente.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        active:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                  className="h-5 w-5"
                />
              </label>

              {message &&
              messageType ===
                "error" ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    uploading
                  }
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                      ? "Salvar alterações"
                      : "Criar serviço"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ServiceCard({
  service,
  onEdit,
  onToggle,
  onDelete,
}: {
  service: Service;

  onEdit: (
    service: Service
  ) => void;

  onToggle: (
    service: Service
  ) => void;

  onDelete: (
    service: Service
  ) => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white/[0.025] transition ${
        service.active
          ? "border-white/10"
          : "border-red-500/20 opacity-70"
      }`}
    >
      <div className="relative">
        {service.photoUrl ? (
          <img
            src={
              service.photoUrl
            }
            alt={
              service.name
            }
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-[#071018]">
            <div className="text-center">
              <div className="text-3xl">
                ✂️
              </div>

              <p className="mt-2 text-xs text-zinc-600">
                Sem foto
              </p>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
              service.active
                ? "bg-emerald-500/90 text-zinc-950"
                : "bg-red-500/90 text-white"
            }`}
          >
            {service.active
              ? "Ativo"
              : "Inativo"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold">
              {service.name}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {service.duration} min
            </p>
          </div>

          <p className="shrink-0 text-lg font-black text-emerald-400">
            {formatPrice(
              service.price
            )}
          </p>
        </div>

        {service.description ? (
          <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-5 text-zinc-500">
            {service.description}
          </p>
        ) : (
          <p className="mt-4 min-h-[60px] text-sm text-zinc-700">
            Sem descrição.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() =>
              onEdit(
                service
              )
            }
            className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold transition hover:bg-white/5"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() =>
              onToggle(
                service
              )
            }
            className="rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold transition hover:bg-white/5"
          >
            {service.active
              ? "Desativar"
              : "Ativar"}
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            onDelete(
              service
            )
          }
          className="mt-2 w-full rounded-xl border border-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/5"
        >
          Excluir
        </button>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-bold sm:mt-3 sm:text-3xl">
        {value}
      </p>
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
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-12 text-center">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

async function readJsonResponse(
  response: Response
): Promise<any> {
  const text =
    await response.text();

  if (!text.trim()) {
    if (response.ok) {
      return {};
    }

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

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

function parseMoney(
  value: string
) {
  const clean =
    value
      .trim()
      .replace(/\s/g, "");

  if (!clean) {
    return 0;
  }

  if (
    clean.includes(",") &&
    clean.includes(".")
  ) {
    return Number(
      clean
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  return Number(
    clean.replace(",", ".")
  );
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
  ).format(
    price || 0
  );
}