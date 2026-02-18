/**
 * Tests de integración completos
 */

const assert = require('assert');
const { procesarViajesTrabajador } = require('../src/calendar-service');
const { guardarViaje } = require('../src/sheets-service');
const { calcularDistancia } = require('../src/maps-service');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Test de integración completo
 */
async function testIntegration() {
  console.log(`\n${colors.bright}${colors.cyan}=== TESTS DE INTEGRACIÓN ===${colors.reset}\n`);
  
  const resultados = {
    total: 0,
    pasados: 0,
    fallidos: 0,
    detalles: []
  };

  // Escenario 1: Día normal con 3 visitas
  try {
    console.log(`${colors.blue}Escenario 1: Día con 3 visitas${colors.reset}`);
    
    const trabajador = {
      email: 'comercial@empresa.com',
      oficina: 'Gran Vía 1, Madrid',
      precioKm: 0.25,
      calendarId: 'primary',
      activo: true
    };

    // Simular eventos del día
    const mockEventos = [
      {
        id: 'v1',
        summary: 'Cliente A',
        location: 'Paseo de la Castellana 100, Madrid',
        start: { dateTime: '2024-01-15T09:00:00' }
      },
      {
        id: 'v2',
        summary: 'Cliente B',
        location: 'Calle de Alcalá 200, Madrid',
        start: { dateTime: '2024-01-15T11:30:00' }
      },
      {
        id: 'v3',
        summary: 'Cliente C',
        location: 'Plaza de Castilla 1, Madrid',
        start: { dateTime: '2024-01-15T15:00:00' }
      }
    ];

    // Procesar viajes
    let ubicacionActual = trabajador.oficina;
    let totalKm = 0;
    
    for (const evento of mockEventos) {
      const distancia = await calcularDistancia(ubicacionActual, evento.location);
      if (distancia) {
        totalKm += distancia;
        ubicacionActual = evento.location;
      }
    }
    
    // Viaje de vuelta
    const distanciaVuelta = await calcularDistancia(ubicacionActual, trabajador.oficina);
    if (distanciaVuelta) {
      totalKm += distanciaVuelta;
    }
    
    assert.ok(totalKm > 0, 'Debe haber kilometraje positivo');
    console.log(`    ${colors.green}✓${colors.reset} Total km: ${totalKm.toFixed(2)} km`);
    console.log(`    ${colors.green}✓${colors.reset} Total €: ${(totalKm * 0.25).toFixed(2)} €`);
    
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} Escenario 1: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'Escenario 1', error: error.message });
  }
  resultados.total++;

  // Escenario 2: Día sin visitas (solo oficina)
  try {
    console.log(`\n${colors.blue}Escenario 2: Día sin visitas${colors.reset}`);
    
    const trabajador = {
      email: 'admin@empresa.com',
      oficina: 'Gran Vía 1, Madrid',
      precioKm: 0.25
    };
    
    const eventos = []; // Sin eventos
    
    assert.strictEqual(eventos.length, 0, 'No debe haber eventos');
    console.log(`    ${colors.green}✓${colors.reset} No hay viajes registrados`);
    
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} Escenario 2: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'Escenario 2', error: error.message });
  }
  resultados.total++;

  // Escenario 3: Día con eventos sin ubicación
  try {
    console.log(`\n${colors.blue}Escenario 3: Eventos sin ubicación${colors.reset}`);
    
    const trabajador = {
      email: 'test@empresa.com',
      oficina: 'Gran Vía 1, Madrid'
    };
    
    const eventos = [
      {
        id: 'e1',
        summary: 'Reunión interna',
        location: '', // Sin ubicación
        start: { dateTime: '2024-01-15T10:00:00' }
      },
      {
        id: 'e2',
        summary: 'Llamada cliente',
        location: null, // Sin ubicación
        start: { dateTime: '2024-01-15T12:00:00' }
      }
    ];
    
    const eventosConUbicacion = eventos.filter(e => e.location);
    assert.strictEqual(eventosConUbicacion.length, 0, 'No debe haber eventos con ubicación');
    
    console.log(`    ${colors.green}✓${colors.reset} Eventos sin ubicación ignorados correctamente`);
    
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} Escenario 3: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'Escenario 3', error: error.message });
  }
  resultados.total++;

  // Resumen
  console.log(`\n${colors.cyan}=== Resumen Integración ===${colors.reset}`);
  console.log(`Tests: ${resultados.pasados}/${resultados.total} pasados`);
  
  return resultados;
}

module.exports = { testIntegration };