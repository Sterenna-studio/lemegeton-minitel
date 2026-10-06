# Verification du 6 octobre 2026

> Rapport redige le 6 octobre 2026 dans le dossier de travail `lemegeton_3d`, ou
> l'application vivait dans `07_WEB_MINITEL/` et les modeles sources dans `06_MODEL/`.
> Depuis, l'application occupe la racine de ce depot.

| Verification | Resultat |
| --- | --- |
| `npm run typecheck` | OK, TypeScript strict |
| `npm run lint` | OK |
| `npm test` | 6 tests unitaires passes |
| `npm run test:browser` | 12 tests Edge headless passes, dont regression de visibilite du lecteur Canvas |
| `npm run build` | OK ; avertissement non bloquant de taille du bundle |
| `node tools/verify_production.mjs` | Bureau/mobile OK, GLB HTTP 200, navigation, aucun inspecteur ni erreur console |
| Sources historiques | 51 SHA-256 compares a `TRI_MANIFEST.csv`, aucun changement |
| `npm audit --json` | Aucune vulnerabilite connue signalee apres mise a jour Vitest 4.1.11 |

Revalidation de passation : les neuf controles passes et leurs journaux sont
indexes dans `../../08_AUDIT/LATEST_VALIDATION.json`. Voir aussi
[l'audit global](../lemegeton/08_AUDIT/AUDIT_GLOBAL.md).

Les tests de developpement couvrent WebGL non vide, changement de pixels lors
de la navigation, camera/orbite/zoom, clic sur la touche 3D 1, clavier physique
et virtuel, lecture DOM, antenne, effets et inspection. Le fallback sans WebGL
est simule par interception de `getContext`; mouvement reduit est emule.

Viewports inspectes : **1440 x 900**, **768 x 1024**, **390 x 844**, **320 x 640**.
Les bornes des pixels sombres de l'objet restent dans le canvas ; les reglages
ne chevauchent pas la console. Les captures finales ont ete examinees
visuellement. Aucun essai sur telephone physique, Safari/iOS ou WebXR revendique.
Les screenshots sont dans `verification/`, ainsi que `production.json`.
Le serveur de production temporaire est arrete automatiquement ; le serveur
dev reste sur http://127.0.0.1:5174/ pour essayer la demonstration.

## Asset et provenance

Inventaire `06_MODEL` : **242 fichiers**, **701 700 017 octets**, dont 200 OBJ
TELETEL et cinq GLB. `white_mesh.glb` est conserve mais non qualifie (provenance,
licence et apparence a examiner). L'inventaire initial de 241 fichiers est
archive dans `08_AUDIT/historique`. Seule la copie Minitel 1982-France est embarquee :
**3 641 192 octets**, **71 meshes**, **21 943 triangles**, **11 images**,
resolution des images d'origine de 32 a 1024 pixels. La source a 70 meshes ;
la separation des deux triangles CRT ajoute un objet, pas de triangles.

SHA-256 du GLB source :
`16B0FDBDD2092299910F0FD407149E2F63099A3C36DC4AE6C53F1A8224397E9D`.
L'inventaire complet et les metadonnees sont dans `asset-audit/inventory.json`.
`node tools/inventory.mjs` renouvelle ce rapport sans modifier les assets.

L'attribution du Minitel provient des metadonnees du GLB ; elle est visible et
conservee dans `public/models/ATTRIBUTION.md`. Les licences des polices sont
dans `public/licenses/`, a conserver dans la distribution. Les autres GLB
ont des metadonnees recensees ; documenter les ensembles OBJ/BLEND avant distribution.

## Cout et limites

Build mesure : JS environ **1,22 Mo**, **344 Ko gzip**, CSS environ 10 Ko,
plus modele 3,64 Mo et polices locales. Vite signale un chunk superieur a
500 Ko : compilation reussie, optimisation du chargement possible ensuite.
Pas de benchmark FPS sur GPU mobile physique.

Les tests d'integration portent sur la source Vidéotex fournie, pas sur tous
les medias externes de l'API. Aucun decodeur video/VDT, serveur, WebSocket ou
authentification teste. CRT geometriquement plat avec distorsion visuelle,
textures photographiques grises conservees ; validation artistique a poursuivre.
