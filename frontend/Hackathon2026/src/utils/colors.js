/**
 * Utilidades de estilo y color para sensores, severidad y Z-Scores
 */

export function getSensorColor(sensor) {
  if (sensor === 'AMBOS') return '#a855f7'; // Púrpura para fusión multiespectral
  if (sensor === 'VIIRS') return '#ef4444'; // Rojo para VIIRS
  if (sensor === 'MODIS') return '#f59e0b'; // Amarillo/Naranja para MODIS
  return '#f97316';
}

export function getSeverityRadius(severity) {
  switch (severity) {
    case 'CRÍTICA':
      return 9;
    case 'ALTA':
      return 7;
    case 'MEDIA':
      return 5;
    case 'BAJA':
    default:
      return 4;
  }
}

export function getZScoreAlertDetails(zScore) {
  if (zScore <= 0.5) {
    return { level: 'NORMAL', color: '#10b981', badge: 'Verde' };
  } else if (zScore <= 1.5) {
    return { level: 'MODERADO', color: '#f59e0b', badge: 'Amarillo' };
  } else if (zScore <= 2.5) {
    return { level: 'ALTO', color: '#f97316', badge: 'Naranja' };
  } else {
    return { level: 'CRÍTICO', color: '#ef4444', badge: 'Rojo' };
  }
}
