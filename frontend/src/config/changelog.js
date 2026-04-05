const CHANGELOG = {
  version: "1.7.6",
  titulo: "Novidades do Sistema",
  categorias: [
    {
      nome: "Correções",
      icone: "🐛",
      itens: [
        "T3 — Saídas na madrugada (até 06:20) agora são corretamente vinculadas à entrada da noite anterior, evitando registro duplicado no dia seguinte",
        "T3 — Dia operacional corrigido: batimentos entre 00:00 e 06:20 referenciam o dia anterior, mantendo a jornada íntegra no controle de presença",
      ],
    },
  ],
};

export default CHANGELOG;
