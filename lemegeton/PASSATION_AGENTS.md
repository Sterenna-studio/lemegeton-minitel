# Passation du projet Lemegeton / Minitel Web

> **Migration du 6 octobre 2026.** Ce dossier est maintenant `lemegeton/` dans le
> depot Git `Sterenna-studio/lemegeton-minitel` (public), et `07_WEB_MINITEL` en
> est la racine. Seuls les formats texte sont versionnes ; les binaires restent
> locaux. Publier passe par une PR ; le push sur `main` deploie
> https://sterenna.fr/minitel/. Voir `08_AUDIT/migration-2026-10-06/MIGRATION.md`.

Etat de reference : 6 octobre 2026. Lire aussi `AGENTS.md` et
[l'audit global](08_AUDIT/AUDIT_GLOBAL.md). Les preuves techniques les plus
recentes sont referencees dans `08_AUDIT/LATEST_VALIDATION.json`.

## Reprise rapide

Ce dossier contient **trois chantiers distincts** : personnage 3D, segmentation
PartField a essayer, composant Web Minitel deja fonctionnel. Choisir le chantier
avec l'utilisateur ; ne pas transformer un essai de rig en livrable final.
Aucun push, hebergement public, installation PartField ni entrainement realise.
Il n'y a pas de depot Git ici. Le contexte durable est dans ces fichiers,
pas dans la memoire implicite d'une conversation.

| Dossier | Role |
| --- | --- |
| `01_REFERENCES` | Concepts et brief graphique du personnage |
| `02_SOURCES_3D` | GLB originaux du personnage, dont Rusty Retrobot texture |
| `03_RIGS` | Packages V1/V2/V3 historiques conserves |
| `04_BLENDER` | Copies corrigees et ateliers, scenes retouchees et scripts |
| `05_EXPORTS` | Rapports, captures, sequence de 120 images, video et GLB d'etude |
| `06_MODEL` | Nouveaux assets Minitel/TV/Djinn/OBJ/Blender et white_mesh |
| `07_WEB_MINITEL` | Application TypeScript/React, GLB prepare, tests et documentation |
| `08_AUDIT` | Audit, historique des rapports, validations et scripts de sauvegarde |
| `09_SAUVEGARDES` | ZIP locaux verifies, manifestes et index LATEST.json |

## 1. Web Minitel

Depuis la racine, dans PowerShell :

```powershell
cd .\07_WEB_MINITEL
npm ci
npm run dev
```

URL : http://127.0.0.1:5174/. Le port est strict ; si occupe, identifier le
serveur avant de relancer. Ne pas arreter le serveur d'un autre projet.
En cas de changement de port pour les tests, adapter `playwright.config.ts`.
Node 24.19.0 et PowerShell 7.6.6 utilises pour cette passation.

Le GLB actif est `public/models/minitel.glb`, derive de
`06_MODEL/minitel_1982-france.glb` (okotaru / CC BY 4.0 indique dans le fichier).
71 meshes, 21 943 triangles, 3,64 Mo ; le CRT a ete extrait du cadre et a des UV
independantes. Le modele original et ses textures restent intacts.

Entrees de code :

- `src/minitel/index.ts` : API publique Minitel, attachments, profils et moteur.
- `src/minitel/MinitelModel.tsx` : clone d'instance, ecran/overlay, evenements et debug.
- `src/minitel/MinitelScreen.tsx` : Canvas/texture, shader de courbure et cycle de vie.
- `src/minitel/profiles.ts` : calibration des touches, ecran de secours et anchors.
- `src/videotex` : moteur generique 40 x 25, couleurs/mosaiques/curseur et controleur.
- `src/demo/LemegetonTerminal.ts` : six pages fictives, aucune authentification reelle.
- `src/components/AccessibleTerminal.tsx` : texte et actions DOM synchronises.
- `src/scene` : camera responsive, lumiere, contexte WebGL et fallback.

Lire [README Web](../docs/USAGE.md) et
[MODEL_PREPARATION](../docs/MODEL_PREPARATION.md) avant de changer
un asset. Le composant Minitel s'utilise dans un Canvas R3F ; fournir aussi le
contenu DOM accessible lors d'une integration dans un autre site.

`tools/prepare_model.py` est SPECIFIQUE a cette source, tourne de -110 degres
autour du Z Blender et normalise a 2,4 unites de presentation, pas a une taille
physique mesuree. Il remplace le GLB derive : ne pas l'executer sur une version
retouchee sans en conserver une copie. Les noms d'origine Object_28/Object_73
ne sont pas une convention universelle ; le profil runtime est configurable.

Validations a refaire apres changement : typecheck, lint, unitaires, build,
Playwright sur le serveur dev, puis `node tools/verify_production.mjs`.
Passation du 6 octobre : neuf controles passes, 6 tests unitaires, 12 tests
navigateur et deux scenarios production sans erreur console ; npm audit = 0.
Edge headless installe est utilise, pas de telephone physique. Captures dans
`07_WEB_MINITEL/docs/verification`. Vitest est maintenant en branche corrigee
4.1.11 ; respecter le lockfile et ne pas revenir a la 3.x initiale.

Limites connues : renderer visuel, pas decodeur VDT ; CRT plat avec effet
visuel ; aspect photographique gris ; bundle JS a optimiser ; branches medias
externes sans campagne de tests complete ; API d'integration non publiee comme
package. Ni WebSocket, serveur, sons, animations de touches ni WebXR implémentes.

Prochaine session conseillée : validation artistique avec l'utilisateur,
test sur un vrai mobile, puis adaptation d'un asset ameliore et de son profil.

## 2. Personnage Blender

Lire `AUDIT_ET_SUITE.md` et la branche personnage de `PIPELINE_TRAVAIL.md`.
Point de reprise sans partition : `04_BLENDER/LEMEGETON_02_ATELIER_V4.blend`.
Comparatif : `LEMEGETON_03_PIECES_PROVISOIRES.blend` (15 objets rigides).
Faire Save As pour les retouches ; ne pas ecraser l'audit manuel dans
`04_BLENDER/00_BASE_V3/LEMEGETON_01_AUDIT.blend` ni ses `.blend1`.

Le rig V3 historique avait des os superposes et une echelle incoherente.
Le builder corrige l'import (bufferViews et appel API), pas la qualite du rig.
L'atelier V4 replace 24 os et 28 controles, mais pivots, IK et decoupes restent
experimentaux. Les doigts n'ont pas de geometrie separee/ponderee : mains en blocs.
La source texturee Rusty forme une seule surface connectee, environ 1,35 million
de triangles ; By Loose Parts ne fournit pas des articulations mecaniques.

La video `LEMEGETON_WAVE_ETUDE.mp4` est **rejetee par l'utilisateur**. Les tests
structurels de rigidite, pieds fixes, bake et reimport glTF ne sont pas une
validation artistique. Garder l'etude comme preuve de diagnostic, pas comme
base d'animation a ameliorer avant la geometrie.

Ordre : selection/separation -> raccords internes -> doigts et pivots -> rig ->
salut 5 secondes -> export/rendu -> validation. Respecter le brief : chibi
Minitel, CRT eteint, 3 doigts + pouce, aucun cable tete-corps, camera fixe de
trois quarts et pieds immobiles. Le CRT actif du composant Web n'annule pas le
brief ecran OFF du premier salut du personnage.

## 3. PartField

Pas encore installe ni execute. Diagnostic du 5 octobre : SALOMON, Ryzen 7
5800H, RAM 32 Go, RTX 3070 Laptop 8 Go, Ubuntu WSL2 present et GPU accessible.
Reverifier apres redemarrage : `wsl -l -v`, `wsl -d Ubuntu -- nvidia-smi`.
Les ressources libres de l'ancien diagnostic sont des mesures ponctuelles.

Suivre l'etape 0 de la pipeline : environnement Linux isole, versions officielles
et modele preentraine ; exemple officiel puis copie simplifiee 50-100k triangles.
La cible de triangles est une estimation prudente, pas une limite officielle.
Mesurer RAM/VRAM et resultat avant de traiter le master. PartField ne construit
ni surfaces cachees ni pivots/rig ; corrections Blender indispensables.

## Nouvel asset a examiner

`06_MODEL/white_mesh.glb` ajoute apres le premier inventaire : 5 930 248 octets,
un mesh, 329 478 triangles, aucune image embarquee. Generateur trimesh, pas de
metadonnees d'auteur/licence. Origine, UV, silhouette et usage restent a valider.
Ne pas supposer qu'il remplace le personnage ou le Minitel actif ; demander
son origine et comparer avant integration/publication.

## Sauvegarde et reprise

Consulter `09_SAUVEGARDES/LATEST.json` pour le ZIP, sa SHA-256, le manifeste,
le nombre de fichiers et la verification de chaque entree decompressee.
Source/code/docs/scenes/exports sont inclus, caches et dependances reconstruisibles
exclus. Les modifications Blender encore en RAM ne peuvent pas etre sauvegardees
par cet archivage : enregistrer la scene manuellement avant une nouvelle capture.

```powershell
# PowerShell 7, depuis la racine :
pwsh -File .\08_AUDIT\verify_sources.ps1
pwsh -File .\08_AUDIT\validate.ps1
pwsh -File .\08_AUDIT\backup.ps1
pwsh -File .\08_AUDIT\backup.ps1 -VerifyOnly -Archive .\09_SAUVEGARDES\NOM_ARCHIVE.zip
```

Restaurer d'abord dans un dossier NEUF, comparer le manifeste et suivre le README.
Ne pas extraire par-dessus un travail actif. Conserver une copie sur un autre
support : le ZIP local ne protege pas d'une panne du disque C:.
