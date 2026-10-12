# Lemegéton Minitel

Un Minitel 3D pour le Web : terminal manipulable, simulation Vidéotex, yeux du
robot Lemegéton, et un monde à explorer où chaque terminal a sa salle d'époque.

En ligne : https://sterenna.fr/minitel/

## Vision

Construire un Minitel 3D réutilisable dans des sites Web, avec un écran
indépendant capable d'afficher une expérience Vidéotex dynamique, et autour de
lui un univers à parcourir.

Ce n'est pas un projet d'électronique : le Minitel physique, l'ESP32 et le
serveur de visage restent dans
[minitel-face](https://github.com/Sterenna-studio/minitel-face). Le personnage
Lemegéton (modélisation, rigs, animation) a son propre dépôt :
[Sterenna-studio/lemegeton](https://github.com/Sterenna-studio/lemegeton).

## Deux modes

- **Version simple** (par défaut, `/minitel/`) : un terminal sur sa table, à
  faire tourner, zoomer et inspecter ; l'inventaire pour changer de terminal
  (Terminatel 255, Minitel 1, téléviseur 1950) et de mobilier ; le 3615
  Lemegéton, les yeux, les effets CRT. Un double-clic sur l'écran fait la mise
  au point, un second revient.
- **Mode 3D+** (bouton de l'en-tête, `/minitel/?mode=3d`) : un couloir hors du
  temps, parcouru sur rails. Une porte temporelle par terminal, dans l'ordre
  chronologique, ouvre sur une salle d'époque (salon 1950, bureau 1982, salle de
  marbre du Terminatel) ; devant le terminal, on retrouve le 3615, les yeux et
  les réglages. Trois portes fermées attendent les salles à venir. **Mode simple**
  revient, sur le terminal de la salle quittée.

Chaque poste du monde a son adresse (`&salle=`, `&poste=`) et le bouton Retour
du navigateur remonte le chemin. Le clavier suffit partout (flèches, `Échap`),
une lecture textuelle remplace la 3D sans WebGL, et le mouvement réduit
remplace les trajets par des fondus.

Autres pages : `/minitel/documentation/` (fiche de chaque terminal et du mode
3D+), `/minitel/atelier/` (chaque brique du monde vue seule),
`/minitel/parcours/` (le monde seul, aperçu de développement).

## Démarrer

Node 22.12+ ou 24.

```bash
npm ci
npm run dev          # http://127.0.0.1:5174
npm run build        # contrôle des types puis bundle dans dist/
```

## Vérifier

```bash
npm run typecheck
npm run lint
npm test               # Vitest : 63 tests unitaires
npm run test:browser   # Playwright : 32 tests sur ordinateur et mobile (Edge headless)
```

## En ligne

https://sterenna.fr/minitel/ est publié par
[`.github/workflows/deploy-ovh.yml`](.github/workflows/deploy-ovh.yml) à chaque
push sur `main` (ou manuellement via *Run workflow*) :
1. contrôles, puis `npm run build:ovh` (base `/minitel/`) ;
2. validation du build : modèles, transcodeur Basis, pages, le monde dans un
   chunk à part, aucune photo de référence ;
3. `rsync --delete` de `dist/` vers `~/www/minitel/` sur OVH ;
4. test de fumée : page, modèles, porte, texture KTX2, transcodeur, crédits.

- Secrets : `OVH_SSH_KEY`, `OVH_HOST`, `OVH_USER`, au niveau de l'organisation.
  Sur le plan GitHub Free, ils ne sont transmis qu'aux dépôts **publics** :
  rendre ce dépôt privé casserait le déploiement.
- sterenna.fr est déployé dans la même racine par `MutenRock/sterenna`, en
  `rsync --delete` : son workflow exclut `/minitel/`, ne pas retirer cette exclusion.
- Le site est derrière Cloudflare : une règle met en cache `/minitel/models/` et
  `/minitel/basis/`. Les fichiers de `public/` sont appelés avec une empreinte
  (`?v=…`, `src/assets.ts`) : un fichier remplacé change d'adresse, aucune purge
  n'est nécessaire. `public/.htaccess` déclare les types (GLB, KTX2, wasm) et un
  cache d'un an.

Pour vérifier localement le build de production :

```bash
npm run build:ovh
npm run preview -- --base=/minitel/   # http://127.0.0.1:4173/minitel/
```

## Architecture

```text
index.html, simple/, parcours/, atelier/, documentation/   entrées Vite des cinq pages

src/
  main.tsx, SiteModes.tsx, siteMode.ts   version simple ou mode 3D+ (monde chargé à la demande)
  App.tsx        version simple : le terminal sur sa table, inventaire, réglages
  assets.ts      adresses versionnées des fichiers de public/
  minitel/       composant Minitel : modèle, écran dynamique, bombé du tube, profils, anchors (index.ts)
  videotex/      grille 40 × 25, palette, mosaïques G1, rendu Canvas, contrôleur Terminal
  demo/          pages 3615 Lemegéton, catalogue des terminaux, marbre procédural
  eyes/          yeux de Lemegéton : Zyra, LibEyes, Lemegeton (firmware), rendu lisse, contrôleur
  terminal/      expérience du terminal (3615, yeux, effets) et ses panneaux
  scene/         scène de la version simple : caméra orbitale, éclairages, table, chargeurs KTX2/meshopt
  components/    lecture accessible, cartes d'inventaire, bouton
  hooks/         paramètres d'URL, mouvement réduit, abonnement au terminal
  world/         mode 3D+ : salles et portes dérivées du catalogue, rails, navigation,
                 séquence des portes, adresse (logique pure et testée), crédits, grain
    three/       rendu : couloir, porte temporelle, horloges, caméras, salles
      rooms/     salles construites en code : RoomShell, Salon1950, Bureau1982, TerminatelHall
  atelier/, documentation/   pages atelier et documentation

public/
  models/        modèles compressés (KTX2 + meshopt) : terminaux, mobilier, monde/ (porte,
                 horloges, textures) ; ATTRIBUTION.md
  inventaire/, documentation/, licenses/, .htaccess

tests/           Vitest (tests/*.test.ts) et Playwright (tests/browser/)
tools/           préparation des modèles (prepare_*), compression (optimize_glb, encode_textures),
                 budget, captures, vérification de production, règle de cache Cloudflare
docs/            guide, assets et licences, monde explorable, direction artistique, vérification
sources/         sources des modèles (local, hors Git ; voir sources/README.md)
monde/           sources du monde explorable (local, hors Git ; provenance dans SOURCES.csv)
```

Documentation :
- [Guide d'utilisation et d'intégration](docs/USAGE.md) : réutiliser `<Minitel>`, sources d'écran, pages Vidéotex, yeux, accessoires.
- [Monde explorable](docs/MONDE_EXPLORABLE.md) ([issue #8](https://github.com/Sterenna-studio/lemegeton-minitel/issues/8)) : décisions, architecture, rails, portes, salles, budgets (iPhone 11), lots A à F faits ; le lot G (objets interactifs) reste à cadrer. [Direction artistique](docs/DIRECTION_ARTISTIQUE.md).
- [Assets et licences](docs/ASSETS.md), [préparation des modèles](docs/MODEL_PREPARATION.md).
- [Vérification](docs/VERIFICATION.md), [notes d'implémentation](docs/IMPLEMENTATION.md), [cadrage](docs/3D_WEB_PROJECT.md), [audit du 6 octobre 2026](docs/AUDIT_2026-10-06.md).

La page `/documentation/` reprend les fiches des terminaux. Ses vues sont des
captures du terminal 3D lui-même ; pour les régénérer, lancer `npm run dev` puis
`node tools/capture_views.mjs http://127.0.0.1:5174`. Les photos de référence du
Terminatel (annonce eBay) ne s'affichent qu'en local ; le build n'en contient
aucune, et le workflow le vérifie.

## Personnage Lemegéton

Le pipeline 3D du robot (références, sources, rigs, scènes Blender, exports,
audits) a quitté ce dépôt le 12 octobre 2026 pour
[Sterenna-studio/lemegeton](https://github.com/Sterenna-studio/lemegeton), avec
son historique. Copie de travail locale : `C:\DEV\repos\lemegeton`. Quand le
personnage aura un export Web, il viendra ici comme les autres modèles :
préparé dans `public/models/` par un script `tools/prepare_*`.

## État

- **Version simple** : les critères du [cadrage](docs/3D_WEB_PROJECT.md) sont
  atteints (terminal manipulable, écran dynamique indépendant, 3615 Lemegéton,
  page responsive, modèle remplaçable par profil, touches 3D cliquables,
  accessoires par anchors), avec trois terminaux et quatre meubles.
- **Mode 3D+** : couloir, portes temporelles, trois salles d'époque, portes
  fermées pour la suite, cartes d'inventaire vers les salles, crédits à l'écran ;
  cadrage adapté aux téléphones tenus droit.
- **Yeux de Lemegéton** (Réglages CRT > Écran, ou `?ecran=yeux`) : en mosaïque
  Vidéotex ou en rendu lisse, repris de l'overlay OBS de nitro-clicker, des
  librairies de minitel-face et du firmware `Minitel_Sigil`. Ils clignent,
  regardent, réagissent, suivent légèrement la souris, et les touches Minitel
  changent leur humeur. Voir le [guide](docs/USAGE.md#yeux-de-lemegeton-ecran-videotex).

Restent ouverts :
- l'essai sur un vrai iPhone 11 ;
- les tests du lot F ;
- le lot G (objets interactifs), à cadrer ;
- la validation artistique, l'optimisation du chargement (bundle d'environ 1,2 Mo)
  et l'émulation protocolaire Vidéotex (décodeur VDT) ;
- **une icône pour le site** : les cinq pages déclarent aujourd'hui une icône vide,
  `<link rel="icon" href="data:," />`, pour éviter une requête `favicon.ico` en
  erreur. Il faudra une vraie icône (SVG, et PNG 32 et 180 px pour iOS) dans
  `public/`, puis remplacer cette ligne dans les cinq fichiers.

## Crédits

Modèles 3D sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
adaptés :
- « Minitel 1982-France » par okotaru ;
- « 1950's Retro Television » par Huuxloc ;
- « Wood Drawer & Tables Set » par brandon_grey ;
- « Door_Wooden_Old » par Mehdi Shahsavan (porte temporelle provisoire).

Horloges et matières du monde : Poly Haven (CC0). Le décor des salles est
construit en code. Détail des sources et des modifications :
[ATTRIBUTION.md](public/models/ATTRIBUTION.md).

Polices IBM Plex sous licence SIL OFL 1.1 ([public/licenses/](public/licenses/)).
Animations des yeux d'après
[Web-Eye-Animation](https://github.com/CyberAgentAILab/web-eye-animation)
(CyberAgent AI Lab, licence MIT).
