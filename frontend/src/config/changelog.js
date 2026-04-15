const CHANGELOG = {
  version: "1.12.0",
  titulo: "Melhorias no Dashboard e Sugestões de MD",
  categorias: [
    {
      nome: "✨ Novidades",
      itens: [
        "Dashboard Operacional: adicionada opção 'Todos' no seletor de turno, consolidando os dados dos 3 turnos",
        "Gestão Operacional: ícone de calendário agora abre o seletor de data ao clicar",
        "Sugestões de MD: turno e líder do colaborador exibidos abaixo do nome na tabela",
      ]
    },
    {
      nome: "🔧 Correções",
      itens: [
        "Corrigido redirecionamento em loop para usuários com perfil Operação",
        "Corrigido import ausente do MainLayout na tela de Ponto",
        "Removido botão 'Ver Produtividade por Colaborador' da tela de registro de ponto",
      ]
    }
  ],
};

export default CHANGELOG;
