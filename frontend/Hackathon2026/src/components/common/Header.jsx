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
            GEOIGNIS <span>COCHABAMBA</span>
            <span className="brand-tag">NASA FIRMS & GAMC</span>
          </div>
          <div className="brand-subtitle">
            Sistema de Armonización Satelital (2000-2026) y Alerta Temprana de Incendios
          </div>
        </div>
      </div>

      {/* Selector de Vistas / Pestañas Organizadas por Módulos */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
          title="Módulo 1: Observatorio Geoespacial con capas WMS, armonización MODIS/VIIRS y análisis de viento"
        >
          <MapPin size={15} /> Módulo 1: Visor WMS & Viento
        </button>
        <button
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
          title="Matriz multianual de meses vs años y anomalías térmicas Z-Score"
        >
          <Calendar size={15} /> Calendario en Llamas
        </button>
        <button
          className={`nav-tab ${activeTab === 'patrol' ? 'active' : ''}`}
          onClick={() => setActiveTab('patrol')}
          title="Módulo 2: Alerta temprana, focos en tiempo real y prioridades de despacho para bomberos y UGR"
        >
          <Compass size={15} /> Módulo 2: Alerta Bomberos & UGR
        </button>
        <button
          className={`nav-tab ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
          title="Especificación técnica de escalabilidad, ingestión satelital y Docker"
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
