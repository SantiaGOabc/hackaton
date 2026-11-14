"""
Pipeline Científico de Armonización Espacio-Temporal y Detección de Anomalías (Z-Score)
Reto: Incendios en el Parque Nacional Tunari (Cota 2750) y Zonas Periurbanas (GAMC / NASA Space Apps)
Implementa:
1. Conversión a tiempo solar local (Bolivia UTC-4) para evitar corte de fechas nocturnas.
2. Agrupación espacial por Buffer (radio de 1.2 km = huella nativa MODIS) eliminando el efecto borde del redondeo decimal.
3. Centroide ponderado por FRP (Fire Radiative Power) y suma integrada de energía.
4. Clasificación territorial estricta (P.N. Tunari Cota 2750, Periurbanos, Distritos Cercado y Valle Metropolitano).
5. Exportación dual: Dataset Armonizado (Limpio) y Dataset Crudo (Auditoría para el jurado).
"""

import os
import glob
import json
import shutil
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Bounding Box oficial Cochabamba / Parque Tunari (Cota 2750 y periurbano)
LAT_MIN = -17.53119
LAT_MAX = -17.257306
LON_MIN = -66.280703
LON_MAX = -66.06952

MONTH_NAMES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
}

def distance_meters(lat1, lon1, lat2, lon2):
    """Calcula distancia geodésica en metros usando fórmula de Haversine."""
    R = 6371000.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp = np.radians(lat2 - lat1)
    dl = np.radians(lon2 - lon1)
    a = np.sin(dp / 2.0)**2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2.0)**2
    return 2.0 * R * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))

def classify_territorial_zone(lat, lon):
    """
    Clasifica cada evento según la cartografía municipal del GAMC:
    1. Parque Nacional Tunari (Cota > 2750)
    2. Zonas Periurbanas GAMC (Interfaz urbano-forestal sur y este)
    3. Distritos Urbanos GAMC (Cercado)
    4. Área Metropolitana Externa (Quillacollo, Colcapirhua, Sacaba)
    """
    if lat >= -17.36 and lat <= -17.25 and lon >= -66.22 and lon <= -66.10:
        return "P.N. Tunari (Cota > 2750)"
    elif lat >= -17.48 and lat < -17.42 and lon >= -66.16 and lon <= -66.08:
        return "Zonas Periurbanas GAMC"
    elif lat >= -17.44 and lat < -17.36 and lon >= -66.22 and lon <= -66.11:
        return "Distritos Urbanos GAMC"
    else:
        return "Área Metropolitana Externa"

def filter_bounding_box(df: pd.DataFrame, lat_col="latitude", lon_col="longitude") -> pd.DataFrame:
    """Filtra puntos dentro del Bounding Box ampliado del valle de Cochabamba."""
    if df.empty or lat_col not in df.columns or lon_col not in df.columns:
        return pd.DataFrame()
    mask = (
        (df[lat_col] >= LAT_MIN) & (df[lat_col] <= LAT_MAX) &
        (df[lon_col] >= LON_MIN) & (df[lon_col] <= LON_MAX)
    )
    return df[mask].copy()

def filter_quality_and_confidence(df: pd.DataFrame, sensor_type: str, min_modis_conf=30) -> pd.DataFrame:
    """Filtra falsos positivos de calidad y confianza según semántica de cada sensor."""
    if df.empty:
        return df

    df = df.copy()
    if sensor_type.upper() == "MODIS":
        if "confidence" in df.columns:
            df["confidence_clean"] = pd.to_numeric(df["confidence"], errors="coerce").fillna(50)
            df = df[df["confidence_clean"] >= min_modis_conf]
    elif sensor_type.upper() == "VIIRS":
        if "confidence" in df.columns:
            conf_str = df["confidence"].astype(str).str.lower().str.strip()
            df = df[~conf_str.isin(["low", "l"])]

    if "frp" in df.columns:
        df["frp"] = pd.to_numeric(df["frp"], errors="coerce").fillna(1.0)
        df = df[df["frp"] >= 0]

    return df

def categorize_severity(frp: float) -> str:
    """Clasificación de severidad de fuego basada en Fire Radiative Power (MW)."""
    if frp < 15.0:
        return "BAJA"
    elif frp < 40.0:
        return "MEDIA"
    elif frp < 100.0:
        return "ALTA"
    else:
        return "CRÍTICA"

