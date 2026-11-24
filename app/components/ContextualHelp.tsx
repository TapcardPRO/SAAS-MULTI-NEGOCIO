"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  role: string;
};

type HelpContent = {
  title: string;
  description: string;
  tip: string;
};

const helpByRoute: Array<{ match: string; owner: HelpContent; employee?: HelpContent }> = [
  {
    match: "/dashboard/agenda",
    owner: {
      title: "Como usar sua agenda",
      description: "Acompanhe os atendimentos do dia, crie reservas, confirme presenças e atualize o andamento de cada atendimento.",
      tip: "Para criar um horário, escolha o cliente, o serviço, o profissional e um horário disponível. Confira os dados antes de salvar.",
    },
    employee: {
      title: "Sua agenda de atendimentos",
      description: "Aqui você acompanha seus atendimentos e pode organizar os agendamentos permitidos pelo estabelecimento.",
      tip: "Mantenha os status atualizados para que a equipe saiba quais clientes chegaram, foram atendidos ou precisam remarcar.",
    },
  },
  {
    match: "/dashboard/horarios",
    owner: {
      title: "Como configurar os horários",
      description: "Escolha o profissional e defina os dias de atendimento, início, término, intervalos e bloqueios de datas.",
      tip: "Cada profissional pode ter uma rotina diferente. Salve as alterações depois de ajustar a semana.",
    },
    employee: {
      title: "Você controla seus próprios horários",
      description: "Altere seus dias de atendimento, horário de início e término, intervalos, folgas e bloqueios de datas.",
      tip: "Suas alterações afetam sua disponibilidade para novos agendamentos. Você não consegue alterar a agenda de outros profissionais.",
    },
  },
  {
    match: "/dashboard/mensalistas",
    owner: {
      title: "Como funcionam os mensalistas",
      description: "Cadastre clientes com planos, acompanhe utilizações, saldo de atendimentos e situação dos pagamentos.",
      tip: "Confira o plano e o cliente antes de cadastrar. O Vellto registra os dados do pacote para acompanhar os usos.",
    },
    employee: {
      title: "Gerencie seus próprios mensalistas",
      description: "Cadastre mensalistas vinculados a você, acompanhe os pacotes, utilizações, saldo e pagamentos dos seus clientes.",
      tip: "Os mensalistas cadastrados por você ficam vinculados ao seu perfil. Você não visualiza nem altera os mensalistas dos outros profissionais.",
    },
  },
  {
    match: "/dashboard/planos",
    owner: {
      title: "Como configurar os planos",
      description: "Crie pacotes com preço, quantidade de utilizações, validade e regras de dias e horários.",
      tip: "Revise as regras do plano antes de vinculá-lo a um mensalista. Alterações futuras no plano podem não mudar contratos já vendidos.",
    },
    employee: {
      title: "Crie seus próprios planos",
      description: "Configure os pacotes que você oferece, com preço, quantidade de usos, validade e horários permitidos.",
      tip: "Os planos criados no seu painel ficam vinculados ao seu perfil profissional e podem ser usados nos seus mensalistas.",
    },
  },
  {
    match: "/dashboard/clientes",
    owner: {
      title: "Organize seus clientes",
      description: "Mantenha os dados de contato atualizados para agilizar agendamentos e comunicação.",
      tip: "Use o telefone correto para facilitar confirmações e lembretes.",
    },
    employee: {
      title: "Seus clientes",
      description: "Consulte e organize os clientes disponíveis para seus atendimentos.",
      tip: "Mantenha os dados de contato atualizados para facilitar confirmações e remarcações.",
    },
  },
  {
    match: "/dashboard/servicos",
    owner: {
      title: "Configure os serviços",
      description: "Cadastre nome, preço e duração dos serviços oferecidos pelo estabelecimento.",
      tip: "A duração correta ajuda o Vellto a calcular os próximos horários disponíveis.",
    },
  },
  {
    match: "/dashboard/profissionais",
    owner: {
      title: "Gerencie sua equipe",
      description: "Cadastre profissionais, dados de contato, serviços e acesso individual ao painel.",
      tip: "Ao liberar acesso ao painel, cada profissional poderá acompanhar sua própria rotina conforme as permissões configuradas.",
    },
  },
  {
    match: "/dashboard/financeiro",
    owner: {
      title: "Acompanhe seu financeiro",
      description: "Consulte receitas e movimentações registradas no Vellto para acompanhar o resultado do negócio.",
      tip: "Mantenha os atendimentos e pagamentos atualizados para que os números reflitam a operação.",
    },
    employee: {
      title: "Acompanhe seus resultados",
      description: "Consulte as informações financeiras que estão liberadas para o seu perfil.",
      tip: "Registre corretamente os atendimentos e pagamentos para manter seus resultados organizados.",
    },
  },
  {
    match: "/dashboard/relatorios",
    owner: {
      title: "Entenda seus relatórios",
      description: "Use os indicadores para acompanhar atendimentos, receitas e o desempenho do negócio.",
      tip: "Escolha o período correto e compare períodos equivalentes para entender melhor a evolução.",
    },
  },
  {
    match: "/dashboard/configuracoes",
    owner: {
      title: "Configurações do estabelecimento",
      description: "Revise as informações e preferências gerais que controlam o funcionamento do seu espaço.",
      tip: "Antes de alterar uma configuração geral, confira como ela pode afetar a página pública e os agendamentos.",
    },
  },
  {
    match: "/dashboard/perfil",
    owner: {
      title: "Seu perfil de acesso",
      description: "Mantenha seus dados pessoais e informações de acesso atualizados.",
      tip: "Use um e-mail válido e uma senha segura para proteger sua conta.",
    },
    employee: {
      title: "Seu perfil profissional",
      description: "Mantenha seus dados pessoais e informações de acesso atualizados.",
      tip: "Se precisar alterar informações que não aparecem aqui, solicite ao administrador.",
    },
  },
];

export default function ContextualHelp({ role }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const isEmployee = role === "employee";

  const routeHelp = helpByRoute.find((item) => pathname.startsWith(item.match));
  const content = routeHelp
    ? (isEmployee ? routeHelp.employee : routeHelp.owner)
    : null;

  useEffect(() => {
    setOpen(true);
  }, [pathname]);

  if (!content) return null;

  return (
    <section
      aria-label="Ajuda desta tela"
      className="mx-auto mt-4 w-full max-w-[1500px] px-4 sm:px-6 lg:px-8"
    >
      {open ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">Dica rápida do Vellto</p>
              <h2 className="mt-1 text-sm font-bold text-zinc-100">{content.title}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{content.description}</p>
              <p className="mt-2 rounded-xl bg-black/10 px-3 py-2 text-xs leading-5 text-zinc-300">
                <strong className="text-emerald-400">Dica prática: </strong>{content.tip}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Recolher ajuda"
              className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5"
            >
              Entendi
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-white/5"
          >
            ? Ver dica desta tela
          </button>
        </div>
      )}
    </section>
  );
}
