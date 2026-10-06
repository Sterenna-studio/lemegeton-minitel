import { BufferGeometry, PlaneGeometry, Vector3 } from "three";

/**
 * Remplace un ecran plat par une dalle de verre bombee, comme un tube
 * cathodique : la surface reste au contact du cadre sur les bords et avance
 * au centre de `depth` (unites du modele), dans le sens de sa normale.
 * Les UV d'origine sont conservees (meme orientation, memes coins).
 * Renvoie null si l'ecran est deja courbe (ex. le televiseur).
 */
export function bulgedScreenGeometry(source: BufferGeometry, depth: number): BufferGeometry | null {
  source.computeBoundingBox();
  const box = source.boundingBox!;
  const size = box.getSize(new Vector3());
  const span = Math.max(size.x, size.y);
  if (!span || size.z > span * 0.002) return null;
  const position = source.getAttribute("position");
  const uv = source.getAttribute("uv");
  if (!uv) return null;
  // Orientation des UV : coordonnees de texture aux bords gauche/droite et bas/haut.
  let u0 = 0, u1 = 1, v0 = 0, v1 = 1;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i);
    if (Math.abs(x - box.min.x) < 1e-5) u0 = uv.getX(i);
    if (Math.abs(x - box.max.x) < 1e-5) u1 = uv.getX(i);
    if (Math.abs(y - box.min.y) < 1e-5) v0 = uv.getY(i);
    if (Math.abs(y - box.max.y) < 1e-5) v1 = uv.getY(i);
  }
  source.computeVertexNormals();
  const facing = Math.sign(source.getAttribute("normal").getZ(0)) || 1;
  const plane = new PlaneGeometry(size.x, size.y, 48, 36);
  const center = box.getCenter(new Vector3());
  const points = plane.getAttribute("position");
  const coords = plane.getAttribute("uv");
  for (let i = 0; i < points.count; i++) {
    const nx = (2 * points.getX(i)) / size.x;
    const ny = (2 * points.getY(i)) / size.y;
    const bulge = depth * (1 - nx * nx) * (1 - ny * ny);
    points.setXYZ(i, center.x + points.getX(i), center.y + points.getY(i), center.z + facing * bulge);
    const tx = (nx + 1) / 2, ty = (ny + 1) / 2;
    coords.setXY(i, u0 + (u1 - u0) * tx, v0 + (v1 - v0) * ty);
  }
  if (facing < 0) plane.index?.array.reverse();
  plane.computeVertexNormals();
  return plane;
}
