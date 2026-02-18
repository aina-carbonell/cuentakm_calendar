/**
 * Punto de entrada principal del sistema
 * BUGS CORREGIDOS:
 *   - esFinDeMes se importa ahora desde date-utils (no estaba definida localmente)
 *   - obtenerConfiguracion se importa correctamente
 *   - Manejo correcto del parámetro fecha en registrarViajesDelDia
 */

require('dotenv').config();

const { registrarViajesDelDia } = require('./calendar-service');
const { formatearSheet, generarInformeMensual } = require('./sheets-service');
const { obtenerConfiguracion, validarConfiguracion } = require('./config');
const { esFinDeMes } = require('./utils/date-utils');
const { guardarUltimaEjecucion } = require('./utils/storage-utils');
const logger = require('./utils/logger');

/**
 * Función principal que se ejecuta diariamente
 */
async function main(fechaEjecucion = new Date()) {
  const inicio = Date.now();

  try {
    logger.info('═══════════════════════════════════════');
    logger.info('  INICIANDO SISTEMA DE REGISTRO DE KM  ');
    logger.info('═══════════════════════════════════════');

    // Validar configuración antes de ejecutar
    const validacion = validarConfiguracion();
    if (!validacion.valido) {
      const msg = `Configuración incompleta: ${validacion.errores.join(', ')}`;
      logger.error(msg);
      throw new Error(msg);
    }

    const config = await obtenerConfiguracion();
    logger.info(`Empresa: ${config.empresa}`);
    logger.info(`Fecha de ejecución: ${fechaEjecucion.toLocaleDateString('es-ES')}`);

    // Registrar viajes de todos los trabajadores
    const resultados = await registrarViajesDelDia(fechaEjecucion);

    logger.info(`Registros completados: ${resultados.totalViajes} viajes`);
    logger.info(`Total kilómetros: ${resultados.totalKm} km`);
    logger.info(`Total importe: ${resultados.totalPrecio} €`);

    // Formatear sheet si hay nuevos registros
    if (resultados.totalViajes > 0) {
      await formatearSheet();
    }

    // Generar informe si es fin de mes
    if (esFinDeMes(fechaEjecucion)) {
      logger.info('Último día del mes detectado, generando informe mensual...');
      await generarInformeMensual();
    }

    // Guardar estado de la ejecución
    const duracion = Date.now() - inicio;
    await guardarUltimaEjecucion({
      fecha: fechaEjecucion.toISOString(),
      totalViajes: resultados.totalViajes,
      totalKm: resultados.totalKm,
      totalPrecio: resultados.totalPrecio,
      duracionMs: duracion,
      exito: true
    });

    logger.info(`Proceso completado en ${(duracion / 1000).toFixed(1)}s`);
    logger.info('═══════════════════════════════════════');

    return resultados;

  } catch (error) {
    logger.error('Error en la ejecución principal', error);

    await guardarUltimaEjecucion({
      fecha: fechaEjecucion.toISOString(),
      error: error.message,
      exito: false
    }).catch(() => {}); // No propagar errores del guardado de estado

    await notificarError(error);
    process.exit(1);
  }
}

/**
 * Notifica errores críticos por email (a implementar según necesidades)
 */
async function notificarError(error) {
  const emailAdmin = process.env.EMAIL_ADMIN;

  if (!emailAdmin) {
    logger.warn('EMAIL_ADMIN no configurado, no se enviará notificación de error');
    return;
  }

  // TODO: Integrar con nodemailer o similar
  logger.error(`[NOTIFICACIÓN PENDIENTE] Error crítico para ${emailAdmin}: ${error.message}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main };