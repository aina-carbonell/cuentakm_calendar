# 📚 Documentación de la API interna

## calendar-service.js

### `registrarViajesDelDia(fecha?)`
Función principal. Obtiene eventos del calendario de todos los trabajadores activos y registra los viajes en Google Sheets.

**Parámetros:**
- `fecha` *(Date, opcional)* — Fecha a procesar. Por defecto: hoy.

**Retorna:**
```js
{
  totalViajes: 5,
  totalKm: 87.3,
  totalPrecio: 21.83,
  fecha: "15/01/2024",
  trabajadores: [ { email, viajes, totalKm, totalPrecio } ]
}
```

### `procesarViajesTrabajador(trabajador, fecha)`
Procesa los viajes de un trabajador concreto para una fecha.

**Parámetros:**
```js
trabajador = {
  email: "juan@empresa.com",
  oficina: "Gran Vía 1, Madrid",
  precioKm: 0.25,
  calendarId: "primary",
  activo: true
}
```

### `obtenerEventosDelDia(calendarId, fecha, emailTrabajador)`
Obtiene los eventos de Google Calendar para un día.

---

## maps-service.js

### `calcularDistancia(origen, destino)`
Calcula la distancia por carretera entre dos direcciones.

**Retorna:** `number` (km) o `null` si no se puede calcular. Retorna `0` si origen === destino.

### `calcularDistanciasMultiples(origen, destinos[])`
Calcula distancias a múltiples destinos desde un origen en una sola llamada API (más eficiente).

**Retorna:** `number[]` (km), `null` en posiciones donde no se pudo calcular.

### `geocodificar(direccion)`
Obtiene coordenadas y dirección formateada de una dirección textual.

**Retorna:**
```js
{ lat: 40.4168, lng: -3.7038, direccionFormateada: "Gran Vía, Madrid", lugarId: "ChIJ..." }
// o null si no se encuentra
```

### `validarDireccion(direccion)`
Verifica si una dirección existe geográficamente.

**Retorna:** `boolean`

### `autocompletarDireccion(input)`
Sugerencias de autocompletado para direcciones en España.

**Retorna:** `[{ descripcion, lugarId }]`

---

## sheets-service.js

### `guardarViaje(viaje)`
Añade una fila en la hoja `RegistroViajes`.

**Objeto viaje:**
```js
{
  fecha: Date,
  trabajador: "juan@empresa.com",
  inicio: "Gran Vía 1, Madrid",
  destino: "Calle Serrano 45, Madrid",
  kmTrayecto: 4.5,
  precioKm: 0.25,
  precioTrayecto: 1.13,
  totalKmAcumulado: 4.5,
  totalPrecioAcumulado: 1.13,
  eventoId: "google_event_id",
  eventoTitle: "Reunión con cliente"
}
```

### `inicializarSheet(spreadsheetId?)`
Crea las hojas necesarias y configura cabeceras. Útil para el primer uso.

### `formatearSheet()`
Aplica formato visual al sheet (cabeceras en negrita, colores, formato numérico).

### `generarInformeMensual()`
Genera una fila resumen en `HistoricoMensual` con los totales del mes actual.

### `obtenerResumenTrabajador(email, fechaInicio, fechaFin)`
Obtiene el resumen de km y coste de un trabajador en un rango de fechas.

**Retorna:**
```js
{ emailTrabajador, totalKm, totalPrecio, numViajes, viajes: [...] }
```

---

## config.js

### `obtenerConfiguracion()`
Retorna configuración general del sistema.

### `obtenerConfiguracionTrabajadores()`
Lee la lista de trabajadores desde la hoja `Trabajadores` del Google Sheet.

### `validarConfiguracion()`
Verifica que todas las variables de entorno necesarias estén configuradas.

**Retorna:** `{ valido: boolean, errores: string[] }`

---

## utils/

### date-utils.js
- `formatearFecha(fecha, locale?, opciones?)` → string
- `formatearHora(fecha, locale?)` → string
- `calcularDiasLaborables(inicio, fin)` → number
- `primerDiaMes(fecha?)` → Date
- `ultimoDiaMes(fecha?)` → Date
- `esFinDeMes(fecha?)` → boolean
- `parsearFechaEspanol(str)` → Date | null
- `nombreMes(mes)` → string

### number-utils.js
- `formatearMoneda(cantidad, moneda?, decimales?)` → string
- `formatearKilometros(km)` → string
- `calcularPrecioTrayecto(km, precioPorKm)` → number
- `redondear(numero, decimales?)` → number
- `sumarArray(numeros[])` → number
- `calcularPorcentaje(valor, total)` → number

### distance-utils.js
- `distanciaHaversine(lat1, lon1, lat2, lon2)` → number (km en línea recta)
- `calcularDistanciaTotal(distancias[])` → number
- `calcularCosteRuta(km, precioKm, opciones?)` → object
- `calcularEstadisticasDistancias(distancias[])` → object
- `formatearDistancia(km)` → string
- `optimizarRutaVisitas(puntos[])` → puntos[] (algoritmo vecino más cercano)

### validation-utils.js
- `validarEmail(email)` → boolean
- `validarPrecioKm(precio)` → boolean
- `validarDistancia(km)` → boolean
- `validarConfiguracionTrabajador(trabajador)` → `{ valido, errores[] }`
- `validarCamposRequeridos(obj, campos[])` → `{ valido, faltantes[], invalidos[] }`

### storage-utils.js
- `guardarJSON(nombre, datos)` → boolean
- `cargarJSON(nombre, porDefecto?)` → any
- `guardarCache(clave, datos, ttl?)` — TTL en segundos
- `cargarCache(clave)` → datos | null
- `guardarUltimaEjecucion(estado)` / `cargarUltimaEjecucion()`