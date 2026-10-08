import { RepeatWrapping, type CanvasTexture } from "three";
import { canvasTexture, seeded } from "../kit";

// Printed and woven things of the rooms, drawn on canvas : no file to load,
// the same picture on every visit (seeded). Palettes from
// docs/DIRECTION_ARTISTIQUE.md : 1950 pastels and teak, 1982 beige and
// grey-blue, Terminatel brass on black.

const tau = Math.PI * 2;

function speckle(g: CanvasRenderingContext2D, w: number, h: number, count: number, colors: string[], size: number, seed: number) {
  const random = seeded(seed);
  for (let i = 0; i < count; i++) {
    g.fillStyle = colors[Math.floor(random() * colors.length)];
    g.globalAlpha = 0.25 + random() * 0.5;
    const s = size * (0.4 + random());
    g.fillRect(random() * w, random() * h, s, s);
  }
  g.globalAlpha = 1;
}

function repeating(texture: CanvasTexture, x: number, y: number): CanvasTexture {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(x, y);
  return texture;
}

/** 1950s rug : ochre field, teal border, atomic boomerangs and starbursts. */
export function rugTexture(): CanvasTexture {
  return canvasTexture(512, 352, (g) => {
    const w = 512;
    const h = 352;
    g.fillStyle = "#2b5752";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#e9dcc0";
    g.fillRect(18, 18, w - 36, h - 36);
    g.fillStyle = "#c6913f";
    g.fillRect(26, 26, w - 52, h - 52);
    speckle(g, w, h, 2600, ["#b07f34", "#d6a656", "#a8742c"], 2, 50);
    const random = seeded(1950);
    for (let i = 0; i < 14; i++) {
      const x = 60 + random() * (w - 120);
      const y = 60 + random() * (h - 120);
      g.save();
      g.translate(x, y);
      g.rotate(random() * tau);
      if (i % 2 === 0) {
        // Boomerang.
        g.fillStyle = ["#2b5752", "#9c3b2e", "#1e1a16"][i % 3];
        g.beginPath();
        g.moveTo(-34, 6);
        g.quadraticCurveTo(0, -30, 34, 6);
        g.quadraticCurveTo(0, -12, -34, 6);
        g.fill();
      } else {
        // Starburst.
        g.strokeStyle = "#1e1a16";
        g.lineWidth = 2;
        for (let r = 0; r < 8; r++) {
          g.rotate(tau / 8);
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(0, 16 + (r % 2) * 8);
          g.stroke();
        }
        g.fillStyle = "#e9dcc0";
        g.beginPath();
        g.arc(0, 0, 4, 0, tau);
        g.fill();
      }
      g.restore();
    }
  });
}

/** Mid-century abstract painting : organic shapes on off-white. */
export function paintingTexture(): CanvasTexture {
  return canvasTexture(384, 288, (g) => {
    g.fillStyle = "#ece2cc";
    g.fillRect(0, 0, 384, 288);
    const blob = (color: string, x: number, y: number, rx: number, ry: number, turn: number) => {
      g.fillStyle = color;
      g.beginPath();
      g.ellipse(x, y, rx, ry, turn, 0, tau);
      g.fill();
    };
    blob("#2f6b66", 120, 150, 90, 58, -0.5);
    blob("#d9a441", 250, 110, 70, 46, 0.4);
    blob("#c45a43", 270, 200, 46, 30, -0.2);
    blob("#1e1a16", 95, 80, 18, 18, 0);
    g.strokeStyle = "#1e1a16";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(30, 240);
    g.bezierCurveTo(130, 170, 210, 290, 350, 60);
    g.stroke();
    g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(300 + i * 8, 250);
      g.lineTo(330 + i * 8, 180);
      g.stroke();
    }
  });
}

