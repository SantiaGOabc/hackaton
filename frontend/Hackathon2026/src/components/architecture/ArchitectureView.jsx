import React from 'react';
import { Server, ShieldAlert, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function ArchitectureView() {
  return (
    <div className="arch-view-container">
      <div className="arch-card">
        <h3>
          <Server size={18} /> Arquitectura Técnica del Modelo
        </h3>
        <p>
          El modelo resuelve el problema fundamental de la heterogeneidad de sensores espaciales en la detección de incendios:
        </p>
        <ul>
          <li>
            <strong>Buffer Espacial Físico (1.2 km Haversine):</strong> Agrupa las detecciones dentro del radio de influencia del sensor de mayor huella (MODIS, ~1.2 km) en tiempo solar local (UTC-4), evitando fragmentaciones artificiales por cuadrícula.
          </li>
          <li>
            <strong>Colapso Espacio-Temporal con Centroide Ponderado:</strong> Si MODIS (1km) y VIIRS (375m) detectan el mismo foco el mismo día, se unifican integrando el centroide físico ponderado por FRP ($\sum \text{coord} \cdot \text{FRP} / \sum \text{FRP}$) y potencia máxima radiativa.
          </li>
          <li>
            <strong>Z-Score Climatológico:</strong> Corrige el sesgo mensual aplicando $Z = (E - \mu_m) / \sigma_m$. Los picos de <strong>Septiembre 2024 (Z: +4.56)</strong> y <strong>Mayo 2024 (Z: +2.84)</strong> corresponden a las emergencias históricas reales.
          </li>
        </ul>
      </div>

      <div className="arch-card">
        <h3>
          <ShieldAlert size={18} /> Integración con Herramientas GAMC
        </h3>
        <p>
          El sistema se acopla nativamente a la infraestructura de geoservicios del Gobierno Autónomo Municipal de Cochabamba:
        </p>
        <ul>
          <li>
            <strong>Cota 2750:</strong> Permite filtrar focos de calor por encima o debajo de la cota legal de protección ambiental del Tunari.
          </li>
          <li>
            <strong>Zonas Periurbanas:</strong> Detección de incendios en la interfaz urbano-forestal para evacuación de viviendas periféricas.
          </li>
          <li>
            <strong>Límites Distritales:</strong> Cruce espacial instantáneo vía <code>GetFeatureInfo</code> para asignar la emergencia a la cuadrilla de la comuna responsable.
          </li>
        </ul>
      </div>

      <div className="arch-card">
        <h3>
          <TrendingUp size={18} /> Roadmap de Escalabilidad Municipal
        </h3>
        <p>Propuesta para producción e implantación permanente en la UGR:</p>
        <ul>
          <li>
            <strong>Ingesta Automática NRT:</strong> Cronjob de 1 hora consumiendo el feed de NASA FIRMS y actualizando la base de datos municipal.
          </li>
          <li>
            <strong>Base de Datos Espacial (PostGIS):</strong> Migración de JSONs a PostgreSQL con PostGIS para consultas espaciales en tiempo real (<code>ST_DWithin</code> de la Cota 2750).
          </li>
          <li>
            <strong>Canal de Alertas WhatsApp / Telegram:</strong> Envío de coordenadas directas a brigadistas y guardaparques cuando $Z &gt; 1.5$.
          </li>
        </ul>
      </div>

      <div className="arch-card">
        <h3>
          <CheckCircle2 size={18} /> Funcionalidades de Alto Impacto
        </h3>
        <p>Próximas características a integrar en la fase final del hackathon:</p>
        <ul>
          <li>
            <strong>Simulación de Propagación de Fuego:</strong> Integración de dirección y velocidad de vientos de la estación meteorológica del Aeropuerto Jorge Wilstermann.
          </li>
          <li>
            <strong>Índice de Combustible Vegetal (NDVI):</strong> Monitoreo previo de sequedad de biomasa con Sentinel-2 para prevención pre-incendio.
          </li>
          <li>
            <strong>Cálculo de Área Afectada (Hectáreas):</strong> Agregación de celdas de calor para estimación de daño ecológico post-incendio.
          </li>
        </ul>
      </div>
    </div>
  );
}
