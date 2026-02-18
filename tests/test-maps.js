/**
 * Tests para el servicio de Google Maps
 * BUG CORREGIDO: require path corregido
 */

const assert = require('assert');
require('dotenv').config();
const { calcularDistancia, geocodificar, validarDireccion } = require('../src/maps-service');

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m'
};

async function testMapsService() {
  console.log('  Ejecutando tests de Google Maps...');

  const resultados = { total: 0, pasados: 0, fallidos: 0, detalles: [] };

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.log(`    ${colors.yellow}⚠  GOOGLE_MAPS_API_KEY no configurada, saltando tests de API${colors.reset}`);
    console.log(`    ${colors.yellow}⚠  Ejecuta el setup primero: npm run setup${colors.reset}`);
    return resultados;
  }

  // Test 1: calcularDistancia - ruta corta conocida
  try {
    const distancia = await calcularDistancia(
      'Plaza Mayor, Madrid, España',
      'Puerta del Sol, Madrid, España'
    );
    assert.ok(distancia !== null, 'No debe retornar null');
    assert.ok(distancia >= 0, 'La distancia debe ser >= 0');
    assert.ok(distancia < 5, `La distancia debe ser razonable (< 5km), obtenido: ${distancia}`);
    console.log(`    ${colors.green}✔${colors.reset} calcularDistancia (ruta corta): ${distancia} km`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularDistancia (ruta corta): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularDistancia corta', error: error.message });
  }
  resultados.total++;

  // Test 2: calcularDistancia - ruta larga
  try {
    const distancia = await calcularDistancia('Madrid, España', 'Barcelona, España');
    assert.ok(distancia > 500, `Madrid-Barcelona debe ser > 500km, obtenido: ${distancia}`);
    assert.ok(distancia < 700, `Madrid-Barcelona debe ser < 700km, obtenido: ${distancia}`);
    console.log(`    ${colors.green}✔${colors.reset} calcularDistancia (ruta larga): ${distancia} km`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} calcularDistancia (ruta larga): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'calcularDistancia larga', error: error.message });
  }
  resultados.total++;

  // Test 3: calcularDistancia - misma dirección (BUG CORREGIDO: ahora retorna 0)
  try {
    const distancia = await calcularDistancia('Plaza Mayor, Madrid', 'Plaza Mayor, Madrid');
    assert.strictEqual(distancia, 0, `Misma dirección debe dar 0 km, obtenido: ${distancia}`);
    console.log(`    ${colors.green}✔${colors.reset} calcularDistancia (misma dirección): 0 km ✓`);
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
    assert.ok(Math.abs(resultado.lat - 40.415) < 0.1, 'Latitud de Madrid aproximada');
    console.log(`    ${colors.green}✔${colors.reset} geocodificar: ${resultado.direccionFormateada}`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} geocodificar: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'geocodificar', error: error.message });
  }
  resultados.total++;

  // Test 5: geocodificar dirección inválida
  try {
    const resultado = await geocodificar('XYZ123 Dirección Inventada 99999 Planeta Marte');
    assert.strictEqual(resultado, null, 'Dirección inválida debe retornar null');
    console.log(`    ${colors.green}✔${colors.reset} geocodificar (inválida): null ✓`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} geocodificar (inválida): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'geocodificar inválida', error: error.message });
  }
  resultados.total++;

  // Test 6: validarDireccion
  try {
    const valida = await validarDireccion('Plaza Mayor, Madrid');
    assert.strictEqual(valida, true, 'Dirección válida debe retornar true');
    console.log(`    ${colors.green}✔${colors.reset} validarDireccion (válida): true ✓`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validarDireccion: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validarDireccion', error: error.message });
  }
  resultados.total++;

  return resultados;
}

module.exports = { testMapsService };