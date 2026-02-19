const SHEET_NAME = "Full 1"; // Canvia-ho si el teu full té un altre nom

function calcularKilometratgeDiari() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const full = ss.getSheetByName(SHEET_NAME);
  
  // --- LECTURA DE CONFIGURACIÓ DES DEL FULL ---
  const correuTreballador = full.getRange("B2").getValue();
  const adrecaOficina = full.getRange("B3").getValue();
  const preuPerKm = full.getRange("B5").getValue(); // He assumit que el preu està a B5 segons la teva descripció

  const avui = new Date();
  avui.setHours(0,0,0,0);
  const dema = new Date(avui);
  dema.setDate(avui.getDate() + 1);

  // 1. Obtenir esdeveniments del calendari
  const events = CalendarApp.getCalendarById(correuTreballador).getEvents(avui, dema);
  
  // Filtrar esdeveniments amb ubicació i ordenar per hora
  const rutes = events
    .filter(e => e.getLocation() !== "")
    .sort((a, b) => a.getStartTime() - b.getStartTime());

  if (rutes.length === 0) return;

  // 2. Definir punts: Oficina -> Esdeveniments -> Oficina
  let punts = [adrecaOficina];
  rutes.forEach(e => punts.push(e.getLocation()));
  punts.push(adrecaOficina);

  // 3. Calcular trajectes i omplir la taula
  for (let i = 0; i < punts.length - 1; i++) {
    let inici = punts[i];
    let desti = punts[i+1];
    
    let direccions = Maps.newDirectionFinder()
      .setOrigin(inici)
      .setDestination(desti)
      .setMode(Maps.DirectionFinder.Mode.DRIVING)
      .getDirections();

    if (direccions.routes.length > 0) {
      let distMetres = direccions.routes[0].legs[0].distance.value;
      let km = distMetres / 1000;
      
      // Trobar la següent fila buida a partir de la fila 7
      let darreraFila = Math.max(full.getLastRow(), 6);
      
      // Escriure: | Fecha | Inicio | Destino | km trayecto |
      full.getRange(darreraFila + 1, 1, 1, 4).setValues([[
        avui, 
        inici, 
        desti, 
        km.toFixed(2)
      ]]);
    }
  }
}

function enviarResumSetmanal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const full = ss.getSheetByName(SHEET_NAME);
  const correuTreballador = full.getRange("B2").getValue();
  const nomTreballador = full.getRange("B1").getValue();
  const preuPerKm = full.getRange("B5").getValue();

  // Obtenir totes les dades de la taula (des de la fila 7)
  const dades = full.getRange(7, 1, full.getLastRow() - 6, 4).getValues();
  
  const avui = new Date();
  const faSetDies = new Date();
  faSetDies.setDate(avui.getDate() - 7);
  
  let kmTotalsSetmana = 0;
  let llistaHtml = "";

  dades.forEach(fila => {
    let dataFila = new Date(fila[0]);
    if (dataFila >= faSetDies && dataFila <= avui) {
      let km = parseFloat(fila[3]);
      kmTotalsSetmana += km;
      llistaHtml += `<li><b>${dataFila.toLocaleDateString()}:</b> ${fila[1]} ➔ ${fila[2]} (<i>${km} km</i>)</li>`;
    }
  });

  if (kmTotalsSetmana > 0) {
    let totalEuros = kmTotalsSetmana * preuPerKm;
    
    MailApp.sendEmail({
      to: correuTreballador,
      subject: `🚗 Resum KM Setmanal - ${nomTreballador}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hola ${nomTreballador},</h2>
          <p>Aquí tens el resum de quilometratge d'aquesta setmana:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 10px;">
            <p style="font-size: 1.2em;">Total km: <b>${kmTotalsSetmana.toFixed(2)} km</b></p>
            <p style="font-size: 1.2em;">Total a cobrar: <b style="color: #2e7d32;">${totalEuros.toFixed(2)} €</b></p>
          </div>
          <h3>Detall de rutes:</h3>
          <ul>${llistaHtml}</ul>
          <br>
          <small>Aquest correu s'ha generat automàticament.</small>
        </div>
      `
    });
  }
}