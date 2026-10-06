// Mobilier sous les terminaux de bureau : les quatre pieces de « Wood Drawer &
// Tables Set » (brandon_grey, CC BY 4.0), preparees par tools/prepare_table.py
// (mesures dans docs/asset-audit/mobilier.json). Le terminal reste a l'origine :
// la piece est descendue de la hauteur de son plateau et avancee pour porter
// le boitier (z de -1 a 1) et le clavier (jusqu'a z = 3,1). Donnees pures.

export interface Furniture {
  id: string;
  label: string;
  /** Fichier sous public/models/mobilier, ou null pour poser le terminal au sol. */
  file: string | null;
  /** Hauteur du plateau, en unites (1 m = 8). */
  top: number;
  /** Avancee de la piece sous le terminal. */
  offsetZ: number;
}

export const furniture: Furniture[] = [
  { id: "table-tiroir", label: "Table a tiroir (59 x 60 cm)", file: "table-tiroir.glb", top: 5.9513, offsetZ: 0.75 },
  { id: "chevet-haut", label: "Chevet haut (49 x 50 cm)", file: "chevet-haut.glb", top: 6.8675, offsetZ: 1.04 },
  { id: "meuble-niche", label: "Meuble a niche (74 x 49 cm)", file: "meuble-niche.glb", top: 5.8908, offsetZ: 1.04 },
  { id: "table-basse", label: "Table basse (150 x 70 cm)", file: "table-basse.glb", top: 5.2465, offsetZ: 0.9 },
  { id: "sol", label: "Sans table (au sol)", file: null, top: 0, offsetZ: 0 },
];

export const defaultFurniture = furniture[0];

export function findFurniture(id: string | null): Furniture {
  return furniture.find((item) => item.id === id) ?? defaultFurniture;
}
