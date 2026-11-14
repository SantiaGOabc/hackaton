import React from 'react';
import { Compass } from 'lucide-react';
import DistritosTable from './DistritosTable';

export default function PatrolView() {
  return (
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

      {/* Cartografía de los 15 Distritos GAMC */}
      <DistritosTable />
    </div>
  );
}
