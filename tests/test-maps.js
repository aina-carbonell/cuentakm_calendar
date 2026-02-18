/**
 * Tests para el servicio de Google Maps
 */

const assert = require('assert');
const { calcularDistancia, geocodificar, validarDireccion } = require('../src/maps-service');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

/**
 * Test del servicio de Maps
 */
async function testMapsService() {
  console.log('  Ejecutando tests de Google Maps...');
  
  const resultados = {
    total: 0,
    pasados: 0,
    fallidos: 0,
    detalles: []
  };

  // Verificar API Key
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.log(`    ${colors.yellow}⚠ GOOGLE_MAPS_API_KEY no configurada, saltando tests de Maps${colors.reset}`);
    return resultados;
  }

  // Test 1: calcularDistancia - ruta conocida
  try {
    const distancia = await calcularDistancia(
      'Plaza Mayor, Madrid, España',
      'Puerta del Sol, Madrid, España'
    );
    
    assert.ok(distancia > 0, 'La distancia debe ser positiva');
    assert.ok(distancia < 5, 'La distancia debe ser razonable (< 5km)');
    
    console.log(`    ${colors.green}✓${colors.reset} calcularDistancia (ruta corta): ${distancia} km`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularDistancia (ruta corta): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularDistancia corta', error: error.message });
  }
  resultados.total++;

  // Test 2: calcularDistancia - ruta más larga
  try {
    const distancia = await calcularDistancia(
      'Madrid, España',
      'Barcelona, España'
    );
    
    assert.ok(distancia > 500, 'Madrid-Barcelona > 500km');
    assert.ok(distancia < 700, 'Madrid-Barcelona < 700km');
    
    console.log(`    ${colors.green}✓${colors.reset} calcularDistancia (ruta larga): ${distancia} km`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularDistancia (ruta larga): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularDistancia larga', error: error.message });
  }
  resultados.total++;

  // Test 3: calcularDistancia - misma dirección
  try {
    const distancia = await calcularDistancia(
      'Plaza Mayor, Madrid',
      'Plaza Mayor, Madrid'
    );
    
    assert.strictEqual(distancia, 0, 'Misma dirección debe dar 0 km');
    
    console.log(`    ${colors.green}✓${colors.reset} calcularDistancia (misma dirección): OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularDistancia (misma dirección): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularDistancia misma', error: error.message });
  }
  resultados.total++;

  // Test 4: geocodificar dirección válida
  try {
    const resultado = await geocodificar('Plaza Mayor, Madrid, España');
    
    assert.ok(resultado, 'Debe retornar resultado');
    assert.ok(resultado.lat, 'Debe tener latitud');
    assert.ok(resultado.lng, 'Debe tener longitud');
    assert.ok(resultado.direccionFormateada, 'Debe tener dirección formateada');
    
    console.log(`    ${colors.green}✓${colors.reset} geocodificar: OK (${resultado.direccionFormateada})`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} geocodificar: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'geocodificar', error: error.message });
  }
  resultados.total++;

  // Test 5: geocodificar dirección inválida
  try {
    const resultado = await geocodificar('Dirección que no existe 123456, Planeta Marte');
    
    assert.strictEqual(resultado, null, 'Dirección inválida debe retornar null');
    
    console.log(`    ${colors.green}✓${colors.reset} geocodificar (inválida): OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} geocodificar (inválida): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'geocodificar inválida', error: error.message });
  }
  resultados.total++;

  // Test 6: validarDirección
  try {
    const valida = await validarDireccion('Plaza Mayor, Madrid');
    const invalida = await validarDireccion('Dirección inexistente 99999');
    
    assert.strictEqual(valida, true, 'Dirección válida debe retornar true');
    assert.strictEqual(invalida, false, 'Dirección inválida debe retornar false');
    
    console.log(`    ${colors.green}✓${colors.reset} validarDirección: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validarDirección: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validarDirección', error: error.message });
  }
  resultados.total++;

  return resultados;
}

module.exports = { testMapsService };