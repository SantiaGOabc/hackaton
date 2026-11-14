import React from 'react';
import { Flame } from 'lucide-react';
import { MONTH_NAMES } from '../../constants/dates';
import BaselineCards from './BaselineCards';

export default function ThermalCalendarView({ calendarMatrix, baselineData, onCellClick }) {
  return (
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
                          onClick={() => onCellClick(y, m)}
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

      {/* Climatological Baseline Cards */}
      <BaselineCards baselineData={baselineData} />
    </div>
  );
}
