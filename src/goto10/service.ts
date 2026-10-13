import { assetUrl } from "../assets";
import type { ColorIndex } from "../videotex/palette";
import { COLS, createScreen, text, type TerminalFrame } from "../videotex/screen";
import type { TerminalPage } from "../videotex/terminal";
import { decodeVideotexScreen, videotexPages, type VideotexPhoto } from "../videotex/decoder";
import type { FrameImage } from "../videotex/screen";

// 3615 GOTO10 : the archive of French BBS and Minitel services kept by
// Frederic Cambus (https://www.goto10.fr/), published with his agreement. The
// selection (public/goto10/, made by tools/build_goto10.mjs) holds screens of
// the time (.vdt, decoded by src/videotex/decoder.ts) and text documents cut
// in 40-column lines. Files load on demand ; the terminal draws the page again
// when they arrive.

export const SERVICE = "3615 GOTO10";
export const HOME = "goto10";
/** Entries per list page : keys 1 to 9. */
const PER_LIST = 9;
/** Document lines per page (rows 3 to 21). */
export const DOC_LINES = 19;

export interface Goto10Index {
  source: string;
  author: string;
  retrieved: string;
  screens: { id: string; title: string; credit: string; source: string; bytes: number }[];
  sections: { id: string; title: string; docs: { id: string; title: string; pages: number }[] }[];
}

export interface Goto10Doc {
  id: string;
  title: string;
  source: string;
  lines: string[];
}

interface Screens {
  bytes: Uint8Array;
  pages: number[];
}

type Slot<T> = T | "loading" | "error";

/** Reads a file of public/goto10/ ; replaced in the tests. */
export type Loader = (path: string) => Promise<ArrayBuffer>;

const fetchLoader: Loader = async (path) => {
  const response = await fetch(assetUrl(`goto10/${path}`));
  if (!response.ok) throw new Error(`${path} : ${response.status}`);
  return response.arrayBuffer();
};

const clip = (value: string, width: number) => (value.length > width ? `${value.slice(0, width - 1)}.` : value);

/** Screen of the service : title band, a rule, the body from row 5, keys on row 24. */
function frame(title: string, subtitle: string, footer: string): TerminalFrame {
  const s = createScreen(title);
  s.service = SERVICE;
  for (let x = 0; x < COLS; x++)
    for (const y of [1, 2]) s.cells[y * COLS + x] = { char: " ", fg: 3, bg: 4 };
  const band = (x: number, y: number, value: string, fg: ColorIndex) =>
    Array.from(value).forEach((char, i) => (s.cells[y * COLS + x + i] = { char, fg, bg: 4 }));
  band(1, 1, "3615 GOTO10", 3);
  band(COLS - 1 - Math.min(subtitle.length, 26), 2, clip(subtitle, 26), 7);
  band(1, 2, "ARCHIVES BBS", 6);
  for (let x = 0; x < COLS; x++) s.cells[3 * COLS + x] = { char: "─", fg: 6, bg: 0 };
  for (let x = 0; x < COLS; x++) s.cells[23 * COLS + x] = { char: "─", fg: 6, bg: 0 };
  text(s, 1, 24, clip(footer, 38), 6);
  return s;
}

function message(title: string, lines: string[]): TerminalFrame {
  const s = frame(title, "", "SOMMAIRE : retour au service");
  lines.forEach((line, i) => text(s, 2, 7 + i, line, 7));
  return s;
}

export class Goto10Service {
  private index: Slot<Goto10Index> | undefined;
  private screens = new Map<string, Slot<Screens>>();
  private docs = new Map<string, Slot<Goto10Doc>>();
  /** Pictures of photographic Videotex, decoded once per screen page. */
  private pictures = new Map<string, Slot<FrameImage[]>>();

  constructor(
    /** Called when a file arrives : the terminal draws its page again. */
    private onLoad: () => void,
    private load: Loader = fetchLoader,
  ) {}

  private fetch<T>(slot: Slot<T> | undefined, path: string, store: (value: Slot<T>) => void, parse: (data: ArrayBuffer) => T): void {
    if (slot !== undefined) return;
    store("loading");
    this.load(path)
      .then((data) => store(parse(data)))
      .catch(() => store("error"))
      .finally(this.onLoad);
  }

