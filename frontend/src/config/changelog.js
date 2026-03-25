/**
 * CHANGELOG — atualize este arquivo a cada deploy.
 *
 * version: deve bater com APP_VERSION no .env do backend.
 * items: lista de novidades exibidas no modal.
 */
const CHANGELOG = {
  version: "1.5.2",
  titulo: "Novidades desta atualização",
  items: [
    {
      tipo: "Melhoria",
      titulo: "Movimentação de Colaborador — Seleção de Líder",
      descricao: "O campo de líder na tela de movimentação agora é um dropdown, listando apenas líderes ativos com nome + OPS ID.",
    },
    {
      tipo: "Novo",
      titulo: "Cadastro de Colaborador — Seleção de Líder",
      descricao: "Novo dropdown na seção Vínculo Organizacional para atribuir o líder do colaborador. Exibe nome + OPS ID e lista apenas líderes ativos.",
    },
    {
      tipo: "Novo",
      titulo: "Dashboard de Faltas — Seção 06: Faltas por Contexto",
      descricao: "Nova seção com 2 cards: distribuição de faltas por Dia da Semana e por Escala.",
    },
    {
      tipo: "Melhoria",
      titulo: "Dashboard de Faltas — Gráficos de Pizza",
      descricao: "Legenda atualizada: agora exibe a quantidade absoluta seguida do percentual entre parênteses na mesma linha (ex: T3  32  (64%)).",
    },
  ],
};

export default CHANGELOG;
