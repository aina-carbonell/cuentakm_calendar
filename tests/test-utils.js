/**
 * Tests para utilidades generales
 */

const assert = require('assert');
const { formatearFecha, formatearMoneda, validarEmail, calcularDiasLaborables } = require('../src/utils/date-utils');

/**
 * Test de utilidades
 */
async function testUtils() {
  console.log('  Ejecutando tests de utilidades...');
  
  const resultados = {
    total: 0,
    pasados: 0,
    fallidos: 0,
    detalles: []
  };

  // Test 1: formatearFecha
  try {
    const fecha = new Date('2024-01-15T10:30:00');
    const formateada = formatearFecha(fecha, 'es-ES');
    assert.strictEqual(typeof formateada, 'string');
    assert.ok(formateada.includes('15/1/2024') || formateada.includes('15/01/2024'));
    
    console.log(`    ${colors.green}✓${colors.reset} formatearFecha: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} formatearFecha: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'formatearFecha', error: error.message });
  }
  resultados.total++;

  // Test 2: formatearMoneda
  try {
    const formateado = formatearMoneda(25.5, '€');
    assert.strictEqual(formateado, '25.50 €');
    
    console.log(`    ${colors.green}✓${colors.reset} formatearMoneda: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} formatearMoneda: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'formatearMoneda', error: error.message });
  }
  resultados.total++;

  // Test 3: validarEmail
  try {
    assert.strictEqual(validarEmail('test@empresa.com'), true);
    assert.strictEqual(validarEmail('test@empresa'), false);
    assert.strictEqual(validarEmail('test.empresa.com'), false);
    
    console.log(`    ${colors.green}✓${colors.reset} validarEmail: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validarEmail: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validarEmail', error: error.message });
  }
  resultados.total++;

  // Test 4: calcularDiasLaborables
  try {
    const inicio = new Date('2024-01-01');
    const fin = new Date('2024-01-31');
    const dias = calcularDiasLaborables(inicio, fin);
    
    assert.strictEqual(typeof dias, 'number');
    assert.ok(dias > 20 && dias < 25); // Enero 2024 tiene 23 días laborables
    
    console.log(`    ${colors.green}✓${colors.reset} calcularDiasLaborables: OK (${dias} días)`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularDiasLaborables: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularDiasLaborables', error: error.message });
  }
  resultados.total++;

  return resultados;
}

module.exports = { testUtils };