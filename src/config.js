/**
 * Configuración central del sistema
 * BUG CORREGIDO: el original no cargaba dotenv ni exportaba correctamente
 */
require('dotenv').config();

const CONFIG = {
  // IDs de Google Sheets
  SPREADSHEET_ID: process.env.SPREADSHEET_ID || '',

  // Nombres de hojas
  SHEETS: {
    REGISTRO: 'RegistroViajes',
    CONFIGURACION: 'Configuracion',
    TRABAJADORES: 'Trabajadores',
    HISTORICO: 'HistoricoMensual'
  },

  // Configuración de calendario
  CALENDAR: {
    ID: 'primary',
    DIAS_REVISION: 7,
    HORA_EJECUCION: 23
  },

  // Configuración de precios
  PRECIOS: {
    POR_KM: parseFloat(process.env.PRECIO_POR_KM) || 0.25,
    MONEDA: '€',
    UNIDAD_DISTANCIA: 'km'
  },

  // Configuración de Google Maps API
  MAPS: {
    API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    UNIDADES: 'metric',
    MODO: 'driving'
  },

  // Empresa
  EMPRESA: {
    NOMBRE: process.env.EMPRESA_NOMBRE || 'Mi Empresa',
    EMAIL_ADMIN: process.env.EMAIL_ADMIN || ''
  },

  // Formatos
  FORMATOS: {
    FECHA: 'dd/MM/yyyy',
    HORA: 'HH:mm',
    NUMERO: '#,##0.00',
    MONEDA: '#,##0.00 "€"'
  }
};

/**
 * Obtiene la configuración general
 */
async function obtenerConfiguracion() {
  return {
    empresa: CONFIG.EMPRESA.NOMBRE,
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    precioKm: CONFIG.PRECIOS.POR_KM,
    mapsApiKey: CONFIG.MAPS.API_KEY ? '***configurada***' : 'NO CONFIGURADA'
  };
}

/**
 * Obtiene la lista de trabajadores desde el Google Sheet
 * BUG CORREGIDO: el original llamaba a obtenerConfiguracionTrabajadores que no existía
 */
async function obtenerConfiguracionTrabajadores() {
  const { google } = require('googleapis');

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: `${CONFIG.SHEETS.TRABAJADORES}!A2:F`,
      majorDimension: 'ROWS'
    });

    const filas = response.data.values || [];

    return filas
      .filter(fila => fila[0]) // Filtrar filas vacías
      .map(fila => ({
        email: fila[0] || '',
        oficina: fila[1] || '',
        precioKm: parseFloat(fila[2]) || CONFIG.PRECIOS.POR_KM,
        calendarId: fila[3] || 'primary',
        activo: (fila[4] || '').toLowerCase() === 'sí' || (fila[4] || '').toLowerCase() === 'si',
        notas: fila[5] || ''
      }));

  } catch (error) {
    // Si no se puede leer del sheet, usar configuración de entorno
    console.warn('No se pudo cargar trabajadores del sheet, usando configuración de entorno');
    const emailsEnv = (process.env.TRABAJADORES_EMAILS || '').split(',').filter(Boolean);

    return emailsEnv.map(email => ({
      email: email.trim(),
      oficina: process.env.OFICINA_DEFAULT || '',
      precioKm: CONFIG.PRECIOS.POR_KM,
      calendarId: 'primary',
      activo: true,
      notas: ''
    }));
  }
}

/**
 * Valida que la configuración sea correcta antes de ejecutar
 */
function validarConfiguracion() {
  const errores = [];

  if (!CONFIG.MAPS.API_KEY) errores.push('GOOGLE_MAPS_API_KEY no configurada');
  if (!CONFIG.SPREADSHEET_ID) errores.push('SPREADSHEET_ID no configurado');
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) errores.push('GOOGLE_APPLICATION_CREDENTIALS no configurado');

  return {
    valido: errores.length === 0,
    errores
  };
}

module.exports = {
  CONFIG,
  obtenerConfiguracion,
  obtenerConfiguracionTrabajadores,
  validarConfiguracion
};