/** Daylight through a window : sky, and the trees (1950) or the buildings (1982) across. */
export function skyTexture(view: "jardin" | "ville"): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, view === "jardin" ? "#9cc3dc" : "#b9c6cf");
    sky.addColorStop(0.7, view === "jardin" ? "#e9eedf" : "#e6e8e2");
    sky.addColorStop(1, "#f4efe0");
    g.fillStyle = sky;
    g.fillRect(0, 0, 256, 256);
    const random = seeded(view === "jardin" ? 7 : 82);
    if (view === "jardin") {
      g.fillStyle = "#6f8a62";
      for (let i = 0; i < 9; i++) {
        g.beginPath();
        g.arc(random() * 256, 200 + random() * 30, 26 + random() * 30, 0, tau);
        g.fill();
      }
      g.fillStyle = "#88a070";
      g.fillRect(0, 226, 256, 30);
    } else {
      for (let x = -10; x < 256; ) {
        const width = 30 + random() * 40;
        const top = 90 + random() * 90;
        g.fillStyle = ["#a7aaa6", "#959994", "#b4b2aa"][Math.floor(random() * 3)];
        g.fillRect(x, top, width, 256 - top);
        g.fillStyle = "#d9dcd6";
        for (let y = top + 8; y < 250; y += 12) for (let wx = x + 5; wx < x + width - 6; wx += 9) g.fillRect(wx, y, 4, 6);
        x += width + 4;
      }
    }
  });
}

/** Wall calendar, October 1982 (the 1st was a Friday). */
export function calendarTexture(): CanvasTexture {
  return canvasTexture(256, 384, (g) => {
    g.fillStyle = "#f3efe4";
    g.fillRect(0, 0, 256, 384);
    // The month's picture : a coast.
    const sea = g.createLinearGradient(0, 16, 0, 170);
    sea.addColorStop(0, "#8fb8cf");
    sea.addColorStop(1, "#2f6f8f");
    g.fillStyle = sea;
    g.fillRect(16, 16, 224, 154);
    g.fillStyle = "#6c6a52";
    g.beginPath();
    g.moveTo(16, 170);
    g.lineTo(16, 92);
    g.lineTo(90, 120);
    g.lineTo(150, 170);
    g.fill();
    g.fillStyle = "#b32f2a";
    g.fillRect(16, 182, 224, 30);
    g.fillStyle = "#f3efe4";
    g.font = "bold 20px monospace";
    g.textAlign = "center";
    g.fillText("OCTOBRE 1982", 128, 204);
    g.fillStyle = "#2a2622";
    g.font = "bold 13px monospace";
    const days = ["L", "M", "M", "J", "V", "S", "D"];
    days.forEach((d, i) => g.fillText(d, 32 + i * 32, 232));
    g.font = "14px monospace";
    // Friday 1st : column 4.
    for (let day = 1; day <= 31; day++) {
      const cell = day + 3;
      const col = cell % 7;
      const row = Math.floor(cell / 7);
      g.fillStyle = col === 6 ? "#b32f2a" : "#2a2622";
      g.fillText(String(day), 32 + col * 32, 256 + row * 24);
    }
  });
}

/** Cork board with pinned notes. */
export function corkTexture(): CanvasTexture {
  return canvasTexture(512, 320, (g) => {
    g.fillStyle = "#a9773f";
    g.fillRect(0, 0, 512, 320);
    speckle(g, 512, 320, 5000, ["#7e5428", "#c8955a", "#6b4520", "#d9aa6c"], 3, 3);
    const random = seeded(1982);
    const notes = ["#f2e36b", "#f4f1e8", "#f2a7b6", "#a8d4e6", "#f4f1e8", "#f2e36b", "#f4f1e8"];
    notes.forEach((color, i) => {
      const x = 30 + (i % 4) * 118 + random() * 20;
      const y = 26 + Math.floor(i / 4) * 150 + random() * 20;
      const w = color === "#f4f1e8" ? 92 : 70;
      const h = color === "#f4f1e8" ? 118 : 70;
      g.save();
      g.translate(x + w / 2, y + h / 2);
      g.rotate((random() - 0.5) * 0.25);
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
      g.fillStyle = color;
      g.fillRect(-w / 2, -h / 2, w, h);
      g.strokeStyle = "rgba(40,40,60,0.55)";
      g.lineWidth = 1.5;
      for (let line = -h / 2 + 18; line < h / 2 - 8; line += 11) {
        g.beginPath();
        g.moveTo(-w / 2 + 8, line);
        g.lineTo(-w / 2 + 8 + (w - 16) * (0.5 + random() * 0.5), line);
        g.stroke();
      }
      g.fillStyle = ["#c0392b", "#2c6fb0", "#2e8b57"][i % 3];
      g.beginPath();
      g.arc(0, -h / 2 + 7, 5, 0, tau);
      g.fill();
      g.restore();
    });
  });
}

