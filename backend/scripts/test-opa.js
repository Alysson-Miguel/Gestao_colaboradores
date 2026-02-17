/**
 * Script de teste para debugar o serviço OPA
 * 
 * Uso: node backend/scripts/test-opa.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buscarDadosOPA } = require('../src/services/googleSheetsOPA.service');

async function testarOPA() {
  console.log('\n🧪 ===== TESTE DO SERVIÇO OPA =====\n');
  
  try {
    console.log('📋 Configurações:');
    console.log('  - SPREADSHEET_ID:', process.env.SHEETS_OPA_SPREADSHEET_ID || '1maB_sUQ-J5oVYUNJWuN5om19qjoSfX-aOnYakmlw0aI');
    console.log('  - SHEET:', process.env.SHEETS_OPA_ABA || 'Report SPI');
    console.log('  - CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? '✓ Configurado' : '✗ Não configurado');
    console.log('  - PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✓ Configurado' : '✗ Não configurado');
    console.log('\n');

    // Teste 1: Buscar todos os dados (sem filtros)
    console.log('🔍 Teste 1: Buscar TODOS os dados (sem filtros de período)');
    const resultado1 = await buscarDadosOPA({});
    console.log('\n📊 Resultado Teste 1:');
    console.log('  - Total:', resultado1.data.totalInspecoes);
    console.log('  - Realizadas:', resultado1.data.realizadas);
    console.log('  - Pendentes:', resultado1.data.pendentes);
    console.log('  - Taxa:', resultado1.data.taxaConclusao + '%');
    console.log('  - Semanas disponíveis:', resultado1.data.semanasDisponiveis.join(', '));
    console.log('  - Semana atual:', resultado1.data.semanaAtual);
    console.log('  - Registros:', resultado1.data.registros.length);
    
    if (resultado1.data.registros.length > 0) {
      console.log('\n📝 Primeiros 5 registros:');
      resultado1.data.registros.slice(0, 5).forEach((reg, idx) => {
        console.log(`  ${idx + 1}. ${reg.responsavel} (${reg.turno}) - ${reg.semana} - ${reg.status}`);
      });
    }

    console.log('\n📊 Conclusão por turno:');
    resultado1.data.conclusaoPorTurno.forEach(turno => {
      console.log(`  - ${turno.turno}: ${turno.realizadas}/${turno.total} (${turno.percentual}%)`);
    });

    // Teste 2: Buscar semana atual
    console.log('\n\n🔍 Teste 2: Buscar semana atual');
    const resultado2 = await buscarDadosOPA({ periodo: 'semana_atual' });
    console.log('\n📊 Resultado Teste 2:');
    console.log('  - Total:', resultado2.data.totalInspecoes);
    console.log('  - Realizadas:', resultado2.data.realizadas);
    console.log('  - Pendentes:', resultado2.data.pendentes);
    console.log('  - Taxa:', resultado2.data.taxaConclusao + '%');

    // Teste 3: Buscar por turno
    console.log('\n\n🔍 Teste 3: Buscar turno T1');
    const resultado3 = await buscarDadosOPA({ periodo: 'semana_atual', turno: 'T1' });
    console.log('\n📊 Resultado Teste 3:');
    console.log('  - Total:', resultado3.data.totalInspecoes);
    console.log('  - Realizadas:', resultado3.data.realizadas);
    console.log('  - Pendentes:', resultado3.data.pendentes);
    console.log('  - Taxa:', resultado3.data.taxaConclusao + '%');

    console.log('\n\n✅ Testes concluídos com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro ao executar testes:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testarOPA();
