import React from 'react';
import { Flame, MapPin, Calendar, Compass, Cpu } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, currentAlert }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Flame size={22} />
        </div>
        <div>
          <div className="brand-title">
            TUNARI <span>FIRE WATCH</span>
            <span className="brand-tag">GAMC & NASA Space Apps</span>
          </div>
          <div className="brand-subtitle">
            Armonización MODIS/VIIRS (2000-2026) | P.N. Tunari (Cota 2750) & 15 Distritos
          </div>
        </div>
      </div>

      {/* Selector de Vistas / Pestañas */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <MapPin size={15} /> Visor Geoespacial WMS
        </button>
        <button
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={15} /> Calendario en Llamas (Z-Score)
        </button>
        <button
          className={`nav-tab ${activeTab === 'patrol' ? 'active' : ''}`}
          onClick={() => setActiveTab('patrol')}
        >
          <Compass size={15} /> Patrullaje UGR & Distritos
        </button>
        <button
          className={`nav-tab ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <Cpu size={15} /> Arquitectura & Escalabilidad
        </button>
      </div>

      {/* Semáforo en Vivo UGR */}
      <div className="header-actions">
        {currentAlert && (
          <div
            className="status-badge"
            style={{
              borderColor: currentAlert.semaforo.color,
              background: `${currentAlert.semaforo.color}15`,
              color: currentAlert.semaforo.color
            }}
          >
            <div
              className="live-indicator"
              style={{ backgroundColor: currentAlert.semaforo.color }}
            ></div>
            <span>
              Semáforo UGR: <strong>{currentAlert.semaforo.nivel}</strong> (Z: {currentAlert.z_score})
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
