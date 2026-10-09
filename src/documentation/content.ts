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
  { label: "Fichier", value: "models/minitel.glb · 0,86 Mo (KTX2 + meshopt)" },
  { label: "Geometrie", value: "71 meshes · 21 943 triangles" },
  { label: "Textures", value: "11 images d'origine (32 a 1024 px), compressees en KTX2" },
  { label: "Modele source", value: "Minitel 1982-France, okotaru · CC BY 4.0" },
  { label: "Preparation", value: "tools/prepare_model.py : orientation, echelle, ecran extrait" },
  { label: "Presentation", value: "pose sur une table d'appoint (Wood Drawer & Tables Set, brandon_grey · CC BY 4.0)" },
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
      { label: "Finition 3D", value: "marbre procedural mat (src/demo/marble.ts), aucune photo utilisee" },
      { label: "Presentation", value: "pose sur une table d'appoint (Wood Drawer & Tables Set, brandon_grey · CC BY 4.0)" },
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
      { label: "Fichier", value: "models/television-1950.glb · 0,32 Mo (KTX2 + meshopt)" },
      { label: "Geometrie", value: "5 meshes · 5 718 triangles" },
      { label: "Textures", value: "4 images d'origine (variante 1k), compressees en KTX2" },
      { label: "Modele source", value: "1950's Retro Television, Huuxloc · CC BY 4.0" },
      { label: "Preparation", value: "tools/prepare_television.py : echelle, noms, ecran Minitel_Screen" },
    ],
  },
];

/** Mode 3D+ : le monde explorable (docs/MONDE_EXPLORABLE.md). */
export const worldDoc = {
  kicker: "Mode 3D+ · monde explorable",
  title: "Le couloir hors du temps",
  intro: [
    "Le bouton Mode 3D+, en haut de la page du terminal, ouvre un couloir hors du temps. Une porte temporelle par terminal y est rangee dans l'ordre chronologique. Devant une porte, son compteur deroule les annees jusqu'a l'epoque de la salle, puis elle s'ouvre.",
    "Chaque salle est d'epoque et montre son terminal. Devant lui, on retrouve le 3615, les yeux de Lemegeton et les reglages de la version simple. Mode simple revient a la page du terminal, sur le terminal de la salle quittee.",
  ],
  facts: [
    { label: "Deplacement", value: "sur rails, de poste en poste : boutons, clavier (fleches, Echap), clic sur une porte" },
    { label: "Raccourci", value: "les cartes d'inventaire menent a une salle, en fondu" },
    { label: "Adresse", value: "?mode=3d, puis &salle= et &poste= : chaque poste a son adresse, le bouton Retour remonte le chemin" },
    { label: "Mouvement reduit", value: "fondus brefs au lieu des trajets, pas de parallaxe" },
    { label: "Son", value: "coupe par defaut ; tic-tac et souffle synthetises, sans fichier" },
  ] as Fact[],
  rooms: [
    { id: "televiseur-1950", label: "Salon 1950", description: "meuble tele en teck, fauteuils cocktail, tapis a boomerangs, buffet, horloge soleil, lampadaire" },
    { id: "minitel-1", label: "Bureau 1982", description: "faux plafond et neons, stores venitiens, classeur, fauteuil pivotant, calendrier d'octobre 1982" },
    { id: "terminatel-255", label: "Salle du Terminatel 255", description: "marbre noir, laiton, plaque gravee, cordons autour du terminal" },
  ],
  assets: [
    { label: "Porte temporelle", value: "Door_Wooden_Old, Mehdi Shahsavan · CC BY 4.0 (modele provisoire)" },
    { label: "Horloges", value: "Mantel Clock 01, Vintage Grandfather Clock 01, Poly Haven · CC0" },
    { label: "Matieres", value: "Dark Paneled Wood, Decrepit Wallpaper, Herringbone Parquet, Poly Haven · CC0" },
    { label: "Decor des salles", value: "construit en code et dessine sur canvas, sans autre asset" },
  ] as Fact[],
};

const repo = "https://github.com/Sterenna-studio/lemegeton-minitel/blob/main/";

export const projectDocs = [
  { title: "README", path: "README.md", description: "Vision, lancement, deploiement et etat du projet" },
  { title: "Guide d'utilisation", path: "docs/USAGE.md", description: "Composant Minitel, sources d'ecran, catalogue, accessoires" },
  { title: "Assets et licences", path: "docs/ASSETS.md", description: "Modeles retenus, credits, modeles ecartes et pourquoi" },
  { title: "Preparation des modeles", path: "docs/MODEL_PREPARATION.md", description: "Scripts Blender, conventions, UV d'ecran, export" },
  { title: "Cadrage", path: "docs/3D_WEB_PROJECT.md", description: "Objectifs, phases et decisions de direction artistique" },
  { title: "Monde explorable", path: "docs/MONDE_EXPLORABLE.md", description: "Mode 3D+ : decisions, architecture, rails, portes, salles, budgets, lots" },
  { title: "Direction artistique", path: "docs/DIRECTION_ARTISTIQUE.md", description: "Ambiances du couloir et des salles, palettes, lumiere" },
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
