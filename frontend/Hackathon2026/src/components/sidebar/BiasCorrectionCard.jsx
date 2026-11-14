import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function BiasCorrectionCard({ totalRaw, totalHarmonized, reduction }) {
  return (
    <div className="card bias-box">
      <div className="card-title">
        <span className="card-title-icon">
          <TrendingUp size={15} /> Sesgo MODIS vs VIIRS Resuelto
        </span>
        <span style={{ color: '#a855f7', fontSize: '11px', fontWeight: '800' }}>
          -{reduction}% REDUNDANCIA
        </span>
      </div>
      <div className="bias-stats-grid">
        <div className="bias-stat-card">
          <div className="bias-stat-num" style={{ color: '#ef4444' }}>
            {totalRaw}
          </div>
          <div className="bias-stat-label">Píxeles Crudos (VIIRS 375m + MODIS 1km)</div>
        </div>
        <div className="bias-stat-card">
          <div className="bias-stat-num" style={{ color: '#10b981' }}>
            {totalHarmonized}
          </div>
          <div className="bias-stat-label">Eventos Físicos Reales (1x1 km)</div>
        </div>
      </div>
      <div className="bias-progress-container">
        <div
          className="bias-progress-bar"
          style={{ width: `${100 - reduction}%` }}
        ></div>
      </div>
      <p className="bias-caption">
        Colapsa las múltiples detecciones de VIIRS (375m) a celdas unificadas de ~1x1 km, eliminando el falso incremento instrumental a partir de 2012.
      </p>
    </div>
  );
}
