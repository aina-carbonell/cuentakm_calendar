/**
 * Punto de entrada principal del sistema
 */

const { registrarViajesDelDia } = require('./calendar-service');
const { formatearSheet, generarInformeMensual } = require('./sheets-service');
const { obtenerConfiguracion } = require('./config');
const logger = require('./utils/logger');

/**
 * Función principal que se ejecuta diariamente
 */
async function main() {
  try {
    logger.info('Iniciando sistema de registro de kilómetros');
    
    const config = await obtenerConfiguracion();
    logger.info(`Configuración cargada: ${config.empresa}`);
    
    // Registrar viajes de todos los trabajadores
    const resultados = await registrarViajesDelDia();
    
    logger.info(`Registros completados: ${resultados.totalViajes} viajes`);
    logger.info(`Total kilómetros: ${resultados.totalKm} km`);
    logger.info(`Total importe: ${resultados.totalPrecio} €`);
    
    // Formatear sheet si es necesario
    if (resultados.nuevosRegistros > 0) {
      await formatearSheet();
    }
    
    // Generar informe si es fin de mes
    if (esFinDeMes()) {
      await generarInformeMensual();
    }
    
    logger.info('Proceso completado exitosamente');
    
  } catch (error) {
    logger.error('Error en la ejecución principal:', error);
    await notificarError(error);
  }
}

/**
 * Verifica si hoy es el último día del mes
 */
function esFinDeMes() {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  return manana.getMonth() !== hoy.getMonth();
}

/**
 * Notifica errores por email
 */
async function notificarError(error) {
  // Implementar envío de email
  console.error('Error crítico:', error);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main };