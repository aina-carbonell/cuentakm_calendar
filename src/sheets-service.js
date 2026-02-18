/**
 * Servicio de Google Sheets para almacenar registros
 * BUGS CORREGIDOS:
 *   - formatearSheet y generarInformeMensual exportadas correctamente con firma correcta
 *   - formatearSheet ahora funciona sin argumentos (usa env vars)
 *   - Encoding de caracteres especiales en nombres de hojas
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

    if (!spreadsheetId) throw new Error('SPREADSHEET_ID no configurado');

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
      viaje.eventoId,
      new Date().toLocaleString('es-ES')
    ]];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'RegistroViajes!A:L',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    logger.info(`Viaje guardado: ${viaje.inicio} → ${viaje.destino} (${viaje.kmTrayecto} km)`);
    return response.data;

  } catch (error) {
    logger.error('Error guardando viaje', error);
    throw error;
  }
}

/**
 * Inicializa la estructura del sheet con todas las hojas necesarias
 */
async function inicializarSheet(spreadsheetId) {
  try {
    const sheets = await autenticarSheets();
    const sid = spreadsheetId || process.env.SPREADSHEET_ID;

    // Obtener hojas existentes
    const infoSheet = await sheets.spreadsheets.get({ spreadsheetId: sid });
    const hojasExistentes = infoSheet.data.sheets.map(s => s.properties.title);

    const hojasNecesarias = [
      { title: 'RegistroViajes', sheetId: 0 },
      { title: 'Configuracion', sheetId: 1 },
      { title: 'Trabajadores', sheetId: 2 },
      { title: 'HistoricoMensual', sheetId: 3 }
    ];

    // Crear hojas que no existan
    const requests = [];
    let nextSheetId = 10;

    for (const hoja of hojasNecesarias) {
      if (!hojasExistentes.includes(hoja.title)) {
        requests.push({
          addSheet: {
            properties: {
              title: hoja.title,
              gridProperties: { frozenRowCount: 1 }
            }
          }
        });
      }
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sid,
        resource: { requests }
      });
    }

    // Configurar cabeceras
    await configurarCabeceras(sheets, sid);

    logger.info('Sheet inicializado correctamente');
    return true;

  } catch (error) {
    logger.error('Error inicializando sheet', error);
    throw error;
  }
}

/**
 * Configura las cabeceras de las hojas
 */
async function configurarCabeceras(sheets, spreadsheetId) {
  const cabeceras = {
    'RegistroViajes': [['Fecha', 'Trabajador', 'Inicio', 'Destino', 'Km Trayecto',
      'Precio/km', 'Precio Trayecto', 'Total Km Acum.', 'Total Precio Acum.',
      'Evento', 'ID Evento', 'Registrado el']],
    'Configuracion': [['Parámetro', 'Valor', 'Descripción', 'Última Actualización']],
    'Trabajadores': [['Email', 'Oficina', 'Precio/km', 'Calendario ID', 'Activo', 'Notas']],
    'HistoricoMensual': [['Mes', 'Año', 'Total Km', 'Total Precio (€)', 'Nº Viajes', 'Nº Trabajadores', 'Generado el']]
  };

  for (const [hoja, cabecera] of Object.entries(cabeceras)) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${hoja}!A1:${String.fromCharCode(64 + cabecera[0].length)}1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: cabecera }
      });
    } catch (e) {
      logger.warn(`No se pudo actualizar cabecera de ${hoja}: ${e.message}`);
    }
  }
}

/**
 * Formatea el sheet (colores, negritas, formatos numéricos)
 * BUG CORREGIDO: firma corregida para funcionar con o sin argumentos
 */
async function formatearSheet(sheetsInstance, spreadsheetId) {
  try {
    const sheets = sheetsInstance || await autenticarSheets();
    const sid = spreadsheetId || process.env.SPREADSHEET_ID;

    if (!sid) throw new Error('SPREADSHEET_ID no configurado');

    // Obtener el sheetId real de RegistroViajes
    const info = await sheets.spreadsheets.get({ spreadsheetId: sid });
    const hoja = info.data.sheets.find(s => s.properties.title === 'RegistroViajes');
    if (!hoja) return;

    const sheetId = hoja.properties.sheetId;

    const requests = [
      // Negrita en cabeceras
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true } } },
          fields: 'userEnteredFormat.textFormat.bold'
        }
      },
      // Color de fondo azul suave para cabeceras
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.23, green: 0.47, blue: 0.75 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      // Formato número para km (columna E)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, startColumnIndex: 4, endColumnIndex: 5 },
          cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0.00 "km"' } } },
          fields: 'userEnteredFormat.numberFormat'
        }
      },
      // Formato moneda para precios (columnas G, H, I)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, startColumnIndex: 6, endColumnIndex: 9 },
          cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0.00 "€"' } } },
          fields: 'userEnteredFormat.numberFormat'
        }
      },
      // Autoajustar columnas
      {
        autoResizeDimensions: {
          dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 12 }
        }
      }
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sid,
      resource: { requests }
    });

    logger.info('Sheet formateado correctamente');

  } catch (error) {
    logger.error('Error formateando sheet', error);
  }
}

