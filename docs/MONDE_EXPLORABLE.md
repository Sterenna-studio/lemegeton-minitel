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

Toutes ont été prises par l'utilisateur le 6 octobre 2026.

| Sujet | Décision |
| --- | --- |
| Construction | Porte, couloir et salles sont des **briques séparées**, assemblées par des données. |
| Déplacement | **Sur rails** : la caméra va de poste en poste, il n'y a pas d'exploration libre. |
| Portes | **Temporelles** : un seul modèle, paramétré par l'année, la teinte de l'époque et la plaque, avec une séquence d'ouverture. |
| Salles | **Une par terminal du catalogue**. Il y en a trois pour commencer : Téléviseur 1950, Minitel 1, Terminatel 255. |
| Ambiances | Salon des années 50 ; bureau des années 80 ; pour le Terminatel, la DA actuelle (marbre noir, laiton, lumière ambrée). |
| Date du Terminatel | Le compteur de sa porte affiche **« 198? »**, faute de source publique. |
| Ambiance générale | Rétro mystérieux, années 1920 à 1960 : bois sombre, laiton, cuir, verre, vieux papier, mécanique, lumière chaude. |

## 2. Parcours visé

1. Le visiteur arrive à l'entrée du couloir (voir les questions ouvertes, §13).
2. Il avance de poste en poste. Les portes sont rangées dans l'ordre chronologique : 1950, 1982, puis 198?.
3. Devant une porte, il voit le compteur, la plaque et la lumière de l'époque, puis il active la porte.
4. La séquence temporelle se joue (§5), suivie d'un travelling à travers la porte.
5. Il arrive à l'entrée de la salle, puis va au poste d'inspection devant le terminal. Là, il retrouve **l'expérience actuelle** : orbite, vues, 3615, yeux de Lemegeton, réglages, mobilier.
6. La porte de sortie de la salle le ramène au couloir, avec la séquence jouée à l'envers.

Les cartes d'inventaire servent de raccourci : elles mènent directement à une salle,
avec un fondu.

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
atelier/index.html + src/atelier/   3e entrée Vite : une brique seule (§9)
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

- `?salle=<id>&poste=<id>` décrit l'endroit. Sans paramètre, on arrive à l'entrée du couloir, sous réserve de la question 1 du §13.
- Chaque **arrivée** à un poste fait un `history.pushState`. `popstate` rejoue un trajet si la cible est voisine, sinon il fait un fondu.
- Les réglages (`ecran`, `couleur`, `yeux`, `rendu`, `taille`, `table`, `vue`) restent en `replaceState` : ils ne créent pas d'entrée d'historique.
- Compatibilité : `?modele=<id>` est réécrit en `?salle=<id>&poste=terminal` (`replaceState`). Le mode `?capture=1&transparent=1` de `tools/capture_views.mjs` reste un terminal seul, hors du monde.

## 5. Porte temporelle

Une seule porte est modélisée. Elle a un pivot de charnière à l'origine du battant
et une poignée séparée, et elle porte trois éléments animables :
- un **compteur à rouleaux**, de quatre rouleaux. C'est une texture canvas, en chiffres IBM Plex Mono. Le dernier rouleau sait afficher `?` ;
- une **horloge** dont les aiguilles sont des objets séparés ;
- une **lumière** d'entrebâillement : un `rectAreaLight` ou un plan émissif, dans la teinte de l'époque.

La séquence d'ouverture dure environ 3 s, sans compter le travelling.
`sequence.ts` la décrit comme une fonction pure : `t → état`.

| t (s) | Événement |
| --- | --- |
| 0,0 | La poignée tourne ; un tic-tac démarre. |
| 0,2 → 1,4 | Le compteur roule de l'année du couloir (« 19?? ») jusqu'à l'année cible. Le tic-tac accélère. |
| 0,6 → 1,6 | Les aiguilles de l'horloge s'emballent. |
| 1,2 → 2,0 | La lumière de l'époque filtre et monte en intensité. |
| 1,6 → 3,0 | Le battant s'ouvre (`openAngle`) ; un souffle se fait entendre. |
| 3,0 → | Passage : travelling au travers et effet temporel (§7), puis arrivée à `salle:<id>:entree`. |

