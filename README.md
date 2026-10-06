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

## Architecture cible

```
src/
  minitel/      # modèle 3D, écran, interaction, anchors
  videotex/     # rendu et logique Vidéotex
  scene/        # caméra, lumière, environnement
  hooks/        # interactions et état

public/
  models/       # GLB / GLTF
  textures/     # textures et supports

docs/
```

## Premier objectif

Obtenir une scène Web dans laquelle :

1. un Minitel 3D réaliste est visible et manipulable ;
2. l'écran est une surface indépendante ;
3. une interface Vidéotex dynamique est rendue sur cet écran ;
4. une première expérience **3615 Lemegéton** fonctionne ;
5. l'asset 3D reste remplaçable sans réécrire l'expérience.

Voir les documents dans `docs/` pour les détails de cadrage.
