# Etapa 1 — checklist de segurança e estabilidade

## Verificações automatizadas
- `npm run lint`: análise estática do projeto.
- `npm run typecheck`: validação TypeScript sem gerar arquivos.
- `npm run build`: compilação de produção executada pelo pipeline da Vercel.

## Matriz de validação funcional antes de liberar amplamente

### Sessões e perfis
- [ ] Sem cookie de sessão: APIs privadas retornam 401.
- [ ] Cookie inválido ou expirado: APIs privadas retornam 401.
- [ ] Usuário desativado: painel e APIs privadas negam acesso.
- [ ] Empresa desativada: painel e APIs privadas negam acesso.
- [ ] Superadmin não acessa APIs de uma empresa como proprietário.
- [ ] Perfil com role desconhecida não acessa painel nem APIs da empresa.
- [ ] Profissional sem vínculo válido não acessa painel nem APIs.
- [ ] Profissional inativo não acessa painel nem APIs.
- [ ] Profissional de outra empresa não consegue usar o vínculo para acessar dados.

### Isolamento entre empresas
- [ ] Empresa A não lista clientes, profissionais, planos, mensalistas ou agendamentos da empresa B.
- [ ] Alterar ID de um registro na requisição não permite ler, editar ou excluir dados de outra empresa.
- [ ] Profissional A não acessa dados privados de outro profissional da mesma empresa quando a função é individual.
- [ ] Proprietário mantém acesso aos dados da própria empresa.

### Fluxos críticos
- [ ] Criar, editar, cancelar e concluir agendamento.
- [ ] Confirmar que duas requisições simultâneas não reservam a mesma vaga.
- [ ] Criar mensalista, consumir uso uma única vez e validar expiração/renovação.
- [ ] Confirmar que falhas de pagamento não liberam acesso indevido.
- [ ] Confirmar que a empresa com assinatura vencida continua vendo a tela de regularização, sem expor o conteúdo protegido do painel.

## Observação
A compilação e a análise estática não substituem testes de integração com contas reais. Os itens acima exigem contas de teste separadas (proprietário, profissional, duas empresas e cliente) e validação dos fluxos com dados não produtivos. Não executar testes destrutivos na base de clientes reais.