Au retour, la même séquence se joue à l'envers depuis la porte de sortie de la
salle. En mouvement réduit, le compteur affiche directement l'année cible, puis un
fondu de 0,4 s mène à la salle.

## 6. Salles

| Salle | Terminal (catalogue) | Porte | Ambiance | Mobilier |
| --- | --- | --- | --- | --- |
| `televiseur-1950` | Téléviseur 1950 (Huuxloc, CC BY 4.0) | 1950 | salon des années 50 | au sol (`onTable: false`) ou meuble télé à trouver |
| `minitel-1` | Minitel 1 (okotaru, CC BY 4.0) | 1982 | bureau des années 80 | tables actuelles (brandon_grey, CC BY 4.0) |
| `terminatel-255` | Terminatel 255 (finition marbre procédurale) | 198? | DA actuelle : marbre noir, laiton, lumière ambrée | tables actuelles |

- La salle `terminatel-255` reprend la scène actuelle **sans régression** : même terminal, mêmes réglages et même mobilier. Elle gagne des murs de marbre (`src/demo/marble.ts`) et une porte de sortie.
- Le panneau 3615, les yeux et les réglages ne s'affichent qu'au poste `terminal`. Voir la question 4 du §13.

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
| [App.tsx](../src/App.tsx) (742 lignes) | L'URL est lue à plusieurs endroits et écrite en `replaceState` ([:152](../src/App.tsx#L152), [:229](../src/App.tsx#L229), [:238](../src/App.tsx#L238)). | **Avant le monde**, il faut extraire l'état d'URL dans un hook (`replace` pour les réglages, `push` pour les postes), et placer l'état du monde dans `useWorld`. App.tsx ne doit pas grossir. |
| [App.tsx:212](../src/App.tsx#L212) | `?modele=` choisit le terminal. | Il faut le réécrire en `?salle=` (§4). |
| [ModelInventory.tsx:30](../src/components/ModelInventory.tsx#L30) | L'inventaire est un `radiogroup` qui choisit un modèle. | Il devient une navigation : des boutons « Aller à la salle … » avec `aria-current`. Le style CSS 3D est conservé. |
| [Table.tsx:30](../src/scene/Table.tsx#L30) | Le mobilier est préchargé au chargement du module. Le cache de `useGLTF` ne se vide jamais. | Il faut charger à la demande la salle courante et ses voisines, puis appeler `useGLTF.clear` et libérer les textures à plus d'un saut. |
| [catalog.ts:29](../src/demo/catalog.ts#L29) | `onTable` place le terminal sur une table ou au sol. | La disposition de la salle part de là (§6). |
| [deploy-ovh.yml:46-52](../.github/workflows/deploy-ovh.yml) | Le déploiement vérifie certains fichiers précis et **refuse tout `.webp`** dans `dist/`. | Il faudra ajouter les GLB du monde à la liste vérifiée. Les textures doivent rester **dans** les GLB (KTX2 ou JPEG/PNG). Si on publie un jour un `.webp` autonome, il faudra cibler la règle sur les photos de référence uniquement. |
| [tests/browser/app.spec.ts](../tests/browser/app.spec.ts) | Les 22 tests supposent qu'on arrive directement devant le terminal (`expectScreenCentered`). | Ils devront ouvrir `?salle=…&poste=terminal`, ou garder ce point d'entrée si la question 1 est tranchée en ce sens. |
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
- 30 images/s ou plus sur un mobile de milieu de gamme, à confirmer (question 5 du §13) ;
- rendu à la demande à l'arrêt.

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
| Porte et poignée | B | **Blender, fait maison** (pivots, compteur et horloge intégrés) |
| Horloge de porte | B | Blender, fait maison (aiguilles animables) |
| Mur, sol, moulure, applique | C | kit Blender + matériaux ambientCG / Poly Haven (CC0) |
| Bureau, chaise, lampe, machine à écrire | E | Poly Haven (CC0), sinon Sketchfab CC BY |

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
  - le repli sans WebGL.
- **Non-régression** : les 22 tests actuels restent verts au poste `terminal` de chaque salle.
- **Captures** dans `docs/verification/`, une par poste.
- **Budgets** : `tools/budget_glb.py`, plus le panneau d'inspection (appels de rendu, triangles) à chaque poste.

## 12. Lots

Chaque lot fait l'objet d'une PR et se déploie sans casser l'existant.

| Lot | Contenu | Critères d'acceptation |
| --- | --- | --- |
| **A. Préparation** (aucun changement visible) | hook d'URL extrait d'App.tsx ; Lighting en presets (`terminatel` = actuel) ; `far` paramétrable ; lampe et écran suspendus hors scène ; `src/world/` (types, rails, navigation, sequence, url, rooms) avec tests ; entrée Vite `atelier/` vide ; chaîne KTX2/meshopt dans `tools/` | 22/22 tests navigateur inchangés ; nouveaux tests unitaires verts ; build et déploiement OK |
| **B. Porte temporelle** | modèle Blender (pivot, poignée, horloge), compteur canvas, lumière, sons, séquence ; atelier `?brique=porte` | séquence conforme au §5, aller et retour ; mouvement réduit ; captures ; budget de la porte respecté |
| **C. Couloir** | kit Blender, assemblage par données, trois emplacements de portes chronologiques, postes, preset `couloir` ; atelier `?brique=couloir` | trajet entre tous les postes ; budget « première vue » respecté |
| **D. Rails et navigation** | `RailCamera`, points d'intérêt DOM, parallaxe, clavier, toucher, URL et historique, fondus ; salles provisoires (boîtes) | parcours complet au clavier ; Retour du navigateur ; `?salle=` et `?poste=` |
| **E. Salles** | `terminatel-255` (scène actuelle dans une pièce), puis `minitel-1` (bureau 80s), puis `televiseur-1950` (salon 50s) ; poste `inspect` = caméra actuelle | non-régression au poste `terminal` ; budget « salle » respecté ; ambiances conformes à la DA |
| **F. Intégration** | page d'arrivée, inventaire en raccourci, compatibilité `?modele=`, docs (USAGE, ASSETS, ATTRIBUTION), contrôle du déploiement, page Documentation | parcours en ligne vérifié ; aucune erreur console ; crédits complets |
| **G. Objets interactifs** (plus tard) | horloge de jeu, machine à écrire, téléphone, radio, objets mystérieux | à cadrer au moment venu |

## 13. Questions ouvertes

Chaque question a une recommandation. À trancher avant le lot indiqué.

1. **Page d'arrivée sans paramètre** (avant F) : l'entrée du couloir (recommandé), ou directement la salle Terminatel avec la porte de sortie visible ?
2. **Son** (avant B) : coupé par défaut, avec un bouton (recommandé : les navigateurs bloquent de toute façon la lecture automatique), ou activé au premier clic ?
3. **Porte et horloge** (avant B) : faites maison dans Blender (recommandé, pour maîtriser pivots, compteur et licences), ou adaptées d'un modèle CC0 ?
4. **Panneau 3615, yeux et réglages** (avant E) : seulement au poste `terminal` (recommandé), ou dans toute la salle ?
5. **Mobile de référence** pour les budgets (avant C) : quel appareil, ou quelle classe d'appareil ?

## 14. Risques

| Risque | Parade |
| --- | --- |
| Poids cumulé des salles | Chargement à la demande, voisines seulement ; KTX2 et meshopt ; budgets vérifiés à chaque lot |
| Régression de l'expérience actuelle | Lot A sans changement visible ; poste `terminal` identique ; 22 tests conservés |
| App.tsx devient ingérable | État d'URL et du monde extraits avant d'ajouter quoi que ce soit (lot A) |
| Licence d'un asset mal vérifiée | Règles de [ASSETS.md](ASSETS.md#monde-explorable--sources-et-règles) ; provenance obligatoire ; NC, ND et « Royalty Free » refusés |
| Mal des transports pendant les trajets | Durées courtes, accélération douce, parallaxe faible, fondus en mouvement réduit |
| Accessibilité d'une navigation 3D | Points d'intérêt en DOM, clavier complet, annonces `aria-live`, repli sans WebGL |
