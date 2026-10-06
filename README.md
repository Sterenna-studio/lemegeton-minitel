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

Node 22.12+ ou 24. Rotation, toucher et zoom pilotent la caméra. Les touches du
modèle 3D, le clavier physique et le clavier virtuel pilotent le même terminal.
Sans WebGL, une lecture textuelle navigable s'affiche automatiquement.

## Vérifier

```bash
npm run typecheck
npm run lint
npm test               # 6 tests unitaires Vitest
npm run test:browser   # 10 tests Playwright (Edge headless, serveur dev sur 5174)
```

## Architecture

```
src/
  minitel/      # composant Minitel, profils de modèle, écran dynamique, anchors, API (index.ts)
  videotex/     # grille 40 × 25, palette, mosaïques 2 × 3, rendu Canvas, contrôleur Terminal
  scene/        # caméra tactile, lumière, ombres, suivi du contexte WebGL
  components/   # AccessibleTerminal : contenu et actions DOM synchronisés
  hooks/        # abonnement au terminal, mouvement réduit
  demo/         # pages 3615 Lemegéton, seul module narratif

public/
  models/       # minitel.glb préparé + ATTRIBUTION.md
  licenses/     # licences des polices IBM Plex

tools/          # préparation Blender, inventaire des assets, vérification de production
tests/          # Vitest (tests/*.test.ts) et Playwright (tests/browser/)
docs/           # cadrage, guide, préparation du modèle, rapports de vérification
```

- [Guide d'utilisation et d'intégration](docs/USAGE.md) : réutiliser `<Minitel>`, sources d'écran, pages Vidéotex, accessoires, inspection.
- [Préparation du modèle](docs/MODEL_PREPARATION.md), [assets et licences](docs/ASSETS.md).
- [Vérification](docs/VERIFICATION.md) et [notes d'implémentation](docs/IMPLEMENTATION.md).
- [Cadrage du projet](docs/3D_WEB_PROJECT.md).

## État du MVP

Les critères du [cadrage](docs/3D_WEB_PROJECT.md) sont atteints : Minitel 3D
visible et manipulable, écran dynamique indépendant, UI Vidéotex, démo
3615 Lemegéton, responsive, modèle remplaçable via un profil, touches 3D
cliquables et accessoires par anchors.

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
