"""
Backend API para NASA Space Apps 2026 - Tunari Fire Watch
GAMC (Gobierno Autónomo Municipal de Cochabamba) / UGR
FastAPI Server con Endpoints REST, GeoJSON y Conexión NRT en Vivo
"""

import os
import json
from typing import Optional, Annotated
from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd

from pipeline import process_fire_data, LAT_MIN, LAT_MAX, LON_MIN, LON_MAX
from firms_client import fetch_nrt_open_feeds

app = FastAPI(
    title="NASA Space Apps Tunari - Fire Watch API",
    description="Motor de Armonización Sensor MODIS/VIIRS y Detección de Anomalías Z-Score",
    version="1.0.0"
)

# Habilitar CORS para permitir llamadas desde Next.js / Vite (localhost:3000, 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
RAW_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")

def load_json_file(filename: str):
    """Carga de forma segura un JSON procesado."""
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail=f"Archivo {filename} no encontrado. Ejecuta primero el pipeline de procesamiento."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/")
def root():
    return {
        "project": "NASA Space Apps 2026 - Sede Cochabamba / GAMC",
        "challenge": "Incendios Parque Nacional Tunari (Cota 2750)",
        "status": "Online",
        "docs_url": "/docs",
        "bbox": {
            "lat_min": LAT_MIN,
            "lat_max": LAT_MAX,
            "lon_min": LON_MIN,
            "lon_max": LON_MAX
        }
    }

@app.get("/api/status")
def get_status():
    """Retorna el estado del sistema, metadatos y conteo de datos cargados."""
    try:
        alert = load_json_file("alerta_actual.json")
        baseline = load_json_file("baseline_mensual.json")
        fires = load_json_file("historial_limpio_mapa.json")
        return {
            "status": "ready",
            "total_harmonized_events": len(fires),
            "baseline_months": len(baseline),
            "current_alert": alert["semaforo"],
            "last_evaluated_month": alert["mes_evaluado"]
        }
    except HTTPException:
        return {"status": "needs_initial_processing", "total_harmonized_events": 0}

@app.get("/api/alert/current")
def get_current_alert():
    """
    Retorna el estado de alerta actual para la UGR (Semáforo de Riesgo).
    Calculado cruzando los datos recientes con la línea base histórica (2000-2023).
    """
    return load_json_file("alerta_actual.json")

@app.get("/api/baseline")
def get_baseline():
    """
    Retorna los parámetros de la Línea Base Climatológica (2000-2023):
    Media (mu), Desviación Estándar (sigma), Mediana y Percentiles por mes.
    """
    return load_json_file("baseline_mensual.json")

@app.get("/api/thermal-calendar")
def get_thermal_calendar(
    year: Annotated[Optional[int], Query(description="Filtrar por año específico (ej. 2024)")] = None
):
    """
    Retorna los datos del Calendario Térmico interactivo:
    Meses y años con conteo de eventos armonizados vs crudos, Z-Score y nivel de alerta.
    """
    data = load_json_file("calendario_termico.json")
    if year is not None:
        data = [item for item in data if item["year"] == year]
    return data

@app.get("/api/fires")
def get_clean_fires(
    start_date: Annotated[Optional[str], Query(description="Fecha de inicio (YYYY-MM-DD)")] = None,
    end_date: Annotated[Optional[str], Query(description="Fecha de fin (YYYY-MM-DD)")] = None,
    sensor: Annotated[Optional[str], Query(description="Filtrar por sensor: MODIS, VIIRS o AMBOS")] = None,
    severity: Annotated[Optional[str], Query(description="Filtrar por severidad: BAJA, MEDIA, ALTA, CRÍTICA")] = None,
    min_frp: Annotated[Optional[float], Query(description="FRP mínimo en MW")] = None,
    limit: Annotated[Optional[int], Query(description="Límite de registros a retornar")] = 5000
):
    """
    Retorna el historial limpio de incendios armonizados para pintar en Leaflet.
    Permite filtrado dinámico por fecha, sensor y potencia térmica (FRP).
    """
    fires = load_json_file("historial_limpio_mapa.json")
    
    filtered = fires
    if start_date:
        filtered = [f for f in filtered if f["date"] >= start_date]
    if end_date:
        filtered = [f for f in filtered if f["date"] <= end_date]
    if sensor:
        filtered = [f for f in filtered if f["sensor"].upper() == sensor.upper()]
    if severity:
        filtered = [f for f in filtered if f["severity"].upper() == severity.upper()]
    if min_frp is not None:
        filtered = [f for f in filtered if f["frp_max"] >= min_frp]

    if limit and len(filtered) > limit:
        filtered = filtered[-limit:]

    return {
        "count": len(filtered),
        "total_available": len(fires),
        "data": filtered
    }

