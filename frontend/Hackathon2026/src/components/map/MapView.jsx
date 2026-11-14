import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GAMC_WMS_URL,
  GAMC_SERVICE_KEY,
  GAMC_LAYERS,
  COCHABAMBA_CENTER,
  DEFAULT_ZOOM
} from '../../constants/gamc';
import { queryDistrictFeatureInfo } from '../../services/wms';
import { getSensorColor, getSeverityRadius } from '../../utils/colors';
import MapControls from './MapControls';

export default function MapView({
  filteredFires,
  filteredRawFires = [],
  showRawAudit = false,
  layerCota,
  layerPeriurbano,
  layerDistritos,
  baseMapType,
  setBaseMapType,
  setClickedFeature,
  setQueryingWMS,
  selectedFire,
  setSelectedFire,
  spreadData,
  isSimulatingSpread
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fireMarkersGroupRef = useRef(null);
  const spreadGroupRef = useRef(null);
  const wmsCotaRef = useRef(null);
  const wmsPeriurbanoRef = useRef(null);
  const wmsDistritosRef = useRef(null);
  const baseTileRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: COCHABAMBA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true
      });

      // Capa base inicial (Esri Satellite)
      const baseTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri & NASA Earthdata', maxZoom: 19 }
      ).addTo(map);
      baseTileRef.current = baseTile;

      // Capas WMS del GAMC
      wmsCotaRef.current = L.tileLayer.wms(GAMC_WMS_URL, {
        key: GAMC_SERVICE_KEY,
        service_id: GAMC_LAYERS.COTA_2750.service_id,
        layers: '',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        maxZoom: 19,
        opacity: 0.85
      }).addTo(map);

      wmsPeriurbanoRef.current = L.tileLayer.wms(GAMC_WMS_URL, {
        key: GAMC_SERVICE_KEY,
        service_id: GAMC_LAYERS.PERIURBANO.service_id,
        layers: '',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        maxZoom: 19,
        opacity: 0.75
      }).addTo(map);

      wmsDistritosRef.current = L.tileLayer.wms(GAMC_WMS_URL, {
        key: GAMC_SERVICE_KEY,
        service_id: GAMC_LAYERS.DISTRITOS.service_id,
        layers: '',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        maxZoom: 19,
        opacity: 0.65
      }).addTo(map);

      // Grupo de marcadores de fuego y propagación de viento
      fireMarkersGroupRef.current = L.layerGroup().addTo(map);
      spreadGroupRef.current = L.layerGroup().addTo(map);

      // Evento Click para GetFeatureInfo en WMS GAMC
      map.on('click', async (e) => {
        setQueryingWMS(true);
        try {
          const info = await queryDistrictFeatureInfo(map, e.latlng);
          setClickedFeature(info);
        } catch (err) {
          setClickedFeature({
            lat: e.latlng.lat.toFixed(4),
            lng: e.latlng.lng.toFixed(4),
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
  }, []);

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

    const toggle = (layerRef, visible) => {
      if (!layerRef.current) return;
      if (visible) {
        if (!map.hasLayer(layerRef.current)) map.addLayer(layerRef.current);
      } else {
        if (map.hasLayer(layerRef.current)) map.removeLayer(layerRef.current);
      }
    };

    toggle(wmsCotaRef, layerCota);
    toggle(wmsPeriurbanoRef, layerPeriurbano);
    toggle(wmsDistritosRef, layerDistritos);
  }, [layerCota, layerPeriurbano, layerDistritos]);

  // Render Markers on Map (Harmonized Events + Raw Audit Detections)
  useEffect(() => {
    if (!fireMarkersGroupRef.current) return;
    const group = fireMarkersGroupRef.current;
    group.clearLayers();

    // 1. Si está activo el modo Auditoría, dibujar primero las detecciones crudas
    if (showRawAudit && filteredRawFires && filteredRawFires.length > 0) {
      filteredRawFires.forEach((raw) => {
        const isModis = raw.sensor === 'MODIS';
        const rawColor = isModis ? '#fb923c' : '#f87171'; // Naranja MODIS, Rosa/Rojo VIIRS
        const rawMarker = L.circleMarker([raw.lat, raw.lng], {
          radius: isModis ? 6 : 4,
          color: rawColor,
          weight: 1.5,
          dashArray: '2, 2',
          fillColor: rawColor,
          fillOpacity: 0.25
        });

        rawMarker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px; color: #1e293b;">
            <div style="border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px;">
                DETECCIÓN CRUDA PRE-ARMONIZACIÓN
              </span>
            </div>
            <div style="font-size: 11px; line-height: 1.5;">
              <div><b>Sensor:</b> NASA FIRMS ${raw.sensor} (${isModis ? '1 km' : '375 m'})</div>
              <div><b>Fecha Local:</b> ${raw.date} (${raw.time || 'N/A'} UTC-4)</div>
              <div><b>FRP Instantáneo:</b> ${raw.frp} MW</div>
              <div><b>Zona Territorial:</b> ${raw.zone}</div>
              <div style="margin-top: 4px; color: #64748b; font-size: 10px;">Lat: ${raw.lat} | Lng: ${raw.lng}</div>
            </div>
          </div>
        `);
        group.addLayer(rawMarker);
      });
    }

    // 2. Dibujar eventos de fuego consolidados y armonizados
    filteredFires.forEach((f) => {
      const color = getSensorColor(f.sensor);
      const radius = getSeverityRadius(f.severity);

      // Si es FUSIÓN MULTISENSOR (AMBOS), dibujar un halo exterior brillante
      if (f.sensor === 'AMBOS') {
        const halo = L.circleMarker([f.lat, f.lng], {
          radius: radius + 5,
          color: '#c084fc',
          weight: 2,
          dashArray: '3, 3',
          fillColor: '#a855f7',
          fillOpacity: 0.15
        });
        group.addLayer(halo);
      }

      const marker = L.circleMarker([f.lat, f.lng], {
        radius,
        color: f.sensor === 'AMBOS' ? '#ffffff' : color,
        fillColor: color,
        fillOpacity: 0.88,
        weight: f.sensor === 'AMBOS' ? 2.5 : 1.5
      });

      marker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 230px; color: #0f172a;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-bottom:6px;">
            <strong style="font-size:12px; color:#0f172a;">
              ${f.sensor === 'AMBOS' ? 'FUSIÓN MULTIESPECTRAL' : 'EVENTO TÉRMICO ARMONIZADO'}
            </strong>
            <span style="font-size:10px; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:${color};">
              ${f.sensor}
            </span>
          </div>
          <div style="font-size:11px; line-height:1.55;">
            <div><b>Jurisdicción:</b> <span style="color:#0284c7; font-weight:600;">${f.zone}</span></div>
            <div><b>Fecha (UTC-4):</b> ${f.date}</div>
            <div><b>Potencia FRP Máx:</b> ${f.frp_max} MW</div>
            <div><b>Severidad Térmica:</b> <span style="font-weight:700;">${f.severity}</span></div>
            <div><b>Píxeles Colapsados:</b> ${f.raw_count} (${f.modis_count} MODIS + ${f.viirs_count} VIIRS)</div>
            <div style="margin-top:5px; padding-top:4px; border-top:1px dashed #cbd5e1; color:#64748b; font-size:10px;">
              Centroide Ponderado: [${f.lat}, ${f.lng}]
            </div>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (setSelectedFire) setSelectedFire(f);
      });

      group.addLayer(marker);
    });
  }, [filteredFires, filteredRawFires, showRawAudit, setSelectedFire]);

  // Renderizar Cono de Propagación de Fuego (Modelo Rothermel + Viento)
  useEffect(() => {
    if (!spreadGroupRef.current) return;
    const group = spreadGroupRef.current;
    group.clearLayers();

    if (!isSimulatingSpread || !spreadData || !spreadData.spread || !spreadData.spread.polygon) {
      return;
    }

    const { spread, center } = spreadData;

    // Polígono del cono/elipse de avance
    const polygon = L.polygon(spread.polygon, {
      color: '#ef4444',
      fillColor: '#ea580c',
      fillOpacity: 0.35,
      weight: 2,
      dashArray: '5, 5'
    });

    polygon.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 210px; color: #0f172a;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #fed7aa; padding-bottom:4px; margin-bottom:6px;">
          <strong style="color:#c2410c; font-size:12px;">CONO DE PROPAGACIÓN TÉRMICA</strong>
        </div>
        <div style="font-size:11px; line-height:1.5;">
          <div><b>Modelo:</b> Rothermel Rate of Spread (ROS)</div>
          <div><b>Tasa de Avance:</b> ${spread.rateOfSpreadKmH} km/h</div>
          <div><b>Distancia Proyectada:</b> ~${spread.forwardDistanceKm} km</div>
          <div><b>Rumbo de Avance:</b> ${spread.bearing}° (${spread.cardinalDirection})</div>
          <div style="margin-top:4px; color:#b45309; font-weight:700;">Nivel de Riesgo: ${spread.riskLevel}</div>
        </div>
      </div>
    `);

    group.addLayer(polygon);

    // Vector central de avance (Línea direccional)
    if (center && spread.polygon.length > 0) {
      const tipIndex = Math.floor(spread.polygon.length / 2);
      const tipCoord = spread.polygon[tipIndex] || spread.polygon[0];
      const vectorLine = L.polyline([[center.lat, center.lng], tipCoord], {
        color: '#f97316',
        weight: 3,
        dashArray: '2, 4'
      });
      group.addLayer(vectorLine);
    }
  }, [spreadData, isSimulatingSpread]);

  return (
    <main className="map-container">
      <div id="leaflet-map" ref={mapContainerRef}></div>
      <MapControls baseMapType={baseMapType} setBaseMapType={setBaseMapType} />
    </main>
  );
}
