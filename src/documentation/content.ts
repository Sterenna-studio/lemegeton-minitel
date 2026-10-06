// Contenu de la page Documentation. Les faits historiques sont sources (voir
// `sources`) ; ce qui ne vient que des photos de reference est signale comme tel.

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

export const views = [
  { id: "trois-quarts", label: "Trois quarts" },
  { id: "face", label: "Face" },
  { id: "profil", label: "Profil" },
  { id: "dos", label: "Dos" },
] as const;

const minitelAsset: Fact[] = [
  { label: "Fichier", value: "models/minitel.glb · 3,6 Mo" },
  { label: "Geometrie", value: "71 meshes · 21 943 triangles" },
  { label: "Textures", value: "11 images d'origine (32 a 1024 px)" },
  { label: "Modele source", value: "Minitel 1982-France, okotaru · CC BY 4.0" },
  { label: "Preparation", value: "tools/prepare_model.py : orientation, echelle, ecran extrait" },
];

export const modelDocs: ModelDoc[] = [
  {
    id: "terminatel-255",
    title: "Terminatel 255",
    kicker: "Telic Alcatel · serie limitee noir marbre",
    intro: [
      "Terminal Videotex de marque Telic Alcatel, dans une finition noir marbre veine d'or et de gris. Les photos de reference montrent un ecran cathodique dans sa propre coque, avec un clavier independant. Un combine telephonique est pose sur ce clavier.",
      "Dans le terminal 3D, cette finition est interpretee sur la geometrie du Minitel 1 : marbre procedural sur la coque, touches anthracite. La forme reste celle du Minitel 1 : aucun modele 3D du Terminatel n'est disponible.",
    ],
    facts: [
      { label: "Marquages", value: "TERMINATEL 255 (face avant), TELIC ALCATEL (clavier et coque)" },
      { label: "Finition", value: "noir marbre, veines or sable et grises" },
      { label: "Clavier", value: "separe, touches anthracite a legendes creme, support de combine" },
      { label: "Connectique", value: "cables a l'arriere, boitier bleu" },
    ],
    asset: [
      ...minitelAsset.slice(0, 3),
      { label: "Finition 3D", value: "marbre procedural (src/demo/marble.ts), aucune photo utilisee" },
      minitelAsset[3],
    ],
    note: "Aucune source publique n'a ete trouvee sur ce modele (recherche du 6 octobre 2026). Ces informations viennent uniquement des photos de reference et restent a confirmer.",
  },
  {
    id: "minitel-1",
    title: "Minitel 1",
    kicker: "Terminal Videotex · France, 1982",
    intro: [
      "Le Minitel donnait acces aux services Teletel par la ligne telephonique. Apres des essais a Saint-Malo puis en Ille-et-Vilaine en 1980 et 1981, il a ete distribue aux abonnes a partir de 1982.",
      "Trois industriels le fabriquaient : Matra, La Radiotechnique (Philips) et Telic-Alcatel. Le service a ferme le 30 juin 2012.",
    ],
    facts: [
      { label: "Affichage", value: "Videotex, 25 lignes de 40 colonnes" },
      { label: "Modem integre", value: "1 200 bit/s en reception, 75 bit/s en emission" },
      { label: "Reseau", value: "services Teletel via Transpac (X.25)" },
      { label: "Fabricants", value: "Matra, La Radiotechnique (Philips), Telic-Alcatel" },
      { label: "Fin du service", value: "30 juin 2012" },
    ],
    asset: minitelAsset,
  },
  {
    id: "televiseur-1950",
    title: "Televiseur 1950",
    kicker: "Recepteur cathodique · meuble a pieds compas",
    intro: [
      "Meuble televiseur des annees 1950, a ecran cathodique bombe, haut-parleurs lateraux et pieds compas.",
      "Il sert ici d'autre support d'affichage : l'ecran Videotex 3615 Lemegeton s'affiche sur son tube, avec les memes effets CRT que sur le Minitel.",
    ],
    facts: [
      { label: "Ecran", value: "tube cathodique bombe, UV planes pour le Videotex" },
      { label: "Meuble", value: "bois, deux grilles de haut-parleur, pieds compas" },
    ],
    asset: [
      { label: "Fichier", value: "models/television-1950.glb · 1,6 Mo" },
      { label: "Geometrie", value: "5 meshes · 5 718 triangles" },
      { label: "Textures", value: "4 images d'origine (variante 1k)" },
      { label: "Modele source", value: "1950's Retro Television, Huuxloc · CC BY 4.0" },
      { label: "Preparation", value: "tools/prepare_television.py : echelle, noms, ecran Minitel_Screen" },
    ],
  },
];

const repo = "https://github.com/Sterenna-studio/lemegeton-minitel/blob/main/";

export const projectDocs = [
  { title: "README", path: "README.md", description: "Vision, lancement, deploiement et etat du projet" },
  { title: "Guide d'utilisation", path: "docs/USAGE.md", description: "Composant Minitel, sources d'ecran, catalogue, accessoires" },
  { title: "Assets et licences", path: "docs/ASSETS.md", description: "Modeles retenus, credits, modeles ecartes et pourquoi" },
  { title: "Preparation des modeles", path: "docs/MODEL_PREPARATION.md", description: "Scripts Blender, conventions, UV d'ecran, export" },
  { title: "Cadrage", path: "docs/3D_WEB_PROJECT.md", description: "Objectifs, phases et decisions de direction artistique" },
  { title: "Verification", path: "docs/VERIFICATION.md", description: "Rapport de tests et captures" },
  { title: "Passation du personnage", path: "lemegeton/PASSATION_AGENTS.md", description: "Pipeline 3D du robot Lemegeton" },
].map((doc) => ({ ...doc, url: repo + doc.path }));

export const sources = [
  { title: "Futura Sciences : Minitel, qu'est-ce que c'est ?", url: "https://www.futura-sciences.com/tech/definitions/technologie-minitel-1250/" },
  { title: "Techno-Science : Minitel", url: "https://www.techno-science.net/definition/3781.html" },
  { title: "Futura Sciences : le Minitel survivra jusqu'au 30 juin 2012", url: "https://www.futura-sciences.com/tech/actualites/internet-sursis-minitel-survivra-jusquau-30-juin-2012-31555/" },
  { title: "Computer History Museum : Minitel", url: "https://www.computerhistory.org/revolution/the-web/20/379/2117" },
  { title: "Science Museum Group : Alcatel Minitel, 1983", url: "https://collection.sciencemuseum.org.uk/objects/co447955/alcatel-minitel-communication-terminal-france-1983-personal-computer" },
];
