import React, { useState, useEffect } from 'react';
import { Wind, Compass, AlertTriangle, Play, RefreshCw, Flame } from 'lucide-react';
import { fetchLiveWind, fetchHistoricalWind, calculateFireSpreadPolygon } from '../../services/weather';

export default function WindSpreadWidget({ selectedFire, onSpreadCalculated, isSimulating, setIsSimulating }) {
  const [windData, setWindData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [horizonHours, setHorizonHours] = useState(2);
  const [spreadInfo, setSpreadInfo] = useState(null);

  // Cargar viento actual o histórico según el foco seleccionado
  useEffect(() => {
    async function loadWind() {
      setLoading(true);
      let data = null;
      if (selectedFire && selectedFire.date) {
        // Si el foco es histórico, consultar ERA5 para esa fecha
        data = await fetchHistoricalWind(selectedFire.lat, selectedFire.lng, selectedFire.date);
      } else {
        // Viento en tiempo real para el Valle de Cochabamba / Tunari
        data = await fetchLiveWind(-17.3895, -66.1568);
      }
      setWindData(data);
      setLoading(false);
    }
    loadWind();
  }, [selectedFire]);

  // Recalcular propagación cuando cambian los datos o el horizonte temporal
  useEffect(() => {
    if (!windData) return;
    const centerLat = selectedFire ? selectedFire.lat : -17.33; // Ladera sur Tunari
    const centerLng = selectedFire ? selectedFire.lng : -66.20;
    const frp = selectedFire ? (selectedFire.frp_max || 45) : 50;

    const spread = calculateFireSpreadPolygon(
      centerLat,
      centerLng,
      frp,
      windData.speed,
      windData.direction,
      horizonHours
    );

    setSpreadInfo(spread);

    if (isSimulating && onSpreadCalculated) {
      onSpreadCalculated(spread, { lat: centerLat, lng: centerLng });
    }
  }, [windData, selectedFire, horizonHours, isSimulating]);

  return (
    <div className="card" style={{ marginTop: '12px', border: '1px solid #38bdf8' }}>
      <div className="card-title" style={{ color: '#38bdf8' }}>
        <span className="card-title-icon">
          <Wind size={16} /> Análisis de Viento y Propagación
        </span>
        <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
          Rothermel ROS
        </span>
      </div>

      {loading ? (
        <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={12} className="spin" /> Consultando estación meteorológica...
        </div>
      ) : windData ? (
        <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Velocidad Viento</div>
              <strong style={{ color: '#f1f5f9', fontSize: '13px' }}>{windData.speed} km/h</strong>
              <div style={{ fontSize: '9px', color: '#38bdf8' }}>Ráfagas: {windData.gusts} km/h</div>
            </div>

            <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>Dirección Origen</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transform: `rotate(${windData.direction}deg)`,
                    transition: 'transform 0.4s'
                  }}
                >
                  <Compass size={15} style={{ color: '#38bdf8' }} />
                </span>
                <strong style={{ color: '#f1f5f9', fontSize: '13px' }}>
                  {windData.direction}° ({spreadInfo?.cardinalDirection || 'N'})
                </strong>
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>Hacia: {(windData.direction + 180) % 360}°</div>
            </div>
          </div>

          <div style={{ marginBottom: '8px', fontSize: '10px', color: '#64748b' }}>
            Fuente: {windData.source} ({windData.temperature}°C, {windData.humidity}% HR)
          </div>

          {/* Selector de Horizonte de Proyección */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="filter-label" style={{ margin: 0 }}>Proyección temporal:</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 4].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizonHours(h)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    background: horizonHours === h ? '#38bdf8' : '#1e293b',
                    color: horizonHours === h ? '#0f172a' : '#cbd5e1',
                    fontWeight: horizonHours === h ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  +{h}h
                </button>
              ))}
            </div>
          </div>

          {spreadInfo && (
            <div style={{ background: '#1e1b4b', padding: '8px', borderRadius: '6px', border: '1px solid #6366f1', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#c7d2fe', fontWeight: '600', fontSize: '10px' }}>
                  CONO DE AVANCE ESTIMADO
                </span>
                <span style={{ color: spreadInfo.riskLevel === 'CRÍTICO' ? '#ef4444' : '#f59e0b', fontWeight: '700', fontSize: '10px' }}>
                  Riesgo {spreadInfo.riskLevel}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#e0e7ff' }}>
                <div>• <b>Tasa de Avance:</b> {spreadInfo.rateOfSpreadKmH} km/h</div>
                <div>• <b>Distancia en +{horizonHours}h:</b> ~{spreadInfo.forwardDistanceKm} km</div>
                <div>• <b>Trayectoria:</b> Hacia el <b>{spreadInfo.bearing}° ({spreadInfo.cardinalDirection})</b></div>
              </div>
            </div>
          )}

          {/* Botón para Activar/Desactivar Cono en Mapa */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: isSimulating ? '#ef4444' : '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isSimulating ? (
              <>
                <Flame size={14} /> Ocultar Cono de Propagación
              </>
            ) : (
              <>
                <Play size={14} /> Proyectar Propagación en Mapa
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
