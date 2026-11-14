/**
 * Servicio de consulta espacial WMS GetFeatureInfo del GAMC
 */
import L from 'leaflet';
import { GAMC_WMS_URL, GAMC_SERVICE_KEY, GAMC_LAYERS } from '../constants/gamc';

export async function queryDistrictFeatureInfo(map, latlng) {
  const point = map.project(latlng, map.getZoom());
  const size = map.getSize();
  const bounds = map.getBounds();
  const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
  const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
  const bboxStr = `${sw.x},${sw.y},${ne.x},${ne.y}`;

  const params = new URLSearchParams({
    key: GAMC_SERVICE_KEY,
    service_id: GAMC_LAYERS.DISTRITOS.service_id,
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    SRS: 'EPSG:3857',
    BBOX: bboxStr,
    WIDTH: String(Math.round(size.x)),
    HEIGHT: String(Math.round(size.y)),
    X: String(Math.round(point.x - map.getPixelBounds().min.x)),
    Y: String(Math.round(point.y - map.getPixelBounds().min.y)),
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '5'
  });

  const res = await fetch(`${GAMC_WMS_URL}?${params}`);
  if (!res.ok) throw new Error('Error en consulta GetFeatureInfo');
  const data = await res.json();
  const feat = data?.features?.[0];

  return {
    lat: latlng.lat.toFixed(4),
    lng: latlng.lng.toFixed(4),
    distrito: feat?.properties?.Distrito || 'Parque Nacional Tunari (Cota > 2750)',
    comuna: feat?.properties?.Comuna || 'Área Protegida Municipal'
  };
}
