/**
 * Suite de pruebas completa
 * BUG CORREGIDO: require paths corregidos para estructura tests/
 */

require('dotenv').config();

const { testCalendarService } = require('./test-calendar');
const { testMapsService } = require('./test-maps');
const { testSheetsService } = require('./test-sheets');
const { testUtils } = require('./test-utils');

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m'
};

async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   SISTEMA DE KILÓMETROS - TEST SUITE   ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════${colors.reset}\n`);

  const resultados = { total: 0, pasados: 0, fallidos: 0, detalles: [] };

  const suites = [
    { nombre: 'Utilidades', fn: testUtils, emoji: '📦' },
    { nombre: 'Google Maps', fn: testMapsService, emoji: '🗺️ ' },
    { nombre: 'Google Calendar', fn: testCalendarService, emoji: '📅' },
    { nombre: 'Google Sheets', fn: testSheetsService, emoji: '📊' }
  ];

  for (const suite of suites) {
    console.log(`${colors.bright}${colors.blue}${suite.emoji} ${suite.nombre}${colors.reset}`);

    try {
      const result = await suite.fn();
      resultados.total += result.total;
      resultados.pasados += result.pasados;
      resultados.fallidos += result.fallidos;
      resultados.detalles.push({ nombre: suite.nombre, ...result });
    } catch (error) {
      console.log(`    ${colors.red}✗ Error ejecutando suite: ${error.message}${colors.reset}`);
      resultados.detalles.push({ nombre: suite.nombre, total: 0, pasados: 0, fallidos: 1 });
      resultados.fallidos++;
      resultados.total++;
    }

    console.log('');
  }

  // ── Resumen ─────────────────────────────────────────────────
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}RESUMEN FINAL:${colors.reset}`);
  console.log(`  Total tests: ${resultados.total}`);
  console.log(`  ${colors.green}✔ Pasados:  ${resultados.pasados}${colors.reset}`);

  if (resultados.fallidos > 0) {
    console.log(`  ${colors.red}✗ Fallidos: ${resultados.fallidos}${colors.reset}`);
  } else {
    console.log(`  ${colors.green}✔ Fallidos: 0${colors.reset}`);
  }

  console.log(`\n${colors.bright}Por módulo:${colors.reset}`);
  resultados.detalles.forEach(d => {
    const ok = d.fallidos === 0;
    const estado = ok ? `${colors.green}✔` : `${colors.red}✗`;
    const pct = d.total > 0 ? Math.round((d.pasados / d.total) * 100) : 0;
    console.log(`  ${estado} ${d.nombre}: ${d.pasados}/${d.total} (${pct}%)${colors.reset}`);
  });

  const exito = resultados.fallidos === 0;
  const mensajeFinal = exito
    ? `\n${colors.green}${colors.bright}  ✨ Todos los tests pasaron${colors.reset}`
    : `\n${colors.red}${colors.bright}  ⚠  Hay ${resultados.fallidos} test(s) fallido(s)${colors.reset}`;

  console.log(mensajeFinal);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════${colors.reset}\n`);

  return exito ? 0 : 1;
}

if (require.main === module) {
  runAllTests().then(codigo => {
    process.exit(codigo);
  }).catch(error => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };