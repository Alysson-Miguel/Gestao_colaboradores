const { prisma } = require("../../config/database");
const { getTurnoOperacionalAtual, getJanelaTurno, partesSP, instanteSP } = require("../../utils/turnoMapaOperacional");
const { FILTRO_CARGO_PRISMA } = require("../mapaOperacional/colaboradorElegibilidade.service");
const {
  ErroNegocio,
  MOTIVOS,
  FUNCOES,
  FUNCOES_ESTEIRA,
  NOME_ESTEIRA_DA_AREA,
  funcoesDaArea,
  STATUS_ABERTOS,
  STATUS_NO_DESTINO,
  TURNOS,
  normaliza,
  gerarToken,
  interpretarToken,
  ehViolacaoDeUnicidade,
} = require("./base");
const { areasPermitidas, listarAreas, codigosDoSetor } = require("./areas.service");
const { sinergiasNoDestino } = require("./localizacao.service");

/* =====================================================
   Sinergia Interna — regras de negócio.
   O backend é a autoridade: nenhuma regra crítica depende do front.

   Fluxo:
   SOLICITADA -> EM_DESLOCAMENTO (envio, gera QR de ida)
              -> SINERGIA_ATIVA  (QR de ida lido no destino: AQUI a localização muda)
              -> AGUARDANDO_RETORNO (líder do destino finaliza / fim previsto; gera QR de retorno)
              -> FINALIZADA (QR de retorno lido na origem: AQUI a localização volta)
   Fim de turno NUNCA finaliza: só move para AGUARDANDO_RETORNO.
===================================================== */

const MSG_ABERTA = "Este colaborador já possui uma sinergia em andamento.";

const INCLUDE_LISTA = {
  colaborador: { select: { opsId: true, nomeCompleto: true, matricula: true } },
  areaOrigem: { select: { idArea: true, codigo: true, nome: true, contexto: true } },
  areaDestino: { select: { idArea: true, codigo: true, nome: true, contexto: true } },
};

const CAMPOS_USUARIO = [
  "solicitadoPor",
  "enviadoPor",
  "recebidoPor",
  "finalizadoPor",
  "retornoConfirmadoPor",
  "canceladoPor",
  "prorrogadoPor",
];

const exigir = (condicao, mensagem, status = 403) => {
  if (!condicao) throw new ErroNegocio(mensagem, status);
};

const ehData = (d) => d instanceof Date && !Number.isNaN(d.getTime());

async function comRetentativa(fn) {
  for (let tentativa = 0; ; tentativa += 1) {
    try {
      return await fn();
    } catch (err) {
      // colisão (improvável) de token único: sorteia outro
      if (!ehViolacaoDeUnicidade(err) || tentativa >= 3) throw err;
    }
  }
}

async function carregar(id, idEstacao) {
  const n = Number(id);
  if (!Number.isInteger(n)) throw new ErroNegocio("Sinergia não encontrada.", 404);
  const row = await prisma.sinergiaInterna.findFirst({ where: { idSinergia: n, idEstacao }, include: INCLUDE_LISTA });
  if (!row) throw new ErroNegocio("Sinergia não encontrada.", 404);
  return row;
}

function registrarEvento(tx, idSinergia, { acao, de, para, ator, detalhe }) {
  return tx.sinergiaInternaEvento.create({
    data: {
      idSinergia,
      acao,
      statusAnterior: de ?? null,
      statusNovo: para ?? null,
      userId: ator?.user?.id ?? null,
      userNome: ator?.user?.name ?? "Sistema",
      ip: ator?.ip ?? null,
      dispositivo: ator?.dispositivo ?? null,
      detalhe: detalhe ?? undefined,
    },
  });
}

/**
 * Transição atômica: só aplica se a sinergia ainda estiver em um dos status `de`.
 * É isso que impede duas confirmações simultâneas de passarem (a segunda encontra 0 linhas).
 */
async function transicionar({ row, ator, de, dados, eventos, depois, condicaoExtra = {} }) {
  const para = dados.status ?? row.status;
  return prisma.$transaction(async (tx) => {
    const r = await tx.sinergiaInterna.updateMany({
      where: { idSinergia: row.idSinergia, status: { in: de }, ...condicaoExtra },
      data: dados,
    });
    if (r.count === 0) {
      throw new ErroNegocio("O status desta sinergia mudou. Atualize a tela e tente novamente.", 409);
    }
    for (const ev of eventos) {
      await registrarEvento(tx, row.idSinergia, { acao: ev.acao, de: row.status, para, ator, detalhe: ev.detalhe });
    }
    const extra = depois ? await depois(tx) : null;
    const atualizado = await tx.sinergiaInterna.findUnique({ where: { idSinergia: row.idSinergia }, include: INCLUDE_LISTA });
    return { sinergia: atualizado, extra };
  });
}

/* ---------- apresentação ---------- */

async function nomesDeUsuarios(rows) {
  const ids = new Set();
  rows.forEach((r) => CAMPOS_USUARIO.forEach((c) => r[c] && ids.add(r[c])));
  if (!ids.size) return new Map();
  const usuarios = await prisma.user.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } });
  return new Map(usuarios.map((u) => [u.id, u.name]));
}

function calcularAcoes(row, user, permitidas) {
  const origem = permitidas.has(row.idAreaOrigem);
  const destino = permitidas.has(row.idAreaDestino);
  const s = row.status;
  return {
    enviar: s === "SOLICITADA" && origem,
    cancelar: ["SOLICITADA", "EM_DESLOCAMENTO"].includes(s) && (row.solicitadoPor === user.id || origem || destino),
    etiquetaIda: s === "EM_DESLOCAMENTO" && (origem || destino),
    reemitirIda: s === "EM_DESLOCAMENTO" && origem,
    finalizar: s === "SINERGIA_ATIVA" && destino,
    prorrogar: ["SINERGIA_ATIVA", "AGUARDANDO_RETORNO"].includes(s) && destino,
    etiquetaRetorno: s === "AGUARDANDO_RETORNO" && (origem || destino),
    reemitirRetorno: s === "AGUARDANDO_RETORNO" && (origem || destino),
    retornoManual: s === "AGUARDANDO_RETORNO" && origem,
  };
}

