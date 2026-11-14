# Fire Watch - Data Science & Backend Engine

**NASA Space Apps Challenge 2026 - Sede Cochabamba / GAMC & UGR**

Sistema de armonización de datos satelitales (NASA FIRMS MODIS 1km + VIIRS 375m) y motor de detección de anomalías estadísticas (Z-Score) para la mitigación de incendios en el **Parque Nacional Tunari (Cota 2750)** y zonas periurbanas de Cochabamba.

---

## 1. El Problema Científico Resuelto: Sesgo de Sensor (Sensor Bias)

- **MODIS (Terra/Aqua):** Operativo desde el año 2000. Resolución espacial de **1 km**.
- **VIIRS (Suomi-NPP / NOAA-20 / NOAA-21):** Operativo desde 2012. Resolución espacial de **375 m**.

### La Falacia del "Salto de Incendios en 2012":

Al sumar conteos crudos de píxeles térmicos, parece que los incendios se dispararon súbitamente a partir de 2012. Esto es un **artefacto instrumental**: cada frente de fuego que MODIS registra como 1 punto, VIIRS lo detecta con entre 3 y 8 píxeles adyacentes debido a su mayor resolución.

### Nuestra Solución: Armonización Espacio-Temporal en Grilla Unificada 1x1 km

1. **Bounding Box Oficial Tunari:**
   - Latitud: `-17.53119` a `-17.257306`
   - Longitud: `-66.280703` a `-66.06952`
2. **Filtrado de Calidad y Falsos Positivos:**
   - **MODIS:** Descarte de detecciones con `confidence < 30%` (eliminando reflejos solares y humo frío).
   - **VIIRS:** Descarte de confianza `"low"` / `"l"`.
3. **Agrupación en Grilla Espacial:**
   - Coordenadas redondeadas a 2 decimales (`lat_grid`, `lon_grid`), lo que proyecta celdas cuadradas de **~1.11 km x 1.06 km** (escala nativa MODIS).
4. **Colapso Espacio-Temporal:**
   - Si en el mismo día y en la misma celda de 1x1 km existen 1 punto MODIS y 4 VIIRS, se colapsan a **1 único Evento de Incendio Armonizado**.
   - Se preservan: `frp_max` (Potencia Radiativa Máxima en MW), `frp_sum`, conteo de detecciones crudas, y la etiqueta de sensor (`MODIS`, `VIIRS` o `AMBOS`).

---

## 2. Motor de Detección de Anomalías (Z-Score Climatológico)

### Línea Base Histórica (2000 - 2023):

Para cada mes calendario $m \in [1, 12]$, se calcula el comportamiento climatológico esperado sobre la serie completa de 24 años:

$$
\mu_m = \text{Media de eventos armonizados en el mes } m
$$

$$
\sigma_m = \text{Desviación estándar de eventos armonizados en el mes } m
$$

### Cálculo del Z-Score para Datos Recientes (2024 - 2026 y NRT):

$$
Z = \frac{E_{actual} - \mu_m}{\sigma_m}
$$

### Semáforo de Alerta para la UGR (GAMC):

| Z-Score             | Semáforo   | Nivel UGR          | Acción Operativa Recomendada                                          |
| ------------------- | ----------- | ------------------ | ---------------------------------------------------------------------- |
| $Z \le 0.5$       | 🟢 Verde    | **NORMAL**   | Monitoreo pasivo habitual                                              |
| $0.5 < Z \le 1.5$ | 🟡 Amarillo | **MODERADO** | Monitoreo preventivo y patrullaje de guardaparques                     |
| $1.5 < Z \le 2.5$ | 🟠 Naranja  | **ALTO**     | Pre-alerta de cuadrillas de primera respuesta (SAR / Bomberos)         |
| $Z > 2.5$         | 🔴 Rojo     | **CRÍTICO** | Declaración de Emergencia Municipal; despliegue inmediato de brigadas |

---

## 3. Conexión en Tiempo Real (NASA FIRMS NRT)

El módulo `firms_client.py` cuenta con ingesta automática desde los servidores de NASA FIRMS:

- **Feeds Públicos Abiertos (sin API Key):** Descarga feeds de Sudamérica para las últimas **24 horas** o **7 días** de MODIS y VIIRS, filtrando al instante el Bounding Box de Cochabamba.
- **API con MAP_KEY:** Soporte nativo para consultar el endpoint por coordenadas `area/csv/{map_key}/...`.

---

## 4. Endpoints de la API FastAPI (`backend.py`)

Servidor en: `http://localhost:8000` (con documentación Swagger en `http://localhost:8000/docs`).

| Método  | Endpoint                                           | Descripción                                                               |
| -------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| `GET`  | `/api/status`                                    | Estado del backend, conteo de registros y alerta activa                    |
| `GET`  | `/api/alert/current`                             | Resumen ejecutivo para el widget de la UGR (Semáforo actual)              |
| `GET`  | `/api/baseline`                                  | Parámetros climatológicos base ($\mu$, $\sigma$, percentiles 1..12)  |
| `GET`  | `/api/thermal-calendar?year=2024`                | Serie temporal mensual con Z-Scores y alertas para el Calendario Térmico  |
| `GET`  | `/api/fires?start_date=2024-01-01&severity=ALTA` | Historial limpio filtrable para pintar puntos en Leaflet                   |
| `GET`  | `/api/fires/geojson`                             | GeoJSON estándar compatible directamente con `L.geoJSON()`              |
| `GET`  | `/api/nrt/live?window=7d`                        | Detecciones activas de las últimas 24h/7d en tiempo real desde NASA FIRMS |
| `POST` | `/api/pipeline/run`                              | Re-ejecuta el procesamiento de datos                                       |
| `POST` | `/api/upload-csv`                                | Permite subir nuevos CSVs de MODIS o VIIRS desde la UI                     |

---

## 5. Integración Inmediata con Frontend (Leaflet / Next.js / Vite)

Los archivos procesados ya se copian automáticamente a `frontend/.../public/data/`. Matías puede consumirlos por dos vías:

### Opción A: Vía Archivos Estáticos (Sin necesidad de backend corriendo)

```javascript
// 1. Cargar puntos para Leaflet
const res = await fetch('/data/historial_limpio_mapa.json');
const fires = await res.json();

fires.forEach(f => {
  L.circleMarker([f.lat, f.lng], {
    radius: f.severity === 'CRÍTICA' ? 8 : 5,
    color: f.sensor === 'AMBOS' ? '#9333ea' : (f.sensor === 'VIIRS' ? '#ef4444' : '#f59e0b'),
    fillOpacity: 0.8
  }).bindPopup(`<b>Fecha:</b> ${f.date}<br/><b>FRP Máx:</b> ${f.frp_max} MW<br/><b>Sensor:</b> ${f.sensor}`)
    .addTo(map);
});

// 2. Cargar datos del Calendario Térmico
const calRes = await fetch('/data/calendario_termico.json');
const calendarData = await calRes.json();
```

### Opción B: Vía API REST en Vivo (`http://localhost:8000`)

```javascript
const res = await fetch('http://localhost:8000/api/fires/geojson?start_date=2024-01-01');
const geojson = await res.json();
L.geoJSON(geojson).addTo(map);
```

---

## 6. Cómo Ejecutar el Backend

```bash
# 1. Instalar dependencias
pip install -r backend/requirements.txt

# 2. Correr el pipeline de datos (si se añaden nuevos CSVs)
python backend/pipeline.py

# 3. Levantar el servidor API
python backend/backend.py
```

El servidor quedará escuchando en `http://localhost:8000`.