  private getIndex(): Slot<Goto10Index> {
    this.fetch(this.index, "index.json", (value) => (this.index = value), (data) => JSON.parse(new TextDecoder().decode(data)));
    return this.index ?? "loading";
  }

  private getScreens(id: string): Slot<Screens> {
    this.fetch(this.screens.get(id), `ecrans/${id}.vdt`, (value) => this.screens.set(id, value), (data) => {
      const bytes = new Uint8Array(data);
      return { bytes, pages: videotexPages(bytes) };
    });
    return this.screens.get(id) ?? "loading";
  }

  /** JPEG pictures of a page, decoded by the browser ; none where it cannot (tests). */
  private getPictures(key: string, photos: VideotexPhoto[]): FrameImage[] {
    if (!photos.length || typeof createImageBitmap === "undefined") return [];
    const slot = this.pictures.get(key);
    if (slot === undefined) {
      this.pictures.set(key, "loading");
      Promise.all(
        photos.map(async ({ jpeg, ...place }) => ({
          ...place,
          image: await createImageBitmap(new Blob([jpeg as BlobPart], { type: "image/jpeg" })),
        })),
      )
        .then((images) => this.pictures.set(key, images))
        .catch(() => this.pictures.set(key, "error"))
        .finally(this.onLoad);
      return [];
    }
    return slot === "loading" || slot === "error" ? [] : slot;
  }

  private getDoc(id: string): Slot<Goto10Doc> {
    this.fetch(this.docs.get(id), `docs/${id}.json`, (value) => this.docs.set(id, value), (data) => JSON.parse(new TextDecoder().decode(data)));
    return this.docs.get(id) ?? "loading";
  }

  /** Pages of the service, for Terminal's `resolve`. */
  resolve = (id: string): TerminalPage | undefined => {
    if (id !== HOME && !id.startsWith(`${HOME}/`)) return undefined;
    const [, kind, a, b] = id.split("/");
    const page = (render: () => TerminalFrame, keys: Record<string, string> = {}, prompt = true): TerminalPage => ({
      id,
      render,
      keys: { Sommaire: HOME, Guide: `${HOME}/apropos`, ...keys },
      prompt,
    });
    if (!kind) return { ...page(() => this.home()), keys: { Guide: `${HOME}/apropos` } };
    if (kind === "apropos") return page(() => this.about(), { Retour: HOME });
    if (kind === "docs" && !a) return page(() => this.sections(), { Retour: HOME });
    const index = this.getIndex();
    if (index === "loading" || index === "error")
      return page(() => (index === "error" ? this.unavailable() : this.loading()), { Retour: HOME }, false);
    if (kind === "ecrans") return this.screenList(index, Number(a) || 0, page);
    if (kind === "ecran") return this.screen(index, a, Number(b) || 0, page);
    if (kind === "docs") return this.docList(index, a, Number(b) || 0, page);
    if (kind === "doc") return this.doc(index, a, Number(b) || 0, page);
    return undefined;
  };

  private home(): TerminalFrame {
    const s = frame("3615 GOTO10", "BBS ET MINITEL", "GUIDE : a propos   0 : 3615 LEMEGETON");
    [
      "Archives des BBS et du Minitel",
      "francophones, tenues par",
      "Frederic Cambus : www.goto10.fr",
    ].forEach((line, i) => text(s, 2, 5 + i, line, i === 2 ? 6 : 7));
    s.actions = [
      { key: "1", label: "ECRANS VIDEOTEX D'EPOQUE", target: `${HOME}/ecrans/0` },
      { key: "2", label: "DOCUMENTS", target: `${HOME}/docs` },
      { key: "3", label: "A PROPOS DE GOTO10", target: `${HOME}/apropos` },
      { key: "0", label: "3615 LEMEGETON", target: "home" },
    ];
    s.actions.forEach((action, i) => {
      s.cells[(10 + i * 2) * COLS + 3] = { char: " ", fg: 0, bg: 3 };
      s.cells[(10 + i * 2) * COLS + 4] = { char: action.key, fg: 0, bg: 3 };
      s.cells[(10 + i * 2) * COLS + 5] = { char: " ", fg: 0, bg: 3 };
      text(s, 7, 10 + i * 2, action.label, i === 3 ? 6 : 7);
    });
    text(s, 2, 19, "Tapez un numero, ou un code", 2);
    text(s, 2, 20, "de service puis ENVOI.", 2);
    return s;
  }

