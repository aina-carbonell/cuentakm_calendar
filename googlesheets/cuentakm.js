/**
 * CONFIGURACIÓ DE COLUMNES I LOGÍSTICA
 */
const FILA_INICI = 9;         

function calcularKilometratgeMensual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const full = ss.getActiveSheet(); 
  
  const adrecaOficinaOriginal = full.getRange("K4").getValue().toString();
  const adrecaOficinaNeta = normalitzarText(adrecaOficinaOriginal);

  if (!adrecaOficinaOriginal) {
    SpreadsheetApp.getUi().alert("Avís: Introdueix l'adreça de l'oficina a K4.");
    return;
  }

  // 1. DEFINIR DATES (Mes anterior)
  const ara = new Date();
  const iniciMes = new Date(ara.getFullYear(), ara.getMonth() - 1, 1);
  const fiMes = new Date(ara.getFullYear(), ara.getMonth(), 0, 23, 59, 59);

  // 2. NETEJA TOTAL (Fila 9 cap avall)
  const ultimaFilaAbans = full.getLastRow();
  if (ultimaFilaAbans >= FILA_INICI) {
    full.getRange(FILA_INICI, 1, ultimaFilaAbans - FILA_INICI + 1, 10).clearContent();
  }

  const calendari = CalendarApp.getDefaultCalendar();
  const events = calendari.getEvents(iniciMes, fiMes);

  if (events.length === 0) {
    MailApp.sendEmail(Session.getActiveUser().getEmail(), "Compte KM: Sense esdeveniments", "No s'han trobat rutes al calendari per al mes passat.");
    return;
  }

  // 3. PROCESSAR ESDEVENIMENTS
  let esdevenimentsPerDia = {};
  events.forEach(e => {
    let dataStr = e.getStartTime().toDateString();
    if (!esdevenimentsPerDia[dataStr]) esdevenimentsPerDia[dataStr] = [];
    esdevenimentsPerDia[dataStr].push(e);
  });

  let diesOrdenats = Object.keys(esdevenimentsPerDia).sort((a, b) => new Date(a) - new Date(b));
  let enModeViatge = false; 
  let cacheCiutats = {};

  diesOrdenats.forEach(dia => {
    let eventsDelDia = esdevenimentsPerDia[dia].sort((a, b) => a.getStartTime() - b.getStartTime());
    let puntsDelDia = [];
    
    if (!enModeViatge) {
      puntsDelDia.push({ lloc: adrecaOficinaOriginal, titol: "Sortida Oficina" });
    }

    eventsDelDia.forEach(e => {
      let titol = e.getTitle().toUpperCase();
      let ubicacioOriginal = e.getLocation();
      let esTransport = false;
      let novaUbicacio = ubicacioOriginal;

      if (/(AVE|IRYO|OUIGO|AVLO)/.test(titol)) {
        novaUbicacio = "Estació de Sants, Barcelona";
        esTransport = true;
      } else if (/(VUELING|IBERIA|AIREUROPA)/.test(titol)) {
        novaUbicacio = "Aeroport Josep Tarradelles Barcelona-El Prat";
        esTransport = true;
      }

      if (esTransport) {
        puntsDelDia.push({ lloc: novaUbicacio, titol: e.getTitle() });
        enModeViatge = !enModeViatge; 
      } else if (!enModeViatge && ubicacioOriginal !== "") {
        puntsDelDia.push({ lloc: ubicacioOriginal, titol: e.getTitle() });
      }
    });

    if (!enModeViatge && puntsDelDia.length > 1) {
      puntsDelDia.push({ lloc: adrecaOficinaOriginal, titol: "Tornada Oficina" });
    }

    for (let i = 0; i < puntsDelDia.length - 1; i++) {
      processarTrajecte(full, puntsDelDia[i], puntsDelDia[i+1], adrecaOficinaOriginal, adrecaOficinaNeta, cacheCiutats, new Date(dia));
    }
  });

  // 4. FINALITZACIÓ: CANVI DE NOM I NOVA PESTANYA
  prepararSegüentMes(ss, full, iniciMes);

  // 5. ENVIAR CORREU
  MailApp.sendEmail(Session.getActiveUser().getEmail(), "Compte KM's realitzat", "Hola! El càlcul mensual s'ha completat correctament. Sisplau, revisa el full de càlcul.");
}

