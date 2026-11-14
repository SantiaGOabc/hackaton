"""
Generador de Datos Sintéticos Realistas para el Parque Nacional Tunari (Cochabamba)
Periodo: 2000 - 2026
Simula el sesgo de sensor real (MODIS vs VIIRS) y la estacionalidad de incendios de Cochabamba.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

LAT_MIN = -17.53119
LAT_MAX = -17.257306
LON_MIN = -66.280703
LON_MAX = -66.06952

# Estacionalidad típica de incendios en Cochabamba (pico entre julio y noviembre)
# Mes: factor relativo de incidencia
SEASONAL_WEIGHTS = {
    1: 0.05, 2: 0.03, 3: 0.04, 4: 0.08, 5: 0.15, 6: 0.40,
    7: 0.85, 8: 1.00, 9: 0.95, 10: 0.70, 11: 0.45, 12: 0.12
}

def generate_tunari_benchmark(output_dir="backend/data/raw"):
    os.makedirs(output_dir, exist_ok=True)
    np.random.seed(42)

    modis_rows = []
    viirs_rows = []

    start_date = datetime(2000, 11, 1)
    end_date = datetime(2026, 11, 14)

    current_date = start_date
    while current_date <= end_date:
        year = current_date.year
        month = current_date.month
        base_prob = SEASONAL_WEIGHTS[month]

        # Simular algunos años anómalos graves (ej. 2010 sequía severa, 2019, 2024 El Niño)
        anomaly_factor = 1.0
        if year in [2010, 2019, 2020, 2024]:
            anomaly_factor = 1.8
        elif year in [2014, 2018]:
            anomaly_factor = 0.6

        # Probabilidad de incendios hoy en el Tunari
        daily_fire_events = np.random.poisson(lam=base_prob * anomaly_factor * 0.8)

        for _ in range(daily_fire_events):
            # Coordenadas aleatorias dentro del bbox del Parque Tunari
            center_lat = np.random.uniform(LAT_MIN, LAT_MAX)
            center_lon = np.random.uniform(LON_MIN, LON_MAX)
            date_str = current_date.strftime("%Y-%m-%d")
            time_str = f"{np.random.randint(10, 19):02d}{np.random.randint(0, 59):02d}"
            daynight = "D" if int(time_str[:2]) < 18 else "N"

            # 1. Detección MODIS (siempre activa 2000-2026, resolución 1km, 1 píxel por foco)
            # Probabilidad de detección MODIS ~ 80% (depende de nubes y sobrepaso)
            if np.random.rand() < 0.82:
                modis_lat = center_lat + np.random.normal(0, 0.003)
                modis_lon = center_lon + np.random.normal(0, 0.003)
                frp = float(np.round(np.random.exponential(scale=18.0) + 5.0, 1))
                brightness = float(np.round(300 + frp * 1.5 + np.random.normal(0, 5), 1))
                confidence = int(np.random.choice([np.random.randint(45, 95), np.random.randint(15, 35)], p=[0.85, 0.15]))

                modis_rows.append({
                    "latitude": round(modis_lat, 5),
                    "longitude": round(modis_lon, 5),
                    "brightness": brightness,
                    "scan": 1.1,
                    "track": 1.0,
                    "acq_date": date_str,
                    "acq_time": time_str,
                    "satellite": "Terra" if np.random.rand() > 0.5 else "Aqua",
                    "instrument": "MODIS",
                    "confidence": confidence,
                    "version": "6.1NRT",
                    "bright_t31": round(brightness - 15, 1),
                    "frp": frp,
                    "daynight": daynight
                })

            # 2. Detección VIIRS (activa desde 2012, píxeles de 375m, genera múltiples detecciones por evento)
            if year >= 2012:
                # Cada foco físico de 1km es detectado por 2 a 6 píxeles VIIRS adyacentes!
                n_viirs_pixels = np.random.randint(2, 6)
                for _v in range(n_viirs_pixels):
                    v_lat = center_lat + np.random.normal(0, 0.002)
                    v_lon = center_lon + np.random.normal(0, 0.002)
                    v_frp = float(np.round(np.random.exponential(scale=10.0) + 2.0, 1))
                    v_ti4 = float(np.round(315 + v_frp * 1.8 + np.random.normal(0, 4), 1))
                    v_conf = np.random.choice(["nominal", "high", "low"], p=[0.65, 0.30, 0.05])

                    viirs_rows.append({
                        "latitude": round(v_lat, 5),
                        "longitude": round(v_lon, 5),
                        "bright_ti4": v_ti4,
                        "scan": 0.4,
                        "track": 0.4,
                        "acq_date": date_str,
                        "acq_time": time_str,
                        "satellite": "N" if year < 2018 else np.random.choice(["N", "J1", "J2"]),
                        "instrument": "VIIRS",
                        "confidence": v_conf,
                        "version": "2.0NRT",
                        "bright_ti5": round(v_ti4 - 20, 1),
                        "frp": v_frp,
                        "daynight": daynight
                    })

        current_date += timedelta(days=1)

    df_modis = pd.DataFrame(modis_rows)
    df_viirs = pd.DataFrame(viirs_rows)

    modis_path = os.path.join(output_dir, "fire_archive_M6.csv")
    viirs_path = os.path.join(output_dir, "fire_archive_V1.csv")

    df_modis.to_csv(modis_path, index=False)
    df_viirs.to_csv(viirs_path, index=False)

    print(f"[OK] Generado {len(df_modis)} registros MODIS en {modis_path}")
    print(f"[OK] Generado {len(df_viirs)} registros VIIRS en {viirs_path}")
    return modis_path, viirs_path

if __name__ == "__main__":
    generate_tunari_benchmark()
