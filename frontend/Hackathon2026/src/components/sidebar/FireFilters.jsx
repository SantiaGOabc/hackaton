import React from 'react';
import { Sliders } from 'lucide-react';
import { MONTH_NAMES, YEARS_LIST } from '../../constants/dates';
import ExportButtons from '../common/ExportButtons';

export default function FireFilters({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedSensor,
  setSelectedSensor,
  selectedSeverity,
  setSelectedSeverity,
  selectedZone,
  setSelectedZone,
  showRawAudit,
  setShowRawAudit,
  totalFiltered,
  filteredFires
}) {
  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-icon">
          <Sliders size={15} /> Filtros de Focos Térmicos
        </span>
        <span style={{ color: '#f97316', fontSize: '11px', fontWeight: '700' }}>
          {totalFiltered} en Mapa
        </span>
      </div>

      {/* Selector de Zona Territorial */}
      <div className="filter-group" style={{ marginBottom: '8px' }}>
        <label className="filter-label">Jurisdicción Territorial</label>
        <select
          className="filter-select"
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          style={{ width: '100%' }}
        >
          <option value="ALL">Todas las Zonas (Valle Central y Serranías)</option>
          <option value="P.N. Tunari (Cota > 2750)">Área de Protección Cota &gt; 2750</option>
          <option value="Zonas Periurbanas GAMC">Zonas Periurbanas GAMC</option>
          <option value="Distritos Urbanos GAMC">Distritos Urbanos (Cercado)</option>
          <option value="Área Metropolitana Externa">Área Metropolitana Externa (Región Kanata)</option>
        </select>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label">Año</label>
          <select
            className="filter-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="ALL">Todos (2020-2025)</option>
            {YEARS_LIST.map((y) => (
              <option key={y} value={y}>
                {y} {y === '2024' ? '(Histórico)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Mes</label>
          <select
            className="filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">Todos los meses</option>
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={String(idx + 1)}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label">Sensor</label>
          <select
            className="filter-select"
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value)}
          >
            <option value="ALL">Todos los Sensores</option>
            <option value="VIIRS">Solo VIIRS (375m)</option>
            <option value="MODIS">Solo MODIS (1km)</option>
            <option value="AMBOS">Fusión Multiespectral</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Severidad FRP</label>
          <select
            className="filter-select"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="ALL">Todas las intensidades</option>
            <option value="CRÍTICA">Crítica (&gt; 100 MW)</option>
            <option value="ALTA">Alta (40-100 MW)</option>
            <option value="MEDIA">Media (15-40 MW)</option>
            <option value="BAJA">Baja (&lt; 15 MW)</option>
          </select>
        </div>
      </div>

      {/* Switch de Auditoría: Comparativa de Puntos Crudos vs Armonizados */}
      <div style={{ marginTop: '10px', padding: '8px', background: '#0f172a', borderRadius: '6px', border: '1px solid #334155' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
          <input
            type="checkbox"
            checked={showRawAudit}
            onChange={(e) => setShowRawAudit(e.target.checked)}
            style={{ accentColor: '#ec4899', width: '15px', height: '15px', cursor: 'pointer' }}
          />
          <span>
            <strong style={{ color: '#f43f5e' }}>Modo Auditoría Científica:</strong> Mostrar Detecciones Crudas sin Armonizar
          </span>
        </label>
      </div>

      {/* Botones de Descarga */}
      <ExportButtons fires={filteredFires} year={selectedYear} month={selectedMonth} />
    </div>
  );
}
