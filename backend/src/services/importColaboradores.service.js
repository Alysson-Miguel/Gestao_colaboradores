/**
 * Importação em massa de colaboradores (CSV/XLSX já convertidos em linhas).
 *
 * - `simular: true` roda todas as validações e classifica cada linha
 *   (criar/atualizar/ignorar) sem gravar nada.
 * - Cada linha é gravada em uma transação própria; a geração de DSR (longa)
 *   roda fora da transação, como no cadastro individual.
 * - Dados de apoio (existentes, conflitos de CPF/matrícula, turnos, escalas)
 *   são pré-carregados em lote, não por linha.
 */
const XLSX = require("xlsx");
const { prisma } = require("../config/database");
const { preservarFolgaDominicalWhere } = require("../utils/dsr");
const { resolverHorarioJornada } = require("../utils/horarioTurno");
const {
  validarCpf,
  validarEmail,
  validarTelefone,
  validarDataAdmissao,
  validarVinculos,
} = require("../utils/validacaoCadastro");
const { getEstacoesDoGrupo } = require("../config/estacaoGrupos");
const {
  gerarDSRBackfillColaborador,
  gerarDSRFuturoColaborador,
  gerarOnboardingColaborador,
  gerarNcPreAdmissao,
} = require("./dsrBackfill.service");

const LABELS_ALTERACAO = {
  nomeCompleto: "Nome", matricula: "Matrícula",
  idCargo: "Cargo", idTurno: "Turno", idSetor: "Setor",
  idEmpresa: "Empresa", idLider: "Líder", idEscala: "Escala",
};

