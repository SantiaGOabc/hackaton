import React from 'react';

export default function AlertWidget({ currentAlert }) {
  if (!currentAlert) return null;

  const { semaforo, mes_evaluado, eventos_armonizados_mes, promedio_historico_mu, z_score } = currentAlert;

  return (
    <div
      className="alert-widget"
      style={{
        borderColor: semaforo.color,
        background: `linear-gradient(145deg, ${semaforo.color}15 0%, rgba(18,23,34,0.95) 100%)`
      }}
    >
      <div className="alert-widget-header">
        <span className="alert-level" style={{ color: semaforo.color }}>
          {semaforo.nivel}
        </span>
        <span className="alert-zscore">Z-SCORE: {z_score}</span>
      </div>
      <p className="alert-desc">{semaforo.descripcion}</p>
      <div className="alert-metrics">
        <div className="metric-item">
          <span className="metric-label">Mes Actual</span>
          <span className="metric-value">{mes_evaluado}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Focos Mes</span>
          <span className="metric-value">{eventos_armonizados_mes}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Media Hist. (&mu;)</span>
          <span className="metric-value">{promedio_historico_mu}</span>
        </div>
      </div>
    </div>
  );
}