@app.get("/api/fires/geojson")
def get_fires_geojson(
    start_date: Annotated[Optional[str], Query(description="Fecha de inicio (YYYY-MM-DD)")] = None,
    end_date: Annotated[Optional[str], Query(description="Fecha de fin (YYYY-MM-DD)")] = None
):
    """
    Retorna el FeatureCollection GeoJSON nativo para consumo directo con L.geoJSON() en Leaflet.
    """
    geojson = load_json_file("historial_limpio_mapa.geojson")
    if not start_date and not end_date:
        return geojson

    features = geojson.get("features", [])
    if start_date:
        features = [ft for ft in features if ft["properties"]["date"] >= start_date]
    if end_date:
        features = [ft for ft in features if ft["properties"]["date"] <= end_date]

    geojson["features"] = features
    geojson["metadata"]["total_events"] = len(features)
    return geojson

@app.get("/api/nrt/live")
def get_live_nrt(window: str = Query("7d", description="Ventana de tiempo: 24h o 7d")):
    """
    Consulta en tiempo real la API/Feeds abiertos de NASA FIRMS
    y filtra detecciones activas en el Parque Nacional Tunari.
    """
    df_m, df_v = fetch_nrt_open_feeds(window=window)
    detections = []
    
    for _, row in df_m.iterrows():
        detections.append({
            "lat": round(float(row["latitude"]), 4),
            "lng": round(float(row["longitude"]), 4),
            "date": str(row["acq_date"]),
            "time": str(row.get("acq_time", "")),
            "sensor": "MODIS",
            "frp": float(row.get("frp", 0.0)),
            "confidence": str(row.get("confidence", ""))
        })
    for _, row in df_v.iterrows():
        detections.append({
            "lat": round(float(row["latitude"]), 4),
            "lng": round(float(row["longitude"]), 4),
            "date": str(row["acq_date"]),
            "time": str(row.get("acq_time", "")),
            "sensor": "VIIRS",
            "frp": float(row.get("frp", 0.0)),
            "confidence": str(row.get("confidence", ""))
        })

    return {
        "window": window,
        "query_time": pd.Timestamp.now().isoformat(),
        "total_active_detections": len(detections),
        "detections": detections
    }

@app.post("/api/pipeline/run")
def run_pipeline():
    """Ejecuta el pipeline de armonización y regenera los JSONs procesados."""
    modis_file = os.path.join(RAW_DIR, "fire_archive_M6.csv")
    viirs_file = os.path.join(RAW_DIR, "fire_archive_V1.csv")

    if not os.path.exists(modis_file) or not os.path.exists(viirs_file):
        raise HTTPException(
            status_code=400,
            detail=f"Faltan archivos fuente en {RAW_DIR}. Deben existir fire_archive_M6.csv y fire_archive_V1.csv"
        )

    res = process_fire_data(modis_file, viirs_file)
    return {"message": "Pipeline ejecutado exitosamente", "stats": res}

@app.post("/api/upload-csv")
async def upload_csv(
    sensor_type: str = Query(..., description="Tipo de sensor: MODIS o VIIRS"),
    file: UploadFile = File(...)
):
    """Permite subir un CSV de FIRMS directamente desde el frontend."""
    filename = "fire_archive_M6.csv" if sensor_type.upper() == "MODIS" else "fire_archive_V1.csv"
    dest_path = os.path.join(RAW_DIR, filename)

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    return {
        "message": f"Archivo para {sensor_type} guardado como {filename}",
        "bytes_received": len(contents)
    }

# --- ENDPOINTS DE NOTIFICACIÓN (TELEGRAM & WHATSAPP) ---
from notifier import send_telegram_alert, get_whatsapp_dispatch_link, format_alert_message

@app.post("/api/alerts/notify")
def dispatch_alert_notification(payload: dict):
    """
    Despacha una alerta activa a los canales de respuesta (Telegram, WhatsApp).
    Payload: { alert_data: dict, bot_token: optional str, chat_id: optional str }
    """
    alert_data = payload.get("alert_data", {})
    bot_token = payload.get("bot_token")
    chat_id = payload.get("chat_id")

    res = send_telegram_alert(alert_data, bot_token=bot_token, chat_id=chat_id)
    return res

@app.get("/api/alerts/whatsapp-link")
def get_whatsapp_link(
    nivel: str = "CRÍTICO",
    z_score: float = 3.2,
    zone: str = "P.N. Tunari (Cota 2750)",
    frp: float = 85.0,
    lat: float = -17.31,
    lng: float = -66.21
):
    """Genera enlace web directo para abrir WhatsApp con el reporte táctico pre-llenado."""
    alert_data = {
        "nivel": nivel,
        "z_score": z_score,
        "zone": zone,
        "frp": frp,
        "lat": lat,
        "lng": lng
    }
    return {
        "whatsapp_url": get_whatsapp_dispatch_link(alert_data),
        "formatted_text": format_alert_message(alert_data)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
