/**
 * Servicio de Google Sheets para almacenar registros
 */

const { google } = require('googleapis');
const logger = require('./utils/logger');

/**
 * Autenticación con Google Sheets
 */
async function autenticarSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  
  return google.sheets({ version: 'v4', auth });
}

/**
 * Guarda un viaje en el sheet
 */
async function guardarViaje(viaje) {
  try {
    const sheets = await autenticarSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Preparar fila
    const values = [[
      viaje.fecha.toLocaleDateString('es-ES'),
      viaje.trabajador,
      viaje.inicio,
      viaje.destino,
      viaje.kmTrayecto,
      viaje.precioKm,
      viaje.precioTrayecto,
      viaje.totalKmAcumulado,
      viaje.totalPrecioAcumulado,
      viaje.eventoTitle,
      new Date().toLocaleString('es-ES')
    ]];
    
    // Añadir fila al sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'RegistroViajes!A:K',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });
    
    logger.info(`Viaje guardado en fila ${response.data.updates.updatedRange}`);
    
    return response.data;
    
  } catch (error) {
    logger.error('Error guardando viaje:', error);
    throw error;
  }
}

/**
 * Inicializa la estructura del sheet
 */
async function inicializarSheet(spreadsheetId) {
  try {
    const sheets = await autenticarSheets();
    
    // Crear hojas necesarias
    const hojas = [
      {
        properties: {
          title: 'RegistroViajes',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Configuración',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Trabajadores',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'HistóricoMensual',
          gridProperties: { frozenRowCount: 1 }
        }
      }
    ];
    
    // Añadir hojas si no existen
    for (const hoja of hojas) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
            requests: [{
              addSheet: hoja
            }]
          }
        });
      } catch (e) {
        // La hoja ya existe, ignorar
      }
    }
    
    // Configurar cabeceras
    await configurarCabeceras(sheets, spreadsheetId);
    
    logger.info('Sheet inicializado correctamente');
    
  } catch (error) {
    logger.error('Error inicializando sheet:', error);
    throw error;
  }
}

/**
 * Configura las cabeceras de las hojas
 */
async function configurarCabeceras(sheets, spreadsheetId) {
  const cabeceras = {
    RegistroViajes: [
      ['Fecha', 'Trabajador', 'Inicio', 'Destino', 'Km Trayecto', 
       'Precio/km', 'Precio Trayecto', 'Total Km', 'Total Precio', 
       'Evento', 'Registrado']
    ],
    Configuración: [
      ['Parámetro', 'Valor', 'Descripción', 'Última Actualización']
    ],
    Trabajadores: [
      ['Email', 'Oficina', 'Precio/km', 'Calendario ID', 'Activo', 'Notas']
    ],
    HistóricoMensual: [
      ['Mes', 'Año', 'Total Km', 'Total Precio', 'Nº Viajes', 'Nº Trabajadores']
    ]
  };
  
  for (const [hoja, cabecera] of Object.entries(cabeceras)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${hoja}!A1:${String.fromCharCode(64 + cabecera[0].length)}1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: cabecera }
    });
  }
  
  // Formatear cabeceras
  await formatearSheet(sheets, spreadsheetId);
}

/**
 * Formatea el sheet (colores, negritas, formatos numéricos)
 */
async function formatearSheet(sheets, spreadsheetId) {
  try {
    const requests = [
      // Negrita en cabeceras
      {
        repeatCell: {
          range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true } } },
          fields: 'userEnteredFormat.textFormat.bold'
        }
      },
      // Color de fondo para cabeceras
      {
        repeatCell: {
          range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
          fields: 'userEnteredFormat.backgroundColor'
        }
      },
      // Formato número para km
      {
        repeatCell: {
          range: { sheetId: 0, startColumnIndex: 4, endColumnIndex: 5 },
          cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0.00 "km"' } } },
          fields: 'userEnteredFormat.numberFormat'
        }
      },
      // Formato moneda para precios
      {
        repeatCell: {
          range: { sheetId: 0, startColumnIndex: 5, endColumnIndex: 9 },
          cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '#,##0.00 "€"' } } },
          fields: 'userEnteredFormat.numberFormat'
        }
      },
      // Autoajustar columnas
      {
        autoResizeDimensions: {
          dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 11 }
        }
      }
    ];
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: { requests }
    });
    
    logger.info('Sheet formateado correctamente');
    
  } catch (error) {
    logger.error('Error formateando sheet:', error);
  }
}

/**
 * Genera informe mensual
 */
async function generarInformeMensual() {
  try {
    const sheets = await autenticarSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    const fecha = new Date();
    const mes = fecha.toLocaleString('es-ES', { month: 'long' });
    const año = fecha.getFullYear();
    
    // Obtener datos del mes
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'RegistroViajes!A:K',
      majorDimension: 'ROWS'
    });
    
    const filas = response.data.values || [];
    
    // Calcular totales del mes actual
    let totalKm = 0;
    let totalPrecio = 0;
    let viajesUnicos = new Set();
    let trabajadoresUnicos = new Set();
    
    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if (fila && fila[0]) {
        const fechaRegistro = new Date(fila[0].split('/').reverse().join('-'));
        if (fechaRegistro.getMonth() === fecha.getMonth() && 
            fechaRegistro.getFullYear() === fecha.getFullYear()) {
          totalKm += parseFloat(fila[4]) || 0;
          totalPrecio += parseFloat(fila[6]) || 0;
          viajesUnicos.add(fila[9]); // ID del evento
          trabajadoresUnicos.add(fila[1]); // Email trabajador
        }
      }
    }
    
    // Guardar resumen mensual
    const resumen = [[
      mes,
      año,
      totalKm.toFixed(2),
      totalPrecio.toFixed(2),
      viajesUnicos.size,
      trabajadoresUnicos.size
    ]];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'HistóricoMensual!A:F',
      valueInputOption: 'USER_ENTERED',
      resource: { values: resumen }
    });
    
    logger.info(`Informe mensual generado: ${mes} ${año} - ${totalKm} km, ${totalPrecio} €`);
    
  } catch (error) {
    logger.error('Error generando informe mensual:', error);
    throw error;
  }
}

module.exports = {
  guardarViaje,
  inicializarSheet,
  formatearSheet,
  generarInformeMensual
};