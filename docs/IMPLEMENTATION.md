# Implementation du 6 octobre 2026

> Rapport redige le 6 octobre 2026 dans le dossier de travail `lemegeton_3d`, ou
> l'application vivait dans `07_WEB_MINITEL/` et les modeles sources dans `06_MODEL/`.
> Depuis, l'application occupe la racine de ce depot.

Plan suivi : inventaire du dossier et absence d'application existante -> audit
du GLB Minitel fourni et de ses droits -> preparation d'une copie orientee et
ecran separe -> moteur de cellules et demonstration -> integration 3D et DOM
accessible -> tests TypeScript/lint/unitaires/navigateur -> documentation.

Le choix d'une application autonome `07_WEB_MINITEL` evite de remplacer les
viewers historiques et de coupler le composant au rig du personnage.
Le modele fourni a ete inspecte dans Blender et dans Edge : la copie ne sert
pas seulement a un viewer, elle recoit reellement la texture Canvas du terminal.

Problemes resolus pendant la validation : orientation/decentrage de l'asset,
surface CRT initialement dans le cadre, inversion verticale Canvas/glTF,
ombres de texte qui creaient une grille parasite, cadrage du clavier sur mobile,
chargement Html/R3F qui declenchait une erreur de racine React, port 5173 occupe.
L'infrastructure conserve une gestion DOM de fallback si modele ou contexte
WebGL deviennent indisponibles.

Les screenshots et tests de pixels distinguent rendu non vide, texture qui
change et camera qui bouge. Les tests de viewport restent de l'emulation
navigateur, pas de la validation sur GPU de smartphone physique.
