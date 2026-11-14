import React from 'react';
import { FileSpreadsheet, FileJson } from 'lucide-react';
import { exportFiresToCSV, exportFiresToGeoJSON } from '../../utils/export';

export default function ExportButtons({ fires, year, month }) {
  return (
    <div className="export-section">
      <div className="export-title">Exportar Datos Filtrados</div>
      <div className="export-buttons-grid">
        <button
          onClick={() => exportFiresToCSV(fires, year, month)}
          className="export-btn"
          title="Descargar datos en formato CSV para Excel o GIS"
          disabled={!fires || fires.length === 0}
        >
          <FileSpreadsheet size={14} /> CSV ({fires?.length || 0})
        </button>
        <button
          onClick={() => exportFiresToGeoJSON(fires, year, month)}
          className="export-btn"
          title="Descargar datos en formato GeoJSON para QGIS o Leaflet"
          disabled={!fires || fires.length === 0}
        >
          <FileJson size={14} /> GeoJSON
        </button>
      </div>
    </div>
  );
}
