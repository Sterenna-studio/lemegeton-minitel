# Monde explorable : conception et audit avant implémentation

Ce document décrit une évolution du Minitel 3D : on n'y montre plus un terminal
seul, mais un lieu à parcourir. Un couloir hors du temps est bordé de portes
temporelles, et chaque porte ouvre sur la salle d'un terminal. Le suivi se fait
dans l'[issue #8](https://github.com/Sterenna-studio/lemegeton-minitel/issues/8).

**Statut au 7 octobre 2026 : rien n'est implémenté.** Ce document fixe les
décisions et l'architecture. Il fait l'état des lieux du code actuel, pose les
budgets et découpe le travail en lots, chacun avec ses critères d'acceptation. La
direction artistique est décrite à part, dans
[DIRECTION_ARTISTIQUE.md](DIRECTION_ARTISTIQUE.md).

## 1. Décisions

Toutes ont été prises par l'utilisateur, du 6 au 8 octobre 2026.

| Sujet | Décision |
| --- | --- |
| Construction | Porte, couloir et salles sont des **briques séparées**, assemblées par des données. |
| Déplacement | **Sur rails** : la caméra va de poste en poste, il n'y a pas d'exploration libre. |
| Portes | **Temporelles** : un seul modèle, paramétré par l'année, la teinte de l'époque et la plaque, avec une séquence d'ouverture. |
| Salles | **Une par terminal du catalogue**. Il y en a trois pour commencer : Téléviseur 1950, Minitel 1, Terminatel 255. |
| Ambiances | Salon des années 50 ; bureau des années 80 ; pour le Terminatel, la DA actuelle (marbre noir, laiton, lumière ambrée). |
| Modes du site | Le monde est un **mode** du site, « **3D+** ». Par défaut, `/minitel/` charge la **version simple** (terminal et table) ; un bouton **Mode 3D+** dans l'en-tête bascule vers le monde, **Mode simple** revient (8 octobre). Voir §3. |
| Page d'arrivée | En mode 3D+, sans autre paramètre, on arrive à l'**entrée du couloir** (7 octobre). |
| Son | **Coupé par défaut**, avec un bouton pour l'activer (7 octobre). |
| Panneau 3615, yeux, réglages | Affichés **seulement au poste `terminal`**, devant le terminal (7 octobre). |
| Téléphone de référence | **iPhone 11** : le site doit y rester fluide (7 octobre). |
| Modèles de la porte et de l'horloge | **Provisoirement des modèles gratuits** trouvés en ligne (§10) ; notre propre modèle viendra plus tard (7 octobre). |
| Version simple (éco) | La version actuelle est **conservée telle quelle** comme version simple : terminal seul, cartes d'inventaire, 3615, yeux, réglages, mobilier (7 octobre). C'est le mode par défaut (8 octobre). |
| Date du Terminatel | Le compteur de sa porte affiche **« 198? »**, faute de source publique. |
| Ambiance générale | Rétro mystérieux, années 1920 à 1960 : bois sombre, laiton, cuir, verre, vieux papier, mécanique, lumière chaude. |

## 2. Parcours visé

1. Depuis la version simple, le visiteur passe en mode 3D+ et arrive à l'entrée du couloir.
2. Il avance de poste en poste. Les portes sont rangées dans l'ordre chronologique : 1950, 1982, puis 198?.
3. Devant une porte, il voit le compteur, la plaque et la lumière de l'époque, puis il active la porte.
4. La séquence temporelle se joue (§5), suivie d'un travelling à travers la porte.
5. Il arrive à l'entrée de la salle, puis va au poste d'inspection devant le terminal. Là, il retrouve **l'expérience actuelle** : orbite, vues, 3615, yeux de Lemegeton, réglages, mobilier.
6. La porte de sortie de la salle (ou « Sortir vers le couloir ») le ramène au couloir, avec la séquence jouée à l'envers.
7. « Mode simple » le ramène à la version simple, sur le terminal de la salle où il se trouvait.

Les cartes d'inventaire servent de raccourci : elles mènent directement à une salle,
avec un fondu.

La **version simple** reste le mode par défaut, pour qui veut le terminal sans le
couloir ou pour un appareil modeste (§3).

## 3. Architecture

Le monde est décrit par des **données pures**, sur le modèle de `src/demo/catalog.ts`
et de `src/scene/furniture.ts`. Les composants 3D ne font que les lire, et la
navigation est un **réducteur pur**, testable sans navigateur.

```text
src/world/
  types.ts         Station, Hotspot, TemporalDoor, Room, Corridor, Destination
  rooms.ts         salles dérivées du catalogue (une par ModelEntry) + ambiance
  corridors.ts     couloir : segments du kit, emplacements de portes, postes
  doors.ts         modèle de porte + paramètres temporels par porte
  rails.ts         graphe des postes, voisins, courbes et durées de trajet (pur)
  navigation.ts    réducteur : état, événements, transitions (pur)
  sequence.ts      timeline de la porte : t (s) → état des pièces mobiles (pur)
  url.ts           ?salle= / ?poste= <-> état ; compatibilité ?modele= (pur)
src/world/three/
  World.tsx        choisit la scène courante (couloir ou salle), en Suspense
  RailCamera.tsx   caméra sur rails : trajet, parallaxe, poste d'inspection
  Door.tsx         porte temporelle (pivot, poignée, compteur, horloge, lumière)
  Corridor.tsx     assemblage du kit
  Room.tsx         salle : décor, éclairage, terminal (<Minitel>), mobilier
  Hotspots.tsx     points d'intérêt (boutons DOM accessibles, ancrés en 3D)
  TemporalEffect.tsx  grain, aberration et flou pendant le passage
atelier/index.html + src/atelier/   entrée Vite : une brique seule (§9)
simple/index.html                  entrée Vite : version simple = App actuelle (§3)
```

### Modèle de données

