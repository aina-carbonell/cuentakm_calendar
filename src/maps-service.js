/**
 * Servicio de Google Maps para cálculo de distancias
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
    
    // Limpiar y codificar direcciones
    const origenEncoded = encodeURIComponent(origen.trim());
    const destinoEncoded = encodeURIComponent(destino.trim());
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origenEncoded}&destinations=${destinoEncoded}&key=${apiKey}&mode=driving&language=es`;
    
    logger.debug(`Calculando distancia: ${origen} → ${destino}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      logger.error('Error en respuesta de Maps API:', data);
      return null;
    }
    
    const element = data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      logger.warn(`No se pudo calcular distancia entre "${origen}" y "${destino}": ${element.status}`);
      return null;
    }
    
    // Convertir metros a kilómetros
    const distanciaKm = element.distance.value / 1000;
    const duracion = element.duration.text;
    
    logger.info(`Distancia calculada: ${distanciaKm.toFixed(2)} km (${duracion})`);
    
    return parseFloat(distanciaKm.toFixed(2));
    
  } catch (error) {
    logger.error('Error calculando distancia:', error);
    return null;
  }
}

/**
 * Geocodifica una dirección para obtener coordenadas
 */
async function geocodificar(direccion) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${apiKey}&language=es`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const direccionFormateada = data.results[0].formatted_address;
      
      return {
        lat: location.lat,
        lng: location.lng,
        direccionFormateada: direccionFormateada,
        lugarId: data.results[0].place_id
      };
    }
    
    return null;
    
  } catch (error) {
    logger.error('Error geocodificando:', error);
    return null;
  }
}

/**
 * Valida si una dirección es válida
 */
async function validarDireccion(direccion) {
  const resultado = await geocodificar(direccion);
  return resultado !== null;
}

/**
 * Obtiene sugerencias de autocompletado para direcciones
 */
async function autocompletarDireccion(input) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
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
    logger.error('Error en autocompletado:', error);
    return [];
  }
}

module.exports = {
  calcularDistancia,
  geocodificar,
  validarDireccion,
  autocompletarDireccion
};