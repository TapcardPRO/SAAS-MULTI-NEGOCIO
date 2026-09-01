"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type BusinessForm = {
  name: string;
  category: string;
  description: string;
  whatsapp: string;
  instagram: string;
  address: string;

  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;

  logoUrl: string;
  coverUrl: string;
  gallery: string[];

  mainButtonText: string;
  mainButtonType:
    | "booking"
    | "whatsapp"
    | "link";

  mainButtonUrl: string;

  servicesTitle: string;

  showProfessionals: boolean;

  showBookingSection: boolean;
  bookingSectionLabel: string;
  bookingSectionTitle: string;
  bookingSectionDescription: string;
};

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

type Professional = {
  _id: string;
  name: string;
  role: string;
  description: string;
  photoUrl: string;
  active: boolean;
  order: number;
};

type ProfessionalForm = {
  name: string;
  role: string;
  description: string;
  photoUrl: string;
  active: boolean;
};

const initialBusinessForm: BusinessForm = {
  name: "",
  category: "",
  description: "",
  whatsapp: "",
  instagram: "",
  address: "",

  primaryColor: "#22c55e",
  secondaryColor: "#18181b",
  backgroundColor: "#09090b",
  textColor: "#ffffff",

  logoUrl: "",
  coverUrl: "",
  gallery: [],

  mainButtonText: "Agendar agora",
  mainButtonType: "booking",
  mainButtonUrl: "",

  servicesTitle: "Escolha o que você precisa",

  showProfessionals: true,

  showBookingSection: true,
  bookingSectionLabel: "Agendamento",
  bookingSectionTitle: "Escolha seu horário",
  bookingSectionDescription:
    "Em breve os horários disponíveis e o agendamento online aparecerão aqui.",
};

const initialServiceForm: ServiceForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  photoUrl: "",
  active: true,
};

const initialProfessionalForm: ProfessionalForm = {
  name: "",
  role: "",
  description: "",
  photoUrl: "",
  active: true,
};