```ts
type Vec3 = [number, number, number];

interface Station {
  id: string;            // "couloir:entree", "salle:minitel-1:terminal"
  position: Vec3;
  lookAt: Vec3;
  fov?: number;
  inspect?: boolean;     // orbite autorisée (poste devant un terminal)
}

interface Hotspot {
  id: string;
  label: string;         // libellé accessible : "Ouvrir la porte 1982"
  anchor: Vec3;          // position 3D du bouton
  action: { kind: "aller"; station: string } | { kind: "porte"; door: string } | { kind: "inspecter" };
}

interface TemporalDoor {
  id: string;
  model: string;         // un seul GLB partagé par toutes les portes
  year: string;          // "1950" | "1982" | "198?"
  glow: string;          // teinte de l'époque (DIRECTION_ARTISTIQUE.md)
  plaque: string;        // "Téléviseur 1950"
}

type Destination =
  | { kind: "salle"; room: string }
  | { kind: "page"; href: string }           // plus tard
  | { kind: "externe"; href: string }        // plus tard, confirmée
  | { kind: "minitel"; service: string };    // plus tard

interface Room {
  id: string;            // = id du catalogue : "televiseur-1950", "minitel-1", "terminatel-255"
  terminal: string;      // ModelEntry.id
  era: string;           // "1950" | "1982" | "198?"
  ambiance: "salon-1950" | "bureau-1982" | "terminatel";
  stations: Station[];   // au moins "entree" et "terminal" (inspect)
  hotspots: Record<string, Hotspot[]>;   // par poste
  exit: string;          // id de la porte de retour
}

interface DoorSlot { segment: number; side: "gauche" | "droite" | "fond"; door: TemporalDoor; to: Destination; approach: string }
interface Corridor { id: string; segments: string[]; stations: Station[]; hotspots: Record<string, Hotspot[]>; doors: DoorSlot[] }
```

### Deux modes du site

Décisions du 7 et du 8 octobre 2026 : l'expérience actuelle est conservée **telle
quelle** comme version simple (terminal seul, cartes d'inventaire, 3615, yeux,
réglages, mobilier), et c'est elle qui s'ouvre par défaut. Le monde explorable est
un **mode** de la même page, « 3D+ », choisi par un bouton.

| Adresse | Contenu |
| --- | --- |
| `/minitel/` | version simple (mode par défaut) |
| `/minitel/?mode=3d` | mode 3D+ : le monde, arrivée dans le couloir ; `&salle=` et `&poste=` comme au §4 |
| `/minitel/simple/` | version simple seule (même page, ancienne adresse conservée) |
| `/minitel/parcours/` | le monde seul, aperçu de développement (lot D) |
| `/minitel/documentation/` | documentation |
| `/minitel/atelier/` | atelier des briques (§9) |

- **Mise en œuvre** (`src/SiteModes.tsx`, `src/siteMode.ts`) : `index.html` monte `SiteModes`, qui affiche l'`App` ou, avec `?mode=3d`, `WorldApp`. Le code du monde est un **chunk chargé à la demande** (`React.lazy`) : en version simple, rien de `src/world/` n'est téléchargé.
- **Bascule** : un bouton **Mode 3D+** dans l'en-tête de la version simple, **Mode simple** dans celui du monde. Chaque bascule ajoute une entrée d'historique : le bouton Retour du navigateur repasse d'un mode à l'autre.
  - Vers 3D+ : les réglages propres à la version simple (`modele`, `ecran`, `yeux`…) sont retirés, on arrive dans le couloir.
  - Vers la version simple : `salle` et `poste` sont retirés ; depuis une salle, `?modele=` reprend son terminal.
  - Le mobilier (`?table=`) est commun aux deux modes.
- **Partage** : le poste `terminal` du monde réutilise les composants de la version simple (terminal, panneau 3615, yeux, réglages, mobilier).
- **Suggestion automatique** de la version simple (économie de données, peu de mémoire, rendu lent) : sans objet tant que la version simple est le mode par défaut.
- **Captures** : `tools/capture_views.mjs` et les miniatures d'inventaire (`?capture=1`) visent la version simple.

`rooms.ts` **dérive** les salles du catalogue : ajouter une `ModelEntry` ajoute
une salle et une porte. Les champs propres au monde (`era`, `ambiance`) vivent
dans `rooms.ts`, indexés par l'id du catalogue. Le catalogue reste ainsi centré sur
le terminal.

## 4. Rails

- **Postes** : ce sont des points de vue fixes. Dans le couloir, on trouve `entree`, un poste d'approche face à chaque porte, puis `fond`. Dans une salle, `entree` et `terminal` (`inspect`).
- **Graphe** : on ne se déplace que vers un voisin. Les voisins sont le poste précédent ou suivant du couloir, la porte et sa salle, la sortie et sa porte. `rails.ts` calcule ce graphe à partir des données ; il n'est jamais écrit à la main.
- **Trajet** : une courbe `CatmullRomCurve3` relie les deux postes, avec un point intermédiaire pour franchir une porte. La durée vaut `clamp(distance / 12, 0.8, 2.5)` s, soit 12 unités/s, environ 1,5 m/s, un pas de marche. Le mouvement suit une courbe `easeInOutCubic`. Le regard est interpolé de la cible de départ vers celle d'arrivée.
- **Pendant un trajet**, les commandes sont bloquées et les points d'intérêt masqués.
- **Regard à un poste** : une parallaxe bornée suit la souris, ou l'inclinaison sur mobile si elle est autorisée. Elle va jusqu'à ±3° en lacet et ±2° en tangage, avec un retour doux au centre.
- **Poste `inspect`** : c'est la caméra actuelle (`Camera.tsx`). On y retrouve l'`OrbitControls`, les cadrages de `framing.ts` et la barre vues/zoom. Ailleurs, ni orbite ni barre.
- **Clavier** :
  - `Tab` et `Maj+Tab`, ainsi que les flèches, passent d'un point d'intérêt à l'autre ;
  - `Entrée` ou `Espace` active le point d'intérêt sélectionné ;
  - `Échap` ou `Retour arrière` ramènent au poste précédent ;
  - au poste d'inspection, `Échap` ressort de l'inspection.
- **Toucher** : appuyer sur un point d'intérêt l'active. Pas de glisser hors du poste d'inspection.
- **Mouvement réduit** (`prefers-reduced-motion`) : un fondu de 0,4 s remplace trajets et séquences. Il n'y a pas de parallaxe, et la lampe ne vacille pas (c'est déjà le cas).

### Navigation : réducteur pur

```text
états : poste(id) | trajet(de, vers, t) | ouverture(porte, t) | passage(porte, t) | retour(porte, t) | fondu(vers, t)

poste      --ALLER(voisin)-->    trajet       --ARRIVEE-->      poste
poste      --PORTE(id)------>    ouverture    --FIN_SEQUENCE--> passage --ARRIVEE--> poste(salle:entree)
poste      --SORTIE--------->    retour       --ARRIVEE-->      poste(couloir:approche)
*          --SAUT(salle)---->    fondu        --ARRIVEE-->      poste          (inventaire, URL lointaine)
poste      --PRECEDENT------>    trajet vers le poste précédent de l'historique
```

