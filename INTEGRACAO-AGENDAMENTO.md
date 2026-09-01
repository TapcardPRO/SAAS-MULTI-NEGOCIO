# Integração de agendamento

Este pacote integra o agendamento ao SaaS multiempresa.

## O que foi adicionado

- Página pública `/{slug}/agendar`
- Horários reais por empresa
- Disponibilidade considerando duração do serviço e horários já ocupados
- Escolha de profissional ou primeiro disponível
- Criação automática de cliente pelo WhatsApp
- Criação de agendamento com `businessId`
- Dashboard `/dashboard/agenda`
- Ações: confirmar, concluir, faltou e cancelar
- Dashboard `/dashboard/clientes`
- Dashboard `/dashboard/horarios`
- Histórico básico de visitas e total gasto ao concluir atendimento
- Navegação única do painel

## Novas coleções usadas

- `appointments`
- `clients`

## Campos de integração

Novos serviços e profissionais passam a guardar também `businessId`, mantendo `businessSlug` por compatibilidade com os dados atuais.

## Antes de produção

- Remover as rotas de desenvolvimento `create-test-user` e `create-superadmin`.
- Criar índices no MongoDB para `appointments.businessId/date`, `clients.businessId/phoneNorm` e demais consultas frequentes.
- Implementar mensagens/WhatsApp e mensalistas em uma segunda etapa.
