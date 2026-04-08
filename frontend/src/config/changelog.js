const CHANGELOG = {
  version: "1.9.2",
  titulo: "Novidades do Sistema",
  categorias: [
    {
      nome: "Medidas Disciplinares",
      icone: "�️",
      itens: [
        "MD aplicada nas faltas agora só é exibida após a carta estar assinada (status ASSINADO)",
        "Tela de listagem: cores corrigidas para funcionar corretamente no tema claro",
        "Tela de listagem: badges de status agora exibem labels legíveis ('Assinado', 'Pendente Assinatura', 'Cancelada')",
        "Tela de listagem: adicionados filtros por Turno e Líder (selects populados dinamicamente)",
        "Card de MD agora exibe turno e líder do colaborador",
        "Tela de detalhe: cores dos campos corrigidas para respeitar o tema claro/escuro",
      ],
    },
    {
      nome: "Perfil do Colaborador",
      icone: "�",
      itens: [
        "Seção de Medidas Disciplinares agora exibe apenas MDs com carta assinada",
        "Cards de MD com destaque visual por status: verde para assinada, vermelho para cancelada",
        "Faltas: badge diferenciado para 'MD aplicada' (laranja) e 'MD cancelada' (vermelho)",
        "Correção: erro ao acessar o perfil quando chamadas secundárias (MDs, acidentes) falhavam — agora o perfil carrega mesmo com falhas parciais",
      ],
    },
    {
      nome: "Escalas",
      icone: "�️",
      itens: [
        "Novo campo 'Dias de DSR' no cadastro de escalas — agora é possível configurar os dias de folga diretamente no modal de escala",
        "Geração de DSR estendida para todas as escalas com base nos dias configurados",
      ],
    },
    {
      nome: "Treinamentos",
      icone: "📚",
      itens: [
        "Download de documentos de treinamento agora disponível na tela de detalhes",
      ],
    },
    {
      nome: "Correções",
      icone: "🔧",
      itens: [
        "Nome completo corrigido na tela de Folga Dominical",
        "Validação de domínio @shopee.com e estação obrigatória no cadastro de usuário",
        "Correção no registro de saída T3: sistema não bloqueava mais a saída quando o dia seguinte era DSR — a query de jornada aberta agora ignora registros DSR (que não possuem hora de entrada)",
      ],
    },
    {
      nome: "Controle de Presença",
      icone: "📋",
      itens: [
        "Botão 'Exportar Sheets' agora visível apenas para Admin e Alta Gestão",
        "Demais cargos passam a ter botão 'Exportar CSV' para baixar o controle localmente",
        "Novo botão 'Apagar registro' no modal de edição — disponível apenas para Admin quando há registro no banco",
        "Correção: exportação para Google Sheets agora respeita DSR — atestados médicos (AM) não sobrescrevem mais dias de folga da escala",
      ],
    },
  ],
};

export default CHANGELOG;
