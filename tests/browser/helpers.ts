import { expect, type Page } from "@playwright/test";
import sharp from "sharp";

// Shared by the browser specs : read the WebGL canvas of the scene.
export async function scenePixels(page: Page) {
  return page.locator('[data-testid="scene"] canvas').evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    if (!gl) throw new Error("WebGL2 absent");
    const pixels = new Uint8Array(
      gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
    );
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );
    // The canvas is transparent over a dark CSS background : opaque pixels are
    // the model, while the shadow catcher stays translucent.
    let object = 0,
      colored = 0,
      hash = 0,
      minX = Infinity,
      maxX = 0,
      minY = Infinity,
      maxY = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] >= 250) object++;
      // Bounds follow the green phosphor of the screen : the terminal itself
      // must stay in frame, while its table may run off the edges.
      if (
        pixels[i + 3] >= 250 &&
        pixels[i + 1] > pixels[i] * 1.2 &&
        pixels[i + 1] > pixels[i + 2] * 1.05
      ) {
        colored++;
        const x = (i / 4) % gl.drawingBufferWidth;
        const y = Math.floor(i / 4 / gl.drawingBufferWidth);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      hash =
        (hash + pixels[i] * 3 + pixels[i + 1] * 5 + pixels[i + 2] * 7) %
        1000000007;
    }
    return {
      object,
      colored,
      hash,
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      minX,
      maxX,
      minY,
      maxY,
    };
  });
}
// The camera aims at the centre of the screen : the green phosphor block must
// sit around the middle of the canvas.
export function expectScreenCentered(p: Awaited<ReturnType<typeof scenePixels>>) {
  const cx = (p.minX + p.maxX) / 2 / p.width;
  const cy = (p.minY + p.maxY) / 2 / p.height;
  expect(Math.abs(cx - 0.5)).toBeLessThan(0.06);
  expect(Math.abs(cy - 0.5)).toBeLessThan(0.06);
}

/**
 * Lit pixels and the share of the era's tint (blue-green), measured on a
 * screenshot of the stage : what the visitor sees. Reading the WebGL buffer
 * directly sometimes returned an empty buffer late in a long run.
 */
export async function stagePixels(page: Page, selector = ".door-stage") {
  const shot = await page.locator(selector).screenshot();
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  let lit = 0;
  let teal = 0;
  let hash = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r + g + b > 60) lit++;
    if (g > 120 && b > 110 && g > r * 1.15) teal++;
    hash = (hash + r * 3 + g * 5 + b * 7) % 1000000007;
  }
  return { lit, teal, hash };
}
