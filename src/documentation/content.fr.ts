import type { DocContent, Fact } from "./content";

// Contenu francais de la page Documentation (langue de reference).

const minitelAsset: Fact[] = [
  { label: "Fichier", value: "models/minitel.glb · 0,86 Mo (KTX2 + meshopt)" },
  { label: "Geometrie", value: "71 meshes · 21 943 triangles" },
  { label: "Textures", value: "11 images d'origine (32 a 1024 px), compressees en KTX2" },
  { label: "Modele source", value: "Minitel 1982-France, okotaru · CC BY 4.0" },
  { label: "Preparation", value: "tools/prepare_model.py : orientation, echelle, ecran extrait" },
  { label: "Presentation", value: "pose sur une table d'appoint (Wood Drawer & Tables Set, brandon_grey · CC BY 4.0)" },
];

export const contentFr: DocContent = {
  views: [
    { id: "trois-quarts", label: "Trois quarts" },
    { id: "face", label: "Face" },
    { id: "profil", label: "Profil" },
    { id: "dos", label: "Dos" },
  ],
  modelDocs: [
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
        minitelAsset[5],
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
    {
      id: "minitel-nfz-300",
      title: "Minitel 1 NFZ 300",
      kicker: "Radiotechnique · scan Velta-3D",
      intro: [
        "Minitel 1 de La Radiotechnique, reference 9 NFZ 300/2, conserve par l'association ACONIT a Grenoble. Sa fiche PATSTEC le presente comme un des tout premiers modeles de Minitel, deja dote d'un clavier AZERTY : le tout premier, a clavier alphabetique, avait ete rejete par les usagers.",
        "C'est un appareil monobloc en plastique beige, developpe au sein du groupe Philips France : le modem 1200/75 bauds vient de la filiale TRT, le tube et l'assemblage de Radiotechnique. Le terminal 3D vient d'un scan de ses deux coques par Velta-3D, place sous licence CC0.",
      ],
      facts: [
        { label: "Reference", value: "Minitel 9 NFZ 300/2 (fiche PATSTEC, ACONIT)" },
        { label: "Fabricant", value: "La Radiotechnique, groupe Philips France (modem : TRT)" },
        { label: "Aspect", value: "monobloc en plastique beige, ecran cathodique, clavier AZERTY" },
        { label: "Touches de fonction", value: "Connexion/Fin, Repetition, Sommaire, Guide, Annulation, Correction, Retour, Suite, Envoi" },
        { label: "Arriere", value: "prise d'alimentation 220 V et prise telephone" },
      ],
      asset: [
        { label: "Fichier", value: "models/minitel-nfz-300.glb · 0,34 Mo (meshopt)" },
        { label: "Geometrie", value: "54 meshes · 50 582 triangles" },
        { label: "Textures", value: "aucune : plastique beige, touches et ecran en matieres unies" },
        { label: "Modele source", value: "Minitel 1 NFZ 300 La Radiotechnique, Velta-3D (publie par Arcade Makers sur Cults) · CC0" },
        { label: "Preparation", value: "tools/prepare_nfz300.py : coques redressees et assemblees, maillage allege, capot arriere referme, ecran et 48 touches ajoutes" },
        minitelAsset[5],
      ],
      note: "Le scan ne contient que les deux coques en plastique, sans ecran, touches ni couleurs : l'ecran, la plaque et les touches du clavier, et le dessus arriere du capot du tube sont reconstitues. Velta-3D a place le modele sous licence CC0 le 13 octobre 2026, a notre demande : merci a Velta-3D.",
    },
  ],
  worldDoc: {
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
      { label: "Portails", value: "au fond du couloir, apres les trois portes fermees : minitel.org, l'INA et ACONIT, ouverts dans un nouvel onglet" },
    ],
    rooms: [
      { id: "televiseur-1950", label: "Salon 1950", description: "meuble tele en teck, fauteuils cocktail, tapis a boomerangs, buffet, horloge soleil, lampadaire" },
      { id: "minitel-1", label: "Bureau 1982", description: "faux plafond et neons, stores venitiens, classeur, fauteuil pivotant, calendrier d'octobre 1982" },
      { id: "minitel-nfz-300", label: "Salon 1982", description: "le Minitel arrive a la maison : papier peint a bandes, moquette, canape de velours, meuble mural et television, telephone a cadran" },
      { id: "terminatel-255", label: "Salle du Terminatel 255", description: "marbre noir, laiton, plaque gravee, cordons autour du terminal" },
    ],
    assets: [
      { label: "Porte temporelle", value: "Door_Wooden_Old, Mehdi Shahsavan · CC BY 4.0 (modele provisoire)" },
      { label: "Horloges", value: "Mantel Clock 01, Vintage Grandfather Clock 01, Poly Haven · CC0" },
      { label: "Matieres", value: "Dark Paneled Wood, Decrepit Wallpaper, Herringbone Parquet, Poly Haven · CC0" },
      { label: "Decor des salles", value: "construit en code et dessine sur canvas, sans autre asset" },
    ],
  },
  infoDocs: [
    {
      id: "terminal",
      kicker: "3615 · mode d'emploi",
      title: "Utiliser le terminal",
      intro: [
        "Comme sur un Minitel, un numero ou un code de service tape s'affiche sur la ligne de commande de l'ecran, et n'agit qu'a l'appui sur ENVOI. Les touches de fonction agissent tout de suite.",
        "On tape au clavier de l'ordinateur, sur le clavier du Minitel 3D (clic sur ses touches), sur le clavier virtuel ou dans le champ de la console. Un aide-memoire en post-it, pres de l'ecran, rappelle les commandes ; ses boutons les envoient.",
      ],
      facts: [
        { label: "ENVOI", value: "Entree : valide le numero ou le code tape" },
        { label: "SUITE", value: "Page suivante (Page ↓)" },
        { label: "RETOUR", value: "Page precedente (Page ↑)" },
        { label: "SOMMAIRE", value: "Echap : sommaire du service" },
        { label: "CORRECTION", value: "Retour arriere : efface un caractere" },
        { label: "ANNULATION", value: "Suppr : efface la ligne" },
        { label: "GUIDE", value: "F1 : aide du service" },
        { label: "Codes", value: "3615 GOTO10 (archives BBS et Minitel), 3615 LEMEGETON (le sommaire), puis ENVOI" },
      ],
    },
    {
      id: "goto10",
      kicker: "3615 GOTO10 · archives",
      title: "Les archives de Goto10 sur l'ecran",
      intro: [
        "Goto10 est l'archive des BBS et du Minitel francophones tenue par Frederic Cambus (www.goto10.fr). Le musee en montre une selection, avec son accord, directement sur l'ecran des terminaux : touche 4 du sommaire, ou le code 3615 GOTO10 puis ENVOI.",
        "Les ecrans d'epoque sont les fichiers Videotex d'origine, lus octet par octet par le decodeur du musee comme le ferait un Minitel, y compris les photos du Videotex photographique. Les documents sont coupes en pages de 40 colonnes.",
      ],
      facts: [
        { label: "Ecrans d'epoque", value: "28 : serveur Pinky (1988, accueil et forums), Ellis, guide Teletel 1992, photos RTE (tour Eiffel, Louvre, Van Gogh) et AFP" },
        { label: "Documents", value: "106 : articles, annuaire des services Teletel, journal Gigantex, aide sur la norme Videotex, protocole ProTrans" },
        { label: "Navigation", value: "un numero puis ENVOI pour choisir ; SUITE et RETOUR pour feuilleter ; SOMMAIRE pour remonter" },
        { label: "Limite", value: "les caracteres redefinis par un service (DRCS) sont approches : hachures grises" },
        { label: "Source", value: "Goto10, Frederic Cambus ; ecrans RTE : Ressources Telematiques Europeennes ; ecrans AFP : AFP" },
      ],
    },
  ],
  projectDocs: [
    { title: "README", path: "README.md", description: "Vision, lancement, deploiement et etat du projet" },
    { title: "Guide d'utilisation", path: "docs/USAGE.md", description: "Composant Minitel, sources d'ecran, catalogue, accessoires" },
    { title: "Assets et licences", path: "docs/ASSETS.md", description: "Modeles retenus, credits, modeles ecartes et pourquoi" },
    { title: "Preparation des modeles", path: "docs/MODEL_PREPARATION.md", description: "Scripts Blender, conventions, UV d'ecran, export" },
    { title: "Cadrage", path: "docs/3D_WEB_PROJECT.md", description: "Objectifs, phases et decisions de direction artistique" },
    { title: "Monde explorable", path: "docs/MONDE_EXPLORABLE.md", description: "Mode 3D+ : decisions, architecture, rails, portes, salles, budgets, lots" },
    { title: "Direction artistique", path: "docs/DIRECTION_ARTISTIQUE.md", description: "Ambiances du couloir et des salles, palettes, lumiere" },
    { title: "Traduction", path: "docs/TRADUCTION.md", description: "Langues du site, catalogues de textes, ajouter une langue" },
    { title: "Verification", path: "docs/VERIFICATION.md", description: "Rapport de tests et captures" },
    { title: "Archive Goto10", path: "docs/archive_minitel/README.md", description: "Ce qui est garde en local, ce qui est publie, le 3615 GOTO10" },
  ],
  related: [
    {
      name: "lemegeton-core",
      url: "https://github.com/Sterenna-studio/lemegeton-core",
      description: "Le coeur creatif de Lemegeton : references, modelisation, rigs et animation du personnage. Le musee est ne de l'envie d'un Minitel 3D fonctionnel pour son corps.",
    },
    {
      name: "3615-gateways",
      url: "https://github.com/Sterenna-studio/3615-gateways",
      description: "Passerelle Minitel sur ESP32 : hub Telnet et WebSocket, et integration au portail Nitro.",
    },
  ],
  elsewhere: [
    { name: "Goto10", url: "https://www.goto10.fr/", description: "Archives des BBS et du Minitel francophones, par Frederic Cambus : la source du 3615 GOTO10." },
    { name: "minitel.org", url: "https://www.minitel.org/", description: "Site consacre au Minitel : un des portails du fond du couloir, en mode 3D+." },
    { name: "INA, la revue des medias", url: "https://larevuedesmedias.ina.fr/du-minitel-linternet", description: "« Du Minitel a l'internet » : un des portails du couloir." },
    { name: "ACONIT", url: "https://db.aconit.org/dbaconit/consulter.php?idcollection=9385&db=0", description: "Collection Minitel de l'Association pour un conservatoire de l'informatique et de la telematique (Grenoble), dont le Minitel 1 de La Radiotechnique : un des portails du couloir." },
    { name: "Musee du Minitel", url: "https://www.museeminitel.fr/2019/12/le-musee-du-minitel-a-la-retro-gaming-connexion-rgc2019/", description: "Projet de preservation du patrimoine Minitel, ici a la Retro Gaming Connexion 2019." },
  ],
};
