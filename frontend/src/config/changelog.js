/**
 * CHANGELOG — atualize este arquivo a cada deploy.
 *
 * version: deve bater com APP_VERSION no .env do backend.
 * categorias: agrupa as mudanças por tipo (Novidade, Melhoria, Correção).
 */
const CHANGELOG = {
  version: "1.7.2",
  titulo: "Novidades desta atualização",
  categorias: [
    {
      tipo: "Melhoria",
      itens: [ 
        "Histórico de atestados com datas, dias de afastamento, CID e status.",
        "Histórico de faltas com data de cada ocorrência e indicativo de medida disciplinar aplicada.",
      ],
    },
  ],
};

export default CHANGELOG;
