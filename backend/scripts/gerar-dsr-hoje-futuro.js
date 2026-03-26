const { prisma } = require("../src/config/database");
const {
  gerarDSRBackfillColaborador,
  gerarDSRFuturoColaborador,
} = require("../src/services/dsrBackfill.service");

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function run() {
  console.log("🚀 Gerando DSR (hoje + futuro)...");

  const hoje = startOfDay();

  const colaboradores = await prisma.colaborador.findMany({
    where: {
      status: "ATIVO",
      dataDesligamento: null,
    },
    include: {
      escala: true,
    },
  });

  console.log(`👥 Total colaboradores: ${colaboradores.length}`);

  let total = 0;

  for (const c of colaboradores) {
    try {
      const nomeEscala = c.escala?.nomeEscala;

      if (!nomeEscala) continue;

      /* 🔹 HOJE */
      const res = await gerarDSRBackfillColaborador({
        opsId: c.opsId,
        nomeEscala,
        dataInicio: hoje,
      });

      /* 🔹 FUTURO */
      await gerarDSRFuturoColaborador({
        opsId: c.opsId,
        nomeEscala,
      });

      total += res.criados;

      console.log(
        `✅ ${c.opsId} (${nomeEscala}) → hoje:${res.criados}`
      );

    } catch (err) {
      console.error(`❌ ${c.opsId}:`, err.message);
    }
  }

  console.log("🔥 FINALIZADO");
  console.log("📊 Total DSR criados hoje:", total);

  process.exit();
}

run();