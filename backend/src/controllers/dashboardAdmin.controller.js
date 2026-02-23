const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPeriodoFiltro } = require("../utils/dateRange");

/* =====================================================
   HELPERS
===================================================== */
const normalize = (v) => String(v || "").trim();

const isoDate = (d) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

const daysInclusive = (inicio, fim) => {
  const a = new Date(inicio);
  const b = new Date(fim);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((b - a) / 86400000) + 1;
};
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim();

function agoraBrasil() {
  const now = new Date();
  const spString = now.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  return new Date(spString);
}

function formatTempoEmpresa(dataAdmissao) {
  if (!dataAdmissao) return "-";

  const hoje = new Date();
  const adm = new Date(dataAdmissao);

  let meses =
    (hoje.getFullYear() - adm.getFullYear()) * 12 +
    (hoje.getMonth() - adm.getMonth());

  const anos = Math.floor(meses / 12);
  meses = meses % 12;

  if (anos > 0 && meses > 0) return `${anos}a ${meses}m`;
  if (anos > 0) return `${anos}a`;
  return `${meses}m`;
}

function isCargoElegivel(cargo) {
  const nome = String(cargo || "").toUpperCase();
  // Exclui PCD da contagem
  if (nome.includes("PCD")) {
    return false;
  }
  return (
    nome.includes("AUXILIAR DE LOGÍSTICA I") ||
    nome.includes("AUXILIAR DE LOGÍSTICA II")
  );
}

/* =====================================================
   STATUS DO DIA
===================================================== */
function getStatusDoDia(f) {
  // Presença
  if (f?.horaEntrada) {
    return {
      code: "P",
      contaComoEscalado: true,
      impactaAbsenteismo: false,
    };
  }

  if (f?.tipoAusencia) {
    const codigo = String(f.tipoAusencia.codigo || "").toUpperCase();
    const desc = String(f.tipoAusencia.descricao || "").toUpperCase();

    // NC / ON → fora do HC
    if (codigo === "NC" || codigo === "ON") {
      return {
        code: codigo,
        contaComoEscalado: false,
        impactaAbsenteismo: false,
      };
    }

    // FO → HC APTO, não é ausência
    if (codigo === "FO") {
      return {
        code: "FO",
        contaComoEscalado: true,
        impactaAbsenteismo: false,
      };
    }

    // DSR → fora do HC
    if (codigo === "DSR") {
      return {
        code: "DSR",
        contaComoEscalado: false,
        impactaAbsenteismo: false,
      };
    }

    // Férias
    if (codigo === "FE" || desc.includes("FÉRIAS")) {
      return {
        code: "FE",
        contaComoEscalado: false,
        impactaAbsenteismo: false,
      };
    }

    // Sinergia
    if (codigo === "S1" || desc.includes("SINERGIA")) {
      return {
        code: "S1",
        contaComoEscalado: true,
        impactaAbsenteismo: false,
      };
    }

    // Atestado
    if (codigo === "AM" || desc.includes("ATEST")) {
      return {
        code: "AM",
        contaComoEscalado: true,
        impactaAbsenteismo: true,
      };
    }

    // F / FJ
    return {
      code: codigo,
      contaComoEscalado: true,
      impactaAbsenteismo: true,
    };
  }

  // fallback = falta
  return {
    code: "F",
    contaComoEscalado: true,
    impactaAbsenteismo: true,
  };
}



