// Prépare la sélection Goto10 du service 3615 GOTO10 (src/goto10/) à partir de
// la copie locale de l'archive (docs/archive_minitel/, non versionnée) :
// - les écrans Vidéotex d'époque (.vdt), copiés tels quels ;
// - des documents texte, décodés (CP437 ou Latin-1) et coupés en lignes de
//   40 colonnes, comme sur l'écran du Minitel.
// Rien d'autre n'est publié : ni exécutables, ni archives, ni images.
//
// Usage : node tools/build_goto10.mjs [dossier de l'archive] [sortie]
// Défaut : docs/archive_minitel -> public/goto10
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const SOURCE = resolve(process.argv[2] ?? join(root, "docs/archive_minitel"));
const OUT = resolve(process.argv[3] ?? join(root, "public/goto10"));
const MINITEL = join(SOURCE, "minitel");
const COLS = 40;
/** Lignes de texte par page de document (rangées 3 à 21). */
const PAGE_LINES = 19;

if (!existsSync(MINITEL)) {
  console.error(`archive absente : ${MINITEL} (copie locale de https://www.goto10.fr/)`);
  process.exit(1);
}

// --- Écrans Vidéotex -------------------------------------------------------------
const screens = [
  ["pinky-accueil", "rtcs/pinky/vdt/Accueil Pinky.vdt", "Pinky : accueil", "Pinky"],
  ["pinky-sommaire", "rtcs/pinky/vdt/Sommaire Pinky.vdt", "Pinky : sommaire", "Pinky"],
  ["pinky-god", "rtcs/pinky/vdt/God.vdt", "Pinky : God", "Pinky"],
  ["pinky-forum-minitel", "rtcs/pinky/vdt/Forum Minitel.vdt", "Pinky : forum Minitel", "Pinky"],
  ["pinky-forum-general", "rtcs/pinky/vdt/Forum General.vdt", "Pinky : forum general", "Pinky"],
  ["pinky-forum-atari", "rtcs/pinky/vdt/Forum Atari ST.vdt", "Pinky : forum Atari ST", "Pinky"],
  ["pinky-forum-oric", "rtcs/pinky/vdt/Forum Oric-1 Atmos.vdt", "Pinky : forum Oric-1 Atmos", "Pinky"],
  ["pinky-forum-telestrat", "rtcs/pinky/vdt/Forum Telestrat.vdt", "Pinky : forum Telestrat", "Pinky"],
  ["pinky-forum-musique", "rtcs/pinky/vdt/Forum Musique.vdt", "Pinky : forum musique", "Pinky"],
  ["pinky-forum-medias", "rtcs/pinky/vdt/Forum Medias.vdt", "Pinky : forum medias", "Pinky"],
  ["pinky-forum-litterature", "rtcs/pinky/vdt/Forum Litterature.vdt", "Pinky : forum litterature", "Pinky"],
  ["ellis", "rtcs/ellis/ellis.vdt", "Ellis", "Ellis"],
  ["teletel-guide", "videotex/ecrans/teletel2.vdt", "Teletel : guide des services", "France Telecom"],
  ["teletel-3", "videotex/ecrans/teletel3.vdt", "Teletel : page 3", "France Telecom"],
  ["rtel", "videotex/ecrans/rtel.vdt", "RTEL", ""],
  ["stmag", "videotex/ecrans/stmag.vdt", "ST Mag", ""],
  ["mgs", "videotex/ecrans/mgs.vdt", "MGS", ""],
  ["ngs", "videotex/ecrans/ngs.vdt", "NGS", ""],
  ["xfile", "videotex/ecrans/xfile.vdt", "X-File", ""],
  ["afp-photo", "videotex/ecrans/afpphoto.vdt", "AFP : photos", "AFP"],
  ["afp-photo-3", "videotex/ecrans/afpphot3.vdt", "AFP : photos (suite)", "AFP"],
  ["rte-eiffel", "videotex/ecrans/rte_eiff.vdt", "RTE : tour Eiffel", "RTE, Ressources Telematiques Europeennes"],
  ["rte-louvre", "videotex/ecrans/rte_louv.vdt", "RTE : Louvre", "RTE, Ressources Telematiques Europeennes"],
  ["rte-cana", "videotex/ecrans/rte_cana.vdt", "RTE : canape convertible", "RTE, Ressources Telematiques Europeennes"],
  ["rte-van2", "videotex/ecrans/rte_van2.vdt", "RTE : Van Gogh", "RTE, Ressources Telematiques Europeennes"],
  ["rte-drcs", "videotex/ecrans/rte_drcs.vdt", "RTE : caracteres DRCS", "RTE, Ressources Telematiques Europeennes"],
  ["flashcode", "videotex/flashcode/FlashCode.vdt", "Flashcode", ""],
  ["qrcode", "videotex/flashcode/QRCodeV2a.vdt", "QR code", ""],
];

