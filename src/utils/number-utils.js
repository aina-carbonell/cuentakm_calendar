/**
 * Utilidades para manejo de números y monedas
 */

/**
 * Formatea un número como moneda
 * @param {number} cantidad - Cantidad a formatear
 * @param {string} moneda - Símbolo de moneda (€, $, etc.)
 * @param {number} decimales - Número de decimales
 * @returns {string} Número formateado como moneda
 */
function formatearMoneda(cantidad, moneda = '€', decimales = 2) {
  if (cantidad === undefined || cantidad === null) return '';
  
  const formateado = cantidad.toFixed(decimales);
  return `${formateado} ${moneda}`;
}

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Número de decimales
 * @returns {string} Número formateado
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
 * @param {number} km - Kilómetros recorridos
 * @param {number} precioPorKm - Precio por kilómetro
 * @returns {number} Precio del trayecto
 */
function calcularPrecioTrayecto(km, precioPorKm) {
  if (!km || !precioPorKm) return 0;
  return redondear(km * precioPorKm, 2);
}

/**
 * Redondea un número a los decimales especificados
 * @param {number} numero - Número a redondear
 * @param {number} decimales - Número de decimales
 * @returns {number} Número redondeado
 */
function redondear(numero, decimales = 2) {
  if (numero === undefined || numero === null) return 0;
  const factor = Math.pow(10, decimales);
  return Math.round(numero * factor) / factor;
}

/**
 * Suma un array de números
 * @param {number[]} numeros - Array de números
 * @returns {number} Suma total
 */
function sumarArray(numeros) {
  return numeros.reduce((acc, num) => acc + (num || 0), 0);
}

/**
 * Calcula el promedio de un array de números
 * @param {number[]} numeros - Array de números
 * @returns {number} Promedio
 */
function promediarArray(numeros) {
  if (numeros.length === 0) return 0;
  return sumarArray(numeros) / numeros.length;
}

/**
 * Convierte string a número de forma segura
 * @param {string} str - String a convertir
 * @param {number} defaultValue - Valor por defecto
 * @returns {number} Número convertido
 */
function toNumber(str, defaultValue = 0) {
  if (str === undefined || str === null) return defaultValue;
  
  const numero = parseFloat(str.toString().replace(',', '.'));
  return isNaN(numero) ? defaultValue : numero;
}

/**
 * Formatea kilómetros con unidad
 * @param {number} km - Kilómetros
 * @returns {string} Kilómetros formateados
 */
function formatearKilometros(km) {
  if (km === undefined || km === null) return '';
  return `${formatearNumero(km, 2)} km`;
}

/**
 * Calcula porcentaje
 * @param {number} valor - Valor actual
 * @param {number} total - Total
 * @returns {number} Porcentaje
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