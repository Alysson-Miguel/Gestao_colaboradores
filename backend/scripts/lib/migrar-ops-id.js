/**
 * Troca de OPS ID (chave primária de colaborador) propagando para as tabelas relacionadas.
 *
 * As FKs para colaborador.ops_id são "ON UPDATE NO ACTION", então um UPDATE direto falha.
 * Em UMA transação: recria só as FKs com linhas afetadas como ON UPDATE CASCADE (temporário),
 * atualiza colaborador (cascata) e as tabelas sem FK, e restaura as FKs como eram.
 * Qualquer erro desfaz tudo.
 */
const TABELAS_SEM_FK = ["users", "producao_colaborador_historico", "colaborador_status_auditoria"];

const aspas = (s) => `"${String(s).replace(/"/g, '""')}"`;
const lista = (arr) => arr.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",");

async function listarFks(prisma) {
  return prisma.$queryRawUnsafe(`
    SELECT con.conname AS nome, con.conrelid::regclass::text AS tabela,
           pg_get_constraintdef(con.oid) AS def,
           (SELECT array_agg(att.attname ORDER BY k.ord)
              FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
              JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum) AS colunas
    FROM pg_constraint con
    WHERE con.contype = 'f' AND con.confrelid = 'public.colaborador'::regclass
      AND (SELECT array_agg(att.attname) FROM unnest(con.confkey) k(attnum)
             JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = k.attnum) = ARRAY['ops_id']::name[]
  `);
}

/** mapa: [{ opsId, novo }]. Valida colisões e levanta o que será afetado. */
async function planejar(prisma, mapa) {
  const antigos = mapa.map((m) => m.opsId);
  const novos = mapa.map((m) => m.novo);

  const ausentes = antigos.filter(Boolean);
  const existentes = await prisma.colaborador.findMany({ where: { opsId: { in: ausentes } }, select: { opsId: true } });
  const faltando = antigos.filter((o) => !existentes.some((e) => e.opsId === o));
  if (faltando.length) throw new Error(`OPS ID atual não encontrado: ${faltando.join(", ")}`);

  const colide = await prisma.colaborador.findMany({ where: { opsId: { in: novos } }, select: { opsId: true } });
  if (colide.length) throw new Error(`OPS ID novo já existe (duplicidade): ${colide.map((c) => c.opsId).join(", ")}. Unificar cadastros antes.`);
  if (new Set(novos).size !== novos.length) throw new Error("OPS ID novo repetido no mapeamento");

  const fks = await listarFks(prisma);
  const afetadas = [];
  for (const fk of fks) {
    if (fk.colunas.length !== 1) continue;
    const [{ n }] = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM ${fk.tabela} WHERE ${aspas(fk.colunas[0])} IN (${lista(antigos)})`);
    if (n > 0) afetadas.push({ ...fk, linhas: n });
  }

  const semFk = [];
  for (const t of TABELAS_SEM_FK) {
    const [{ existe }] = await prisma.$queryRawUnsafe(`SELECT to_regclass('public.${t}') IS NOT NULL AS existe`);
    if (!existe) continue; // tabela ainda não migrada
    const [{ n }] = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM ${aspas(t)} WHERE ops_id IN (${lista(antigos)})`);
    if (n > 0) semFk.push({ tabela: t, linhas: n });
  }

  return { fks, afetadas, semFk };
}

