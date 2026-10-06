// Six-bit mosaics: two columns and three rows, separated like a terminal cell.
export function drawMosaic(ctx: CanvasRenderingContext2D, bits: number, x: number, y: number, width: number, height: number): void {
  for (let bit=0; bit<6; bit++) if (bits & (1 << bit)) {
    ctx.fillRect(x + (bit%2)*width/2, y + Math.floor(bit/2)*height/3, width/2-1, height/3-1);
  }
}
