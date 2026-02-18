/**
 * Servicio de Google Calendar
 */

const { google } = require('googleapis');
const { calcularDistancia } = require('./maps-service');
const { guardarViaje } = require('./sheets-service');
const { obtenerConfiguracionTrabajador } = require('./config');
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
 * Obtiene eventos de un día específico
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
    
    const eventos = response.data.items;
    logger.info(`Encontrados ${eventos.length} eventos para ${emailTrabajador} el ${fecha.toLocaleDateString()}`);
    
    return eventos;
    
  } catch (error) {
    logger.error('Error obteniendo eventos:', error);
    throw error;
  }
}

/**
 * Procesa los viajes de un trabajador para un día
 */
async function procesarViajesTrabajador(trabajador, fecha) {
  try {
    const eventos = await obtenerEventosDelDia(
      trabajador.calendarId || 'primary',
      fecha,
      trabajador.email
    );
    
    // Filtrar eventos con ubicación
    const eventosConUbicacion = eventos.filter(e => e.location);
    
    if (eventosConUbicacion.length === 0) {
      logger.info(`No hay eventos con ubicación para ${trabajador.email}`);
      return { viajes: [], totalKm: 0, totalPrecio: 0 };
    }
    
    // Ordenar por hora
    eventosConUbicacion.sort((a, b) => 
      new Date(a.start.dateTime) - new Date(b.start.dateTime)
    );
    
    let ubicacionActual = trabajador.oficina;
    let viajes = [];
    let totalKm = 0;
    let totalPrecio = 0;
    
    // Procesar cada evento
    for (const evento of eventosConUbicacion) {
      const destino = evento.location;
      const distancia = await calcularDistancia(ubicacionActual, destino);
      
      if (distancia) {
        const precioTrayecto = distancia * trabajador.precioKm;
        totalKm += distancia;
        totalPrecio += precioTrayecto;
        
        const viaje = {
          fecha: fecha,
          trabajador: trabajador.email,
          inicio: ubicacionActual,
          destino: destino,
          kmTrayecto: distancia,
          precioKm: trabajador.precioKm,
          precioTrayecto: precioTrayecto,
          totalKmAcumulado: totalKm,
          totalPrecioAcumulado: totalPrecio,
          eventoId: evento.id,
          eventoTitle: evento.summary
        };
        
        viajes.push(viaje);
        ubicacionActual = destino;
        
        logger.info(`Viaje registrado: ${ubicacionActual} → ${destino} (${distancia.toFixed(2)} km)`);
      }
    }
    
    // Viaje de vuelta a la oficina
    if (ubicacionActual !== trabajador.oficina) {
      const distanciaVuelta = await calcularDistancia(ubicacionActual, trabajador.oficina);
      
      if (distanciaVuelta) {
        const precioVuelta = distanciaVuelta * trabajador.precioKm;
        totalKm += distanciaVuelta;
        totalPrecio += precioVuelta;
        
        const viajeVuelta = {
          fecha: fecha,
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
        logger.info(`Viaje de vuelta: ${ubicacionActual} → ${trabajador.oficina} (${distanciaVuelta.toFixed(2)} km)`);
      }
    }
    
    // Guardar todos los viajes
    for (const viaje of viajes) {
      await guardarViaje(viaje);
    }
    
    return {
      viajes,
      totalKm,
      totalPrecio,
      trabajador: trabajador.email
    };
    
  } catch (error) {
    logger.error(`Error procesando viajes de ${trabajador.email}:`, error);
    throw error;
  }
}

/**
 * Función principal para registrar viajes del día
 */
async function registrarViajesDelDia() {
  try {
    const fecha = new Date();
    const configTrabajadores = await obtenerConfiguracionTrabajadores();
    
    let resultadosGlobales = {
      totalViajes: 0,
      totalKm: 0,
      totalPrecio: 0,
      trabajadores: []
    };
    
    for (const trabajador of configTrabajadores) {
      if (trabajador.activo) {
        logger.info(`Procesando trabajador: ${trabajador.email}`);
        
        const resultado = await procesarViajesTrabajador(trabajador, fecha);
        
        resultadosGlobales.totalViajes += resultado.viajes.length;
        resultadosGlobales.totalKm += resultado.totalKm;
        resultadosGlobales.totalPrecio += resultado.totalPrecio;
        resultadosGlobales.trabajadores.push(resultado);
      }
    }
    
    logger.info('Resumen diario:', {
      fecha: fecha.toLocaleDateString(),
      ...resultadosGlobales
    });
    
    return resultadosGlobales;
    
  } catch (error) {
    logger.error('Error en registro diario:', error);
    throw error;
  }
}

module.exports = {
  registrarViajesDelDia,
  procesarViajesTrabajador,
  obtenerEventosDelDia
};