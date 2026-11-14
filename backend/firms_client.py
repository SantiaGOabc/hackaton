"""
Cliente de Ingesta NRT (Near Real-Time) de NASA FIRMS para Cochabamba / Tunari
Soporta:
1. Feeds públicos abiertos de Sudamérica (24h / 7d) sin requerir API Key.
2. API oficial FIRMS por Bounding Box cuando se provee MAP_KEY.
"""

import os
import io
import requests
import pandas as pd
from datetime import datetime

LAT_MIN = -17.53119
LAT_MAX = -17.257306
LON_MIN = -66.280703
LON_MAX = -66.06952

# Endpoints públicos de NASA FIRMS (Sudamérica)
NRT_URLS = {
    "MODIS_24H": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_America_24h.csv",
    "MODIS_7D": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_America_7d.csv",
    "VIIRS_J1_24H": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_24h.csv",
    "VIIRS_J1_7D": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_7d.csv",
    "VIIRS_J2_7D": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_America_7d.csv",
    "VIIRS_SNPP_24H": "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_America_24h.csv"
}

def fetch_csv_from_url(url: str, timeout: int = 15) -> pd.DataFrame:
    """Descarga un CSV desde una URL pública de NASA FIRMS."""
    try:
        resp = requests.get(url, timeout=timeout)
        if resp.status_code == 200 and len(resp.text.strip()) > 0:
            return pd.read_csv(io.StringIO(resp.text))
        else:
            print(f"[!] Aviso: {url} retorno codigo {resp.status_code}")
            return pd.DataFrame()
    except Exception as e:
        print(f"[!] Error descargando {url}: {e}")
        return pd.DataFrame()

def fetch_nrt_open_feeds(window="7d") -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Descarga los feeds NRT de Sudamérica y filtra inmediatamente por el Bounding Box del Tunari.
    Retorna (df_modis_tunari, df_viirs_tunari).
    """
    print(f"[*] Consultando NASA FIRMS NRT Open Feeds ({window})...")

    # MODIS
    modis_url = NRT_URLS["MODIS_7D"] if window == "7d" else NRT_URLS["MODIS_24H"]
    df_modis_sa = fetch_csv_from_url(modis_url)
    
    # VIIRS (combinar NOAA-20 y NOAA-21 para máxima cobertura)
    viirs_j1_url = NRT_URLS["VIIRS_J1_7D"] if window == "7d" else NRT_URLS["VIIRS_J1_24H"]
    df_viirs_j1 = fetch_csv_from_url(viirs_j1_url)
    
    df_viirs_j2 = fetch_csv_from_url(NRT_URLS["VIIRS_J2_7D"]) if window == "7d" else pd.DataFrame()
    df_viirs_sa = pd.concat([df_viirs_j1, df_viirs_j2], ignore_index=True)

    # Filtrar Bounding Box Tunari / Cochabamba
    def apply_bbox(df):
        if df.empty or "latitude" not in df.columns or "longitude" not in df.columns:
            return pd.DataFrame()
        mask = (
            (df["latitude"] >= LAT_MIN) & (df["latitude"] <= LAT_MAX) &
            (df["longitude"] >= LON_MIN) & (df["longitude"] <= LON_MAX)
        )
        return df[mask].copy()

    df_modis_tunari = apply_bbox(df_modis_sa)
    df_viirs_tunari = apply_bbox(df_viirs_sa)

    print(f"    - NRT MODIS en Tunari: {len(df_modis_tunari)} detecciones")
    print(f"    - NRT VIIRS en Tunari: {len(df_viirs_tunari)} detecciones")

    return df_modis_tunari, df_viirs_tunari

def fetch_firms_api_area(map_key: str, source: str = "VIIRS_NOAA20_NRT", day_range: int = 1) -> pd.DataFrame:
    """
    Consulta la API oficial de FIRMS si el usuario tiene una MAP_KEY registrada.
    Coords: west,south,east,north
    """
    coords = f"{LON_MIN},{LAT_MIN},{LON_MAX},{LAT_MAX}"
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source}/{coords}/{day_range}"
    return fetch_csv_from_url(url)

if __name__ == "__main__":
    df_m, df_v = fetch_nrt_open_feeds(window="7d")
    print(f"[OK] Ingesta NRT completada. Total detecciones recientes en Tunari: {len(df_m) + len(df_v)}")
