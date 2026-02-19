/**
 * CONFIGURACIÓ DE COLUMNES
 */
const FILA_INICI = 9;         

function calcularKilometratgeDiari() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // AGAFA LA PESTANYA ACTIVA (La que tens oberta en el moment d'executar o la primera)
  const full = ss.getActiveSheet();
  
  // Opcional: Si prefereixes que SEMPRE agafi la primera pestanya de l'esquerra:
  // const full = ss.getSheets()[0]; 

  // Lectura de l'oficina a la cel·la K4
  const adrecaOficina = full.getRange("K4").getValue(); 

  if (!adrecaOficina) {
    SpreadsheetApp.getUi().alert("Avís: No s'ha trobat l'adreça de l'oficina a la cel·la K4 de la pestanya actual.");
    return;
  }

  const avui = new Date();
  avui.setHours(0, 0, 0, 0);
  const dema = new Date(avui);
  dema.setDate(avui.getDate() + 1);

  // 1. Obtenir el calendari del compte actiu
  const calendari = CalendarApp.getDefaultCalendar();
  const events = calendari.getEvents(avui, dema);
  
  const rutes = events
    .filter(e => e.getLocation() !== "")
    .sort((a, b) => a.getStartTime() - b.getStartTime());

  if (rutes.length === 0) return;

  // 2. Punts del dia
  let punts = [{lloc: adrecaOficina, titol: "Sortida Oficina"}];
  rutes.forEach(e => {
    punts.push({lloc: e.getLocation(), titol: e.getTitle()});
  });
  punts.push({lloc: adrecaOficina, titol: "Tornada Oficina"});

  let cacheCiutats = {};

  // 3. Calcular i omplir
  for (let i = 0; i < punts.length - 1; i++) {
    let inici = punts[i].lloc;
    let desti = punts[i+1].lloc;
    let gestio = punts[i+1].titol; 
    
    let direccions = Maps.newDirectionFinder()
      .setOrigin(inici)
      .setDestination(desti)
      .setMode(Maps.DirectionFinder.Mode.DRIVING)
      .getDirections();

    if (direccions.routes && direccions.routes.length > 0) {
      let distMetres = direccions.routes[0].legs[0].distance.value;
      let km = distMetres / 1000;
      
      let filaDesti = trobarSegüentFilaBuida(full, FILA_INICI);
      
      // Obtenir ciutats per a l'itinerari
      if (!cacheCiutats[inici]) cacheCiutats[inici] = obtenirCiutat(inici);
      if (!cacheCiutats[desti]) cacheCiutats[desti] = obtenirCiutat(desti);

      // A: Fecha | B: Km | C: Salida | E: Destino | F: Itinerario (ciutats) | J: Descripción
      full.getRange(filaDesti, 1).setValue(avui);
      full.getRange(filaDesti, 2).setValue(km).setNumberFormat("0.00");
      full.getRange(filaDesti, 3).setValue(inici);
      full.getRange(filaDesti, 5).setValue(desti);
      full.getRange(filaDesti, 6).setValue(`${cacheCiutats[inici]} - ${cacheCiutats[desti]}`);
      full.getRange(filaDesti, 10).setValue(gestio);
    }
  }
}

/**
 * Extreu la ciutat o municipi
 */
function obtenirCiutat(adreca) {
  try {
    const resposta = Maps.newGeocoder().geocode(adreca);
    if (resposta.status === 'OK' && resposta.results.length > 0) {
      const components = resposta.results[0].address_components;
      for (let i = 0; i < components.length; i++) {
        if (components[i].types.indexOf('locality') !== -1) return components[i].long_name;
      }
    }
  } catch (e) {}
  return adreca.split(',')[0];
}

/**
 * Busca fila buida
 */
function trobarSegüentFilaBuida(full, inici) {
  const dades = full.getRange(inici, 1, 500, 1).getValues(); 
  for (let i = 0; i < dades.length; i++) {
    if (dades[i][0] === "" || dades[i][0] === null) return inici + i;
  }
  return full.getLastRow() + 1;
}