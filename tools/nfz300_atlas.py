# Texture des inscriptions du clavier du Minitel 1 NFZ 300 : une case par
# touche (128 x 64 points, inscription centrée à la proportion de la touche)
# et, en bas, le panneau du clavier avec « MINITEL 1 » et « LA RADIOTECHNIQUE ».
# Disposition : tools/nfz300_keyboard.json (relevée sur la photo ACONIT).
#
# Usage : python tools/nfz300_atlas.py [sortie.png]   (Pillow)
# Défaut : sources/build/nfz300-atlas.png, lu par tools/prepare_nfz300.py.
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
LAYOUT = json.loads((ROOT / "tools/nfz300_keyboard.json").read_text(encoding="utf-8"))
OUTPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "sources/build/nfz300-atlas.png"

SIZE = 1024
CELL_W, CELL_H, COLS = 128, 64, 8
# Couleurs relevées sur la photo : touches blanc cassé, ENVOI vert, panneau grège.
KEY = (238, 234, 222)
ENVOI = (143, 176, 116)
INK = (60, 64, 72)
PANEL = (196, 187, 166)
BODY = (222, 215, 197)
PANEL_TOP = 600


def font(size, bold=True):
    for name in (("arialbd.ttf" if bold else "arial.ttf"), "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def key_rect(index, w, h):
    """Sub-rectangle of a cell with the key's proportions (pixels)."""
    col, row = index % COLS, index // COLS
    x0, y0 = col * CELL_W, row * CELL_H
    scale = min((CELL_W - 8) / w, (CELL_H - 8) / h)
    kw, kh = w * scale, h * scale
    return (x0 + (CELL_W - kw) / 2, y0 + (CELL_H - kh) / 2, x0 + (CELL_W + kw) / 2, y0 + (CELL_H + kh) / 2)


def main():
    image = Image.new("RGB", (SIZE, SIZE), BODY)
    draw = ImageDraw.Draw(image)
    keys = LAYOUT["keys"]
    assert len(keys) < COLS * (PANEL_TOP // CELL_H) - 1
    for index, key in enumerate(keys):
        col, row = index % COLS, index // COLS
        fill = ENVOI if key["kind"] == "envoi" else KEY
        draw.rectangle((col * CELL_W, row * CELL_H, (col + 1) * CELL_W - 1, (row + 1) * CELL_H - 1), fill=fill)
        x0, y0, x1, y1 = key_rect(index, key["w"], key["h"])
        label = key["label"]
        if not label:
            continue
        lines = label.split("\n")
        big = len(label) <= 2
        size = int((y1 - y0) * (0.62 if big else 0.5 if len(lines) == 1 else 0.34))
        if not big:
            # Long names : the font shrinks to fit the width.
            while size > 6 and max(draw.textlength(line, font=font(size)) for line in lines) > (x1 - x0) * 0.86:
                size -= 1
        f = font(size)
        total = size * len(lines) * 1.1
        for n, line in enumerate(lines):
            width = draw.textlength(line, font=f)
            draw.text(((x0 + x1 - width) / 2, (y0 + y1 - total) / 2 + n * size * 1.1), line, font=f, fill=INK)
    # Blank key colour for the sides of the keys (last cell).
    blank = COLS * (PANEL_TOP // CELL_H) - 1
    draw.rectangle(((blank % COLS) * CELL_W, (blank // COLS) * CELL_H, (blank % COLS + 1) * CELL_W - 1, (blank // COLS + 1) * CELL_H - 1), fill=KEY)
    # Keyboard panel, with its two inscriptions.
    pw = SIZE
    ph = round(SIZE * LAYOUT["panel"]["height"] / LAYOUT["panel"]["width"])
    draw.rectangle((0, PANEL_TOP, pw - 1, PANEL_TOP + ph - 1), fill=PANEL)
    draw.text((14, PANEL_TOP + 6), LAYOUT["panel"]["brand"], font=font(16), fill=INK)
    maker = LAYOUT["panel"]["maker"]
    f = font(11, bold=False)
    draw.text((pw - 14 - draw.textlength(maker, font=f), PANEL_TOP + ph - 18), maker, font=f, fill=INK)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT)
    print(f"atlas {OUTPUT} : {len(keys)} touches, panneau {pw} x {ph} a y = {PANEL_TOP}")


if __name__ == "__main__":
    main()
