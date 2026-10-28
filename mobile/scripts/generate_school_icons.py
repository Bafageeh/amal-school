from __future__ import annotations

import base64
import io
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
MOBILE = ROOT / "mobile"
ASSETS = MOBILE / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

logo_file = ROOT / "public" / "images" / "school-logo.svg"
match = re.search(r"data:image/webp;base64,([A-Za-z0-9+/=]+)", logo_file.read_text(encoding="utf-8"))
if not match:
    raise RuntimeError("Could not locate school's embedded logo image")
logo = Image.open(io.BytesIO(base64.b64decode(match.group(1)))).convert("RGBA")
logo.thumbnail((650, 655), Image.Resampling.LANCZOS)

size = 1024
icon = Image.new("RGBA", (size, size), "#7757A6")
draw = ImageDraw.Draw(icon)
for y in range(size):
    t = y / (size - 1)
    r = int(179 * (1-t) + 92*t)
    g = int(151 * (1-t) + 67*t)
    b = int(219 * (1-t) + 150*t)
    draw.line([(0,y),(size,y)], fill=(r,g,b,255))
draw.rounded_rectangle((95,95,929,929), radius=190, fill=(255,255,255,245))
x = (size - logo.width)//2
y = (size - logo.height)//2
icon.alpha_composite(logo, (x,y))
icon.convert("RGB").save(ASSETS / "icon.png")
icon.convert("RGB").save(ASSETS / "adaptive-icon.png")
icon.resize((512,512), Image.Resampling.LANCZOS).convert("RGB").save(ASSETS / "splash-icon.png")
icon.resize((48,48), Image.Resampling.LANCZOS).convert("RGB").save(ASSETS / "favicon.png")

config = MOBILE / "app.json"
data = json.loads(config.read_text(encoding="utf-8"))
data["expo"]["icon"] = "./assets/icon.png"
data["expo"]["android"]["adaptiveIcon"] = {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#F5EFFC"
}
data["expo"]["splash"] = {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#F5EFFC"
}
config.write_text(json.dumps(data, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print("Created branded launcher and splash assets for the 112 school app")
