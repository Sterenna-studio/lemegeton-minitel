// Film grain over the 3D view while the camera travels (the travelling looks
// like old film). One small tile of noise, drawn once and repeated by CSS ;
// world.css shakes it a few times a second (none with reduced motion).

let tile: string | undefined;

/** Data URL of a 160 px tile of grey noise, mostly transparent. */
export function grainTile(): string {
  if (tile) return tile;
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return (tile = "");
  const image = context.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const grey = Math.random() * 255;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = grey;
    // Sparse specks : about one pixel in three shows.
    image.data[i + 3] = Math.random() < 0.35 ? 30 + Math.random() * 60 : 0;
  }
  context.putImageData(image, 0, 0);
  return (tile = canvas.toDataURL("image/png"));
}