### URL et historique

- `?salle=<id>&poste=<id>` décrit l'endroit. Sans paramètre, on arrive à l'entrée du couloir.
- Chaque **arrivée** à un poste fait un `history.pushState`. `popstate` rejoue un trajet si la cible est voisine, sinon il fait un fondu.
- Les réglages (`ecran`, `couleur`, `yeux`, `rendu`, `taille`, `table`, `vue`) restent en `replaceState` : ils ne créent pas d'entrée d'historique.
- Compatibilité : `?modele=<id>` est réécrit en `?salle=<id>&poste=terminal` (`replaceState`). La version simple garde son `?modele=` tel quel (`/minitel/simple/?modele=…`), comme le mode `?capture=1&transparent=1` de `tools/capture_views.mjs`.

## 5. Porte temporelle

Une seule porte est modélisée. Elle a un pivot de charnière à l'origine du battant
et une poignée séparée, et elle porte trois éléments animables :
- un **compteur à rouleaux**, de quatre rouleaux. C'est une texture canvas, en chiffres IBM Plex Mono. Le dernier rouleau sait afficher `?` ;
- une **pendule** fixe au-dessus du chambranle. Les aiguilles qui s'emballent sont celles de la **grande horloge** du couloir, des objets séparés (décision du 7 octobre) ;
- une **lumière** d'entrebâillement : un `rectAreaLight` ou un plan émissif, dans la teinte de l'époque.

La séquence d'ouverture dure environ 3 s, sans compter le travelling.
`sequence.ts` la décrit comme une fonction pure : `t → état`.

| t (s) | Événement |
| --- | --- |
| 0,0 | La poignée tourne ; un tic-tac démarre. |
| 0,2 → 1,4 | Le compteur roule de l'année du couloir (« 19?? ») jusqu'à l'année cible. Le tic-tac accélère. |
| 0,6 → 1,6 | Les aiguilles de la grande horloge du couloir s'emballent : le temps y court jusqu'à 7 200 fois plus vite, soit deux tours de la grande aiguille par seconde. La pendule au-dessus de la porte reste fixe. |
| 1,2 → 2,0 | La lumière de l'époque filtre et monte en intensité. |
| 1,6 → 3,0 | Le battant s'ouvre (`openAngle`) ; un souffle se fait entendre. |
| 3,0 → | Passage : travelling au travers et effet temporel (§7), puis arrivée à `salle:<id>:entree`. |

Au retour, la même séquence se joue à l'envers depuis la porte de sortie de la
salle. En mouvement réduit, le compteur affiche directement l'année cible, puis un
fondu de 0,4 s mène à la salle.

## 6. Salles

| Salle | Terminal (catalogue) | Porte | Ambiance | Mobilier |
| --- | --- | --- | --- | --- |
| `televiseur-1950` | Téléviseur 1950 (Huuxloc, CC BY 4.0) | 1950 | salon des années 50 | meuble télé en teck construit en code (`STAND_TOP`, 60 cm) |
| `minitel-1` | Minitel 1 (okotaru, CC BY 4.0) | 1982 | bureau des années 80 | tables actuelles (brandon_grey, CC BY 4.0) |
| `terminatel-255` | Terminatel 255 (finition marbre procédurale) | 198? | DA actuelle : marbre noir, laiton, lumière ambrée | tables actuelles |

- La salle `terminatel-255` reprend la scène actuelle **sans régression** : même terminal, mêmes réglages et même mobilier. Elle gagne des murs de marbre (`src/demo/marble.ts`) et une porte de sortie.
- Le panneau 3615, les yeux et les réglages ne s'affichent qu'au poste `terminal` (décision du 7 octobre). Ailleurs, l'interface se réduit à la navigation et au bouton du son.

## 7. Points d'intégration dans le code actuel

C'est l'audit du 7 octobre 2026 (commit `285a351`). Chaque point indique ce qu'il
faudra changer pour accueillir le monde.

