const CHANGELOG = {
  version: "1.11.1",
  titulo: "Correção Daily Work - Estação Automática",
  categorias: [
    {
      nome: "🔧 Correções",
      itens: [
        "Corrigido erro que exigia seleção manual de estação para usuários já vinculados a uma estação (ALTA_GESTAO/LIDERANCA)",
        "Daily Work agora detecta automaticamente a estação do usuário logado",
        "Estação 1 continua com quantidade planejada automática via Google Sheets (somente leitura)",
        "Melhorada mensagem de erro quando estação não está disponível"
      ]
    }
  ],
};

export default CHANGELOG;
