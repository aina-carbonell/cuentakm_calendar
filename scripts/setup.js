/**
 * Script de configuración inicial del proyecto
 * BUGS CORREGIDOS:
 *   - const path = require('fs') era incorrecto (debería ser require('path'))
 *   - spreadsheetId no estaba en scope al configurar trabajadores
 *   - Mejor manejo de errores y flujo de usuario
 */

const fs = require('fs');
const path = require('path');         // BUG CORREGIDO: era require('fs') por error
const readline = require('readline');
const { google } = require('googleapis');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', bold: '\x1b[1m'
};

function log(msg, color = '') { console.log(`${color}${msg}${c.reset}`); }

async function pregunta(texto) {
  return new Promise(resolve => rl.question(texto, resolve));
}

async function preguntaOpcional(texto, porDefecto) {
  const respuesta = await pregunta(`${texto} [${porDefecto}]: `);
  return respuesta.trim() || porDefecto;
}

async function setup() {
  log('\n🔧 Configuración del Sistema de Kilómetros\n', c.cyan + c.bold);
  log('Este asistente te guiará por la configuración inicial.\n', c.reset);

  // ── Empresa ────────────────────────────────────────────────
  log('─── Información de la empresa ───', c.bold);
  const empresaNombre = await preguntaOpcional('Nombre de la empresa', 'Mi Empresa');
  const emailAdmin = await pregunta('Email del administrador (para notificaciones): ');
  const precioKm = await preguntaOpcional('Precio por kilómetro (€)', '0.25');
  const horaEjecucion = await preguntaOpcional('Hora de ejecución diaria (0-23)', '23');

  // ── Google APIs ────────────────────────────────────────────
  log('\n─── Configuración de Google APIs ───', c.bold);

  if (!fs.existsSync('credentials.json')) {
    log('\n⚠  No se encontró credentials.json', c.yellow);
    log('\nPara obtenerlo:', c.reset);
    log('  1. Ve a https://console.cloud.google.com/', c.reset);
    log('  2. Crea/selecciona un proyecto', c.reset);
    log('  3. Habilita: Google Calendar API, Google Sheets API, Google Maps API', c.reset);
    log('  4. Crea credenciales → Cuenta de servicio', c.reset);
    log('  5. Descarga el JSON y renómbralo a credentials.json en la raíz del proyecto', c.reset);
    await pregunta('\nPresiona Enter cuando hayas completado esto...');
  }

  if (!fs.existsSync('credentials.json')) {
    log('credentials.json sigue sin encontrarse. El setup continuará pero algunas funciones no estarán disponibles.', c.yellow);
  }

  const apiKey = await pregunta('Google Maps API Key: ');

  // ── Crear .env ─────────────────────────────────────────────
  log('\n─── Creando archivo .env ───', c.bold);

  const envContent = [
    '# === CREDENCIALES GOOGLE ===',
    'GOOGLE_APPLICATION_CREDENTIALS=./credentials.json',
    `GOOGLE_MAPS_API_KEY=${apiKey}`,
    '',
    '# === SPREADSHEET (se completará automáticamente) ===',
    'SPREADSHEET_ID=',
    '',
    '# === CONFIGURACIÓN DE LA EMPRESA ===',
    `EMPRESA_NOMBRE=${empresaNombre}`,
    `EMAIL_ADMIN=${emailAdmin}`,
    `PRECIO_POR_KM=${precioKm}`,
    `HORA_EJECUCION=${horaEjecucion}`,
    '',
    '# === SISTEMA ===',
    'TIMEZONE=Europe/Madrid',
    'LOG_LEVEL=INFO',
    'NODE_ENV=production',
    ''
  ].join('\n');

  fs.writeFileSync('.env', envContent);
  log('✔ Archivo .env creado', c.green);

  // ── Crear Google Sheet ──────────────────────────────────────
  log('\n─── Creando Google Sheet ───', c.bold);

  let spreadsheetId = null;  // BUG CORREGIDO: declarado aquí para estar en scope

  if (fs.existsSync('credentials.json')) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: './credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.create({
        resource: {
          properties: { title: `Registro de Kilómetros - ${empresaNombre}` }
        }
      });

      spreadsheetId = response.data.spreadsheetId;

      // Actualizar .env con el ID del sheet
      const envActualizado = envContent.replace('SPREADSHEET_ID=', `SPREADSHEET_ID=${spreadsheetId}`);
      fs.writeFileSync('.env', envActualizado);

      log(`✔ Spreadsheet creado: https://docs.google.com/spreadsheets/d/${spreadsheetId}`, c.green);

      // Inicializar estructura del sheet
      const { inicializarSheet } = require('../src/sheets-service');
      process.env.GOOGLE_APPLICATION_CREDENTIALS = './credentials.json';
      process.env.SPREADSHEET_ID = spreadsheetId;
      await inicializarSheet(spreadsheetId);
      log('✔ Estructura del sheet creada', c.green);

    } catch (error) {
      log(`✗ Error creando spreadsheet: ${error.message}`, c.red);
      log('Puedes crear el sheet manualmente y añadir SPREADSHEET_ID al .env', c.yellow);
    }
  } else {
    log('⚠  Sin credentials.json, crea el sheet manualmente y añade su ID al .env', c.yellow);
  }

  // ── Configurar trabajadores ─────────────────────────────────
  log('\n─── Configuración de trabajadores ───', c.bold);

  const numStr = await preguntaOpcional('¿Cuántos trabajadores quieres configurar ahora?', '1');
  const numTrabajadores = parseInt(numStr) || 1;

  const trabajadores = [];
  for (let i = 0; i < numTrabajadores; i++) {
    log(`\nTrabajador ${i + 1}:`, c.bold);
    const email = await pregunta('  Email: ');
    const oficina = await pregunta('  Dirección de oficina (completa): ');
    const precio = await preguntaOpcional('  Precio por km (€)', precioKm);
    const calendarId = await preguntaOpcional('  ID del calendario', 'primary');

    trabajadores.push({
      email: email.trim(),
      oficina: oficina.trim(),
      precioKm: parseFloat(precio) || 0.25,
      calendarId: calendarId.trim(),
      activo: 'Sí'
    });
  }

  // Guardar trabajadores en el sheet si está disponible
  if (spreadsheetId && fs.existsSync('credentials.json')) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: './credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const values = trabajadores.map(t => [
        t.email, t.oficina, t.precioKm, t.calendarId, t.activo, 'Configurado en setup'
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Trabajadores!A2:F',
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });

      log('✔ Trabajadores guardados en el sheet', c.green);

    } catch (error) {
      log(`⚠  No se pudieron guardar los trabajadores en el sheet: ${error.message}`, c.yellow);
    }
  }

  // Guardar también en archivo local como backup
  const configLocal = path.join('data', 'trabajadores-config.json');
  if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(configLocal, JSON.stringify(trabajadores, null, 2));
  log('✔ Configuración de trabajadores guardada localmente', c.green);

  // ── Crear directorios necesarios ────────────────────────────
  ['logs', 'data'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // ── Resumen final ───────────────────────────────────────────
  log('\n══════════════════════════════════════════', c.cyan + c.bold);
  log('  ✨ ¡Configuración completada!', c.green + c.bold);
  log('══════════════════════════════════════════\n', c.cyan + c.bold);
  log('Próximos pasos:', c.bold);
  log('  1. npm run deploy  → Verificar y desplegar', c.reset);
  log('  2. npm start       → Prueba de ejecución manual', c.reset);
  log('  3. npm test        → Ejecutar suite de tests', c.reset);

  if (spreadsheetId) {
    log(`\n  📊 Tu sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`, c.blue);
  }

  log('\n  📖 Lee INSTALLATION.md para más detalles\n', c.reset);

  rl.close();
}

setup().catch(error => {
  console.error('\n✗ Error en setup:', error.message);
  rl.close();
  process.exit(1);
});