import type { Metadata } from "next";
import { VelltoDemoSite, type DemoModel } from "../components/VelltoDemoSite";

export const metadata: Metadata = {
  title: "Demonstração de página pública | Vellto Agenda",
  description: "Conheça uma demonstração de página pública da Vellto para barbearias, salões de beleza e manicures. Agendamentos apenas simulados.",
  robots: { index: false, follow: false },
};

export default async function DemonstracaoPage({ searchParams }: {
  searchParams: Promise<{ modelo?: string }>;
}) {
  const params = await searchParams;
  const requested = params.modelo;
  const model: DemoModel = requested === "salao" || requested === "manicure" ? requested : "barbearia";
  return <VelltoDemoSite key={model} model={model} />;
}
