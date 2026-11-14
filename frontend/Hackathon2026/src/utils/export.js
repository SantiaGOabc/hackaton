/**
 * Utilidades para exportación de datos en formatos CSV y GeoJSON
 */

export function exportFiresToCSV(fires, year = 'ALL', month = 'ALL') {
  if (!fires || fires.length === 0) return;
  const headers = ['id', 'date', 'lat', 'lng', 'frp_max', 'frp_sum', 'sensor', 'raw_count', 'severity'];
  const rows = fires.map((f) => [
    f.id, f.date, f.lat, f.lng, f.frp_max, f.frp_sum, f.sensor, f.raw_count, f.severity
  ]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `focos_armonizados_tunari_${year}_${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFiresToGeoJSON(fires, year = 'ALL', month = 'ALL') {
  if (!fires || fires.length === 0) return;
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      total: fires.length,
      exported_at: new Date().toISOString(),
      challenge: 'NASA Space Apps 2026 - Tunari Fire Watch GAMC'
    },
    features: fires.map((f) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
      properties: { ...f }
    }))
  };
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `focos_armonizados_tunari_${year}_${month}.geojson`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