/**
 * Gestiona el canvi de nom de la pestanya actual i crea la nova per al mes que comença
 */
function prepararSegüentMes(ss, fullActual, dataMesPassat) {
  const mesos = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
  
  // Nom per a la pestanya que acabem d'omplir (ex: febrer'26)
  const nomMesPassat = mesos[dataMesPassat.getMonth()] + "'" + dataMesPassat.getFullYear().toString().slice(-2);
  
  // Intentem canviar el nom (si ja existeix, no fem res per evitar errors)
  try { fullActual.setName(nomMesPassat); } catch(e) { console.log("La pestanya ja té el nom correcte."); }

  // Creem la pestanya per al mes actual (ex: març'26)
  const ara = new Date();
  const nomMesNou = mesos[ara.getMonth()] + "'" + ara.getFullYear().toString().slice(-2);
  
  if (!ss.getSheetByName(nomMesNou)) {
    const nouFull = fullActual.copyTo(ss);
    nouFull.setName(nomMesNou);
    // Netegem les dades del nou full perquè estigui llest per al mes que ve
    const ultimaFila = nouFull.getLastRow();
    if (ultimaFila >= FILA_INICI) {
      nouFull.getRange(FILA_INICI, 1, ultimaFila - FILA_INICI + 1, 10).clearContent();
    }
    nouFull.activate();
    ss.moveActiveSheet(1); // El posem al principi (esquerra)
  }
}

function processarTrajecte(full, iniciObj, destiObj, oficinaOrig, oficinaNeta, cache, data) {
  let inici = iniciObj.lloc;
  let desti = destiObj.lloc;
  
  let direccions = Maps.newDirectionFinder()
    .setOrigin(inici)
    .setDestination(desti)
    .setMode(Maps.DirectionFinder.Mode.DRIVING)
    .getDirections();

  if (direccions.routes && direccions.routes.length > 0) {
    let km = direccions.routes[0].legs[0].distance.value / 1000;
    let fila = trobarSegüentFilaBuida(full, FILA_INICI);
    
    // Si la fila és l'última disponible, n'afegim una de nova
    if (fila >= full.getMaxRows()) {
      full.insertRowAfter(full.getMaxRows());
    }

    let textInici = (normalitzarText(inici) === oficinaNeta) ? "Oficina" : (cache[inici] || (cache[inici] = obtenirCiutat(inici)));
    let textDesti = (normalitzarText(desti) === oficinaNeta) ? "Oficina" : (cache[desti] || (cache[desti] = obtenirCiutat(desti)));

    full.getRange(fila, 1).setValue(data);
    full.getRange(fila, 2).setValue(km).setNumberFormat("0.00");
    full.getRange(fila, 3).setValue(inici);
    full.getRange(fila, 5).setValue(desti);
    full.getRange(fila, 6).setValue(`${textInici} - ${textDesti}`);
    full.getRange(fila, 10).setValue(destiObj.titol);
  }
}

function normalitzarText(text) { return text ? text.toString().toLowerCase().replace(/[^a-z0-9]/g, "") : ""; }

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
  return adreca.split(',')[0].trim();
}

function trobarSegüentFilaBuida(full, inici) {
  const dades = full.getRange(inici, 1, full.getMaxRows() - inici + 1, 1).getValues(); 
  for (let i = 0; i < dades.length; i++) {
    if (dades[i][0] === "" || dades[i][0] === null) return inici + i;
  }
  return full.getMaxRows() + 1;
}