function mostrarPlano(mapa, plano, nomes = {}) {
  console.log(`OPS IDs a corrigir: ${mapa.length}`);
  console.table(mapa.map((m) => ({ atual: m.opsId, novo: m.novo, nome: nomes[m.opsId] ?? "" })));
  console.log("Tabelas com FK a propagar:");
  console.table(plano.afetadas.map((f) => ({ tabela: f.tabela, coluna: f.colunas[0], linhas: f.linhas })));
  console.log("Tabelas sem FK a atualizar:", plano.semFk);
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Deadlock (40P01) ou timeout de trava (55P03): o app em uso pode estar segurando as tabelas
const ehConflitoDeTrava = (e) => /40P01|55P03|deadlock detected|lock timeout/i.test(`${e?.message} ${e?.meta?.code}`);

async function aplicar(prisma, mapa, plano) {
  const antigos = mapa.map((m) => m.opsId);
  const novos = mapa.map((m) => m.novo);

  // Todas as tabelas envolvidas, em ordem fixa — travadas de uma vez no início
  const tabelasTravar = [...new Set(["colaborador", ...plano.afetadas.map((f) => f.tabela), ...plano.semFk.map((t) => aspas(t.tabela))])].sort();

  const MAX_TENTATIVAS = 8;
  for (let tentativa = 1; ; tentativa++) {
    try {
      await executarTransacao(prisma, mapa, plano, tabelasTravar);
      break;
    } catch (e) {
      if (!ehConflitoDeTrava(e) || tentativa >= MAX_TENTATIVAS) throw e;
      console.log(`tabelas em uso (tentativa ${tentativa}/${MAX_TENTATIVAS}); nada foi alterado, tentando de novo...`);
      await esperar(1500 * tentativa);
    }
  }

  await verificar(prisma, mapa, plano, antigos, novos);
}

async function executarTransacao(prisma, mapa, plano, tabelasTravar) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '10s'`);
    await tx.$executeRawUnsafe(`LOCK TABLE ${tabelasTravar.join(", ")} IN ACCESS EXCLUSIVE MODE`);

    // FK temporária com ON UPDATE CASCADE (NOT VALID: não varre a tabela inteira)
    for (const fk of plano.afetadas) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${fk.tabela} DROP CONSTRAINT ${aspas(fk.nome)}`);
      await tx.$executeRawUnsafe(`ALTER TABLE ${fk.tabela} ADD CONSTRAINT ${aspas(fk.nome)} ${fk.def.replace(/\s+NOT VALID$/i, "")} ON UPDATE CASCADE NOT VALID`);
    }

    for (const m of mapa) {
      await tx.$executeRawUnsafe(`UPDATE colaborador SET ops_id = '${m.novo}' WHERE ops_id = '${m.opsId}'`);
      for (const t of plano.semFk) {
        await tx.$executeRawUnsafe(`UPDATE ${aspas(t.tabela)} SET ops_id = '${m.novo}' WHERE ops_id = '${m.opsId}'`);
      }
    }

    // restaura as FKs originais (validando)
    for (const fk of plano.afetadas) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${fk.tabela} DROP CONSTRAINT ${aspas(fk.nome)}`);
      await tx.$executeRawUnsafe(`ALTER TABLE ${fk.tabela} ADD CONSTRAINT ${aspas(fk.nome)} ${fk.def}`);
    }
  }, { timeout: 300000, maxWait: 30000 });
}

async function verificar(prisma, mapa, plano, antigos, novos) {
  const sobrou = await prisma.colaborador.count({ where: { opsId: { in: antigos } } });
  const existem = await prisma.colaborador.count({ where: { opsId: { in: novos } } });
  let referenciasAntigas = 0;
  for (const fk of plano.fks) {
    if (fk.colunas.length !== 1) continue;
    const [{ n }] = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM ${fk.tabela} WHERE ${aspas(fk.colunas[0])} IN (${lista(antigos)})`);
    referenciasAntigas += n;
  }
  const fksDepois = await listarFks(prisma);
  const regras = {};
  fksDepois.forEach((f) => { const r = /ON UPDATE (\w+( \w+)?)/.exec(f.def)?.[1] ?? "NO ACTION"; regras[r] = (regras[r] || 0) + 1; });
  console.log(`corrigidos: ${existem}/${mapa.length} | IDs antigos ainda em colaborador: ${sobrou} | referências antigas restantes: ${referenciasAntigas}`);
  console.log("regras ON UPDATE das FKs após o ajuste (esperado só NO ACTION):", regras);
}

module.exports = { planejar, mostrarPlano, aplicar };
