import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import {
  Flame,
  ShieldAlert,
  Layers,
  Calendar,
  Activity,
  Info,
  RefreshCw,
  Sliders,
  MapPin,
  TrendingUp,
  Cpu,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Server,
  Download,
  Compass,
  Radio,
  FileSpreadsheet,
  FileJson,
  Navigation,
  FileText
} from 'lucide-react';

// Credenciales y URLs oficiales de los servicios WMS del GAMC
const GAMC_WMS_URL = 'https://serviciosgamc.cochabamba.bo/api/gs/wms';
const GAMC_SERVICE_KEY = '8da30122933ced2174ebe3e8b03198731d9cae6dc3230d32';

const GAMC_LAYERS = {
  COTA_2750: {
    id: 'cota2750',
    title: 'Cota 2750 (Límite P.N. Tunari)',
    service_id: '297cefa4-0832-42bb-a98e-2cbea989fd9d',
    color: '#06b6d4',
    badge: 'Protección Ambiental'
  },
  PERIURBANO: {
    id: 'periurbano',
    title: 'Zonas Periurbanas GAMC',
    service_id: 'c52066a1-32fd-4925-81e0-c2dcb8f4238f',
    color: '#eab308',
    badge: 'Interfaz Urbano-Forestal'
  },
  DISTRITOS: {
    id: 'distritos',
    title: 'Límites 15 Distritos',
    service_id: '7eb13092-bf0e-493b-aae6-03c43eedda2c',
    color: '#a855f7',
    badge: 'Cartografía Oficial GAMC'
  }
};

