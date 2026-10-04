/**
 * Horário de início da jornada permitido para cada turno.
 * Fonte única para o cadastro individual e a importação em massa.
 */
const HORARIO_INICIO_POR_TURNO = {
  ADM: "08:00",
  T1: "05:25",
  T2: "13:20",
  T3: "21:00",
};

function horarioPadraoDoTurno(nomeTurno) {
  return HORARIO_INICIO_POR_TURNO[String(nomeTurno ?? "").trim().toUpperCase()] ?? null;
}

// Aceita "5:25", "05:25" ou "05:25:00" e devolve "HH:MM" (ou null)
function normalizarHorario(valor) {
  const m = String(valor ?? "").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

// Em UTC (sufixo Z): a coluna é TIME e não pode depender do fuso do servidor
function horarioParaDate(hhmm) {
  return new Date(`1970-01-01T${hhmm}:00Z`);
}

/**
 * Resolve o horário de início de jornada a gravar no cadastro.
 * - sem horário informado: usa o padrão do turno (nunca null);
 * - horário informado diferente do padrão do turno: erro;
 * - turno sem padrão definido: erro.
 */
function resolverHorarioJornada(nomeTurno, horarioInformado) {
  const esperado = horarioPadraoDoTurno(nomeTurno);
  if (!esperado) {
    return { erro: `Turno "${nomeTurno ?? "N/A"}" não possui horário de início definido (aceitos: ADM, T1, T2, T3).` };
  }

  const vazio = horarioInformado === undefined || horarioInformado === null || String(horarioInformado).trim() === "";
  if (!vazio) {
    const informado = normalizarHorario(horarioInformado);
    if (informado !== esperado) {
      return { erro: `Horário de início ${informado ?? `"${horarioInformado}"`} inválido para o turno ${String(nomeTurno).toUpperCase()}. O correto é ${esperado}.` };
    }
  }

  return { horario: horarioParaDate(esperado), hhmm: esperado };
}

module.exports = { HORARIO_INICIO_POR_TURNO, horarioPadraoDoTurno, resolverHorarioJornada };
