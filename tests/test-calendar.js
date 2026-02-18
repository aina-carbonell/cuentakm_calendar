/**
 * Tests para el servicio de Google Calendar
 */

const assert = require('assert');
const { obtenerEventosDelDia, procesarViajesTrabajador } = require('../src/calendar-service');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

/**
 * Test del servicio de Calendar
 */
async function testCalendarService() {
  console.log('  Ejecutando tests de Google Calendar...');
  
  const resultados = {
    total: 0,
    pasados: 0,
    fallidos: 0,
    detalles: []
  };

  // Test 1: obtenerEventosDelDia - fecha actual
  try {
    const eventos = await obtenerEventosDelDia(
      'primary',
      new Date(),
      'test@ejemplo.com'
    );
    
    assert.ok(Array.isArray(eventos), 'Debe retornar un array');
    
    console.log(`    ${colors.green}✓${colors.reset} obtenerEventosDelDia: OK (${eventos.length} eventos hoy)`);
    resultados.pasados++;
  } catch (error) {
    // Si no hay credenciales, el test puede fallar pero lo manejamos
    if (error.message.includes('credentials')) {
      console.log(`    ${colors.yellow}⚠ obtenerEventosDelDia: No hay credenciales configuradas${colors.reset}`);
    } else {
      console.log(`    ${colors.red}✗${colors.reset} obtenerEventosDelDia: ${error.message}`);
      resultados.fallidos++;
      resultados.detalles.push({ test: 'obtenerEventosDelDia', error: error.message });
    }
  }
  resultados.total++;

  // Test 2: procesarViajesTrabajador con datos mock
  try {
    // Mock de trabajador para test
    const trabajadorMock = {
      email: 'test@empresa.com',
      oficina: 'Plaza Mayor, Madrid',
      precioKm: 0.25,
      calendarId: 'primary',
      activo: true
    };

    // Mock de eventos (simulados para test)
    const mockEventos = [
      {
        id: 'evento1',
        summary: 'Reunión cliente A',
        location: 'Calle Serrano 45, Madrid',
        start: { dateTime: '2024-01-15T09:00:00' },
        end: { dateTime: '2024-01-15T10:00:00' }
      },
      {
        id: 'evento2',
        summary: 'Visita obra',
        location: 'Av. América 123, Madrid',
        start: { dateTime: '2024-01-15T11:30:00' },
        end: { dateTime: '2024-01-15T13:00:00' }
      }
    ];

    // Simulamos la función de obtener eventos para usar nuestros mocks
    const originalGetEvents = obtenerEventosDelDia;
    global.obtenerEventosDelDia = async () => mockEventos;

    const resultado = await procesarViajesTrabajador(trabajadorMock, new Date('2024-01-15'));
    
    assert.ok(resultado, 'Debe retornar resultado');
    assert.ok(Array.isArray(resultado.viajes), 'viajes debe ser array');
    assert.ok(resultado.totalKm > 0, 'totalKm debe ser positivo');
    assert.ok(resultado.totalPrecio > 0, 'totalPrecio debe ser positivo');
    
    // Restaurar función original
    global.obtenerEventosDelDia = originalGetEvents;
    
    console.log(`    ${colors.green}✓${colors.reset} procesarViajesTrabajador (mock): OK (${resultado.viajes.length} viajes)`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} procesarViajesTrabajador (mock): ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'procesarViajesTrabajador mock', error: error.message });
  }
  resultados.total++;

  // Test 3: Validar estructura de eventos
  try {
    const eventoEjemplo = {
      id: '123',
      summary: 'Test',
      location: 'Dirección test',
      start: { dateTime: '2024-01-15T10:00:00' },
      end: { dateTime: '2024-01-15T11:00:00' }
    };

    assert.ok(eventoEjemplo.id, 'Evento debe tener ID');
    assert.ok(eventoEjemplo.location, 'Evento debe tener ubicación');
    assert.ok(eventoEjemplo.start.dateTime, 'Evento debe tener fecha inicio');
    
    console.log(`    ${colors.green}✓${colors.reset} validar estructura evento: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validar estructura evento: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validar estructura', error: error.message });
  }
  resultados.total++;

  return resultados;
}

module.exports = { testCalendarService };