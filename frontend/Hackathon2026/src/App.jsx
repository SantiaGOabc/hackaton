import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// Servicios y Constantes
import { loadAllDashboardData } from './services/api';
import { YEARS_LIST } from './constants/dates';

// Componentes Modulares
import Header from './components/common/Header';
import Sidebar from './components/sidebar/Sidebar';
import MapView from './components/map/MapView';
import ThermalCalendarView from './components/calendar/ThermalCalendarView';
import PatrolView from './components/patrol/PatrolView';
import ArchitectureView from './components/architecture/ArchitectureView';

export default function App() {
  // 1. Navegación entre vistas ('map', 'calendar', 'patrol', 'architecture')
  const [activeTab, setActiveTab] = useState('map');

  // 2. Estados de datos del backend / JSONs procesados
  const [fires, setFires] = useState([]);
  const [rawFires, setRawFires] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [baselineData, setBaselineData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. Estados de filtrado interactivo
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedSensor, setSelectedSensor] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [showRawAudit, setShowRawAudit] = useState(false);

  // 4. Estados de visibilidad de capas WMS y mapa base
  const [layerCota, setLayerCota] = useState(true);
  const [layerPeriurbano, setLayerPeriurbano] = useState(true);
  const [layerDistritos, setLayerDistritos] = useState(true);
  const [baseMapType, setBaseMapType] = useState('satellite');

  // 5. Estado de inspección territorial (GetFeatureInfo en click de mapa)
  const [clickedFeature, setClickedFeature] = useState(null);
  const [queryingWMS, setQueryingWMS] = useState(false);

  // 6. Estados de análisis de viento y propagación del fuego
  const [selectedFire, setSelectedFire] = useState(null);
  const [spreadData, setSpreadData] = useState(null);
  const [isSimulatingSpread, setIsSimulatingSpread] = useState(false);

  const handleSpreadCalculated = (spread, center) => {
    setSpreadData({ spread, center });
  };

  // Carga inicial de datos desde el servicio API
  useEffect(() => {
    async function initData() {
      setLoading(true);
      const data = await loadAllDashboardData();
      setFires(data.fires);
      setRawFires(data.rawFires || []);
      setCalendarData(data.calendar);
      setCurrentAlert(data.alert);
      setBaselineData(data.baseline);
      setLoading(false);
    }
    initData();
  }, []);

  // Filtrado de focos de calor armonizados en memoria
  const filteredFires = useMemo(() => {
    return fires.filter((f) => {
      const parts = f.date.split('-');
      const y = parts[0];
      const m = parseInt(parts[1], 10);

      if (selectedYear !== 'ALL' && y !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && m !== parseInt(selectedMonth, 10)) return false;
      if (selectedSensor !== 'ALL' && f.sensor.toUpperCase() !== selectedSensor.toUpperCase()) return false;
      if (selectedSeverity !== 'ALL' && f.severity.toUpperCase() !== selectedSeverity.toUpperCase()) return false;
      if (selectedZone !== 'ALL' && f.zone !== selectedZone) return false;
      return true;
    });
  }, [fires, selectedYear, selectedMonth, selectedSensor, selectedSeverity, selectedZone]);

  // Filtrado de focos de calor crudos (modo auditoría de sesgo)
  const filteredRawFires = useMemo(() => {
    if (!showRawAudit) return [];
    return rawFires.filter((f) => {
      const parts = f.date.split('-');
      const y = parts[0];
      const m = parseInt(parts[1], 10);

      if (selectedYear !== 'ALL' && y !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && m !== parseInt(selectedMonth, 10)) return false;
      if (selectedSensor !== 'ALL' && f.sensor.toUpperCase() !== selectedSensor.toUpperCase()) return false;
      if (selectedZone !== 'ALL' && f.zone !== selectedZone) return false;
      return true;
    });
  }, [rawFires, showRawAudit, selectedYear, selectedMonth, selectedSensor, selectedZone]);

  // Estadísticas de reducción de sesgo instrumental (MODIS vs VIIRS)
  const stats = useMemo(() => {
    const totalHarmonized = fires.length;
    const totalRaw = fires.reduce((acc, f) => acc + (f.raw_count || 1), 0);
    const reduction = totalRaw > 0 ? Math.round((1 - totalHarmonized / totalRaw) * 100) : 0;
    return { totalHarmonized, totalRaw, reduction };
  }, [fires]);

  // Matriz de años y meses para el Calendario en Llamas
  const calendarMatrix = useMemo(() => {
    const years = YEARS_LIST.map((y) => parseInt(y, 10));
    const mapByYearMonth = {};
    calendarData.forEach((item) => {
      mapByYearMonth[`${item.year}_${item.month}`] = item;
    });
    return { years, mapByYearMonth };
  }, [calendarData]);

  // Salto interactivo desde una celda del Calendario directamente al Mapa
  const handleCalendarCellClick = (year, month) => {
    setSelectedYear(String(year));
    setSelectedMonth(String(month));
    setActiveTab('map');
  };

  return (
    <div className="app-container">
      {/* 1. Header Global con Navegación y Semáforo UGR */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentAlert={currentAlert}
      />

      {/* 2. Área de Contenido Principal según la Pestaña Activa */}
      <div className="app-content">
        {/* PESTAÑA 1: VISOR GEOESPACIAL WMS */}
        {activeTab === 'map' && (
          <>
            <Sidebar
              currentAlert={currentAlert}
              stats={stats}
              layerCota={layerCota}
              setLayerCota={setLayerCota}
              layerPeriurbano={layerPeriurbano}
              setLayerPeriurbano={setLayerPeriurbano}
              layerDistritos={layerDistritos}
              setLayerDistritos={setLayerDistritos}
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
              filteredFires={filteredFires}
              clickedFeature={clickedFeature}
              queryingWMS={queryingWMS}
              selectedFire={selectedFire}
              onSpreadCalculated={handleSpreadCalculated}
              isSimulatingSpread={isSimulatingSpread}
              setIsSimulatingSpread={setIsSimulatingSpread}
            />

            <MapView
              filteredFires={filteredFires}
              filteredRawFires={filteredRawFires}
              showRawAudit={showRawAudit}
              layerCota={layerCota}
              layerPeriurbano={layerPeriurbano}
              layerDistritos={layerDistritos}
              baseMapType={baseMapType}
              setBaseMapType={setBaseMapType}
              setClickedFeature={setClickedFeature}
              setQueryingWMS={setQueryingWMS}
              selectedFire={selectedFire}
              setSelectedFire={setSelectedFire}
              spreadData={spreadData}
              isSimulatingSpread={isSimulatingSpread}
            />
          </>
        )}

        {/* PESTAÑA 2: CALENDARIO EN LLAMAS & Z-SCORE */}
        {activeTab === 'calendar' && (
          <ThermalCalendarView
            calendarMatrix={calendarMatrix}
            baselineData={baselineData}
            onCellClick={handleCalendarCellClick}
          />
        )}

        {/* PESTAÑA 3: PATRULLAJE UGR & 15 DISTRITOS */}
        {activeTab === 'patrol' && <PatrolView />}

        {/* PESTAÑA 4: ARQUITECTURA TÉCNICA & ESCALABILIDAD */}
        {activeTab === 'architecture' && <ArchitectureView />}
      </div>
    </div>
  );
}
