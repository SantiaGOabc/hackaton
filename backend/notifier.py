"""
Módulo de Notificaciones y Despacho de Alertas para GEOIGNIS Cochabamba
Soporta:
1. Enlace directo a WhatsApp para compartir reporte con cuadrillas de bomberos en 1 clic.
2. Bot de Telegram oficial (Telegram Bot API) para canales de alerta de UGR / SAR / GEOS.
3. Webhook HTTP genérico para integración con sistemas de emergencia 911 / SIM.
"""

import os
import urllib.parse
import json
import requests
from datetime import datetime

# Configuración opcional vía variables de entorno
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

def format_alert_message(alert_data: dict) -> str:
    """Formatea el cuerpo del mensaje de alerta para bomberos y autoridades."""
    level = alert_data.get("nivel", "ALERTA")
    z_score = alert_data.get("z_score", 0.0)
    zone = alert_data.get("zone", "Cochabamba - P.N. Tunari")
    frp = alert_data.get("frp", "N/A")
    lat = alert_data.get("lat", "-17.38")
    lng = alert_data.get("lng", "-66.16")
    wind_info = alert_data.get("wind", "Viento no disponible")
    date_str = alert_data.get("date", datetime.now().strftime("%Y-%m-%d %H:%M"))

    msg = (
        f"ALERTA GEOIGNIS COCHABAMBA - UGR\n"
        f"Nivel: {level} (Z-Score: {z_score})\n"
        f"Fecha: {date_str} (UTC-4)\n"
        f"Sector: {zone}\n"
        f"Potencia FRP: {frp} MW\n"
        f"Coordenadas: {lat}, {lng}\n"
        f"Propagacion por Viento: {wind_info}\n\n"
        f"Mapa en Vivo: https://maps.google.com/?q={lat},{lng}\n"
        f"Plataforma GEOIGNIS: http://localhost:5173"
    )
    return msg

def get_whatsapp_dispatch_link(alert_data: dict) -> str:
    """Genera un enlace wa.me para enviar la alerta directamente a WhatsApp."""
    text = format_alert_message(alert_data)
    encoded = urllib.parse.quote(text)
    return f"https://api.whatsapp.com/send?text={encoded}"

def send_telegram_alert(alert_data: dict, bot_token: str = None, chat_id: str = None) -> dict:
    """
    Envía la alerta al canal o chat de Telegram especificado.
    Si no se configuran credenciales, opera en modo simulación para pruebas del hackathon.
    """
    token = bot_token or TELEGRAM_BOT_TOKEN
    cid = chat_id or TELEGRAM_CHAT_ID
    msg = format_alert_message(alert_data)

    if not token or not cid:
        # Modo simulación para el hackathon
        print("\n[TELEGRAM SIMULADO] Mensaje despachado:")
        print(msg)
        print("-" * 50)
        return {
            "status": "simulated",
            "message": "Alerta registrada y formateada (Modo Demostración). Para envío real a chat configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.",
            "content": msg,
            "whatsapp_link": get_whatsapp_dispatch_link(alert_data)
        }

    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": cid,
            "text": msg
        }
        res = requests.post(url, json=payload, timeout=8)
        if res.status_code == 200:
            return {"status": "success", "detail": "Alerta entregada a Telegram", "whatsapp_link": get_whatsapp_dispatch_link(alert_data)}
        else:
            return {"status": "error", "code": res.status_code, "detail": res.text}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

def send_webhook_alert(webhook_url: str, alert_data: dict) -> dict:
    """Envía un POST JSON a un webhook externo."""
    try:
        res = requests.post(webhook_url, json=alert_data, timeout=5)
        return {"status": "success", "code": res.status_code}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
