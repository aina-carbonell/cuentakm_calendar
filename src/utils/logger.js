/**
 * Sistema de logging
 * BUG CORREGIDO: path del directorio de logs era incorrecto (../../logs desde src/utils/)
 */

const fs = require('fs');
const path = require('path');

const NIVELES = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CONFIG = {
  nivel: (process.env.LOG_LEVEL || 'INFO').toUpperCase(),
  directorio: path.join(__dirname, '../../logs'),
  formato: process.env.LOG_FORMAT || 'texto',
  maxArchivos: 7,
  consola: process.env.NODE_ENV !== 'production'
};

// Crear directorio de logs si no existe
if (!fs.existsSync(CONFIG.directorio)) {
  fs.mkdirSync(CONFIG.directorio, { recursive: true });
}

// Colores ANSI para consola
const COLORES = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const COLORES_NIVEL = {
  DEBUG: COLORES.dim,
  INFO: COLORES.green,
  WARN: COLORES.yellow,
  ERROR: COLORES.red
};

function getArchivoHoy() {
  const fecha = new Date().toISOString().split('T')[0];
  return path.join(CONFIG.directorio, `log-${fecha}.log`);
}

function formatearMensaje(nivel, mensaje, datos = null) {
  const timestamp = new Date().toISOString();

  if (CONFIG.formato === 'json') {
    const entrada = { timestamp, nivel, mensaje };
    if (datos) entrada.datos = datos;
    return JSON.stringify(entrada) + '\n';
  }

  const tiempo = new Date().toLocaleTimeString('es-ES');
  const datosStr = datos ? ` | ${JSON.stringify(datos)}` : '';
  return `[${tiempo}] [${nivel.padEnd(5)}] ${mensaje}${datosStr}\n`;
}

function escribirLog(nivel, contenido) {
  // Escribir a archivo
  try {
    fs.appendFileSync(getArchivoHoy(), contenido);
  } catch (error) {
    // Silenciar errores de escritura de log para no entrar en bucle
  }

  // Mostrar en consola si aplica
  if (CONFIG.consola && NIVELES[nivel] >= NIVELES[CONFIG.nivel]) {
    const color = COLORES_NIVEL[nivel] || '';
    process.stdout.write(color + contenido + COLORES.reset);
  }
}

function limpiarLogsAntiguos() {
  try {
    if (!fs.existsSync(CONFIG.directorio)) return;
    const archivos = fs.readdirSync(CONFIG.directorio);
    const ahora = Date.now();

    archivos.forEach(archivo => {
      const ruta = path.join(CONFIG.directorio, archivo);
      try {
        const stats = fs.statSync(ruta);
        const diasAntiguedad = (ahora - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        if (diasAntiguedad > CONFIG.maxArchivos) {
          fs.unlinkSync(ruta);
        }
      } catch (_) {}
    });
  } catch (_) {}
}

limpiarLogsAntiguos();

const logger = {
  debug: (mensaje, datos = null) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.DEBUG) {
      escribirLog('DEBUG', formatearMensaje('DEBUG', mensaje, datos));
    }
  },

  info: (mensaje, datos = null) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.INFO) {
      escribirLog('INFO', formatearMensaje('INFO', mensaje, datos));
    }
  },

  warn: (mensaje, datos = null) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.WARN) {
      escribirLog('WARN', formatearMensaje('WARN', mensaje, datos));
    }
  },

  error: (mensaje, error = null) => {
    if (NIVELES[CONFIG.nivel] <= NIVELES.ERROR) {
      let datos = null;
      if (error) {
        datos = {
          mensajeError: error.message,
          stack: error.stack
        };
        if (error.response?.data) datos.respuestaAPI = error.response.data;
      }
      escribirLog('ERROR', formatearMensaje('ERROR', mensaje, datos));
      // Los errores siempre van a stderr también
      if (!CONFIG.consola) {
        process.stderr.write(`[ERROR] ${mensaje}${error ? ': ' + error.message : ''}\n`);
      }
    }
  }
};

module.exports = logger;