# ⚙️ Referencia de Configuración

## Variables de Entorno (`.env`)

| Variable | Requerida | Por defecto | Descripción |
|----------|-----------|-------------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | — | Ruta al `credentials.json` |
| `GOOGLE_MAPS_API_KEY` | ✅ | — | API Key de Google Maps |
| `SPREADSHEET_ID` | ✅ | — | ID del Google Sheet |
| `EMPRESA_NOMBRE` | — | `Mi Empresa` | Nombre de la empresa |
| `EMAIL_ADMIN` | — | — | Email para notificaciones de error |
| `PRECIO_POR_KM` | — | `0.25` | Precio por km en euros |
| `HORA_EJECUCION` | — | `23` | Hora de ejecución diaria (0-23) |
| `TIMEZONE` | — | `Europe/Madrid` | Zona horaria |
| `LOG_LEVEL` | — | `INFO` | Nivel de log (DEBUG/INFO/WARN/ERROR) |
| `NODE_ENV` | — | `production` | Entorno (`development` muestra logs en consola) |
| `TRABAJADORES_EMAILS` | — | — | Emails separados por coma (alternativa al Sheet) |
| `OFICINA_DEFAULT` | — | — | Oficina por defecto si no está en el Sheet |

---

## Google Sheet — Estructura de hojas

### Hoja: `RegistroViajes`

| Columna | Nombre | Ejemplo |
|---------|--------|---------|
| A | Fecha | 15/01/2024 |
| B | Trabajador | juan@empresa.com |
| C | Inicio | Gran Vía 1, Madrid |
| D | Destino | Calle Serrano 45, Madrid |
| E | Km Trayecto | 4.50 |
| F | Precio/km | 0.25 |
| G | Precio Trayecto | 1.13 |
| H | Total Km Acum. | 24.30 |
| I | Total Precio Acum. | 6.08 |
| J | Evento | Reunión con cliente A |
| K | ID Evento | abc123xyz |
| L | Registrado el | 15/01/2024 23:01:45 |

### Hoja: `Trabajadores`

| Columna | Nombre | Ejemplo |
|---------|--------|---------|
| A | Email | juan@empresa.com |
| B | Oficina | Gran Vía 1, Madrid, España |
| C | Precio/km | 0.25 |
| D | Calendario ID | primary |
| E | Activo | Sí |
| F | Notas | Comercial zona norte |

> **Nota:** El valor de `Activo` debe ser exactamente `Sí` o `Si` (con o sin tilde) para activar al trabajador.

### Hoja: `HistoricoMensual`

| Columna | Nombre |
|---------|--------|
| A | Mes |
| B | Año |
| C | Total Km |
| D | Total Precio (€) |
| E | Nº Viajes |
| F | Nº Trabajadores |
| G | Generado el |

### Hoja: `Configuracion`

Reservada para parámetros de configuración adicionales (uso futuro).

---

## Configuración de Google Calendar

Para que el sistema detecte viajes, los eventos en el calendario deben tener:

- ✅ **Ubicación** rellena (el campo `location` del evento)
- ✅ **Hora de inicio y fin** (no eventos de día completo)
- ✅ El calendario compartido con la cuenta de servicio

Eventos **ignorados** automáticamente:
- Sin campo `location`
- Eventos de día completo (sin `dateTime`)
- Eventos donde el destino es igual al origen actual

---

## Ajustar precio por trabajador

Cada trabajador puede tener su propio `Precio/km` en la hoja `Trabajadores`. Si no se especifica, se usa el valor de `PRECIO_POR_KM` del `.env`.

---

## Múltiples calendarios

Si un trabajador usa un calendario diferente al principal:

1. Edita la columna `Calendario ID` en la hoja `Trabajadores`
2. Usa el email del calendario (ej: `trabajo@empresa.com`) o el ID completo
3. Comparte ese calendario con la cuenta de servicio

---

## Logs

Los logs se guardan en `logs/log-YYYY-MM-DD.log`. Se eliminan automáticamente después de 7 días.

Cambia el formato a JSON para integrarlo con herramientas de monitoreo:
```
LOG_FORMAT=json
```