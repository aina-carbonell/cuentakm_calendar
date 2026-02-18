/**
 * Utilidades de almacenamiento local
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIO_DATOS = path.join(__dirname, '../../data');

// Crear directorio de datos si no existe
if (!fs.existsSync(DIRECTORIO_DATOS)) {
  fs.mkdirSync(DIRECTORIO_DATOS, { recursive: true });
}

/**
 * Guarda datos en un archivo JSON
 * @param {string} nombre - Nombre del archivo (sin extensión)
 * @param {any} datos - Datos a guardar
 * @returns {boolean} True si se guardó correctamente
 */
function guardarJSON(nombre, datos) {
  try {
    const archivo = path.join(DIRECTORIO_DATOS, `${nombre}.json`);
    fs.writeFileSync(archivo, JSON.stringify(datos, null, 2));
    return true;
  } catch (error) {
    console.error(`Error guardando ${nombre}:`, error);
    return false;
  }
}

/**
 * Carga datos de un archivo JSON
 * @param {string} nombre - Nombre del archivo (sin extensión)
 * @param {any} porDefecto - Valor por defecto si no existe
 * @returns {any} Datos cargados o valor por defecto
 */
function cargarJSON(nombre, porDefecto = {}) {
  try {
    const archivo = path.join(DIRECTORIO_DATOS, `${nombre}.json`);
    if (!fs.existsSync(archivo)) {
      return porDefecto;
    }
    const contenido = fs.readFileSync(archivo, 'utf8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error(`Error cargando ${nombre}:`, error);
    return porDefecto;
  }
}

/**
 * Guarda datos de caché
 * @param {string} clave - Clave del caché
 * @param {any} datos - Datos a guardar
 * @param {number} ttl - Tiempo de vida en segundos
 */
function guardarCache(clave, datos, ttl = 3600) {
  const cache = {
    timestamp: Date.now(),
    ttl: ttl * 1000,
    datos
  };
  
  guardarJSON(`cache-${clave}`, cache);
}

/**
 * Carga datos de caché si no han expirado
 * @param {string} clave - Clave del caché
 * @returns {any|null} Datos o null si expirado/no existe
 */
function cargarCache(clave) {
  const cache = cargarJSON(`cache-${clave}`, null);
  
  if (!cache) return null;
  
  const expirado = Date.now() - cache.timestamp > cache.ttl;
  if (expirado) {
    borrarCache(clave);
    return null;
  }
  
  return cache.datos;
}

/**
 * Borra un caché
 * @param {string} clave - Clave del caché
 */
function borrarCache(clave) {
  const archivo = path.join(DIRECTORIO_DATOS, `cache-${clave}.json`);
  if (fs.existsSync(archivo)) {
    fs.unlinkSync(archivo);
  }
}

/**
 * Guarda configuración de usuario
 * @param {string} usuario - Email del usuario
 * @param {Object} config - Configuración
 */
function guardarConfigUsuario(usuario, config) {
  const archivo = `config-${usuario.replace(/[@.]/g, '_')}`;
  guardarJSON(archivo, config);
}

/**
 * Carga configuración de usuario
 * @param {string} usuario - Email del usuario
 * @returns {Object} Configuración
 */
function cargarConfigUsuario(usuario) {
  const archivo = `config-${usuario.replace(/[@.]/g, '_')}`;
  return cargarJSON(archivo, {});
}

/**
 * Guarda el estado de la última ejecución
 * @param {Object} estado - Estado a guardar
 */
function guardarUltimaEjecucion(estado) {
  guardarJSON('ultima-ejecucion', {
    timestamp: Date.now(),
    ...estado
  });
}

/**
 * Carga el estado de la última ejecución
 * @returns {Object} Último estado
 */
function cargarUltimaEjecucion() {
  return cargarJSON('ultima-ejecucion', {});
}

/**
 * Lista todos los archivos de datos
 * @returns {string[]} Lista de archivos
 */
function listarArchivosDatos() {
  try {
    return fs.readdirSync(DIRECTORIO_DATOS)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    console.error('Error listando archivos:', error);
    return [];
  }
}

/**
 * Borra todos los archivos de datos
 * @param {string} patron - Patrón de archivos a borrar (opcional)
 */
function limpiarDatos(patron = null) {
  try {
    const archivos = fs.readdirSync(DIRECTORIO_DATOS);
    
    archivos.forEach(archivo => {
      if (archivo.endsWith('.json')) {
        if (!patron || archivo.includes(patron)) {
          fs.unlinkSync(path.join(DIRECTORIO_DATOS, archivo));
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error limpiando datos:', error);
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