import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // ----------------- EMPRESAS -----------------
  const empresa1 = await prisma.empresa.upsert({
    where: { razaoSocial: "Empresa A" },
    update: {},
    create: {
      razaoSocial: "Empresa A",
      cnpj: "12.345.678/0001-90",
    },
  });

  const empresa2 = await prisma.empresa.upsert({
    where: { razaoSocial: "Empresa B" },
    update: {},
    create: {
      razaoSocial: "Empresa B",
      cnpj: "98.765.432/0001-10",
    },
  });

  // ----------------- TURNOS -----------------
  const turnoT1 = await prisma.turno.upsert({
    where: { nomeTurno: "T1" },
    update: {},
    create: { nomeTurno: "T1", horarioInicio: new Date("1970-01-01T06:00:00"), horarioFim: new Date("1970-01-01T14:00:00") },
  });
  const turnoT2 = await prisma.turno.upsert({
    where: { nomeTurno: "T2" },
    update: {},
    create: { nomeTurno: "T2", horarioInicio: new Date("1970-01-01T14:00:00"), horarioFim: new Date("1970-01-01T23:00:00") },
  });
  const turnoT3 = await prisma.turno.upsert({
    where: { nomeTurno: "T3" },
    update: {},
    create: { nomeTurno: "T3", horarioInicio: new Date("1970-01-01T23:00:00"), horarioFim: new Date("1970-01-02T06:00:00") },
  });

  // ----------------- ESCALAS -----------------
  const escala1 = await prisma.escala.upsert({
    where: { nomeEscala: "Escala Padrão" },
    update: {},
    create: { nomeEscala: "Escala Padrão", diasTrabalhados: 5, diasFolga: 2 },
  });

  // ----------------- CARGOS -----------------
  const cargo1 = await prisma.cargo.upsert({
    where: { nomeCargo: "Analista" },
    update: {},
    create: { nomeCargo: "Analista", nivel: "Junior" },
  });

  const cargo2 = await prisma.cargo.upsert({
    where: { nomeCargo: "Supervisor" },
    update: {},
    create: { nomeCargo: "Supervisor", nivel: "Senior" },
  });

  // ----------------- ESTAÇÕES -----------------
  const estacao1 = await prisma.estacao.upsert({
    where: { nomeEstacao: "Estação 1" },
    update: {},
    create: { nomeEstacao: "Estação 1", capacidade: 10 },
  });

  const estacao2 = await prisma.estacao.upsert({
    where: { nomeEstacao: "Estação 2" },
    update: {},
    create: { nomeEstacao: "Estação 2", capacidade: 15 },
  });

  // ----------------- COLABORADORES -----------------
  const colaboradores = [
    {
      opsId: "OPS001",
      nomeCompleto: "Lucas Robson",
      genero: "Masculino",
      matricula: "M001",
      dataAdmissao: new Date("2023-01-01"),
      horarioInicioJornada: new Date("1970-01-01T06:00:00"),
      idEmpresa: empresa1.idEmpresa,
      idTurno: turnoT1.idTurno,
      idEscala: escala1.idEscala,
      idCargo: cargo1.idCargo,
      idEstacao: estacao1.idEstacao,
      status: "ATIVO",
    },
    {
      opsId: "OPS002",
      nomeCompleto: "Ana Souza",
      genero: "Feminino",
      matricula: "M002",
      dataAdmissao: new Date("2023-02-15"),
      horarioInicioJornada: new Date("1970-01-01T14:00:00"),
      idEmpresa: empresa1.idEmpresa,
      idTurno: turnoT2.idTurno,
      idEscala: escala1.idEscala,
      idCargo: cargo1.idCargo,
      idEstacao: estacao2.idEstacao,
      status: "ATIVO",
    },
    {
      opsId: "OPS003",
      nomeCompleto: "Carlos Lima",
      genero: "Masculino",
      matricula: "M003",
      dataAdmissao: new Date("2023-03-10"),
      horarioInicioJornada: new Date("1970-01-01T23:00:00"),
      idEmpresa: empresa2.idEmpresa,
      idTurno: turnoT3.idTurno,
      idEscala: escala1.idEscala,
      idCargo: cargo2.idCargo,
      idEstacao: estacao1.idEstacao,
      status: "ATIVO",
    },
  ];

  for (const c of colaboradores) {
    await prisma.colaborador.upsert({
      where: { opsId: c.opsId },
      update: {},
      create: c,
    });
  }

  console.log("Seed finalizado!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