function serializar(row, nomes, user, permitidas) {
  const pessoa = (id) => (id ? { id, nome: nomes.get(id) || null } : null);
  const fimReferencia = row.dataFinalizacao || new Date();
  return {
    idSinergia: row.idSinergia,
    idLote: row.idLote ?? null,
    colaborador: row.colaborador,
    origem: { idArea: row.areaOrigem.idArea, nome: row.areaOrigem.nome },
    destino: { idArea: row.areaDestino.idArea, nome: row.areaDestino.nome },
    motivo: row.motivo,
    motivoDescricao: MOTIVOS[row.motivo] || row.motivo,
    motivoComplemento: row.motivoComplemento,
    funcaoDestino: row.funcaoDestino,
    funcaoDescricao: row.funcaoDestino ? FUNCOES[row.funcaoDestino] || row.funcaoDestino : null,
    turno: row.turno,
    diaOperacional: row.diaOperacional,
    status: row.status,
    solicitadoPor: pessoa(row.solicitadoPor),
    enviadoPor: pessoa(row.enviadoPor),
    recebidoPor: pessoa(row.recebidoPor),
    finalizadoPor: pessoa(row.finalizadoPor),
    retornoConfirmadoPor: pessoa(row.retornoConfirmadoPor),
    canceladoPor: pessoa(row.canceladoPor),
    dataSolicitacao: row.dataSolicitacao,
    dataEnvio: row.dataEnvio,
    dataChegada: row.dataChegada,
    dataFimDestino: row.dataFimDestino,
    dataFinalizacao: row.dataFinalizacao,
    inicioPrevisto: row.inicioPrevisto,
    fimPrevisto: row.fimPrevisto,
    prorrogacoes: row.prorrogacoes,
    motivoCancelamento: row.motivoCancelamento,
    retornoManual: row.retornoManual,
    retornoManualJustificativa: row.retornoManualJustificativa,
    tempoEmSinergiaMin: row.dataChegada ? Math.max(Math.round((fimReferencia - row.dataChegada) / 60000), 0) : null,
    acoes: calcularAcoes(row, user, permitidas),
  };
}

/* ---------- criação (unitária ou em lote) ---------- */

/**
 * Fim do turno pelo HORÁRIO CADASTRADO do colaborador (tabela de turnos), não por fronteiras fixas.
 * Pega a primeira ocorrência desse horário depois de (referência - 8h): vale para o T3, que termina
 * de madrugada, e permite detectar que o turno de hoje já acabou (devolve um instante no passado).
 */
function fimDoTurnoCadastrado(horarioFim, referencia) {
  if (!(horarioFim instanceof Date)) return null;
  const limite = referencia.getTime() - 8 * 3600 * 1000;
  const p = partesSP(referencia); // o horário do turno é de Brasília, não do fuso do servidor
  for (const deslocamentoDias of [-1, 0, 1]) {
    const candidato = instanteSP(p.ano, p.mes, p.dia + deslocamentoDias, horarioFim.getUTCHours(), horarioFim.getUTCMinutes());
    if (candidato.getTime() > limite) return candidato;
  }
  return null;
}

async function criar(dados, ator) {
  const { user, idEstacao } = ator;

  const opsIds = [...new Set((Array.isArray(dados.opsIds) ? dados.opsIds : []).map((o) => String(o).trim()).filter(Boolean))];
  if (!opsIds.length) throw new ErroNegocio("Selecione ao menos um colaborador.");
  if (opsIds.length > 50) throw new ErroNegocio("Máximo de 50 colaboradores por solicitação.");

  const idAreaOrigem = Number(dados.idAreaOrigem);
  const idAreaDestino = Number(dados.idAreaDestino);
  if (!idAreaOrigem || !idAreaDestino) throw new ErroNegocio("Informe o setor de origem e o setor de destino.");
  if (idAreaOrigem === idAreaDestino) throw new ErroNegocio("O setor de origem e o setor de destino não podem ser iguais.");

  const areas = await listarAreas();
  if (!areas.some((a) => a.idArea === idAreaOrigem) || !areas.some((a) => a.idArea === idAreaDestino)) {
    throw new ErroNegocio("Setor de origem ou destino inválido.");
  }

  const permitidas = await areasPermitidas(user);
  exigir(
    permitidas.has(idAreaOrigem) || permitidas.has(idAreaDestino),
    "Você precisa operar o setor de origem ou o de destino para solicitar uma sinergia."
  );

  if (!MOTIVOS[dados.motivo]) throw new ErroNegocio("Informe o motivo da sinergia.");
  const complemento = dados.motivoComplemento ? String(dados.motivoComplemento).trim().slice(0, 300) : null;
  if (dados.motivo === "OUTROS" && (!complemento || complemento.length < 3)) {
    throw new ErroNegocio('Descreva o motivo quando escolher "Outros".');
  }

  // Onde a pessoa vai trabalhar no destino (Full D+1 é pool: não pede função).
  const areaDestino = areas.find((a) => a.idArea === idAreaDestino);
  const funcoesValidas = funcoesDaArea(areaDestino);
  let funcaoDestino = null;
  if (funcoesValidas.length) {
    if (!funcoesValidas.includes(dados.funcaoDestino)) {
      throw new ErroNegocio(`Escolha a função do colaborador em ${areaDestino.nome}.`);
    }
    funcaoDestino = dados.funcaoDestino;
  }

  if (dados.turno && !TURNOS.includes(dados.turno)) throw new ErroNegocio("Turno inválido.");
  const agora = new Date();
  const inicioPrevisto = dados.inicioPrevisto ? new Date(dados.inicioPrevisto) : agora;
  if (!ehData(inicioPrevisto)) throw new ErroNegocio("Início previsto inválido.");

  // Dia operacional (06:00 até 05:59 do dia seguinte), calculado pela função central da Label.
  const { diaOperacionalStr, turno: turnoDoInicio } = getTurnoOperacionalAtual(inicioPrevisto);
  const [y, m, d] = diaOperacionalStr.split("-").map(Number);
  const diaOperacional = new Date(y, m - 1, d);

  // Fim previsto informado vale para todos; sem ele, cada colaborador usa o fim do próprio turno cadastrado.
  const fimInformado = dados.fimPrevisto ? new Date(dados.fimPrevisto) : null;
  if (fimInformado) {
    if (!ehData(fimInformado)) throw new ErroNegocio("Fim previsto inválido.");
    if (fimInformado <= inicioPrevisto) throw new ErroNegocio("O fim previsto deve ser depois do início previsto.");
    if (fimInformado <= agora) throw new ErroNegocio("O fim previsto já passou. Informe um fim previsto futuro.");
  }

  const colaboradores = await prisma.colaborador.findMany({
    where: { opsId: { in: opsIds }, idEstacao, status: "ATIVO", cargo: FILTRO_CARGO_PRISMA },
    select: { opsId: true, nomeCompleto: true, turno: { select: { nomeTurno: true, horarioFim: true } } },
  });
  const encontrados = new Map(colaboradores.map((c) => [c.opsId, c]));
  const invalidos = opsIds.filter((o) => !encontrados.has(o));
  if (invalidos.length) {
    throw new ErroNegocio(
      `Colaborador não elegível: ${invalidos.join(", ")}. Só colaboradores ativos da estação, de Auxiliar de Logística I, II ou I - PCD, podem ser movimentados.`
    );
  }

  const abertas = await prisma.sinergiaInterna.findMany({
    where: { opsId: { in: opsIds }, status: { in: STATUS_ABERTOS } },
    select: { opsId: true },
  });
  if (abertas.length) {
    const nomes = abertas.map((a) => encontrados.get(a.opsId)?.nomeCompleto || a.opsId).join(", ");
    throw new ErroNegocio(`${MSG_ABERTA} (${nomes})`, 409);
  }

  const planejamento = new Map();
  for (const opsId of opsIds) {
    const c = encontrados.get(opsId);
    const turnoCadastrado = String(c.turno?.nomeTurno || "").trim().toUpperCase();
    const turnoProprio = TURNOS.includes(turnoCadastrado) ? turnoCadastrado : turnoDoInicio;
    const turno = dados.turno || turnoProprio;

    let fimPrevisto = fimInformado;
    if (!fimPrevisto) {
      fimPrevisto =
        turno === turnoProprio ? fimDoTurnoCadastrado(c.turno?.horarioFim, inicioPrevisto) : null;
      fimPrevisto = fimPrevisto || getJanelaTurno(diaOperacionalStr, turno).fim;
    }
    if (fimPrevisto <= agora || fimPrevisto <= inicioPrevisto) {
      throw new ErroNegocio(
        `O turno cadastrado de ${c.nomeCompleto} já terminou. Ajuste o período previsto (fim) ou escolha outro colaborador.`
      );
    }
    planejamento.set(opsId, { turno, fimPrevisto });
  }

  let criadas;
  try {
    criadas = await prisma.$transaction(async (tx) => {
      const lista = [];
      // 2 ou mais colaboradores: um lote com QR único de ida e de retorno (uma leitura confirma todos).
      const lote =
        opsIds.length > 1
          ? await tx.sinergiaInternaLote.create({
              data: { idEstacao, solicitadoPor: user.id, qrToken: gerarToken("SGL"), qrRetornoToken: gerarToken("RGL") },
            })
          : null;
      for (const opsId of opsIds) {
        const { turno, fimPrevisto } = planejamento.get(opsId);
        const sinergia = await tx.sinergiaInterna.create({
          data: {
            idEstacao,
            idLote: lote?.idLote ?? null,
            opsId,
            idAreaOrigem,
            idAreaDestino,
            solicitadoPor: user.id,
            motivo: dados.motivo,
            motivoComplemento: complemento,
            funcaoDestino,
            turno,
            diaOperacional,
            inicioPrevisto,
            fimPrevisto,
            status: "SOLICITADA",
          },
          include: INCLUDE_LISTA,
        });
        await registrarEvento(tx, sinergia.idSinergia, { acao: "SOLICITADA", para: "SOLICITADA", ator });
        lista.push(sinergia);
      }
      return lista;
    });
  } catch (err) {
    // O índice parcial do banco barrou uma corrida entre duas solicitações do mesmo colaborador.
    if (ehViolacaoDeUnicidade(err)) throw new ErroNegocio(MSG_ABERTA, 409);
    throw err;
  }

  const nomes = await nomesDeUsuarios(criadas);
  return criadas.map((c) => serializar(c, nomes, user, permitidas));
}

