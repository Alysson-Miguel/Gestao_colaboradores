function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getPeriodoFiltro(query = {}) {
  const hoje = startOfDay(new Date());

  // 📅 DATA ÚNICA
  if (query.data) {
    const d = startOfDay(new Date(query.data));
    return { inicio: d, fim: endOfDay(d) };
  }

  // 📅 INTERVALO MANUAL
  if (query.dataInicio && query.dataFim) {
    return {
      inicio: startOfDay(new Date(query.dataInicio)),
      fim: endOfDay(new Date(query.dataFim)),
    };
  }

  // ⚡ PRESET PADRÃO (compatibilidade)
  if (query.periodo) {
    const dias = Number(query.periodo.replace("d", ""));
    if (!isNaN(dias) && dias > 0) {
      const inicio = new Date(hoje);
      inicio.setDate(inicio.getDate() - (dias - 1));
      return {
        inicio: startOfDay(inicio),
        fim: endOfDay(hoje),
      };
    }
  }

  // ✅ DEFAULT REAL — ÚLTIMOS 30 DIAS
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - 29);

  return {
    inicio: startOfDay(inicio),
    fim: endOfDay(hoje),
  };
}

module.exports = { getPeriodoFiltro };
