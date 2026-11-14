import React from 'react';

export default function MapControls({ baseMapType, setBaseMapType }) {
  return (
    <div className="map-floating-panel">
      <div className="panel-section-title">Mapa Base</div>
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
      <div className="panel-section-title">Focos Armonizados</div>
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
  );
}
