import pandas as pd
import numpy as np
from datetime import datetime, timedelta

df_m = pd.read_csv('backend/data/raw/fire_archive_M6.csv')
df_v = pd.read_csv('backend/data/raw/fire_archive_V1.csv')

def to_local(df, sensor):
    rows = []
    for _, r in df.iterrows():
        d_str = str(r['acq_date'])
        t_str = f"{int(r['acq_time']):04d}"
        dt = datetime.strptime(f"{d_str} {t_str}", "%Y-%m-%d %H%M") - timedelta(hours=4)
        rows.append({
            'date': dt.strftime('%Y-%m-%d'),
            'lat': r['latitude'],
            'lon': r['longitude'],
            'frp': float(r['frp']) if pd.notnull(r['frp']) else 1.0,
            'confidence': str(r.get('confidence', '')),
            'sensor': sensor,
            'time': dt.strftime('%H:%M')
        })
    return pd.DataFrame(rows)

df_all = pd.concat([to_local(df_m, 'MODIS'), to_local(df_v, 'VIIRS')], ignore_index=True)

def distance_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp, dl = np.radians(lat2 - lat1), np.radians(lon2 - lon1)
    a = np.sin(dp/2)**2 + np.cos(p1)*np.cos(p2)*np.sin(dl/2)**2
    return 2.0 * R * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))

def classify_zone(lat, lon):
    # Tunari Cota > 2750: Northern mountain boundary within municipality
    if lat >= -17.36 and lat <= -17.25 and lon >= -66.22 and lon <= -66.10:
        return 'P.N. Tunari (Cota > 2750)'
    elif lat >= -17.48 and lat < -17.42 and lon >= -66.16 and lon <= -66.08:
        return 'Zonas Periurbanas GAMC'
    elif lat >= -17.44 and lat < -17.36 and lon >= -66.22 and lon <= -66.11:
        return 'Distritos Urbanos GAMC'
    else:
        return 'Área Metropolitana Externa (Quillacollo/Sacaba)'

events = []
for d, group in df_all.groupby('date'):
    pts = group.to_dict('records')
    used = [False] * len(pts)
    for i in range(len(pts)):
        if used[i]:
            continue
        cluster = [pts[i]]
        used[i] = True
        for j in range(i + 1, len(pts)):
            if not used[j]:
                for c in cluster:
                    if distance_m(pts[j]['lat'], pts[j]['lon'], c['lat'], c['lon']) <= 1200:
                        cluster.append(pts[j])
                        used[j] = True
                        break
        modis_c = sum(1 for p in cluster if p['sensor'] == 'MODIS')
        viirs_c = sum(1 for p in cluster if p['sensor'] == 'VIIRS')
        frp_max = max(p['frp'] for p in cluster)
        frp_sum = sum(p['frp'] for p in cluster)
        w_sum = sum(max(p['frp'], 0.1) for p in cluster)
        c_lat = sum(p['lat'] * max(p['frp'], 0.1) for p in cluster) / w_sum
        c_lon = sum(p['lon'] * max(p['frp'], 0.1) for p in cluster) / w_sum

        lbl = 'FUSIÓN (MODIS+VIIRS)' if (modis_c > 0 and viirs_c > 0) else ('MODIS' if modis_c > 0 else 'VIIRS')
        zone = classify_zone(c_lat, c_lon)

        events.append({
            'date': d,
            'lat': round(c_lat, 4),
            'lon': round(c_lon, 4),
            'frp_max': round(frp_max, 1),
            'frp_sum': round(frp_sum, 1),
            'sensor': lbl,
            'zone': zone,
            'raw_count': len(cluster),
            'modis_count': modis_c,
            'viirs_count': viirs_c
        })

df_ev = pd.DataFrame(events)
print("Eventos por zona:")
print(df_ev['zone'].value_counts())
print("\nSensores en P.N. Tunari (Cota > 2750):")
print(df_ev[df_ev['zone'] == 'P.N. Tunari (Cota > 2750)']['sensor'].value_counts())