  private about(): TerminalFrame {
    const s = frame("A propos de Goto10", "A PROPOS", "RETOUR : le sommaire");
    [
      ["Goto10 : (French) BBS and Minitel", 7],
      ["Archives, par Frederic Cambus.", 7],
      ["www.goto10.fr", 6],
      ["", 7],
      ["Le musee en montre une selection,", 7],
      ["avec l'accord de son auteur :", 7],
      ["ecrans Videotex d'origine et textes", 7],
      ["coupes en 40 colonnes.", 7],
      ["", 7],
      ["Ecrans RTE_ : Ressources Telematiques", 3],
      ["Europeennes. Ecrans AFP : AFP.", 3],
      ["", 7],
      ["Les caracteres DRCS (redefinis par", 2],
      ["un service) sont hachures en gris.", 2],
    ].forEach(([line, fg], i) => text(s, 2, 5 + i, line as string, fg as ColorIndex));
    return s;
  }

  private loading(): TerminalFrame {
    return message("Chargement", ["CONNEXION A GOTO10...", "", "Patientez."]);
  }

  private unavailable(): TerminalFrame {
    return message("Service indisponible", ["SERVICE MOMENTANEMENT", "INDISPONIBLE", "", "Reessayez plus tard."]);
  }

  private list(
    title: string,
    subtitle: string,
    entries: { label: string; target: string }[],
    pageIndex: number,
  ): { frame: TerminalFrame; pages: number } {
    const pages = Math.max(1, Math.ceil(entries.length / PER_LIST));
    const p = Math.min(pageIndex, pages - 1);
    const s = frame(title, subtitle, `${p + 1}/${pages}  SUITE  RETOUR  SOMMAIRE`);
    s.actions = entries.slice(p * PER_LIST, (p + 1) * PER_LIST).map((entry, i) => ({
      key: String(i + 1),
      label: entry.label,
      target: entry.target,
    }));
    s.actions.forEach((action, i) => {
      s.cells[(5 + i * 2) * COLS + 1] = { char: action.key, fg: 0, bg: 3 };
      text(s, 3, 5 + i * 2, clip(action.label, 36), 7);
    });
    return { frame: s, pages };
  }

  private screenList(index: Goto10Index, p: number, page: (render: () => TerminalFrame, keys?: Record<string, string>) => TerminalPage) {
    const entries = index.screens.map((screen) => ({ label: screen.title, target: `${HOME}/ecran/${screen.id}/0` }));
    const { pages } = this.list("Ecrans d'epoque", "ECRANS D'EPOQUE", entries, p);
    return page(() => this.list("Ecrans d'epoque", "ECRANS D'EPOQUE", entries, p).frame, {
      Retour: p > 0 ? `${HOME}/ecrans/${p - 1}` : HOME,
      ...(p + 1 < pages ? { Suite: `${HOME}/ecrans/${p + 1}` } : { Suite: `${HOME}/ecrans/${p}` }),
    });
  }

  private screen(index: Goto10Index, id: string, n: number, page: (render: () => TerminalFrame, keys?: Record<string, string>, prompt?: boolean) => TerminalPage) {
    const at = index.screens.findIndex((screen) => screen.id === id);
    if (at < 0) return undefined;
    const info = index.screens[at];
    const list = `${HOME}/ecrans/${Math.floor(at / PER_LIST)}`;
    const data = this.getScreens(id);
    if (data === "loading" || data === "error")
      return page(() => (data === "error" ? this.unavailable() : this.loading()), { Retour: list }, false);
    const count = data.pages.length;
    const k = Math.min(n, Math.max(count - 1, 0));
    const next = k + 1 < count ? `${HOME}/ecran/${id}/${k + 1}` : list;
    return page(
      () => {
        const s = createScreen(`${info.title} · ${k + 1}/${count}`);
        s.service = SERVICE;
        if (count) {
          const decoded = decodeVideotexScreen(data.bytes, data.pages[k], data.pages[k + 1]);
          s.cells = decoded.cells;
          s.images = this.getPictures(`${id}/${k}`, decoded.photos);
        }
        s.actions = [
          { key: "Suite", label: "SUITE", target: next },
          { key: "Retour", label: "RETOUR", target: k > 0 ? `${HOME}/ecran/${id}/${k - 1}` : list },
        ];
        return s;
      },
      { Suite: next, Envoi: next, Retour: k > 0 ? `${HOME}/ecran/${id}/${k - 1}` : list, Sommaire: list },
      false,
    );
  }