def categorize_alert(z_score: float) -> dict:
    """Clasificación de alerta municipal (UGR) según Z-Score."""
    if z_score <= 0.5:
        return {"level": "NORMAL", "color": "#10b981", "badge": "Verde", "desc": "Comportamiento dentro del rango histórico normal"}
    elif z_score <= 1.5:
        return {"level": "MODERADO", "color": "#f59e0b", "badge": "Amarillo", "desc": "Actividad térmica moderadamente elevada (Monitoreo preventivo)"}
    elif z_score <= 2.5:
        return {"level": "ALTO", "color": "#f97316", "badge": "Naranja", "desc": "Anomalía térmica significativa (Alerta para cuadrillas UGR)"}
    else:
        return {"level": "CRÍTICO", "color": "#ef4444", "badge": "Rojo", "desc": "Emergencia municipal: incendios superan drásticamente el récord histórico"}

def load_sensor_source(path_or_dir: str, sensor_type: str) -> pd.DataFrame:
    """Carga datos desde CSV o carpeta de CSVs anuales aplicando Bounding Box."""
    if not path_or_dir or not os.path.exists(path_or_dir):
        return pd.DataFrame()

    if os.path.isdir(path_or_dir):
        csv_files = sorted(glob.glob(os.path.join(path_or_dir, "*.csv")))
        print(f"    - Encontrados {len(csv_files)} CSVs en {path_or_dir}")
        dfs = []
        for f in csv_files:
            try:
                sub = pd.read_csv(f)
                filtered = filter_bounding_box(sub)
                print(f"      * {os.path.basename(f)}: {len(filtered)} detecciones en Tunari (de {len(sub)} en Bolivia)")
                dfs.append(filtered)
            except Exception as e:
                print(f"      [!] Error leyendo {f}: {e}")
        return pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()
    else:
        sub = pd.read_csv(path_or_dir)
        filtered = filter_bounding_box(sub)
        print(f"    - Archivo {os.path.basename(path_or_dir)}: {len(filtered)} detecciones en Tunari")
        return filtered

def convert_utc_to_bolivia_local(df: pd.DataFrame, sensor_name: str) -> pd.DataFrame:
    """Convierte acq_date y acq_time (UTC) a fecha y hora local de Bolivia (UTC-4)."""
    rows = []
    for _, r in df.iterrows():
        try:
            d_str = str(r["acq_date"]).strip()
            t_raw = r.get("acq_time", 0)
            t_str = f"{int(t_raw):04d}" if pd.notnull(t_raw) and str(t_raw).isdigit() else "1200"
            dt_utc = datetime.strptime(f"{d_str} {t_str}", "%Y-%m-%d %H%M")
            dt_local = dt_utc - timedelta(hours=4)
        except Exception:
            dt_local = datetime.strptime(str(r["acq_date"])[:10], "%Y-%m-%d")

        frp_val = float(r["frp"]) if pd.notnull(r.get("frp")) else 1.0
        rows.append({
            "acq_date_utc": str(r["acq_date"])[:10],
            "date_local": dt_local.strftime("%Y-%m-%d"),
            "time_local": dt_local.strftime("%H:%M"),
            "latitude": float(r["latitude"]),
            "longitude": float(r["longitude"]),
            "frp": max(frp_val, 0.1),
            "sensor": sensor_name,
            "confidence": str(r.get("confidence", "")),
            "daynight": str(r.get("daynight", "D"))
        })
    return pd.DataFrame(rows)