function parseDate(v) {
  if (!v) return null;
  const s = String(v).trim();

  // Número serial do Excel (ex: 46479)
  if (/^\d{4,5}$/.test(s)) {
    const date = XLSX.SSF.parse_date_code(Number(s));
    if (date) return new Date(date.y, date.m - 1, date.d);
  }

  // Formato DD/MM/YYYY
  const brMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const d = new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Formato YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback genérico
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const txt = (v) => String(v ?? "").trim();
const num = (v) => (v ? Number(v) : null);

function motivoPrisma(err, row) {
  if (err?.code === "P2002") {
    const campo = Array.isArray(err?.meta?.target) ? err.meta.target[0] : err?.meta?.target;
    const mensagens = {
      matricula: `Matrícula "${row["matricula"]}" já está em uso por outro colaborador`,
      cpf: `CPF "${row["cpf"]}" já está cadastrado para outro colaborador`,
      email: `E-mail "${row["email"]}" já está em uso por outro colaborador`,
    };
    return mensagens[campo] ?? `Dado duplicado (${campo ?? "campo único"})`;
  }
  return err.message;
}

/**
 * @param {object} p
 * @param {object[]} p.rows
 * @param {number|null} p.estacaoContexto estação selecionada/fixada (null = ADMIN global)
 * @param {boolean} p.simular
 * @param {() => Date} p.startOfDayBR
 * @param {(feitas:number,total:number)=>void} [p.onProgresso]
 */
async function processarImportacao({ rows, estacaoContexto, simular = false, startOfDayBR, onProgresso }) {
  let criados = 0;
  let atualizados = 0;
  let skipped = 0;
  let erroCount = 0;
  const skippedDetails = [];
  const updatedDetails = [];
  const errorDetails = [];

  const ignorar = (i, opsId, motivo) => {
    skipped++;
    skippedDetails.push({ linha: i + 1, ops_id: opsId, motivo });
  };

  /* ---------- pré-carga em lote ---------- */
  const opsIds = [...new Set(rows.map((r) => txt(r["ops_id"])).filter(Boolean))];
  const cpfsArquivo = [...new Set(rows.map((r) => validarCpf(r["cpf"]).cpf).filter(Boolean))];
  const matriculasArquivo = [...new Set(rows.map((r) => txt(r["matricula"])).filter(Boolean))];

  const [turnos, escalas, tipoDSR, existentes, possiveisConflitos] = await Promise.all([
    prisma.turno.findMany({ select: { idTurno: true, nomeTurno: true } }),
    prisma.escala.findMany({ select: { idEscala: true, nomeEscala: true, idEstacao: true } }),
    prisma.tipoAusencia.findFirst({ where: { codigo: "DSR" }, select: { idTipoAusencia: true } }),
    prisma.colaborador.findMany({
      where: { opsId: { in: opsIds } },
      select: {
        opsId: true, nomeCompleto: true, matricula: true, status: true, idEstacao: true,
        idEscala: true, idCargo: true, idTurno: true, idSetor: true, idEmpresa: true, idLider: true,
      },
    }),
    prisma.colaborador.findMany({
      where: { OR: [{ cpf: { in: cpfsArquivo } }, { matricula: { in: matriculasArquivo } }] },
      select: { opsId: true, cpf: true, matricula: true },
    }),
  ]);

  const nomeTurnoPorId = new Map(turnos.map((t) => [t.idTurno, t.nomeTurno]));
  const escalaPorId = new Map(escalas.map((e) => [e.idEscala, e]));
  const existentePorOps = new Map(existentes.map((e) => [e.opsId, e]));
  const donoCpf = new Map(possiveisConflitos.filter((c) => c.cpf).map((c) => [c.cpf.replace(/\D/g, ""), c.opsId]));
  const donoMatricula = new Map(possiveisConflitos.map((c) => [c.matricula, c.opsId]));

  // Primeira linha de cada OPS ID / CPF / matrícula — repetições são ignoradas
  const primeiraOps = new Map();
  const primeiraCpf = new Map();
  const primeiraMatricula = new Map();

  const cacheVinculos = new Map();

  /* ---------- linhas ---------- */
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgresso?.(i, rows.length);

    try {
      const opsId = txt(row["ops_id"]);
      if (!opsId) { ignorar(i, "N/A", "ops_id ausente"); continue; }

      const nomeCompleto = txt(row["nome_completo"]);
      const matricula = txt(row["matricula"]);
      const cpf = txt(row["cpf"]);
      const idLider = txt(row["id_lider"]);
      const idSetor = num(row["id_setor"]);
      const idCargo = num(row["id_cargo"]);
      const idEmpresa = num(row["id_empresa"]);
      const idTurno = num(row["id_turno"]);
      const idEscala = num(row["id_escala"]);
      const idEstacaoCsv = num(row["id_estacao"]);

      // Estação: o contexto manda; o CSV só vale sem contexto e nunca diverge dele
      if (estacaoContexto && idEstacaoCsv && idEstacaoCsv !== estacaoContexto) {
        ignorar(i, opsId, "A estação informada não condiz com a estação atual."); continue;
      }
      const idEstacao = estacaoContexto ?? idEstacaoCsv;
      if (!idEstacao) {
        ignorar(i, opsId, "Estação não definida: selecione a estação ou preencha id_estacao."); continue;
      }

      // Obrigatórios
      const faltando = [
        !nomeCompleto && "nome_completo", !matricula && "matricula", !cpf && "cpf",
        !idLider && "id_lider", !idSetor && "id_setor", !idCargo && "id_cargo",
        !idEmpresa && "id_empresa", !idTurno && "id_turno", !idEscala && "id_escala",
      ].filter(Boolean);
      if (faltando.length) { ignorar(i, opsId, `Campos obrigatórios ausentes: ${faltando.join(", ")}`); continue; }

      // CPF / e-mail / telefone / admissão
      const cpfValidado = validarCpf(cpf);
      if (cpfValidado.erro) { ignorar(i, opsId, `CPF ${cpfValidado.erro}`); continue; }

      const emailValidado = validarEmail(row["email"]);
      if (emailValidado.erro) { ignorar(i, opsId, `E-mail "${txt(row["email"])}" ${emailValidado.erro}`); continue; }

      const telefoneValidado = validarTelefone(row["telefone"]);
      if (telefoneValidado.erro) { ignorar(i, opsId, `Telefone "${txt(row["telefone"])}" ${telefoneValidado.erro}`); continue; }

      const dataAdmissao = parseDate(row["data_admissao"]);
      if (!dataAdmissao) { ignorar(i, opsId, "data_admissao inválida ou ausente"); continue; }
      const admissaoValidada = validarDataAdmissao(dataAdmissao);
      if (admissaoValidada.erro) { ignorar(i, opsId, `data_admissao ${admissaoValidada.erro}`); continue; }

      // Repetidos dentro do próprio arquivo
      const repetido = [
        [primeiraOps, opsId, "ops_id"],
        [primeiraCpf, cpfValidado.cpf, "CPF"],
        [primeiraMatricula, matricula, "matrícula"],
      ].find(([mapa, chave]) => mapa.has(chave));
      if (repetido) {
        ignorar(i, opsId, `${repetido[2]} repetido no arquivo (já informado na linha ${repetido[0].get(repetido[1])})`); continue;
      }
      primeiraOps.set(opsId, i + 1);
      primeiraCpf.set(cpfValidado.cpf, i + 1);
      primeiraMatricula.set(matricula, i + 1);

      // Horário definido pelo turno
      const { horario: horarioInicioJornada, erro: erroHorario } = resolverHorarioJornada(
        nomeTurnoPorId.get(idTurno), row["hora_inicio_jornada"]
      );
      if (erroHorario) { ignorar(i, opsId, erroHorario); continue; }

      // Colaborador existente: não reativa nem muda de estação
      const existing = existentePorOps.get(opsId) ?? null;
      if (existing?.status === "INATIVO") {
        ignorar(i, opsId, "Colaborador INATIVO: a importação não reativa. Use a reativação no cadastro."); continue;
      }
      if (existing?.idEstacao && !getEstacoesDoGrupo(idEstacao).includes(existing.idEstacao)) {
        ignorar(i, opsId, "Colaborador já cadastrado em outra estação."); continue;
      }

      // CPF / matrícula já usados por outro colaborador
      const outroCpf = donoCpf.get(cpfValidado.cpf);
      if (outroCpf && outroCpf !== opsId) {
        ignorar(i, opsId, `CPF já cadastrado para outro colaborador (${outroCpf})`); continue;
      }
      const outraMatricula = donoMatricula.get(matricula);
      if (outraMatricula && outraMatricula !== opsId) {
        ignorar(i, opsId, `Matrícula já em uso por outro colaborador (${outraMatricula})`); continue;
      }

      // Vínculos (existência, estação, líder ativo)
      const errosVinculos = await validarVinculos(
        prisma, { idEstacao, idLider, idSetor, idCargo, idEmpresa, idTurno, idEscala }, cacheVinculos
      );
      if (errosVinculos.length) { ignorar(i, opsId, errosVinculos.join("; ")); continue; }

      const data = {
        opsId,
        nomeCompleto,
        genero: row["genero"] || null,
        matricula,
        dataAdmissao,
        horarioInicioJornada,
        cpf: cpfValidado.cpf,
        dataNascimento: parseDate(row["data_nascimento"]),
        email: emailValidado.email,
        telefone: telefoneValidado.telefone,
        contatoEmergenciaNome: row["contato_emergencia_nome"] ? txt(row["contato_emergencia_nome"]) : null,
        contatoEmergenciaTelefone: row["contato_emergencia_telefone"] ? txt(row["contato_emergencia_telefone"]) : null,
        idSetor, idCargo, idEmpresa, idEstacao, idTurno, idEscala,
        idLider: idLider || null,
      };

      const escalaMudou = !existing || Number(existing.idEscala) !== Number(idEscala);

      // Simulação: tudo validado, nada gravado
      if (simular) {
        if (existing) {
          atualizados++;
          const campos = Object.entries(LABELS_ALTERACAO)
            .filter(([k]) => String(existing[k] ?? "") !== String(data[k] ?? ""))
            .map(([k, label]) => `${label}: ${existing[k] ?? "-"} → ${data[k] ?? "-"}`);
          if (campos.length) updatedDetails.push({ linha: i + 1, ops_id: opsId, nome: existing.nomeCompleto, campos });
        } else {
          criados++;
        }
        continue;
      }

      /* ---------- gravação: uma transação por linha ---------- */
      const escala = escalaPorId.get(idEscala);
      const hoje = startOfDayBR();

      await prisma.$transaction(async (tx) => {
        await tx.colaborador.upsert({
          where: { opsId },
          update: data,
          create: { ...data, status: "ATIVO" }, // status só na criação
        });

        if (escalaMudou) {
          await tx.colaboradorEscalaHistorico.updateMany({
            where: { opsId, dataFim: null },
            data: { dataFim: new Date(hoje.getTime() - 86400000) },
          });

          const historicoHoje = await tx.colaboradorEscalaHistorico.findFirst({ where: { opsId, dataInicio: hoje } });
          if (historicoHoje) {
            await tx.colaboradorEscalaHistorico.update({ where: { id: historicoHoje.id }, data: { idEscala, dataFim: null } });
          } else {
            await tx.colaboradorEscalaHistorico.create({ data: { opsId, idEscala, dataInicio: hoje } });
          }

          // DSR futuro da escala antiga fica "preso" na frequência sem isto;
          // a folga dominical automática é preservada se a nova escala também participa
          if (tipoDSR) {
            await tx.frequencia.deleteMany({
              where: {
                opsId, dataReferencia: { gte: hoje }, idTipoAusencia: tipoDSR.idTipoAusencia, manual: false,
                ...preservarFolgaDominicalWhere(escala?.nomeEscala),
              },
            });
          }
        }

        // Onboarding: gera se ainda não existir registro no dia da admissão
        const dia1 = new Date(`${dataAdmissao.toISOString().slice(0, 10)}T00:00:00.000Z`);
        const jaTemOnboarding = await tx.frequencia.findFirst({
          where: { opsId, dataReferencia: dia1 }, select: { idFrequencia: true },
        });
        if (!jaTemOnboarding) await gerarOnboardingColaborador({ opsId, dataAdmissao, tx });

        // Dias do mês anteriores à admissão = NC (igual ao cadastro individual)
        if (!existing) await gerarNcPreAdmissao({ opsId, dataAdmissao, tx });
      }, { timeout: 30000 });

      existing ? atualizados++ : criados++;
      if (existing) {
        const campos = Object.entries(LABELS_ALTERACAO)
          .filter(([k]) => String(existing[k] ?? "") !== String(data[k] ?? ""))
          .map(([k, label]) => `${label}: ${existing[k] ?? "-"} → ${data[k] ?? "-"}`);
        if (campos.length) updatedDetails.push({ linha: i + 1, ops_id: opsId, nome: existing.nomeCompleto, campos });
      }

      // DSR fora da transação (backfill longo). Falha aqui não desfaz o cadastro.
      if (escalaMudou && escala?.nomeEscala) {
        try {
          await gerarDSRBackfillColaborador({ opsId, nomeEscala: escala.nomeEscala, dataInicio: existing ? hoje : dataAdmissao, idEstacao: escala.idEstacao ?? null });
          await gerarDSRFuturoColaborador({ opsId, nomeEscala: escala.nomeEscala, idEstacao: escala.idEstacao ?? null });
        } catch (dsrErr) {
          erroCount++;
          errorDetails.push({ linha: i + 1, ops_id: opsId, motivo: `Colaborador ${existing ? "atualizado" : "cadastrado"}, mas falhou ao gerar o DSR: ${dsrErr.message}. Reprocessar o DSR deste colaborador.` });
        }
      }
    } catch (err) {
      erroCount++;
      errorDetails.push({ linha: i + 1, ops_id: txt(row["ops_id"]) || "N/A", motivo: motivoPrisma(err, row) });
    }
  }

  onProgresso?.(rows.length, rows.length);

  return {
    total: rows.length,
    criados,
    atualizados,
    skipped,
    erros: erroCount,
    skippedDetails,
    updatedDetails,
    errorDetails,
    simulacao: !!simular,
    finalizado: true,
    data: new Date(),
  };
}

module.exports = { processarImportacao };