  private sections(): TerminalFrame {
    const index = this.getIndex();
    if (index === "loading") return this.loading();
    if (index === "error") return this.unavailable();
    return this.list(
      "Documents",
      "DOCUMENTS",
      index.sections.map((section) => ({ label: section.title, target: `${HOME}/docs/${section.id}/0` })),
      0,
    ).frame;
  }

  private docList(index: Goto10Index, sectionId: string, p: number, page: (render: () => TerminalFrame, keys?: Record<string, string>) => TerminalPage) {
    const section = index.sections.find((item) => item.id === sectionId);
    if (!section) return undefined;
    const entries = section.docs.map((doc) => ({ label: doc.title, target: `${HOME}/doc/${doc.id}/0` }));
    const build = () => this.list(section.title, section.title.toUpperCase(), entries, p);
    const { pages } = build();
    return page(() => build().frame, {
      Retour: p > 0 ? `${HOME}/docs/${section.id}/${p - 1}` : `${HOME}/docs`,
      Suite: p + 1 < pages ? `${HOME}/docs/${section.id}/${p + 1}` : `${HOME}/docs/${section.id}/${p}`,
    });
  }

  private doc(index: Goto10Index, id: string, n: number, page: (render: () => TerminalFrame, keys?: Record<string, string>, prompt?: boolean) => TerminalPage) {
    const section = index.sections.find((item) => item.docs.some((doc) => doc.id === id));
    if (!section) return undefined;
    const at = section.docs.findIndex((doc) => doc.id === id);
    const list = `${HOME}/docs/${section.id}/${Math.floor(at / PER_LIST)}`;
    const data = this.getDoc(id);
    if (data === "loading" || data === "error")
      return page(() => (data === "error" ? this.unavailable() : this.loading()), { Retour: list }, false);
    const count = Math.max(1, Math.ceil(data.lines.length / DOC_LINES));
    const k = Math.min(n, count - 1);
    const next = k + 1 < count ? `${HOME}/doc/${id}/${k + 1}` : list;
    const back = k > 0 ? `${HOME}/doc/${id}/${k - 1}` : list;
    return page(
      () => {
        const s = createScreen(`${data.title} · ${k + 1}/${count}`);
        s.service = SERVICE;
        for (let x = 0; x < COLS; x++) s.cells[COLS + x] = { char: " ", fg: 0, bg: 6 };
        Array.from(clip(data.title, 38)).forEach((char, i) => (s.cells[COLS + 1 + i] = { char, fg: 0, bg: 6 }));
        for (let x = 0; x < COLS; x++) s.cells[2 * COLS + x] = { char: "─", fg: 6, bg: 0 };
        data.lines.slice(k * DOC_LINES, (k + 1) * DOC_LINES).forEach((line, i) => text(s, 0, 3 + i, line, 7));
        for (let x = 0; x < COLS; x++) s.cells[23 * COLS + x] = { char: "─", fg: 6, bg: 0 };
        text(s, 0, 24, `${k + 1}/${count}`, 3);
        text(s, 9, 24, "SUITE RETOUR SOMMAIRE", 6);
        text(s, 32, 24, "GOTO10", 2);
        s.actions = [
          { key: "Suite", label: "SUITE", target: next },
          { key: "Retour", label: "RETOUR", target: back },
        ];
        return s;
      },
      { Suite: next, Envoi: next, Retour: back, Sommaire: list },
      false,
    );
  }
}