def process_fire_data(
    modis_source: str,
    viirs_source: str,
    output_dir: str = "backend/data/processed",
    frontend_copy_dirs: list[str] = None,
    cluster_radius_meters: float = 1200.0
):
    """
    Ejecuta el pipeline de armonización espacio-temporal por buffer de 1.2 km
    y cálculo de Z-Score climatológico.
    """
    if frontend_copy_dirs is None:
        frontend_copy_dirs = [
            "frontend/Hackathon2026/public/data",
            "frontend/vite-project/public/data"
        ]

    os.makedirs(output_dir, exist_ok=True)
    for fdir in frontend_copy_dirs:
        os.makedirs(fdir, exist_ok=True)

    print(f"[*] Ingestando datos fuente:\n    MODIS: {modis_source}\n    VIIRS: {viirs_source}")

    df_m_raw = load_sensor_source(modis_source, "MODIS")
    df_v_raw = load_sensor_source(viirs_source, "VIIRS")

    raw_dir = "backend/data/raw"
    os.makedirs(raw_dir, exist_ok=True)
    if not df_m_raw.empty:
        df_m_raw.to_csv(os.path.join(raw_dir, "fire_archive_M6.csv"), index=False)
    if not df_v_raw.empty:
        df_v_raw.to_csv(os.path.join(raw_dir, "fire_archive_V1.csv"), index=False)

    print(f"    Detecciones en Bounding Box -> MODIS: {len(df_m_raw)}, VIIRS: {len(df_v_raw)}")

    df_m = filter_quality_and_confidence(df_m_raw, "MODIS")
    df_v = filter_quality_and_confidence(df_v_raw, "VIIRS")

    # Conversión a tiempo local de Bolivia (UTC-4)
    df_m_loc = convert_utc_to_bolivia_local(df_m, "MODIS")
    df_v_loc = convert_utc_to_bolivia_local(df_v, "VIIRS")
    df_all_raw = pd.concat([df_m_loc, df_v_loc], ignore_index=True)

    if df_all_raw.empty:
        raise ValueError("No se encontraron detecciones válidas tras los filtros.")

    # Guardar versión cruda para comparativa (Auditoría del jurado)
    raw_records = []
    for _, r in df_all_raw.iterrows():
        raw_records.append({
            "id": f"raw_{r['sensor']}_{r['date_local']}_{round(r['latitude'], 3)}_{round(r['longitude'], 3)}",
            "date": r["date_local"],
            "time": r["time_local"],
            "lat": round(r["latitude"], 4),
            "lng": round(r["longitude"], 4),
            "frp": round(r["frp"], 1),
            "sensor": r["sensor"],
            "zone": classify_territorial_zone(r["latitude"], r["longitude"])
        })

    # --- 2. ARMONIZACIÓN ESPACIO-TEMPORAL POR BUFFER (1.2 km) ---
    print(f"[*] Ejecutando clustering espacial por proximidad ({cluster_radius_meters}m) en fechas locales...")

    harmonized_events = []
    for date_val, group in df_all_raw.groupby("date_local"):
        pts = group.to_dict("records")
        used = [False] * len(pts)

        for i in range(len(pts)):
            if used[i]:
                continue
            cluster = [pts[i]]
            used[i] = True

            for j in range(i + 1, len(pts)):
                if not used[j]:
                    # Verificar si el punto j está dentro del radio de algún punto del cluster
                    for c in cluster:
                        if distance_meters(pts[j]["latitude"], pts[j]["longitude"], c["latitude"], c["longitude"]) <= cluster_radius_meters:
                            cluster.append(pts[j])
                            used[j] = True
                            break

            # Consolidar cluster en 1 solo evento armonizado
            modis_count = sum(1 for p in cluster if p["sensor"] == "MODIS")
            viirs_count = sum(1 for p in cluster if p["sensor"] == "VIIRS")
            raw_count = len(cluster)

            frp_max = round(float(max(p["frp"] for p in cluster)), 1)
            frp_sum = round(float(sum(p["frp"] for p in cluster)), 1)

            # Centroide ponderado por calor (FRP)
            weights = [max(p["frp"], 0.1) for p in cluster]
            w_sum = sum(weights)
            lat_centroid = round(float(sum(p["latitude"] * w for p, w in zip(cluster, weights)) / w_sum), 4)
            lon_centroid = round(float(sum(p["longitude"] * w for p, w in zip(cluster, weights)) / w_sum), 4)

            # Etiqueta de corroboración satelital
            if modis_count > 0 and viirs_count > 0:
                sensor_label = "FUSIÓN (MODIS+VIIRS)"
                fusion_type = "AMBOS"
            elif modis_count > 0:
                sensor_label = "MODIS"
                fusion_type = "MODIS"
            else:
                sensor_label = "VIIRS"
                fusion_type = "VIIRS"

            zone = classify_territorial_zone(lat_centroid, lon_centroid)
            event_id = f"evt_{date_val}_{lat_centroid}_{lon_centroid}"

            harmonized_events.append({
                "id": event_id,
                "date": date_val,
                "lat": lat_centroid,
                "lng": lon_centroid,
                "frp_max": frp_max,
                "frp_sum": frp_sum,
                "raw_count": raw_count,
                "modis_count": modis_count,
                "viirs_count": viirs_count,
                "sensor": fusion_type,
                "sensor_label": sensor_label,
                "zone": zone,
                "severity": categorize_severity(frp_max)
            })

    df_grouped = pd.DataFrame(harmonized_events)
    df_grouped["acq_date"] = pd.to_datetime(df_grouped["date"])
    df_grouped["year"] = df_grouped["acq_date"].dt.year
    df_grouped["month"] = df_grouped["acq_date"].dt.month

    # --- 3. LÍNEA BASE Y Z-SCORE CLIMATOLÓGICO ---
    print("[*] Calculando Línea Base Histórica Climatológica y Z-Score...")

    monthly_harmonized = df_grouped.groupby(["year", "month"]).size().reset_index(name="eventos_armonizados")
    
    df_all_raw["acq_date"] = pd.to_datetime(df_all_raw["date_local"])
    df_all_raw["year"] = df_all_raw["acq_date"].dt.year
    df_all_raw["month"] = df_all_raw["acq_date"].dt.month
    monthly_raw = df_all_raw.groupby(["year", "month"]).size().reset_index(name="eventos_crudos")
    monthly_frp = df_grouped.groupby(["year", "month"])["frp_sum"].sum().reset_index(name="frp_total")

    min_year = int(df_all_raw["year"].min())
    max_year = int(df_all_raw["year"].max())
    max_date = df_all_raw["acq_date"].max()

    all_months = []
    for y in range(min_year, max_year + 1):
        for m in range(1, 13):
            if y == max_date.year and m > max_date.month:
                continue
            all_months.append({"year": y, "month": m})
    df_grid = pd.DataFrame(all_months)

    df_monthly = df_grid.merge(monthly_harmonized, on=["year", "month"], how="left").fillna(0)
    df_monthly = df_monthly.merge(monthly_raw, on=["year", "month"], how="left").fillna(0)
    df_monthly = df_monthly.merge(monthly_frp, on=["year", "month"], how="left").fillna(0)

    df_monthly["eventos_armonizados"] = df_monthly["eventos_armonizados"].astype(int)
    df_monthly["eventos_crudos"] = df_monthly["eventos_crudos"].astype(int)
    df_monthly["frp_total"] = df_monthly["frp_total"].round(1)

    baseline_cutoff = 2023 if max_year >= 2024 else max_year - 1
    baseline_period = df_monthly[df_monthly["year"] <= baseline_cutoff]

    stats = baseline_period.groupby("month")["eventos_armonizados"].agg(
        mu="mean",
        sigma="std",
        p50="median",
        p75=lambda x: np.percentile(x, 75),
        p90=lambda x: np.percentile(x, 90),
        max_hist="max"
    ).reset_index()

    stats["mu"] = stats["mu"].round(2)
    stats["sigma"] = stats["sigma"].round(2).replace(0, 1.0)
    stats["month_name"] = stats["month"].map(MONTH_NAMES)

    stats_raw = baseline_period.groupby("month")["eventos_crudos"].agg(
        mu_raw="mean",
        sigma_raw="std"
    ).reset_index()
    stats_raw["mu_raw"] = stats_raw["mu_raw"].round(2)
    stats_raw["sigma_raw"] = stats_raw["sigma_raw"].round(2).replace(0, 1.0)

    stats = stats.merge(stats_raw, on="month")

    df_calendar = df_monthly.merge(stats, on="month")
    df_calendar["z_score"] = ((df_calendar["eventos_armonizados"] - df_calendar["mu"]) / df_calendar["sigma"]).round(2)
    df_calendar["z_score_raw"] = ((df_calendar["eventos_crudos"] - df_calendar["mu_raw"]) / df_calendar["sigma_raw"]).round(2)

    alerts = df_calendar["z_score"].apply(categorize_alert)
    df_calendar["alert_level"] = [a["level"] for a in alerts]
    df_calendar["alert_color"] = [a["color"] for a in alerts]
    df_calendar["alert_badge"] = [a["badge"] for a in alerts]
    df_calendar["alert_desc"] = [a["desc"] for a in alerts]

    df_calendar = df_calendar.sort_values(["year", "month"]).reset_index(drop=True)

    # --- 4. EXPORTACIÓN DE ARCHIVOS JSON LIGEROS ---
    print("[*] Formateando y exportando JSONs estructurados para el Frontend...")

    map_records = df_grouped[[
        "id", "date", "lat", "lng", "frp_max", "frp_sum",
        "sensor", "sensor_label", "zone", "raw_count", "modis_count", "viirs_count", "severity"
    ]].to_dict(orient="records")

    geojson_features = []
    for r in map_records:
        geojson_features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [r["lng"], r["lat"]]
            },
            "properties": dict(r)
        })

    geojson_data = {
        "type": "FeatureCollection",
        "bbox": [LON_MIN, LAT_MIN, LON_MAX, LAT_MAX],
        "metadata": {
            "total_events": len(geojson_features),
            "generated_at": datetime.now().isoformat(),
            "region": "Parque Nacional Tunari & Cochabamba"
        },
        "features": geojson_features
    }

    calendar_cols = [
        "year", "month", "month_name", "eventos_armonizados", "eventos_crudos",
        "mu", "sigma", "z_score", "z_score_raw", "frp_total",
        "alert_level", "alert_color", "alert_badge", "alert_desc"
    ]
    calendar_records = df_calendar[calendar_cols].to_dict(orient="records")

    baseline_records = stats[[
        "month", "month_name", "mu", "sigma", "p50", "p75", "p90", "max_hist"
    ]].to_dict(orient="records")

    latest_month = df_calendar.iloc[-1]
    recent_events_30d = df_grouped[df_grouped["acq_date"] >= (df_grouped["acq_date"].max() - pd.Timedelta(days=30))]

    alerta_actual = {
        "fecha_corte": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "mes_evaluado": f"{latest_month['month_name']} {latest_month['year']}",
        "eventos_armonizados_mes": int(latest_month["eventos_armonizados"]),
        "promedio_historico_mu": float(latest_month["mu"]),
        "desviacion_sigma": float(latest_month["sigma"]),
        "z_score": float(latest_month["z_score"]),
        "semaforo": {
            "nivel": latest_month["alert_level"],
            "color": latest_month["alert_color"],
            "badge": latest_month["alert_badge"],
            "descripcion": latest_month["alert_desc"]
        },
        "ultimos_30_dias": {
            "total_focos_armonizados": len(recent_events_30d),
            "total_detecciones_crudas": int(recent_events_30d["raw_count"].sum()) if not recent_events_30d.empty else 0,
            "frp_maximo": float(recent_events_30d["frp_max"].max()) if not recent_events_30d.empty else 0.0
        },
        "sesgo_evitado": {
            "z_score_sin_armonizar": float(latest_month["z_score_raw"]),
            "explicacion": "Sin armonización espacial, el exceso de píxeles de VIIRS generaría una falsa alarma inflada."
        }
    }

    files_written = {}
    file_map = {
        "historial_limpio_mapa.json": map_records,
        "historial_crudo_mapa.json": raw_records,
        "historial_limpio_mapa.geojson": geojson_data,
        "calendario_termico.json": calendar_records,
        "baseline_mensual.json": baseline_records,
        "alerta_actual.json": alerta_actual
    }

    for fname, data in file_map.items():
        out_path = os.path.join(output_dir, fname)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        files_written[fname] = out_path

        for fdir in frontend_copy_dirs:
            front_path = os.path.join(fdir, fname)
            shutil.copyfile(out_path, front_path)

    print("\n[OK] PIPELINE COMPLETADO CON EXITO")
    print(f"    - Detecciones crudas: {len(df_all_raw)}")
    print(f"    - Eventos armonizados (Buffer 1.2km): {len(df_grouped)} (Reducción de redundancia: {round((1 - len(df_grouped)/len(df_all_raw))*100, 1)}%)")
    print("    - Desglose por zona municipal:")
    for zone_name, cnt in df_grouped["zone"].value_counts().items():
        print(f"      * {zone_name}: {cnt} eventos")
    print(f"    - Archivos generados en {output_dir}/ y carpetas de frontend:")
    for fname in files_written:
        print(f"      * {fname}")

    return {
        "total_raw": len(df_all_raw),
        "total_harmonized": len(df_grouped),
        "reduction_pct": round((1 - len(df_grouped)/len(df_all_raw))*100, 1),
        "output_files": list(files_written.keys())
    }

if __name__ == "__main__":
    import sys
    modis_input = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Usuario\Downloads\modisBolivia2020-2025"
    viirs_input = sys.argv[2] if len(sys.argv) > 2 else r"C:\Users\Usuario\Downloads\viirsBolivia2020-2025"

    if not os.path.exists(modis_input):
        modis_input = "backend/data/raw/fire_archive_M6.csv"
    if not os.path.exists(viirs_input):
        viirs_input = "backend/data/raw/fire_archive_V1.csv"

    process_fire_data(modis_input, viirs_input)
