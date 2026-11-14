import React from 'react';
import { MapPin } from 'lucide-react';
import { GAMC_DISTRITOS } from '../../constants/gamc';

export default function DistritosTable() {
  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-icon">
          <MapPin size={18} /> Cartografía Oficial: Los 15 Distritos Municipales de Cochabamba
        </span>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '11px' }}>GAMC Oficial</span>
      </div>
      <div className="distritos-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Distrito</th>
              <th style={{ textAlign: 'left' }}>Nombre y Comuna</th>
              <th style={{ textAlign: 'left' }}>Zona Territorial</th>
              <th style={{ textAlign: 'left' }}>Vulnerabilidad Tunari</th>
            </tr>
          </thead>
          <tbody>
            {GAMC_DISTRITOS.filter((d) => d.id !== 'ALL').map((d) => {
              const isTunari = d.zona.includes('Tunari');
              const isPeri = d.zona.includes('Periurbano');
              return (
                <tr key={d.id}>
                  <td style={{ fontWeight: '800', color: '#fff', textAlign: 'left' }}>{d.id}</td>
                  <td style={{ textAlign: 'left' }}>{d.name}</td>
                  <td style={{ textAlign: 'left', color: 'var(--text-muted)' }}>{d.zona}</td>
                  <td style={{ textAlign: 'left' }}>
                    {isTunari && <span className="tag-tunari">Límite Directo Cota 2750</span>}
                    {isPeri && <span className="tag-peri">Zonas Periurbanas</span>}
                    {!isTunari && !isPeri && <span className="tag-urban">Mancha Urbana Central</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
