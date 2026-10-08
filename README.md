# Lemegéton Minitel

Projet numérique autour du Minitel : asset 3D Web réaliste, simulation Vidéotex, expérience interactive et univers Lemegéton.

## Vision

Construire un Minitel 3D réutilisable dans des sites Web, avec un écran indépendant capable d'afficher une expérience Vidéotex dynamique, tout en préparant les bases pour l'interaction, l'animation et la narration.

Le projet n'est pas un projet d'électronique : le Minitel physique, ESP32, Arduino et serveur de façade restent dans `minitel-face`.

## Axes

- 🖥️ Minitel 3D Web
- 📟 simulation Vidéotex
- 🎭 expérience Lemegéton
- 🎨 assets GLB/GLTF
- 🌐 WebGL / Three.js
- 🕹️ interaction et animation
- 🧩 composants réutilisables
- 📖 narration et prototypes

## Stack cible

- TypeScript
- Vite
- Three.js
- React / React Three Fiber selon le besoin
- GLB / GLTF pour les assets 3D

## Démarrer

```bash
npm ci
npm run dev          # http://127.0.0.1:5174
npm run build        # contrôle des types puis bundle dans dist/
```

Aperçu du monde explorable (couloir, portes temporelles, salles provisoires) sur
`/parcours/`, et chaque brique seule dans `/atelier/`.

Node 22.12+ ou 24. Rotation, toucher et zoom pilotent la caméra. Un double-clic sur
l'écran fait la mise au point : l'écran passe de face, remplit la vue, et la caméra
se verrouille ; un second double-clic revient à la vue d'avant (bouton équivalent
dans les outils de caméra). Les touches du
modèle 3D, le clavier physique et le clavier virtuel pilotent le même terminal.
Sans WebGL, une lecture textuelle navigable s'affiche automatiquement.

## Vérifier

```bash
npm run typecheck
npm run lint
npm test               # 23 tests unitaires Vitest
npm run test:browser   # 22 tests Playwright (Edge headless, serveur dev sur 5174)
```

## En ligne

https://sterenna.fr/minitel/ — publié par [`.github/workflows/deploy-ovh.yml`](.github/workflows/deploy-ovh.yml)
à chaque push sur `main` (ou manuellement via *Run workflow*) : contrôles,
`npm run build:ovh` (base `/minitel/`), puis `rsync --delete` de `dist/` vers
`~/www/minitel/` sur l'hébergement OVH, et test de fumée.

- Secrets utilisés : `OVH_SSH_KEY`, `OVH_HOST`, `OVH_USER`, définis au niveau de
  l'organisation. Sur le plan GitHub Free, ils ne sont transmis qu'aux dépôts
  **publics** : rendre ce dépôt privé casserait le déploiement.
- Le site sterenna.fr est déployé dans la même racine par `MutenRock/sterenna`,
  avec `rsync --delete`. Son workflow exclut `/minitel/` : ne pas retirer cette exclusion.
- `public/.htaccess` déclare le type MIME du GLB et les durées de cache.

Pour vérifier localement le build de production :

```bash
npm run build:ovh
npx vite preview --base=/minitel/   # http://127.0.0.1:4173/minitel/
```

## Documentation en ligne