// --- Documents -------------------------------------------------------------------
const listDir = (dir, ext) =>
  readdirSync(join(MINITEL, dir))
    .filter((name) => extname(name).toLowerCase() === ext)
    .sort()
    .map((name) => `${dir}/${name}`);

const sections = [
  {
    id: "presse",
    title: "Articles et annuaires",
    docs: [
      ["article-1998", "articles/minitel.txt", "Le Minitel ou l'archaisme francais (1998)"],
      ["serveurs-gratuits", "services/minitel.txt", "Liste des serveurs Minitel gratuits"],
    ],
  },
  {
    id: "services",
    title: "Annuaire des services",
    docs: [...listDir("services/general", ".txt"), ...listDir("services/entreprise", ".txt")].map((file) => [
      `services-${file.includes("entreprise") ? "pro-" : ""}${basename(file, ".txt")}`,
      file,
      null,
    ]),
  },
  {
    id: "gigantex",
    title: "Gigantex, journal des RTC",
    docs: listDir("gigantex", ".txt").map((file) => [`gigantex-${basename(file, ".txt")}`, file, null]),
  },
  {
    id: "technique",
    title: "La norme Videotex",
    docs: [
      ["videotex-sommaire", "videotex/videotex.hlp", "Aide Videotex : sommaire"],
      // Titres repris du sommaire de l'aide (videotex.hlp, Alexandre Montaron, 1992).
      ...[
        ["vdtx01-0", "Les codes de controle (< 32)"],
        ["vdtx02-0", "Les codes US (DRCS, STUTEL, STUCAM)"],
        ["vdtx03-0", "Les separateurs"],
        ["vdtx04-0", "Les codes ISO 2022 (1)"],
        ["vdtx04-1", "Les codes ISO 2022 (2)"],
        ["vdtx05-0", "Les codes escape"],
        ["vdtx06-0", "Les codes ANSI ou ISO 6429"],
        ["vdtx07-0", "Les autres codes du 80 colonnes"],
        ["vdtx08-0", "Les protocoles (1) : la liste"],
        ["vdtx08-1", "Les protocoles (2) : explications"],
        ["vdtx08-2", "Les protocoles (3) : ROM et RAM"],
        ["vdtx09-0", "Le clavier (1)"],
        ["vdtx09-1", "Le clavier (2)"],
        ["vdtx09-2", "Le clavier (3)"],
        ["vdtx10-0", "La prise peri-informatique"],
      ].map(([name, title]) => [`videotex-${name}`, `videotex/${name}.hlp`, title]),
      ["protrans", "protrans.txt", "Le protocole ProTrans"],
    ],
  },
];

// CP437 (DOS) au-dessus de 0x7F.
const CP437 =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";
const decodeCp437 = (bytes) => Array.from(bytes, (b) => (b < 0x80 ? String.fromCharCode(b) : CP437[b - 0x80])).join("");
const decodeLatin1 = (bytes) => new TextDecoder("windows-1252").decode(bytes);
const french = /[éèàçêâôûîùëïÉÈÀÇ]/g;

function decodeText(bytes) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (!utf8.includes("�")) return utf8;
  const dos = decodeCp437(bytes);
  const win = decodeLatin1(bytes);
  return (dos.match(french)?.length ?? 0) > (win.match(french)?.length ?? 0) ? dos : win;
}

