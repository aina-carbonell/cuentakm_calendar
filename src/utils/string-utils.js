/**
 * Utilidades para manejo de strings
 */

/**
 * Capitaliza la primera letra de un texto
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Capitaliza cada palabra de un texto
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto con cada palabra capitalizada
 */
function capitalizarPalabras(texto) {
  if (!texto) return '';
  return texto.split(' ')
    .map(palabra => capitalizar(palabra))
    .join(' ');
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @param {string} sufijo - Sufijo a añadir (ej: '...')
 * @returns {string} Texto truncado
 */
function truncar(texto, longitud = 50, sufijo = '...') {
  if (!texto) return '';
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud - sufijo.length) + sufijo;
}

/**
 * Limpia un texto de caracteres especiales
 * @param {string} texto - Texto a limpiar
 * @returns {string} Texto limpio
 */
function limpiarTexto(texto) {
  if (!texto) return '';
  
  return texto
    .replace(/[^\w\sáéíóúÁÉÍÓÚñÑüÜ,.;:-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza un texto para búsquedas (quita acentos, mayúsculas, etc.)
 * @param {string} texto - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizarTexto(texto) {
  if (!texto) return '';
  
  const mapaAcentos = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U'
  };
  
  return texto
    .split('')
    .map(c => mapaAcentos[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ');
}

/**
 * Extrae números de un texto
 * @param {string} texto - Texto del que extraer números
 * @returns {number[]} Array de números encontrados
 */
function extraerNumeros(texto) {
  if (!texto) return [];
  
  const matches = texto.match(/\d+(?:[.,]\d+)?/g);
  return matches ? matches.map(n => parseFloat(n.replace(',', '.'))) : [];
}

/**
 * Formatea una dirección para mostrarla
 * @param {Object} direccion - Objeto con componentes de dirección
 * @returns {string} Dirección formateada
 */
function formatearDireccion(direccion) {
  if (!direccion) return '';
  
  const partes = [];
  
  if (direccion.calle) partes.push(direccion.calle);
  if (direccion.numero) partes.push(direccion.numero);
  if (direccion.piso) partes.push(direccion.piso);
  if (direccion.ciudad) partes.push(direccion.ciudad);
  if (direccion.provincia) partes.push(direccion.provincia);
  if (direccion.codigoPostal) partes.push(direccion.codigoPostal);
  
  return partes.join(', ');
}

/**
 * Parsea una dirección en componentes
 * @param {string} direccion - Dirección completa
 * @returns {Object} Componentes de dirección
 */
function parsearDireccion(direccion) {
  if (!direccion) return {};
  
  const partes = direccion.split(',').map(p => p.trim());
  
  return {
    calle: partes[0] || '',
    numero: '',
    ciudad: partes[1] || '',
    provincia: partes[2] || '',
    codigoPostal: ''
  };
}

/**
 * Genera un slug a partir de un texto (para URLs/IDs)
 * @param {string} texto - Texto a convertir
 * @returns {string} Slug generado
 */
function generarSlug(texto) {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Compara dos textos ignorando acentos y mayúsculas
 * @param {string} a - Primer texto
 * @param {string} b - Segundo texto
 * @returns {boolean} True si son equivalentes
 */
function compararTextos(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  
  return normalizarTexto(a) === normalizarTexto(b);
}

module.exports = {
  capitalizar,
  capitalizarPalabras,
  truncar,
  limpiarTexto,
  normalizarTexto,
  extraerNumeros,
  formatearDireccion,
  parsearDireccion,
  generarSlug,
  compararTextos
};