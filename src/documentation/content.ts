import type { Lang } from "../i18n";
import { contentFr } from "./content.fr";
import { contentEn } from "./content.en";
import { catalog } from "../demo/catalog";

// Contenu de la page Documentation, une version par langue (content.fr.ts,
// content.en.ts) au meme format : le type DocContent garantit qu'aucune
// rubrique ne manque a une traduction. Les faits historiques sont sources
// (voir `sources`) ; ce qui ne vient que des photos de reference est signale.

export interface Fact {
  label: string;
  value: string;
}

export interface ModelDoc {
  /** Identifiant de l'entree du catalogue (src/demo/catalog.ts). */
  id: string;
  title: string;
  kicker: string;
  intro: string[];
  facts: Fact[];
  asset: Fact[];
  note?: string;
}

export interface WorldDoc {
  kicker: string;
  title: string;
  intro: string[];
  facts: Fact[];
  rooms: { id: string; label: string; description: string }[];
  assets: Fact[];
}

export interface ProjectDoc {
  title: string;
  /** Chemin dans le depot, ou nom d'un autre depot quand `url` est donnee. */
  path: string;
  description: string;
  url?: string;
}

/** Autre depot public lie au musee. */
export interface RelatedProject {
  name: string;
  url: string;
  description: string;
}

export interface DocContent {
  views: { id: "trois-quarts" | "face" | "profil" | "dos"; label: string }[];
  modelDocs: ModelDoc[];
  worldDoc: WorldDoc;
  projectDocs: ProjectDoc[];
  related: RelatedProject[];
}

const repo = "https://github.com/Sterenna-studio/minitel-musee/blob/main/";

/** Le contenu d'une langue, avec l'adresse de chaque document du projet. */
export function docContent(lang: Lang): DocContent & { projectDocs: (ProjectDoc & { url: string })[] } {
  const content = lang === "en" ? contentEn : contentFr;
  // Only the terminals of the catalogue : drafts stay out of the published page.
  const shown = (id: string) => catalog.some((entry) => entry.id === id);
  return {
    ...content,
    modelDocs: content.modelDocs.filter((doc) => shown(doc.id)),
    worldDoc: { ...content.worldDoc, rooms: content.worldDoc.rooms.filter((room) => shown(room.id)) },
    projectDocs: content.projectDocs.map((doc) => ({ ...doc, url: doc.url ?? repo + doc.path })),
  };
}

/** Sources (communes aux langues : titres d'origine). */
export const sources = [
  { title: "Futura Sciences : Minitel, qu'est-ce que c'est ?", url: "https://www.futura-sciences.com/tech/definitions/technologie-minitel-1250/" },
  { title: "Techno-Science : Minitel", url: "https://www.techno-science.net/definition/3781.html" },
  { title: "Futura Sciences : le Minitel survivra jusqu'au 30 juin 2012", url: "https://www.futura-sciences.com/tech/actualites/internet-sursis-minitel-survivra-jusquau-30-juin-2012-31555/" },
  { title: "Computer History Museum : Minitel", url: "https://www.computerhistory.org/revolution/the-web/20/379/2117" },
  { title: "PATSTEC : Minitel 1, Radiotechnique, 9 NFZ 300/2 (ACONIT)", url: "https://www.patstec.fr/ressources/objets/detail?id=27402" },
  { title: "Science Museum Group : Alcatel Minitel, 1983", url: "https://collection.sciencemuseum.org.uk/objects/co447955/alcatel-minitel-communication-terminal-france-1983-personal-computer" },
  { title: "Goto10 : (French) BBS and Minitel Archives (Frederic Cambus)", url: "https://www.goto10.fr/" },
  { title: "Musee du Minitel : le Musee du Minitel a la Retro Gaming Connexion (RGC2019)", url: "https://www.museeminitel.fr/2019/12/le-musee-du-minitel-a-la-retro-gaming-connexion-rgc2019/" },
];
