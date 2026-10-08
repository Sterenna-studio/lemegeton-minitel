# Assets

## Asset principal attendu

Le format de référence pour le Web est **GLB/GLTF**.

Le projet peut exploiter temporairement un modèle de remplacement en attendant un asset définitif.

## Assets retenus

L'application propose trois entrées (`src/demo/catalog.ts`), construites sur deux modèles.

### Minitel 1982-France

| Champ | Valeur |
| --- | --- |
| Titre | Minitel 1982-France |
| Auteur | okotaru (https://sketchfab.com/loaferspore) |
| Source | https://sketchfab.com/3d-models/minitel-1982-france-864f54ce4e1f41abab0688b88a45babf |
| Licence | CC BY 4.0 : usage commercial et redistribution autorisés, crédit obligatoire |
| Fichier | `public/models/minitel.glb` (0,86 Mo compressé ; 3,6 Mo avant compression) |
| Modifications | rotation, échelle, origine au sol, écran extrait en `Minitel_Screen` |
| Attribution | `public/models/ATTRIBUTION.md`, à distribuer avec le modèle |

Licence et auteur vérifiés via l'API Sketchfab ; ils figurent aussi dans
`asset.extras` du GLB d'origine. Le crédit est affiché dans l'interface et
dans le README.

Les polices IBM Plex Sans et Mono (paquets `@fontsource`) sont sous licence
SIL OFL 1.1 ; leurs licences sont copiées dans `public/licenses/`. Le GLB d'origine (`lemegeton/06_MODEL/`) et ses textures sont présents
localement mais pas versionnés.

Ce modèle sert deux entrées : « Minitel 1 », avec ses textures d'origine, et
« Terminatel 255 », une finition marbre noir appliquée au rendu. La géométrie
reste celle d'un Minitel 1 : c'est une interprétation de la finition, pas une
reproduction du Terminatel.

### 1950's Retro Television

| Champ | Valeur |
| --- | --- |
| Titre | 1950's Retro Television |
| Auteur | Huuxloc (https://sketchfab.com/rjh41) |
| Source | https://sketchfab.com/3d-models/1950s-retro-television-640b18f7fcbb489eb47bda1927e5b653 |
| Licence | CC BY 4.0 (dans `asset.extras` du GLB d'origine) |
| Fichier | `public/models/television-1950.glb` (0,32 Mo compressé ; 1,6 Mo avant ; 5 meshes, textures 1k) |
| Modifications | échelle (2,4 unités de haut), origine au sol, noms de meshes, écran `Minitel_Screen` avec UV planes (`tools/prepare_television.py`) |

### Mobilier : Wood Drawer & Tables Set

| Champ | Valeur |
| --- | --- |
| Titre | Wood Drawer & Tables Set |
| Auteur | brandon_grey (https://sketchfab.com/brandondmc10) |
| Source | https://sketchfab.com/3d-models/wood-drawer-tables-set-958db224ef514b2eabd69ac0a4e59ca0 |
| Licence | CC BY 4.0 (dans `asset.extras` du GLB d'origine) |
| Fichiers | `public/models/mobilier/*.glb` : quatre pièces de 237 à 298 Ko chacune une fois compressées (286 à 367 Ko avant), contre 10,4 Mo pour le lot |
| Modifications | pièces exportées séparément, centrées, mises à 8 unités par mètre, textures en JPEG (`tools/prepare_table.py`, mesures dans `docs/asset-audit/mobilier.json`) |

Le Minitel et le Terminatel sont posés sur la pièce choisie (Réglages CRT > Mobilier,
ou `?table=`) : table à tiroir (par défaut), chevet haut, meuble à niche, table basse,
ou sans table. Le téléviseur, meuble sur pieds, reste au sol. Le lot d'origine est gardé en local dans `lemegeton/06_MODEL/`.

## Direction artistique Terminatel 255

Les photos de `docs/Minitel Telic Alactel Terminatel 255 …/` proviennent d'une
annonce eBay (noms `s-l500` / `s-l1600`). Leurs droits appartiennent au
vendeur : elles servent de référence locale et **ne sont ni versionnées ni
publiées**, car `.gitignore` les exclut. Seuls le README et l'inventaire CSV du
dossier sont versionnés. Les deux marbres, celui de la page et celui du modèle,
sont générés par `src/demo/marble.ts` à partir d'une graine. Aucune photo
n'entre dans le rendu.

## Modèles écartés

| Modèle (`lemegeton/06_MODEL`, `02_SOURCES_3D`) | Raison |
| --- | --- |
| Minitel – TELTEL, bsavinien (CGTrader), soit `Table+-+Minitel.*` et `Minitel - TELETEL/` | « Royalty Free License (no AI) ». L'article 21A.6 interdit la redistribution. L'article 21A.3 impose, dans une application, d'empêcher l'accès au fichier du modèle. Un GLB servi sur un site public, ou versionné dans un dépôt public, ne respecte pas ces conditions. |
| Cyber Djinn, dark_igorek (CC BY 4.0) | 104 Mo et 200 000 triangles ; style cyberpunk contraire au cadrage |
| `white_mesh.glb` | ni auteur, ni licence, ni provenance |
| Robot Lemegeton (Meshy, `Rusty Retrobot.glb`) | 30 Mo et 1,35 million de triangles ; rig non validé ; conditions Meshy à confirmer |
| Cults : Minitel 1 NFZ 300 | piste de recherche, non téléchargée |

## Organisation

```
public/
  models/
    minitel.glb
  textures/
```

## Contraintes

Le modèle doit idéalement fournir :

- une géométrie propre ;
- des matériaux séparés lorsque cela aide le rendu ;
- une surface d'écran identifiable ;
- des pivots cohérents ;
- des dimensions et orientations stables ;
- des noms d'objets explicites.

## Licences

Tout modèle tiers doit conserver sa licence et sa provenance dans la documentation du dépôt.

Ne pas intégrer automatiquement un asset tiers dans une distribution finale sans vérifier ses conditions d'utilisation.

## Compression (8 octobre 2026)

Tous les modèles publiés sont compressés par `tools/optimize_glb.mjs` : textures en
KTX2 (Basis Universal), géométrie meshopt. L'application les lit grâce à
`src/scene/loaders.ts` (`useModel`, `KTX2Loader` et transcodeur Basis servi dans
`basis/`).

| Modèle | Avant | Après | Textures GPU (estimation) |
| --- | --- | --- | --- |
| `minitel.glb` | 3,6 Mo | 0,86 Mo | ~24 → 6 Mo |
| `television-1950.glb` | 1,6 Mo | 0,32 Mo | ~12 → 2 Mo |
| `mobilier/*.glb` | 0,29 à 0,37 Mo | 0,24 à 0,30 Mo | ~17 → 2 Mo chacun |

Le rendu a été comparé avant et après sur les trois terminaux, y compris en vue
rapprochée : aucune différence visible. Les `tools/prepare_*.py` produisent des
GLB non compressés. **Après chaque préparation, relancer la compression** :

```bash
node tools/optimize_glb.mjs public/models/minitel.glb public/models/minitel.glb
```

Piège corrigé pendant ce travail : par défaut, `prune` de glTF Transform supprime
les UV des meshes dont le matériau n'a pas de texture. C'est le cas des écrans,
dessinés par un shader, qui apparaissaient alors vides. Le script garde désormais
tous les attributs (`keepAttributes`).

## Préparation Web

Avant intégration :

1. vérifier l'échelle ;
2. vérifier les normales ;
3. réduire les données inutiles ;
4. optimiser textures et matériaux ;
5. identifier l'écran ;
6. définir les anchors utiles ;
7. exporter en GLB/GLTF ;
8. tester dans la scène Web.

Voir `MODEL_PREPARATION.md`.

## Monde explorable : sources et règles

Ces règles s'appliquent aux assets du couloir, des portes et des salles. Le cadrage
est dans [MONDE_EXPLORABLE.md](MONDE_EXPLORABLE.md). Le dépôt est **public** :
tout fichier sous `public/` est redistribué, à la fois par le site et par le dépôt.

### Licences acceptées et refusées

| Licence | Statut | Condition |
| --- | --- | --- |
| CC0 | acceptée | aucune ; on crédite quand même la source dans `ATTRIBUTION.md` (traçabilité) |
| CC BY 3.0 / 4.0 | acceptée | crédit dans `public/models/ATTRIBUTION.md` et sur la page |
| CC BY-SA | au cas par cas | l'asset modifié reste sous BY-SA ; on le signale dans `ATTRIBUTION.md` |
| CC BY-NC, BY-ND et leurs variantes | **refusée** | usage commercial ou modification interdits |
| « Royalty Free », Standard, Editorial (boutiques) | **refusée** | interdisent en général la redistribution du fichier (précédent : TELTEL de CGTrader) |
| Sans licence ou sans auteur identifiable | **refusée** | précédent : `white_mesh.glb` |

### Sources vérifiées le 7 octobre 2026

| Source | Licence constatée | Usage dans ce dépôt |
| --- | --- | --- |
| [Poly Haven](https://polyhaven.com/license) | CC0 (modèles, textures, HDRI), redistribution autorisée | source principale : mobilier, objets, HDRI |
| [ambientCG](https://docs.ambientcg.com/license/) | CC0 1.0 | source principale : matériaux PBR (bois, plâtre, laiton, tapis) |
| [Sketchfab](https://sketchfab.com/) | variable, **modèle par modèle** | seulement les modèles CC0 / CC BY ; licence et auteur relevés via l'API, comme pour okotaru |
| [Kenney](https://kenney.nl/assets), [Quaternius](https://quaternius.com/) | CC0 | possible, mais leur style s'accorde mal à la DA |
| [OpenGameArt](https://opengameart.org/), [itch.io](https://itch.io/game-assets/free) | variable | au cas par cas, selon la licence de chaque pack |
| [Freesound](https://freesound.org/) | variable par son (CC0, CC BY, CC BY-NC) | filtrer sur CC0 et CC BY ; BY-NC refusé |
| [Sonniss GDC Bundle](https://sonniss.com/gdc-bundle-license/) | libre de droits, sans crédit ; **interdit de distribuer les sons en tant que sons** et d'entraîner une IA | **ne pas versionner dans ce dépôt public**, car un fichier dans `public/` serait redistribué brut. N'est utilisable que si les sons restent hors du dépôt. |

### Visuels générés

Les portraits, documents, cartes et affiches générés pour l'univers suivent les
règles de [DIRECTION_ARTISTIQUE.md](DIRECTION_ARTISTIQUE.md#visuels-2d-générés).
En résumé :
- pas de personne réelle, de marque, ni de document officiel imité ;
- provenance consignée dans `docs/asset-audit/visuels.json` ;
- conditions de l'outil employé vérifiées.

### Chaîne de préparation

1. Relever la licence, l'auteur, l'URL source et la date de téléchargement.
2. Préparer l'asset avec un script `tools/prepare_*.py` : échelle (1 m = 8 unités), origine, pivots, noms. Puis le compresser avec `node tools/optimize_glb.mjs <entrée> <sortie.glb> [--max 1024] [--secondary 512] [--drop a,b]` : textures redimensionnées puis converties en KTX2 (ETC1S pour la couleur, UASTC pour les normales), géométrie meshopt. L'application doit alors charger `KTX2Loader` et le décodeur meshopt (lot B).
3. Écrire un rapport dans `docs/asset-audit/` (mesures, comme `mobilier.json`).
4. Contrôler le budget avec `python tools/budget_glb.py public/models/<fichier>.glb`, au regard des cibles de [MONDE_EXPLORABLE.md](MONDE_EXPLORABLE.md#8-budgets).
5. Ajouter une ligne à ce document et le crédit dans `public/models/ATTRIBUTION.md`.
6. Ajouter le GLB à la liste vérifiée par `.github/workflows/deploy-ovh.yml`.

### Sources locales

Les sources lourdes restent locales et hors Git, comme le pipeline `lemegeton/`.
Cela concerne les `.blend`, les téléchargements bruts, les textures 4K et les sons
sources. Elles vivent dans le dossier `monde/` à la racine, créé le 7 octobre 2026. Une liste
blanche dans `.gitignore` n'y versionne que les formats texte (`.md`, `.csv`, `.py`).
La provenance de chaque fichier est dans [monde/SOURCES.csv](../monde/SOURCES.csv) :

```text
monde/
  00_CORE/        porte temporelle, poignée, horloge, compteur, effet temporel
  01_CORRIDOR/    kit : murs, sol, plafond, moulures, appliques
  02_FURNITURE/   bureaux, chaises, meubles, étagères, tables
  03_VINTAGE/     machine à écrire, téléphone, radio, projecteur, horloges
  04_PROPS/       livres, papiers, bouteilles, lampes, boîtes
  05_TEXTURES/    bois, plâtre, métal, tapis, papier peint
  06_STORY/       lettres, photos, cartes, journaux, documents (générés)
  07_AUDIO/       portes, horloges, ambiances, machines, pas
  SOURCES.csv     fichier, source, auteur, licence, URL, date (versionné)
```
