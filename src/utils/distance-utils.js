/**
 * Utilidades específicas para cálculos de distancias y rutas
 */

/**
 * Convierte metros a kilómetros
 * @param {number} metros - Distancia en metros
 * @returns {number} Distancia en kilómetros
 */
function metrosAKilometros(metros) {
  if (metros === undefined || metros === null) return 0;
  return metros / 1000;
}

/**
 * Convierte kilómetros a metros
 * @param {number} km - Distancia en kilómetros
 * @returns {number} Distancia en metros
 */
function kilometrosAMetros(km) {
  if (km === undefined || km === null) return 0;
  return km * 1000;
}

/**
 * Calcula la distancia total de una ruta con múltiples puntos
 * @param {Array<number>} distancias - Array de distancias en km
 * @returns {number} Distancia total en km
 */
function calcularDistanciaTotal(distancias) {
  if (!Array.isArray(distancias)) return 0;
  return distancias.reduce((total, d) => total + (d || 0), 0);
}

/**
 * Calcula el coste total de una ruta
 * @param {number} kmTotales - Kilómetros totales
 * @param {number} precioPorKm - Precio por kilómetro
 * @param {Object} opciones - Opciones adicionales (peajes, dietas, etc.)
 * @returns {Object} Desglose de costes
 */
function calcularCosteRuta(kmTotales, precioPorKm, opciones = {}) {
  const {
    peajes = 0,
    dietas = 0,
    extra = 0,
    redondear = true
  } = opciones;

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

/**
 * Compara dos rutas para encontrar la más eficiente
 * @param {Array<Object>} rutas - Array de rutas con distancia y tiempo
 * @returns {Object} Ruta más eficiente
 */
function encontrarRutaEficiente(rutas) {
  if (!rutas || rutas.length === 0) return null;

  return rutas.reduce((mejor, ruta) => {
    // Ponderación: 70% distancia, 30% tiempo (se puede ajustar)
    const puntuacionMejor = (mejor.distancia * 0.7) + (mejor.duracion * 0.3);
    const puntuacionActual = (ruta.distancia * 0.7) + (ruta.duracion * 0.3);

    return puntuacionActual < puntuacionMejor ? ruta : mejor;
  });
}

/**
 * Formatea una distancia para mostrarla
 * @param {number} km - Distancia en kilómetros
 * @param {string} locale - Locale para el formato
 * @returns {string} Distancia formateada
 */
function formatearDistancia(km, locale = 'es-ES') {
  if (km === undefined || km === null) return '';

  if (km < 1) {
    // Mostrar en metros si es menos de 1 km
    const metros = Math.round(km * 1000);
    return `${metros} m`;
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(km) + ' km';
}

/**
 * Calcula la distancia en línea recta entre dos puntos (fórmula de Haversine)
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en kilómetros
 */
function distanciaHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;

  return Math.round(distancia * 100) / 100;
}

/**
 * Agrupa viajes por rangos de distancia
 * @param {Array<number>} distancias - Array de distancias
 * @returns {Object} Conteo por rangos
 */
function agruparPorRangos(distancias) {
  const rangos = {
    '0-10 km': 0,
    '10-50 km': 0,
    '50-100 km': 0,
    '100-200 km': 0,
    '200+ km': 0
  };

  distancias.forEach(dist => {
    if (dist <= 10) rangos['0-10 km']++;
    else if (dist <= 50) rangos['10-50 km']++;
    else if (dist <= 100) rangos['50-100 km']++;
    else if (dist <= 200) rangos['100-200 km']++;
    else rangos['200+ km']++;
  });

  return rangos;
}

/**
 * Calcula estadísticas de distancia
 * @param {Array<number>} distancias - Array de distancias
 * @returns {Object} Estadísticas calculadas
 */
function calcularEstadisticasDistancias(distancias) {
  if (!distancias || distancias.length === 0) {
    return {
      total: 0,
      media: 0,
      max: 0,
      min: 0,
      mediana: 0,
      desviacion: 0
    };
  }

  const total = distancias.reduce((a, b) => a + b, 0);
  const media = total / distancias.length;
  const max = Math.max(...distancias);
  const min = Math.min(...distancias);

  // Calcular mediana
  const sorted = [...distancias].sort((a, b) => a - b);
  const mitad = Math.floor(sorted.length / 2);
  const mediana = sorted.length % 2 === 0
    ? (sorted[mitad - 1] + sorted[mitad]) / 2
    : sorted[mitad];

  // Calcular desviación estándar
  const diferencias = distancias.map(d => Math.pow(d - media, 2));
  const varianza = diferencias.reduce((a, b) => a + b, 0) / distancias.length;
  const desviacion = Math.sqrt(varianza);

  return {
    total: Math.round(total * 100) / 100,
    media: Math.round(media * 100) / 100,
    max: Math.round(max * 100) / 100,
    min: Math.round(min * 100) / 100,
    mediana: Math.round(mediana * 100) / 100,
    desviacion: Math.round(desviacion * 100) / 100,
    numViajes: distancias.length
  };
}

/**
 * Calcula el ahorro de CO2 estimado al usar vehículo eficiente
 * @param {number} km - Kilómetros recorridos
 * @param {number} consumoPor100km - Consumo en L/100km
 * @param {string} tipoCombustible - 'gasolina', 'diesel', 'hibrido', 'electrico'
 * @returns {Object} Estimación de emisiones
 */
function calcularEmisionesCO2(km, consumoPor100km = 7, tipoCombustible = 'gasolina') {
  // Factores de emisión por litro (kg CO2/l)
  const factores = {
    gasolina: 2.31,
    diesel: 2.68,
    hibrido: 1.8,
    electrico: 0
  };

  const factor = factores[tipoCombustible] || factores.gasolina;
  const litros = (km / 100) * consumoPor100km;
  const emisiones = litros * factor;

  return {
    km,
    litrosConsumidos: Math.round(litros * 100) / 100,
    emisionesCO2: Math.round(emisiones * 100) / 100,
    tipoCombustible,
    factorEmision: factor,
    // Comparación con árboles (un árbol absorbe ~22kg CO2/año)
    arbolesEquivalentes: Math.round(emisiones / 22 * 10) / 10
  };
}

/**
 * Calcula el tiempo estimado de viaje
 * @param {number} km - Distancia en kilómetros
 * @param {number} velocidadMedia - Velocidad media en km/h
 * @param {Object} opciones - Opciones adicionales
 * @returns {Object} Tiempo estimado
 */
function calcularTiempoViaje(km, velocidadMedia = 50, opciones = {}) {
  const {
    pausasPorHora = 0, // minutos de pausa por hora
    tiempoInicial = 0, // minutos adicionales al inicio
    tiempoFinal = 0 // minutos adicionales al final
  } = opciones;

  // Tiempo base en horas
  const tiempoBaseHoras = km / velocidadMedia;
  const tiempoBaseMinutos = tiempoBaseHoras * 60;

  // Calcular pausas
  const numHoras = Math.floor(tiempoBaseHoras);
  const pausasTotales = numHoras * pausasPorHora;

  // Tiempo total en minutos
  const tiempoTotalMinutos = tiempoBaseMinutos + pausasTotales + tiempoInicial + tiempoFinal;

  // Desglose
  const horas = Math.floor(tiempoTotalMinutos / 60);
  const minutos = Math.round(tiempoTotalMinutos % 60);

  return {
    minutosTotales: Math.round(tiempoTotalMinutos),
    horas,
    minutos,
    tiempoFormateado: `${horas}h ${minutos}m`,
    desglose: {
      conduccion: Math.round(tiempoBaseMinutos),
      pausas: Math.round(pausasTotales),
      tiemposFijos: tiempoInicial + tiempoFinal
    }
  };
}

/**
 * Optimiza el orden de visitas para minimizar distancia (TSP simplificado)
 * @param {Array<Object>} puntos - Array de puntos con {lat, lng, id}
 * @returns {Array} Orden optimizado de visitas
 */
function optimizarRutaVisitas(puntos) {
  if (!puntos || puntos.length <= 2) return puntos;

  // Algoritmo del vecino más cercano (simplificado)
  const visitados = new Set();
  const ruta = [];
  
  // Empezar por el primer punto
  let actual = puntos[0];
  ruta.push(actual);
  visitados.add(actual.id);

  while (visitados.size < puntos.length) {
    let distanciaMin = Infinity;
    let siguiente = null;

    // Encontrar el punto no visitado más cercano
    puntos.forEach(punto => {
      if (!visitados.has(punto.id)) {
        const dist = distanciaHaversine(
          actual.lat, actual.lng,
          punto.lat, punto.lng
        );

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
  calcularEmisionesCO2,
  calcularTiempoViaje,
  optimizarRutaVisitas
};