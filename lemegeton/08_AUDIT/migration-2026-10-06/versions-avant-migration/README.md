# Lemegeton - projet 3D

## Reprise par un agent

Lire [PASSATION_AGENTS.md](PASSATION_AGENTS.md), [AGENTS.md](AGENTS.md) et
[l'audit global](08_AUDIT/AUDIT_GLOBAL.md). Les dernieres validations sont
referencees dans `08_AUDIT/LATEST_VALIDATION.json` ; la sauvegarde locale
verifiee est referencee dans `09_SAUVEGARDES/LATEST.json`.
Les scenes Blender non enregistrees en RAM ne sont pas incluses dans un ZIP.

## Organisation

- `01_REFERENCES/` : les 9 images de concept, fiches techniques et storyboard.
- `02_SOURCES_3D/` : les 6 modeles GLB d'origine et le rapport de preparation.
- `03_RIGS/` : les 4 packages de rig, conserves avec leurs ressources et scripts.
- [PIPELINE_TRAVAIL.md](PIPELINE_TRAVAIL.md) : ordre de travail, lancement Blender, controles et livrables a produire.
- [Export de la conversation](ChatGPT-Animer%20ce%20mod%C3%A8le-20261005-0242.md) : historique original des choix de design et iterations.
- `TRI_MANIFEST.csv` : anciens et nouveaux chemins des 51 fichiers, tailles et empreintes SHA-256.

Les noms des fichiers et le contenu des packages ont ete conserves.
Aucun fichier d'origine n'a ete supprime ou modifie lors du rangement du 5 octobre 2026.

## Point d'entree

### Minitel interactif pour le Web

La nouvelle application est dans [07_WEB_MINITEL](07_WEB_MINITEL/README.md).
Elle utilise une copie du vrai Minitel ajoute dans `06_MODEL`, avec ecran
Canvas/Videotex dynamique, pages 3615 LEMEGETON, clavier, camera et anchors.
Les sources 3D originales restent conservees ; ce composant est independant du rig du personnage.

```powershell
cd .\07_WEB_MINITEL
npm ci
npm run dev
```

URL locale : http://127.0.0.1:5174/. Voir les instructions de remplacement du
GLB et [preparation Blender](07_WEB_MINITEL/docs/MODEL_PREPARATION.md).

### Personnage et rig

La suite preparee dans Blender est decrite dans [AUDIT_ET_SUITE.md](AUDIT_ET_SUITE.md).
Ouvrir `04_BLENDER/LEMEGETON_03_PIECES_PROVISOIRES.blend` pour reprendre
la separation mecanique, ou `LEMEGETON_04_WAVE_PIECES_ETUDE.blend` pour le salut d'etude.
Les sources historiques restent dans `03_RIGS/` ; les nouvelles copies sont dans `04_BLENDER/`.

Pour reprendre le projet, suivre la [pipeline de travail](PIPELINE_TRAVAIL.md).
Apres redemarrage, suivre son **etape 0 : essai PartField sous Ubuntu WSL2**,
puis separation et reconstruction des pieces avant le rig et l'animation.
Le diagnostic materiel est favorable a un essai sur une copie simplifiee,
mais aucune inference PartField n'a encore ete executee. La video actuelle
reste une etude technique insatisfaisante, pas un livrable valide.

La [copie Blender V3 generee](04_BLENDER/00_BASE_V3/LEMEGETON_RIG_V3.blend)
est maintenant disponible. Son builder de travail corrige deux tailles de
bufferViews du GLB et un appel Python invalide du package original.
Generation et reouverture verifiees dans Blender 5.2.2 ; l'audit a ensuite
revele un rig V3 impropre a la production. Ne pas le regenerer pour reprendre.

La V3 est la version la plus recente presente dans ce dossier :

- [Documentation V3](03_RIGS/LEMEGETON_RIG_V3/README_RIG_V3.txt)
- [Script Blender V3](03_RIGS/LEMEGETON_RIG_V3/BLENDER_BUILD_RIG_V3.py)
- [Lanceur du viewer V3](03_RIGS/LEMEGETON_RIG_V3/WEB_VIEWER/START_VIEWER.bat)

Pour le viewer, lancer `START_VIEWER.bat` depuis l'Explorateur Windows.
Le lanceur utilise Python (`py`) et le port 8000 ; lancer un seul viewer a la fois.
Les viewers chargent Three.js depuis un CDN et necessitent un acces Internet.
Pour Blender, suivre la documentation du package correspondant.

La V3 reste une base de travail : sa documentation indique que la segmentation
du mesh et les pivots doivent encore etre valides. Le rangement ne constitue
pas une validation visuelle, une execution des scripts Blender ou un test des rigs.

## Versions conservees

| Package | Role |
| --- | --- |
| `LEMEGETON_RIG_PACKAGE` | Preparation initiale et rig V1 |
| `LEMEGETON_RIG_V2` | Deuxieme iteration |
| `LEMEGETON_RIG_V2_FIXED` | Correction du viewer et du GLB V2, selon README_FIX.txt |
| `LEMEGETON_RIG_V3` | Iteration la plus recente, avec preparation des controles Blender |

Chaque package reste autonome : ne pas deplacer ses GLB, scripts ou fichiers
`WEB_VIEWER` individuellement, car ils utilisent des chemins relatifs.

## Sources et doublons

La source nommee `LEMEGETON_MASTER_SOURCE.glb` est conservee dans `02_SOURCES_3D/`.
La comparaison SHA-256 a confirme deux paires strictement identiques :

- `LEMEGETON_MASTER_SOURCE.glb` et `meshy_1791091843390.glb`.
- `Rusty Retrobot.glb` et `meshy_1791124252050.glb`.

Ces copies sont conservees pour garder les noms et la provenance.
Les deux images nommees `Fiche technique du robot Minitel chibi` sont distinctes.

## Tracabilite

Le manifeste decrit uniquement les fichiers presents avant le rangement.
Le README et le manifeste lui-meme sont des ajouts de documentation.
Pour retrouver l'organisation precedente, utiliser la colonne `chemin_avant`
du manifeste ; tous les chemins sont relatifs a ce dossier.