/* ---------- envio, cancelamento, finalização, prorrogação ---------- */

async function enviar(id, ator) {
  const row = await carregar(id, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  exigir(permitidas.has(row.idAreaOrigem), "Apenas usuários do setor de origem podem confirmar o envio.");
  if (row.status !== "SOLICITADA") throw new ErroNegocio("Só é possível enviar uma sinergia solicitada.", 409);

  const agora = new Date();
  return comRetentativa(() =>
    transicionar({
      row,
      ator,
      de: ["SOLICITADA"],
      dados: {
        status: "EM_DESLOCAMENTO",
        dataEnvio: agora,
        enviadoPor: ator.user.id,
        qrToken: gerarToken("SYG"),
        qrGeradoEm: agora,
      },
      eventos: [{ acao: "ENVIADA" }, { acao: "QR_GERADO", detalhe: { tipo: "ida" } }],
    })
  );
}

async function cancelar(id, motivo, ator) {
  const row = await carregar(id, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  exigir(
    row.solicitadoPor === ator.user.id || permitidas.has(row.idAreaOrigem) || permitidas.has(row.idAreaDestino),
    "Você não possui permissão para cancelar esta sinergia."
  );
  if (!["SOLICITADA", "EM_DESLOCAMENTO"].includes(row.status)) {
    throw new ErroNegocio(
      row.status === "CANCELADA"
        ? "Esta sinergia já foi cancelada."
        : "Depois da chegada confirmada a sinergia não pode ser cancelada: finalize e confirme o retorno.",
      409
    );
  }
  const texto = String(motivo || "").trim();
  if (texto.length < 3) throw new ErroNegocio("Informe o motivo do cancelamento.");

  // Os tokens continuam gravados: ao ler o QR a pessoa recebe "foi cancelado" (e nenhuma ação é permitida).
  return transicionar({
    row,
    ator,
    de: ["SOLICITADA", "EM_DESLOCAMENTO"],
    dados: { status: "CANCELADA", canceladoPor: ator.user.id, canceladoEm: new Date(), motivoCancelamento: texto.slice(0, 300) },
    eventos: [{ acao: "CANCELADA", detalhe: { motivo: texto.slice(0, 300) } }],
  });
}

async function finalizarNoDestino(id, ator) {
  const row = await carregar(id, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  exigir(permitidas.has(row.idAreaDestino), "Apenas o responsável do setor de destino pode finalizar a sinergia.");
  if (row.status !== "SINERGIA_ATIVA") throw new ErroNegocio("Só é possível finalizar uma sinergia ativa.", 409);

  const agora = new Date();
  return comRetentativa(() =>
    transicionar({
      row,
      ator,
      de: ["SINERGIA_ATIVA"],
      dados: {
        status: "AGUARDANDO_RETORNO",
        dataFimDestino: agora,
        finalizadoPor: ator.user.id,
        qrRetornoToken: gerarToken("RET"),
        qrRetornoGeradoEm: agora,
      },
      eventos: [{ acao: "FINALIZADA_NO_DESTINO" }, { acao: "QR_GERADO", detalhe: { tipo: "retorno" } }],
    })
  );
}

async function prorrogar(id, { novoFimPrevisto, motivo }, ator) {
  const row = await carregar(id, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  exigir(permitidas.has(row.idAreaDestino), "Apenas o responsável do setor de destino pode prorrogar a sinergia.");
  if (!["SINERGIA_ATIVA", "AGUARDANDO_RETORNO"].includes(row.status)) {
    throw new ErroNegocio("Só é possível prorrogar uma sinergia ativa ou aguardando retorno.", 409);
  }
  const texto = String(motivo || "").trim();
  if (texto.length < 3) throw new ErroNegocio("Informe o motivo da prorrogação.");
  const novoFim = new Date(novoFimPrevisto);
  if (!ehData(novoFim)) throw new ErroNegocio("Novo fim previsto inválido.");
  if (novoFim <= new Date() || novoFim <= row.fimPrevisto) {
    throw new ErroNegocio("O novo fim previsto deve ser futuro e depois do fim anterior.");
  }

  // Volta para ATIVA (a pessoa continua no destino). O QR de retorno anterior é invalidado.
  return transicionar({
    row,
    ator,
    de: ["SINERGIA_ATIVA", "AGUARDANDO_RETORNO"],
    dados: {
      status: "SINERGIA_ATIVA",
      fimPrevisto: novoFim,
      prorrogacoes: { increment: 1 },
      prorrogadoPor: ator.user.id,
      prorrogadoEm: new Date(),
      motivoProrrogacao: texto.slice(0, 300),
      qrRetornoToken: null,
      qrRetornoGeradoEm: null,
      dataFimDestino: null,
      finalizadoPor: null,
    },
    eventos: [
      {
        acao: "PRORROGADA",
        detalhe: { fimAnterior: row.fimPrevisto, novoFim, motivo: texto.slice(0, 300), statusAnterior: row.status },
      },
    ],
  });
}

async function confirmarRetornoManual(id, justificativa, ator) {
  const row = await carregar(id, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  exigir(permitidas.has(row.idAreaOrigem), "Apenas o responsável do setor de origem pode confirmar o retorno.");
  if (row.status !== "AGUARDANDO_RETORNO") throw new ErroNegocio("Só é possível confirmar o retorno de uma sinergia aguardando retorno.", 409);
  const texto = String(justificativa || "").trim();
  if (texto.length < 10) throw new ErroNegocio("Descreva a justificativa (mínimo de 10 caracteres): o retorno manual fica registrado em auditoria.");

  return transicionar({
    row,
    ator,
    de: ["AGUARDANDO_RETORNO"],
    dados: {
      status: "FINALIZADA",
      dataFinalizacao: new Date(),
      retornoConfirmadoPor: ator.user.id,
      retornoManual: true,
      retornoManualJustificativa: texto.slice(0, 300),
    },
    eventos: [{ acao: "RETORNO_CONFIRMADO_MANUAL", detalhe: { justificativa: texto.slice(0, 300) } }],
    depois: (tx) => tx.mapaAlocacao.updateMany({ where: { opsId: row.opsId, fim: null }, data: { fim: new Date() } }),
  });
}

/* ---------- QR Code ---------- */

async function reemitirQr(id, tipo, ator) {
  const row = await carregar(id, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  const ida = tipo === "ida";
  if (ida) {
    exigir(permitidas.has(row.idAreaOrigem), "Apenas o setor de origem pode reemitir o QR de ida.");
    if (row.status !== "EM_DESLOCAMENTO") throw new ErroNegocio("O QR de ida só pode ser reemitido enquanto o colaborador está em deslocamento.", 409);
  } else {
    exigir(permitidas.has(row.idAreaOrigem) || permitidas.has(row.idAreaDestino), "Você não possui permissão para reemitir este QR Code.");
    if (row.status !== "AGUARDANDO_RETORNO") throw new ErroNegocio("O QR de retorno só pode ser reemitido enquanto aguarda retorno.", 409);
  }

  const agora = new Date();
  return comRetentativa(() =>
    transicionar({
      row,
      ator,
      de: [row.status],
      dados: ida
        ? { qrToken: gerarToken("SYG"), qrGeradoEm: agora }
        : { qrRetornoToken: gerarToken("RET"), qrRetornoGeradoEm: agora },
      eventos: [{ acao: "QR_REEMITIDO", detalhe: { tipo } }],
    })
  );
}

/** Dados da etiqueta (o token só é entregue a quem opera origem ou destino). */
async function obterEtiqueta(id, tipo, ator) {
  const row = await carregar(id, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  exigir(permitidas.has(row.idAreaOrigem) || permitidas.has(row.idAreaDestino), "Você não possui permissão para imprimir esta etiqueta.");

  const ida = tipo === "ida";
  const token = ida ? row.qrToken : row.qrRetornoToken;
  const statusEsperado = ida ? "EM_DESLOCAMENTO" : "AGUARDANDO_RETORNO";
  if (row.status !== statusEsperado || !token) {
    throw new ErroNegocio(ida ? "A etiqueta de ida só existe enquanto o colaborador está em deslocamento." : "A etiqueta de retorno só existe enquanto aguarda retorno.", 409);
  }

  await prisma.$transaction((tx) => registrarEvento(tx, row.idSinergia, { acao: "ETIQUETA_GERADA", de: row.status, para: row.status, ator, detalhe: { tipo } }));

  return {
    idSinergia: row.idSinergia,
    tipo: ida ? "ida" : "retorno",
    token,
    colaborador: row.colaborador.nomeCompleto,
    origem: row.areaOrigem.nome,
    destino: row.areaDestino.nome,
    turno: row.turno,
    diaOperacional: row.diaOperacional,
    fimPrevisto: row.fimPrevisto,
  };
}

/**
 * Valida um token lido contra a sinergia e o usuário. Devolve a mensagem de erro
 * exata da spec (ou null se pode prosseguir). Não altera nada.
 */
function avaliarQr({ row, tipo, permitidas, modo: modoInformado }) {
  // A tela de chegada manda "chegada"; internamente o QR de ida é "ida".
  const modo = modoInformado === "chegada" ? "ida" : modoInformado;
  if (modo && modo !== tipo) {
    return tipo === "retorno"
      ? "Este é um QR Code de retorno. Use a tela Confirmar retorno."
      : "Este é um QR Code de ida. Use a tela Confirmar chegada.";
  }

  if (row.status === "CANCELADA") return "Este QR Code foi cancelado.";
  if (row.status === "EXPIRADA") return "Este QR Code expirou.";

  const usado = tipo === "ida" ? row.qrUsadoEm : row.qrRetornoUsadoEm;
  if (row.status === "FINALIZADA") return usado ? "Este QR Code já foi utilizado." : "Esta sinergia já foi finalizada.";
  if (usado) return "Este QR Code já foi utilizado.";

  const statusEsperado = tipo === "ida" ? "EM_DESLOCAMENTO" : "AGUARDANDO_RETORNO";
  if (row.status !== statusEsperado) return "Este QR Code não pode ser utilizado no status atual da sinergia.";
  if (tipo === "ida" && row.fimPrevisto <= new Date()) return "Este QR Code expirou.";

  const idAreaNecessaria = tipo === "ida" ? row.idAreaDestino : row.idAreaOrigem;
  if (!permitidas.has(idAreaNecessaria)) {
    if (permitidas.size === 0) return "Você não possui permissão para confirmar esta operação.";
    return tipo === "ida"
      ? "Este QR Code não pertence a uma sinergia destinada a este setor."
      : "Este QR Code de retorno não pertence a uma sinergia originada neste setor.";
  }
  return null;
}

async function localizarPorToken(texto, idEstacao) {
  const lido = interpretarToken(texto);
  if (!lido) throw new ErroNegocio("QR Code inválido.", 404);
  const row = await prisma.sinergiaInterna.findFirst({
    where: { idEstacao, ...(lido.tipo === "ida" ? { qrToken: lido.token } : { qrRetornoToken: lido.token }) },
    include: INCLUDE_LISTA,
  });
  if (!row) throw new ErroNegocio("QR Code inválido.", 404);
  return { row, tipo: lido.tipo, token: lido.token };
}

function prever(row, tipo, nomes) {
  return {
    idSinergia: row.idSinergia,
    tipo,
    colaborador: { nomeCompleto: row.colaborador.nomeCompleto, matricula: row.colaborador.matricula, opsId: row.colaborador.opsId },
    origem: row.areaOrigem.nome,
    destino: row.areaDestino.nome,
    turno: row.turno,
    funcao: row.funcaoDestino ? FUNCOES[row.funcaoDestino] || row.funcaoDestino : null,
    status: row.status,
    dataEnvio: row.dataEnvio,
    dataChegada: row.dataChegada,
    dataFimDestino: row.dataFimDestino,
    enviadoPor: row.enviadoPor ? nomes.get(row.enviadoPor) || null : null,
    recebidoPor: row.recebidoPor ? nomes.get(row.recebidoPor) || null : null,
    fimPrevisto: row.fimPrevisto,
  };
}

async function consultarQr({ token, modo }, ator) {
  if (interpretarToken(token)?.grupo) return consultarQrGrupo({ token, modo }, ator);
  const { row, tipo } = await localizarPorToken(token, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  const erro = avaliarQr({ row, tipo, permitidas, modo });

  await prisma.$transaction((tx) =>
    registrarEvento(tx, row.idSinergia, {
      acao: tipo === "ida" ? "QR_LIDO_DESTINO" : "QR_LIDO_ORIGEM",
      de: row.status,
      para: row.status,
      ator,
      detalhe: { resultado: erro || "ok" },
    })
  );
  if (erro) throw new ErroNegocio(erro, 409);

  const nomes = await nomesDeUsuarios([row]);
  return prever(row, tipo, nomes);
}

async function confirmarQr({ token, modo }, ator) {
  if (interpretarToken(token)?.grupo) return confirmarQrGrupo({ token, modo }, ator);
  const { row, tipo, token: tokenLido } = await localizarPorToken(token, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  const erro = avaliarQr({ row, tipo, permitidas, modo });
  if (erro) throw new ErroNegocio(erro, 409);
  return aplicarConfirmacao({ row, tipo, tokenLido, ator });
}

/** A confirmação em si (já validada): vale para o QR individual e, um a um, para o QR de grupo. */
async function aplicarConfirmacao({ row, tipo, tokenLido, ator, detalhe }) {
  const agora = new Date();

  if (tipo === "ida") {
    const { sinergia, extra } = await transicionarOuExplicar({
      row,
      ator,
      de: ["EM_DESLOCAMENTO"],
      condicaoExtra: { qrToken: tokenLido, qrUsadoEm: null },
      dados: { status: "SINERGIA_ATIVA", dataChegada: agora, recebidoPor: ator.user.id, qrUsadoEm: agora },
      eventos: [{ acao: "CHEGADA_CONFIRMADA", detalhe }],
      // A pessoa só pode estar em um lugar: a alocação aberta na Label (origem) é encerrada na chegada.
      depois: async (tx) => {
        const encerradas = await tx.mapaAlocacao.updateMany({ where: { opsId: row.opsId, fim: null }, data: { fim: agora } });

        // Esteira + função escolhida: já aparece na Label naquela função. Packing não cria nada: o
        // check-in na Workstation coloca a pessoa no braço sozinho. Docas ficam pro líder do destino
        // alocar (precisa de doca/time), com a função já sugerida.
        const nomeEsteira = NOME_ESTEIRA_DA_AREA[row.areaDestino.codigo];
        const funcao = row.funcaoDestino;
        let alocadoEm = null;
        if (nomeEsteira && funcao && funcao !== "PACKING" && FUNCOES_ESTEIRA.includes(funcao)) {
          const esteiras = await tx.mapaEsteira.findMany({ where: { idEstacao: row.idEstacao, ativo: true }, select: { idEsteira: true, nome: true } });
          const esteira = esteiras.find((e) => normaliza(e.nome) === normaliza(nomeEsteira));
          if (esteira) {
            await tx.mapaAlocacao.create({
              data: { idEstacao: row.idEstacao, idEsteira: esteira.idEsteira, labor: funcao, origem: "MANUAL", opsId: row.opsId, diarista: false },
            });
            alocadoEm = `${nomeEsteira} · ${FUNCOES[funcao]}`;
          }
        }
        return { count: encerradas.count, alocadoEm };
      },
    });
    return { sinergia, mensagem: "Chegada confirmada.", alocacoesEncerradas: extra?.count ?? 0, alocadoEm: extra?.alocadoEm ?? null };
  }

  const { sinergia } = await transicionarOuExplicar({
    row,
    ator,
    de: ["AGUARDANDO_RETORNO"],
    condicaoExtra: { qrRetornoToken: tokenLido, qrRetornoUsadoEm: null },
    dados: { status: "FINALIZADA", dataFinalizacao: agora, retornoConfirmadoPor: ator.user.id, qrRetornoUsadoEm: agora },
    eventos: [{ acao: "RETORNO_CONFIRMADO", detalhe }, { acao: "FINALIZADA" }],
    // Voltou pra origem: encerra o que tinha aberto no destino (a pessoa só está em um lugar).
    depois: (tx) => tx.mapaAlocacao.updateMany({ where: { opsId: row.opsId, fim: null }, data: { fim: agora } }),
  });
  return { sinergia, mensagem: "Retorno confirmado." };
}

/* ---------- QR de grupo (lote) ---------- */

async function localizarLotePorToken(texto, idEstacao) {
  const lido = interpretarToken(texto);
  if (!lido?.grupo) throw new ErroNegocio("QR Code inválido.", 404);
  const lote = await prisma.sinergiaInternaLote.findFirst({
    where: { idEstacao, ...(lido.tipo === "ida" ? { qrToken: lido.token } : { qrRetornoToken: lido.token }) },
    include: { sinergias: { include: INCLUDE_LISTA, orderBy: { idSinergia: "asc" } } },
  });
  if (!lote || !lote.sinergias.length) throw new ErroNegocio("QR Code inválido.", 404);
  return { lote, tipo: lido.tipo };
}

/** Cada membro do lote é avaliado pela mesma regra do QR individual; os que não estão prontos só são listados. */
function avaliarMembros({ lote, tipo, permitidas, modo }) {
  return lote.sinergias.map((row) => {
    let erro = avaliarQr({ row, tipo, permitidas, modo });
    // Mensagens que fazem sentido para quem confere o grupo no chão
    if (erro && tipo === "ida" && row.status === "SOLICITADA") erro = "Envio ainda não confirmado na origem.";
    else if (erro && tipo === "retorno" && row.status === "SINERGIA_ATIVA") erro = "Ainda não foi finalizado no destino.";
    return { row, erro };
  });
}

function resumoDoGrupo(lote, tipo, membros) {
  const ref = lote.sinergias[0];
  return {
    grupo: true,
    idLote: lote.idLote,
    tipo,
    origem: ref.areaOrigem.nome,
    destino: ref.areaDestino.nome,
    turno: ref.turno,
    funcao: ref.funcaoDestino ? FUNCOES[ref.funcaoDestino] || ref.funcaoDestino : null,
    total: membros.length,
    prontos: membros.filter((m) => !m.erro).length,
    membros: membros.map(({ row, erro }) => ({
      idSinergia: row.idSinergia,
      colaborador: { nomeCompleto: row.colaborador.nomeCompleto, opsId: row.colaborador.opsId },
      status: row.status,
      pronto: !erro,
      motivo: erro,
    })),
  };
}

async function consultarQrGrupo({ token, modo }, ator) {
  const { lote, tipo } = await localizarLotePorToken(token, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  const membros = avaliarMembros({ lote, tipo, permitidas, modo });
  const prontos = membros.filter((m) => !m.erro);

  await prisma.$transaction(async (tx) => {
    for (const { row, erro } of membros) {
      await registrarEvento(tx, row.idSinergia, {
        acao: tipo === "ida" ? "QR_LIDO_DESTINO" : "QR_LIDO_ORIGEM",
        de: row.status,
        para: row.status,
        ator,
        detalhe: { resultado: erro || "ok", grupo: lote.idLote },
      });
    }
  });
  // Ninguém pronto: devolve o motivo (o mais comum) em vez de uma tela vazia.
  if (!prontos.length) throw new ErroNegocio(membros[0].erro || "Nenhum colaborador deste grupo pode ser confirmado agora.", 409);
  return resumoDoGrupo(lote, tipo, membros);
}

async function confirmarQrGrupo({ token, modo }, ator) {
  const { lote, tipo } = await localizarLotePorToken(token, ator.idEstacao);
  const permitidas = await areasPermitidas(ator.user);
  const membros = avaliarMembros({ lote, tipo, permitidas, modo });
  if (!membros.some((m) => !m.erro)) throw new ErroNegocio(membros[0].erro || "Nenhum colaborador deste grupo pode ser confirmado agora.", 409);

  const itens = [];
  for (const { row, erro } of membros) {
    const nome = row.colaborador.nomeCompleto;
    if (erro) {
      itens.push({ idSinergia: row.idSinergia, nome, ok: false, mensagem: erro });
      continue;
    }
    try {
      // cada membro confirma com o próprio token, então a mesma proteção contra leitura dupla vale aqui
      const tokenDoMembro = tipo === "ida" ? row.qrToken : row.qrRetornoToken;
      const r = await aplicarConfirmacao({ row, tipo, tokenLido: tokenDoMembro, ator, detalhe: { grupo: lote.idLote } });
      itens.push({ idSinergia: row.idSinergia, nome, ok: true, mensagem: r.mensagem, alocadoEm: r.alocadoEm ?? null });
    } catch (err) {
      if (!(err instanceof ErroNegocio)) throw err;
      itens.push({ idSinergia: row.idSinergia, nome, ok: false, mensagem: err.message });
    }
  }

  const resumo = resumoDoGrupo(lote, tipo, membros);
  const confirmadas = itens.filter((i) => i.ok).length;
  return {
    grupo: true,
    idLote: lote.idLote,
    tipo,
    origem: resumo.origem,
    destino: resumo.destino,
    total: itens.length,
    confirmadas,
    itens,
    mensagem: tipo === "ida" ? `Chegada confirmada de ${confirmadas} de ${itens.length} colaboradores.` : `Retorno confirmado de ${confirmadas} de ${itens.length} colaboradores.`,
  };
}

/** Etiqueta única do grupo: só entram os membros que ainda estão no estado em que o QR vale (ida: em deslocamento). */
async function obterEtiquetaGrupo(idLote, tipo, ator) {
  const n = Number(idLote);
  if (!Number.isInteger(n)) throw new ErroNegocio("Grupo não encontrado.", 404);
  const lote = await prisma.sinergiaInternaLote.findFirst({
    where: { idLote: n, idEstacao: ator.idEstacao },
    include: { sinergias: { include: INCLUDE_LISTA, orderBy: { idSinergia: "asc" } } },
  });
  if (!lote || !lote.sinergias.length) throw new ErroNegocio("Grupo não encontrado.", 404);

  const ref = lote.sinergias[0];
  const permitidas = await areasPermitidas(ator.user);
  exigir(permitidas.has(ref.idAreaOrigem) || permitidas.has(ref.idAreaDestino), "Você não possui permissão para imprimir esta etiqueta.");

  const ida = tipo === "ida";
  const statusEsperado = ida ? "EM_DESLOCAMENTO" : "AGUARDANDO_RETORNO";
  const membros = lote.sinergias.filter((s) => s.status === statusEsperado);
  if (!membros.length) {
    throw new ErroNegocio(
      ida ? "Nenhum colaborador deste grupo está em deslocamento. Confirme o envio antes de imprimir." : "Nenhum colaborador deste grupo está aguardando retorno.",
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const m of membros) {
      await registrarEvento(tx, m.idSinergia, { acao: "ETIQUETA_GERADA", de: m.status, para: m.status, ator, detalhe: { tipo, grupo: lote.idLote } });
    }
  });

  return {
    grupo: true,
    idLote: lote.idLote,
    tipo: ida ? "ida" : "retorno",
    token: ida ? lote.qrToken : lote.qrRetornoToken,
    colaboradores: membros.map((m) => m.colaborador.nomeCompleto),
    total: membros.length,
    origem: ref.areaOrigem.nome,
    destino: ref.areaDestino.nome,
    turno: ref.turno,
    funcao: ref.funcaoDestino ? FUNCOES[ref.funcaoDestino] || ref.funcaoDestino : null,
  };
}

/** Se a transição atômica perder a corrida, explica o estado atual em vez de uma mensagem genérica. */
async function transicionarOuExplicar(args) {
  try {
    return await transicionar(args);
  } catch (err) {
    if (err instanceof ErroNegocio && err.status === 409) {
      const atual = await prisma.sinergiaInterna.findUnique({ where: { idSinergia: args.row.idSinergia }, include: INCLUDE_LISTA });
      const tipo = args.de[0] === "EM_DESLOCAMENTO" ? "ida" : "retorno";
      const permitidas = await areasPermitidas(args.ator.user);
      const motivo = atual && avaliarQr({ row: atual, tipo, permitidas });
      if (motivo) throw new ErroNegocio(motivo, 409);
    }
    throw err;
  }
}

/* ---------- consulta ---------- */

function montarFiltro(f, idEstacao) {
  const where = { idEstacao };
  if (f.status?.length) where.status = { in: f.status };
  if (f.idAreaOrigem) where.idAreaOrigem = Number(f.idAreaOrigem);
  if (f.idAreaDestino) where.idAreaDestino = Number(f.idAreaDestino);
  if (f.turno && TURNOS.includes(f.turno)) where.turno = f.turno;
  if (f.motivo && MOTIVOS[f.motivo]) where.motivo = f.motivo;
  if (/^\d{4}-\d{2}-\d{2}$/.test(f.diaOperacional || "")) {
    const [y, m, d] = f.diaOperacional.split("-").map(Number);
    where.diaOperacional = new Date(y, m - 1, d);
  }
  const de = /^\d{4}-\d{2}-\d{2}$/.test(f.de || "") ? new Date(`${f.de}T00:00:00`) : null;
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(f.ate || "") ? new Date(`${f.ate}T23:59:59.999`) : null;
  if (de || ate) where.dataSolicitacao = { ...(de ? { gte: de } : {}), ...(ate ? { lte: ate } : {}) };
  const busca = String(f.colaborador || "").trim();
  if (busca) {
    where.colaborador = {
      OR: [
        { nomeCompleto: { contains: busca, mode: "insensitive" } },
        { opsId: { contains: busca, mode: "insensitive" } },
        { matricula: { contains: busca, mode: "insensitive" } },
      ],
    };
  }
  return where;
}

async function listar(filtros, ator) {
  const { user, idEstacao } = ator;
  const page = Math.max(Number(filtros.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filtros.limit) || 25, 1), 100);

  const where = montarFiltro(filtros, idEstacao);

  const responsavel = String(filtros.responsavel || "").trim();
  if (responsavel) {
    const usuarios = await prisma.user.findMany({ where: { name: { contains: responsavel, mode: "insensitive" } }, select: { id: true } });
    const ids = usuarios.map((u) => u.id);
    where.OR = CAMPOS_USUARIO.map((campo) => ({ [campo]: { in: ids } }));
  }

  const { status: _ignorado, ...whereSemStatus } = where;
  const [total, rows, porStatus, permitidas] = await Promise.all([
    prisma.sinergiaInterna.count({ where }),
    prisma.sinergiaInterna.findMany({
      where,
      include: INCLUDE_LISTA,
      orderBy: [{ dataSolicitacao: "desc" }, { idSinergia: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sinergiaInterna.groupBy({ by: ["status"], where: whereSemStatus, _count: { _all: true } }),
    areasPermitidas(user),
  ]);

  const nomes = await nomesDeUsuarios(rows);
  const contagem = Object.fromEntries(
    ["SOLICITADA", "EM_DESLOCAMENTO", "SINERGIA_ATIVA", "AGUARDANDO_RETORNO", "FINALIZADA", "CANCELADA", "EXPIRADA"].map((s) => [s, 0])
  );
  porStatus.forEach((g) => {
    contagem[g.status] = g._count._all;
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    contagem,
    sinergias: rows.map((r) => serializar(r, nomes, user, permitidas)),
  };
}

async function detalhe(id, ator) {
  const row = await carregar(id, ator.idEstacao);
  const [eventos, permitidas] = await Promise.all([
    prisma.sinergiaInternaEvento.findMany({ where: { idSinergia: row.idSinergia }, orderBy: [{ criadoEm: "asc" }, { idEvento: "asc" }] }),
    areasPermitidas(ator.user),
  ]);
  const nomes = await nomesDeUsuarios([row]);
  return {
    ...serializar(row, nomes, ator.user, permitidas),
    eventos: eventos.map((e) => ({
      idEvento: e.idEvento,
      acao: e.acao,
      statusAnterior: e.statusAnterior,
      statusNovo: e.statusNovo,
      usuario: e.userNome,
      dispositivo: e.dispositivo,
      detalhe: e.detalhe,
      criadoEm: e.criadoEm,
    })),
  };
}

/* ---------- apoio ao formulário ---------- */

const CODIGO_POR_ESTEIRA = { "esteira u": "ESTEIRA_U", "esteira linear": "LINEAR", "esteira termoplastica": "TERMOPLASTICA", "esteira full": "FULL" };

/** Colaboradores que podem ser movimentados + a área de origem mais provável (alocação atual na Label, senão o setor). */
async function buscarColaboradores({ idEstacao, search }) {
  const termo = String(search || "").trim();
  if (termo.length < 2) return [];

  const [colaboradores, areas] = await Promise.all([
    prisma.colaborador.findMany({
      where: {
        idEstacao,
        status: "ATIVO",
        cargo: FILTRO_CARGO_PRISMA,
        OR: [
          { nomeCompleto: { contains: termo, mode: "insensitive" } },
          { opsId: { contains: termo, mode: "insensitive" } },
          { matricula: { contains: termo, mode: "insensitive" } },
        ],
      },
      select: {
        opsId: true,
        nomeCompleto: true,
        matricula: true,
        setor: { select: { nomeSetor: true } },
        turno: { select: { nomeTurno: true } },
      },
      orderBy: { nomeCompleto: "asc" },
      take: 12,
    }),
    listarAreas(),
  ]);
  if (!colaboradores.length) return [];

  const opsIds = colaboradores.map((c) => c.opsId);
  const [alocacoes, abertas, noDestino] = await Promise.all([
    prisma.mapaAlocacao.findMany({
      where: { idEstacao, opsId: { in: opsIds }, fim: null },
      include: { esteira: { select: { nome: true } } },
    }),
    prisma.sinergiaInterna.findMany({ where: { opsId: { in: opsIds }, status: { in: STATUS_ABERTOS } }, select: { opsId: true, status: true } }),
    sinergiasNoDestino(opsIds),
  ]);

  const idPorCodigo = new Map(areas.map((a) => [a.codigo, a.idArea]));
  const codigoDaAlocacao = (a) => {
    if (a.labor === "FULL_D1") return "FULL_D1";
    if (a.numeroDoca != null) return a.operacaoDoca === "INBOUND" ? "RECEBIMENTO" : a.operacaoDoca === "OUTBOUND" ? "EXPEDICAO" : null;
    if (a.esteira) return CODIGO_POR_ESTEIRA[normaliza(a.esteira.nome)] || null;
    return null;
  };

  return colaboradores.map((c) => {
    const alocacao = alocacoes.find((a) => a.opsId === c.opsId);
    const codigo = (alocacao && codigoDaAlocacao(alocacao)) || codigosDoSetor(c.setor?.nomeSetor)[0] || null;
    const emSinergia = noDestino.get(c.opsId);
    return {
      opsId: c.opsId,
      nomeCompleto: c.nomeCompleto,
      matricula: c.matricula,
      setor: c.setor?.nomeSetor || null,
      turno: c.turno?.nomeTurno || null,
      areaSugerida: codigo ? idPorCodigo.get(codigo) || null : null,
      localizacaoAtual: emSinergia ? emSinergia.areaDestino.nome : null,
      sinergiaAberta: abertas.find((a) => a.opsId === c.opsId)?.status || null,
    };
  });
}

/* ---------- rotina periódica (fim previsto) ---------- */

/**
 * - SINERGIA_ATIVA que chegou ao fim previsto sem prorrogação -> AGUARDANDO_RETORNO
 *   (NÃO finaliza: só o QR de retorno prova que a pessoa voltou).
 * - SOLICITADA / EM_DESLOCAMENTO que passou do período previsto -> EXPIRADA.
 */
async function processarVencimentos() {
  const agora = new Date();
  const ator = { user: null, ip: null, dispositivo: "job" };
  let aguardandoRetorno = 0;
  let expiradas = 0;

  const ativas = await prisma.sinergiaInterna.findMany({
    where: { status: "SINERGIA_ATIVA", fimPrevisto: { lte: agora } },
    include: INCLUDE_LISTA,
  });
  for (const row of ativas) {
    try {
      await comRetentativa(() =>
        transicionar({
          row,
          ator,
          de: ["SINERGIA_ATIVA"],
          dados: { status: "AGUARDANDO_RETORNO", dataFimDestino: agora, qrRetornoToken: gerarToken("RET"), qrRetornoGeradoEm: agora },
          eventos: [{ acao: "FIM_PREVISTO_ATINGIDO" }, { acao: "QR_GERADO", detalhe: { tipo: "retorno" } }],
        })
      );
      aguardandoRetorno += 1;
    } catch (err) {
      if (!(err instanceof ErroNegocio)) throw err; // perdeu a corrida para uma ação manual: ok
    }
  }

  const vencidas = await prisma.sinergiaInterna.findMany({
    where: { status: { in: ["SOLICITADA", "EM_DESLOCAMENTO"] }, fimPrevisto: { lte: agora } },
    include: INCLUDE_LISTA,
  });
  for (const row of vencidas) {
    try {
      await transicionar({
        row,
        ator,
        de: ["SOLICITADA", "EM_DESLOCAMENTO"],
        dados: { status: "EXPIRADA" },
        eventos: [{ acao: "EXPIRADA", detalhe: { motivo: "Período previsto terminou sem confirmação de chegada" } }],
      });
      expiradas += 1;
    } catch (err) {
      if (!(err instanceof ErroNegocio)) throw err;
    }
  }

  return { aguardandoRetorno, expiradas };
}

/* ---------- apresentação de resultados ---------- */

async function apresentar(row, ator) {
  const [nomes, permitidas] = await Promise.all([nomesDeUsuarios([row]), areasPermitidas(ator.user)]);
  return serializar(row, nomes, ator.user, permitidas);
}

async function metadados(ator) {
  const [areas, permitidas] = await Promise.all([listarAreas(), areasPermitidas(ator.user)]);
  const atual = getTurnoOperacionalAtual();
  return {
    areas: areas.map((a) => ({
      idArea: a.idArea,
      codigo: a.codigo,
      nome: a.nome,
      contexto: a.contexto,
      funcoes: funcoesDaArea(a).map((valor) => ({ valor, rotulo: FUNCOES[valor] })),
    })),
    areasPermitidas: [...permitidas],
    motivos: Object.entries(MOTIVOS).map(([codigo, nome]) => ({ codigo, nome })),
    turnoAtual: atual.turno,
    diaOperacionalAtual: atual.diaOperacionalStr,
    podeGerirPermissoes: ["ADMIN", "ALTA_GESTAO"].includes(ator.user.role),
  };
}

module.exports = {
  obterEtiquetaGrupo,
  ErroNegocio,
  criar,
  enviar,
  cancelar,
  finalizarNoDestino,
  prorrogar,
  confirmarRetornoManual,
  reemitirQr,
  obterEtiqueta,
  consultarQr,
  confirmarQr,
  listar,
  detalhe,
  buscarColaboradores,
  processarVencimentos,
  apresentar,
  metadados,
};
