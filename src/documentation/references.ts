// Inventaire des photos de reference du Terminatel 255. Le CSV est versionne ;
// les images ne le sont pas (voir .gitignore) et ne sont affichees qu'en dev.
import inventory from "../../docs/Minitel Telic Alactel Terminatel 255 noir marbré série limitée années 80 vintage/inventaire-images.csv?raw";

export const referenceFolder = [
  "docs",
  "Minitel Telic Alactel Terminatel 255 noir marbré série limitée années 80 vintage",
]
  .map(encodeURIComponent)
  .join("/");

export interface ReferencePhoto {
  view: string;
  category: string;
  description: string;
  /** Chemins encodes, relatifs au dossier de reference. */
  small: string;
  large: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) rows.push([...row, field]);
  const [header, ...body] = rows;
  const keys = header.map((key) => (key.charCodeAt(0) === 0xfeff ? key.slice(1) : key));
  return body.map((cells) => Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""])));
}

const encode = (path: string) => path.split("/").map(encodeURIComponent).join("/");
const categories: Record<string, string> = {
  "01-vues-ensemble": "Vues d'ensemble",
  "02-ecran-et-coque": "Ecran et coque",
  "03-arriere-et-accessoires": "Arriere et accessoires",
  "04-clavier-et-combine": "Clavier et combine",
  "05-marquages": "Marquages",
};

function buildPhotos(): ReferencePhoto[] {
  const byView = new Map<string, Record<string, string>[]>();
  for (const row of parseCsv(inventory))
    byView.set(row.view, [...(byView.get(row.view) ?? []), row]);
  return [...byView.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([view, rows]) => {
      const webp = rows.filter((row) => row.format === "WEBP");
      const pool = webp.length ? webp : rows;
      const bySize = [...pool].sort((a, b) => Number(a.width) - Number(b.width));
      const smallest = bySize.find((row) => Number(row.width) >= 360) ?? bySize[0];
      return {
        view,
        category: categories[rows[0].path.split("/")[0]] ?? "",
        description: rows[0].description,
        small: encode(smallest.path),
        large: encode(bySize[bySize.length - 1].path),
      };
    });
}

export const referencePhotos = buildPhotos();
