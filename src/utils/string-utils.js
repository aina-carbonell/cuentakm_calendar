/**
 * Utilidades para manejo de strings
 */

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function capitalizarPalabras(texto) {
  if (!texto) return '';
  return texto.split(' ').map(palabra => capitalizar(palabra)).join(' ');
}

function truncar(texto, longitud = 50, sufijo = '...') {
  if (!texto) return '';
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud - sufijo.length) + sufijo;
}

function limpiarTexto(texto) {
  if (!texto) return '';
  return texto.replace(/\s+/g, ' ').trim();
}

function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extraerNumeros(texto) {
  if (!texto) return [];
  const matches = texto.match(/\d+(?:[.,]\d+)?/g);
  return matches ? matches.map(n => parseFloat(n.replace(',', '.'))) : [];
}

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

function generarSlug(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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