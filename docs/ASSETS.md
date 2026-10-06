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
| Fichier | `public/models/minitel.glb` (3,6 Mo) |
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
| Fichier | `public/models/television-1950.glb` (1,6 Mo, 5 meshes, textures 1k) |
| Modifications | échelle (2,4 unités de haut), origine au sol, noms de meshes, écran `Minitel_Screen` avec UV planes (`tools/prepare_television.py`) |

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
