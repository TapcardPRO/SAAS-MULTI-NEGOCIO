import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("saas_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  const db = await getDb();

  const user =
    session?.userId && ObjectId.isValid(session.userId)
      ? await db.collection("users").findOne({
          _id: new ObjectId(session.userId),
        })
      : null;

  if (user?.role === "employee") {
    redirect("/dashboard/agenda");
  }

  const businessId =
    user?.businessId && ObjectId.isValid(String(user.businessId))
      ? new ObjectId(String(user.businessId))
      : null;

  const business = businessId
    ? await db.collection("businesses").findOne({ _id: businessId })
    : null;

  const today = getToday();
  const tenantFilters = businessId
    ? [
        { businessId },
        { businessId: businessId.toString() },
        ...(business?.slug ? [{ businessSlug: business.slug }] : []),
      ]
    : [];

  const appointmentFilter = {
    $and: [
      { $or: tenantFilters },
      { date: today },
    ],
  };

  // Os indicadores usam a agenda inteira; a lista visual continua limitada
  // aos seis próximos atendimentos para manter o painel rápido.
  const [
    appointments,
    appointmentsToday,
    completedToday,
    revenueRows,
    totalClients,
  ] = businessId
    ? await Promise.all([
        db.collection("appointments")
          .find(appointmentFilter)
          .sort({ startTime: 1, time: 1 })
          .limit(6)
          .toArray(),
        db.collection("appointments").countDocuments(appointmentFilter),
        db.collection("appointments").countDocuments({
          $and: [
            { $or: tenantFilters },
            { date: today },
            { status: { $in: ["completed", "concluido", "concluído"] } },
          ],
        }),
        db.collection("appointments").aggregate([
          {
            $match: {
              $and: [
                { $or: tenantFilters },
                { date: today },
                { status: { $in: ["completed", "concluido", "concluído"] } },
              ],
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $convert: {
                    input: { $ifNull: ["$servicePrice", "$price"] },
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        ]).toArray(),
        db.collection("clients").countDocuments({
          $or: tenantFilters,
        }),
      ])
    : [[], 0, 0, [], 0];

  const revenueToday = Number(revenueRows[0]?.total || 0);

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Painel da empresa</p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">Visão geral</h1>
          </div>
          <a
            href={business?.slug ? `/${business.slug}` : "#"}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 sm:block"
          >
            Ver página pública ↗
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Bem-vindo de volta!</h2>
          <p className="mt-1 text-sm text-zinc-500">Veja o resumo do seu negócio hoje.</p>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <MetricCard title="Agendamentos hoje" value={String(appointmentsToday)} detail="Todos os horários da agenda" />
          <MetricCard title="Concluídos hoje" value={String(completedToday)} detail="Atendimentos realizados" />
          <MetricCard title="Faturamento hoje" value={formatPrice(revenueToday)} detail="Atendimentos concluídos" />
          <MetricCard title="Clientes cadastrados" value={String(totalClients)} detail="Base total de clientes" />
        </div>

        <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
              <div>
                <h2 className="font-bold">Próximos agendamentos</h2>
                <p className="mt-1 text-xs text-zinc-500">Até seis próximos atendimentos de hoje</p>
              </div>
              <Link href="/dashboard/agenda" className="text-sm font-semibold text-emerald-400">Ver todos</Link>
            </div>

            {appointments.length === 0 ? (
              <div className="p-6 text-center sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-xl">◷</div>
                <h3 className="mt-4 font-semibold">Nenhum agendamento hoje</h3>
                <p className="mt-2 text-sm text-zinc-500">Seus próximos agendamentos aparecerão aqui.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id.toString()}
                    className="grid gap-3 p-4 sm:grid-cols-[70px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:p-5"
                  >
                    <div className="font-bold">{appointment.startTime || appointment.time || "--:--"}</div>
                    <div>
                      <p className="font-medium">{appointment.clientName || "Cliente"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{appointment.clientPhone || ""}</p>
                    </div>
                    <div>
                      <p className="text-sm">{appointment.serviceName || "Serviço"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{appointment.professionalName || "Profissional"}</p>
                    </div>
                    <StatusBadge status={appointment.status || "pending"} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <h2 className="font-bold">Atalhos rápidos</h2>
            <p className="mt-1 text-xs text-zinc-500">Acesse as principais funções.</p>
            <div className="mt-5 space-y-3">
              <QuickLink href="/dashboard/agenda?novo=1" title="Novo agendamento" icon="+" primary />
              <QuickLink href="/dashboard/clientes" title="Clientes" icon="♙" />
              <QuickLink href="/dashboard/servicos" title="Gerenciar serviços" icon="▤" />
              <QuickLink href="/dashboard/profissionais" title="Gerenciar profissionais" icon="♧" />
              <QuickLink href="/dashboard/horarios" title="Configurar horários" icon="◷" />
              <QuickLink href="/dashboard/financeiro" title="Ver financeiro" icon="◉" />
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent p-4 sm:mt-6 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Sua página pública</p>
              <h2 className="mt-2 text-xl font-bold">{business?.name || "Minha empresa"}</h2>
              <p className="mt-2 text-sm text-zinc-400">Personalize sua página, serviços e profissionais.</p>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap">
              <Link href="/dashboard/minha-pagina" className="flex min-h-[46px] items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-zinc-950 sm:px-5">
                Personalizar
              </Link>
              {business?.slug ? (
                <a href={`/${business.slug}`} target="_blank" rel="noreferrer" className="flex min-h-[46px] items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-center text-sm sm:px-5">
                  Visualizar
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-2 break-words text-2xl font-bold tracking-tight sm:mt-3 sm:text-3xl">{value}</p>
      <p className="mt-3 text-xs text-emerald-400">{detail}</p>
    </div>
  );
}

function QuickLink({ href, title, icon, primary = false }: { href: string; title: string; icon: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-[46px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        primary
          ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          : "border border-white/10 bg-white/[0.025] text-zinc-300 hover:bg-white/5"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/10">{icon}</span>
      {title}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let label = "Pendente";
  let className = "bg-amber-500/10 text-amber-400";

  if (normalized === "confirmed" || normalized === "confirmado") {
    label = "Confirmado";
    className = "bg-emerald-500/10 text-emerald-400";
  }
  if (normalized === "completed" || normalized === "concluido" || normalized === "concluído") {
    label = "Concluído";
    className = "bg-blue-500/10 text-blue-400";
  }
  if (normalized === "cancelled" || normalized === "cancelado") {
    label = "Cancelado";
    className = "bg-red-500/10 text-red-400";
  }
  if (normalized === "no_show" || normalized === "faltou") {
    label = "Faltou";
    className = "bg-zinc-500/10 text-zinc-400";
  }

  return <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function getToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
