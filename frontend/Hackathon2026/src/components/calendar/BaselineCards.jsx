import React from 'react';

export default function BaselineCards({ baselineData }) {
  if (!baselineData || baselineData.length === 0) return null;

  return (
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
            <div
              style={{
                fontSize: '20px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                margin: '4px 0'
              }}
            >
              {b.mu}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              &sigma;: &plusmn;{b.sigma} | Máx: {b.max_hist}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
