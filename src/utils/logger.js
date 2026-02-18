/**
 * Sistema de logging
 */

const fs = require('fs');
const path = require('path');

// Niveles de log
const NIVELES = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Configuración por defecto
const CONFIG = {
  nivel: process.env.LOG_LEVEL || 'INFO',
  directorio: path.join(__dirname, '../../logs'),
  formato: 'json', // 'json' o 'texto'
  maxArchivos: 7, // días de logs a mantener
  maxTamaño: 10 * 1024 * 1024 // 10MB
};

// Crear directorio de logs si no existe
if (!fs.existsSync(CONFIG.directorio)) {
  fs.mkdirSync(CONFIG.directorio, { recursive: true });
}

/**
 * Obtiene el archivo de log para hoy
 */
function getArchivoHoy() {
  const fecha = new Date().toISOString().split('T')[0];
  return path.join(CONFIG.directorio, `log-${fecha}.log`);
}

/**
 * Formatea un mensaje de log
 */
function formatearMensaje(nivel, mensaje, datos = {}) {
  const timestamp = new Date().toISOString();
  
  if (CONFIG.formato === 'json') {
    return JSON.stringify({
      timestamp,
      nivel,
      mensaje,
      ...datos
    }) + '\n';
  } else {
    const tiempo = new Date().toLocaleTimeString('es-ES');
    const datosStr = Object.keys(datos).length ? ` | ${JSON.stringify(datos)}` : '';
    return `[${tiempo}] [${nivel}] ${mensaje}${datosStr}\n`;
  }
}

/**
 * Escribe en el archivo de log
 */
function escribirLog(contenido) {
  const archivo = getArchivoHoy();
  
  fs.appendFile(archivo, contenido, (error) => {
    if (error) {
      console.error('Error escribiendo log:', error);
    }
  });
  
  // También mostrar en consola en desarrollo
  if (process.env.NODE_ENV === 'development') {
    process.stdout.write(contenido);
  }
}

/**
 * Limpia logs antiguos
 */
function limpiarLogsAntiguos() {
  const archivos = fs.readdirSync(CONFIG.directorio);
  const ahora = Date.now();
  
  archivos.forEach(archivo => {
    const ruta = path.join(CONFIG.directorio, archivo);
    const stats = fs.statSync(ruta);
    const diasAntiguedad = (ahora - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    
    if (diasAntiguedad > CONFIG.maxArchivos) {
      fs.unlinkSync(ruta);
    }
  });
}

// Limpiar logs antiguos al iniciar
limpiarLogsAntiguos();

/**
 * Logger principal
 */
const logger = {
  debug: (mensaje, datos = {}) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.DEBUG) {
      escribirLog(formatearMensaje('DEBUG', mensaje, datos));
    }
  },
  
  info: (mensaje, datos = {}) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.INFO) {
      escribirLog(formatearMensaje('INFO', mensaje, datos));
    }
  },
  
  warn: (mensaje, datos = {}) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.WARN) {
      escribirLog(formatearMensaje('WARN', mensaje, datos));
    }
  },
  
  error: (mensaje, error = null) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.ERROR) {
      const datos = error ? {
        mensajeError: error.message,
        stack: error.stack,
        ...(error.response?.data && { respuestaAPI: error.response.data })
      } : {};
      
      escribirLog(formatearMensaje('ERROR', mensaje, datos));
      
      // También mostrar en consola siempre
      console.error(`[ERROR] ${mensaje}`, error || '');
    }
  }
};

module.exports = logger;