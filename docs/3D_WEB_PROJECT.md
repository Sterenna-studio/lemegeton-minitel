# Projet Minitel 3D Web

## Objectif

Créer un asset numérique de Minitel réaliste et une expérience Web réutilisable. Le Minitel doit être traité comme un objet de scène à part entière, avec un écran pilotable indépendamment.

## Principes

### 1. Le modèle 3D n'est pas l'application

Le GLB/GLTF doit pouvoir être remplacé sans réécrire la logique d'affichage.

### 2. L'écran est un composant indépendant

Prévoir un point d'ancrage et une surface explicitement dédiée au rendu Vidéotex.

### 3. L'expérience doit évoquer un vrai terminal

Éviter l'esthétique cyberpunk générique. Rechercher :
- plastique beige/gris ;
- rendu CRT ;
- phosphore ;
- léger bloom/glow ;
- scanlines discrètes ;
- scintillement subtil ;
- typographie terminal ;
- couleurs et grilles Vidéotex ;
- curseur et clignotement lorsque pertinent.

### 4. Préparer la réutilisation

API cible possible :

```tsx
<Minitel model="/models/minitel.glb" screen={<LemegetonTerminal />} />
```

## Fonctionnalités cibles

### Phase 1 — socle 3D
- caméra ;
- OrbitControls ;
- éclairage ;
- ombres ;
- responsive desktop/mobile ;
- chargement GLB/GLTF ;
- emplacement de remplacement du modèle.

### Phase 2 — écran
- surface d'écran indépendante ;
- texture dynamique ;
- Canvas ou rendu GPU ;
- résolution logique de terminal proche du Vidéotex ;
- curseur et clignotement ;
- navigation de base.

### Phase 3 — Vidéotex
- texte ;
- couleurs ;
- semi-graphisme ;
- effacement ;
- zones d'affichage ;
- transitions de pages.

### Phase 4 — Lemegéton
- page d'accueil type 3615 ;
- navigation ;
- écran de démonstration ;
- identité visuelle cohérente avec l'univers Lemegéton.

### Phase 5 — interaction
- clavier Minitel interactif ;
- touches mappées ;
- focus clavier ;
- accessibilité ;
- reduced motion.

### Phase 6 — enrichissement
- narration ;
- animations ;
- accessoires ;
- points d'ancrage ;
- modules 3D supplémentaires ;
- intégration dans plusieurs sites.

## Critères d'acceptation du MVP

- Minitel 3D visible dans un navigateur ;
- caméra manipulable ;
- écran dynamique ;
- première UI Vidéotex ;
- démonstration 3615 Lemegéton ;
- responsive ;
- modèle remplaçable ;
- documentation suffisante pour reprendre le projet avec Codex.