/** Texte -> lignes de 40 colonnes : tabulations, cadres de tableaux, blancs. */
function wrap(text) {
  const lines = [];
  // Fin de fichier DOS (Ctrl-Z) et caractères de contrôle retirés.
  const eof = text.indexOf("\u001a");
  const body = eof >= 0 ? text.slice(0, eof) : text;
  for (let raw of body.replace(/\r\n?/g, "\n").split("\n")) {
    raw = Array.from(raw.replace(/\t/g, "    "))
      .filter((char) => char.charCodeAt(0) >= 0x20 && char.charCodeAt(0) !== 0x7f)
      .join("")
      .trimEnd();
    // Bordures de tableaux et lignes de séparation : un trait suffit.
    if (/^[\s+\-=_*!|#~.]{6,}$/.test(raw)) {
      if (lines.at(-1) !== "-".repeat(COLS)) lines.push("-".repeat(COLS));
      continue;
    }
    const line = raw.replace(/^\s*[!|]\s?/, "").replace(/\s?[!|]\s*$/, "").replace(/\s[!|]\s/g, "  ").replace(/ {3,}/g, "  ");
    if (!line.trim()) {
      if (lines.length && lines.at(-1) !== "") lines.push("");
      continue;
    }
    const indent = Math.min(line.match(/^ */)[0].length, 6);
    let rest = line.trim();
    let first = true;
    while (rest.length) {
      const width = COLS - (first ? indent : 0);
      if (rest.length <= width) {
        lines.push(" ".repeat(first ? indent : 0) + rest);
        break;
      }
      let cut = rest.lastIndexOf(" ", width);
      if (cut < width / 2) cut = width;
      lines.push(" ".repeat(first ? indent : 0) + rest.slice(0, cut).trimEnd());
      rest = rest.slice(cut).trimStart();
      first = false;
    }
  }
  while (lines.at(-1) === "" || lines.at(-1) === "-".repeat(COLS)) lines.pop();
  while (lines[0] === "" || lines[0] === "-".repeat(COLS)) lines.shift();
  return lines;
}

/** Titre d'un document sans titre donné : sa première ligne parlante. */
function titleOf(lines, file) {
  const first = lines.find((line) => /[A-Za-zÀ-ÿ]{3}/.test(line) && !/^-+$/.test(line));
  const title = (first ?? basename(file)).replace(/[*"=¦|#~]+/g, " ").replace(/\s+/g, " ").trim();
  return title.length > 60 ? `${title.slice(0, 57).trimEnd()}...` : title;
}

// --- Écriture ----------------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "ecrans"), { recursive: true });
mkdirSync(join(OUT, "docs"), { recursive: true });

const index = {
  source: "https://www.goto10.fr/",
  author: "Frederic Cambus",
  retrieved: "2026-10-13",
  screens: [],
  sections: [],
};
let bytes = 0;
for (const [id, file, title, credit] of screens) {
  const target = join(OUT, "ecrans", `${id}.vdt`);
  copyFileSync(join(MINITEL, file), target);
  const size = readFileSync(target).length;
  bytes += size;
  index.screens.push({ id, title, credit, source: `minitel/${file}`, bytes: size });
}
for (const section of sections) {
  const docs = [];
  for (const [id, file, title] of section.docs) {
    const lines = wrap(decodeText(readFileSync(join(MINITEL, file))));
    if (!lines.length) continue;
    const doc = { id, title: title ?? titleOf(lines, file), source: `minitel/${file}`, lines };
    const json = JSON.stringify(doc);
    bytes += json.length;
    writeFileSync(join(OUT, "docs", `${id}.json`), json);
    docs.push({ id, title: doc.title, pages: Math.ceil(lines.length / PAGE_LINES) });
  }
  index.sections.push({ id: section.id, title: section.title, docs });
}
writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 1));
writeFileSync(
  join(OUT, "LISEZMOI.md"),
  `# Sélection Goto10 du 3615 GOTO10

Écrans Vidéotex et documents tirés de [Goto10 — (French) BBS and Minitel
Archives](https://www.goto10.fr/), l'archive de Frédéric Cambus, avec son accord
(déclaré par l'utilisateur le 14 octobre 2026). Copie locale du 13 octobre 2026.

- \`ecrans/*.vdt\` : écrans d'origine, octet pour octet. Crédits indiqués par
  l'archive : RTE_*.VDT, RTE, Ressources Télématiques Européennes ; AFP*.VDT, AFP.
- \`docs/*.json\` : documents texte décodés et coupés en lignes de 40 colonnes.
- \`index.json\` : la liste, avec le chemin de chaque fichier dans l'archive.

Produit par \`tools/build_goto10.mjs\` ; voir docs/archive_minitel/README.md.
`,
);
const docCount = index.sections.reduce((n, s) => n + s.docs.length, 0);
console.log(`${index.screens.length} écrans, ${docCount} documents, ${(bytes / 1024 / 1024).toFixed(2)} Mo -> ${OUT}`);