/**
 * Genera informe mensual en la hoja HistoricoMensual
 */
async function generarInformeMensual() {
  try {
    const sheets = await autenticarSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!spreadsheetId) throw new Error('SPREADSHEET_ID no configurado');

    const fecha = new Date();
    const { nombreMes } = require('./utils/date-utils');
    const mes = nombreMes(fecha.getMonth());
    const anio = fecha.getFullYear();

    // Obtener datos del mes actual desde RegistroViajes
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'RegistroViajes!A:L',
      majorDimension: 'ROWS'
    });

    const filas = (response.data.values || []).slice(1); // Saltar cabecera

    let totalKm = 0;
    let totalPrecio = 0;
    const viajesUnicos = new Set();
    const trabajadoresUnicos = new Set();

    for (const fila of filas) {
      if (!fila || !fila[0]) continue;

      // Parsear fecha en formato dd/mm/yyyy
      const partes = fila[0].split('/');
      if (partes.length !== 3) continue;

      const fechaRegistro = new Date(
        parseInt(partes[2]),
        parseInt(partes[1]) - 1,
        parseInt(partes[0])
      );

      if (fechaRegistro.getMonth() === fecha.getMonth() &&
        fechaRegistro.getFullYear() === fecha.getFullYear()) {
        totalKm += parseFloat(fila[4]) || 0;
        totalPrecio += parseFloat(fila[6]) || 0;
        if (fila[10]) viajesUnicos.add(fila[10]); // ID Evento
        if (fila[1]) trabajadoresUnicos.add(fila[1]); // Email
      }
    }

    const resumen = [[
      mes,
      anio,
      totalKm.toFixed(2),
      totalPrecio.toFixed(2),
      viajesUnicos.size,
      trabajadoresUnicos.size,
      new Date().toLocaleString('es-ES')
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'HistoricoMensual!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values: resumen }
    });

    logger.info(`Informe mensual generado: ${mes} ${anio} - ${totalKm.toFixed(2)} km, ${totalPrecio.toFixed(2)} €`);
    return { mes, anio, totalKm, totalPrecio, numViajes: viajesUnicos.size, numTrabajadores: trabajadoresUnicos.size };

  } catch (error) {
    logger.error('Error generando informe mensual', error);
    throw error;
  }
}

/**
 * Obtiene el resumen de un trabajador para un rango de fechas
 */
async function obtenerResumenTrabajador(emailTrabajador, fechaInicio, fechaFin) {
  try {
    const sheets = await autenticarSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'RegistroViajes!A:L',
      majorDimension: 'ROWS'
    });

    const filas = (response.data.values || []).slice(1);
    let totalKm = 0;
    let totalPrecio = 0;
    const viajes = [];

    for (const fila of filas) {
      if (!fila || fila[1] !== emailTrabajador) continue;

      const partes = (fila[0] || '').split('/');
      if (partes.length !== 3) continue;

      const fechaViaje = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));

      if (fechaViaje >= fechaInicio && fechaViaje <= fechaFin) {
        const km = parseFloat(fila[4]) || 0;
        const precio = parseFloat(fila[6]) || 0;
        totalKm += km;
        totalPrecio += precio;
        viajes.push({ fecha: fila[0], inicio: fila[2], destino: fila[3], km, precio, evento: fila[9] });
      }
    }

    return { emailTrabajador, totalKm, totalPrecio, numViajes: viajes.length, viajes };

  } catch (error) {
    logger.error('Error obteniendo resumen trabajador', error);
    throw error;
  }
}

module.exports = {
  guardarViaje,
  inicializarSheet,
  formatearSheet,
  generarInformeMensual,
  obtenerResumenTrabajador
};