/* =====================================================
   BUILDERS
===================================================== */
  function buildEscalasResumo({ frequencias, colaboradoresMap, inicio, fim }) {
  const diasPeriodo = daysInclusive(inicio, fim);
  const map = {};

  frequencias.forEach((f) => {
    const s = getStatusDoDia(f);
    if (!s.contaComoEscalado) return;

    const c = colaboradoresMap.get(f.opsId);
    if (!c) return;

    const escObj = c.escala;
    const esc = escObj
      ? `${escObj.nomeEscala} (${escObj.descricao})`
      : "N/I";

    if (!map[esc]) {
      map[esc] = { escala: esc, ops: new Set(), absDias: 0 };
    }

    map[esc].ops.add(f.opsId);

    if (s.impactaAbsenteismo) {
      map[esc].absDias++;
    }
  });

  return Object.values(map).map((e) => {
    const totalColaboradores = e.ops.size;
    const diasEsperados = totalColaboradores * diasPeriodo;

    return {
      escala: e.escala,
      totalColaboradores,
      absenteismo:
        diasEsperados > 0
          ? Number(((e.absDias / diasEsperados) * 100).toFixed(2))
          : 0,
    };
  });
}

  function buildSetoresResumo({ frequencias, colaboradoresMap, inicio, fim }) {
    const diasPeriodo = daysInclusive(inicio, fim);
    const map = {};

    frequencias.forEach((f) => {
      const s = getStatusDoDia(f);
      if (!s.contaComoEscalado) return;

      const c = colaboradoresMap.get(f.opsId);
      if (!c) return;

      const setor = c.setor?.nomeSetor || "Sem setor";

      if (!map[setor]) {
        map[setor] = { setor, ops: new Set(), absDias: 0 };
      }

      map[setor].ops.add(f.opsId);

      if (s.impactaAbsenteismo) {
        map[setor].absDias++;
      }
    });

    return Object.values(map).map((x) => {
      const totalColaboradores = x.ops.size;
      const diasEsperados = totalColaboradores * diasPeriodo;

      return {
        setor: x.setor,
        totalColaboradores,
        absenteismo:
          diasEsperados > 0
            ? Number(((x.absDias / diasEsperados) * 100).toFixed(2))
            : 0,
      };
    });
  }

  function buildLideresResumo({ frequencias, colaboradoresMap, inicio, fim }) {
    const diasPeriodo = daysInclusive(inicio, fim);
    const map = {};

    frequencias.forEach((f) => {
      const s = getStatusDoDia(f);
      if (!s.contaComoEscalado) return;

      const c = colaboradoresMap.get(f.opsId);
      if (!c) return;

      const lider = c.lider?.nomeCompleto || "Sem líder";

      if (!map[lider]) {
        map[lider] = { lider, ops: new Set(), absDias: 0 };
      }

      map[lider].ops.add(f.opsId);

      if (s.impactaAbsenteismo) {
        map[lider].absDias++;
      }
    });

    return Object.values(map).map((x) => {
      const totalColaboradores = x.ops.size;
      const diasEsperados = totalColaboradores * diasPeriodo;

      return {
        lider: x.lider,
        totalColaboradores,
        absenteismo:
          diasEsperados > 0
            ? Number(((x.absDias / diasEsperados) * 100).toFixed(2))
            : 0,
      };
    });
  }

  function buildSetores(colaboradoresPeriodo, frequencias, colaboradoresMap) {
    const map = {};

    frequencias.forEach(f => {
      const s = getStatusDoDia(f);

      // 🔑 só quem estava escalado
      if (!s.contaComoEscalado) return;

      const c = colaboradoresMap.get(f.opsId);
      if (!c) return;

      const setor = c.setor?.nomeSetor || "Sem setor";

      if (!map[setor]) {
        map[setor] = {
          setor,
          total: 0,
          absDias: 0,
        };
      }

      map[setor].total++;

      if (s.impactaAbsenteismo) {
        map[setor].absDias++;
      }
    });

    return Object.values(map).map(s => ({
      setor: s.setor,
      totalColaboradores: s.total,
      absenteismo:
        s.total > 0
          ? Number(((s.absDias / s.total) * 100).toFixed(2))
          : 0,
    }));
  }