const GAMC_DISTRITOS = [
  { id: 'ALL', name: 'Todos los Distritos' },
  { id: 'D1', name: 'Distrito 1 (Aranjuez / Cota 2750)', zona: 'Tunari Norte' },
  { id: 'D2', name: 'Distrito 2 (Cala Cala / Temporal)', zona: 'Tunari Norte' },
  { id: 'D3', name: 'Distrito 3 (Sarco / Coña Coña)', zona: 'Tunari Noroeste' },
  { id: 'D4', name: 'Distrito 4 (Coboce / Jaihuayco)', zona: 'Urbano Oeste' },
  { id: 'D5', name: 'Distrito 5 (Chimba / Alalay)', zona: 'Urbano Centro' },
  { id: 'D6', name: 'Distrito 6 (San Miguel)', zona: 'Urbano Sur' },
  { id: 'D7', name: 'Distrito 7 (Tamborada)', zona: 'Periurbano Sur' },
  { id: 'D8', name: 'Distrito 8 (K\'ara K\'ara)', zona: 'Periurbano Sur' },
  { id: 'D9', name: 'Distrito 9 (Valle Hermoso / Albarrancho)', zona: 'Periurbano Sur' },
  { id: 'D10', name: 'Distrito 10 (Centro Histórico)', zona: 'Urbano Central' },
  { id: 'D11', name: 'Distrito 11 (Las Cuadras / Muyurina)', zona: 'Urbano Este' },
  { id: 'D12', name: 'Distrito 12 (San Pedro / Adela Zamudio)', zona: 'Tunari Norte' },
  { id: 'D13', name: 'Distrito 13 (Taquiña / Linkhu Pata / Tunari)', zona: 'Tunari Central' },
  { id: 'D14', name: 'Distrito 14 (Uspha Uspha)', zona: 'Periurbano Sudeste' },
  { id: 'D15', name: 'Distrito 15 (Pampa San Miguel)', zona: 'Periurbano Sudeste' }
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function App() {
  // Navigation: 'map', 'calendar', 'patrol', 'architecture'
  const [activeTab, setActiveTab] = useState('map');

  // Data states
  const [fires, setFires] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [baselineData, setBaselineData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedSensor, setSelectedSensor] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedDistrito, setSelectedDistrito] = useState('ALL');
  const [minFrp, setMinFrp] = useState(0);

  // WMS Layer Toggles
  const [layerCota, setLayerCota] = useState(true);
  const [layerPeriurbano, setLayerPeriurbano] = useState(true);
  const [layerDistritos, setLayerDistritos] = useState(true);
  const [baseMapType, setBaseMapType] = useState('satellite');

  // Map Feature Info Click Inspection
  const [clickedFeature, setClickedFeature] = useState(null);
  const [queryingWMS, setQueryingWMS] = useState(false);

  // Leaflet Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fireMarkersGroupRef = useRef(null);
  const wmsCotaRef = useRef(null);
  const wmsPeriurbanoRef = useRef(null);
  const wmsDistritosRef = useRef(null);
  const baseTileRef = useRef(null);

  // Load Data from public JSONs
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [resFires, resCal, resAlert, resBase] = await Promise.all([
          fetch('/data/historial_limpio_mapa.json').then((r) => r.json()),
          fetch('/data/calendario_termico.json').then((r) => r.json()),
          fetch('/data/alerta_actual.json').then((r) => r.json()),
          fetch('/data/baseline_mensual.json').then((r) => r.json())
        ]);

        setFires(resFires || []);
        setCalendarData(resCal || []);
        setCurrentAlert(resAlert || null);
        setBaselineData(resBase || []);
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (activeTab !== 'map' || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      // Coordenadas Parque Nacional Tunari / Cochabamba
      const map = L.map(mapRef.current, {
        center: [-17.34, -66.18],
        zoom: 12,
        zoomControl: true
      });

      // Capa base satelital Esri
      const baseTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri & NASA Earthdata', maxZoom: 19 }
      ).addTo(map);
      baseTileRef.current = baseTile;

      // Capas WMS del GAMC
      const cotaWms = L.tileLayer.wms(GAMC_WMS_URL, {
        key: GAMC_SERVICE_KEY,
        service_id: GAMC_LAYERS.COTA_2750.service_id,
        layers: '',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        maxZoom: 19,
        opacity: 0.85
      }).addTo(map);
      wmsCotaRef.current = cotaWms;

      const periurbanoWms = L.tileLayer.wms(GAMC_WMS_URL, {
        key: GAMC_SERVICE_KEY,
        service_id: GAMC_LAYERS.PERIURBANO.service_id,
        layers: '',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        maxZoom: 19,
        opacity: 0.75
      }).addTo(map);
      wmsPeriurbanoRef.current = periurbanoWms;

      const distritosWms = L.tileLayer.wms(GAMC_WMS_URL, {
        key: GAMC_SERVICE_KEY,
        service_id: GAMC_LAYERS.DISTRITOS.service_id,
        layers: '',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        maxZoom: 19,
        opacity: 0.65
      }).addTo(map);
      wmsDistritosRef.current = distritosWms;

      // Grupo de marcadores de fuego
      const markersGroup = L.layerGroup().addTo(map);
      fireMarkersGroupRef.current = markersGroup;

      // Evento Click para GetFeatureInfo en WMS GAMC
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        setQueryingWMS(true);
        try {
          const point = map.project(e.latlng, map.getZoom());
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
          const data = await res.json();
          const feat = data?.features?.[0];

          setClickedFeature({
            lat: lat.toFixed(4),
            lng: lng.toFixed(4),
            distrito: feat?.properties?.Distrito || 'Parque Nacional Tunari (Cota > 2750)',
            comuna: feat?.properties?.Comuna || 'Área Protegida Municipal'
          });
        } catch (err) {
          setClickedFeature({
            lat: lat.toFixed(4),
            lng: lng.toFixed(4),
            distrito: 'Parque Nacional Tunari',
            comuna: 'GAMC UGR'
          });
        } finally {
          setQueryingWMS(false);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
  }, [activeTab]);

  // Update Base Map Tile
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileRef.current) return;
    mapInstanceRef.current.removeLayer(baseTileRef.current);

    let url = '';
    let attr = '';
    if (baseMapType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attr = '&copy; Esri & NASA Worldview';
    } else if (baseMapType === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attr = '&copy; CartoDB Dark Matter';
    } else {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attr = '&copy; OpenStreetMap';
    }

    const newTile = L.tileLayer(url, { attribution: attr, maxZoom: 19 }).addTo(mapInstanceRef.current);
    baseTileRef.current = newTile;
    newTile.bringToBack();
  }, [baseMapType]);

  // Update WMS Layers Visibility
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (wmsCotaRef.current) {
      if (layerCota) {
        if (!map.hasLayer(wmsCotaRef.current)) map.addLayer(wmsCotaRef.current);
      } else {
        if (map.hasLayer(wmsCotaRef.current)) map.removeLayer(wmsCotaRef.current);
      }
    }
    if (wmsPeriurbanoRef.current) {
      if (layerPeriurbano) {
        if (!map.hasLayer(wmsPeriurbanoRef.current)) map.addLayer(wmsPeriurbanoRef.current);
      } else {
        if (map.hasLayer(wmsPeriurbanoRef.current)) map.removeLayer(wmsPeriurbanoRef.current);
      }
    }
    if (wmsDistritosRef.current) {
      if (layerDistritos) {
        if (!map.hasLayer(wmsDistritosRef.current)) map.addLayer(wmsDistritosRef.current);
      } else {
        if (map.hasLayer(wmsDistritosRef.current)) map.removeLayer(wmsDistritosRef.current);
      }
    }
  }, [layerCota, layerPeriurbano, layerDistritos]);

  // Filtered fires
  const filteredFires = useMemo(() => {
    return fires.filter((f) => {
      const parts = f.date.split('-');
      const y = parts[0];
      const m = parseInt(parts[1], 10);

      if (selectedYear !== 'ALL' && y !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && m !== parseInt(selectedMonth, 10)) return false;
      if (selectedSensor !== 'ALL' && f.sensor.toUpperCase() !== selectedSensor.toUpperCase()) return false;
      if (selectedSeverity !== 'ALL' && f.severity.toUpperCase() !== selectedSeverity.toUpperCase()) return false;
      if (minFrp > 0 && f.frp_max < minFrp) return false;
      return true;
    });
  }, [fires, selectedYear, selectedMonth, selectedSensor, selectedSeverity, minFrp]);

  // Render Markers on Map
  useEffect(() => {
    if (!fireMarkersGroupRef.current) return;
    const group = fireMarkersGroupRef.current;
    group.clearLayers();

    filteredFires.forEach((f) => {
      let color = '#f97316';
      if (f.sensor === 'AMBOS') color = '#a855f7';
      else if (f.sensor === 'VIIRS') color = '#ef4444';
      else if (f.sensor === 'MODIS') color = '#f59e0b';

      let radius = 5;
      if (f.severity === 'CRÍTICA') radius = 9;
      else if (f.severity === 'ALTA') radius = 7;
      else if (f.severity === 'MEDIA') radius = 5;
      else radius = 4;

      const marker = L.circleMarker([f.lat, f.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.82,
        weight: 1.5
      });

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px; color: #1e293b;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-bottom:6px;">
            <strong style="font-size:13px; color:#0f172a;">Foco Armonizado (1x1 km)</strong>
            <span style="font-size:10px; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:${color};">${f.sensor}</span>
          </div>
          <div style="font-size:11px; line-height:1.5;">
            <div><b>Fecha:</b> ${f.date}</div>
            <div><b>Potencia Térmica (FRP):</b> ${f.frp_max} MW</div>
            <div><b>Severidad:</b> ${f.severity}</div>
            <div><b>Píxeles Crudos Colapsados:</b> ${f.raw_count} (${f.modis_count} MODIS, ${f.viirs_count} VIIRS)</div>
            <div style="margin-top:4px; color:#64748b; font-size:10px;">Lat: ${f.lat} | Lng: ${f.lng}</div>
          </div>
        </div>
      `);

      group.addLayer(marker);
    });
  }, [filteredFires]);

  // Export functions (CSV & GeoJSON)
  const exportToCSV = () => {
    if (!filteredFires.length) return;
    const headers = ['id', 'date', 'lat', 'lng', 'frp_max', 'frp_sum', 'sensor', 'raw_count', 'severity'];
    const rows = filteredFires.map((f) => [
      f.id, f.date, f.lat, f.lng, f.frp_max, f.frp_sum, f.sensor, f.raw_count, f.severity
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `focos_armonizados_tunari_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToGeoJSON = () => {
    if (!filteredFires.length) return;
    const geojson = {
      type: 'FeatureCollection',
      metadata: {
        total: filteredFires.length,
        exported_at: new Date().toISOString(),
        challenge: 'NASA Space Apps 2026 - Tunari Fire Watch'
      },
      features: filteredFires.map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
        properties: { ...f }
      }))
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `focos_armonizados_tunari_${selectedYear}_${selectedMonth}.geojson`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick stats
  const stats = useMemo(() => {
    const totalHarmonized = fires.length;
    const totalRaw = fires.reduce((acc, f) => acc + (f.raw_count || 1), 0);
    const reduction = totalRaw > 0 ? Math.round((1 - totalHarmonized / totalRaw) * 100) : 0;
    return { totalHarmonized, totalRaw, reduction };
  }, [fires]);

  // Matrix Calendar Table Helper
  const calendarMatrix = useMemo(() => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const mapByYearMonth = {};
    calendarData.forEach((item) => {
      mapByYearMonth[`${item.year}_${item.month}`] = item;
    });
    return { years, mapByYearMonth };
  }, [calendarData]);

  const jumpToMonthOnMap = (year, month) => {
    setSelectedYear(String(year));
    setSelectedMonth(String(month));
    setActiveTab('map');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Flame size={22} />
          </div>
          <div>
            <div className="brand-title">
              TUNARI <span>FIRE WATCH</span>
              <span className="brand-tag">GAMC & NASA Space Apps</span>
            </div>
            <div className="brand-subtitle">
              Armonización MODIS/VIIRS (2000-2026) | P.N. Tunari (Cota 2750) & 15 Distritos
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <MapPin size={15} /> Visor Geoespacial WMS
          </button>
          <button
            className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={15} /> Calendario en Llamas (Z-Score)
          </button>
          <button
            className={`nav-tab ${activeTab === 'patrol' ? 'active' : ''}`}
            onClick={() => setActiveTab('patrol')}
          >
            <Compass size={15} /> Patrullaje UGR & Distritos
          </button>
          <button
            className={`nav-tab ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveTab('architecture')}
          >
            <Cpu size={15} /> Arquitectura & Escalabilidad
          </button>
        </div>

        {/* Header Badges */}
        <div className="header-actions">
          {currentAlert && (
            <div
              className="status-badge"
              style={{
                borderColor: currentAlert.semaforo.color,
                background: `${currentAlert.semaforo.color}15`,
                color: currentAlert.semaforo.color
              }}
            >
              <div
                className="live-indicator"
                style={{ backgroundColor: currentAlert.semaforo.color }}
              ></div>
              <span>Semáforo UGR: <strong>{currentAlert.semaforo.nivel}</strong> (Z: {currentAlert.z_score})</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-content">
        {/* VIEW 1: MAP */}
        {activeTab === 'map' && (
          <>
            {/* Sidebar Controls */}
            <aside className="sidebar">
              <div className="sidebar-content">
                {/* 1. Alerta UGR GAMC */}
                {currentAlert && (
                  <div
                    className="alert-widget"
                    style={{
                      borderColor: currentAlert.semaforo.color,
                      background: `linear-gradient(145deg, ${currentAlert.semaforo.color}15 0%, rgba(18,23,34,0.95) 100%)`
                    }}
                  >
                    <div className="alert-widget-header">
                      <span className="alert-level" style={{ color: currentAlert.semaforo.color }}>
                        {currentAlert.semaforo.nivel}
                      </span>
                      <span className="alert-zscore">Z-SCORE: {currentAlert.z_score}</span>
                    </div>
                    <p className="alert-desc">{currentAlert.semaforo.descripcion}</p>
                    <div className="alert-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Mes Actual</span>
                        <span className="metric-value">{currentAlert.mes_evaluado}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Focos Mes</span>
                        <span className="metric-value">{currentAlert.eventos_armonizados_mes}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Media Hist. (&mu;)</span>
                        <span className="metric-value">{currentAlert.promedio_historico_mu}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Demostración de Eliminación de Sesgo de Sensor */}
                <div className="card bias-box">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <TrendingUp size={15} /> Sesgo MODIS vs VIIRS Resuelto
                    </span>
                    <span style={{ color: '#a855f7', fontSize: '11px', fontWeight: '800' }}>
                      -{stats.reduction}% REDUNDANCIA
                    </span>
                  </div>
                  <div className="bias-stats-grid">
                    <div className="bias-stat-card">
                      <div className="bias-stat-num" style={{ color: '#ef4444' }}>
                        {stats.totalRaw}
                      </div>
                      <div className="bias-stat-label">Píxeles Crudos (VIIRS 375m + MODIS 1km)</div>
                    </div>
                    <div className="bias-stat-card">
                      <div className="bias-stat-num" style={{ color: '#10b981' }}>
                        {stats.totalHarmonized}
                      </div>
                      <div className="bias-stat-label">Eventos Físicos Reales (1x1 km)</div>
                    </div>
                  </div>
                  <div className="bias-progress-container">
                    <div
                      className="bias-progress-bar"
                      style={{ width: `${100 - stats.reduction}%` }}
                    ></div>
                  </div>
                  <p className="bias-caption">
                    Colapsa las múltiples detecciones VIIRS en celdas unificadas de ~1x1 km, eliminando el falso incremento instrumental a partir de 2012.
                  </p>
                </div>

                {/* 3. Capas Oficiales WMS GAMC */}
                <div className="card">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <Layers size={15} /> Cartografía Oficial GAMC (WMS)
                    </span>
                    <span style={{ fontSize: '10px', color: '#06b6d4' }}>En vivo</span>
                  </div>
                  <div className="layers-list">
                    {/* Cota 2750 */}
                    <div className="layer-item">
                      <div className="layer-info">
                        <div
                          className="layer-color-dot"
                          style={{ backgroundColor: GAMC_LAYERS.COTA_2750.color }}
                        ></div>
                        <span>{GAMC_LAYERS.COTA_2750.title}</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={layerCota}
                          onChange={(e) => setLayerCota(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {/* Periurbano */}
                    <div className="layer-item">
                      <div className="layer-info">
                        <div
                          className="layer-color-dot"
                          style={{ backgroundColor: GAMC_LAYERS.PERIURBANO.color }}
                        ></div>
                        <span>{GAMC_LAYERS.PERIURBANO.title}</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={layerPeriurbano}
                          onChange={(e) => setLayerPeriurbano(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {/* Limites 15 Distritos */}
                    <div className="layer-item">
                      <div className="layer-info">
                        <div
                          className="layer-color-dot"
                          style={{ backgroundColor: GAMC_LAYERS.DISTRITOS.color }}
                        ></div>
                        <span>{GAMC_LAYERS.DISTRITOS.title}</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={layerDistritos}
                          onChange={(e) => setLayerDistritos(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 4. Filtros Temporales y de Búsqueda */}
                <div className="card">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <Sliders size={15} /> Filtros de Focos Térmicos
                    </span>
                    <span style={{ color: '#f97316', fontSize: '11px', fontWeight: '700' }}>
                      {filteredFires.length} en Mapa
                    </span>
                  </div>

                  <div className="filter-row">
                    <div className="filter-group">
                      <label className="filter-label">Año</label>
                      <select
                        className="filter-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        <option value="ALL">Todos (2020-2025)</option>
                        <option value="2020">2020</option>
                        <option value="2021">2021</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024 (Histórico)</option>
                        <option value="2025">2025</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Mes</label>
                      <select
                        className="filter-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        <option value="ALL">Todos los meses</option>
                        {MONTH_NAMES.map((name, idx) => (
                          <option key={idx + 1} value={String(idx + 1)}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="filter-row">
                    <div className="filter-group">
                      <label className="filter-label">Sensor</label>
                      <select
                        className="filter-select"
                        value={selectedSensor}
                        onChange={(e) => setSelectedSensor(e.target.value)}
                      >
                        <option value="ALL">Todos los Sensores</option>
                        <option value="VIIRS">Solo VIIRS (375m)</option>
                        <option value="MODIS">Solo MODIS (1km)</option>
                        <option value="AMBOS">Fusión Multiespectral</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Severidad FRP</label>
                      <select
                        className="filter-select"
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                      >
                        <option value="ALL">Todas las intensidades</option>
                        <option value="CRÍTICA">Crítica (&gt; 100 MW)</option>
                        <option value="ALTA">Alta (40-100 MW)</option>
                        <option value="MEDIA">Media (15-40 MW)</option>
                        <option value="BAJA">Baja (&lt; 15 MW)</option>
                      </select>
                    </div>
                  </div>

                  {/* Descargas requeridas por el reto */}
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Exportar Datos Filtrados
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={exportToCSV}
                        className="export-btn"
                        title="Descargar datos en formato CSV"
                      >
                        <FileSpreadsheet size={14} /> CSV ({filteredFires.length})
                      </button>
                      <button
                        onClick={exportToGeoJSON}
                        className="export-btn"
                        title="Descargar datos en formato GeoJSON"
                      >
                        <FileJson size={14} /> GeoJSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Inspector WMS GetFeatureInfo */}
                <div className="card">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <Info size={15} /> Inspección Territorial GAMC
                    </span>
                    {queryingWMS && <span style={{ color: '#06b6d4', fontSize: '11px' }}>Consultando WMS...</span>}
                  </div>
                  {clickedFeature ? (
                    <div className="feature-info-box">
                      <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                        {clickedFeature.distrito}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Jurisdicción: <strong>{clickedFeature.comuna}</strong>
                      </div>
                      <div style={{ color: 'var(--text-subtle)', marginTop: '4px', fontSize: '11px' }}>
                        Coordenadas: {clickedFeature.lat}, {clickedFeature.lng}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Haz clic en cualquier punto del mapa para consultar distrito y comuna en el servidor WMS del GAMC.
                    </p>
                  )}
                </div>
              </div>
            </aside>

            {/* Map Area */}
            <main className="map-container">
              <div id="leaflet-map" ref={mapRef}></div>

              {/* Floating Legend */}
              <div className="map-floating-panel">
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>
                  Mapa Base
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className={`nav-tab ${baseMapType === 'satellite' ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '10px' }}
                    onClick={() => setBaseMapType('satellite')}
                  >
                    Satélite
                  </button>
                  <button
                    className={`nav-tab ${baseMapType === 'dark' ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '10px' }}
                    onClick={() => setBaseMapType('dark')}
                  >
                    Dark
                  </button>
                  <button
                    className={`nav-tab ${baseMapType === 'osm' ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '10px' }}
                    onClick={() => setBaseMapType('osm')}
                  >
                    OSM
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>
                  Focos Armonizados
                </div>
                <div className="legend-item">
                  <div className="legend-badge" style={{ backgroundColor: '#a855f7' }}></div>
                  <span>Fusión Ambos Sensores</span>
                </div>
                <div className="legend-item">
                  <div className="legend-badge" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>Sensor VIIRS (375m)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-badge" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>Sensor MODIS (1km)</span>
                </div>
              </div>
            </main>
          </>
        )}

        {/* VIEW 2: CALENDARIO EN LLAMAS (Z-SCORE) */}
        {activeTab === 'calendar' && (
          <div className="calendar-view-container">
            <div className="matrix-card flame-theme">
              <div className="matrix-header">
                <div className="matrix-title">
                  <Flame size={20} color="#f97316" style={{ display: 'inline', marginRight: '6px' }} />
                  Calendario en Llamas: Matriz de Recurrencia y Anomalías (Z-Score)
                </div>
                <div className="matrix-subtitle">
                  Rampa de color térmica accesible de negro carbón a rojo brasa. Haz clic en cualquier celda para saltar directamente al mapa con los focos de ese mes.
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Año</th>
                      {MONTH_NAMES.map((m, i) => (
                        <th key={i}>{m.slice(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calendarMatrix.years.map((y) => (
                      <tr key={y}>
                        <td className="matrix-year-cell">{y}</td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const item = calendarMatrix.mapByYearMonth[`${y}_${m}`];
                          if (!item) {
                            return <td key={m} style={{ color: '#475569' }}>-</td>;
                          }
                          const z = item.z_score;
                          const color = item.alert_color || '#10b981';
                          return (
                            <td key={m}>
                              <div
                                className="matrix-data-cell"
                                style={{
                                  backgroundColor: `${color}25`,
                                  borderColor: color,
                                  border: `1px solid ${color}`,
                                  color: color
                                }}
                                title={`${MONTH_NAMES[m - 1]} ${y}: ${item.eventos_armonizados} eventos (Z: ${z}) - ${item.alert_level}`}
                                onClick={() => jumpToMonthOnMap(y, m)}
                              >
                                <div style={{ fontSize: '13px', fontWeight: '800' }}>
                                  {item.eventos_armonizados}
                                </div>
                                <div style={{ fontSize: '9px', opacity: 0.85 }}>Z:{z}</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Climatological Baseline cards */}
            <div className="matrix-card">
              <div className="matrix-header">
                <div className="matrix-title">Línea Base Climatológica de Cochabamba (2000-2023)</div>
                <div className="matrix-subtitle">
                  Valores esperados por mes (&mu; y &sigma;). Nótese la estacionalidad crítica entre julio y noviembre.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {baselineData.map((b) => (
                  <div
                    key={b.month}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-orange)' }}>
                      {b.month_name}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                      {b.mu}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      &sigma;: &plusmn;{b.sigma} | Máx: {b.max_hist}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PATRULLAJE UGR & 15 DISTRITOS */}
        {activeTab === 'patrol' && (
          <div className="patrol-view-container">
            <div className="card patrol-card">
              <div className="card-title">
                <span className="card-title-icon">
                  <Compass size={18} /> Protocolo y Prioridades de Patrullaje Municipal (UGR)
                </span>
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '700' }}>
                  Respuesta Inmediata
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Matriz de despacho preventivo de cuadrillas de guardaparques y bomberos voluntarios (SAR-Bolivia, GEOS, Bomberos Policía) basada en la recurrencia histórica y proximidad a la Cota 2750:
              </p>

              <div className="patrol-grid">
                <div className="patrol-quadrant high-risk">
                  <div className="quadrant-header">
                    <strong>Cuadrante 1: Cota 2750 / Taquiña & Aranjuez</strong>
                    <span className="quadrant-badge red">Prioridad Crítica</span>
                  </div>
                  <div className="quadrant-body">
                    <div><b>Distritos:</b> D1, D2, D13 (Cota 2750 Parque Tunari)</div>
                    <div><b>Riesgo:</b> Interfaz bosque-vivienda, alta biomasa de eucalipto y pino</div>
                    <div><b>Horario Patrullaje:</b> 11:30 - 16:30 (Ventana térmica de máxima radiación)</div>
                  </div>
                </div>

                <div className="patrol-quadrant medium-risk">
                  <div className="quadrant-header">
                    <strong>Cuadrante 2: Noroeste Tunari / Coña Coña</strong>
                    <span className="quadrant-badge orange">Prioridad Alta</span>
                  </div>
                  <div className="quadrant-body">
                    <div><b>Distritos:</b> D3, D12 (San Pedro / Adela Zamudio)</div>
                    <div><b>Riesgo:</b> Quemas agrícolas en pendiente con riesgo de escape a la serranía</div>
                    <div><b>Horario Patrullaje:</b> 13:00 - 18:00</div>
                  </div>
                </div>

                <div className="patrol-quadrant periurban-risk">
                  <div className="quadrant-header">
                    <strong>Cuadrante 3: Periurbano Sur / K'ara K'ara</strong>
                    <span className="quadrant-badge yellow">Prioridad Media</span>
                  </div>
                  <div className="quadrant-body">
                    <div><b>Distritos:</b> D7, D8, D9, D14, D15 (Periurbano Sur y Sudeste)</div>
                    <div><b>Riesgo:</b> Pastizales secos periurbanos y quema de residuos</div>
                    <div><b>Horario Patrullaje:</b> 09:00 - 13:00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* List of 15 Distritos GAMC */}
            <div className="card">
              <div className="card-title">
                <span className="card-title-icon">
                  <MapPin size={18} /> Cartografía Oficial: Los 15 Distritos Municipales de Cochabamba
                </span>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '11px' }}>GAMC Oficial</span>
              </div>
              <div className="distritos-table-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Distrito</th>
                      <th style={{ textAlign: 'left' }}>Nombre y Comuna</th>
                      <th style={{ textAlign: 'left' }}>Zona Territorial</th>
                      <th style={{ textAlign: 'left' }}>Vulnerabilidad Tunari</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GAMC_DISTRITOS.filter((d) => d.id !== 'ALL').map((d) => {
                      const isTunari = d.zona.includes('Tunari');
                      const isPeri = d.zona.includes('Periurbano');
                      return (
                        <tr key={d.id}>
                          <td style={{ fontWeight: '800', color: '#fff', textAlign: 'left' }}>{d.id}</td>
                          <td style={{ textAlign: 'left' }}>{d.name}</td>
                          <td style={{ textAlign: 'left', color: 'var(--text-muted)' }}>{d.zona}</td>
                          <td style={{ textAlign: 'left' }}>
                            {isTunari && <span className="tag-tunari">Límite Directo Cota 2750</span>}
                            {isPeri && <span className="tag-peri">Zonas Periurbanas</span>}
                            {!isTunari && !isPeri && <span className="tag-urban">Mancha Urbana Central</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ARQUITECTURA & ESCALABILIDAD */}
        {activeTab === 'architecture' && (
          <div className="arch-view-container">
            <div className="arch-card">
              <h3>
                <Server size={18} /> Arquitectura Técnica del Modelo
              </h3>
              <p>
                El modelo resuelve el problema fundamental de la heterogeneidad de sensores espaciales en la detección de incendios:
              </p>
              <ul>
                <li>
                  <strong>Armonización Cuadrangular:</strong> Proyecta cada punto lat/lon a una grilla de resolución unificada de ~1.11 km x 1.06 km (2 decimales).
                </li>
                <li>
                  <strong>Colapso Espacio-Temporal:</strong> Agrupa por <code>[acq_date, lat_grid, lon_grid]</code>. Si MODIS (1km) y VIIRS (375m) detectan el mismo foco el mismo día, se unifican integrando potencia radiativa (<code>frp_max</code>) y centroide.
                </li>
                <li>
                  <strong>Z-Score Climatológico:</strong> Corrige el sesgo mensual aplicando $Z = (E - \mu_m) / \sigma_m$. Los picos de <strong>Septiembre 2024 (Z: +4.56)</strong> y <strong>Mayo 2024 (Z: +2.84)</strong> corresponden a las emergencias históricas reales.
                </li>
              </ul>
            </div>

            <div className="arch-card">
              <h3>
                <ShieldAlert size={18} /> Integración con Herramientas GAMC
              </h3>
              <p>
                El sistema se acopla nativamente a la infraestructura de geoservicios del Gobierno Autónomo Municipal de Cochabamba:
              </p>
              <ul>
                <li>
                  <strong>Cota 2750:</strong> Permite filtrar focos de calor por encima o debajo de la cota legal de protección ambiental del Tunari.
                </li>
                <li>
                  <strong>Zonas Periurbanas:</strong> Detección de incendios en la interfaz urbano-forestal para evacuación de viviendas periféricas.
                </li>
                <li>
                  <strong>Límites Distritales:</strong> Cruce espacial instantáneo vía <code>GetFeatureInfo</code> para asignar la emergencia a la cuadrilla de la comuna responsable.
                </li>
              </ul>
            </div>

            <div className="arch-card">
              <h3>
                <TrendingUp size={18} /> Roadmap de Escalabilidad Municipal
              </h3>
              <p>Propuesta para producción e implantación permanente en la UGR:</p>
              <ul>
                <li>
                  <strong>Ingesta Automática NRT:</strong> Cronjob de 1 hora consumiendo el feed de NASA FIRMS y actualizando la base de datos municipal.
                </li>
                <li>
                  <strong>Base de Datos Espacial (PostGIS):</strong> Migración de JSONs a PostgreSQL con PostGIS para consultas espaciales en tiempo real (<code>ST_DWithin</code> de la Cota 2750).
                </li>
                <li>
                  <strong>Canal de Alertas WhatsApp / Telegram:</strong> Envío de coordenadas directas a brigadistas y guardaparques cuando $Z &gt; 1.5$.
                </li>
              </ul>
            </div>

            <div className="arch-card">
              <h3>
                <CheckCircle2 size={18} /> Funcionalidades de Alto Impacto
              </h3>
              <p>Próximas características a integrar en la fase final del hackathon:</p>
              <ul>
                <li>
                  <strong>Simulación de Propagación de Fuego:</strong> Integración de dirección y velocidad de vientos de la estación meteorológica del Aeropuerto Jorge Wilstermann.
                </li>
                <li>
                  <strong>Índice de Combustible Vegetal (NDVI):</strong> Monitoreo previo de sequedad de biomasa con Sentinel-2 para prevención pre-incendio.
                </li>
                <li>
                  <strong>Cálculo de Área Afectada (Hectáreas):</strong> Agregación de celdas de calor para estimación de daño ecológico post-incendio.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
