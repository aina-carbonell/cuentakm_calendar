/**
 * Utilidades para manejo de números y monedas
 */

/**
 * Formatea un número como moneda
 */
function formatearMoneda(cantidad, moneda = '€', decimales = 2) {
  if (cantidad === undefined || cantidad === null) return '';
  return `${cantidad.toFixed(decimales)} ${moneda}`;
}

/**
 * Formatea un número con separadores de miles
 */
function formatearNumero(numero, decimales = 2) {
  if (numero === undefined || numero === null) return '';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(numero);
}

/**
 * Calcula el precio de un trayecto
 */
function calcularPrecioTrayecto(km, precioPorKm) {
  if (!km || !precioPorKm) return 0;
  return redondear(km * precioPorKm, 2);
}

/**
 * Redondea un número a los decimales especificados
 */
function redondear(numero, decimales = 2) {
  if (numero === undefined || numero === null) return 0;
  const factor = Math.pow(10, decimales);
  return Math.round(numero * factor) / factor;
}

/**
 * Suma un array de números
 */
function sumarArray(numeros) {
  return numeros.reduce((acc, num) => acc + (num || 0), 0);
}

/**
 * Calcula el promedio de un array de números
 */
function promediarArray(numeros) {
  if (!numeros || numeros.length === 0) return 0;
  return sumarArray(numeros) / numeros.length;
}

/**
 * Convierte string a número de forma segura
 */
function toNumber(str, defaultValue = 0) {
  if (str === undefined || str === null) return defaultValue;
  const numero = parseFloat(str.toString().replace(',', '.'));
  return isNaN(numero) ? defaultValue : numero;
}

/**
 * Formatea kilómetros con unidad
 */
function formatearKilometros(km) {
  if (km === undefined || km === null) return '';
  return `${formatearNumero(km, 2)} km`;
}

/**
 * Calcula porcentaje
 */
function calcularPorcentaje(valor, total) {
  if (!total) return 0;
  return redondear((valor / total) * 100, 1);
}

module.exports = {
  formatearMoneda,
  formatearNumero,
  formatearKilometros,
  calcularPrecioTrayecto,
  redondear,
  sumarArray,
  promediarArray,
  toNumber,
  calcularPorcentaje
};