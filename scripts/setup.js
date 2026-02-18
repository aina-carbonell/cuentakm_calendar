/**
 * Script de configuración inicial del proyecto
 */

const fs = require('fs');
const path = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { inicializarSheet } = require('../src/sheets-service');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function pregunta(pregunta) {
  return new Promise((resolve) => {
    rl.question(pregunta, resolve);
  });
}

async function setup() {
  console.log('\n🔧 Configuración del Sistema de Kilómetros\n');
  
  // 1. Verificar credenciales de Google
  console.log('\n📁 Paso 1: Credenciales de Google');
  console.log('Necesitarás:');
  console.log('  - Un archivo credentials.json de Google Cloud Console');
  console.log('  - Una API Key de Google Maps');
  
  const tieneCredenciales = await pregunta('\n¿Ya tienes el archivo credentials.json? (s/n): ');
  
  if (tieneCredenciales.toLowerCase() !== 's') {
    console.log('\n📝 Instrucciones para obtener credenciales:');
    console.log('1. Ve a https://console.cloud.google.com/');
    console.log('2. Crea un proyecto nuevo o selecciona uno existente');
    console.log('3. Habilita las APIs:');
    console.log('   - Google Calendar API');
    console.log('   - Google Sheets API');
    console.log('   - Google Maps API');
    console.log('4. Crea credenciales de tipo "Cuenta de servicio"');
    console.log('5. Descarga el archivo JSON y renómbralo a credentials.json');
    console.log('6. Colócalo en la raíz del proyecto');
    
    await pregunta('\nPresiona Enter cuando hayas completado estos pasos...');
  }
  
  // 2. Configurar API Key de Maps
  const apiKey = await pregunta('\n🗺️ Paso 2: Introduce tu Google Maps API Key: ');
  
  // 3. Crear archivo .env
  console.log('\n📝 Paso 3: Creando archivo de configuración...');
  
  const envContent = `# Credenciales de Google
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GOOGLE_MAPS_API_KEY=${apiKey}

# ID del spreadsheet (se creará automáticamente)
SPREADSHEET_ID=

# Configuración del sistema
TIMEZONE=Europe/Madrid
LOG_LEVEL=info
`;
  
  fs.writeFileSync('.env', envContent);
  console.log('✅ Archivo .env creado');
  
  // 4. Crear spreadsheet inicial
  console.log('\n📊 Paso 4: Creando Google Sheet...');
  
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: 'Registro de Kilómetros - Empresa'
        }
      }
    });
    
    const spreadsheetId = response.data.spreadsheetId;
    
    // Actualizar .env con el ID
    let envActualizado = envContent.replace('SPREADSHEET_ID=', `SPREADSHEET_ID=${spreadsheetId}`);
    fs.writeFileSync('.env', envActualizado);
    
    console.log(`✅ Spreadsheet creado: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    
    // Inicializar estructura
    await inicializarSheet(spreadsheetId);
    
  } catch (error) {
    console.error('❌ Error creando spreadsheet:', error.message);
    console.log('Asegúrate de que el archivo credentials.json es válido y tiene los permisos correctos.');
    process.exit(1);
  }
  
  // 5. Configurar trabajadores
  console.log('\n👥 Paso 5: Configuración de trabajadores');
  
  const numTrabajadores = await pregunta('¿Cuántos trabajadores quieres configurar? ');
  
  const trabajadores = [];
  for (let i = 0; i < parseInt(numTrabajadores); i++) {
    console.log(`\nTrabajador ${i + 1}:`);
    const email = await pregunta('  Email: ');
    const oficina = await pregunta('  Dirección de oficina: ');
    const precio = await pregunta('  Precio por km (por defecto 0.25): ') || '0.25';
    
    trabajadores.push({
      email,
      oficina,
      precio: parseFloat(precio)
    });
  }
  
  // Guardar configuración en el sheet
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const values = trabajadores.map(t => [
      t.email,
      t.oficina,
      t.precio,
      'primary',
      'SÍ',
      'Configurado automáticamente'
    ]);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Trabajadores!A2:F',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
    
    console.log('✅ Trabajadores configurados en el sheet');
    
  } catch (error) {
    console.error('❌ Error configurando trabajadores:', error.message);
  }
  
  console.log('\n✨ ¡Configuración completada!');
  console.log('\nPróximos pasos:');
  console.log('1. Comparte el spreadsheet con los trabajadores');
  console.log('2. Configura los triggers en Google Apps Script');
  console.log('3. Ejecuta "npm run deploy" para desplegar');
  console.log('\n📖 Revisa docs/INSTALLATION.md para más detalles\n');
  
  rl.close();
}

// Ejecutar setup
setup();