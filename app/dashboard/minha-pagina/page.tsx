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
  const [activeEditorStep, setActiveEditorStep] = useState("geral");
  const [logoSuggestedColor, setLogoSuggestedColor] = useState<string | null>(null);

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

  const [previewOpen, setPreviewOpen] =
    useState(false);

  const [previewDevice, setPreviewDevice] =
    useState<"mobile" | "tablet" | "desktop">(
      "mobile"
    );

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

      const logoColor = await extractLogoColor(file);
      const url =
        await uploadImage(
          file,
          `saas-multi-negocio/${slug}/logo`
        );

      changeField(
        "logoUrl",
        url
      );
      if (logoColor) {
        setLogoSuggestedColor(logoColor);
        changeField("primaryColor", logoColor);
      }

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
      <main className="vellto-minha-pagina min-h-screen bg-[var(--vellto-surface-2)] p-8 text-[var(--vellto-text)]">
      <style>{`
        .vellto-minha-pagina {
          color:
            var(--vellto-text);
        }

        .vellto-minha-pagina input,
        .vellto-minha-pagina textarea,
        .vellto-minha-pagina select {
          background-color:
            var(--vellto-surface-2) !important;

          color:
            var(--vellto-text) !important;

          border-color:
            var(--vellto-border) !important;
        }

        .vellto-minha-pagina input::placeholder,
        .vellto-minha-pagina textarea::placeholder {
          color:
            var(--vellto-text-muted) !important;
        }

        .vellto-minha-pagina input:focus,
        .vellto-minha-pagina textarea:focus,
        .vellto-minha-pagina select:focus {
          border-color:
            var(--vellto-primary) !important;

          box-shadow:
            0 0 0 3px
            var(--vellto-primary-soft);
        }

        .vellto-minha-pagina select option {
          background:
            var(--vellto-surface-2);

          color:
            var(--vellto-text);
        }

        /*
        Evita blocos realmente pretos nessa página.
        */

        .vellto-minha-pagina .bg-black,
        .vellto-minha-pagina .bg-zinc-950,
        .vellto-minha-pagina .bg-slate-950 {
          background-color:
            var(--vellto-surface-2) !important;
        }
      `}</style>

        Carregando sua empresa...
      </main>
    );
  }

  if (!slug) {
    return (
      <main className="min-h-screen bg-[var(--vellto-surface-2)] px-6 py-10 text-[var(--vellto-text)]">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h1 className="text-xl font-bold">
              Empresa não encontrada
            </h1>

            <p className="mt-3 text-[var(--vellto-text-secondary)]">
              {message ||
                "Sua conta ainda não possui uma empresa vinculada."}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 rounded-xl border border-[var(--vellto-border)] px-5 py-3"
            >
              Sair
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--vellto-surface-2)] pb-36 text-[var(--vellto-text)] sm:pb-10">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-10">
        {/* CABEÇALHO */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--vellto-primary)]">
              Personalização
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Minha página
            </h1>

            <p className="mt-2 text-[var(--vellto-text-secondary)]">
              {businessName ||
                form.name}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={() =>
                setPreviewOpen(true)
              }
              className="min-h-11 rounded-xl bg-[var(--vellto-primary)] px-5 py-3 text-sm font-bold text-[var(--vellto-on-primary)] transition hover:brightness-110"
            >
              👁 Ver prévia
            </button>

            <a
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="min-h-11 rounded-xl border border-[var(--vellto-border)] px-5 py-3 text-center text-sm font-medium transition hover:bg-white/5"
            >
              Ver página publicada ↗
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-11 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Sair
            </button>
          </div>
        </div>

        {/* GUIA DE CONFIGURAÇÃO */}
        <section className="mb-7 rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Vamos montar sua página</p>
              <p className="mt-1 text-xs leading-5 text-[var(--vellto-text-muted)]">Siga as etapas. Você pode voltar e mudar tudo antes de publicar.</p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--vellto-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--vellto-primary)]">5 etapas</span>
          </div>
          <div className="mb-4 grid grid-cols-5 gap-1" aria-hidden="true">
            {["geral", "aparencia", "galeria", "sobre", "agendamento"].map((step) => (
              <span key={step} className={`h-1.5 rounded-full ${activeEditorStep === step ? "bg-[var(--vellto-primary)]" : "bg-[var(--vellto-border-strong)]"}`} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { href: "#geral", id: "geral", number: "01", title: "Seu negócio", detail: "Nome e contato", icon: "⌂", done: Boolean(form.name.trim() && form.whatsapp.trim()) },
              { href: "#aparencia", id: "aparencia", number: "02", title: "Visual", detail: "Logo e cores", icon: "✦", done: Boolean(form.logoUrl) },
              { href: "#galeria", id: "galeria", number: "03", title: "Fotos", detail: "Capa e galeria", icon: "▧", done: Boolean(form.coverUrl || form.gallery.length) },
              { href: "#sobre", id: "sobre", number: "04", title: "Conteúdo", detail: "Apresentação", icon: "✎", done: Boolean(form.description.trim()) },
              { href: "#agendamento", id: "agendamento", number: "05", title: "Ação principal", detail: "Como receber contatos", icon: "↗", done: Boolean(form.mainButtonText.trim()) },
            ].map((step) => (
              <a key={step.number} href={step.href} onClick={() => setActiveEditorStep(step.id)} aria-current={activeEditorStep === step.id ? "step" : undefined}
                className={`group flex min-h-[94px] flex-col rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vellto-primary)] ${activeEditorStep === step.id ? "border-[var(--vellto-primary)] bg-[var(--vellto-primary-soft)]" : "border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] hover:border-[var(--vellto-primary)]/60"}`}>
                <span className="flex w-full items-center justify-between">
                  <span className="text-lg text-[var(--vellto-primary)]" aria-hidden="true">{step.icon}</span>
                  <span className={`text-[10px] font-bold tracking-wider ${step.done ? "text-emerald-500" : "text-[var(--vellto-text-muted)]"}`}>{step.done ? "✓ Feito" : step.number}</span>
                </span>
                <span className="mt-2 text-xs font-bold text-[var(--vellto-text)]">{step.title}</span>
                <span className="mt-0.5 text-[10px] leading-4 text-[var(--vellto-text-muted)]">{step.detail}</span>
              </a>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[var(--vellto-text-muted)]">As etapas marcadas como “Feito” já têm informações preenchidas. Revise e publique quando estiver satisfeito.</p>
        </section>

        {/* INFORMAÇÕES */}
        <div id="geral" className="scroll-mt-28">
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
              <label className="mb-2 block text-sm text-[var(--vellto-text-secondary)]">
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
                className="w-full resize-none rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] px-4 py-3 outline-none focus:border-[var(--vellto-primary)]"
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

        </div>

        {/* SOBRE NÓS */}
        <div id="sobre" className="scroll-mt-28">
          <Panel
            title="Sobre nós"
            className="mt-8"
          >
            <div>
              <label className="mb-2 block text-sm text-[var(--vellto-text-secondary)]">
                Conte a história e os diferenciais do seu negócio
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  changeField(
                    "description",
                    e.target.value
                  )
                }
                rows={7}
                placeholder="Ex: Somos especializados em oferecer uma experiência de atendimento completa, com qualidade, conforto e atenção aos detalhes."
                className="w-full resize-none rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] px-4 py-3 leading-7 outline-none transition focus:border-[var(--vellto-primary)]"
              />

              <p className="mt-2 text-xs text-[var(--vellto-text-muted)]">
                Esse texto será exibido na seção Sobre nós da página pública.
              </p>
            </div>
          </Panel>
        </div>

        {/* BOTÃO PRINCIPAL */}
        <div id="agendamento" className="scroll-mt-28">
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
              <label className="mb-2 block text-sm text-[var(--vellto-text-secondary)]">
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
                className="w-full rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] px-4 py-3 outline-none"
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

        </div>

        {/* CORES */}
        <div id="aparencia" className="scroll-mt-28">
        <Panel
          title="Cores"
          className="mt-8"
        >
          {logoSuggestedColor ? (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--vellto-primary)]/30 bg-[var(--vellto-primary-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 shrink-0 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: logoSuggestedColor }} />
                <div><p className="text-sm font-semibold">Cor identificada na sua logo</p><p className="text-xs text-[var(--vellto-text-muted)]">Use esta cor como destaque da página.</p></div>
              </div>
              <button type="button" onClick={() => changeField("primaryColor", logoSuggestedColor)} className="min-h-11 rounded-xl border border-[var(--vellto-primary)]/40 px-4 py-2 text-sm font-bold">Usar cor da logo</button>
            </div>
          ) : null}
          <div className="mb-5 rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)]/50 p-4">
            <p className="text-sm font-semibold text-[var(--vellto-text)]">Combinações prontas</p>
            <p className="mt-1 text-xs leading-5 text-[var(--vellto-text-muted)]">
              Escolha uma identidade visual como ponto de partida. Você pode ajustar cada cor manualmente logo abaixo.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { name: "Moderno", primary: "#16a34a", secondary: "#14251d", background: "#07120d", text: "#ffffff" },
                { name: "Elegante", primary: "#c59b55", secondary: "#29231d", background: "#100e0c", text: "#ffffff" },
                { name: "Beleza", primary: "#d96c91", secondary: "#35232d", background: "#160f14", text: "#ffffff" },
                { name: "Claro", primary: "#2563eb", secondary: "#e8edf5", background: "#f7f9fc", text: "#172033" },
              ].map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => setForm((current) => ({
                    ...current,
                    primaryColor: palette.primary,
                    secondaryColor: palette.secondary,
                    backgroundColor: palette.background,
                    textColor: palette.text,
                  }))}
                  className="flex min-h-[76px] flex-col items-start justify-between rounded-xl border border-[var(--vellto-border)] p-3 text-left transition hover:border-[var(--vellto-primary)]"
                >
                  <span className="text-xs font-semibold text-[var(--vellto-text)]">{palette.name}</span>
                  <span className="flex gap-1.5" aria-hidden="true">
                    {[palette.primary, palette.secondary, palette.background].map((color) => (
                      <span key={color} className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="mt-5 rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] p-4" style={{ backgroundColor: form.backgroundColor, color: form.textColor }}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Prévia das cores</p>
            <div className="mt-3 flex items-center gap-2"><span className="h-7 w-7 rounded-lg" style={{ backgroundColor: form.primaryColor }} /><span className="h-7 w-7 rounded-lg" style={{ backgroundColor: form.secondaryColor }} /><span className="h-7 w-7 rounded-lg border border-black/10" style={{ backgroundColor: form.backgroundColor }} /><span className="text-xs opacity-70">Destaques e fundo da sua página</span></div>
            <button type="button" className="mt-4 min-h-10 rounded-xl px-4 py-2 text-xs font-bold" style={{ backgroundColor: form.primaryColor, color: form.backgroundColor }}>{form.mainButtonText || "Agendar agora"}</button>
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

        </div>

        {/* GALERIA */}
        <div id="galeria" className="scroll-mt-28">
        <Panel
          title="Galeria"
          className="mt-8"
        >
          <label className="flex cursor-pointer justify-center rounded-xl border border-dashed border-[var(--vellto-border-strong)] bg-[var(--vellto-surface-2)] p-5">
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
                  className="rounded-xl border border-[var(--vellto-border)] p-3"
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

        </div>

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

          <p className="mt-2 text-xs text-[var(--vellto-text-muted)]">
            Ex: Escolha seu corte, Confira nosso cardápio, Nossos produtos.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
            <form
              onSubmit={
                saveService
              }
              className="space-y-5 rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)]/40 p-5"
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
                  className="w-full rounded-xl border border-[var(--vellto-border)] p-3"
                >
                  Cancelar
                </button>
              ) : null}

              {serviceMessage ? (
                <p className="rounded-xl border border-[var(--vellto-border)] p-3 text-sm">
                  {serviceMessage}
                </p>
              ) : null}
            </form>

            <div>
              {services.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--vellto-border-strong)] p-10 text-center text-[var(--vellto-text-muted)]">
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
              className="space-y-5 rounded-2xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)]/40 p-5"
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
                  className="w-full rounded-xl border border-[var(--vellto-border)] p-3"
                >
                  Cancelar
                </button>
              ) : null}

              {professionalMessage ? (
                <p className="rounded-xl border border-[var(--vellto-border)] p-3 text-sm">
                  {professionalMessage}
                </p>
              ) : null}
            </form>

            <div>
              {professionals.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--vellto-border-strong)] p-10 text-center text-[var(--vellto-text-muted)]">
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
          <p className="mb-5 text-sm text-[var(--vellto-text-muted)]">
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
              <label className="mb-2 block text-sm text-[var(--vellto-text-secondary)]">
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
                className="w-full resize-none rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] px-4 py-3 outline-none focus:border-[var(--vellto-primary)]"
              />
            </div>
          </div>
        </Panel>

        {/* SALVAR */}
        <div className="mt-10 rounded-2xl border border-[var(--vellto-primary)]/20 bg-[var(--vellto-primary-soft)] p-4 sm:p-6">
          <h2 className="text-lg font-bold sm:text-xl">Quase pronto!</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--vellto-text-secondary)]">
            Confira a aparência da sua página e salve para publicar as alterações. Suas mudanças ficam como rascunho nesta tela até você tocar em salvar.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="min-h-12 rounded-xl border border-[var(--vellto-border)] px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
            >
              👁 Conferir minha página
            </button>
            <button
              type="button"
              onClick={saveBusiness}
              disabled={savingBusiness || uploadingLogo || uploadingCover || uploadingGallery}
              className="min-h-12 rounded-xl bg-[var(--vellto-primary)] px-6 py-3 text-sm font-bold text-[var(--vellto-on-primary)] transition hover:brightness-110 disabled:opacity-50"
            >
              {savingBusiness ? "Salvando..." : "Salvar e publicar alterações"}
            </button>
          </div>
          {message ? (
            <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)]/60 p-4 text-sm">
              {message}
            </p>
          ) : null}
        </div>
      </div>


      {/* AÇÃO FIXA NO CELULAR: SALVAR SEM VOLTAR AO FIM DA PÁGINA */}
      <div className="fixed inset-x-0 bottom-[76px] z-30 border-t border-[var(--vellto-border)] bg-[var(--vellto-surface)]/95 p-3 shadow-2xl backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="min-h-12 flex-1 rounded-xl border border-[var(--vellto-border)] px-3 text-sm font-semibold"
          >
            Prévia
          </button>
          <button
            type="button"
            onClick={saveBusiness}
            disabled={savingBusiness || uploadingLogo || uploadingCover || uploadingGallery}
            className="min-h-12 flex-[1.5] rounded-xl bg-[var(--vellto-primary)] px-3 text-sm font-bold text-[var(--vellto-on-primary)] disabled:opacity-50"
          >
            {savingBusiness ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--vellto-surface-2)]/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] px-4 py-3 sm:px-6">
            <div>
              <p className="text-sm font-bold text-[var(--vellto-text)]">
                Prévia da página
              </p>

              <p className="text-xs text-[var(--vellto-text-muted)]">
                As alterações ainda não precisam estar salvas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] p-1">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDevice(
                      "mobile"
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    previewDevice ===
                    "mobile"
                      ? "bg-emerald-500 text-zinc-950"
                      : "text-[var(--vellto-text-secondary)] hover:text-[var(--vellto-text)]"
                  }`}
                >
                  Celular
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewDevice(
                      "tablet"
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    previewDevice ===
                    "tablet"
                      ? "bg-emerald-500 text-zinc-950"
                      : "text-[var(--vellto-text-secondary)] hover:text-[var(--vellto-text)]"
                  }`}
                >
                  Tablet
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewDevice(
                      "desktop"
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    previewDevice ===
                    "desktop"
                      ? "bg-emerald-500 text-zinc-950"
                      : "text-[var(--vellto-text-secondary)] hover:text-[var(--vellto-text)]"
                  }`}
                >
                  Computador
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewOpen(false)
                }
                className="rounded-xl border border-[var(--vellto-border)] px-4 py-2 text-sm font-semibold text-[var(--vellto-text)] transition hover:bg-white/5"
              >
                Fechar ✕
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 justify-center overflow-y-auto bg-[var(--vellto-surface-2)] p-3 sm:p-6">
            <div
              className={`h-max min-h-full overflow-hidden bg-white shadow-2xl transition-all duration-300 ${
                previewDevice ===
                "mobile"
                  ? "w-[390px] max-w-full rounded-[32px]"
                  : previewDevice ===
                      "tablet"
                    ? "w-[768px] max-w-full rounded-[24px]"
                    : "w-full max-w-[1440px] rounded-xl"
              }`}
            >
              <PublicPagePreview
                form={form}
                services={services}
                professionals={
                  professionals
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function PublicPagePreview({
  form,
  services,
  professionals,
}: {
  form: BusinessForm;
  services: Service[];
  professionals: Professional[];
}) {
  const activeServices =
    services.filter(
      (service) =>
        service.active !== false
    );

  const activeProfessionals =
    professionals.filter(
      (professional) =>
        professional.active !==
        false
    );

  return (
    <div
      className="min-h-full"
      style={{
        backgroundColor:
          form.backgroundColor,
        color: form.textColor,
      }}
    >
      <div
        className="relative min-h-[360px] overflow-hidden"
        style={{
          backgroundColor:
            form.secondaryColor,
        }}
      >
        {form.coverUrl ? (
          <img
            src={form.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        <div className="relative mx-auto flex min-h-[360px] max-w-6xl flex-col justify-end px-5 py-10 sm:px-8">
          {form.logoUrl ? (
            <img
              src={form.logoUrl}
              alt=""
              className="mb-5 h-20 w-20 rounded-2xl border-2 border-[var(--vellto-border-strong)] object-cover shadow-xl"
            />
          ) : (
            <div
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black shadow-xl"
              style={{
                backgroundColor:
                  form.primaryColor,
                color:
                  form.backgroundColor,
              }}
            >
              {form.name
                ?.charAt(0)
                .toUpperCase() || "V"}
            </div>
          )}

          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{
              color:
                form.primaryColor,
            }}
          >
            {form.category ||
              "Seu negócio"}
          </p>

          <h1 className="mt-2 max-w-3xl text-3xl font-black sm:text-5xl">
            {form.name ||
              "Nome do seu negócio"}
          </h1>

          {form.description ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 opacity-80 sm:text-base">
              {form.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl px-6 py-3 text-sm font-bold shadow-lg"
              style={{
                backgroundColor:
                  form.primaryColor,
                color:
                  form.backgroundColor,
              }}
            >
              {form.mainButtonText ||
                "Agendar agora"}
            </button>

            {form.whatsapp ? (
              <button
                type="button"
                className="rounded-xl border border-[var(--vellto-border-strong)] bg-[var(--vellto-surface-2)]/20 px-6 py-3 text-sm font-semibold"
              >
                WhatsApp
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {(form.address ||
          form.instagram ||
          form.whatsapp) && (
          <div className="grid gap-3 sm:grid-cols-3">
            {form.address ? (
              <PreviewInfo
                title="Localização"
                value={form.address}
              />
            ) : null}

            {form.whatsapp ? (
              <PreviewInfo
                title="WhatsApp"
                value={
                  form.whatsapp
                }
              />
            ) : null}

            {form.instagram ? (
              <PreviewInfo
                title="Instagram"
                value={
                  form.instagram
                }
              />
            ) : null}
          </div>
        )}

        {form.description ? (
          <section className="py-14">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                color:
                  form.primaryColor,
              }}
            >
              Sobre nós
            </p>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Conheça nosso negócio
            </h2>

            <p className="mt-5 max-w-3xl leading-8 opacity-70">
              {form.description}
            </p>
          </section>
        ) : null}

        <section className="py-10">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{
              color:
                form.primaryColor,
            }}
          >
            Serviços
          </p>

          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            {form.servicesTitle ||
              "Nossos serviços"}
          </h2>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeServices.length >
            0 ? (
              activeServices
                .slice(0, 6)
                .map((service) => (
                  <div
                    key={
                      service._id
                    }
                    className="overflow-hidden rounded-2xl border border-[var(--vellto-border)]"
                    style={{
                      backgroundColor:
                        form.secondaryColor,
                    }}
                  >
                    {service.photoUrl ? (
                      <img
                        src={
                          service.photoUrl
                        }
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-40"
                        style={{
                          backgroundColor:
                            form.primaryColor +
                            "20",
                        }}
                      />
                    )}

                    <div className="p-5">
                      <h3 className="font-bold">
                        {
                          service.name
                        }
                      </h3>

                      {service.description ? (
                        <p className="mt-2 text-sm opacity-60">
                          {
                            service.description
                          }
                        </p>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <strong
                          style={{
                            color:
                              form.primaryColor,
                          }}
                        >
                          {formatPrice(
                            service.price
                          )}
                        </strong>

                        <span className="text-xs opacity-60">
                          {
                            service.duration
                          }{" "}
                          min
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--vellto-border-strong)] p-8 text-sm opacity-50 sm:col-span-2 lg:col-span-3">
                Seus serviços aparecerão
                aqui.
              </div>
            )}
          </div>
        </section>

        {form.showProfessionals ? (
          <section className="py-10">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                color:
                  form.primaryColor,
              }}
            >
              Equipe
            </p>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Nossos profissionais
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeProfessionals
                .slice(0, 6)
                .map(
                  (
                    professional
                  ) => (
                    <div
                      key={
                        professional._id
                      }
                      className="rounded-2xl border border-[var(--vellto-border)] p-5"
                      style={{
                        backgroundColor:
                          form.secondaryColor,
                      }}
                    >
                      {professional.photoUrl ? (
                        <img
                          src={
                            professional.photoUrl
                          }
                          alt=""
                          className="h-52 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-52 items-center justify-center rounded-xl text-4xl font-black"
                          style={{
                            backgroundColor:
                              form.primaryColor +
                              "20",
                            color:
                              form.primaryColor,
                          }}
                        >
                          {professional.name
                            ?.charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>
                      )}

                      <h3 className="mt-4 font-bold">
                        {
                          professional.name
                        }
                      </h3>

                      <p className="mt-1 text-sm opacity-60">
                        {professional.role ||
                          "Profissional"}
                      </p>
                    </div>
                  )
                )}

              {activeProfessionals.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--vellto-border-strong)] p-8 text-sm opacity-50 sm:col-span-2 lg:col-span-3">
                  Seus profissionais
                  aparecerão aqui.
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {form.gallery.length >
        0 ? (
          <section className="py-10">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                color:
                  form.primaryColor,
              }}
            >
              Galeria
            </p>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Nosso espaço
            </h2>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.gallery
                .slice(0, 6)
                .map(
                  (
                    photo,
                    index
                  ) => (
                    <img
                      key={`${photo}-${index}`}
                      src={photo}
                      alt=""
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                  )
                )}
            </div>
          </section>
        ) : null}

        {form.showBookingSection ? (
          <section
            className="my-10 rounded-3xl p-6 sm:p-10"
            style={{
              backgroundColor:
                form.secondaryColor,
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                color:
                  form.primaryColor,
              }}
            >
              {form.bookingSectionLabel ||
                "Agendamento"}
            </p>

            <h2 className="mt-3 text-2xl font-black sm:text-4xl">
              {form.bookingSectionTitle ||
                "Escolha seu horário"}
            </h2>

            <p className="mt-4 max-w-2xl leading-7 opacity-60">
              {form.bookingSectionDescription}
            </p>

            <button
              type="button"
              className="mt-6 rounded-xl px-6 py-3 text-sm font-bold"
              style={{
                backgroundColor:
                  form.primaryColor,
                color:
                  form.backgroundColor,
              }}
            >
              {form.mainButtonText ||
                "Agendar agora"}
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function PreviewInfo({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--vellto-border)] bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wider opacity-50">
        {title}
      </p>

      <p className="mt-2 break-words text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

async function extractLogoColor(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      bitmap.close();
      return null;
    }

    const size = 48;
    canvas.width = size;
    canvas.height = size;
    context.drawImage(bitmap, 0, 0, size, size);
    bitmap.close();

    const pixels = context.getImageData(0, 0, size, size).data;
    const buckets = new Map<string, { count: number; r: number; g: number; b: number; saturation: number }>();

    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 150) continue;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const brightness = (r + g + b) / 3;
      const saturation = max === 0 ? 0 : (max - min) / max;
      if (brightness > 242 || brightness < 28 || saturation < 0.16) continue;

      const key = [r, g, b].map((value) => Math.round(value / 24) * 24).join("-");
      const current = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0, saturation: 0 };
      current.count += 1;
      current.r += r;
      current.g += g;
      current.b += b;
      current.saturation += saturation;
      buckets.set(key, current);
    }

    const dominant = [...buckets.values()].sort((a, b) =>
      b.count * (1 + b.saturation * 0.35) - a.count * (1 + a.saturation * 0.35)
    )[0];

    if (!dominant) return null;
    const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");
    return `#${toHex(dominant.r / dominant.count)}${toHex(dominant.g / dominant.count)}${toHex(dominant.b / dominant.count)}`;
  } catch (error) {
    console.warn("Não foi possível identificar a cor da logo:", error);
    return null;
  }
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
      className={`rounded-2xl border border-[var(--vellto-border)] bg-white/5 p-4 sm:p-6 ${className}`}
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
      <label className="mb-2 block text-sm text-[var(--vellto-text-secondary)]">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] px-4 py-3 outline-none focus:border-[var(--vellto-primary)]"
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
      <label className="mb-2 block text-sm text-[var(--vellto-text-secondary)]">
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
          className="h-12 w-14 cursor-pointer rounded-lg border border-[var(--vellto-border)] bg-transparent p-1"
        />

        <input
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="min-w-0 flex-1 rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] px-3 py-3 outline-none"
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
    <label className="flex cursor-pointer justify-center rounded-xl border border-dashed border-[var(--vellto-border-strong)] bg-[var(--vellto-surface-2)] p-5 transition hover:border-[var(--vellto-primary)]">
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
    <label className="flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-[var(--vellto-border)] bg-[var(--vellto-surface-2)] p-4">
      <div>
        <p className="font-medium">
          {label}
        </p>

        {description ? (
          <p className="mt-1 text-sm text-[var(--vellto-text-muted)]">
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
      className={`overflow-hidden rounded-2xl border bg-[var(--vellto-surface-2)] ${
        active
          ? "border-[var(--vellto-border)]"
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
        <div className="flex h-44 items-center justify-center bg-[var(--vellto-surface-2)] text-[var(--vellto-text-muted)]">
          Sem foto
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-[var(--vellto-text-muted)]">
          {subtitle}
        </p>

        <p
          className={`mt-2 text-xs font-bold uppercase ${
            active
              ? "text-[var(--vellto-primary)]"
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
            className="rounded-lg border border-[var(--vellto-border)] p-2 text-sm"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-[var(--vellto-border)] p-2 text-sm"
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