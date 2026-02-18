/**
 * Servicio de Google Maps para cálculo de distancias
 * BUG CORREGIDO: calcularDistancia retornaba null en lugar de 0 para misma dirección
 */

const fetch = require('node-fetch');
const logger = require('./utils/logger');

/**
 * Calcula la distancia entre dos direcciones usando Google Maps Distance Matrix API
 */
async function calcularDistancia(origen, destino) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY no configurada');
    }

    // BUG CORREGIDO: misma dirección retornaba null, debería ser 0
    const origenNorm = origen.trim().toLowerCase();
    const destinoNorm = destino.trim().toLowerCase();
    if (origenNorm === destinoNorm) return 0;

    const origenEncoded = encodeURIComponent(origen.trim());
    const destinoEncoded = encodeURIComponent(destino.trim());

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origenEncoded}&destinations=${destinoEncoded}&key=${apiKey}&mode=driving&language=es`;

    logger.debug(`Calculando distancia: ${origen} → ${destino}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      logger.error('Error en respuesta de Maps API', { status: data.status, mensaje: data.error_message });
      return null;
    }

    const element = data.rows[0].elements[0];

    if (element.status !== 'OK') {
      logger.warn(`No se pudo calcular distancia entre "${origen}" y "${destino}": ${element.status}`);
      return null;
    }

    const distanciaKm = element.distance.value / 1000;
    const duracion = element.duration.text;

    logger.info(`Distancia calculada: ${distanciaKm.toFixed(2)} km (${duracion})`);

    return parseFloat(distanciaKm.toFixed(2));

  } catch (error) {
    logger.error('Error calculando distancia', error);
    return null;
  }
}

/**
 * Geocodifica una dirección para obtener coordenadas
 */
async function geocodificar(direccion) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY no configurada');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${apiKey}&language=es`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        direccionFormateada: data.results[0].formatted_address,
        lugarId: data.results[0].place_id
      };
    }

    return null;

  } catch (error) {
    logger.error('Error geocodificando', error);
    return null;
  }
}

/**
 * Valida si una dirección existe geográficamente
 */
async function validarDireccion(direccion) {
  const resultado = await geocodificar(direccion);
  return resultado !== null;
}

/**
 * Obtiene sugerencias de autocompletado para direcciones (España)
 */
async function autocompletarDireccion(input) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) return [];

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&language=es&components=country:es`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return data.predictions.map(p => ({
        descripcion: p.description,
        lugarId: p.place_id
      }));
    }

    return [];

  } catch (error) {
    logger.error('Error en autocompletado', error);
    return [];
  }
}

/**
 * Calcula distancias para múltiples destinos desde un origen (más eficiente)
 */
async function calcularDistanciasMultiples(origen, destinos) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY no configurada');
    if (!destinos || destinos.length === 0) return [];

    const origenEncoded = encodeURIComponent(origen.trim());
    const destinosEncoded = destinos.map(d => encodeURIComponent(d.trim())).join('|');

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origenEncoded}&destinations=${destinosEncoded}&key=${apiKey}&mode=driving&language=es`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') return destinos.map(() => null);

    return data.rows[0].elements.map((element, i) => {
      if (element.status !== 'OK') return null;
      return parseFloat((element.distance.value / 1000).toFixed(2));
    });

  } catch (error) {
    logger.error('Error calculando distancias múltiples', error);
    return destinos.map(() => null);
  }
}

module.exports = {
  calcularDistancia,
  calcularDistanciasMultiples,
  geocodificar,
  validarDireccion,
  autocompletarDireccion
};