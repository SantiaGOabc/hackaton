import React from 'react';
import { Layers } from 'lucide-react';
import { GAMC_LAYERS } from '../../constants/gamc';

export default function LayerToggles({
  layerCota,
  setLayerCota,
  layerPeriurbano,
  setLayerPeriurbano,
  layerDistritos,
  setLayerDistritos
}) {
  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-icon">
          <Layers size={15} /> Cartografía Oficial GAMC (WMS)
        </span>
        <span style={{ fontSize: '10px', color: '#06b6d4' }}>Geoservicios</span>
      </div>
      <div className="layers-list">
        {/* Cota 2750 */}
        <div className="layer-item">
          <div className="layer-info">
            <div
              className="layer-color-dot"
              style={{ backgroundColor: GAMC_LAYERS.COTA_2750.color }}
            ></div>
            <span>{GAMC_LAYERS.COTA_2750.title}</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={layerCota}
              onChange={(e) => setLayerCota(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Periurbano */}
        <div className="layer-item">
          <div className="layer-info">
            <div
              className="layer-color-dot"
              style={{ backgroundColor: GAMC_LAYERS.PERIURBANO.color }}
            ></div>
            <span>{GAMC_LAYERS.PERIURBANO.title}</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={layerPeriurbano}
              onChange={(e) => setLayerPeriurbano(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Límites 15 Distritos */}
        <div className="layer-item">
          <div className="layer-info">
            <div
              className="layer-color-dot"
              style={{ backgroundColor: GAMC_LAYERS.DISTRITOS.color }}
            ></div>
            <span>{GAMC_LAYERS.DISTRITOS.title}</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={layerDistritos}
              onChange={(e) => setLayerDistritos(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}
