# Migration vers le dossier de travail unique — 6 octobre 2026

## Objet

Réunir dans le dépôt `Sterenna-studio/lemegeton-minitel` tout le contenu de
l'ancien dossier de travail `C:\Users\pierr\Downloads\lemegeton_3d`. Après la
migration, `C:\DEV\repos\lemegeton-minitel` est le seul dossier de travail du
projet.

| Ancien emplacement (`lemegeton_3d/`) | Nouvel emplacement (dépôt) |
| --- | --- |
| `01_REFERENCES/` … `06_MODEL/`, `08_AUDIT/`, `09_SAUVEGARDES/` | `lemegeton/` (même arborescence) |
| fichiers racine (`README.md`, `PIPELINE_TRAVAIL.md`, …) | `lemegeton/` |
| `07_WEB_MINITEL/` | racine du dépôt (son `README.md` est devenu `docs/USAGE.md`) |
| `07_WEB_MINITEL/*.log` (journaux du serveur de dev) | `lemegeton/08_AUDIT/migration-2026-10-06/web-minitel-dev/` |

## Méthode

Un script a parcouru la source et calculé le SHA-256 de chaque fichier. Il a
ensuite appliqué une règle par fichier :
- si le fichier est absent de la destination, il le copie en conservant les
  dates, puis relit la copie et compare son empreinte ; une seule différence
  arrête tout ;
- si un fichier existe déjà à la destination, il compare les empreintes et
  n'écrase jamais rien ; une différence est signalée comme conflit ;
- pour l'application, il compare chaque fichier à son équivalent à la racine
  du dépôt.

Rien n'a été supprimé ni modifié dans la source. Un essai à blanc a précédé la
copie réelle. Le détail fichier par fichier est dans [MANIFEST.csv](MANIFEST.csv)
(chemin source, taille, SHA-256, destination, statut), et les totaux dans
[SUMMARY.json](SUMMARY.json).

## Résultat

| Statut | Fichiers | Signification |
| --- | ---: | --- |
| `copied` | 450 | copiés, empreinte vérifiée après copie (5 540 196 317 octets) |
| `identical` | 62 | déjà présents dans le dépôt, empreinte identique |
| `conflict` | 1 | `README.md` : copie du dépôt = original + note d'en-tête ajoutée volontairement |
| `web_same` | 53 | fichiers de l'application identiques à la racine du dépôt |
| `web_adapted` | 11 | fichiers de l'application adaptés au dépôt (chemins, nom du paquet, sous-chemin `/minitel/`) |
| `web_log` | 2 | journaux du serveur de dev, copiés |
| `web_missing` | 0 | aucun fichier de l'application perdu |
| **Total** | **579** | 5 548 427 653 octets |

Fichiers adaptés : `.gitignore`, `README.md`, `package.json`, `package-lock.json`,
`src/App.tsx`, `docs/IMPLEMENTATION.md`, `docs/MODEL_PREPARATION.md`,
`docs/VERIFICATION.md`, `tools/audit_model.py`, `tools/prepare_model.py`,
`tools/inventory.mjs`. Leurs différences sont dans l'historique Git du dépôt.

Non repris, car reconstructibles : `07_WEB_MINITEL/node_modules` (16 196 fichiers,
349 Mo, `npm ci`), `07_WEB_MINITEL/dist` (`npm run build`), `test-results`,
`tsconfig.tsbuildinfo` et un `__pycache__` Python.

## Contrôles après migration

Tous les contrôles ont été exécutés depuis le nouvel emplacement.

- `08_AUDIT/verify_sources.ps1` : 51 sources historiques, aucune modification.
- `04_BLENDER/scripts/verify_workshop.py` : code 0, `WORKSHOP_VERIFIED`.
- `04_BLENDER/scripts/verify_export.py` : code 0, `EXPORT_ROUNDTRIP_VERIFIED`.
- `tools/prepare_model.py`, avec la source par défaut `lemegeton/06_MODEL/` : GLB
  régénéré identique à l'octet à `public/models/minitel.glb`.
