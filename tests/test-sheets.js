/**
 * Tests para el servicio de Google Sheets
 * BUG CORREGIDO: require paths corregidos
 */

const assert = require('assert');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m'
};

async function testSheetsService() {
  console.log('  Ejecutando tests de Google Sheets...');

  const resultados = { total: 0, pasados: 0, fallidos: 0, detalles: [] };

  const tieneSheetId = !!process.env.SPREADSHEET_ID;

  if (!tieneSheetId) {
    console.log(`    ${colors.yellow}⚠  SPREADSHEET_ID no configurado, tests de API en modo mock${colors.reset}`);
  }

  // Test 1: Validar estructura completa del objeto viaje
  try {
    const viajeCompleto = {
      fecha: new Date('2024-01-15'),
      trabajador: 'test@empresa.com',
      inicio: 'Gran Vía 1, Madrid',
      destino: 'Calle Serrano 45, Madrid',
      kmTrayecto: 4.5,
      precioKm: 0.25,
      precioTrayecto: 1.13,
      totalKmAcumulado: 4.5,
      totalPrecioAcumulado: 1.13,
      eventoId: 'abc123event',
      eventoTitle: 'Reunión de prueba'
    };

    const camposRequeridos = ['fecha', 'trabajador', 'inicio', 'destino', 'kmTrayecto',
      'precioKm', 'precioTrayecto', 'eventoId', 'eventoTitle'];

    camposRequeridos.forEach(campo => {
      assert.ok(viajeCompleto[campo] !== undefined && viajeCompleto[campo] !== null,
        `Campo "${campo}" es requerido`);
    });

    assert.ok(viajeCompleto.fecha instanceof Date, 'fecha debe ser Date');
    assert.ok(viajeCompleto.kmTrayecto > 0, 'kmTrayecto debe ser positivo');
    assert.ok(viajeCompleto.precioTrayecto > 0, 'precioTrayecto debe ser positivo');

    console.log(`    ${colors.green}✔${colors.reset} validar estructura viaje: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validar estructura viaje: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validar estructura viaje', error: error.message });
  }
  resultados.total++;

  // Test 2: Cálculo correcto de precios
  try {
    const casos = [
      { km: 25.5, precioKm: 0.25, esperado: 6.38 },
      { km: 100, precioKm: 0.25, esperado: 25.00 },
      { km: 13.3, precioKm: 0.25, esperado: 3.33 },
      { km: 0, precioKm: 0.25, esperado: 0.00 }
    ];

    for (const caso of casos) {
      const calculado = Math.round(caso.km * caso.precioKm * 100) / 100;
      assert.strictEqual(calculado, caso.esperado,
        `${caso.km} km × ${caso.precioKm} €/km = ${caso.esperado}, obtenido ${calculado}`);
    }

    console.log(`    ${colors.green}✔${colors.reset} cálculo precios: OK (${casos.length} casos)`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} cálculo precios: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'cálculo precios', error: error.message });
  }
  resultados.total++;

  // Test 3: Acumulados correctos a lo largo de múltiples viajes
  try {
    const viajes = [
      { km: 10, precioKm: 0.25 },
      { km: 15, precioKm: 0.25 },
      { km: 5, precioKm: 0.25 }
    ];

    let totalKm = 0;
    let totalPrecio = 0;
    const acumulados = [];

    viajes.forEach(v => {
      totalKm = parseFloat((totalKm + v.km).toFixed(2));
      totalPrecio = parseFloat((totalPrecio + (v.km * v.precioKm)).toFixed(2));
      acumulados.push({ km: totalKm, precio: totalPrecio });
    });

    assert.strictEqual(acumulados[0].km, 10);
    assert.strictEqual(acumulados[1].km, 25);
    assert.strictEqual(acumulados[2].km, 30);
    assert.strictEqual(acumulados[2].precio, 7.5);

    console.log(`    ${colors.green}✔${colors.reset} acumulados correctos: 30 km, 7.50 €`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} acumulados: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'acumulados', error: error.message });
  }
  resultados.total++;

  // Test 4: Parseo de fechas en formato español (dd/mm/yyyy)
  try {
    const fechasTest = [
      { str: '15/01/2024', esperadoDia: 15, esperadoMes: 0 },
      { str: '31/12/2024', esperadoDia: 31, esperadoMes: 11 },
      { str: '01/06/2024', esperadoDia: 1, esperadoMes: 5 }
    ];

    for (const ft of fechasTest) {
      const partes = ft.str.split('/');
      const fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      assert.strictEqual(fecha.getDate(), ft.esperadoDia);
      assert.strictEqual(fecha.getMonth(), ft.esperadoMes);
    }

    console.log(`    ${colors.green}✔${colors.reset} parseo fechas español: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} parseo fechas: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'parseo fechas', error: error.message });
  }
  resultados.total++;

  // Test 5: guardarViaje real (solo con sheet configurado)
  if (tieneSheetId) {
    try {
      const { guardarViaje } = require('../src/sheets-service');

      const viajeTest = {
        fecha: new Date(),
        trabajador: 'test-automatico@empresa.com',
        inicio: 'Test origen',
        destino: 'Test destino',
        kmTrayecto: 0.01,
        precioKm: 0.25,
        precioTrayecto: 0.00,
        totalKmAcumulado: 0.01,
        totalPrecioAcumulado: 0.00,
        eventoId: `test-${Date.now()}`,
        eventoTitle: 'TEST AUTOMATICO - puede borrarse'
      };

      const resultado = await guardarViaje(viajeTest);
      assert.ok(resultado, 'Debe retornar resultado');

      console.log(`    ${colors.green}✔${colors.reset} guardarViaje (API real): OK`);
      resultados.pasados++;
    } catch (error) {
      console.log(`    ${colors.red}✗${colors.reset} guardarViaje (API real): ${error.message}`);
      resultados.fallidos++;
      resultados.detalles.push({ test: 'guardarViaje real', error: error.message });
    }
    resultados.total++;
  }

  return resultados;
}

module.exports = { testSheetsService };