| Où | Constat | Conséquence pour le monde |
| --- | --- | --- |
| [Scene.tsx:93](../src/scene/Scene.tsx#L93) | `far: 80` unités, soit 10 m. | Un couloir de trois portes mesure environ 16 m, soit 128 unités. Il faut un `far` paramétrable par scène, autour de 400. |
| [Scene.tsx:91](../src/scene/Scene.tsx#L91) | `frameloop="demand"`. | Trajets et séquences ont besoin d'une image à chaque frame. Un pilote `useFrame` appelle `invalidate()` tant que l'état n'est pas `poste`. On garde le rendu à la demande à l'arrêt. |
| [Scene.tsx:96](../src/scene/Scene.tsx#L96) | Canvas transparent sur le marbre CSS de la page. | Le couloir et les salles sont opaques (murs). Le fond CSS ne sert plus qu'au terminal seul (`capture`) et au repli sans WebGL. |
| [Scene.tsx:122](../src/scene/Scene.tsx#L122) | Plan d'ombre de 100 × 100 sous le terminal. | Il est remplacé par le sol de chaque salle, qui reçoit les ombres. |
| [Lighting.tsx:41](../src/scene/Lighting.tsx#L41) | Éclairage global, ombre directionnelle cadrée sur ±10 unités. | Lighting doit devenir des **presets** (`couloir`, `salon-1950`, `bureau-1982`, `terminatel`). Le preset `terminatel` reprend l'actuel à l'identique. Dans le couloir : peu de lumières à ombres, et des lightmaps cuites dans Blender si besoin. |
| [Lighting.tsx:17](../src/scene/Lighting.tsx#L17) | La lampe lointaine demande une image toutes les 50 ms, **même à l'arrêt** : on rend en continu à environ 20 images/s. | Elle doit être active seulement dans la salle `terminatel` et rester à l'arrêt pendant les trajets. C'est aussi une économie possible dès aujourd'hui. |
| [MinitelScreen.tsx:129](../src/minitel/MinitelScreen.tsx#L129), [:151](../src/minitel/MinitelScreen.tsx#L151) | L'écran se met à jour à 8 Hz (Vidéotex), ou toutes les 33 ms (yeux). | Ces minuteries sont à suspendre quand le terminal n'est pas dans la scène courante. |
| [Camera.tsx:56](../src/scene/Camera.tsx#L56) | `OrbitControls` est toujours actif (`makeDefault`), avec les commandes vues et zoom. | `RailCamera` prend la main. `Camera` n'est monté qu'aux postes `inspect`, et la barre vues/zoom n'apparaît que là. |
| [framing.ts:17](../src/scene/framing.ts#L17) | Les cadrages `desk` et `floor` sont exprimés par rapport au centre de l'écran. | Ils deviennent les postes `terminal` des salles, sans changer de valeurs. |
| [App.tsx](../src/App.tsx) (742 lignes) | L'URL est lue à plusieurs endroits et écrite en `replaceState` ([:152](../src/App.tsx#L152), [:229](../src/App.tsx#L229), [:238](../src/App.tsx#L238)). | App.tsx **devient la version simple** et ne grossit plus. Au lot A, il faut extraire l'état d'URL dans un hook (`replace` pour les réglages, `push` pour les postes), ainsi que les panneaux (3615, yeux, réglages, mobilier) en composants. Le poste `terminal` du monde les réutilisera. L'état du monde vit dans `WorldApp` et `useWorld`. |
| [App.tsx:212](../src/App.tsx#L212) | `?modele=` choisit le terminal. | Il faut le réécrire en `?salle=` (§4). |
| [ModelInventory.tsx:30](../src/components/ModelInventory.tsx#L30) | L'inventaire est un `radiogroup` qui choisit un modèle. | Il devient une navigation : des boutons « Aller à la salle … » avec `aria-current`. Le style CSS 3D est conservé. |
| [Table.tsx:30](../src/scene/Table.tsx#L30) | Le mobilier est préchargé au chargement du module. Le cache de `useGLTF` ne se vide jamais. | Il faut charger à la demande la salle courante et ses voisines, puis appeler `useGLTF.clear` et libérer les textures à plus d'un saut. |
| [catalog.ts:29](../src/demo/catalog.ts#L29) | `onTable` place le terminal sur une table ou au sol. | La disposition de la salle part de là (§6). |
| [deploy-ovh.yml:46-52](../.github/workflows/deploy-ovh.yml) | Le déploiement vérifie certains fichiers précis et **refuse tout `.webp`** dans `dist/`. | Il faudra ajouter les GLB du monde à la liste vérifiée. Les textures doivent rester **dans** les GLB (KTX2 ou JPEG/PNG). Si on publie un jour un `.webp` autonome, il faudra cibler la règle sur les photos de référence uniquement. |
| [tests/browser/app.spec.ts](../tests/browser/app.spec.ts) | Les 22 tests supposent qu'on arrive directement devant le terminal (`expectScreenCentered`). | Ils visent la **version simple**, qui ne change pas : seule l'adresse passe à `/simple/` au lot F. Le monde a ses propres tests (§11). |
| [AccessibleTerminal.tsx](../src/components/AccessibleTerminal.tsx) | Une alternative texte du 3615 existe. | La navigation a besoin de la même chose : liste des points d'intérêt en DOM et annonce de l'arrivée (`aria-live`). |

## 8. Budgets

### Mesures actuelles

Mesuré le 7 octobre 2026 : `python tools/budget_glb.py`, qui écrit
[budgets.json](asset-audit/budgets.json), et panneau d'inspection en dev (Edge, 1280 × 800).

| GLB | Poids | Triangles | Primitives / matériaux | Textures | Mémoire GPU des textures* |
| --- | --- | --- | --- | --- | --- |
| `minitel.glb` | 3,5 Mo | 21 943 | 71 / 71 | 11 (≤ 1024²) | ~24 Mo |
| `television-1950.glb` | 1,5 Mo | 5 718 | 5 / 5 | 4 (≤ 1024²) | ~12 Mo |
| `mobilier/*.glb` (chacun) | 0,28 à 0,36 Mo | 2 354 à 4 312 | 1 / 1 | 3 (1024²) | ~17 Mo |

\* Estimation RGBA 8 bits avec mipmaps, sans compression GPU.

| Scène | Appels de rendu | Triangles du terminal* | Triangles du mobilier |
| --- | --- | --- | --- |
| Terminatel ou Minitel 1 sur table à tiroir | 73 | 25 397 | 3 148 |
| Minitel 1 au sol | 72 | 25 397 | — |
| Téléviseur 1950 | 7 | 5 718 | — |

\* Valeur du panneau d'inspection, qui compte le terminal seul. Pour le Minitel, ce
chiffre inclut l'écran bombé subdivisé, d'où l'écart avec les 21 943 triangles du
GLB.

Les images/s affichées (24 à 29) ne mesurent pas la capacité. Elles reflètent le
rendu à la demande, entretenu par la lampe à 20 Hz et l'écran.

Coût de la page aujourd'hui :
- JS : 375 Ko compressés (gzip), soit `main` 120 Ko + three/drei/React 255 Ko ;
- terminal par défaut : 3,5 Mo de GLB ;
- table : 0,33 Mo ;
- inventaire : 0,19 Mo ;
- **≈ 4,4 Mo au total** à la première visite.

`dist/` contient 45 fichiers, pour 8,6 Mo.

Constat : le Minitel coûte **71 appels de rendu**, à cause de 71 matériaux
distincts. Fusionner ses matériaux, ou les regrouper dans un atlas, est le levier
principal si les salles deviennent lourdes.

### Cibles proposées

| Périmètre | Transfert | Appels de rendu | Triangles | Textures GPU |
| --- | --- | --- | --- | --- |
| Première vue (entrée du couloir), hors JS | ≤ 3 Mo | ≤ 120 | ≤ 150 k | ≤ 96 Mo |
| Une salle complète (décor + terminal + mobilier) | ≤ 4 Mo | ≤ 150 | ≤ 300 k | ≤ 128 Mo |
| Porte temporelle (GLB partagé) | ≤ 0,6 Mo | ≤ 8 par porte | ≤ 15 k | ≤ 24 Mo |
| Simultanément en mémoire | scène courante + voisines | — | — | ≤ 192 Mo |

Comportement attendu :
- 60 images/s sur ordinateur pendant les trajets ;
- 30 images/s ou plus sur le téléphone de référence, l'**iPhone 11** (choisi le 7 octobre) ;
- rendu à la demande à l'arrêt.

Notes pour l'iPhone 11 :
- Puce A13, 4 Go de mémoire, Safari (WebKit). L'écran fait 828 × 1 792 px à DPR 2 ; avec la limite actuelle `dpr={[1, 1.5]}`, le rendu se fait en 621 × 1 344.
- WebGL 2 est disponible depuis iOS 15. Les textures KTX2 (Basis) y sont transcodées en ASTC, ce qui divise la mémoire GPU par 4 environ par rapport au RGBA (8 bits par pixel au lieu de 32).
- Safari ferme l'onglet quand la mémoire déborde, sans prévenir. Le plafond de 192 Mo de textures simultanées est une marge de sécurité à respecter.

La version simple garde ses coûts actuels (≈ 4,4 Mo, 73 appels de rendu) : le monde
ne l'alourdit pas.

Leviers, par ordre de rentabilité :
1. **Une seule porte** pour toutes les portes : un seul GLB, avec géométrie et matériaux partagés. Seule la texture du compteur change.
2. **Kit du couloir fusionné par segment** dans Blender, et `InstancedMesh` pour les éléments répétés (moulures, appliques).
3. **Textures KTX2 (Basis) et géométrie meshopt** via `gltf-transform` dans `tools/`. Côté app, il faudra charger `KTX2Loader` et `MeshoptDecoder`. C'est une nouvelle dépendance de dev, à introduire dans le lot A.
4. Fusion des 71 matériaux du Minitel, en option.
5. Lightmaps cuites pour le couloir, plutôt que des ombres dynamiques multiples.

`tools/budget_glb.py` sert à contrôler chaque nouvel asset. Une étape de CI qui
échoue au-delà des cibles pourra suivre.

## 9. Atelier

Une **3e entrée Vite**, `atelier/index.html`, comme `documentation/`, affiche une
brique seule : `atelier/?brique=porte|couloir|salle&id=…`. Elle a ses propres
contrôles : jouer la séquence, faire défiler `t`, changer l'année, parcourir les
postes. App.tsx reste intact, et le bundle de l'atelier est séparé. L'atelier est
publié avec le site, sans lien depuis l'accueil, pour pouvoir relire en ligne.

L'issue proposait `?atelier=` sur la page principale. L'entrée séparée est
préférée pour ne pas alourdir `App.tsx`.

## 10. Assets

Les règles, les sources vérifiées et l'arborescence locale sont dans
[ASSETS.md](ASSETS.md#monde-explorable--sources-et-règles). En résumé :
- seulement CC0 ou CC BY (crédité) ;
- tout passe par un `tools/prepare_*.py` (échelle 1 m = 8 unités, origine, compression) ;
- chaque asset a un rapport dans `docs/asset-audit/` ;
- les sources lourdes restent locales.

Le prototype a besoin de 10 éléments. Les sources sont à choisir au lot concerné.

| Élément | Lot | Origine recommandée |
| --- | --- | --- |
| Porte et poignée | B | **provisoire** : « Door_Wooden_Old » de Mehdi Shahsavan (ahmagh2e), CC BY 4.0, porte à panneaux en bois sombre avec cadre ([Sketchfab](https://sketchfab.com/3d-models/none-77815b3a55504037aa4641eb9650e9de)) ; modèle maison plus tard. Déposée le 7 octobre (glTF, `monde/00_CORE/porte/`) : **battant et poignée séparés**, pivot du battant déjà sur les charnières ; 1,00 × 2,30 m (8 × 18,4 unités) ; 5 289 triangles, 4 appels de rendu. **Hors budget en l'état** (6 textures PNG 1024², 5,4 Mo, environ 34 Mo GPU) : il faudra du KTX2 et des cartes secondaires en 512 pour tenir 0,6 Mo et 24 Mo. |
| Horloge de porte | B | **provisoire** : « Mantel Clock 01 » de Poly Haven (Rico Cilliers, rig de Yann Kervran), CC0, pendule de cheminée en bois ([Poly Haven](https://polyhaven.com/a/mantel_clock_01)) ; modèle maison plus tard. Téléchargée le 7 octobre (glTF 1k, `monde/00_CORE/`). **Dans le glTF, les aiguilles sont fusionnées au boîtier** : le rig n'existe que dans le `.blend`. **Décision du 7 octobre : la pendule reste un décor fixe au-dessus de la porte**, et l'emballement des aiguilles est confié à la grande horloge du couloir. Le `.blend` riggé (3,9 Mo) n'est pas téléchargé. |
| Grande horloge du couloir | B et C | « Vintage Grandfather Clock 01 » de Poly Haven, CC0, horloge de parquet ([Poly Haven](https://polyhaven.com/a/vintage_grandfather_clock_01)). Téléchargée le 7 octobre (glTF 1k, `monde/01_CORRIDOR/`) : **aiguilles séparées** (`minute_hand`, `houd_hand`), animables telles quelles ; 2,19 m ; 8 582 triangles. |
| Mur, sol, moulure, applique | C | kit Blender + matériaux ambientCG / Poly Haven (CC0) |
| Décor des salles | E | **construit en code** (`src/world/three/rooms/`) sur les textures du couloir et des textures dessinées sur canvas : aucun téléchargement. Des modèles CC0 pourront remplacer les meubles plus tard. |

Échelle de référence, pour 1 m = 8 unités :
- porte de 0,9 × 2,1 m, soit 7,2 × 16,8 ;
- couloir de 1,6 m de large et 2,8 m de haut, soit 12,8 × 22,4 ;
- segments du kit de 2 m et 4 m, soit 16 et 32 ;
- yeux de la caméra à 1,6 m, soit 12,8.

## 11. Tests et vérification

- **Vitest** : `rails.ts` (graphe, durées, courbes), `navigation.ts` (toutes les transitions, PRECEDENT, SAUT), `sequence.ts` (états à t donné, inversion), `url.ts` (aller-retour, compatibilité `?modele=`), dérivation des salles depuis le catalogue.
- **Playwright** :
  - un test par brique dans l'atelier : captures de la porte à t = 0, à t = 1,5 et ouverte ; trajet dans le couloir ;
  - un parcours complet couloir → porte → salle → retour, **au clavier seul** ;
  - le bouton Retour du navigateur ;
  - l'arrivée directe par `?salle=` ;
  - la compatibilité `?modele=` ;
  - le mouvement réduit (fondus, pas de trajet) ;
  - le repli sans WebGL ;
  - les passerelles entre les deux versions, et la suggestion de la version simple (`saveData` simulé).
- **WebKit et iPhone 11** : un projet Playwright `webkit` avec le profil d'appareil `iPhone 11` (émulation : taille, DPR, tactile). Il faut installer WebKit via `npx playwright install webkit`, un téléchargement à approuver. Ce n'est qu'une approximation : à partir du lot C, chaque lot se vérifie aussi **sur un vrai iPhone 11**.
- **Non-régression** : les 22 tests actuels restent verts sur la version simple. Le poste `terminal` de chaque salle reprend leurs vérifications principales : écran centré, 3615, yeux.
- **Captures** dans `docs/verification/`, une par poste.
- **Budgets** : `tools/budget_glb.py`, plus le panneau d'inspection (appels de rendu, triangles) à chaque poste.

## 12. Lots

Chaque lot fait l'objet d'une PR et se déploie sans casser l'existant.

| Lot | Contenu | Critères d'acceptation |
| --- | --- | --- |
| **A. Préparation** (aucun changement visible) | entrée `simple/` (= App actuelle) ; panneaux et hook d'URL extraits d'App.tsx ; Lighting en presets (`terminatel` = actuel) ; `far` paramétrable ; lampe et écran suspendus hors scène ; `src/world/` (types, rails, navigation, sequence, url, rooms) avec tests ; entrée Vite `atelier/` vide ; chaîne KTX2/meshopt dans `tools/` | 22/22 tests navigateur inchangés ; nouveaux tests unitaires verts ; build et déploiement OK |
| **B. Porte temporelle** | modèles provisoires du §10 préparés (pivot du battant, poignée, aiguilles), compteur canvas, lumière, sons, séquence ; atelier `?brique=porte` | séquence conforme au §5, aller et retour ; mouvement réduit ; captures ; budget de la porte respecté |
| **C. Couloir** | kit Blender, assemblage par données, trois emplacements de portes chronologiques, postes, preset `couloir` ; atelier `?brique=couloir` | trajet entre tous les postes ; budget « première vue » respecté, vérifié sur iPhone 11 |
| **D. Rails et navigation** | `RailCamera`, points d'intérêt DOM, parallaxe, clavier, toucher, URL et historique, fondus ; salles provisoires (boîtes) | parcours complet au clavier ; Retour du navigateur ; `?salle=` et `?poste=` |
| **E. Salles** | `terminatel-255` (scène actuelle dans une pièce), puis `minitel-1` (bureau 80s), puis `televiseur-1950` (salon 50s) ; poste `inspect` = caméra actuelle | non-régression au poste `terminal` ; budget « salle » respecté ; ambiances conformes à la DA |
| **F. Intégration** | ~~`/minitel/` passe au monde~~ : remplacé le 8 octobre par les **modes** (§3), livrés avec le lot E ; inventaire en raccourci vers les salles, crédits à l'écran, ATTRIBUTION, contrôle du déploiement, page Documentation | parcours en ligne vérifié ; aucune erreur console ; crédits complets |
| **G. Objets interactifs** (plus tard) | horloge de jeu, machine à écrire, téléphone, radio, objets mystérieux | à cadrer au moment venu |

### Avancement

**Lot A — terminé le 7 octobre 2026**, sans changement visible (branche `feat/lot-a-preparation`) :
- `App.tsx` passe de 742 à 306 lignes et devient la version simple. L'expérience du terminal et ses panneaux sont dans `src/terminal/`, l'état d'URL dans `src/hooks/urlParams.ts`.
- Éclairage en presets : `terminatelLighting` reproduit l'actuel valeur pour valeur. `Scene` accepte `lighting`, `cameraFar` et `paused` ; avec `paused`, la lampe et l'écran cessent de demander des images.
- Nouvelles entrées `simple/` (version simple) et `atelier/` (coquille des briques), vérifiées par le déploiement.
- `src/world/` (types, salles, rails, navigation, séquence, URL) : 15 tests unitaires. Un test de mutation confirme qu'ils détectent un mauvais ordre chronologique.
- Chaîne d'assets : `tools/optimize_glb.mjs` (KTX2 + meshopt, sans binaire externe), et `tools/budget_glb.py` qui lit le KTX2.
- Essai sur la porte provisoire, en local : 5,56 → 0,74 Mo, textures GPU de ~34 à 4,2 Mo. Le fichier se charge dans three.js avec `KTX2Loader` et meshopt.
- Vérifications : 38 tests unitaires, 26 tests navigateur (les 22 d'origine + `/simple/` et `/atelier/`, sur ordinateur et mobile), typecheck, lint, build.

Reporté au lot B :
- le chargement KTX2 dans l'application (`KTX2Loader`, transcodeur Basis servi avec le site) : il ne sert qu'à partir du premier GLB compressé affiché ;
- le réglage fin de la porte pour passer de 0,74 à 0,6 Mo (taille de la texture du cadre), avec vérification visuelle.

**Lot B — terminé le 8 octobre 2026** : la porte temporelle dans l'atelier, `atelier/?brique=porte&porte=<salle>`.
- **Modèles** (`public/models/monde/`) :
  - `porte.glb` : préparé par `tools/prepare_door.mjs` (copie fermée, 1 m = 8 unités, nœuds `cadre`, `battant` et `poignee`), puis compressé en couleur 1024 px et autres cartes 256 px. 0,44 Mo, 5 289 triangles, 4 appels de rendu, ~3 Mo sur le GPU.
  - `pendule.glb` : simplifiée à un quart de ses sommets, 0,25 Mo, 6 429 triangles.
  - `horloge.glb` : 0,78 Mo, 8 582 triangles.
- **Rendu** (`src/world/three/`) :
  - `TemporalDoor` : battant et poignée animés, compteur à rouleaux et plaque dessinés sur canvas (`counter.ts`) et portés par le battant, pendule sur le linteau, mur percé, lumière de l'époque (dégradé additif et spot qui déborde au sol).
  - `GrandfatherClock` : aiguilles à l'heure locale, qui s'emballent jusqu'à 7 200 × pendant la séquence.
  - Éclairage `couloirLighting`.
- **Son** (`src/world/doorSound.ts`) : synthétisé en Web Audio, sans fichier son. Tic-tac qui accélère, souffle à l'ouverture ; coupé par défaut.
- **Atelier** (`src/atelier/DoorWorkshop.tsx`) : ouvrir, refermer, curseur de temps, choix de la porte (1950, 1982, 198?), son, état lisible et annonce de fin ; ouverture immédiate en mouvement réduit.
- **Pièges réglés** :
  - les vitres des horloges sont opaques une fois exportées en glTF (elles sont masquées) ;
  - le cadran est marqué métal, donc noir sous un éclairage faible (métal atténué) ;
  - la compression ETC1S de la carte métal/rugosité dessinait un damier sur le cadran (option `--data-uastc`) ;
  - le cadran de la grande horloge regarde déjà +z dans le fichier.
- **Tests** : `tests/browser/door.spec.ts`, 3 tests sur ordinateur et mobile. Un test de mutation confirme qu'un battant qui ne s'ouvre plus fait échouer le premier.

**Lot C — terminé le 8 octobre 2026** : le couloir dans l'atelier, `atelier/?brique=couloir&poste=<poste>`.
- **Kit en code** (`src/world/three/Corridor.tsx`), à partir des données de `rooms.ts` :
  - lambris en bois sombre jusqu'à 1 m, papier peint vieilli teinté vert bouteille, parquet à chevrons, plafond en plâtre (couleur unie, sans texture : économie de 0,49 Mo) ;
  - plinthes, cimaise et corniche ;
  - quatre appliques en laiton avec leur lumière ;
  - les trois portes temporelles dans les murs, dans l'ordre chronologique, et la grande horloge au fond.
  - Les murs sont des bandes entre les portes, fusionnées en un seul maillage par matériau.
- **Textures** : Poly Haven, CC0, encodées par `tools/encode_textures.mjs`. Couleur en ETC1S 1024 px ; relief et matière en UASTC 512 px, marqués linéaires.
- **Géométrie corrigée** :
  - le couloir mesure 1,6 × 2,8 m ;
  - de face, une porte de 2,46 m ne tenait pas dans le champ depuis le milieu du couloir : le poste face à une porte est désormais contre le mur opposé, à 1,4 m, avec un champ de 60°.
  - Les postes ont un `fov` ; les emplacements de porte ont une position et une orientation.
- **Caméra sur rails** (`src/world/three/RailCamera.tsx`) : trajet en courbe entre les postes, avec accélération douce et visée et champ fondus ; saut direct en mouvement réduit. Le lot D la réutilisera.
- **Atelier** (`src/atelier/CorridorWorkshop.tsx`) : postes, ouverture de la porte au poste qui lui fait face, coût de rendu en direct.
- **Budget mesuré** à l'entrée du couloir : 40 appels de rendu, 45 000 triangles (cibles : 120 et 150 000). Transfert du couloir et de ses modèles : 3,07 Mo, à la limite de la cible de 3 Mo, sans compter le transcodeur, téléchargé une fois.
- **Correction de fond** : les cartes de relief et de matière de tous les KTX2 étaient marquées sRGB (voir [ASSETS.md](ASSETS.md#compression-8-octobre-2026)). Tous les modèles ont été recompressés.
- L'atelier de la porte se recadre sur téléphone, en portrait.
- **Tests** : `tests/browser/corridor.spec.ts`, 3 tests sur ordinateur et mobile, dont une assertion du budget à l'entrée.

**Lot D — terminé le 8 octobre 2026** : le monde sur ses rails, en aperçu sur `/minitel/parcours/`. L'accueil ne bascule qu'au lot F. Le nom `monde/` est déjà pris par le dossier des sources.
- **`src/world/pose.ts`** (pur, testé) donne pour chaque état de navigation le lieu, la caméra (position, visée, champ), le fondu au noir et la porte en mouvement :
  - trajet en courbe de Catmull-Rom (`curve.ts`) ;
  - ouverture sur place ;
  - passage vers le seuil, puis lumière et noir ;
  - retour : fondu dans la salle, puis la porte se referme vue du couloir ;
  - fondu au noir à mi-parcours.
- **Réducteur** : « Revenir » depuis l'entrée d'une salle rejoue la porte (retour ou ouverture), et non un trajet à travers le mur (`back` sur les états de porte).
- **`src/world/WorldApp.tsx`** :
  - le temps avance pendant les déplacements ;
  - l'adresse est remplacée au premier poste, puis chaque poste atteint ajoute une entrée d'historique. `popstate` rejoue le chemin : revenir, aller vers un voisin, ou sauter en fondu ;
  - les actions sont de vrais boutons, dans une barre d'outils accessible ; les flèches passent de l'une à l'autre, `Échap` et `Retour arrière` reviennent ;
  - un clic sur une porte l'ouvre depuis son poste, ou mène jusqu'à elle ;
  - l'arrivée est annoncée (`aria-live`) ;
  - bouton Son, coupé par défaut ;
  - repli vers la version simple sans WebGL.
- **`NavCamera`** : applique la vue, avec une parallaxe bornée à la souris (±3°, ±2°), désactivée en mouvement réduit et au toucher. Le rendu se fait à la demande.
- **`RoomPlaceholder`** : salle provisoire teintée par époque, remplacée au lot E et supprimée.
- **Tests** :
  - unitaires : 46, dont les vues de chaque état ;
  - `tests/browser/parcours.spec.ts` : parcours complet au clavier seul, bouton Retour du navigateur, arrivée directe et ancien lien `?modele=`, clic sur une porte, mouvement réduit.
  - Test de mutation : sans entrée d'historique, le test du bouton Retour échoue.

**Lot E — terminé le 8 octobre 2026** : les trois salles et les deux modes du site.
- **Modes** (décision du 8 octobre, §3) : la version simple reste l'accueil ; **Mode 3D+** ouvre le monde (`?mode=3d`), chargé à la demande ; **Mode simple** revient, sur le terminal de la salle quittée. L'accueil simple pèse ce qu'il pesait (+13 ko de JS, la bascule et le code partagé avec le monde).
- **Salles** (`src/world/three/rooms/`), construites en code, sans téléchargement (voir [ASSETS.md](ASSETS.md#décor-des-salles-lot-e-8-octobre-2026)) :
  - `RoomShell` : 4 × 5 m, 2,8 m sous plafond ; murs en deux bandes sous et sur la cimaise, plinthes, corniche ; **porte de sortie** (le modèle de la porte temporelle, fermé, au compteur de la salle) dans le mur derrière le visiteur, qui ramène au couloir au clic ;
  - **salon 1950** : lambris clair, papier peint chaud, parquet à chevrons ; meuble télé en teck sur pieds compas (le téléviseur de 45 cm y est posé à 60 cm, `STAND_TOP`) ; deux fauteuils cocktail moutarde et canard tournés vers l'écran ; tapis à boomerangs ; buffet, vase céladon et livres ; tableau abstrait ; horloge soleil ; lampadaire (sa lumière est celle de `salonLighting`) ; fenêtre sur jardin et rideaux ; fougère ;
  - **bureau 1982** : murs grège avec soubassement lavable et baguette alu, moquette aiguilletée gris-bleu, faux plafond et deux pavés de néons ; stores vénitiens sur la ville ; classeur à quatre tiroirs ; fauteuil pivotant ; tableau de liège ; calendrier d'octobre 1982 ; horloge de bureau ; yucca ;
  - **Terminatel 255** : marbre noir procédural, sol noir poli, moulures et appliques en laiton, plaque gravée, poteaux et cordons rouges autour du terminal (le devant reste dégagé pour la caméra).
- **Poste terminal** : il reprend la vue par défaut de la version simple pour le mobilier choisi et la forme de l'écran (large ou étroite) : le passage à la caméra orbitale ne saute pas.
- **Portrait** : sous un rapport de 1,2, le champ des postes s'élargit pour garder la largeur de la vue (`fittedFov`, plafonné à 100°) ; le poste terminal garde le cadrage de la version simple (`fit` = 0).
- **Rendu à la demande** : `RenderWhenReady` demande une image quand les modèles d'une frontière Suspense sont prêts. Avant, une salle ouverte par son adresse restait noire jusqu'au premier mouvement de la souris (la version simple en profite aussi).
- **Chargement** : la porte, la pendule et l'horloge partent ensemble dès l'ouverture du monde (`preloadModels`, `useModels`), au lieu de se suivre ; une salle s'affiche sans attendre sa porte de sortie, et « Chargement… » remplace l'écran noir le temps que les modèles arrivent. Constaté en ligne le 8 octobre : le téléviseur avait mis 36 s, et la salle restait noire jusqu'à la fin de la file.
- **Budget mesuré** (`data-calls`, `data-triangles` sur le canevas, ombres comprises), cible 150 appels et 300 k triangles :

  | Salle | Entrée | Terminal |
  | --- | --- | --- |
  | Salon 1950 | 42 appels, 13 k triangles | 31, 8 k |
  | Bureau 1982 | 103, 36 k | 94, 33 k |
  | Terminatel 255 | 88, 36 k | 81, 33 k |

  Aucun fichier nouveau : les salles réutilisent les textures du couloir et la porte, déjà en cache.
- **Tests** :
  - unitaires : 58, dont le champ en portrait, la pose du terminal (meuble, table, sol ; large ou étroite) et les adresses des modes ;
  - `tests/browser/modes.spec.ts` : bascule aller et retour, bouton Retour du navigateur, retour depuis une salle ;
  - `parcours.spec.ts` : pour chaque salle, entrée et terminal rendus sans toucher la souris, et budget.
  - 62 tests navigateur sur ordinateur et mobile.

Reste ouvert : l'essai sur un vrai iPhone 11, et des modèles CC0 pour remplacer les meubles en code si l'on veut plus de détail.

**Lot F — terminé le 9 octobre 2026** : l'intégration du mode 3D+ au site. Les tests de ce lot viendront plus tard (décision de l'utilisateur).
- **Raccourci vers les salles** : en mode 3D+, les cartes d'inventaire de la version simple, en petit dans le coin bas gauche de la vue, mènent à l'entrée de la salle choisie en fondu (`SAUT`). La carte de la salle courante est cochée. Elles s'effacent pendant les déplacements et devant le terminal, où le 3615 prend la place.
- **Crédits à l'écran** (`src/world/credits.ts`) : la ligne du bas suit le lieu.
  - Couloir : la porte (CC BY), les horloges et les matières Poly Haven (CC0).
  - Salle : son terminal, sa table s'il y en a une, la porte de sortie et sa pendule ; pour le salon, les matières du couloir.
  - Un lien mène à `models/ATTRIBUTION.md`. Sur téléphone, seul ce lien reste : la licence CC BY 4.0 admet un crédit par lien vers la liste.
- **ATTRIBUTION.md** : le décor des salles, construit en code, et les assets que chaque salle réutilise.
- **Page Documentation** : section « Mode 3D+ » (parcours, salles, modèles et matières, entrée dans le couloir) ; chaque terminal a un lien « Voir sa salle en 3D+ » ; deux documents du projet ajoutés (monde explorable, direction artistique) ; pied de page complété (porte CC BY, Poly Haven CC0).
- **Déploiement** (`.github/workflows/deploy-ovh.yml`) :
  - le build vérifie que le monde est un chunk à part, absent de `index.html` ;
  - le test de fumée vérifie la porte, une texture KTX2, le transcodeur Basis et les crédits en ligne.

## 13. Questions ouvertes

Les cinq questions ont été tranchées le 7 octobre 2026 ; elles figurent au §1.
1. **Page d'arrivée** : le couloir.
2. **Son** : coupé par défaut.
3. **Modèles de la porte et de l'horloge** : provisoirement des modèles gratuits trouvés en ligne, choisis au §10. Notre propre modèle viendra plus tard.
4. **Panneau 3615, yeux et réglages** : seulement devant le terminal.
5. **Téléphone de référence** : iPhone 11. La version actuelle est conservée en version simple.

Toutes les questions sont tranchées. Le modèle provisoire ne change rien à
l'architecture : la porte reste paramétrée par `TemporalDoor`. Remplacer son GLB par
le modèle maison ne demandera qu'un nouveau passage par `tools/prepare_*.py`, avec
les mêmes noms de nœuds (battant, poignée, aiguilles).

## 14. Risques

| Risque | Parade |
| --- | --- |
| Poids cumulé des salles | Chargement à la demande, voisines seulement ; KTX2 et meshopt ; budgets vérifiés à chaque lot |
| Régression de l'expérience actuelle | Lot A sans changement visible ; poste `terminal` identique ; 22 tests conservés |
| App.tsx devient ingérable | App.tsx reste la version simple ; le monde a son propre `WorldApp` ; état d'URL et panneaux extraits au lot A |
| Deux versions à maintenir | La version simple, c'est le code actuel ; le monde réutilise ses composants ; les 22 tests la protègent |
| Écart entre l'émulation et le vrai iPhone | Vérification sur un vrai iPhone 11 à chaque lot à partir du C ; plafond mémoire prudent |
| Licence d'un asset mal vérifiée | Règles de [ASSETS.md](ASSETS.md#monde-explorable--sources-et-règles) ; provenance obligatoire ; NC, ND et « Royalty Free » refusés |
| Mal des transports pendant les trajets | Durées courtes, accélération douce, parallaxe faible, fondus en mouvement réduit |
| Accessibilité d'une navigation 3D | Points d'intérêt en DOM, clavier complet, annonces `aria-live`, repli sans WebGL |
