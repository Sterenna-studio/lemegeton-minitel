# AGENTS.md

## Mission

Construire un Minitel 3D Web réutilisable et une expérience interactive autour de Lemegéton.

## Périmètre

Ce dépôt couvre :

- WebGL ;
- Three.js ;
- React / React Three Fiber si retenu ;
- assets GLB/GLTF ;
- simulation Vidéotex ;
- expérience interactive ;
- animation ;
- narration ;
- intégration Web.

Le dépôt **ne couvre pas** le matériel Minitel, l'ESP32, l'Arduino ou l'électronique. Cela reste dans `minitel-face`.

## Règles de conception

### Asset-first mais découplé

Le modèle 3D doit être interchangeable.

### Écran indépendant

Ne pas coupler la logique Vidéotex à un maillage spécifique.

### Pas de cyberpunk générique

Privilégier une esthétique Minitel authentique et maîtrisée.

### Accessibilité

Prévoir :

- navigation clavier ;
- focus ;
- alternatives textuelles lorsque nécessaire ;
- respect de prefers-reduced-motion.

### Performance

Éviter les dépendances inutiles et garder une scène Web raisonnable.

### Documentation

Toute décision d'architecture structurante doit être documentée.

## Workflow Codex

1. inspecter le dépôt ;
2. identifier les contraintes ;
3. proposer une structure minimale ;
4. implémenter par petites étapes ;
5. exécuter les vérifications disponibles ;
6. documenter les points qui restent à décider.

## MVP

Le MVP doit montrer un Minitel 3D manipulable avec un écran dynamique affichant une première expérience Vidéotex / 3615 Lemegéton.
