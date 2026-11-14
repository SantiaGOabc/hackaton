import React from 'react';
import AlertWidget from './AlertWidget';
import BiasCorrectionCard from './BiasCorrectionCard';
import LayerToggles from './LayerToggles';
import FireFilters from './FireFilters';
import FeatureInspector from './FeatureInspector';

export default function Sidebar({
  currentAlert,
  stats,
  layerCota,
  setLayerCota,
  layerPeriurbano,
  setLayerPeriurbano,
  layerDistritos,
  setLayerDistritos,
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
  filteredFires,
  clickedFeature,
  queryingWMS
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {/* 1. Alerta UGR GAMC */}
        <AlertWidget currentAlert={currentAlert} />

        {/* 2. Demostración de Eliminación de Sesgo de Sensor */}
        <BiasCorrectionCard
          totalRaw={stats.totalRaw}
          totalHarmonized={stats.totalHarmonized}
          reduction={stats.reduction}
        />

        {/* 3. Capas Oficiales WMS GAMC */}
        <LayerToggles
          layerCota={layerCota}
          setLayerCota={setLayerCota}
          layerPeriurbano={layerPeriurbano}
          setLayerPeriurbano={setLayerPeriurbano}
          layerDistritos={layerDistritos}
          setLayerDistritos={setLayerDistritos}
        />

        {/* 4. Filtros Temporales y de Búsqueda */}
        <FireFilters
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedSensor={selectedSensor}
          setSelectedSensor={setSelectedSensor}
          selectedSeverity={selectedSeverity}
          setSelectedSeverity={setSelectedSeverity}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          showRawAudit={showRawAudit}
          setShowRawAudit={setShowRawAudit}
          totalFiltered={filteredFires.length}
          filteredFires={filteredFires}
        />

        {/* 5. Inspector WMS GetFeatureInfo */}
        <FeatureInspector
          clickedFeature={clickedFeature}
          queryingWMS={queryingWMS}
        />
      </div>
    </aside>
  );
}
