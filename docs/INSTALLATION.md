# 📦 Guía de Instalación

## Prerrequisitos

- **Node.js** v14 o superior → `node --version`
- **npm** → `npm --version`
- Cuenta de **Google Workspace** o Gmail personal
- Proyecto en **Google Cloud Console** con facturación habilitada

---

## 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd proyecto-kilometros-empresa
npm install
```

---

## 2. Configurar Google Cloud

### 2.1. Crear proyecto en Google Cloud

1. Ve a [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente

### 2.2. Habilitar APIs

En el menú lateral → **APIs y servicios** → **Biblioteca**, habilita:

- ✅ **Google Calendar API**
- ✅ **Google Sheets API**
- ✅ **Maps JavaScript API** (o Distance Matrix API directamente)
- ✅ **Geocoding API**

### 2.3. Crear credenciales de Cuenta de Servicio

1. Ve a **APIs y servicios** → **Credenciales** → **Crear credenciales** → **Cuenta de servicio**
2. Asígnale un nombre (ej: `km-service-account`)
3. En el paso de roles, asigna: **Editor** o roles específicos de Calendar/Sheets
4. Haz clic en la cuenta creada → **Claves** → **Agregar clave** → **JSON**
5. Descarga el archivo JSON y renómbralo a `credentials.json`
6. Colócalo en la raíz del proyecto (**NO lo subas a Git**)

### 2.4. Obtener API Key de Google Maps

1. En **Credenciales** → **Crear credenciales** → **Clave de API**
2. Restringe la clave a: Distance Matrix API, Geocoding API, Places API
3. Copia la clave

---

## 3. Configurar el proyecto

### Opción A: Setup interactivo (recomendado)

```bash
npm run setup
```

El asistente te guiará para crear el `.env` y el Google Sheet automáticamente.

### Opción B: Manual

```bash
cp .env.example .env
# Edita .env con tus valores
```

Valores mínimos en `.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GOOGLE_MAPS_API_KEY=tu_api_key
SPREADSHEET_ID=id_de_tu_sheet
```

---

## 4. Compartir el Google Sheet con la cuenta de servicio

**Importante:** La cuenta de servicio necesita acceso al sheet.

1. Abre el Google Sheet
2. Botón **Compartir**
3. Añade el email de la cuenta de servicio (aparece en `credentials.json` como `client_email`)
4. Dale permisos de **Editor**

También comparte los calendarios de los trabajadores con la cuenta de servicio (permisos de lectura).

---

## 5. Configurar trabajadores

Abre el Google Sheet → pestaña **Trabajadores** y rellena:

| Email | Oficina | Precio/km | Calendario ID | Activo |
|-------|---------|-----------|---------------|--------|
| juan@empresa.com | Gran Vía 1, Madrid | 0.25 | primary | Sí |
| maria@empresa.com | Paseo Gracia 1, Barcelona | 0.30 | primary | Sí |

**Calendar ID:** Normalmente `primary` o el email del trabajador si tienes acceso a calendarios compartidos.

---

## 6. Verificar y desplegar

```bash
# Ejecutar tests
npm test

# Verificar configuración y desplegar
npm run deploy

# Prueba manual
npm start
```

---

## 7. Automatizar ejecución diaria

### Linux/Mac (crontab)

```bash
crontab -e
```

Añade esta línea (ejecuta cada día laborable a las 23:00):
```
0 23 * * 1-5 cd /ruta/al/proyecto && /usr/bin/node src/main.js >> logs/cron.log 2>&1
```

### Windows (Task Scheduler)

1. Abre **Programador de tareas**
2. Crear tarea básica
3. Programa: `node`
4. Argumentos: `C:\ruta\al\proyecto\src\main.js`
5. Directorio de inicio: `C:\ruta\al\proyecto`

---

## Estructura del proyecto

```
proyecto-kilometros-empresa/
├── src/
│   ├── main.js              # Punto de entrada
│   ├── calendar-service.js  # Integración Google Calendar
│   ├── sheets-service.js    # Integración Google Sheets
│   ├── maps-service.js      # Integración Google Maps
│   ├── config.js            # Configuración central
│   └── utils/
│       ├── date-utils.js
│       ├── number-utils.js
│       ├── distance-utils.js
│       ├── validation-utils.js
│       ├── string-utils.js
│       ├── storage-utils.js
│       └── logger.js
├── scripts/
│   ├── setup.js             # Configuración inicial
│   └── deploy.js            # Script de despliegue
├── tests/
│   ├── test-all.js
│   ├── test-utils.js
│   ├── test-maps.js
│   ├── test-calendar.js
│   └── test-sheets.js
├── logs/                    # Logs diarios (auto-generado)
├── data/                    # Datos locales (auto-generado)
├── credentials.json         # ⚠ NO subir a Git
├── .env                     # ⚠ NO subir a Git
├── .env.example             # Plantilla de variables
└── package.json
```

---

## Solución de problemas

**Error: `GOOGLE_MAPS_API_KEY no configurada`**
→ Asegúrate de que el `.env` existe y tiene la clave correcta.

**Error: `The caller does not have permission`**
→ La cuenta de servicio no tiene acceso al Calendar o Sheet. Compártelos con el `client_email`.

**Error: `SPREADSHEET_ID no configurado`**
→ Ejecuta `npm run setup` o añade `SPREADSHEET_ID=...` al `.env`.

**Tests fallan por credenciales**
→ Es esperado si no tienes las APIs configuradas. Los tests de lógica pura deben pasar siempre.