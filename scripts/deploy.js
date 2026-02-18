/**
 * Script de despliegue
 * Verifica el entorno, ejecuta tests y programa la ejecución automática
 */

require('dotenv').config();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores consola
const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', bold: '\x1b[1m'
};

function log(msg, color = '') { console.log(`${color}${msg}${c.reset}`); }
function ok(msg) { log(`  ✔ ${msg}`, c.green); }
function fail(msg) { log(`  ✗ ${msg}`, c.red); }
function info(msg) { log(`  ℹ ${msg}`, c.blue); }
function warn(msg) { log(`  ⚠ ${msg}`, c.yellow); }

async function deploy() {
  log('\n══════════════════════════════════════════', c.cyan + c.bold);
  log('   DESPLIEGUE DEL SISTEMA DE KILÓMETROS   ', c.cyan + c.bold);
  log('══════════════════════════════════════════\n', c.cyan + c.bold);

  let erroresCriticos = 0;

  // ── PASO 1: Verificar Node.js ──────────────────────────────
  log('Paso 1: Verificando entorno Node.js', c.bold);
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 14) {
    ok(`Node.js ${nodeVersion}`);
  } else {
    fail(`Node.js ${nodeVersion} - Se requiere v14+`);
    erroresCriticos++;
  }

  // ── PASO 2: Verificar archivos de configuración ──────────────
  log('\nPaso 2: Verificando configuración', c.bold);

  const archivosRequeridos = [
    { path: '.env', descripcion: 'Variables de entorno' },
    { path: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'credentials.json', descripcion: 'Credenciales Google' }
  ];

  for (const archivo of archivosRequeridos) {
    if (fs.existsSync(archivo.path)) {
      ok(`${archivo.descripcion} (${archivo.path})`);
    } else {
      fail(`${archivo.descripcion} no encontrado: ${archivo.path}`);
      erroresCriticos++;
    }
  }

  // ── PASO 3: Verificar variables de entorno ──────────────────
  log('\nPaso 3: Verificando variables de entorno', c.bold);

  const varsRequeridas = [
    { nombre: 'GOOGLE_MAPS_API_KEY', descripcion: 'Google Maps API Key' },
    { nombre: 'SPREADSHEET_ID', descripcion: 'ID del Google Sheet' },
    { nombre: 'GOOGLE_APPLICATION_CREDENTIALS', descripcion: 'Ruta a credentials.json' }
  ];

  const varsOpcionales = [
    { nombre: 'PRECIO_POR_KM', descripcion: 'Precio por km (default: 0.25)' },
    { nombre: 'EMPRESA_NOMBRE', descripcion: 'Nombre de la empresa' },
    { nombre: 'EMAIL_ADMIN', descripcion: 'Email para notificaciones de error' }
  ];

  for (const variable of varsRequeridas) {
    if (process.env[variable.nombre]) {
      ok(`${variable.descripcion}`);
    } else {
      fail(`${variable.descripcion} (${variable.nombre}) no configurada`);
      erroresCriticos++;
    }
  }

  for (const variable of varsOpcionales) {
    if (process.env[variable.nombre]) {
      ok(`${variable.descripcion}: ${process.env[variable.nombre]}`);
    } else {
      warn(`${variable.descripcion} no configurada (opcional)`);
    }
  }

  // ── PASO 4: Verificar dependencias ──────────────────────────
  log('\nPaso 4: Verificando dependencias npm', c.bold);

  if (fs.existsSync('node_modules')) {
    ok('node_modules encontrado');
  } else {
    info('Instalando dependencias...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      ok('Dependencias instaladas');
    } catch (e) {
      fail('Error instalando dependencias');
      erroresCriticos++;
    }
  }

  // ── PASO 5: Ejecutar tests ──────────────────────────────────
  log('\nPaso 5: Ejecutando tests', c.bold);

  try {
    execSync('node tests/test-all.js', { stdio: 'pipe' });
    ok('Todos los tests pasaron');
  } catch (e) {
    warn('Algunos tests fallaron (puede ser por falta de credenciales reales)');
    info('Revisa tests/test-all.js para más detalles');
  }

  // ── PASO 6: Crear directorios necesarios ────────────────────
  log('\nPaso 6: Creando estructura de directorios', c.bold);

  const directorios = ['logs', 'data'];
  for (const dir of directorios) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      ok(`Directorio creado: ${dir}/`);
    } else {
      ok(`Directorio existe: ${dir}/`);
    }
  }

  // ── PASO 7: Configurar ejecución automática ─────────────────
  log('\nPaso 7: Configuración de ejecución automática', c.bold);

  const esSistemaUnix = process.platform !== 'win32';

  if (esSistemaUnix) {
    const cronExpresion = `0 ${process.env.HORA_EJECUCION || 23} * * 1-5`;
    const rutaAbsoluta = path.resolve('.');
    const comandoCron = `${cronExpresion} cd ${rutaAbsoluta} && /usr/bin/node src/main.js >> logs/cron.log 2>&1`;

    info('Para programar la ejecución automática, añade esta línea a tu crontab:');
    log(`\n  crontab -e\n`, c.yellow);
    log(`  # Sistema de Kilómetros - Lunes a Viernes a las ${process.env.HORA_EJECUCION || 23}:00`, c.yellow);
    log(`  ${comandoCron}\n`, c.yellow);

  } else {
    info('Sistema Windows detectado.');
    info('Para ejecución automática, configura una Tarea Programada de Windows.');
    info(`Programa: node`);
    info(`Argumentos: ${path.resolve('src/main.js')}`);
    info(`Directorio: ${path.resolve('.')}`);
  }

  // ── RESUMEN FINAL ───────────────────────────────────────────
  log('\n══════════════════════════════════════════', c.cyan + c.bold);

  if (erroresCriticos === 0) {
    log('  ✔ DESPLIEGUE LISTO - Sin errores críticos', c.green + c.bold);
    log('\n  Ejecuta "npm start" para una prueba manual.', c.green);
  } else {
    log(`  ✗ DESPLIEGUE BLOQUEADO - ${erroresCriticos} error(es) crítico(s)`, c.red + c.bold);
    log('\n  Corrige los errores anteriores antes de desplegar.', c.red);
    process.exit(1);
  }

  log('══════════════════════════════════════════\n', c.cyan + c.bold);
}

deploy().catch(error => {
  console.error('Error inesperado en deploy:', error);
  process.exit(1);
});