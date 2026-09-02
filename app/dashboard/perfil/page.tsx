"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Profile = {
  name: string;
  email: string;
  phone: string;
  description: string;
  photoUrl: string;
  role: string;
  commission: number;
  userRole: string;
};

const emptyProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  description: "",
  photoUrl: "",
  role: "",
  commission: 0,
  userRole: "",
};

export default function PerfilPage() {
  const router =
    useRouter();

  const [
    profile,
    setProfile,
  ] =
    useState<Profile>(
      emptyProfile
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/dashboard/profile",
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao carregar perfil"
        );

        return;
      }

      setProfile({
        ...emptyProfile,
        ...data.profile,
      });
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao carregar perfil"
      );
    } finally {
      setLoading(false);
    }
  }

  function updateProfile(
    field:
      keyof Profile,
    value:
      string | number
  ) {
    setProfile(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  async function uploadPhoto(
    file: File
  ) {
    try {
      setUploading(true);
      setMessage("");
      setSuccess("");

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "folder",
        "vellto-agenda/profissionais"
      );

      const response =
        await fetch(
          "/api/upload",
          {
            method:
              "POST",
            body:
              formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao enviar foto"
        );

        return;
      }

      updateProfile(
        "photoUrl",
        data.url || ""
      );

      setSuccess(
        "Foto enviada. Clique em Salvar perfil."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao enviar foto"
      );
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (
      newPassword &&
      newPassword !==
        confirmPassword
    ) {
      setMessage(
        "A confirmação da nova senha não confere."
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccess("");

      const response =
        await fetch(
          "/api/dashboard/profile",
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  profile.name,

                email:
                  profile.email,

                phone:
                  profile.phone,

                description:
                  profile.description,

                photoUrl:
                  profile.photoUrl,

                currentPassword,

                newPassword,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao atualizar perfil"
        );

        return;
      }

      setSuccess(
        data.message ||
          "Perfil atualizado com sucesso."
      );

      setCurrentPassword(
        ""
      );

      setNewPassword(
        ""
      );

      setConfirmPassword(
        ""
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        "Erro ao atualizar perfil"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center text-zinc-500">
          Carregando perfil...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-sm text-zinc-500">
            Minha conta
          </p>

          <h1 className="mt-1 text-xl font-bold sm:text-2xl">
            Meu perfil
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Atualize suas informações pessoais e sua senha.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {message ? (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.photoUrl ? (
              <img
                src={
                  profile.photoUrl
                }
                alt={
                  profile.name
                }
                className="h-28 w-28 rounded-3xl object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-emerald-500/10 text-4xl font-black text-emerald-400">
                {profile.name
                  .charAt(0)
                  .toUpperCase() ||
                  "P"}
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold">
                Foto de perfil
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                A foto também poderá aparecer na página pública.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950">
                  {uploading
                    ? "Enviando..."
                    : "Alterar foto"}

                  <input
                    type="file"
                    accept="image/*"
                    disabled={
                      uploading
                    }
                    onChange={(
                      event
                    ) => {
                      const file =
                        event.target
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

                {profile.photoUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateProfile(
                        "photoUrl",
                        ""
                      )
                    }
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm"
                  >
                    Remover foto
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {profile.userRole ===
          "employee" ? (
            <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-500">
                  Cargo
                </p>

                <p className="mt-1 font-semibold">
                  {profile.role ||
                    "Profissional"}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500">
                  Comissão
                </p>

                <p className="mt-1 font-semibold text-emerald-400">
                  {Number(
                    profile.commission ||
                      0
                  ).toLocaleString(
                    "pt-BR"
                  )}
                  %
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field
              label="Nome"
              value={
                profile.name
              }
              onChange={(
                value
              ) =>
                updateProfile(
                  "name",
                  value
                )
              }
            />

            <Field
              label="E-mail de acesso"
              type="email"
              value={
                profile.email
              }
              onChange={(
                value
              ) =>
                updateProfile(
                  "email",
                  value
                )
              }
            />

            <Field
              label="Telefone"
              value={
                profile.phone
              }
              onChange={(
                value
              ) =>
                updateProfile(
                  "phone",
                  value
                )
              }
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              Sobre mim
            </label>

            <textarea
              rows={4}
              value={
                profile.description
              }
              onChange={(
                event
              ) =>
                updateProfile(
                  "description",
                  event.target.value
                )
              }
              placeholder="Especialidades, experiência, apresentação..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <h2 className="font-bold">
            Alterar senha
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Só preencha esta parte quando quiser trocar sua senha.
          </p>

          <div className="mt-5 grid gap-5">
            <Field
              label="Senha atual"
              type="password"
              value={
                currentPassword
              }
              onChange={
                setCurrentPassword
              }
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nova senha"
                type="password"
                value={
                  newPassword
                }
                onChange={
                  setNewPassword
                }
                placeholder="Mínimo 6 caracteres"
              />

              <Field
                label="Confirmar nova senha"
                type="password"
                value={
                  confirmPassword
                }
                onChange={
                  setConfirmPassword
                }
              />
            </div>
          </div>
        </section>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={
              saving ||
              uploading
            }
            onClick={save}
            className="min-h-[48px] w-full rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
          >
            {saving
              ? "Salvando..."
              : "Salvar perfil"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange:
    (value: string) =>
      void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#0b1620] px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
      />
    </div>
  );
}
