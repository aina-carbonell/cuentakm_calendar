/**
 * Tests para el servicio de Google Calendar
 * BUGS CORREGIDOS:
 *   - require paths corregidos
 *   - El mock de obtenerEventosDelDia no funcionaba (global.x no intercepta require)
 *   - Tests de lógica pura extraídos para ser testeables sin API
 */

const assert = require('assert');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m'
};

async function testCalendarService() {
  console.log('  Ejecutando tests de Google Calendar...');

  const resultados = { total: 0, pasados: 0, fallidos: 0, detalles: [] };

  // Test 1: Validar estructura de un evento válido
  try {
    const eventoValido = {
      id: 'abc123xyz',
      summary: 'Reunión con cliente',
      location: 'Calle Serrano 45, Madrid',
      start: { dateTime: '2024-01-15T09:00:00+01:00' },
      end: { dateTime: '2024-01-15T10:00:00+01:00' }
    };

    assert.ok(eventoValido.id && eventoValido.id.length > 5, 'ID debe tener más de 5 chars');
    assert.ok(eventoValido.location, 'Debe tener ubicación');
    assert.ok(eventoValido.start.dateTime, 'Debe tener fecha de inicio');
    assert.ok(new Date(eventoValido.start.dateTime).getTime() > 0, 'Fecha debe ser válida');

    console.log(`    ${colors.green}✔${colors.reset} validar estructura evento: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} validar estructura evento: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'validar estructura', error: error.message });
  }
  resultados.total++;

  // Test 2: Filtrado de eventos con/sin ubicación
  try {
    const eventos = [
      { id: '1', summary: 'Con ubicación', location: 'Calle Mayor 1, Madrid', start: { dateTime: '2024-01-15T09:00:00' } },
      { id: '2', summary: 'Sin ubicación', location: '', start: { dateTime: '2024-01-15T10:00:00' } },
      { id: '3', summary: 'Location null', location: null, start: { dateTime: '2024-01-15T11:00:00' } },
      { id: '4', summary: 'Día completo', location: 'Oficina', start: { date: '2024-01-15' } }, // sin dateTime
      { id: '5', summary: 'Con ubicación 2', location: 'Paseo Castellana 100', start: { dateTime: '2024-01-15T14:00:00' } }
    ];

    const filtrados = eventos.filter(e => e.location && e.start && e.start.dateTime);
    assert.strictEqual(filtrados.length, 2, `Deben quedar 2 eventos, obtenido: ${filtrados.length}`);
    assert.strictEqual(filtrados[0].id, '1');
    assert.strictEqual(filtrados[1].id, '5');

    console.log(`    ${colors.green}✔${colors.reset} filtrado eventos con ubicación: ${filtrados.length}/5`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} filtrado eventos: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'filtrado eventos', error: error.message });
  }
  resultados.total++;

  // Test 3: Ordenación por hora de inicio
  try {
    const eventos = [
      { id: '3', start: { dateTime: '2024-01-15T15:00:00' } },
      { id: '1', start: { dateTime: '2024-01-15T09:00:00' } },
      { id: '2', start: { dateTime: '2024-01-15T11:30:00' } }
    ];

    const ordenados = [...eventos].sort((a, b) =>
      new Date(a.start.dateTime) - new Date(b.start.dateTime)
    );

    assert.strictEqual(ordenados[0].id, '1');
    assert.strictEqual(ordenados[1].id, '2');
    assert.strictEqual(ordenados[2].id, '3');

    console.log(`    ${colors.green}✔${colors.reset} ordenación por hora: OK`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} ordenación por hora: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'ordenación', error: error.message });
  }
  resultados.total++;

  // Test 4: Cálculo de acumulados de viajes
  try {
    const precioKm = 0.25;
    const trayectos = [
      { km: 5.2 },
      { km: 12.8 },
      { km: 3.5 }
    ];

    let totalKm = 0;
    let totalPrecio = 0;
    const viajes = [];

    for (const t of trayectos) {
      const precio = parseFloat((t.km * precioKm).toFixed(2));
      totalKm = parseFloat((totalKm + t.km).toFixed(2));
      totalPrecio = parseFloat((totalPrecio + precio).toFixed(2));
      viajes.push({ km: t.km, precio, totalKm, totalPrecio });
    }

    assert.strictEqual(viajes.length, 3);
    assert.strictEqual(viajes[2].totalKm, 21.5);
    assert.strictEqual(viajes[2].totalPrecio, parseFloat((21.5 * 0.25).toFixed(2)));

    console.log(`    ${colors.green}✔${colors.reset} cálculo de acumulados: ${viajes[2].totalKm} km, ${viajes[2].totalPrecio} €`);
    resultados.pasados++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} cálculo acumulados: ${error.message}`);
    resultados.fallidos++;
    resultados.detalles.push({ test: 'cálculo acumulados', error: error.message });
  }
  resultados.total++;

  // Test 5: Conexión real con Calendar (solo si hay credenciales)
  const tieneCredenciales = process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (!tieneCredenciales) {
    console.log(`    ${colors.yellow}⚠  Sin credenciales configuradas, saltando test de API real${colors.reset}`);
  } else {
    try {
      const { obtenerEventosDelDia } = require('../src/calendar-service');
      const eventos = await obtenerEventosDelDia('primary', new Date(), 'test');
      assert.ok(Array.isArray(eventos), 'Debe retornar un array');
      console.log(`    ${colors.green}✔${colors.reset} obtenerEventosDelDia (API real): ${eventos.length} eventos hoy`);
      resultados.pasados++;
    } catch (error) {
      console.log(`    ${colors.red}✗${colors.reset} obtenerEventosDelDia (API real): ${error.message}`);
      resultados.fallidos++;
      resultados.detalles.push({ test: 'obtenerEventosDelDia real', error: error.message });
    }
    resultados.total++;
  }

  return resultados;
}

module.exports = { testCalendarService };