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
npm run dev          # http://127.0.0.1:5173
npm run build        # contrôle des types puis bundle dans dist/
```

Clavier PC : chiffres et lettres, Entrée = Envoi, Retour arrière = Correction,
Échap = Sommaire, Suppr = Annulation, F1 = Guide. Les touches de fonction
Minitel sont aussi disponibles dans le panneau latéral.

## Vérifier

```bash
npm run typecheck
npm run lint
npm test               # Vitest : écran, terminal, correspondance clavier
npm run test:browser   # Playwright : build, chargement du GLB, navigation clavier
```

`npm run test:browser` utilise le Chromium de Playwright (`npx playwright install`).

## Architecture

```
src/
  minitel/      # API réutilisable : MinitelModel, MinitelKeypad, useVideotexTexture, keyFromEvent
  videotex/     # grille 40 × 25, palette, mosaïques, rendu Canvas, Terminal (pages + saisie)
  scene/        # caméra, lumières, ombre de contact, orbite
  hooks/        # useMinitel (abonnement au terminal), useReducedMotion
  demo/         # pages 3615 Lemegéton, seul code lié au récit

public/
  models/       # minitel.glb préparé pour le Web

tools/          # scripts Blender d'audit et de préparation du modèle
tests/          # tests unitaires Vitest
e2e/            # test navigateur Playwright
docs/           # cadrage, assets, préparation du modèle, rendus d'audit
```

`MinitelModel` accepte n'importe quelle `THREE.Texture` pour l'écran. Il la
pose sur le mesh `Minitel_Screen` du GLB, ou sur un plan 4:3 généré devant le
modèle si ce mesh est absent : le modèle reste remplaçable. Les textures
suivent la convention UV glTF (`flipY = false`). Ni le composant ni le rendu
Vidéotex ne connaissent la démo Lemegéton.

Les effets CRT (balayage, vignettage, lueur, scintillement) sont désactivables ;
le clignotement et le scintillement sont coupés avec `prefers-reduced-motion`.
Le texte de l'écran est aussi exposé aux lecteurs d'écran (`aria-live`).

## État du MVP

| Critère ([docs/3D_WEB_PROJECT.md](docs/3D_WEB_PROJECT.md)) | État |
| --- | --- |
| Minitel 3D visible, caméra manipulable | fait |
| Écran dynamique, première UI Vidéotex | fait (Canvas 2D) |
| Démonstration 3615 Lemegéton | fait (6 pages) |
| Responsive | fait (panneau sous la scène en dessous de 760 px) |
| Modèle remplaçable | fait (plan d'écran de secours) |
| Clavier 3D cliquable, anchors | à faire : le GLB n'a pas encore de `Minitel_Keyboard`, `Key_*` ni `Anchor_*` |

## Points à décider

- API cible du cadrage, `<Minitel model screen={<LemegetonTerminal />} />` :
  l'écran attend aujourd'hui une texture. Il reste à choisir comment un
  composant React d'écran produit cette texture.
- Décodage d'un flux Vidéotex brut (octets 7 bits), au-delà du modèle de pages actuel.
- Sort du modèle actuel : il convient comme base, mais le corps, le clavier et
  les touches restent les meshes d'origine (`Object_*`).

Le Minitel physique, l'ESP32 et le serveur de visage restent dans
[minitel-face](https://github.com/Sterenna-studio/minitel-face).

## Crédits

Modèle 3D « Minitel 1982-France » par okotaru, sous licence
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adapté. Détails dans
[docs/ASSETS.md](docs/ASSETS.md).
