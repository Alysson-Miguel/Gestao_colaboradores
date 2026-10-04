/**
 * Validações compartilhadas do cadastro de colaborador
 * (cadastro individual e importação em massa).
 */

const { getEstacoesDoGrupo } = require("../config/estacaoGrupos");

/**
 * Valida CPF: 11 dígitos, não repetidos e com dígitos verificadores corretos.
 * Retorna { cpf } (somente dígitos) ou { erro }.
 */
function validarCpf(valor) {
  const cpf = String(valor ?? "").replace(/\D/g, "");

  if (cpf.length !== 11) return { erro: "deve conter exatamente 11 dígitos" };
  if (/^(\d)\1{10}$/.test(cpf)) return { erro: "inválido (dígitos repetidos)" };

  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(cpf[n])) return { erro: "inválido (dígito verificador não confere)" };
  }

  return { cpf };
}

/**
 * Confere se líder, turno, setor, cargo, empresa e escala existem e pertencem
 * à estação do colaborador ou a uma estação irmã do mesmo grupo (vínculo sem estação = compartilhado, aceito).
 * O líder precisa estar ATIVO. Retorna lista de mensagens de erro (vazia = ok).
 *
 * `cache` (Map opcional) evita repetir consultas na importação em massa.
 */
async function validarVinculos(prisma, { idEstacao, idLider, idSetor, idCargo, idEmpresa, idTurno, idEscala }, cache = new Map()) {
  const erros = [];
  const permitidas = getEstacoesDoGrupo(idEstacao); // estações irmãs (ex: Jaboatão/Recife) compartilham cadastros

  async function buscar(chave, consulta) {
    if (!cache.has(chave)) cache.set(chave, await consulta());
    return cache.get(chave);
  }

  const checarEstacao = (registro, rotulo) => {
    if (registro.idEstacao && !permitidas.includes(registro.idEstacao)) {
      erros.push(`${rotulo} não pertence à estação do colaborador`);
    }
  };

  const [setor, cargo, empresa, turno, escala, lider] = await Promise.all([
    buscar(`setor:${idSetor}`, () => prisma.setor.findUnique({ where: { idSetor }, select: { idEstacao: true } })),
    buscar(`cargo:${idCargo}`, () => prisma.cargo.findUnique({ where: { idCargo }, select: { idEstacao: true } })),
    buscar(`empresa:${idEmpresa}`, () => prisma.empresa.findUnique({ where: { idEmpresa }, select: { idEstacao: true } })),
    buscar(`turno:${idTurno}`, () => prisma.turno.findUnique({ where: { idTurno }, select: { idEstacao: true } })),
    buscar(`escala:${idEscala}`, () => prisma.escala.findUnique({ where: { idEscala }, select: { idEstacao: true } })),
    buscar(`lider:${idLider}`, () => prisma.colaborador.findUnique({ where: { opsId: idLider }, select: { idEstacao: true, status: true } })),
  ]);

  if (!setor) erros.push("Setor não encontrado"); else checarEstacao(setor, "Setor");
  if (!cargo) erros.push("Cargo não encontrado"); else checarEstacao(cargo, "Cargo");
  if (!empresa) erros.push("Empresa não encontrada"); else checarEstacao(empresa, "Empresa");
  if (!turno) erros.push("Turno não encontrado"); else checarEstacao(turno, "Turno");
  if (!escala) erros.push("Escala não encontrada"); else checarEstacao(escala, "Escala");

  if (!lider) {
    erros.push(`Líder "${idLider}" não encontrado`);
  } else {
    if (lider.status !== "ATIVO") erros.push(`Líder "${idLider}" não está ATIVO (${lider.status})`);
    if (!permitidas.includes(lider.idEstacao)) erros.push(`Líder "${idLider}" não pertence à estação do colaborador`);
  }

  return erros;
}

module.exports = { validarCpf, validarVinculos };
