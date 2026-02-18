/**
 * Utilidades para manejo de fechas
 */

/**
 * Formatea una fecha según el locale especificado
 * @param {Date} fecha - Fecha a formatear
 * @param {string} locale - Locale (ej: 'es-ES', 'en-US')
 * @param {Object} opciones - Opciones de formato
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha, locale = 'es-ES', opciones = {}) {
  if (!fecha) return '';
  
  const opcionesPorDefecto = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...opciones
  };
  
  try {
    return new Intl.DateTimeFormat(locale, opcionesPorDefecto).format(fecha);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return fecha.toLocaleDateString();
  }
}

/**
 * Formatea una hora
 * @param {Date} fecha - Fecha con hora a formatear
 * @param {string} locale - Locale
 * @returns {string} Hora formateada
 */
function formatearHora(fecha, locale = 'es-ES') {
  if (!fecha) return '';
  
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  } catch (error) {
    console.error('Error formateando hora:', error);
    return fecha.toLocaleTimeString().substring(0, 5);
  }
}

/**
 * Formatea fecha y hora completas
 * @param {Date} fecha - Fecha a formatear
 * @param {string} locale - Locale
 * @returns {string} Fecha y hora formateada
 */
function formatearFechaHora(fecha, locale = 'es-ES') {
  if (!fecha) return '';
  
  return `${formatearFecha(fecha, locale)} ${formatearHora(fecha, locale)}`;
}

/**
 * Calcula el número de días laborables entre dos fechas
 * @param {Date} inicio - Fecha inicial
 * @param {Date} fin - Fecha final
 * @returns {number} Número de días laborables
 */
function calcularDiasLaborables(inicio, fin) {
  let contador = 0;
  let fechaActual = new Date(inicio);
  
  while (fechaActual <= fin) {
    const diaSemana = fechaActual.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      contador++;
    }
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
  
  return contador;
}

/**
 * Obtiene el primer día del mes
 * @param {Date} fecha - Fecha de referencia
 * @returns {Date} Primer día del mes
 */
function primerDiaMes(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

/**
 * Obtiene el último día del mes
 * @param {Date} fecha - Fecha de referencia
 * @returns {Date} Último día del mes
 */
function ultimoDiaMes(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
}

/**
 * Compara si dos fechas son el mismo día
 * @param {Date} fecha1 - Primera fecha
 * @param {Date} fecha2 - Segunda fecha
 * @returns {boolean} True si son el mismo día
 */
function esMismoDia(fecha1, fecha2) {
  return fecha1.getDate() === fecha2.getDate() &&
         fecha1.getMonth() === fecha2.getMonth() &&
         fecha1.getFullYear() === fecha2.getFullYear();
}

/**
 * Parsea una fecha en formato español (dd/mm/yyyy)
 * @param {string} fechaStr - Fecha en formato dd/mm/yyyy
 * @returns {Date|null} Fecha parseada o null
 */
function parsearFechaEspañol(fechaStr) {
  if (!fechaStr) return null;
  
  const partes = fechaStr.split('/');
  if (partes.length !== 3) return null;
  
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const año = parseInt(partes[2], 10);
  
  const fecha = new Date(año, mes, dia);
  
  // Validar que la fecha es válida
  if (fecha.getDate() !== dia || fecha.getMonth() !== mes || fecha.getFullYear() !== año) {
    return null;
  }
  
  return fecha;
}

/**
 * Obtiene el nombre del mes en español
 * @param {number} mes - Número del mes (0-11)
 * @returns {string} Nombre del mes
 */
function nombreMes(mes) {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return meses[mes] || '';
}

/**
 * Obtiene el nombre del día de la semana
 * @param {Date} fecha - Fecha
 * @returns {string} Nombre del día
 */
function nombreDiaSemana(fecha) {
  const dias = [
    'domingo', 'lunes', 'martes', 'miércoles', 
    'jueves', 'viernes', 'sábado'
  ];
  return dias[fecha.getDay()];
}

module.exports = {
  formatearFecha,
  formatearHora,
  formatearFechaHora,
  calcularDiasLaborables,
  primerDiaMes,
  ultimoDiaMes,
  esMismoDia,
  parsearFechaEspañol,
  nombreMes,
  nombreDiaSemana
};