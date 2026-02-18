/**
 * Utilidades de validación
 */

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function validarEmail(email) {
  if (!email) return false;
  
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

/**
 * Valida una dirección (no vacía y longitud mínima)
 * @param {string} direccion - Dirección a validar
 * @returns {boolean} True si es válida
 */
function validarDireccionBasica(direccion) {
  if (!direccion) return false;
  return direccion.trim().length >= 5;
}

/**
 * Valida un precio por kilómetro
 * @param {number} precio - Precio a validar
 * @returns {boolean} True si es válido
 */
function validarPrecioKm(precio) {
  if (precio === undefined || precio === null) return false;
  return !isNaN(precio) && precio > 0 && precio < 10;
}

/**
 * Valida una distancia en kilómetros
 * @param {number} km - Distancia a validar
 * @returns {boolean} True si es válida
 */
function validarDistancia(km) {
  if (km === undefined || km === null) return false;
  return !isNaN(km) && km >= 0 && km < 2000; // Máximo 2000km
}

/**
 * Valida un ID de evento de calendario
 * @param {string} eventoId - ID del evento
 * @returns {boolean} True si es válido
 */
function validarEventoId(eventoId) {
  if (!eventoId) return false;
  return eventoId.length > 5;
}

/**
 * Valida que un objeto tenga todos los campos requeridos
 * @param {Object} obj - Objeto a validar
 * @param {string[]} camposRequeridos - Lista de campos requeridos
 * @returns {Object} Resultado de validación
 */
function validarCamposRequeridos(obj, camposRequeridos) {
  const faltantes = [];
  const invalidos = [];
  
  for (const campo of camposRequeridos) {
    if (obj[campo] === undefined || obj[campo] === null) {
      faltantes.push(campo);
    } else if (typeof obj[campo] === 'string' && obj[campo].trim() === '') {
      invalidos.push(campo);
    }
  }
  
  return {
    valido: faltantes.length === 0 && invalidos.length === 0,
    faltantes,
    invalidos
  };
}

/**
 * Valida formato de fecha
 * @param {string} fecha - Fecha en formato ISO o dd/mm/yyyy
 * @returns {boolean} True si es válida
 */
function validarFecha(fecha) {
  if (!fecha) return false;
  
  // Intentar parsear
  const date = new Date(fecha);
  return !isNaN(date.getTime());
}

/**
 * Valida que un texto no contenga caracteres peligrosos
 * @param {string} texto - Texto a validar
 * @returns {boolean} True si es seguro
 */
function validarTextoSeguro(texto) {
  if (!texto) return true;
  
  // Prevenir inyección de scripts
  const peligroso = /[<>{}[\]\\]/;
  return !peligroso.test(texto);
}

/**
 * Valida configuración de trabajador
 * @param {Object} trabajador - Objeto trabajador
 * @returns {Object} Resultado de validación
 */
function validarConfiguracionTrabajador(trabajador) {
  const resultado = {
    valido: true,
    errores: []
  };
  
  if (!validarEmail(trabajador.email)) {
    resultado.valido = false;
    resultado.errores.push('Email inválido');
  }
  
  if (!validarDireccionBasica(trabajador.oficina)) {
    resultado.valido = false;
    resultado.errores.push('Dirección de oficina inválida');
  }
  
  if (!validarPrecioKm(trabajador.precioKm)) {
    resultado.valido = false;
    resultado.errores.push('Precio por km inválido');
  }
  
  return resultado;
}

module.exports = {
  validarEmail,
  validarDireccionBasica,
  validarPrecioKm,
  validarDistancia,
  validarEventoId,
  validarCamposRequeridos,
  validarFecha,
  validarTextoSeguro,
  validarConfiguracionTrabajador
};