/** Needle-felt carpet, grey-blue, in 50 cm tiles. */
export function carpetTexture(): CanvasTexture {
  const texture = canvasTexture(256, 256, (g) => {
    g.fillStyle = "#59636d";
    g.fillRect(0, 0, 256, 256);
    speckle(g, 256, 256, 9000, ["#4b545d", "#6a747e", "#525c66", "#707a83"], 1.6, 9);
    // Joints between the tiles, barely visible.
    g.fillStyle = "rgba(30,34,40,0.12)";
    g.fillRect(0, 0, 256, 1);
    g.fillRect(0, 0, 1, 256);
  });
  return repeating(texture, 8, 10);
}

/** Suspended ceiling : fissured mineral tiles in a T-bar grid, 60 cm. */
export function ceilingTexture(): CanvasTexture {
  const texture = canvasTexture(256, 256, (g) => {
    g.fillStyle = "#e9e5d9";
    g.fillRect(0, 0, 256, 256);
    speckle(g, 256, 256, 1600, ["#c9c4b6", "#d8d3c6", "#bdb7a8"], 2.2, 60);
    g.fillStyle = "#c2c0b8";
    g.fillRect(0, 0, 256, 6);
    g.fillRect(0, 0, 6, 256);
  });
  return repeating(texture, 32 / 4.8, 40 / 4.8);
}

/** Clock face : cream with brass marks (1950), or office white with numerals (1982). */
export function clockFaceTexture(kind: "soleil" | "bureau"): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.translate(128, 128);
    g.fillStyle = kind === "soleil" ? "#efe3c4" : "#f6f5f0";
    g.beginPath();
    g.arc(0, 0, 128, 0, tau);
    g.fill();
    g.fillStyle = kind === "soleil" ? "#8a6a2f" : "#1d1d1d";
    g.font = "bold 30px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let hour = 1; hour <= 12; hour++) {
      const angle = (hour / 12) * tau - Math.PI / 2;
      if (kind === "bureau") g.fillText(String(hour), Math.cos(angle) * 96, Math.sin(angle) * 96);
      else {
        g.save();
        g.rotate(angle);
        g.fillRect(84, -4, hour % 3 === 0 ? 30 : 18, 8);
        g.restore();
      }
    }
    // Ten past ten, like a catalogue picture.
    g.strokeStyle = kind === "soleil" ? "#5a4320" : "#1d1d1d";
    g.lineCap = "round";
    const hand = (angle: number, length: number, width: number) => {
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(angle - Math.PI / 2) * length, Math.sin(angle - Math.PI / 2) * length);
      g.stroke();
    };
    hand((10.17 / 12) * tau, 62, 9);
    hand((2 / 12) * tau, 96, 6);
    if (kind === "bureau") {
      g.strokeStyle = "#b32f2a";
      hand((7 / 12) * tau, 100, 2);
    }
  });
}

/** Engraved brass plate of the Terminatel room. */
export function plaqueTexture(): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    const brass = g.createLinearGradient(0, 0, 512, 128);
    brass.addColorStop(0, "#8c6a35");
    brass.addColorStop(0.5, "#c9a463");
    brass.addColorStop(1, "#8c6a35");
    g.fillStyle = brass;
    g.fillRect(0, 0, 512, 128);
    g.strokeStyle = "#5c4320";
    g.lineWidth = 4;
    g.strokeRect(10, 10, 492, 108);
    g.fillStyle = "#3a2a12";
    g.textAlign = "center";
    g.font = "bold 44px serif";
    g.fillText("TERMINATEL 255", 256, 66);
    g.font = "20px serif";
    g.fillText("MARBRE NOIR · SÉRIE LIMITÉE", 256, 100);
  });
}
