/**
 * Suite de pruebas completa para el sistema de kilometraje
 */

const { testCalendarService } = require('./test-calendar');
const { testMapsService } = require('./test-maps');
const { testSheetsService } = require('./test-sheets');
const { testUtils } = require('./test-utils');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Ejecuta todas las pruebas
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   SISTEMA DE KILOMETRAJE - TESTS COMPLETOS${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}\n`);

  const resultados = {
    total: 0,
    pasados: 0,
    fallidos: 0,
    detalles: []
  };

  // Tests de utilidades
  console.log(`${colors.bright}${colors.blue}📦 Probando utilidades...${colors.reset}`);
  const utilsResult = await testUtils();
  resultados.total += utilsResult.total;
  resultados.pasados += utilsResult.pasados;
  resultados.fallidos += utilsResult.fallidos;
  resultados.detalles.push({
    nombre: 'Utils',
    ...utilsResult
  });

  // Tests de Maps API
  console.log(`\n${colors.bright}${colors.blue}🗺️  Probando servicio de Google Maps...${colors.reset}`);
  const mapsResult = await testMapsService();
  resultados.total += mapsResult.total;
  resultados.pasados += mapsResult.pasados;
  resultados.fallidos += mapsResult.fallidos;
  resultados.detalles.push({
    nombre: 'Maps Service',
    ...mapsResult
  });

  // Tests de Calendar
  console.log(`\n${colors.bright}${colors.blue}📅 Probando servicio de Google Calendar...${colors.reset}`);
  const calendarResult = await testCalendarService();
  resultados.total += calendarResult.total;
  resultados.pasados += calendarResult.pasados;
  resultados.fallidos += calendarResult.fallidos;
  resultados.detalles.push({
    nombre: 'Calendar Service',
    ...calendarResult
  });

  // Tests de Sheets
  console.log(`\n${colors.bright}${colors.blue}📊 Probando servicio de Google Sheets...${colors.reset}`);
  const sheetsResult = await testSheetsService();
  resultados.total += sheetsResult.total;
  resultados.pasados += sheetsResult.pasados;
  resultados.fallidos += sheetsResult.fallidos;
  resultados.detalles.push({
    nombre: 'Sheets Service',
    ...sheetsResult
  });

  // Resumen final
  console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bright}RESUMEN FINAL:${colors.reset}`);
  console.log(`Total tests: ${resultados.total}`);
  console.log(`${colors.green}✓ Pasados: ${resultados.pasados}${colors.reset}`);
  
  if (resultados.fallidos > 0) {
    console.log(`${colors.red}✗ Fallidos: ${resultados.fallidos}${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Fallidos: 0${colors.reset}`);
  }

  console.log(`\n${colors.bright}Detalle por módulo:${colors.reset}`);
  resultados.detalles.forEach(d => {
    const estado = d.fallidos === 0 ? `${colors.green}✓` : `${colors.red}✗`;
    console.log(`  ${estado} ${d.nombre}: ${d.pasados}/${d.total} tests pasados${colors.reset}`);
  });

  console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);

  // Retornar código de salida para CI/CD
  return resultados.fallidos === 0 ? 0 : 1;
}

// Ejecutar tests
if (require.main === module) {
  runAllTests().then(codigo => {
    process.exit(codigo);
  }).catch(error => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };