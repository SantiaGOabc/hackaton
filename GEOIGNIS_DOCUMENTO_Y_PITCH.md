# GEOIGNIS COCHABAMBA
## Sistema Geoespacial de Armonización Satelital, Alerta Temprana y Modelado de Propagación de Incendios
**NASA International Space Apps Challenge 2026 — Sede Cochabamba**  
**Reto Municipal: Gobierno Autónomo Municipal de Cochabamba (GAMC) / UGR**

---

## 1. RESUMEN EJECUTIVO Y FICHA TÉCNICA

* **Nombre Oficial:** GEOIGNIS Cochabamba
* **Alcance:** Departamento de Cochabamba, Serranía del Parque Nacional Tunari (Cota 2750), Zonas Periurbanas (K'ara K'ara / Distrito 9) y los 15 Distritos Municipales.
* **Fuentes de Datos:**
  * **Satélites NASA FIRMS:** MODIS (Sensor Terra/Aqua, 1 km de resolución, datos 2000–presente) y VIIRS (Sensores Suomi-NPP y NOAA-20/21, 375 m de resolución, datos 2012–presente).
  * **Geoservicios WMS GAMC:** Capas oficiales de Cota 2750 Tunari, Límites Periurbanos y Delimitación de los 15 Distritos Municipales.
  * **Meteorología Dinámica:** Open-Meteo GFS/ECMWF (viento y ráfagas en tiempo real) y Copernicus ERA5-Land (reanálisis histórico horario).
* **Propósito Central:**
  1. Eliminar la distorsión estadística entre sensores satelitales (eliminando la falsa alarma de un "estallido de incendios" en 2012).
  2. Identificar la recurrencia histórica mediante un "Calendario en Llamas" con semáforo Z-Score.
  3. Predecir hacia dónde avanzará el fuego en las próximas 1, 2 y 4 horas mediante el modelo físico de viento de Rothermel.
  4. Despachar reportes tácticos inmediatos a los grupos de bomberos y brigadistas vía WhatsApp y Telegram en 1 clic.

---

## 2. EL PROBLEMA REAL: LA ILUSIÓN DE LOS SENSORES

Cuando una alcaldía o institución descarga datos crudos de NASA FIRMS:
* **MODIS (2000–2011):** Píxeles de $1000\text{ m} \times 1000\text{ m}$. Detecta incendios con potencia mayor a $5\text{–}10\text{ MW}$. Un incendio en la ladera del Tunari generaba **1 punto**.
* **VIIRS (2012–Presente):** Píxeles de $375\text{ m} \times 375\text{ m}$. Detecta anomalías térmicas pequeñas de $0.2\text{–}0.5\text{ MW}$. El mismo incendio genera **6 a 9 puntos térmicos**.

**La Catástrofe Metodológica:**  
Si se grafican los datos brutos, parece que a partir de 2012 hubo una catástrofe sin precedentes en Cochabamba. **Esto es falso.** Es un sesgo instrumental de resolución espacial y óptica. Sin armonización, las autoridades de la UGR y defensa civil toman decisiones con datos engañosos.

---

## 3. CÓMO FUNCIONA GEOIGNIS (ARQUITECTURA CIENTÍFICA)

### Paso 1: Normalización Temporal a Tiempo Solar Local (UTC-4)
Los satélites de la NASA reportan en tiempo universal UTC. Un incendio ocurrido a las 21:00 hora de Cochabamba cae en el día siguiente de UTC. GEOIGNIS convierte cada timestamp al huso horario oficial de Bolivia ($UTC-4$) para que los fuegos nocturnos no se dispersen en días distintos.

### Paso 2: Buffer Espacial Físico (1.2 km Haversine)
En vez de utilizar redondeos matemáticos de latitud/longitud que parten incendios reales en celdas distintas por un decimal, GEOIGNIS aplica **clustering espacial continuo por distancia física**:
* Radio de búsqueda: $1200\text{ metros}$ (el radio nativo de cobertura de MODIS).
* Si dentro de una misma fecha local coexisten detecciones de MODIS y VIIRS en ese radio, **se fusionan en un solo evento físico**.
* **Centroide Ponderado por Energía (FRP):**
  $$\text{Lat}_{\text{evento}} = \frac{\sum (\text{Lat}_i \cdot \text{FRP}_i)}{\sum \text{FRP}_i}, \quad \text{Lng}_{\text{evento}} = \frac{\sum (\text{Lng}_i \cdot \text{FRP}_i)}{\sum \text{FRP}_i}$$
  El centroide no es el punto medio geométrico, sino el núcleo de mayor calor del incendio.
* **Resultado:** Reducción del **27.6% de redundancia falsa** en los datos de Cochabamba (de 641 detecciones satelitales crudas a 464 eventos reales consolidados).

### Paso 3: Motor de Detección de Anomalías Climatológicas (Z-Score)
Un incendio de 15 focos en febrero (época de lluvias) es una catástrofe; en septiembre (estiaje seco) es el promedio.  
El motor calcula la media mensual histórica multianual ($\mu_m$) y la desviación estándar ($\sigma_m$):
$$Z = \frac{X_{\text{actual}} - \mu_m}{\sigma_m}$$
* $Z \le 0.5$: **VERDE** (Riesgo Normal)
* $0.5 < Z \le 1.5$: **AMARILLO** (Riesgo Moderado)
* $1.5 < Z \le 2.5$: **NARANJA** (Riesgo Alto - Alerta Preventiva)
* $Z > 2.5$: **ROJO** (Riesgo Crítico - Despacho de Emergencia)

*Comprobación Histórica:* El sistema detectó con precisión el desastre de **Septiembre 2024 con $Z = +4.56$** y el pico inusual de **Mayo 2024 con $Z = +2.84$**.

### Paso 4: Modelo Físico de Propagación del Fuego por Viento (Rothermel & Huygens)
Cuando un bombero detecta un fuego, la primera pregunta es: *¿hacia dónde va y en cuánto tiempo llega a las casas?*
* GEOIGNIS consulta la estación meteorológica en tiempo real (velocidad, ráfagas y dirección).
* Calcula el rumbo hacia donde avanza el fuego:
  $$\theta_{\text{avance}} = (\text{Dirección Viento} + 180^\circ) \bmod 360^\circ$$
* Aplica la fórmula de Tasa de Propagación (Rate of Spread - ROS):
  $$\text{ROS} = R_0 \cdot \left(1 + 0.04 \cdot U^{1.35}\right) \cdot \left(1 + \frac{\text{FRP}}{150}\right)$$
* Genera dinámicamente un **Cono Elíptico de Peligro a 1h, 2h y 4h** en el mapa de Leaflet, mostrando qué distritos o comunidades están en la línea de fuego.

### Paso 5: Despacho Operativo Inmediato (WhatsApp & Telegram)
Con 1 clic en la tarjeta de alerta:
* **WhatsApp:** Abre un reporte prediseñado con coordenadas, nivel Z-score, dirección del viento y enlace satelital listo para enviar a los grupos de SAR-Bolivia, GEOS o UGR.
* **Telegram:** Notifica automáticamente a un canal o bot de emergencia municipal.

---

## 4. GUÍA RÁPIDA DE EJECUCIÓN

1. Haz doble clic en `iniciar_sistema.bat`.
2. Se iniciará el Backend en `http://localhost:8000` y el Frontend en `http://localhost:5173`.
3. Tu navegador se abrirá automáticamente con el visor listo.

---

## 5. SPEECH DE 3 MINUTOS PARA EL JURADO (IMPACTO TOTAL)

*(Mantén contacto visual con los jurados. Habla con seguridad, ritmo firme y tono enérgico. Ten la pantalla en `http://localhost:5173` lista con el mapa en satélite).*

---

### [0:00 - 0:45] EL GANCHO: LA GRAN MENTIRA DE LOS DATOS SATELITALES

> "Estimado jurado, autoridades de la Alcaldía y evaluadores de la NASA:
>
> Si ustedes abren hoy la base de datos satelital de la NASA para Cochabamba, verán un gráfico aterrador: parece que a partir de 2012 los incendios en el Parque Tunari y nuestras zonas periurbanas se dispararon de forma incontrolable.
>
> Pero hay un secreto que casi nadie nota: **esa explosión de incendios en gran parte es una mentira estadística.**
>
> En 2012, la NASA lanzó el sensor VIIRS, con una resolución casi tres veces mayor que MODIS. Un solo incendio forestal que en el año 2000 marcaba **un solo punto**, hoy con VIIRS marca **8 o 9 puntos distintos**.
>
> Si las autoridades del GAMC toman decisiones con datos crudos, están enviando camiones de bomberos a falsos positivos mientras el fuego real avanza en la montaña.
>
> Para solucionar esto creamos **GEOIGNIS COCHABAMBA**."

---

### [0:45 - 1:45] LA SOLUCIÓN: ARMONIZACIÓN, CARTOGRAFÍA OFICIAL Y EL CALENDARIO EN LLAMAS

*(En la pantalla, muestra el Visor WMS y activa el switch: 'Modo Auditoría Científica').*

> "GEOIGNIS resuelve el problema con ciencia de datos pura:
>
> En lugar de simples filtros, implementamos un algoritmo de **clustering espacial continuo por buffer de 1.2 kilómetros** sincronizado en tiempo solar local de Bolivia. Agrupamos los píxeles dispersos y calculamos el centroide físico ponderado por la Potencia Radiativa del fuego.
>
> Miren la pantalla: al activar nuestro **Modo Auditoría**, pueden ver los 641 puntos crudos desordenados y cómo nuestro motor los consolida en 464 eventos reales, reduciendo un **27.6% de redundancia instrumental**.
>
> Además, no usamos mapas genéricos: integramos directamente los geoservicios WMS oficiales de la Alcaldía de Cochabamba: la **Cota 2750**, las **Zonas Periurbanas de K'ara K'ara** y los **15 Distritos Municipales**. Al hacer clic en cualquier punto, el sistema ejecuta una consulta `GetFeatureInfo` diciéndonos la comuna exacta responsable.
>
> Y para responder al reto del **'Calendario en Llamas'**, miren esta matriz multianual: compara cada mes frente a su línea base histórica de 24 años mediante el algoritmo Z-Score. Vean este casillero rojo: **Septiembre de 2024 marcó un Z-Score de +4.56**, identificando matemáticamente el desastre que todos los cochabambinos respiramos ese mes."

---

### [1:45 - 2:30] EL FACTOR DIFERENCIADOR: ANÁLISIS DE VIENTO EN VIVO Y DESPACHO A BOMBEROS

*(Haz clic en un foco del mapa o en la ladera del Tunari, y presiona el botón azul: 'Proyectar Propagación en Mapa').*

> "Pero nosotros no nos quedamos en ver el pasado. El personal de la UGR y los bomberos voluntarios necesitan saber qué va a pasar en las próximas horas.
>
> Por eso incorporamos un **Simulador Físico de Propagación de Fuego por Viento**.
>
> Conectamos el sistema en tiempo real a estaciones meteorológicas. El sistema lee que el viento en Cochabamba viene con ráfagas a determinada velocidad, y aplicando las ecuaciones físicas de Rothermel, dibuja este **Cono Elíptico de Peligro a 1, 2 y 4 horas**.
>
> Los bomberos de SAR-Bolivia y GEOS pueden ver exactamente hacia qué quebrada o qué viviendas de la Cota 2750 avanzará la cabeza del fuego antes de que llegue.
>
> ¿Y cómo les avisamos? Miren este botón: con un solo clic en **'Despachar WhatsApp'**, el sistema genera el reporte táctico con coordenadas GPS y dirección de propagación, abriendo el grupo operativo de WhatsApp de los brigadistas, o notificando a nuestro Bot oficial de **Telegram**."

---

### [2:30 - 3:00] EL CIERRE: LISTO PARA OPERAR HOY MISMO

*(Muestra la arquitectura y resume con fuerza).*

> "GEOIGNIS Cochabamba no es un prototipo estático ni un boceto en Figma.
>
> Es una plataforma integral desarrollada con FastAPI en Python, React 19, Leaflet y modelos meteorológicos en vivo, lista para ejecutarse con un solo clic mediante nuestro script automatizado.
>
> Con GEOIGNIS, el Gobierno Autónomo Municipal de Cochabamba tiene en sus manos una herramienta con respaldo de la NASA para proteger el Parque Nacional Tunari, cuidar a nuestras familias periurbanas y salvar vidas con anticipación científica.
>
> Muchas gracias. Quedamos a su disposición para sus preguntas."

---

## 6. PREGUNTAS FRECUENTES DEL JURADO (CÓMO RESPONDER)

1. **¿Por qué usaron un buffer de 1.2 km y no una grilla fija de píxeles?**
   * *Respuesta:* "Porque una grilla fija de celdas cuadradas tiene un efecto de borde: si un incendio ocurre en el límite de una celda, divide un mismo fuego en dos celdas distintas. El buffer continuo de Haversine de 1.2 km representa el radio de cobertura físico nativo de MODIS, agrupando detecciones reales sin sesgo geométrico."
2. **¿De dónde sacan el viento para la propagación?**
   * *Respuesta:* "Utilizamos la API de Open-Meteo conectada a los modelos globales GFS y ECMWF para tiempo real (velocidad, dirección y ráfagas a 10m de altura sin costo de tokens), y para incendios históricos nos conectamos al reanálisis climático Copernicus ERA5-Land."
3. **¿Cómo escalaría esto a toda Bolivia?**
   * *Respuesta:* "El pipeline está completamente desacoplado. Solo se amplía la caja de coordenadas (Bounding Box) a nivel departamental o nacional, y el algoritmo procesa millones de filas en segundos gracias a la vectorización en Pandas y Numpy."
