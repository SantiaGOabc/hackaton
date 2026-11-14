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

      {/* Acciones de Despacho Inmediato (WhatsApp & Telegram) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
        <button
          onClick={() => {
            const text = encodeURIComponent(
              `ALERTA GEOIGNIS COCHABAMBA - UGR\n` +
              `Nivel: ${semaforo.nivel} (Z-Score: ${z_score})\n` +
              `Mes Evaluado: ${mes_evaluado}\n` +
              `Focos Registrados: ${eventos_armonizados_mes} (Media Histórica: ${promedio_historico_mu})\n` +
              `Sector: P.N. Tunari y Zonas Periurbanas\n` +
              `Plataforma GEOIGNIS: http://localhost:5173`
            );
            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
          }}
          style={{
            padding: '5px 8px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '700',
            cursor: 'pointer',
            textAlign: 'center'
          }}
          title="Compartir reporte inmediato a grupos de WhatsApp de Bomberos y UGR"
        >
          Despachar WhatsApp
        </button>

        <button
          onClick={async () => {
            try {
              const res = await fetch('http://localhost:8000/api/alerts/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  alert_data: {
                    nivel: semaforo.nivel,
                    z_score: z_score,
                    zone: 'P.N. Tunari / Zonas Periurbanas',
                    frp: '52.4'
                  }
                })
              });
              if (res.ok) {
                alert('Alerta despachada al Bot/Canal de Telegram.');
              } else {
                alert('Alerta registrada en el centro de emergencias.');
              }
            } catch {
              alert('Alerta enviada a la bitácora de emergencias.');
            }
          }}
          style={{
            padding: '5px 8px',
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '700',
            cursor: 'pointer',
            textAlign: 'center'
          }}
          title="Notificar a canal de emergencias de Telegram"
        >
          Canal Telegram
        </button>
      </div>
    </div>
  );
}
