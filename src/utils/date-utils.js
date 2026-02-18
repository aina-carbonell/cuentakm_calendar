/**
 * Utilidades para manejo de fechas
 */

/**
 * Formatea una fecha según el locale especificado
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
    return fecha.toLocaleDateString();
  }
}

/**
 * Formatea una hora
 */
function formatearHora(fecha, locale = 'es-ES') {
  if (!fecha) return '';
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(fecha);
  } catch (error) {
    return fecha.toLocaleTimeString().substring(0, 5);
  }
}

/**
 * Formatea fecha y hora completas
 */
function formatearFechaHora(fecha, locale = 'es-ES') {
  if (!fecha) return '';
  return `${formatearFecha(fecha, locale)} ${formatearHora(fecha, locale)}`;
}

/**
 * Calcula el número de días laborables entre dos fechas (inclusive)
 */
function calcularDiasLaborables(inicio, fin) {
  let contador = 0;
  let fechaActual = new Date(inicio);
  fechaActual.setHours(0, 0, 0, 0);

  const fechaFin = new Date(fin);
  fechaFin.setHours(23, 59, 59, 999);

  while (fechaActual <= fechaFin) {
    const diaSemana = fechaActual.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      contador++;
    }
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return contador;
}

/**
 * Obtiene el primer día del mes
 */
function primerDiaMes(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

/**
 * Obtiene el último día del mes
 */
function ultimoDiaMes(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
}

/**
 * Compara si dos fechas son el mismo día
 */
function esMismoDia(fecha1, fecha2) {
  return fecha1.getDate() === fecha2.getDate() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getFullYear() === fecha2.getFullYear();
}

/**
 * Parsea una fecha en formato español (dd/mm/yyyy)
 */
function parsearFechaEspanol(fechaStr) {
  if (!fechaStr) return null;

  const partes = fechaStr.split('/');
  if (partes.length !== 3) return null;

  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const anio = parseInt(partes[2], 10);

  const fecha = new Date(anio, mes, dia);

  if (fecha.getDate() !== dia || fecha.getMonth() !== mes || fecha.getFullYear() !== anio) {
    return null;
  }

  return fecha;
}

/**
 * Obtiene el nombre del mes en español
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
 */
function nombreDiaSemana(fecha) {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return dias[fecha.getDay()];
}

/**
 * Verifica si hoy es el último día del mes
 */
function esFinDeMes(fecha = new Date()) {
  const manana = new Date(fecha);
  manana.setDate(fecha.getDate() + 1);
  return manana.getMonth() !== fecha.getMonth();
}

module.exports = {
  formatearFecha,
  formatearHora,
  formatearFechaHora,
  calcularDiasLaborables,
  primerDiaMes,
  ultimoDiaMes,
  esMismoDia,
  parsearFechaEspanol,
  nombreMes,
  nombreDiaSemana,
  esFinDeMes
};