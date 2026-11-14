import pandas as pd
import numpy as np
from datetime import datetime, timedelta

df_m = pd.read_csv('backend/data/raw/fire_archive_M6.csv')
df_v = pd.read_csv('backend/data/raw/fire_archive_V1.csv')

# Convert UTC date + time to local Bolivia time (UTC - 4)
def to_local_datetime(df):
    datetimes = []
    for _, row in df.iterrows():
        d_str = str(row['acq_date'])
        t_str = f"{int(row['acq_time']):04d}"
        dt = datetime.strptime(f"{d_str} {t_str}", "%Y-%m-%d %H%M")
        dt_local = dt - timedelta(hours=4)
        datetimes.append(dt_local)
    df = df.copy()
    df['datetime_local'] = datetimes
    df['date_local'] = [dt.strftime('%Y-%m-%d') for dt in datetimes]
    return df

df_m_loc = to_local_datetime(df_m)
df_v_loc = to_local_datetime(df_v)

print(f"MODIS rows: {len(df_m_loc)}, VIIRS rows: {len(df_v_loc)}")

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2.0)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2.0)**2
    return 2.0 * R * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))

matches = []
for d in sorted(set(df_m_loc['date_local'])):
    sub_m = df_m_loc[df_m_loc['date_local'] == d]
    sub_v = df_v_loc[df_v_loc['date_local'] == d]
    if sub_v.empty:
        continue
    for _, rm in sub_m.iterrows():
        for _, rv in sub_v.iterrows():
            dist = haversine(rm['latitude'], rm['longitude'], rv['latitude'], rv['longitude'])
            if dist <= 1.2: # within 1.2 km
                matches.append({
                    'date': d,
                    'dist_km': round(dist, 2),
                    'm_lat': rm['latitude'], 'm_lon': rm['longitude'], 'm_frp': rm['frp'],
                    'v_lat': rv['latitude'], 'v_lon': rv['longitude'], 'v_frp': rv['frp']
                })

df_matches = pd.DataFrame(matches)
print(f"Total distance matches within 1.2 km: {len(df_matches)}")
if not df_matches.empty:
    print(df_matches.head(10))
