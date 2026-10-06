// Six-bit mosaics: two columns and three rows. Contiguous by default, as on
// the Minitel ; "separated" leaves a gap around each sextant (Videotex disjoint mode).
export function drawMosaic(
  ctx: CanvasRenderingContext2D,
  bits: number,
  x: number,
  y: number,
  width: number,
  height: number,
  separated = false,
): void {
  const gap = separated ? 1 : 0;
  for (let bit = 0; bit < 6; bit++)
    if (bits & (1 << bit)) {
      ctx.fillRect(
        x + ((bit % 2) * width) / 2,
        y + (Math.floor(bit / 2) * height) / 3,
        width / 2 - gap,
        height / 3 - gap,
      );
    }
}
