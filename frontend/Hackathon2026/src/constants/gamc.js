/**
 * Constantes y credenciales oficiales del GAMC (Gobierno Autónomo Municipal de Cochabamba)
 */

export const GAMC_WMS_URL = 'https://serviciosgamc.cochabamba.bo/api/gs/wms';
export const GAMC_SERVICE_KEY = '8da30122933ced2174ebe3e8b03198731d9cae6dc3230d32';

export const GAMC_LAYERS = {
  COTA_2750: {
    id: 'cota2750',
    title: 'Cota 2750 (Límite P.N. Tunari)',
    service_id: '297cefa4-0832-42bb-a98e-2cbea989fd9d',
    color: '#06b6d4',
    badge: 'Protección Ambiental'
  },
  PERIURBANO: {
    id: 'periurbano',
    title: 'Zonas Periurbanas GAMC',
    service_id: 'c52066a1-32fd-4925-81e0-c2dcb8f4238f',
    color: '#eab308',
    badge: 'Interfaz Urbano-Forestal'
  },
  DISTRITOS: {
    id: 'distritos',
    title: 'Límites 15 Distritos',
    service_id: '7eb13092-bf0e-493b-aae6-03c43eedda2c',
    color: '#a855f7',
    badge: 'Cartografía Oficial GAMC'
  }
};

export const GAMC_DISTRITOS = [
  { id: 'ALL', name: 'Todos los Distritos', zona: 'Municipio Cochabamba' },
  { id: 'D1', name: 'Distrito 1 (Aranjuez / Cota 2750)', zona: 'Tunari Norte' },
  { id: 'D2', name: 'Distrito 2 (Cala Cala / Temporal)', zona: 'Tunari Norte' },
  { id: 'D3', name: 'Distrito 3 (Sarco / Coña Coña)', zona: 'Tunari Noroeste' },
  { id: 'D4', name: 'Distrito 4 (Coboce / Jaihuayco)', zona: 'Urbano Oeste' },
  { id: 'D5', name: 'Distrito 5 (Chimba / Alalay)', zona: 'Urbano Centro' },
  { id: 'D6', name: 'Distrito 6 (San Miguel)', zona: 'Urbano Sur' },
  { id: 'D7', name: 'Distrito 7 (Tamborada)', zona: 'Periurbano Sur' },
  { id: 'D8', name: 'Distrito 8 (K\'ara K\'ara)', zona: 'Periurbano Sur' },
  { id: 'D9', name: 'Distrito 9 (Valle Hermoso / Albarrancho)', zona: 'Periurbano Sur' },
  { id: 'D10', name: 'Distrito 10 (Centro Histórico)', zona: 'Urbano Central' },
  { id: 'D11', name: 'Distrito 11 (Las Cuadras / Muyurina)', zona: 'Urbano Este' },
  { id: 'D12', name: 'Distrito 12 (San Pedro / Adela Zamudio)', zona: 'Tunari Norte' },
  { id: 'D13', name: 'Distrito 13 (Taquiña / Linkhu Pata / Tunari)', zona: 'Tunari Central' },
  { id: 'D14', name: 'Distrito 14 (Uspha Uspha)', zona: 'Periurbano Sudeste' },
  { id: 'D15', name: 'Distrito 15 (Pampa San Miguel)', zona: 'Periurbano Sudeste' }
];

export const COCHABAMBA_CENTER = [-17.34, -66.18];
export const DEFAULT_ZOOM = 12;
