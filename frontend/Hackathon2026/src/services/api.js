/**
 * Servicios de carga de datos para focos, calendario térmico, alerta actual y línea base
 */

export async function fetchFireData() {
  const res = await fetch('/data/historial_limpio_mapa.json');
  if (!res.ok) throw new Error('Error al cargar historial_limpio_mapa.json');
  return res.json();
}

export async function fetchRawFireData() {
  const res = await fetch('/data/historial_crudo_mapa.json');
  if (!res.ok) throw new Error('Error al cargar historial_crudo_mapa.json');
  return res.json();
}

export async function fetchThermalCalendar() {
  const res = await fetch('/data/calendario_termico.json');
  if (!res.ok) throw new Error('Error al cargar calendario_termico.json');
  return res.json();
}

export async function fetchCurrentAlert() {
  const res = await fetch('/data/alerta_actual.json');
  if (!res.ok) throw new Error('Error al cargar alerta_actual.json');
  return res.json();
}

export async function fetchMonthlyBaseline() {
  const res = await fetch('/data/baseline_mensual.json');
  if (!res.ok) throw new Error('Error al cargar baseline_mensual.json');
  return res.json();
}

export async function loadAllDashboardData() {
  const [fires, rawFires, calendar, alert, baseline] = await Promise.all([
    fetchFireData().catch(() => []),
    fetchRawFireData().catch(() => []),
    fetchThermalCalendar().catch(() => []),
    fetchCurrentAlert().catch(() => null),
    fetchMonthlyBaseline().catch(() => [])
  ]);
  return { fires, rawFires, calendar, alert, baseline };
}
