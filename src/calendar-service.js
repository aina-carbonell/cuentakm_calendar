/**
 * Servicio de Google Calendar
 * BUGS CORREGIDOS:
 *   - require paths corregidos para nueva estructura src/
 *   - registrarViajesDelDia llamaba a obtenerConfiguracionTrabajadores sin importarla
 *   - Se importa correctamente desde config.js
 */

const { google } = require('googleapis');
const { calcularDistancia } = require('./maps-service');
const { guardarViaje } = require('./sheets-service');
const { obtenerConfiguracionTrabajadores } = require('./config');
const logger = require('./utils/logger');

/**
 * Autenticación con Google Calendar
 */
async function autenticarCalendar() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly']
  });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Obtiene eventos de un día específico con ubicación
 */
async function obtenerEventosDelDia(calendarId, fecha, emailTrabajador) {
  try {
    const calendar = await autenticarCalendar();

    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: inicioDia.toISOString(),
      timeMax: finDia.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const eventos = response.data.items || [];
    logger.info(`Encontrados ${eventos.length} eventos para ${emailTrabajador} el ${fecha.toLocaleDateString('es-ES')}`);

    return eventos;

  } catch (error) {
    logger.error(`Error obteniendo eventos de ${emailTrabajador}`, error);
    throw error;
  }
}

/**
 * Procesa los viajes de un trabajador para un día concreto
 */
async function procesarViajesTrabajador(trabajador, fecha) {
  try {
    const eventos = await obtenerEventosDelDia(
      trabajador.calendarId || 'primary',
      fecha,
      trabajador.email
    );

    // Filtrar eventos con ubicación y con hora de inicio (no eventos de día completo)
    const eventosConUbicacion = eventos.filter(e => e.location && e.start && e.start.dateTime);

    if (eventosConUbicacion.length === 0) {
      logger.info(`No hay eventos con ubicación para ${trabajador.email} el ${fecha.toLocaleDateString('es-ES')}`);
      return { viajes: [], totalKm: 0, totalPrecio: 0, trabajador: trabajador.email };
    }

    // Ordenar por hora de inicio
    eventosConUbicacion.sort((a, b) =>
      new Date(a.start.dateTime) - new Date(b.start.dateTime)
    );

    let ubicacionActual = trabajador.oficina;
    const viajes = [];
    let totalKm = 0;
    let totalPrecio = 0;

    // Procesar cada evento
    for (const evento of eventosConUbicacion) {
      const destino = evento.location.trim();

      // Evitar calcular si es el mismo punto
      if (destino.toLowerCase() === ubicacionActual.toLowerCase()) {
        logger.debug(`Saltando viaje: mismo origen y destino (${destino})`);
        continue;
      }

      const distancia = await calcularDistancia(ubicacionActual, destino);

      if (distancia !== null) {
        const precioTrayecto = parseFloat((distancia * trabajador.precioKm).toFixed(2));
        totalKm = parseFloat((totalKm + distancia).toFixed(2));
        totalPrecio = parseFloat((totalPrecio + precioTrayecto).toFixed(2));

        const viaje = {
          fecha,
          trabajador: trabajador.email,
          inicio: ubicacionActual,
          destino,
          kmTrayecto: distancia,
          precioKm: trabajador.precioKm,
          precioTrayecto,
          totalKmAcumulado: totalKm,
          totalPrecioAcumulado: totalPrecio,
          eventoId: evento.id,
          eventoTitle: evento.summary || 'Sin título'
        };

        viajes.push(viaje);
        ubicacionActual = destino;

        logger.info(`Viaje: ${viaje.inicio} → ${destino} (${distancia} km, ${precioTrayecto} €)`);
      }
    }

    // Viaje de vuelta a la oficina
    if (ubicacionActual.toLowerCase() !== trabajador.oficina.toLowerCase()) {
      const distanciaVuelta = await calcularDistancia(ubicacionActual, trabajador.oficina);

      if (distanciaVuelta !== null && distanciaVuelta > 0) {
        const precioVuelta = parseFloat((distanciaVuelta * trabajador.precioKm).toFixed(2));
        totalKm = parseFloat((totalKm + distanciaVuelta).toFixed(2));
        totalPrecio = parseFloat((totalPrecio + precioVuelta).toFixed(2));

        const viajeVuelta = {
          fecha,
          trabajador: trabajador.email,
          inicio: ubicacionActual,
          destino: trabajador.oficina,
          kmTrayecto: distanciaVuelta,
          precioKm: trabajador.precioKm,
          precioTrayecto: precioVuelta,
          totalKmAcumulado: totalKm,
          totalPrecioAcumulado: totalPrecio,
          eventoId: 'return-trip',
          eventoTitle: 'Regreso a oficina'
        };

        viajes.push(viajeVuelta);
        logger.info(`Vuelta: ${ubicacionActual} → ${trabajador.oficina} (${distanciaVuelta} km)`);
      }
    }

    // Guardar todos los viajes en Sheets
    for (const viaje of viajes) {
      await guardarViaje(viaje);
    }

    logger.info(`Resumen ${trabajador.email}: ${viajes.length} viajes, ${totalKm} km, ${totalPrecio} €`);

    return { viajes, totalKm, totalPrecio, trabajador: trabajador.email };

  } catch (error) {
    logger.error(`Error procesando viajes de ${trabajador.email}`, error);
    throw error;
  }
}

/**
 * Función principal: registra los viajes del día para todos los trabajadores activos
 */
async function registrarViajesDelDia(fecha = new Date()) {
  try {
    const configTrabajadores = await obtenerConfiguracionTrabajadores();

    if (!configTrabajadores || configTrabajadores.length === 0) {
      logger.warn('No hay trabajadores configurados');
      return { totalViajes: 0, totalKm: 0, totalPrecio: 0, trabajadores: [] };
    }

    const resultadosGlobales = {
      totalViajes: 0,
      totalKm: 0,
      totalPrecio: 0,
      trabajadores: [],
      fecha: fecha.toLocaleDateString('es-ES')
    };

    for (const trabajador of configTrabajadores) {
      if (!trabajador.activo) {
        logger.debug(`Trabajador inactivo, saltando: ${trabajador.email}`);
        continue;
      }

      logger.info(`Procesando trabajador: ${trabajador.email}`);

      try {
        const resultado = await procesarViajesTrabajador(trabajador, fecha);

        resultadosGlobales.totalViajes += resultado.viajes.length;
        resultadosGlobales.totalKm = parseFloat((resultadosGlobales.totalKm + resultado.totalKm).toFixed(2));
        resultadosGlobales.totalPrecio = parseFloat((resultadosGlobales.totalPrecio + resultado.totalPrecio).toFixed(2));
        resultadosGlobales.trabajadores.push(resultado);

      } catch (errorTrabajador) {
        logger.error(`Error procesando ${trabajador.email}, continuando con el siguiente`, errorTrabajador);
        // No lanzar: continuar con otros trabajadores
      }
    }

    logger.info('Resumen diario completo', {
      fecha: resultadosGlobales.fecha,
      totalViajes: resultadosGlobales.totalViajes,
      totalKm: resultadosGlobales.totalKm,
      totalPrecio: resultadosGlobales.totalPrecio
    });

    return resultadosGlobales;

  } catch (error) {
    logger.error('Error en registro diario', error);
    throw error;
  }
}

module.exports = {
  registrarViajesDelDia,
  procesarViajesTrabajador,
  obtenerEventosDelDia
};