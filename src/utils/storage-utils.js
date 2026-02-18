/**
 * Utilidades de almacenamiento local
 * BUG CORREGIDO: el path del directorio era incorrecto (../../data desde src/utils/)
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIO_DATOS = path.join(__dirname, '../../data');

if (!fs.existsSync(DIRECTORIO_DATOS)) {
  fs.mkdirSync(DIRECTORIO_DATOS, { recursive: true });
}

function guardarJSON(nombre, datos) {
  try {
    const archivo = path.join(DIRECTORIO_DATOS, `${nombre}.json`);
    fs.writeFileSync(archivo, JSON.stringify(datos, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error guardando ${nombre}:`, error.message);
    return false;
  }
}

function cargarJSON(nombre, porDefecto = {}) {
  try {
    const archivo = path.join(DIRECTORIO_DATOS, `${nombre}.json`);
    if (!fs.existsSync(archivo)) return porDefecto;
    const contenido = fs.readFileSync(archivo, 'utf8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error(`Error cargando ${nombre}:`, error.message);
    return porDefecto;
  }
}

function guardarCache(clave, datos, ttl = 3600) {
  guardarJSON(`cache-${clave}`, { timestamp: Date.now(), ttl: ttl * 1000, datos });
}

function cargarCache(clave) {
  const cache = cargarJSON(`cache-${clave}`, null);
  if (!cache) return null;
  if (Date.now() - cache.timestamp > cache.ttl) {
    borrarCache(clave);
    return null;
  }
  return cache.datos;
}

function borrarCache(clave) {
  const archivo = path.join(DIRECTORIO_DATOS, `cache-${clave}.json`);
  if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
}

function guardarConfigUsuario(usuario, config) {
  guardarJSON(`config-${usuario.replace(/[@.]/g, '_')}`, config);
}

function cargarConfigUsuario(usuario) {
  return cargarJSON(`config-${usuario.replace(/[@.]/g, '_')}`, {});
}

function guardarUltimaEjecucion(estado) {
  guardarJSON('ultima-ejecucion', { timestamp: Date.now(), ...estado });
}

function cargarUltimaEjecucion() {
  return cargarJSON('ultima-ejecucion', {});
}

function listarArchivosDatos() {
  try {
    return fs.readdirSync(DIRECTORIO_DATOS)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    return [];
  }
}

function limpiarDatos(patron = null) {
  try {
    const archivos = fs.readdirSync(DIRECTORIO_DATOS);
    archivos.forEach(archivo => {
      if (archivo.endsWith('.json') && (!patron || archivo.includes(patron))) {
        fs.unlinkSync(path.join(DIRECTORIO_DATOS, archivo));
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  guardarJSON,
  cargarJSON,
  guardarCache,
  cargarCache,
  borrarCache,
  guardarConfigUsuario,
  cargarConfigUsuario,
  guardarUltimaEjecucion,
  cargarUltimaEjecucion,
  listarArchivosDatos,
  limpiarDatos
};