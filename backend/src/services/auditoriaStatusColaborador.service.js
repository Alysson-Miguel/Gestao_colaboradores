/**
 * Auditoria de mudança de status do colaborador (ATIVO, INATIVO, FERIAS, AFASTADO...).
 *
 * `comAuditoriaStatus` envolve a operação que altera o status: lê o status antes,
 * executa, lê depois e, se mudou, grava quem/de/para/quando/origem NA MESMA
 * conexão (dentro da transação, quando `client` é um `tx`).
 *
 * Seguro antes da migração: se a tabela ainda não existe (ou o client Prisma não
 * foi regenerado), apenas executa a operação sem auditar — nunca derruba o fluxo.
 */
const { prisma } = require("../config/database");

let tabelaOk = null;
let ultimaChecagem = 0;
const RECHECAR_MS = 60 * 1000;

async function auditoriaDisponivel() {
  if (tabelaOk === true) return true;
  if (tabelaOk === false && Date.now() - ultimaChecagem < RECHECAR_MS) return false;

  ultimaChecagem = Date.now();
  try {
    const [{ existe }] = await prisma.$queryRaw`SELECT to_regclass('public.colaborador_status_auditoria') IS NOT NULL AS existe`;
    tabelaOk = Boolean(existe) && Boolean(prisma.colaboradorStatusAuditoria);
  } catch {
    tabelaOk = false;
  }
  return tabelaOk;
}

/**
 * @param {object} client prisma ou tx
 * @param {{opsId:string, userId?:string|null, origem:string, detalhe?:string|null}} ctx
 * @param {() => Promise<any>} executar operação que altera o colaborador
 */
async function comAuditoriaStatus(client, { opsId, userId = null, origem, detalhe = null }, executar) {
  if (!(await auditoriaDisponivel()) || !client.colaboradorStatusAuditoria) return executar();

  const antes = await client.colaborador.findUnique({ where: { opsId }, select: { status: true } });
  const resultado = await executar();
  const depois = await client.colaborador.findUnique({ where: { opsId }, select: { status: true } });

  if (antes && depois && antes.status !== depois.status) {
    await client.colaboradorStatusAuditoria.create({
      data: { opsId, statusAnterior: antes.status, statusNovo: depois.status, alteradoPor: userId, origem, detalhe },
    });
  }

  return resultado;
}

async function listarAuditoriaStatus(opsId) {
  if (!(await auditoriaDisponivel())) return null;

  const registros = await prisma.colaboradorStatusAuditoria.findMany({ where: { opsId }, orderBy: { criadoEm: "desc" } });
  const ids = [...new Set(registros.map((r) => r.alteradoPor).filter(Boolean))];
  const usuarios = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const nomePorId = new Map(usuarios.map((u) => [u.id, u.name]));

  return registros.map((r) => ({ ...r, alteradoPorNome: r.alteradoPor ? nomePorId.get(r.alteradoPor) ?? null : "Sistema" }));
}

module.exports = { comAuditoriaStatus, listarAuditoriaStatus, auditoriaDisponivel };