- `tools/inventory.mjs` : 242 fichiers dans `06_MODEL`, rapport inchangé.
- Application : typecheck, lint, 6 tests unitaires, build et 12 tests navigateur,
  exécutés sur le dépôt avant la migration ; aucun fichier de l'application
  n'a changé pendant la copie.

### Références externes des scènes Blender

Chaque `.blend` copié a été ouvert dans Blender 5.2 en arrière-plan pour lister
ses chemins externes (`bpy.utils.blend_paths`).

- Les 7 scènes Lemegeton (`04_BLENDER/**`) n'ont aucune référence externe : leurs
  textures sont empaquetées. Elles sont portables.
- Trois modèles tiers de `06_MODEL` avaient déjà des liens cassés à l'origine.
  La migration ne les aggrave pas : leurs chemins relatifs sont conservés, et
  leurs chemins absolus visaient la machine de l'auteur.
  - `1950s-retro-television/source/Sketchfab_….blend` : un HDR sur `H:\Desktop2020\`.
  - `minitel-1982-france/source/old computer 上传.blend` : `//底部材质.jpg` absent
    à côté du fichier (présent dans `../textures/`), et 4 liens vers l'add-on
    Fluent de l'auteur.
  - `Table+-+Minitel.blend` : 62 liens vers un `//Bureau.blend` non fourni.

## Versionnement

`.gitignore` applique une liste blanche sous `lemegeton/`. Seuls les formats
texte sont versionnés : `.md`, `.txt`, `.py`, `.json`, `.csv`, `.html`, `.bat`
et `.ps1`. Tout le reste reste local : GLB, `.blend`, OBJ, FBX, STL, USDZ,
images, vidéo, NPZ, ZIP et journaux. Il faut aussi noter deux points.
- L'export de la conversation ChatGPT et `09_SAUVEGARDES/` sont exclus
  explicitement.
- Un clone neuf du dépôt n'a pas les binaires : seul ce dossier local est complet.

## Suppression de la sauvegarde ZIP

La sauvegarde locale `09_SAUVEGARDES/LEMEGETON-20261006-004526.zip` a été
supprimée à la demande de l'utilisateur, après vérification que tout son
contenu existe dans ce dossier. Elle pesait 2 539 576 627 octets, pour 573
fichiers, avec le SHA-256
`499FAD86EFAF91432F86CF9D9C17A884196F80795EF52EBD6612AED469967CA8`.

- Les 573 entrées ont été relues dans le ZIP. Toutes correspondaient au
  manifeste interne, sans aucune entrée corrompue.
- 557 entrées étaient identiques à un fichier du dossier de travail.
- 16 entrées étaient des versions antérieures à la migration : les fichiers
  adaptés au dépôt, et quelques rapports et docs mis à jour depuis.
  - Elles ont été extraites dans
    [versions-avant-migration/](versions-avant-migration/), avec leurs
    chemins d'origine et une empreinte vérifiée.
  - Les fichiers `.md`, `.json`, `.py` et `.ps1` sont versionnés. Les fichiers
    `.gitignore`, `.mjs` et `.tsx` restent locaux.
- Un second contrôle a donné 573 sur 573 : chaque fichier du ZIP existe à
  l'identique dans le dossier.

Le manifeste, le rapport et `LATEST.json` de cette sauvegarde ont été supprimés
avec elle. `09_SAUVEGARDES/` est vide : selon `08_AUDIT/AUDIT_GLOBAL.md`, en
l'absence de `LATEST.json`, aucune sauvegarde achevée n'est à annoncer.
`08_AUDIT/backup.ps1` permet d'en refaire une, de préférence vers un autre
support que C:.

## Ancien emplacement

`Downloads\lemegeton_3d` est conservé intact ; sa suppression est laissée à
l'utilisateur après relecture de ce rapport. Il contient encore sa propre copie
de la sauvegarde ZIP.