/* ---------- GÊNERO ---------- */
function buildGenero(colaboradores) {
  const map = {};
  colaboradores.forEach((c) => {
    const g = normalize(c.genero) || "N/I";
    map[g] = (map[g] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/* ---------- Média de Idade ---------- */
function buildIdadeMedia(colaboradores) {
  const hoje = new Date();
  const idades = colaboradores
    .filter(c => c.dataNascimento)
    .map(c => {
      const nasc = new Date(c.dataNascimento);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      return idade;
    });

  if (!idades.length) return 0;

  return Math.round(
    idades.reduce((a, b) => a + b, 0) / idades.length
  );
}

/* ---------- Tempo Médio de empresa ---------- */
function buildTempoMedioEmpresa(colaboradores) {
  const hoje = new Date();

  const tempos = colaboradores
    .filter(c => c.dataAdmissao)
    .map(c => {
      const adm = new Date(c.dataAdmissao);
      return Math.floor((hoje - adm) / 86400000);
    });

  if (!tempos.length) return 0;

  return Math.round(
    tempos.reduce((a, b) => a + b, 0) / tempos.length
  );
}

/* ---------- STATUS dos COLABORADORES ---------- */
function buildStatusColaboradores({
  colaboradores,
  atestados,
}) {
  const status = {
    ativos: 0,
    afastadosCurto: 0,
    inss: 0,
    ferias: 0,
    inativos: 0,
  };

  /* ===============================
     MAPA DE ATESTADOS (DIAS)
  =============================== */
  const atestadosMap = new Map();
  atestados.forEach(a => {
    const dias = daysInclusive(a.dataInicio, a.dataFim);
    atestadosMap.set(a.opsId, dias);
  });

  /* ===============================
     CLASSIFICAÇÃO FINAL
  =============================== */
  colaboradores.forEach(c => {
    const statusColab = String(c.status).toUpperCase();

    // 1️⃣ INATIVO
    if (statusColab === "INATIVO") {
      status.inativos++;
      return;
    }

    // 2️⃣ FÉRIAS
    if (statusColab === "FERIAS") {
      status.ferias++;
      return;
    }

    // 3️⃣ AFASTADO (refinado por atestado)
    if (statusColab === "AFASTADO") {
      const diasAtestado = atestadosMap.get(c.opsId) || 0;

      if (diasAtestado >= 16) {
        status.inss++;
      } else {
        status.afastadosCurto++;
      }
      return;
    }

    // 4️⃣ ATIVO
    status.ativos++;
  });

  const indisponiveis =
    status.afastadosCurto + status.inss + status.ferias;

  return {
    ...status,
    indisponiveis,
    percentualIndisponivel:
      colaboradores.length > 0
        ? Number(
            ((indisponiveis / colaboradores.length) * 100).toFixed(2)
          )
        : 0,
  };
}


/* ---------- ESCALAS ---------- */
function buildEscalas(colaboradores, frequencias, colaboradoresMap) {
  const map = {};

  frequencias.forEach(f => {
    const s = getStatusDoDia(f);

    // 🔑 só quem estava escalado no dia
    if (!s.contaComoEscalado) return;

    const c = colaboradoresMap.get(f.opsId);
    if (!c) return;

    const esc = c.escala?.nomeEscala || "N/I";

    if (!map[esc]) {
      map[esc] = {
        escala: esc,
        total: 0,
        absDias: 0,
      };
    }

    // TOTAL = escalados do dia naquela escala
    map[esc].total++;

    // ABS = ausência real (F, FJ, AM)
    if (s.impactaAbsenteismo) {
      map[esc].absDias++;
    }
  });

  return Object.values(map).map(e => ({
    escala: e.escala,
    total: e.total,
    absenteismo:
      e.total > 0
        ? Number(((e.absDias / e.total) * 100).toFixed(2))
        : 0,
  }));
}



/* ---------- Lideres ---------- */
function buildLideres(colaboradores, frequencias, colaboradoresMap) {
  const map = {};

  frequencias.forEach(f => {
    const s = getStatusDoDia(f);

    // 🔑 só quem estava escalado no dia
    if (!s.contaComoEscalado) return;

    const c = colaboradoresMap.get(f.opsId);
    if (!c) return;

    const lider = c.lider?.nomeCompleto || "Sem líder";

    if (!map[lider]) {
      map[lider] = {
        lider,
        total: 0,
        absDias: 0,
      };
    }

    // TOTAL = escalados do dia sob esse líder
    map[lider].total++;

    // ABS = ausência real (F, FJ, AM)
    if (s.impactaAbsenteismo) {
      map[lider].absDias++;
    }
  });

  return Object.values(map)
    .map(l => ({
      lider: l.lider,
      totalColaboradores: l.total,
      absenteismo:
        l.total > 0
          ? Number(((l.absDias / l.total) * 100).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.absenteismo - a.absenteismo);
}

/* ---------- OVERVIEW ---------- */
function buildOverview({ frequencias, inicio, fim }) {
  if (!frequencias.length) {
    return {
      totalColaboradores: 0,
      presentes: 0,
      absenteismo: 0,
      faltas: 0,
    };
  }

  const diasPeriodo = daysInclusive(inicio, fim);

  let absDias = 0;
  let faltasDias = 0;

  const escaladosSet = new Set();
  const presentesSet = new Set();

  frequencias.forEach(f => {
    const s = getStatusDoDia(f);

    // só quem estava escalado no dia
    if (!s.contaComoEscalado) return;

    escaladosSet.add(f.opsId);

    if (s.code === "P") {
      presentesSet.add(f.opsId);
    }

    if (s.impactaAbsenteismo) {
      absDias++;
    }

    if (s.code === "F" || s.code === "FJ") {
      faltasDias++;
    } 
  });

  const totalEscalados = escaladosSet.size;
  const diasEsperados = totalEscalados * diasPeriodo;

  return {
    totalColaboradores: totalEscalados,
    presentes: presentesSet.size,
    faltas: faltasDias,
    absenteismo:
      diasEsperados > 0
        ? Number(((absDias / diasEsperados) * 100).toFixed(2))
        : 0,
  };
}


/* ---------- TURNOVER GLOBAL ---------- */
function buildTurnoverGlobal({
  totalColaboradores,
  admitidosPeriodo,
  desligadosPeriodo,
}) {
  if (!totalColaboradores) return 0;

  const mediaMovimentacao =
    (admitidosPeriodo + desligadosPeriodo) / 2;

  return Number(
    ((mediaMovimentacao / totalColaboradores) * 100).toFixed(2)
  );
}


/* ---------- EVENTOS ---------- */
/* ---------- EVENTOS ---------- */
function buildEventos({ colaboradoresMap, atestados, acidentes, medidas }) {
  const eventos = [];

  atestados.forEach((a) => {
    const c = colaboradoresMap.get(a.opsId);
    eventos.push({
      id: `AT-${a.idAtestado}`,
      nome: c?.nomeCompleto || "-",
      empresa: c?.empresa?.razaoSocial || "-",
      setor: c?.setor?.nomeSetor || "-",
      lider: c?.lider?.nomeCompleto || "-",
      tempoEmpresa: formatTempoEmpresa(c?.dataAdmissao),
      evento: "Atestado",
      data: a.dataInicio,
    });
  });

  medidas.forEach((m) => {
    const c = colaboradoresMap.get(m.opsId);
    eventos.push({
      id: `MD-${m.idMedida}`,
      nome: c?.nomeCompleto || "-",
      empresa: c?.empresa?.razaoSocial || "-",
      setor: c?.setor?.nomeSetor || "-",
      lider: c?.lider?.nomeCompleto || "-",
      tempoEmpresa: formatTempoEmpresa(c?.dataAdmissao),
      evento: "Medida Disciplinar",
      data: m.dataAplicacao,
    });
  });

  acidentes.forEach((a) => {
    const c = colaboradoresMap.get(a.opsIdColaborador);
    eventos.push({
      id: `AC-${a.idAcidente}`,
      nome: c?.nomeCompleto || "-",
      empresa: c?.empresa?.razaoSocial || "-",
      setor: c?.setor?.nomeSetor || "-",
      lider: c?.lider?.nomeCompleto || "-",
      tempoEmpresa: formatTempoEmpresa(c?.dataAdmissao),
      evento: "Acidente",
      data: a.dataOcorrencia,
    });
  });

  /* 🔁 REINCIDÊNCIA */
  const contador = {};
  eventos.forEach(e => {
    const key = `${e.nome}-${e.evento}`;
    contador[key] = (contador[key] || 0) + 1;
  });

  eventos.forEach(e => {
    const key = `${e.nome}-${e.evento}`;
    e.reincidente = contador[key] > 1;
    e.qtdeEventos = contador[key];
  });

  return eventos.sort(
    (a, b) => new Date(b.data) - new Date(a.data)
  );
}


/* ---------- EMPRESAS RESUMO + TURNOVER + ABSENTEÍSMO ---------- */
function buildEmpresasResumo({
  colaboradores,
  colaboradoresMap,
  frequencias,
  atestados,
  medidas,
  acidentes,
  desligados,
  admitidos,
  inicio,
  fim,
}) {
  const diasPeriodo = daysInclusive(inicio, fim);
  const map = {};
  const colaboradoresAtivosPeriodo = {};

  // 🔑 BASE GLOBAL: quem esteve escalado no período
  const escaladosSetGlobal = new Set(
    frequencias
      .filter(f => getStatusDoDia(f).contaComoEscalado)
      .map(f => f.opsId)
  );

  /* ===============================
     BASE: COLABORADORES POR EMPRESA
  =============================== */
  colaboradores.forEach(c => {
    const emp = c.empresa?.razaoSocial || "Sem empresa";

    if (!map[emp]) {
      map[emp] = {
        empresa: emp,
        colaboradores: [],
        totalColaboradoresCadastrados: 0,
        presentes: new Set(),
        absDias: 0,
        faltas: 0,

        // 🔁 AJUSTE AQUI
        atestadosSet: new Set(),

        medidasDisciplinares: 0,
        acidentes: 0,
        desligados: 0,
        admitidos: 0,
      };
    }

    map[emp].totalColaboradoresCadastrados++;
    map[emp].colaboradores.push(c);
  });

  /* ===============================
     FREQUÊNCIAS
  =============================== */
  frequencias.forEach(f => {
    const c = colaboradoresMap.get(f.opsId);
    if (!c) return;

    const emp = c.empresa?.razaoSocial || "Sem empresa";
    const s = getStatusDoDia(f);

    if (!colaboradoresAtivosPeriodo[emp]) {
      colaboradoresAtivosPeriodo[emp] = new Set();
    }

    if (s.contaComoEscalado) {
      colaboradoresAtivosPeriodo[emp].add(f.opsId);
    }

    if (s.code === "P") {
      map[emp].presentes.add(f.opsId);
    }

    if (s.impactaAbsenteismo) {
      map[emp].absDias++;
    }
    // 👇 SOMA FALTAS (F e FJ)
    if (s.code === "F" || s.code === "FJ") {
      map[emp].faltas++;
    }
  });

  /* ===============================
     EVENTOS (AJUSTADO)
  =============================== */

  // ✅ ATESTADOS = DISTINCT opsId + somente escalados
  atestados.forEach(a => {
    if (!escaladosSetGlobal.has(a.opsId)) return;

    const c = colaboradoresMap.get(a.opsId);
    if (!c) return;

    const emp = c.empresa?.razaoSocial || "Sem empresa";
    map[emp].atestadosSet.add(a.opsId);
  });

  // ❌ mantém contagem simples (evento administrativo)
  medidas.forEach(m => {
    const c = colaboradoresMap.get(m.opsId);
    if (c) map[c.empresa?.razaoSocial || "Sem empresa"].medidasDisciplinares++;
  });

  acidentes.forEach(a => {
    const c = colaboradoresMap.get(a.opsIdColaborador);
    if (c) map[c.empresa?.razaoSocial || "Sem empresa"].acidentes++;
  });

  desligados.forEach(c => {
    const emp = c.empresa?.razaoSocial || "Sem empresa";
    if (map[emp]) map[emp].desligados++;
  });

  admitidos.forEach(c => {
    const emp = c.empresa?.razaoSocial || "Sem empresa";
    if (map[emp]) map[emp].admitidos++;
  });

  /* ===============================
     CALCULA EMPRESAS
  =============================== */
  const empresas = Object.values(map).map(e => {
    const totalPeriodo =
      colaboradoresAtivosPeriodo[e.empresa]?.size || 0;

    const diasEsperados = totalPeriodo * diasPeriodo;

    const absenteismo =
      diasEsperados > 0
        ? Number(((e.absDias / diasEsperados) * 100).toFixed(2))
        : 0;

    const mediaMovimentacao = (e.admitidos + e.desligados) / 2;

    const turnover =
      totalPeriodo > 0
        ? Number(((mediaMovimentacao / totalPeriodo) * 100).toFixed(2))
        : 0;

    return {
      empresa: e.empresa,
      totalColaboradores: totalPeriodo,
      presentes: e.presentes.size,
      totalColaboradoresCadastrados: e.totalColaboradoresCadastrados,

      absenteismo,
      faltas: e.faltas || 0,
      medidasDisciplinares: e.medidasDisciplinares,

      // ✅ AJUSTE AQUI
      atestadosSet: e.atestadosSet,
      atestados: e.atestadosSet.size,

      acidentes: e.acidentes,
      turnover,
      tempoMedioEmpresaDias: buildTempoMedioEmpresa(e.colaboradores),
    };
  });

  /* ===============================
     TOTAL BPO (DISTINCT GLOBAL)
  =============================== */
  const bpoEmpresas = ["ADECCO", "ADILIS", "LUANDRE"];
  const bpo = empresas.filter(e =>
    bpoEmpresas.includes(e.empresa.toUpperCase())
  );

  if (bpo.length) {
    const totalColaboradores = bpo.reduce(
      (s, e) => s + e.totalColaboradores,
      0
    );

    const totalColaboradoresCadastrados = bpo.reduce(
      (s, e) => s + (e.totalColaboradoresCadastrados || 0),
      0
    );

    const presentes = bpo.reduce((s, e) => s + e.presentes, 0);

    // ✅ DISTINCT GLOBAL BPO
    const atestadosBpoSet = new Set();
    bpo.forEach(e => {
      e.atestadosSet?.forEach(id => atestadosBpoSet.add(id));
    });

    const medidasTot = bpo.reduce(
      (s, e) => s + e.medidasDisciplinares,
      0
    );

    const acidentesTot = bpo.reduce(
      (s, e) => s + e.acidentes,
      0
    );

    const mediaMov = (admitidos.length + desligados.length) / 2;

    const turnover =
      totalColaboradores > 0
        ? Number(((mediaMov / totalColaboradores) * 100).toFixed(2))
        : 0;

    const faltasTot = bpo.reduce(
      (s, e) => s + (e.faltas || 0),
      0
    );

    empresas.push({
      empresa: "TOTAL BPO",
      totalColaboradores,
      totalColaboradoresCadastrados,
      presentes,
      absenteismo:
        totalColaboradores > 0
          ? Number(
              (
                bpo.reduce(
                  (s, e) => s + e.absenteismo * e.totalColaboradores,
                  0
                ) / totalColaboradores
              ).toFixed(2)
            )
          : 0,
      medidasDisciplinares: medidasTot,
      faltas: faltasTot,

      // ✅ AJUSTE FINAL
      atestados: atestadosBpoSet.size,

      acidentes: acidentesTot,
      turnover,
      tempoMedioEmpresaDias: Math.round(
        bpo.reduce(
          (s, e) => s + e.tempoMedioEmpresaDias * e.totalColaboradores,
          0
        ) / totalColaboradores
      ),
    });
  }

  const ORDEM_EMPRESAS = [
    "SPX",
    "TOTAL BPO",
    "ADECCO",
    "ADILIS",
    "LUANDRE",
  ];

  empresas.sort((a, b) => {
    const ia = ORDEM_EMPRESAS.indexOf(a.empresa.toUpperCase());
    const ib = ORDEM_EMPRESAS.indexOf(b.empresa.toUpperCase());

    if (ia === -1 && ib === -1) return a.empresa.localeCompare(b.empresa);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return empresas;
}

  function buildHierarquia({
    colaboradores,
    frequencias,
    atestados,
    inicio,
    fim,
    turnoSelecionado
  }) {
    const diasPeriodo = daysInclusive(inicio, fim);

    // 🔹 Mapear frequências por opsId
    const freqMap = {};
    frequencias.forEach((f) => {
      if (!freqMap[f.opsId]) freqMap[f.opsId] = [];
      freqMap[f.opsId].push(f);
    });

    //  Mapear quantidade real de atestados por colaborador
    const atestadoCountMap = new Map();

    atestados.forEach((a) => {
      atestadoCountMap.set(
        a.opsId,
        (atestadoCountMap.get(a.opsId) || 0) + 1
      );
    });

    const gerentesMap = new Map();

    // =============================
    // 1️⃣ GERENTES
    // =============================
    colaboradores.forEach((c) => {
      if (!c.idLider) {
        gerentesMap.set(c.opsId, {
          id: c.opsId,
          nome: c.nomeCompleto,
          supervisores: new Map(),
          totalColaboradores: 0,
          faltas: 0,
          atestados: 0,
          absDias: 0,
        });
      }
    });

    // =============================
    // 2️⃣ SUPERVISORES (FILTRAR POR CARGO)
    // =============================
    colaboradores.forEach((c) => {
      if (!c.idLider) return;

      const gerenteNode = gerentesMap.get(c.idLider);
      if (!gerenteNode) return;

      const cargo = norm(c.cargo?.nomeCargo);
      const isSupervisor = cargo.includes("supervisor");

      if (!isSupervisor) return; // 🔥 CORREÇÃO PRINCIPAL

      if (!gerenteNode.supervisores.has(c.opsId)) {
        gerenteNode.supervisores.set(c.opsId, {
          id: c.opsId,
          nome: c.nomeCompleto,
          lideres: new Map(),
          supervisionadosDiretos: [], // 🔥 importante já deixar aqui
          totalColaboradores: 0,
          faltas: 0,
          atestados: 0,
          absDias: 0,
        });
      }
    });

    // =============================
    // 3️⃣ LÍDERES (BASEADO EM CARGO E SUPERVISOR REAL)
    // =============================
    colaboradores.forEach((c) => {
      if (!c.idLider) return;

      const cargo = norm(c.cargo?.nomeCargo);
      const isLider = cargo.includes("lider");

      if (!isLider) return;

      // 🔎 Encontrar supervisor correto
      gerentesMap.forEach((gerenteNode) => {
        const supervisorNode = gerenteNode.supervisores.get(c.idLider);

        if (!supervisorNode) return;

        if (!supervisorNode.lideres.has(c.opsId)) {
          supervisorNode.lideres.set(c.opsId, {
            id: c.opsId,
            nome: c.nomeCompleto,
            colaboradores: [],
            totalColaboradores: 0,
            faltas: 0,
            atestados: 0,
            absDias: 0,
          });
        }
      });
    });

    // 🔥 FILTRO DE TURNO PARA OPERADORES
    const colaboradoresOperacionais =
      !turnoSelecionado || turnoSelecionado === "ALL"
        ? colaboradores
        : colaboradores.filter((c) => {
            const cargo = norm(c.cargo?.nomeCargo);

            const isEstrutura =
              cargo.includes("gerente") ||
              cargo.includes("supervisor") ||
              cargo.includes("lider");

            if (isEstrutura) return false;

            return c.turno?.nomeTurno === turnoSelecionado;
          });

    // =============================
    // 4️⃣ OPERADORES + MÉTRICAS (CORRIGIDO)
    // =============================

    colaboradoresOperacionais.forEach((c) => {
      if (!c.idLider) return;

      const cargo = norm(c.cargo?.nomeCargo);

      const isSupervisor = cargo.includes("supervisor");
      const isLider = cargo.includes("lider");

      // Só operadores
      if (isSupervisor || isLider) return;

      const freqs = freqMap[c.opsId] || [];

      let absDias = 0;
      let faltas = 0;

      freqs.forEach((f) => {
        const status = getStatusDoDia(f);
        if (!status.contaComoEscalado) return;

        if (status.impactaAbsenteismo) absDias++;
        if (status.code === "F" || status.code === "FJ") faltas++;
      });

      const atestado = atestadoCountMap.get(c.opsId) || 0;

      // 🔎 1️⃣ Encontrar supervisor correto
      let supervisorNode = null;
      let gerenteNode = null;
      let liderNode = null;

      gerentesMap.forEach((g) => {
        const sup = g.supervisores.get(c.idLider);

        if (sup) {
          supervisorNode = sup;
          gerenteNode = g;
        }

        g.supervisores.forEach((s) => {
          const l = s.lideres.get(c.idLider);
          if (l) {
            liderNode = l;
            supervisorNode = s;
            gerenteNode = g;
          }
        });
      });

      if (!supervisorNode || !gerenteNode) return;

      // 🔹 Se for operador direto do supervisor
      if (!liderNode) {
        supervisorNode.supervisionadosDiretos.push({
          opsId: c.opsId,
          nome: c.nomeCompleto,
          setor: c.setor?.nomeSetor || "-",
          empresa: c.empresa?.razaoSocial || "-",
        });
      } else {
        liderNode.colaboradores.push({
          opsId: c.opsId,
          nome: c.nomeCompleto,
          setor: c.setor?.nomeSetor || "-",
          empresa: c.empresa?.razaoSocial || "-",
        });

        // Métricas líder
        liderNode.totalColaboradores++;
        liderNode.faltas += faltas;
        liderNode.atestados += atestado;
        liderNode.absDias += absDias;
      }

      // Métricas supervisor
      supervisorNode.totalColaboradores++;
      supervisorNode.faltas += faltas;
      supervisorNode.atestados += atestado;
      supervisorNode.absDias += absDias;

      // Métricas gerente
      gerenteNode.totalColaboradores++;
      gerenteNode.faltas += faltas;
      gerenteNode.atestados += atestado;
      gerenteNode.absDias += absDias;
    });
    
    // =============================
    // 5️⃣ FINALIZAR ABSENTEÍSMO %
    // =============================
    const finalizarMetricas = (node) => {
      const diasEsperados = node.totalColaboradores * diasPeriodo;

      return {
        ...node,
        absenteismo:
          diasEsperados > 0
            ? Number(((node.absDias / diasEsperados) * 100).toFixed(2))
            : 0,
      };
    };

    return Array.from(gerentesMap.values()).map((g) => {
      const gerenteFinal = finalizarMetricas(g);

      const supervisoresFiltrados = Array.from(g.supervisores.values())
        .map((s) => {
          const supervisorFinal = finalizarMetricas(s);

          const lideresFiltrados = Array.from(s.lideres.values())
            .map((l) => finalizarMetricas(l))
            .filter((l) => l.totalColaboradores > 0); // remove líderes vazios

          return {
            ...supervisorFinal,
            lideres: lideresFiltrados,
          };
        })
        .filter(
          (s) =>
            s.totalColaboradores > 0 || s.lideres.length > 0
        ); // remove supervisor vazio

      return {
        ...gerenteFinal,
        supervisores: supervisoresFiltrados,
      };
    });
  }

  function buildResumoHierarquia(hierarquia) {
    return {
      totalGerentes: hierarquia.length,
      totalSupervisores: hierarquia.reduce(
        (acc, g) => acc + g.supervisores.length,
        0
      ),
      totalLideres: hierarquia.reduce(
        (acc, g) =>
          acc +
          g.supervisores.reduce(
            (sAcc, s) => sAcc + s.lideres.length,
            0
          ),
        0
      ),
    };
  }

/* =====================================================
   CONTROLLER — DASHBOARD ADMIN
===================================================== */
const carregarDashboardAdmin = async (req, res) => {
  try {
  /* ===============================
    📅 DATA PADRÃO = HOJE (BRASIL)
  ================================ */
  const agora = agoraBrasil();

  //  ACEITA TANTO inicio/fim QUANTO dataInicio/dataFim
  const {
    inicio,
    fim,
    dataInicio,
    dataFim,
    turno,
  } = req.query;

  // Normaliza parâmetros de data
  const inicioQuery = inicio || dataInicio;
  const fimQuery = fim || dataFim;

  let inicioFinal;
  let fimFinal;

  if (inicioQuery && fimQuery) {
    inicioFinal = new Date(inicioQuery);
    inicioFinal.setHours(0, 0, 0, 0);

    fimFinal = new Date(fimQuery);
    fimFinal.setHours(23, 59, 59, 999);
  } else {
    const base = new Date(agora);

    inicioFinal = new Date(base);
    inicioFinal.setHours(0, 0, 0, 0);

    fimFinal = new Date(base);
    fimFinal.setHours(23, 59, 59, 999);
  }

  // 🔎 DEBUG
  console.log("Query recebida:", req.query);
  console.log("Período usado:", inicioFinal, fimFinal);

  // 🔥 NORMALIZA TURNO
  const turnoSelecionado = String(turno || "ALL").toUpperCase();
  const isAll = turnoSelecionado === "ALL";

    /* ===============================
       COLABORADORES BASE
    =============================== */
    const colaboradores = await prisma.colaborador.findMany({
      where: {
        status: { in: ["ATIVO", "FERIAS", "AFASTADO"] },
      },
      include: {
        empresa: true,
        setor: true,
        turno: true,
        escala: true,
        cargo: true,
        lider: {
          include:  {
            lider: {
              include: {
                lider: true
              }
            }
          }
        }
      },
    });

    /* 🔥 FILTRO DE TURNO CORRETO */
    const colaboradoresTurno = isAll
      ? colaboradores
      : colaboradores.filter(
          (c) => c.turno?.nomeTurno === turnoSelecionado
        );

    const colaboradoresBase =
      !turnoSelecionado || turnoSelecionado === "ALL"
      ? colaboradores
      : colaboradores.filter(c => c.turno?.nomeTurno === turnoSelecionado);

    const colaboradoresAtivosGerais = colaboradoresTurno.filter(
      c => c.status === "ATIVO"
    );

    const totalHeadCount = colaboradoresAtivosGerais.length;
    const totalOperacao = colaboradoresAtivosGerais.filter(
      c => isCargoElegivel(c.cargo?.nomeCargo)
    ).length;

    const totalReturns = colaboradoresAtivosGerais.filter(
      c => String(c.cargo?.nomeCargo || "")
        .toUpperCase()
        .includes("RETURN")
    ).length;

    const colaboradoresFiltrados = colaboradoresBase.filter(
      c => isCargoElegivel(c.cargo?.nomeCargo)
    );

    const opsIds = colaboradoresFiltrados.map(c => c.opsId);

    if (!opsIds.length) {
      return res.json({
        success: true,
        data: {
          periodo: { inicio: isoDate(inicioFinal), fim: isoDate(fimFinal) },
          kpis: {},
          statusColaboradores: {},
          genero: [],
          empresasResumo: [],
          escalas: [],
          lideres: [],
          setores: [],
          eventos: [],
        },
      });
    }

    const colaboradoresMap = new Map(
      colaboradoresFiltrados.map(c => [c.opsId, c])
    );

    /* ===============================
       DADOS AUXILIARES
    =============================== */
/* ===============================
   BASE REAL DO PERÍODO (ESCALADOS)
=============================== */
    const frequencias = await prisma.frequencia.findMany({
      where: {
        opsId: { in: opsIds },
        dataReferencia: { gte: inicioFinal, lte: fimFinal },
      },
      include: { tipoAusencia: true },
    });

    const opsIdsEscaladosPeriodo = Array.from(
      new Set(
        frequencias
          .filter(f => getStatusDoDia(f).contaComoEscalado)
          .map(f => f.opsId)
      )
    );

    // colaboradores realmente escalados no período
    const colaboradoresPeriodo = colaboradoresFiltrados.filter(c =>
      opsIdsEscaladosPeriodo.includes(c.opsId)
    );
    
    const atestados = await prisma.atestadoMedico.findMany({
      where: {
        opsId: { in: opsIds },
        dataInicio: { lte: fimFinal },
        dataFim: { gte: inicioFinal },
      },
    });


    const colaboradoresEstrutura = colaboradores;
    const hierarquia = buildHierarquia({
      colaboradores: colaboradoresEstrutura,
      frequencias,
      atestados,
      inicio: inicioFinal,
      fim: fimFinal,
      turnoSelecionado: turnoSelecionado, // 🔥 ESSENCIAL
    });
    const resumoHierarquia = buildResumoHierarquia(hierarquia);

    const medidas = await prisma.medidaDisciplinar.findMany({
      where: {
        opsId: { in: opsIds },
        dataAplicacao: { gte: inicioFinal, lte: fimFinal },
      },
    });

    const acidentes = await prisma.acidenteTrabalho.findMany({
      where: {
        opsIdColaborador: { in: opsIds },
        dataOcorrencia: { gte: inicioFinal, lte: fimFinal },
      },
    });

    const desligados = await prisma.colaborador.findMany({
      where: {
        status: "INATIVO",
        dataDesligamento: { gte: inicioFinal, lte: fimFinal },
      },
    });

    const admitidos = await prisma.colaborador.findMany({
      where: {
        dataAdmissao: { gte: inicioFinal, lte: fimFinal },
      },
    });

    const overview = buildOverview({
      frequencias,
      inicio: inicioFinal,
      fim: fimFinal
    });

    /* ===============================
       RESPONSE FINAL
    =============================== */
    return res.json({
      success: true,
      data: {
        periodo: {
          inicio: isoDate(inicioFinal),
          fim: isoDate(fimFinal),
        },

        kpis: {
          headcountTotal: totalHeadCount,
          headcountOperacao: totalOperacao,
          headcountReturns: totalReturns,
          totalColaboradores: overview.totalColaboradores,
          presentes: overview.presentes,
          absenteismo: overview.absenteismo,
          turnover: buildTurnoverGlobal({
            totalColaboradores: overview.totalColaboradores,
            admitidosPeriodo: admitidos.length,
            desligadosPeriodo: desligados.length,
          }),
          atestados: atestados.filter(a =>
            opsIdsEscaladosPeriodo.includes(a.opsId)
          ).length,
          faltas: overview.faltas,
          medidasDisciplinares: medidas.length,
          acidentes: acidentes.length,
          idadeMedia: buildIdadeMedia(colaboradoresPeriodo),
          tempoMedioEmpresaDias: buildTempoMedioEmpresa(colaboradoresPeriodo),
        },

        statusColaboradores: buildStatusColaboradores({
          colaboradores: colaboradoresPeriodo,
          atestados,
        }),

        genero: buildGenero(colaboradoresPeriodo),

        empresasResumo: buildEmpresasResumo({
          colaboradores: colaboradoresFiltrados,
          colaboradoresMap,
          frequencias,
          atestados,
          medidas,
          acidentes,
          desligados,
          admitidos,
          inicio: inicioFinal,
          fim: fimFinal,
        }),
        
        escalas: buildEscalasResumo({
          frequencias,
          colaboradoresMap,
          inicio: inicioFinal,
          fim: fimFinal
        }),

        setores: buildSetoresResumo({
          frequencias,
          colaboradoresMap,
          inicio: inicioFinal,
          fim: fimFinal
        }),

        lideres: buildLideresResumo({
          frequencias,
          colaboradoresMap,
          inicio: inicioFinal,
          fim: fimFinal
        }),
        hierarquia,
        resumoHierarquia,

        eventos: buildEventos({
          colaboradoresMap,
          atestados,
          acidentes,
          medidas,
        }),
      },
    });
  } catch (error) {
    console.error("❌ Erro dashboard admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao carregar dashboard administrativo",
    });
  }
};

module.exports = { carregarDashboardAdmin };
