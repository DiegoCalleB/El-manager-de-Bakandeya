"""
Bakandeya Follower Tracker
==========================
Agente de snapshot diario para el Bakandeya Control Center.
Guarda seguidores de YouTube, Instagram y TikTok en un CSV histórico,
para poder graficar la evolución con el tiempo.

Uso:
    python bakandeya_followers_tracker.py

Configura las credenciales abajo (o mejor, usa variables de entorno).
Pensado para ejecutarse 1 vez al día vía cron / Task Scheduler.
"""

import csv
import os
import sys
import subprocess
from datetime import datetime, timezone

REQUIRED = ["requests", "google-api-python-client"]
for pkg in REQUIRED:
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q",
                                "--break-system-packages"])

import requests

# ─────────────────────────────────────────────────────────────
# CONFIGURACIÓN — preconfigurada con los handles reales de la banda
# ─────────────────────────────────────────────────────────────

CSV_PATH = "bakandeya_followers_history.csv"

# Reemplaza con tu API Key de YouTube o configúrala en el entorno
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "TU_API_KEY_AQUI")
# Reemplaza con el Channel ID real de YouTube (UCxxxxxxxx)
YOUTUBE_CHANNEL_ID = os.environ.get("YOUTUBE_CHANNEL_ID", "UC_REAL_CHANNEL_ID_HERE")

# Configurado con los handles oficiales encontrados de la banda
INSTAGRAM_USERNAME = "bakandeya"
TIKTOK_USERNAME = "bakandeya"


# ─────────────────────────────────────────────────────────────
# YOUTUBE — API oficial, 100% fiable
# ─────────────────────────────────────────────────────────────

def get_youtube_subscribers(api_key: str, channel_id: str) -> int | None:
    """Requiere YOUTUBE_API_KEY y el channel_id (no el @handle).
    Consigue el channel_id en https://commentpicker.com/youtube-channel-id.php
    """
    if not api_key or api_key == "TU_API_KEY_AQUI" or not channel_id or "UC_REAL" in channel_id:
        print("⚠️  YouTube: falta API key o channel_id correcto, se omite.")
        return None
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {"part": "statistics", "id": channel_id, "key": api_key}
    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        items = data.get("items", [])
        if not items:
            print("⚠️  YouTube: canal no encontrado.")
            return None
        return int(items[0]["statistics"]["subscriberCount"])
    except Exception as e:
        print(f"⚠️  YouTube: error al obtener suscriptores ({e}).")
        return None


# ─────────────────────────────────────────────────────────────
# INSTAGRAM — sin API pública simple para esto.
# Opción A (recomendada si es cuenta Business/Creator vinculada a
#           una Página de Facebook): Graph API oficial.
# Opción B (fallback): instaloader, lee el perfil público.
#           OJO: es scraping. Instagram puede rate-limitar o
#           bloquear la IP si se llama con demasiada frecuencia.
# ─────────────────────────────────────────────────────────────

def get_instagram_followers_scrape(username: str) -> int | None:
    try:
        import instaloader
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install",
                                "instaloader", "-q", "--break-system-packages"])
        import instaloader

    try:
        L = instaloader.Instaloader(quiet=True)
        profile = instaloader.Profile.from_username(L.context, username)
        return profile.followers
    except Exception as e:
        print(f"⚠️  Instagram: no se pudo leer el perfil ({e}). Intentando fallback ligero...")
        # Fallback de scraping HTTP directo simple en caso de que instaloader falle
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        try:
            r = requests.get(f"https://www.instagram.com/{username}/", headers=headers, timeout=10)
            if r.status_code == 200:
                import re
                match = re.search(r'"edge_followed_by":\s*\{\s*"count":\s*(\d+)\s*\}', r.text)
                if match:
                    return int(match.group(1))
        except Exception:
            pass
        return None


# ─────────────────────────────────────────────────────────────
# TIKTOK — scraping ligero del HTML público del perfil (sin login).
# Frágil: TikTok cambia el markup a menudo, esto puede romperse.
# ─────────────────────────────────────────────────────────────

def get_tiktok_followers_scrape(username: str) -> int | None:
    import re

    url = f"https://www.tiktok.com/@{username}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                              "AppleWebKit/537.36 (KHTML, like Gecko) "
                              "Chrome/120.0 Safari/537.36"}
    try:
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        match = re.search(r'"followerCount":(\d+)', r.text)
        if match:
            return int(match.group(1))
        # Intento de segundo patrón de búsqueda en el JSON de TikTok
        match_json = re.search(r'"stats":\s*\{\s*"followerCount":\s*(\d+)', r.text)
        if match_json:
            return int(match_json.group(1))
        print("⚠️  TikTok: no se encontró followerCount en el HTML "
              "(posible cambio de estructura de la página).")
        return None
    except Exception as e:
        print(f"⚠️  TikTok: error al leer el perfil ({e}).")
        return None


# ─────────────────────────────────────────────────────────────
# GUARDADO EN CSV HISTÓRICO
# ─────────────────────────────────────────────────────────────

def append_snapshot(csv_path: str, youtube, instagram, tiktok):
    file_exists = os.path.isfile(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp_utc", "youtube_subs",
                              "instagram_followers", "tiktok_followers"])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(timespec="seconds"),
            youtube if youtube is not None else "",
            instagram if instagram is not None else "",
            tiktok if tiktok is not None else "",
        ])
    print(f"✅ Snapshot guardado correctamente en {csv_path}")


def main():
    print("📊 Bakandeya Follower Tracker — snapshot de hoy\n")

    yt = get_youtube_subscribers(YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID)
    ig = get_instagram_followers_scrape(INSTAGRAM_USERNAME)
    tk = get_tiktok_followers_scrape(TIKTOK_USERNAME)

    print(f"Canales Escaneados:")
    print(f"  - YouTube:   {yt if yt is not None else 'No configurado o fallido'}")
    print(f"  - Instagram: {ig if ig is not None else 'No configurado o fallido'}")
    print(f"  - TikTok:    {tk if tk is not None else 'No configurado o fallido'}")

    # Guardar solo si al menos uno de los tres tiene datos válidos
    if yt is not None or ig is not None or tk is not None:
        append_snapshot(CSV_PATH, yt, ig, tk)
    else:
        print("❌ No se ha podido obtener información válida de ningún canal. No se guarda snapshot.")


if __name__ == "__main__":
    main()