`/documentation/` (https://sterenna.fr/minitel/documentation/) présente chaque
modèle : quatre vues, caractéristiques, provenance, licence, et un lien vers le
terminal 3D. La page liste aussi les photos de référence du Terminatel 255 et
renvoie à la documentation du projet. Son contenu est dans
`src/documentation/content.ts`.

Les vues sont des captures du terminal 3D lui-même (`?vue=face|profil|dos` et
`?capture=1`). Pour les régénérer, lancer `npm run dev` puis :

```bash
node tools/capture_views.mjs http://127.0.0.1:5174
```

Les photos de référence (annonce eBay) ne s'affichent qu'en local, avec
`npm run dev`. Le build n'en contient aucune, et le workflow de déploiement
le vérifie.

## Architecture

```
src/
  minitel/      # composant Minitel, profils de modèle, écran dynamique, anchors, API (index.ts)
  videotex/     # grille 40 × 25, palette, mosaïques 2 × 3, rendu Canvas, contrôleur Terminal
  scene/        # caméra tactile, lumière, ombres, suivi du contexte WebGL
  components/   # AccessibleTerminal, inventaire, bouton Tool
  hooks/        # abonnement au terminal, mouvement réduit, paramètres d'URL
  demo/         # pages 3615 Lemegéton, seul module narratif ; catalogue des terminaux
  terminal/     # expérience du terminal (3615, yeux, effets) et ses panneaux, réutilisables
  world/        # monde explorable : données, rails, navigation, séquence de porte, URL (pur, testé)
  atelier/      # page atelier : chaque brique du monde vue seule
  App.tsx       # version simple : le terminal seul

simple/, atelier/, documentation/   # entrées Vite des autres pages

public/
  models/       # minitel.glb préparé + ATTRIBUTION.md
  licenses/     # licences des polices IBM Plex

tools/          # préparation Blender, inventaire des assets, vérification de production
tests/          # Vitest (tests/*.test.ts) et Playwright (tests/browser/)
lemegeton/      # pipeline du personnage : scripts Blender, rigs, rapports, passation
docs/           # cadrage, guide, préparation du modèle, rapports de vérification
```

- [Guide d'utilisation et d'intégration](docs/USAGE.md) : réutiliser `<Minitel>`, sources d'écran, pages Vidéotex, accessoires, inspection.
- [Préparation du modèle](docs/MODEL_PREPARATION.md), [assets et licences](docs/ASSETS.md).
- [Vérification](docs/VERIFICATION.md) et [notes d'implémentation](docs/IMPLEMENTATION.md).
- [Cadrage du projet](docs/3D_WEB_PROJECT.md).
- [Audit du 6 octobre 2026](docs/AUDIT_2026-10-06.md) : bilan des trois dépôts, vérifications, points ouverts.
- [Monde explorable](docs/MONDE_EXPLORABLE.md) (à venir, [issue #8](https://github.com/Sterenna-studio/lemegeton-minitel/issues/8)) : couloir, portes temporelles et salles sur rails ; la version actuelle restera disponible en version simple. Décisions, architecture, audit du code, budgets (iPhone 11), lots. [Direction artistique](docs/DIRECTION_ARTISTIQUE.md).

## Personnage Lemegéton (`lemegeton/`)

Scripts et documentation du pipeline 3D du personnage : rigs V1 à V3, atelier
Blender V4, rapports d'audit, feuille de route et passation entre agents.
Point d'entrée : [lemegeton/PASSATION_AGENTS.md](lemegeton/PASSATION_AGENTS.md),
puis [la pipeline](lemegeton/PIPELINE_TRAVAIL.md).

C'est le dossier de travail complet, migré depuis `Downloads\lemegeton_3d`
le 6 octobre 2026 avec contrôle SHA-256 ([rapport](lemegeton/08_AUDIT/migration-2026-10-06/MIGRATION.md)).
Tous les fichiers sont présents en local, mais seuls les formats texte sont
versionnés : GLB, `.blend`, OBJ, images, vidéo et sauvegardes ZIP sont exclus
par une liste blanche dans `.gitignore`. Un clone neuf n'a donc pas les binaires. Le personnage reste au stade
expérimental : géométrie, doigts et pivots sont à reprendre avant l'animation.

## État du MVP

Les critères du [cadrage](docs/3D_WEB_PROJECT.md) sont atteints :
- Minitel 3D visible et manipulable, avec un écran dynamique indépendant ;
- UI Vidéotex et démo 3615 Lemegéton ;
- page responsive ;
- modèle remplaçable via un profil ;
- touches 3D cliquables et accessoires par anchors.

Un sélecteur propose trois modèles :
- le Terminatel 255, en finition marbre noir ;
- le Minitel 1 d'origine ;
- un téléviseur des années 1950.

La page suit la direction artistique du Terminatel 255 (voir
[assets et licences](docs/ASSETS.md)).

L'écran peut aussi afficher **les yeux de Lemegeton** en mosaïque Vidéotex
(Réglages CRT > Écran, ou `?ecran=yeux`). Ce sont les yeux de l'overlay OBS de
nitro-clicker, repris des librairies `LibZyraEyes` et `LibEyes` de minitel-face.
Ils clignent, regardent et réagissent seuls, et les touches Minitel changent leur
humeur. Deux rendus sont proposés : la mosaïque Vidéotex, ou un rendu classique lisse
comme l'overlay. La taille se règle au curseur. Dans tous les cas, l'écran est bombé
comme un vrai tube, avec des effets CRT activables. Voir le [guide](docs/USAGE.md#yeux-de-lemegeton-ecran-videotex).

Restent ouverts : la validation artistique (textures grises d'origine conservées),
les essais sur téléphones physiques, l'optimisation du chargement (bundle
d'environ 1,2 Mo), et l'émulation protocolaire Vidéotex (décodeur VDT).

Le Minitel physique, l'ESP32 et le serveur de visage restent dans
[minitel-face](https://github.com/Sterenna-studio/minitel-face).

## Crédits

Modèle 3D « Minitel 1982-France » par okotaru
([Sketchfab](https://sketchfab.com/3d-models/minitel-1982-france-864f54ce4e1f41abab0688b88a45babf)),
sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adapté :
voir [ATTRIBUTION.md](public/models/ATTRIBUTION.md). Polices IBM Plex sous
licence SIL OFL 1.1 ([public/licenses/](public/licenses/)).
