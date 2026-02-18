/**
 * Configuración central del sistema
 */

const CONFIG = {
  // IDs de Google Sheets (se configuran durante setup)
  SPREADSHEET_ID: 'TU_SPREADSHEET_ID',
  
  // Nombres de hojas
  SHEETS: {
    REGISTRO: 'RegistroViajes',
    CONFIGURACION: 'Configuración',
    TRABAJADORES: 'Trabajadores',
    HISTORICO: 'HistóricoMensual'
  },
  
  // Configuración de calendario
  CALENDAR: {
    ID: 'primary', // o email del calendario específico
    DIAS_REVISION: 7, // días hacia atrás para revisar
    HORA_EJECUCION: 23 // 11 PM
  },
  
  // Configuración de precios
  PRECIOS: {
    POR_KM: 0.25, // euros por kilómetro
    MONEDA: '€',
    UNIDAD_DISTANCIA: 'km'
  },
  
  // Configuración de Google Maps API
  MAPS: {
    API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    UNIDADES: 'metric', // metric = kilómetros
    MODO: 'driving' // driving, walking, bicycling, transit
  },
  
  // Formatos
  FORMATOS: {
    FECHA: 'dd/MM/yyyy',
    HORA: 'HH:mm',
    NUMERO: '#,##0.00',
    MONEDA: '#,##0.00 "€"'
  }
};

module.exports = CONFIG;