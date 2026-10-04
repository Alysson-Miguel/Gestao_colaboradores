/**
 * Auditoria de cadastro de colaboradores ATIVOS — gera CSV com pendências.
 * Somente leitura. Uso: node scripts/auditoria-cadastro-colaboradores.js [caminho-saida.csv]
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { validarCpf } = require("../src/utils/validacaoCadastro");
const { getEstacoesDoGrupo } = require("../src/config/estacaoGrupos");

const prisma = new PrismaClient();

(async () => {
  const colabs = await prisma.colaborador.findMany({
    where: { status: "ATIVO" },
    select: {
      opsId: true, nomeCompleto: true, cpf: true, idEstacao: true,
      estacao: { select: { nomeEstacao: true } },
      lider: { select: { opsId: true, nomeCompleto: true, status: true, idEstacao: true } },
      setor: { select: { nomeSetor: true, idEstacao: true } },
      cargo: { select: { nomeCargo: true, idEstacao: true } },
      empresa: { select: { razaoSocial: true, idEstacao: true } },
      turno: { select: { nomeTurno: true, idEstacao: true } },
      escala: { select: { nomeEscala: true, idEstacao: true } },
    },
    orderBy: [{ idEstacao: "asc" }, { opsId: "asc" }],
  });

  const linhas = [];
  for (const c of colabs) {
    const p = [];
    if (!c.idEstacao) p.push("Sem estação");
    if (!c.lider) p.push("Sem líder");
    if (!c.setor) p.push("Sem setor");
    if (!c.cargo) p.push("Sem cargo");
    if (!c.empresa) p.push("Sem empresa");
    if (!c.turno) p.push("Sem turno");
    if (!c.escala) p.push("Sem escala");
    if (c.idEstacao) {
      const grupo = getEstacoesDoGrupo(c.idEstacao);
      const dif = (x) => x && x.idEstacao && !grupo.includes(x.idEstacao);
      if (dif(c.turno)) p.push(`Turno ${c.turno.nomeTurno} é de outra estação (id ${c.turno.idEstacao})`);
      if (dif(c.setor)) p.push(`Setor ${c.setor.nomeSetor} é de outra estação (id ${c.setor.idEstacao})`);
      if (dif(c.escala)) p.push(`Escala ${c.escala.nomeEscala} é de outra estação (id ${c.escala.idEstacao})`);
      if (dif(c.cargo)) p.push(`Cargo ${c.cargo.nomeCargo} é de outra estação (id ${c.cargo.idEstacao})`);
      if (dif(c.empresa)) p.push(`Empresa ${c.empresa.razaoSocial} é de outra estação (id ${c.empresa.idEstacao})`);
      if (c.lider && !grupo.includes(c.lider.idEstacao)) p.push(`Líder ${c.lider.nomeCompleto} é de outra estação (id ${c.lider.idEstacao})`);
    }
    if (c.lider && c.lider.status !== "ATIVO") p.push(`Líder ${c.lider.nomeCompleto} está ${c.lider.status}`);
    const v = validarCpf(c.cpf);
    if (v.erro) p.push(`CPF: ${v.erro}`);
    if (p.length) linhas.push([c.opsId, c.nomeCompleto, c.estacao?.nomeEstacao ?? "", c.cpf ?? "", c.lider?.nomeCompleto ?? "", p.length, p.join(" | ")]);
  }

  const q = (v) => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const head = ["OPS ID", "Nome", "Estação", "CPF", "Líder", "Qtd problemas", "Problemas"];
  const out = process.argv[2] || path.join(__dirname, "..", "..", "colaboradores_cadastro_pendencias.csv");
  fs.writeFileSync(out, "﻿" + [head, ...linhas].map((r) => r.map(q).join(",")).join("\r\n"));

  const resumo = {};
  linhas.forEach((l) => l[6].split(" | ").forEach((x) => { const k = x.replace(/ .* é de outra estação.*/, " de outra estação").replace(/Líder .* está (\w+)/, "Líder $1").replace(/CPF: .*/, "CPF inválido").replace(/^Turno.*/, "Turno de outra estação").replace(/^Setor.*/, "Setor de outra estação").replace(/^Escala.*/, "Escala de outra estação").replace(/^Cargo.*/, "Cargo de outra estação").replace(/^Empresa.*/, "Empresa de outra estação").replace(/^Líder .* de outra estação.*/, "Líder de outra estação"); resumo[k] = (resumo[k] || 0) + 1; }));
  console.log(`ativos: ${colabs.length} | com pendência: ${linhas.length}`);
  console.table(resumo);
  console.log("CSV:", path.resolve(out));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
