/**
 * Utilidades de validación
 */

function validarEmail(email) {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function validarDireccionBasica(direccion) {
  if (!direccion) return false;
  return direccion.trim().length >= 5;
}

function validarPrecioKm(precio) {
  if (precio === undefined || precio === null) return false;
  return !isNaN(precio) && precio > 0 && precio < 10;
}

function validarDistancia(km) {
  if (km === undefined || km === null) return false;
  return !isNaN(km) && km >= 0 && km < 2000;
}

function validarEventoId(eventoId) {
  if (!eventoId) return false;
  return eventoId.length > 5;
}

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

function validarFecha(fecha) {
  if (!fecha) return false;
  const date = new Date(fecha);
  return !isNaN(date.getTime());
}

function validarTextoSeguro(texto) {
  if (!texto) return true;
  const peligroso = /[<>{}[\]\\]/;
  return !peligroso.test(texto);
}

function validarConfiguracionTrabajador(trabajador) {
  const resultado = { valido: true, errores: [] };

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