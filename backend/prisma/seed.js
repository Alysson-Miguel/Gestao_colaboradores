/**
 * Seed do Banco de Dados
 * Popula dados iniciais necessários para o funcionamento do sistema
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/hash');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // =====================================================
  // 1. CRIAR USUÁRIO ADMINISTRADOR
  // =====================================================
  console.log('👤 Criando usuário administrador...');
  
  const adminPassword = await hashPassword('admin123');
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@sistema.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Usuário admin criado: ${admin.email}\n`);

  // =====================================================
  // 2. CRIAR TIPOS DE AUSÊNCIA
  // =====================================================
  console.log('📋 Criando tipos de ausência...');

  const tiposAusencia = [
    { codigo: 'P', descricao: 'Presente', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'F', descricao: 'Falta Injustificada', impactaAbsenteismo: true, justificada: false, requerDocumento: false },
    { codigo: 'FJ', descricao: 'Falta Justificada', impactaAbsenteismo: true, justificada: true, requerDocumento: true },
    { codigo: 'AM', descricao: 'Atestado Médico', impactaAbsenteismo: true, justificada: true, requerDocumento: true },
    { codigo: 'AF', descricao: 'Afastamento (1 a 15 dias)', impactaAbsenteismo: true, justificada: true, requerDocumento: true },
    { codigo: 'AL', descricao: 'Afastamento por INSS', impactaAbsenteismo: true, justificada: true, requerDocumento: true },
    { codigo: 'FE', descricao: 'Férias', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'DSR', descricao: 'Descanso Semanal Remunerado', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'FO', descricao: 'Folga', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'BH', descricao: 'Banco de Horas', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'S1', descricao: 'Sinergia Enviada', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'S2', descricao: 'Sinergia Recebida', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'TR', descricao: 'Transferência Fixa', impactaAbsenteismo: false, justificada: true, requerDocumento: false },
    { codigo: 'DF', descricao: 'Desligamento Forçado', impactaAbsenteismo: true, justificada: true, requerDocumento: true },
    { codigo: 'DP', descricao: 'Desligamento Planejado', impactaAbsenteismo: true, justificada: true, requerDocumento: true },
    { codigo: 'DV', descricao: 'Desligamento Voluntário', impactaAbsenteismo: true, justificada: true, requerDocumento: true },
  ];

  for (const tipo of tiposAusencia) {
    await prisma.tipoAusencia.upsert({
      where: { codigo: tipo.codigo },
      update: {},
      create: tipo,
    });
  }

  console.log(`✅ ${tiposAusencia.length} tipos de ausência criados\n`);

  // =====================================================
  // 3. CRIAR DADOS DE EXEMPLO (OPCIONAL)
  // =====================================================
  console.log('🏢 Criando dados de exemplo...');

  // Criar empresa de exemplo
  const empresa = await prisma.empresa.upsert({
    where: { idEmpresa: 1 },
    update: {},
    create: {
      razaoSocial: 'Empresa Exemplo LTDA',
      cnpj: '12.345.678/0001-90',
      ativo: true,
    },
  });

  // Criar setor de exemplo
  const setor = await prisma.setor.upsert({
    where: { idSetor: 1 },
    update: {},
    create: {
      nomeSetor: 'Operações',
      descricao: 'Setor de operações gerais',
      ativo: true,
    },
  });

  // Criar cargo de exemplo
  const cargo = await prisma.cargo.upsert({
    where: { idCargo: 1 },
    update: {},
    create: {
      nomeCargo: 'Analista',
      nivel: 'Pleno',
      descricao: 'Analista de nível pleno',
      ativo: true,
    },
  });

  // Criar turno de exemplo
  const turno = await prisma.turno.upsert({
    where: { idTurno: 1 },
    update: {},
    create: {
      nomeTurno: 'Manhã',
      horarioInicio: new Date('1970-01-01T08:00:00'),
      horarioFim: new Date('1970-01-01T17:00:00'),
      cargaHorariaDiaria: 8.0,
      ativo: true,
    },
  });

  // Criar escala de exemplo
  const escala = await prisma.escala.upsert({
    where: { idEscala: 1 },
    update: {},
    create: {
      nomeEscala: 'Escala 5x2',
      tipoEscala: '5x2',
      diasTrabalhados: 5,
      diasFolga: 2,
      descricao: 'Trabalha 5 dias e folga 2',
      ativo: true,
    },
  });

  console.log('✅ Dados de exemplo criados\n');

  console.log('='.repeat(50));
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
  console.log('='.repeat(50));
  console.log('\n📝 Credenciais do Admin:');
  console.log('   Email: admin@sistema.com');
  console.log('   Senha: admin123\n');
  console.log('⚠️  IMPORTANTE: Altere a senha do admin após o primeiro login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
