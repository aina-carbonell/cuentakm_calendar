/**
 * Tests para utilidades generales
 * BUG CORREGIDO: paths de require corregidos, colores no estaban definidos
 */

const assert = require('assert');
const { formatearFecha, calcularDiasLaborables } = require('../src/utils/date-utils');
const { formatearMoneda, redondear, calcularPrecioTrayecto } = require('../src/utils/number-utils');
const { validarEmail, validarPrecioKm, validarDistancia } = require('../src/utils/validation-utils');
const { formatearDistancia, distanciaHaversine } = require('../src/utils/distance-utils');

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m'
};

async function testUtils() {
  console.log('  Ejecutando tests de utilidades...');

  const resultados = { total: 0, pasados: 0, fallidos: 0, detalles: [] };

  // ── Test 1: formatearFecha ──────────────────────────────────
  try {
    const fecha = new Date('2024-01-15T10:30:00');
    const formateada = formatearFecha(fecha, 'es-ES');
    assert.strictEqual(typeof formateada, 'string');
    assert.ok(formateada.includes('15'), 'Debe contener el día 15');
    assert.ok(formateada.includes('2024'), 'Debe contener el año');
    console.log(`    ${colors.green}✔${colors.reset} formatearFecha: "${formateada}"`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} formatearFecha: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'formatearFecha', error: error.message });
  }
  resultados.total++;

  // ── Test 2: formatearMoneda ─────────────────────────────────
  try {
    assert.strictEqual(formatearMoneda(25.5, '€'), '25.50 €');
    assert.strictEqual(formatearMoneda(0, '€'), '0.00 €');
    assert.strictEqual(formatearMoneda(100.999, '€'), '101.00 €');
    console.log(`    ${colors.green}✔${colors.reset} formatearMoneda: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} formatearMoneda: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'formatearMoneda', error: error.message });
  }
  resultados.total++;

  // ── Test 3: validarEmail ────────────────────────────────────
  try {
    assert.strictEqual(validarEmail('test@empresa.com'), true);
    assert.strictEqual(validarEmail('test@empresa'), false);
    assert.strictEqual(validarEmail('test.empresa.com'), false);
    assert.strictEqual(validarEmail(''), false);
    assert.strictEqual(validarEmail(null), false);
    console.log(`    ${colors.green}✔${colors.reset} validarEmail: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validarEmail: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validarEmail', error: error.message });
  }
  resultados.total++;

  // ── Test 4: calcularDiasLaborables ─────────────────────────
  try {
    const inicio = new Date('2024-01-01');
    const fin = new Date('2024-01-31');
    const dias = calcularDiasLaborables(inicio, fin);
    // Enero 2024: 23 días laborables
    assert.ok(dias >= 22 && dias <= 24, `Esperado ~23, obtenido ${dias}`);
    console.log(`    ${colors.green}✔${colors.reset} calcularDiasLaborables: ${dias} días en enero 2024`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularDiasLaborables: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularDiasLaborables', error: error.message });
  }
  resultados.total++;

  // ── Test 5: redondear ───────────────────────────────────────
  try {
    assert.strictEqual(redondear(25.555, 2), 25.56);
    assert.strictEqual(redondear(25.5 * 0.25, 2), 6.38);
    assert.strictEqual(redondear(0), 0);
    console.log(`    ${colors.green}✔${colors.reset} redondear: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} redondear: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'redondear', error: error.message });
  }
  resultados.total++;

  // ── Test 6: calcularPrecioTrayecto ──────────────────────────
  try {
    assert.strictEqual(calcularPrecioTrayecto(100, 0.25), 25);
    assert.strictEqual(calcularPrecioTrayecto(13.3, 0.25), 3.33);
    assert.strictEqual(calcularPrecioTrayecto(0, 0.25), 0);
    console.log(`    ${colors.green}✔${colors.reset} calcularPrecioTrayecto: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularPrecioTrayecto: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularPrecioTrayecto', error: error.message });
  }
  resultados.total++;

  // ── Test 7: validarPrecioKm ─────────────────────────────────
  try {
    assert.strictEqual(validarPrecioKm(0.25), true);
    assert.strictEqual(validarPrecioKm(0), false);
    assert.strictEqual(validarPrecioKm(-1), false);
    assert.strictEqual(validarPrecioKm(15), false); // > 10 inválido
    console.log(`    ${colors.green}✔${colors.reset} validarPrecioKm: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validarPrecioKm: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validarPrecioKm', error: error.message });
  }
  resultados.total++;

  // ── Test 8: distanciaHaversine ──────────────────────────────
  try {
    // Madrid → Barcelona aproximadamente 505 km en línea recta
    const dist = distanciaHaversine(40.4168, -3.7038, 41.3851, 2.1734);
    assert.ok(dist > 490 && dist < 530, `Esperado ~505 km, obtenido ${dist}`);
    // Mismo punto = 0
    assert.strictEqual(distanciaHaversine(40.4168, -3.7038, 40.4168, -3.7038), 0);
    console.log(`    ${colors.green}✔${colors.reset} distanciaHaversine: Madrid→Barcelona ${dist} km`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} distanciaHaversine: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'distanciaHaversine', error: error.message });
  }
  resultados.total++;

  // ── Test 9: formatearDistancia ──────────────────────────────
  try {
    assert.strictEqual(formatearDistancia(0.5), '500 m');
    assert.ok(formatearDistancia(25.5).includes('km'));
    console.log(`    ${colors.green}✔${colors.reset} formatearDistancia: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} formatearDistancia: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'formatearDistancia', error: error.message });
  }
  resultados.total++;

  return resultados;
}

module.exports = { testUtils };