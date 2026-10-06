# Audit global et sauvegarde - 6 octobre 2026

## Constats prioritaires

1. **Personnage non pret pour production.** Decoupes ouvertes, doigts non
   segmentes, pivots et IK experimentaux ; video rejetee. Les preuves structurelles
   ne suffisent pas a valider l'apparence. Reprendre geometrie avant animation.
2. **Avis npm modere corrige.** Vitest 3.2.7 et @vitest/mocker etaient signales
   pour le meme avis [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).
   Mise a jour ciblee vers 4.1.11 et lockfile. Risque concernant l'outillage de
   developpement, pas une preuve d'exploitation ni une alerte du build publie.
3. **Lecture Canvas corrigee.** Le composant reusable ne redessinait pas lors
   d'un changement `visible` a frame constante. Ajout de `visible` aux dependances
   et test de regression navigateur (deux viewports).
4. **Sauvegarde locale seulement.** Meme disque que le projet ; copie externe
   a faire pour proteger d'une panne. Etat Blender non enregistre en RAM exclu.
5. **white_mesh non qualifie.** Nouvel asset conserve et inventorie, aucune
   provenance/licence embarquee. Non integre au runtime, pas valide visuellement.

## Perimetre et preuves

Lecture du code Web, configurations/lockfile, scripts Blender, pipeline,
rapports, inventaire et controle des 51 empreintes historiques : aucune alteration.
L'ancien inventaire et les rapports Blender avant revalidation sont conserves
dans `historique/`. Inventaire actuel `06_MODEL` : 242 fichiers, 701 700 017 octets.
Les scopes generiques Canvas/Texture/VDT futur restent distincts des tests
effectifs sur le terminal fourni.

Les controles de cette passation sont executes par `validate.ps1` ; journaux
complets et codes de sortie dans le dossier de `LATEST_VALIDATION.json`.
Derniere execution terminee : `validation-20261006-004313`, les neuf controles
ont un code de sortie 0. Six tests unitaires et douze tests navigateur passent ;
les deux scenarios production n'ont aucune erreur console. `npm audit` ne
signale aucune vulnerabilite connue au moment du controle. L'execution precedente
en echec est conservee : son nouveau test utilisait mal l'export default ReactDOM
du serveur Vite ; le harness a ete corrige puis toute la validation relancee.
Il inclut typecheck, lint, unitaires, build, Playwright, production, npm audit,
Blender verify_workshop et verify_export. Les scripts de validation Blender
ouvrent les scenes et produisent des rapports, sans sauver de retouches dans
les `.blend`. Les builders de regeneration n'ont pas ete relances.
`verify_sources.ps1` renouvelle `SOURCE_VERIFICATION.json` : 51 fichiers,
aucune modification. Le SHA-256 du Minitel original reste celui documente
dans le rapport Web.

Les rendus Web sont testes par pixels/captures et interaction Edge ; mobile
est une emulation de viewport et toucher, pas une validation GPU de telephone.
Le build a toujours un avertissement de chunk JS >500 Ko ; pas un echec de compilation.
Aucune emulation VDT, integration serveur, publication ou authentification
reelle validee. Aucun test PartField ni entrainement realise.

## Organisation pour les agents

`AGENTS.md` donne les contraintes ; `PASSATION_AGENTS.md` donne les chemins,
commandes, conventions et prochaines actions. `PIPELINE_TRAVAIL.md` reste la
feuille de route des branches. Le README Web documente API, ecrans, GLB et anchors.
Ce dossier n'est pas un depot Git ; ne pas annoncer de commit ou de publication.
La sauvegarde fige les fichiers existants sans deplacer les sources.

## Archivage

`backup.ps1` cree un ZIP date, un manifeste CSV externe et interne avec SHA-256,
puis relit/decompresse chaque entree et compare taille/empreinte. Les rapports
de succes sont generes SEULEMENT apres verification, dans `09_SAUVEGARDES`.
Le fichier `LATEST.json` indique la capture effectivement terminee ; si absent,
ne pas annoncer une sauvegarde achevee.

Inclus : references, sources 3D, rigs historiques, scenes et `.blend1`, rendus,
exports, nouveaux assets, code Web/lockfile/public, documentation, captures et
journaux d'audit. Exclus : dependances npm, build dist, caches Python/TS,
traces Playwright jetables, logs de serveur et sauvegardes precedentes.
Les logs de validation conserves dans `08_AUDIT` doivent etre archives aussi.
Les dependances et le build se reconstruisent par `npm ci` puis `npm run build`.

Pour restauration : extraire dans un nouveau dossier, verifier le manifeste,
puis lancer l'application. Aucun fichier d'une scene ouverte non sauvegardee
ne peut etre recree a partir du disque. Aucun effacement automatique prevu.