export default function MinhaPagina() {
  const router = useRouter();

  const [slug, setSlug] = useState("");

  const [businessName, setBusinessName] =
    useState("");

  const [form, setForm] =
    useState<BusinessForm>(
      initialBusinessForm
    );

  const [services, setServices] =
    useState<Service[]>([]);

  const [serviceForm, setServiceForm] =
    useState<ServiceForm>(
      initialServiceForm
    );

  const [
    editingServiceId,
    setEditingServiceId,
  ] = useState<string | null>(null);

  const [
    professionals,
    setProfessionals,
  ] = useState<Professional[]>([]);

  const [
    professionalForm,
    setProfessionalForm,
  ] = useState<ProfessionalForm>(
    initialProfessionalForm
  );

  const [
    editingProfessionalId,
    setEditingProfessionalId,
  ] = useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    savingBusiness,
    setSavingBusiness,
  ] = useState(false);

  const [
    savingService,
    setSavingService,
  ] = useState(false);

  const [
    savingProfessional,
    setSavingProfessional,
  ] = useState(false);

  const [
    uploadingLogo,
    setUploadingLogo,
  ] = useState(false);

  const [
    uploadingCover,
    setUploadingCover,
  ] = useState(false);

  const [
    uploadingGallery,
    setUploadingGallery,
  ] = useState(false);

  const [
    uploadingServicePhoto,
    setUploadingServicePhoto,
  ] = useState(false);

  const [
    uploadingProfessionalPhoto,
    setUploadingProfessionalPhoto,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [
    serviceMessage,
    setServiceMessage,
  ] = useState("");

  const [
    professionalMessage,
    setProfessionalMessage,
  ] = useState("");

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/me",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.authenticated
      ) {
        router.replace("/login");
        return;
      }

      if (!data.business?.slug) {
        setMessage(
          "Sua conta ainda não possui uma empresa vinculada."
        );
        return;
      }

      const businessSlug =
        data.business.slug;

      setSlug(businessSlug);

      setBusinessName(
        data.business.name || ""
      );

      await Promise.all([
        loadBusiness(businessSlug),
        loadServices(businessSlug),
        loadProfessionals(businessSlug),
      ]);
    } catch (error) {
      console.error(
        "Erro ao iniciar dashboard:",
        error
      );

      setMessage(
        "Erro ao carregar sua conta."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBusiness(
    businessSlug: string
  ) {
    try {
      const response = await fetch(
        `/api/business/${businessSlug}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar negócio"
        );
        return;
      }

      setForm({
        name:
          data.business.name || "",

        category:
          data.business.category || "",

        description:
          data.business.description || "",

        whatsapp:
          data.business.whatsapp || "",

        instagram:
          data.business.instagram || "",

        address:
          data.business.address || "",

        primaryColor:
          data.business.primaryColor ||
          "#22c55e",

        secondaryColor:
          data.business.secondaryColor ||
          "#18181b",

        backgroundColor:
          data.business.backgroundColor ||
          "#09090b",

        textColor:
          data.business.textColor ||
          "#ffffff",

        logoUrl:
          data.business.logoUrl || "",

        coverUrl:
          data.business.coverUrl || "",

        gallery: Array.isArray(
          data.business.gallery
        )
          ? data.business.gallery
          : [],

        mainButtonText:
          data.business.mainButtonText ||
          data.business.bookingButtonText ||
          "Agendar agora",

        mainButtonType:
          data.business.mainButtonType ===
            "whatsapp" ||
          data.business.mainButtonType ===
            "link"
            ? data.business.mainButtonType
            : "booking",

        mainButtonUrl:
          data.business.mainButtonUrl || "",

        servicesTitle:
          data.business.servicesTitle ||
          "Escolha o que você precisa",

        showProfessionals:
          data.business.showProfessionals !==
          false,

        showBookingSection:
          data.business
            .showBookingSection !== false,

        bookingSectionLabel:
          data.business
            .bookingSectionLabel ||
          "Agendamento",

        bookingSectionTitle:
          data.business
            .bookingSectionTitle ||
          "Escolha seu horário",

        bookingSectionDescription:
          data.business
            .bookingSectionDescription ||
          "Em breve os horários disponíveis e o agendamento online aparecerão aqui.",
      });
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao carregar os dados do negócio."
      );
    }
  }

  async function loadServices(
    businessSlug: string
  ) {
    try {
      const response = await fetch(
        `/api/services/${businessSlug}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setServiceMessage(
          data.message ||
            "Erro ao carregar serviços"
        );
        return;
      }

      setServices(
        data.services || []
      );
    } catch (error) {
      console.error(error);

      setServiceMessage(
        "Erro ao carregar serviços"
      );
    }
  }

  async function loadProfessionals(
    businessSlug: string
  ) {
    try {
      const response = await fetch(
        `/api/professionals/${businessSlug}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setProfessionalMessage(
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

      setProfessionalMessage(
        "Erro ao carregar profissionais"
      );
    }
  }

  function changeField<
    K extends keyof BusinessForm
  >(
    field: K,
    value: BusinessForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadImage(
    file: File,
    folder: string
  ): Promise<string> {
    const uploadData =
      new FormData();

    uploadData.append(
      "file",
      file
    );

    uploadData.append(
      "folder",
      folder
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
      throw new Error(
        data.message ||
          "Erro ao enviar imagem"
      );
    }

    return data.url;
  }

  async function handleLogoUpload(
    file: File | null
  ) {
    if (!file || !slug) return;

    try {
      setUploadingLogo(true);
      setMessage("");

      const url =
        await uploadImage(
          file,
          `saas-multi-negocio/${slug}/logo`
        );

      changeField(
        "logoUrl",
        url
      );

      setMessage(
        "Logo enviada. Clique em Salvar alterações no final da página."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao enviar logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCoverUpload(
    file: File | null
  ) {
    if (!file || !slug) return;

    try {
      setUploadingCover(true);
      setMessage("");

      const url =
        await uploadImage(
          file,
          `saas-multi-negocio/${slug}/capa`
        );

      changeField(
        "coverUrl",
        url
      );

      setMessage(
        "Capa enviada. Clique em Salvar alterações no final da página."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao enviar capa"
      );
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(
    files: FileList | null
  ) {
    if (
      !files ||
      files.length === 0 ||
      !slug
    ) {
      return;
    }

    try {
      setUploadingGallery(true);
      setMessage("");

      const uploadedUrls: string[] =
        [];

      for (
        const file of
        Array.from(files)
      ) {
        const url =
          await uploadImage(
            file,
            `saas-multi-negocio/${slug}/galeria`
          );

        uploadedUrls.push(url);
      }

      setForm((current) => ({
        ...current,

        gallery: [
          ...current.gallery,
          ...uploadedUrls,
        ],
      }));

      setMessage(
        "Fotos enviadas. Clique em Salvar alterações no final da página."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao enviar galeria"
      );
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleServicePhotoUpload(
    file: File | null
  ) {
    if (!file || !slug) return;

    try {
      setUploadingServicePhoto(
        true
      );

      setServiceMessage("");

      const url =
        await uploadImage(
          file,
          `saas-multi-negocio/${slug}/servicos`
        );

      setServiceForm(
        (current) => ({
          ...current,
          photoUrl: url,
        })
      );

      setServiceMessage(
        "Foto enviada com sucesso."
      );
    } catch (error) {
      console.error(error);

      setServiceMessage(
        error instanceof Error
          ? error.message
          : "Erro ao enviar foto"
      );
    } finally {
      setUploadingServicePhoto(
        false
      );
    }
  }

  async function handleProfessionalPhotoUpload(
    file: File | null
  ) {
    if (!file || !slug) return;

    try {
      setUploadingProfessionalPhoto(
        true
      );

      setProfessionalMessage("");

      const url =
        await uploadImage(
          file,
          `saas-multi-negocio/${slug}/profissionais`
        );

      setProfessionalForm(
        (current) => ({
          ...current,
          photoUrl: url,
        })
      );

      setProfessionalMessage(
        "Foto do profissional enviada."
      );
    } catch (error) {
      console.error(error);

      setProfessionalMessage(
        error instanceof Error
          ? error.message
          : "Erro ao enviar foto"
      );
    } finally {
      setUploadingProfessionalPhoto(
        false
      );
    }
  }

  function removeGalleryPhoto(
    index: number
  ) {
    setForm((current) => ({
      ...current,

      gallery:
        current.gallery.filter(
          (_, photoIndex) =>
            photoIndex !== index
        ),
    }));
  }

  async function saveBusiness() {
    if (!slug) {
      setMessage(
        "Empresa não identificada."
      );
      return;
    }

    try {
      setSavingBusiness(true);
      setMessage("");

      const response = await fetch(
        `/api/business/${slug}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            form
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao salvar alterações"
        );
        return;
      }

      setBusinessName(
        data.business?.name ||
          form.name
      );

      setMessage(
        "Alterações salvas com sucesso!"
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao salvar alterações"
      );
    } finally {
      setSavingBusiness(false);
    }
  }

  async function saveService(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!slug) {
      setServiceMessage(
        "Empresa não identificada."
      );
      return;
    }

    if (
      !serviceForm.name.trim()
    ) {
      setServiceMessage(
        "Informe o nome do serviço."
      );
      return;
    }

    const price =
      serviceForm.price.trim() ===
      ""
        ? 0
        : Number(
            serviceForm.price
              .replace(/\./g, "")
              .replace(",", ".")
          );

    const duration =
      serviceForm.duration.trim() ===
      ""
        ? 0
        : Number(
            serviceForm.duration
          );

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setServiceMessage(
        "Informe um valor válido."
      );
      return;
    }

    if (
      !Number.isFinite(duration) ||
      duration < 0
    ) {
      setServiceMessage(
        "Informe uma duração válida."
      );
      return;
    }

    try {
      setSavingService(true);
      setServiceMessage("");

      const response = await fetch(
        `/api/services/${slug}`,
        {
          method:
            editingServiceId
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...(editingServiceId
              ? {
                  id:
                    editingServiceId,
                }
              : {}),

            name:
              serviceForm.name,

            description:
              serviceForm.description,

            price,

            duration,

            photoUrl:
              serviceForm.photoUrl,

            active:
              serviceForm.active,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setServiceMessage(
          data.message ||
            "Erro ao salvar serviço"
        );
        return;
      }

      cancelServiceEdit();

      await loadServices(slug);

      setServiceMessage(
        "Serviço salvo com sucesso!"
      );
    } catch (error) {
      console.error(error);

      setServiceMessage(
        "Erro ao salvar serviço"
      );
    } finally {
      setSavingService(false);
    }
  }

  function editService(
    service: Service
  ) {
    setEditingServiceId(
      service._id
    );

    setServiceForm({
      name: service.name || "",

      description:
        service.description || "",

      price: String(
        service.price ?? ""
      ),

      duration: String(
        service.duration ?? ""
      ),

      photoUrl:
        service.photoUrl || "",

      active:
        service.active !== false,
    });
  }

  function cancelServiceEdit() {
    setEditingServiceId(null);

    setServiceForm(
      initialServiceForm
    );
  }

  async function toggleService(
    service: Service
  ) {
    if (!slug) return;

    try {
      const response = await fetch(
        `/api/services/${slug}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: service._id,

            active:
              !service.active,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setServiceMessage(
          data.message ||
            "Erro ao alterar serviço"
        );
        return;
      }

      await loadServices(slug);
    } catch (error) {
      console.error(error);

      setServiceMessage(
        "Erro ao alterar serviço"
      );
    }
  }

  async function deleteService(
    service: Service
  ) {
    if (!slug) return;

    const confirmed =
      window.confirm(
        `Excluir "${service.name}"?`
      );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/services/${slug}?id=${service._id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setServiceMessage(
          data.message ||
            "Erro ao excluir serviço"
        );
        return;
      }

      if (
        editingServiceId ===
        service._id
      ) {
        cancelServiceEdit();
      }

      await loadServices(slug);

      setServiceMessage(
        "Serviço excluído."
      );
    } catch (error) {
      console.error(error);

      setServiceMessage(
        "Erro ao excluir serviço"
      );
    }
  }

  async function saveProfessional(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!slug) {
      setProfessionalMessage(
        "Empresa não identificada."
      );
      return;
    }

    if (
      !professionalForm.name.trim()
    ) {
      setProfessionalMessage(
        "Informe o nome do profissional."
      );
      return;
    }

    try {
      setSavingProfessional(true);
      setProfessionalMessage("");

      const response = await fetch(
        `/api/professionals/${slug}`,
        {
          method:
            editingProfessionalId
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...(editingProfessionalId
              ? {
                  id:
                    editingProfessionalId,
                }
              : {}),

            name:
              professionalForm.name,

            role:
              professionalForm.role,

            description:
              professionalForm.description,

            photoUrl:
              professionalForm.photoUrl,

            active:
              professionalForm.active,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setProfessionalMessage(
          data.message ||
            "Erro ao salvar profissional"
        );
        return;
      }

      cancelProfessionalEdit();

      await loadProfessionals(
        slug
      );

      setProfessionalMessage(
        "Profissional salvo com sucesso!"
      );
    } catch (error) {
      console.error(error);

      setProfessionalMessage(
        "Erro ao salvar profissional"
      );
    } finally {
      setSavingProfessional(false);
    }
  }

  function editProfessional(
    professional: Professional
  ) {
    setEditingProfessionalId(
      professional._id
    );

    setProfessionalForm({
      name:
        professional.name || "",

      role:
        professional.role || "",

      description:
        professional.description ||
        "",

      photoUrl:
        professional.photoUrl || "",

      active:
        professional.active !==
        false,
    });
  }

  function cancelProfessionalEdit() {
    setEditingProfessionalId(
      null
    );

    setProfessionalForm(
      initialProfessionalForm
    );
  }

  async function toggleProfessional(
    professional: Professional
  ) {
    if (!slug) return;

    try {
      const response = await fetch(
        `/api/professionals/${slug}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: professional._id,

            active:
              !professional.active,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setProfessionalMessage(
          data.message ||
            "Erro ao alterar profissional"
        );
        return;
      }

      await loadProfessionals(
        slug
      );
    } catch (error) {
      console.error(error);

      setProfessionalMessage(
        "Erro ao alterar profissional"
      );
    }
  }

  async function deleteProfessional(
    professional: Professional
  ) {
    if (!slug) return;

    const confirmed =
      window.confirm(
        `Excluir "${professional.name}"?`
      );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/professionals/${slug}?id=${professional._id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setProfessionalMessage(
          data.message ||
            "Erro ao excluir profissional"
        );
        return;
      }

      if (
        editingProfessionalId ===
        professional._id
      ) {
        cancelProfessionalEdit();
      }

      await loadProfessionals(
        slug
      );

      setProfessionalMessage(
        "Profissional excluído."
      );
    } catch (error) {
      console.error(error);

      setProfessionalMessage(
        "Erro ao excluir profissional"
      );
    }
  }

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Carregando sua empresa...
      </main>
    );
  }

  if (!slug) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h1 className="text-xl font-bold">
              Empresa não encontrada
            </h1>

            <p className="mt-3 text-zinc-400">
              {message ||
                "Sua conta ainda não possui uma empresa vinculada."}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 rounded-xl border border-white/10 px-5 py-3"
            >
              Sair
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* CABEÇALHO */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Personalização
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Minha página
            </h1>

            <p className="mt-2 text-zinc-400">
              {businessName ||
                form.name}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium transition hover:bg-white/5"
            >
              Ver minha página
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Sair
            </button>
          </div>
        </div>

        {/* INFORMAÇÕES */}
        <Panel title="Informações">
          <div className="grid gap-5">
            <Field
              label="Nome do negócio"
              value={form.name}
              onChange={(value) =>
                changeField(
                  "name",
                  value
                )
              }
            />

            <Field
              label="Categoria"
              value={
                form.category
              }
              onChange={(value) =>
                changeField(
                  "category",
                  value
                )
              }
            />

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Sobre o negócio
              </label>

              <textarea
                value={
                  form.description
                }
                onChange={(e) =>
                  changeField(
                    "description",
                    e.target.value
                  )
                }
                rows={5}
                className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="WhatsApp"
                value={
                  form.whatsapp
                }
                onChange={(value) =>
                  changeField(
                    "whatsapp",
                    value
                  )
                }
              />

              <Field
                label="Instagram"
                value={
                  form.instagram
                }
                onChange={(value) =>
                  changeField(
                    "instagram",
                    value
                  )
                }
              />
            </div>

            <Field
              label="Endereço"
              value={
                form.address
              }
              onChange={(value) =>
                changeField(
                  "address",
                  value
                )
              }
            />
          </div>
        </Panel>

        {/* BOTÃO PRINCIPAL */}
        <Panel
          title="Botão principal"
          className="mt-8"
        >
          <div className="space-y-4">
            <Field
              label="Texto do botão"
              value={
                form.mainButtonText
              }
              onChange={(value) =>
                changeField(
                  "mainButtonText",
                  value
                )
              }
            />

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Ao clicar
              </label>

              <select
                value={
                  form.mainButtonType
                }
                onChange={(e) =>
                  changeField(
                    "mainButtonType",
                    e.target
                      .value as
                      | "booking"
                      | "whatsapp"
                      | "link"
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none"
              >
                <option value="booking">
                  Agendamento
                </option>

                <option value="whatsapp">
                  WhatsApp
                </option>

                <option value="link">
                  Link externo
                </option>
              </select>
            </div>

            {form.mainButtonType ===
            "link" ? (
              <Field
                label="Link"
                value={
                  form.mainButtonUrl
                }
                onChange={(value) =>
                  changeField(
                    "mainButtonUrl",
                    value
                  )
                }
              />
            ) : null}
          </div>
        </Panel>

        {/* CORES */}
        <Panel
          title="Cores"
          className="mt-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              label="Cor principal"
              value={
                form.primaryColor
              }
              onChange={(value) =>
                changeField(
                  "primaryColor",
                  value
                )
              }
            />

            <ColorField
              label="Cor secundária"
              value={
                form.secondaryColor
              }
              onChange={(value) =>
                changeField(
                  "secondaryColor",
                  value
                )
              }
            />

            <ColorField
              label="Cor do fundo"
              value={
                form.backgroundColor
              }
              onChange={(value) =>
                changeField(
                  "backgroundColor",
                  value
                )
              }
            />

            <ColorField
              label="Cor do texto"
              value={
                form.textColor
              }
              onChange={(value) =>
                changeField(
                  "textColor",
                  value
                )
              }
            />
          </div>
        </Panel>

        {/* LOGO */}
        <Panel
          title="Logo"
          className="mt-8"
        >
          <UploadField
            text={
              form.logoUrl
                ? "Trocar logo"
                : "Escolher logo"
            }
            uploading={
              uploadingLogo
            }
            onChange={
              handleLogoUpload
            }
          />

          {form.logoUrl ? (
            <div className="mt-4">
              <img
                src={form.logoUrl}
                alt="Logo"
                className="h-28 w-28 rounded-2xl object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  changeField(
                    "logoUrl",
                    ""
                  )
                }
                className="mt-3 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400"
              >
                Remover logo
              </button>
            </div>
          ) : null}
        </Panel>

        {/* CAPA */}
        <Panel
          title="Foto de capa"
          className="mt-8"
        >
          <UploadField
            text={
              form.coverUrl
                ? "Trocar foto de capa"
                : "Escolher foto de capa"
            }
            uploading={
              uploadingCover
            }
            onChange={
              handleCoverUpload
            }
          />

          {form.coverUrl ? (
            <div className="mt-4">
              <img
                src={form.coverUrl}
                alt="Capa"
                className="h-52 w-full rounded-2xl object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  changeField(
                    "coverUrl",
                    ""
                  )
                }
                className="mt-3 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400"
              >
                Remover capa
              </button>
            </div>
          ) : null}
        </Panel>

        {/* GALERIA */}
        <Panel
          title="Galeria"
          className="mt-8"
        >
          <label className="flex cursor-pointer justify-center rounded-xl border border-dashed border-white/20 bg-zinc-900 p-5">
            {uploadingGallery
              ? "Enviando..."
              : "+ Adicionar fotos"}

            <input
              type="file"
              multiple
              accept="image/*"
              disabled={
                uploadingGallery
              }
              className="hidden"
              onChange={(e) =>
                handleGalleryUpload(
                  e.target.files
                )
              }
            />
          </label>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.gallery.map(
              (photo, index) => (
                <div
                  key={`${photo}-${index}`}
                  className="rounded-xl border border-white/10 p-3"
                >
                  <img
                    src={photo}
                    alt=""
                    className="h-40 w-full rounded-xl object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeGalleryPhoto(
                        index
                      )
                    }
                    className="mt-3 w-full rounded-lg border border-red-500/30 p-2 text-sm text-red-400"
                  >
                    Remover
                  </button>
                </div>
              )
            )}
          </div>
        </Panel>

        {/* SERVIÇOS */}
        <Panel
          title="Serviços"
          className="mt-8"
        >
          <Field
            label="Título da seção na página"
            value={
              form.servicesTitle
            }
            onChange={(value) =>
              changeField(
                "servicesTitle",
                value
              )
            }
          />

          <p className="mt-2 text-xs text-zinc-500">
            Ex: Escolha seu corte, Confira nosso cardápio, Nossos produtos.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
            <form
              onSubmit={
                saveService
              }
              className="space-y-5 rounded-2xl border border-white/10 bg-zinc-950/40 p-5"
            >
              <h3 className="font-semibold">
                {editingServiceId
                  ? "Editar serviço"
                  : "Novo serviço"}
              </h3>

              <UploadField
                text={
                  serviceForm.photoUrl
                    ? "Trocar foto do serviço"
                    : "Escolher foto do serviço"
                }
                uploading={
                  uploadingServicePhoto
                }
                onChange={
                  handleServicePhotoUpload
                }
              />

              {serviceForm.photoUrl ? (
                <div>
                  <img
                    src={
                      serviceForm.photoUrl
                    }
                    alt=""
                    className="h-44 w-full rounded-xl object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setServiceForm(
                        (current) => ({
                          ...current,
                          photoUrl: "",
                        })
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-red-500/30 p-2 text-sm text-red-400"
                  >
                    Remover foto
                  </button>
                </div>
              ) : null}

              <Field
                label="Nome"
                value={
                  serviceForm.name
                }
                onChange={(value) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      name: value,
                    })
                  )
                }
              />

              <Field
                label="Descrição"
                value={
                  serviceForm.description
                }
                onChange={(value) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      description:
                        value,
                    })
                  )
                }
              />

              <Field
                label="Valor"
                value={
                  serviceForm.price
                }
                onChange={(value) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      price: value,
                    })
                  )
                }
              />

              <Field
                label="Duração em minutos"
                value={
                  serviceForm.duration
                }
                onChange={(value) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      duration:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Serviço ativo"
                description="Se desligar, não aparece na página pública."
                checked={
                  serviceForm.active
                }
                onChange={(value) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      active: value,
                    })
                  )
                }
              />

              <button
                type="submit"
                disabled={
                  savingService ||
                  uploadingServicePhoto
                }
                className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-zinc-950 disabled:opacity-50"
              >
                {savingService
                  ? "Salvando..."
                  : editingServiceId
                    ? "Salvar serviço"
                    : "Adicionar serviço"}
              </button>

              {editingServiceId ? (
                <button
                  type="button"
                  onClick={
                    cancelServiceEdit
                  }
                  className="w-full rounded-xl border border-white/10 p-3"
                >
                  Cancelar
                </button>
              ) : null}

              {serviceMessage ? (
                <p className="rounded-xl border border-white/10 p-3 text-sm">
                  {serviceMessage}
                </p>
              ) : null}
            </form>

            <div>
              {services.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-zinc-500">
                  Nenhum serviço cadastrado.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map(
                    (service) => (
                      <ItemCard
                        key={
                          service._id
                        }
                        image={
                          service.photoUrl
                        }
                        title={
                          service.name
                        }
                        subtitle={`${formatPrice(
                          service.price
                        )} • ${
                          service.duration
                        } min`}
                        active={
                          service.active
                        }
                        onEdit={() =>
                          editService(
                            service
                          )
                        }
                        onToggle={() =>
                          toggleService(
                            service
                          )
                        }
                        onDelete={() =>
                          deleteService(
                            service
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* PROFISSIONAIS */}
        <Panel
          title="Profissionais"
          className="mt-8"
        >
          <Toggle
            label="Mostrar profissionais na página"
            description="Se desligar, a seção inteira de profissionais desaparece."
            checked={
              form.showProfessionals
            }
            onChange={(value) =>
              changeField(
                "showProfessionals",
                value
              )
            }
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
            <form
              onSubmit={
                saveProfessional
              }
              className="space-y-5 rounded-2xl border border-white/10 bg-zinc-950/40 p-5"
            >
              <h3 className="font-semibold">
                {editingProfessionalId
                  ? "Editar profissional"
                  : "Novo profissional"}
              </h3>

              <UploadField
                text={
                  professionalForm.photoUrl
                    ? "Trocar foto"
                    : "Escolher foto do profissional"
                }
                uploading={
                  uploadingProfessionalPhoto
                }
                onChange={
                  handleProfessionalPhotoUpload
                }
              />

              {professionalForm.photoUrl ? (
                <div>
                  <img
                    src={
                      professionalForm.photoUrl
                    }
                    alt=""
                    className="h-52 w-full rounded-xl object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setProfessionalForm(
                        (current) => ({
                          ...current,
                          photoUrl: "",
                        })
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-red-500/30 p-2 text-sm text-red-400"
                  >
                    Remover foto
                  </button>
                </div>
              ) : null}

              <Field
                label="Nome"
                value={
                  professionalForm.name
                }
                onChange={(value) =>
                  setProfessionalForm(
                    (current) => ({
                      ...current,
                      name: value,
                    })
                  )
                }
              />

              <Field
                label="Função / cargo"
                value={
                  professionalForm.role
                }
                onChange={(value) =>
                  setProfessionalForm(
                    (current) => ({
                      ...current,
                      role: value,
                    })
                  )
                }
              />

              <Field
                label="Descrição"
                value={
                  professionalForm.description
                }
                onChange={(value) =>
                  setProfessionalForm(
                    (current) => ({
                      ...current,
                      description:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Profissional ativo"
                description="Se desligar, ele não aparece na página pública."
                checked={
                  professionalForm.active
                }
                onChange={(value) =>
                  setProfessionalForm(
                    (current) => ({
                      ...current,
                      active: value,
                    })
                  )
                }
              />

              <button
                type="submit"
                disabled={
                  savingProfessional ||
                  uploadingProfessionalPhoto
                }
                className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-zinc-950 disabled:opacity-50"
              >
                {savingProfessional
                  ? "Salvando..."
                  : editingProfessionalId
                    ? "Salvar profissional"
                    : "Adicionar profissional"}
              </button>

              {editingProfessionalId ? (
                <button
                  type="button"
                  onClick={
                    cancelProfessionalEdit
                  }
                  className="w-full rounded-xl border border-white/10 p-3"
                >
                  Cancelar
                </button>
              ) : null}

              {professionalMessage ? (
                <p className="rounded-xl border border-white/10 p-3 text-sm">
                  {professionalMessage}
                </p>
              ) : null}
            </form>

            <div>
              {professionals.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-zinc-500">
                  Nenhum profissional cadastrado.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {professionals.map(
                    (
                      professional
                    ) => (
                      <ItemCard
                        key={
                          professional._id
                        }
                        image={
                          professional.photoUrl
                        }
                        title={
                          professional.name
                        }
                        subtitle={
                          professional.role ||
                          "Profissional"
                        }
                        active={
                          professional.active
                        }
                        onEdit={() =>
                          editProfessional(
                            professional
                          )
                        }
                        onToggle={() =>
                          toggleProfessional(
                            professional
                          )
                        }
                        onDelete={() =>
                          deleteProfessional(
                            professional
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* SEÇÃO FINAL */}
        <Panel
          title="Seção final da página"
          className="mt-8"
        >
          <p className="mb-5 text-sm text-zinc-500">
            Essa é a área usada para agendamento, pedidos, reservas ou outra ação final.
          </p>

          <div className="space-y-5">
            <Toggle
              label="Mostrar esta seção na página"
              description="Se desligar, essa área desaparece da página pública."
              checked={
                form.showBookingSection
              }
              onChange={(value) =>
                changeField(
                  "showBookingSection",
                  value
                )
              }
            />

            <Field
              label="Nome pequeno da seção"
              value={
                form.bookingSectionLabel
              }
              onChange={(value) =>
                changeField(
                  "bookingSectionLabel",
                  value
                )
              }
            />

            <Field
              label="Título principal"
              value={
                form.bookingSectionTitle
              }
              onChange={(value) =>
                changeField(
                  "bookingSectionTitle",
                  value
                )
              }
            />

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Descrição
              </label>

              <textarea
                value={
                  form.bookingSectionDescription
                }
                onChange={(e) =>
                  changeField(
                    "bookingSectionDescription",
                    e.target.value
                  )
                }
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </Panel>

        {/* SALVAR */}
        <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h2 className="text-xl font-bold">
            Salvar alterações
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Depois de personalizar sua página, clique abaixo para salvar.
          </p>

          <button
            type="button"
            onClick={
              saveBusiness
            }
            disabled={
              savingBusiness ||
              uploadingLogo ||
              uploadingCover ||
              uploadingGallery
            }
            className="mt-5 w-full rounded-xl bg-emerald-500 px-6 py-4 text-lg font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {savingBusiness
              ? "Salvando..."
              : "Salvar alterações"}
          </button>

          {message ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`}
    >
      <h2 className="mb-5 text-xl font-semibold">
        {title}
      </h2>

      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-400">
        {label}
      </label>

      <div className="flex gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="h-12 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
        />

        <input
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 outline-none"
        />
      </div>
    </div>
  );
}

function UploadField({
  text,
  uploading,
  onChange,
}: {
  text: string;
  uploading: boolean;
  onChange: (
    file: File | null
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer justify-center rounded-xl border border-dashed border-white/20 bg-zinc-900 p-5 transition hover:border-emerald-500">
      {uploading
        ? "Enviando..."
        : text}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) =>
          onChange(
            e.target.files?.[0] ||
              null
          )
        }
      />
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div>
        <p className="font-medium">
          {label}
        </p>

        {description ? (
          <p className="mt-1 text-sm text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked
          )
        }
        className="h-5 w-5"
      />
    </label>
  );
}

function ItemCard({
  image,
  title,
  subtitle,
  active,
  onEdit,
  onToggle,
  onDelete,
}: {
  image: string;
  title: string;
  subtitle: string;
  active: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-zinc-900 ${
        active
          ? "border-white/10"
          : "border-red-500/20 opacity-60"
      }`}
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-zinc-950 text-zinc-600">
          Sem foto
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          {subtitle}
        </p>

        <p
          className={`mt-2 text-xs font-bold uppercase ${
            active
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {active
            ? "Ativo"
            : "Desativado"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-white/10 p-2 text-sm"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-white/10 p-2 text-sm"
          >
            {active
              ? "Desativar"
              : "Ativar"}
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="mt-2 w-full rounded-lg border border-red-500/30 p-2 text-sm text-red-400"
        >
          Excluir
        </button>
      </div>
    </div>
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
  ).format(price || 0);
}