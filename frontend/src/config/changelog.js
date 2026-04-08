const CHANGELOG = {
  version: "1.9.2",
  titulo: "Exportação de Sheets por Estação",
  categorias: [
    {
      nome: "🐛 Correções",
      itens: [
        "Corrigido bug crítico onde todas as estações exportavam o Controle de Presença para a mesma planilha Google Sheets.",
        "A exportação agora filtra apenas os colaboradores da estação do usuário logado.",
      ],
    },
    {
      nome: "✨ Novidades",
      itens: [
        "Cada estação agora possui seu próprio ID de planilha Google Sheets para o Controle de Presença.",
        "Adicionado campo 'ID da Planilha Google Sheets (Controle de Presença)' nas configurações de cada estação.",
        "Os campos de configuração de planilhas (Gestão Operacional e Controle de Presença) agora são visíveis apenas para administradores.",
      ],
    },
  ],
};

export default CHANGELOG;
