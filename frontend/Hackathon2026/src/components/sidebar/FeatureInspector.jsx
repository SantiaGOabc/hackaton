import React from 'react';
import { Info } from 'lucide-react';

export default function FeatureInspector({ clickedFeature, queryingWMS }) {
  return (
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
          Haz clic en cualquier punto del mapa para consultar distrito y comuna en el servidor WMS del GAMC (GetFeatureInfo).
        </p>
      )}
    </div>
  );
}
