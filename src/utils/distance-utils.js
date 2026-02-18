/**
 * Utilidades específicas para cálculos de distancias y rutas
 */

function metrosAKilometros(metros) {
  if (metros === undefined || metros === null) return 0;
  return metros / 1000;
}

function kilometrosAMetros(km) {
  if (km === undefined || km === null) return 0;
  return km * 1000;
}

function calcularDistanciaTotal(distancias) {
  if (!Array.isArray(distancias)) return 0;
  return distancias.reduce((total, d) => total + (d || 0), 0);
}

function calcularCosteRuta(kmTotales, precioPorKm, opciones = {}) {
  const { peajes = 0, dietas = 0, extra = 0, redondear = true } = opciones;
  const costeBase = kmTotales * precioPorKm;
  const costeTotal = costeBase + peajes + dietas + extra;

  return {
    kmTotales: redondear ? Math.round(kmTotales * 100) / 100 : kmTotales,
    precioPorKm,
    costeBase: redondear ? Math.round(costeBase * 100) / 100 : costeBase,
    peajes,
    dietas,
    extra,
    costeTotal: redondear ? Math.round(costeTotal * 100) / 100 : costeTotal
  };
}

function encontrarRutaEficiente(rutas) {
  if (!rutas || rutas.length === 0) return null;
  return rutas.reduce((mejor, ruta) => {
    const puntuacionMejor = (mejor.distancia * 0.7) + (mejor.duracion * 0.3);
    const puntuacionActual = (ruta.distancia * 0.7) + (ruta.duracion * 0.3);
    return puntuacionActual < puntuacionMejor ? ruta : mejor;
  });
}

function formatearDistancia(km, locale = 'es-ES') {
  if (km === undefined || km === null) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(km) + ' km';
}

/**
 * Calcula la distancia en línea recta entre dos puntos (fórmula de Haversine)
 */
function distanciaHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function agruparPorRangos(distancias) {
  const rangos = { '0-10 km': 0, '10-50 km': 0, '50-100 km': 0, '100-200 km': 0, '200+ km': 0 };
  distancias.forEach(dist => {
    if (dist <= 10) rangos['0-10 km']++;
    else if (dist <= 50) rangos['10-50 km']++;
    else if (dist <= 100) rangos['50-100 km']++;
    else if (dist <= 200) rangos['100-200 km']++;
    else rangos['200+ km']++;
  });
  return rangos;
}

function calcularEstadisticasDistancias(distancias) {
  if (!distancias || distancias.length === 0) {
    return { total: 0, media: 0, max: 0, min: 0, mediana: 0, desviacion: 0, numViajes: 0 };
  }
  const total = distancias.reduce((a, b) => a + b, 0);
  const media = total / distancias.length;
  const max = Math.max(...distancias);
  const min = Math.min(...distancias);
  const sorted = [...distancias].sort((a, b) => a - b);
  const mitad = Math.floor(sorted.length / 2);
  const mediana = sorted.length % 2 === 0
    ? (sorted[mitad - 1] + sorted[mitad]) / 2
    : sorted[mitad];
  const varianza = distancias.map(d => Math.pow(d - media, 2)).reduce((a, b) => a + b, 0) / distancias.length;

  return {
    total: Math.round(total * 100) / 100,
    media: Math.round(media * 100) / 100,
    max: Math.round(max * 100) / 100,
    min: Math.round(min * 100) / 100,
    mediana: Math.round(mediana * 100) / 100,
    desviacion: Math.round(Math.sqrt(varianza) * 100) / 100,
    numViajes: distancias.length
  };
}

/**
 * Optimiza el orden de visitas para minimizar distancia (vecino más cercano)
 */
function optimizarRutaVisitas(puntos) {
  if (!puntos || puntos.length <= 2) return puntos;

  const visitados = new Set();
  const ruta = [];
  let actual = puntos[0];
  ruta.push(actual);
  visitados.add(actual.id);

  while (visitados.size < puntos.length) {
    let distanciaMin = Infinity;
    let siguiente = null;

    puntos.forEach(punto => {
      if (!visitados.has(punto.id)) {
        const dist = distanciaHaversine(actual.lat, actual.lng, punto.lat, punto.lng);
        if (dist < distanciaMin) {
          distanciaMin = dist;
          siguiente = punto;
        }
      }
    });

    if (siguiente) {
      ruta.push(siguiente);
      visitados.add(siguiente.id);
      actual = siguiente;
    }
  }

  return ruta;
}

module.exports = {
  metrosAKilometros,
  kilometrosAMetros,
  calcularDistanciaTotal,
  calcularCosteRuta,
  encontrarRutaEficiente,
  formatearDistancia,
  distanciaHaversine,
  agruparPorRangos,
  calcularEstadisticasDistancias,
  optimizarRutaVisitas
};