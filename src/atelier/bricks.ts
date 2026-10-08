// Bricks of the explorable world, each shown alone in the workshop
// (atelier/?brique=…). Pure data : the page and the tests read it.

export interface Brick {
  id: "porte" | "couloir" | "salle";
  title: string;
  summary: string;
  /** Implementation lot (docs/MONDE_EXPLORABLE.md, §12). */
  lot: string;
  ready: boolean;
}

export const bricks: Brick[] = [
  {
    id: "porte",
    title: "Porte temporelle",
    summary: "Battant, poignée, compteur d'année, pendule et lumière de l'époque ; séquence d'ouverture et de retour.",
    lot: "B",
    ready: true,
  },
  {
    id: "couloir",
    title: "Couloir",
    summary: "Kit modulaire hors du temps, trois portes dans l'ordre chronologique, grande horloge, postes du rail.",
    lot: "C",
    ready: false,
  },
  {
    id: "salle",
    title: "Salles",
    summary: "Une salle par terminal du catalogue : salon 1950, bureau 1982, salle du Terminatel 255.",
    lot: "E",
    ready: false,
  },
];

export function findBrick(id: string | null): Brick | undefined {
  return bricks.find((brick) => brick.id === id);
}
