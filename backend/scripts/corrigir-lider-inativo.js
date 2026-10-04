/**
 * Troca o líder INATIVO de colaboradores ATIVOS por um líder ATIVO do mesmo
 * setor e turno. Uso:
 *   node scripts/corrigir-lider-inativo.js <arquivo-com-nomes.txt>           (dry-run)
 *   node scripts/corrigir-lider-inativo.js <arquivo-com-nomes.txt> --apply   (grava)
 *
 * Líder elegível = colaborador ATIVO, cargo "Líder…", mesma estação (ou irmã),
 * com idSetor e idTurno iguais aos do colaborador. Entre elegíveis, escolhe o
 * que já lidera mais gente nesse setor+turno. Sem elegível => não altera (fica
 * no relatório como "sem líder do mesmo setor e turno").
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { getEstacoesDoGrupo } = require("../src/config/estacaoGrupos");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const arquivo = process.argv[2];

(async () => {
  if (!arquivo) throw new Error("Informe o arquivo com os nomes (um por linha).");
  const nomes = fs.readFileSync(arquivo, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  const alvo = await prisma.colaborador.findMany({
    where: { nomeCompleto: { in: nomes, mode: "insensitive" }, status: "ATIVO" },
    select: {
      opsId: true, nomeCompleto: true, idEstacao: true, idSetor: true, idTurno: true, idLider: true,
      idCargo: true, setor: { select: { nomeSetor: true } }, turno: { select: { nomeTurno: true } },
      lider: { select: { nomeCompleto: true, status: true } },
    },
  });
  const achados = new Set(alvo.map((a) => a.nomeCompleto.toUpperCase()));
  const naoEncontrados = nomes.filter((n) => !achados.has(n.toUpperCase()));

  const lideres = await prisma.colaborador.findMany({
    where: { status: "ATIVO", cargo: { nomeCargo: { contains: "Líder" } } },
    select: { opsId: true, nomeCompleto: true, idEstacao: true, idSetor: true, idTurno: true },
  });

  const cacheTamanho = new Map();
  const tamanhoNoGrupo = async (idLider, idSetor, idTurno) => {
    const k = `${idLider}|${idSetor}|${idTurno}`;
    if (!cacheTamanho.has(k)) {
      cacheTamanho.set(k, await prisma.colaborador.count({ where: { status: "ATIVO", idLider, idSetor, idTurno } }));
    }
    return cacheTamanho.get(k);
  };

  const plano = [];
  for (const c of alvo) {
    if (c.lider && c.lider.status === "ATIVO") {
      plano.push({ c, motivo: "líder atual já está ATIVO — não alterado" });
      continue;
    }
    const grupo = getEstacoesDoGrupo(c.idEstacao);
    const elegiveis = lideres.filter(
      (l) => l.idSetor === c.idSetor && l.idTurno === c.idTurno && grupo.includes(l.idEstacao) && l.opsId !== c.opsId
    );
    if (!elegiveis.length) {
      plano.push({ c, motivo: "sem líder ATIVO do mesmo setor e turno" });
      continue;
    }
    let melhor = null;
    for (const l of elegiveis) {
      const n = await tamanhoNoGrupo(l.opsId, c.idSetor, c.idTurno);
      if (!melhor || n > melhor.n) melhor = { l, n };
    }
    plano.push({ c, novo: melhor.l });
  }

  const aplicaveis = plano.filter((x) => x.novo);
  const resumo = {};
  plano.forEach((x) => {
    const k = `${x.c.setor?.nomeSetor} ${x.c.turno?.nomeTurno} → ${x.novo ? x.novo.nomeCompleto : `(${x.motivo})`}`;
    resumo[k] = (resumo[k] || 0) + 1;
  });
  console.log(`nomes: ${nomes.length} | encontrados ATIVOS: ${alvo.length} | não encontrados: ${naoEncontrados.length ? naoEncontrados.join(", ") : 0}`);
  console.table(resumo);
  console.log(`a alterar: ${aplicaveis.length} | sem líder compatível: ${plano.length - aplicaveis.length}`);

  const q = (v) => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const linhas = [["OPS ID", "Nome", "Setor", "Turno", "Líder anterior (INATIVO)", "Novo líder", "Novo líder OPS ID", "Situação"],
    ...plano.map((x) => [x.c.opsId, x.c.nomeCompleto, x.c.setor?.nomeSetor, x.c.turno?.nomeTurno, x.c.lider?.nomeCompleto, x.novo?.nomeCompleto, x.novo?.opsId, x.novo ? "A alterar" : x.motivo])];
  const saida = path.join(__dirname, "..", "..", "correcao_lider_inativo.csv");
  fs.writeFileSync(saida, "﻿" + linhas.map((r) => r.map(q).join(",")).join("\r\n"));
  console.log("CSV de conferência:", saida);

  if (!APPLY) { console.log("dry-run: nada gravado. Use --apply."); await prisma.$disconnect(); return; }

  await prisma.$transaction(async (tx) => {
    for (const { c, novo } of aplicaveis) {
      await tx.colaborador.update({ where: { opsId: c.opsId }, data: { lider: { connect: { opsId: novo.opsId } } } });
      await tx.historicoMovimentacao.create({
        data: {
          opsId: c.opsId, tipoMovimentacao: "ORGANIZACIONAL",
          setorAnterior: c.idSetor, setorNovo: c.idSetor,
          turnoAnterior: c.idTurno, turnoNovo: c.idTurno,
          cargoAnterior: c.idCargo, cargoNovo: c.idCargo,
          estacaoAnterior: c.idEstacao, estacaoNova: c.idEstacao,
          liderAnterior: c.idLider, liderNovo: novo.opsId,
          dataEfetivacao: new Date(), motivo: "Correção: líder anterior estava INATIVO",
        },
      });
    }
  }, { timeout: 60000 });

  const aindaInativo = await prisma.colaborador.count({ where: { opsId: { in: aplicaveis.map((x) => x.c.opsId) }, lider: { status: { not: "ATIVO" } } } });
  console.log(`atualizados: ${aplicaveis.length} | ainda com líder inativo entre eles: ${aindaInativo}`);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
