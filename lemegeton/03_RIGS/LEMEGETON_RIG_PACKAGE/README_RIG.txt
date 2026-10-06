LEMEGETON — RIG PACKAGE
========================

Ce package contient le GLB source et la préparation concrète du rig mécanique.

SOURCE
------
LEMEGETON_SOURCE.glb = copie intacte du GLB Meshy récupéré.

ÉTAT ACTUEL
-----------
Le GLB source contient 1 mesh, 2 nodes, 0 skin et 0 animation.
Il n'est donc pas déjà riggé.

RIG PLANIFIÉ
------------
ROOT
└─ BODY
   ├─ HEAD
   │  └─ ANTENNA
   ├─ SHOULDER_L → ELBOW_L → WRIST_L → HAND_L
   │                         ├─ FINGER1_L
   │                         ├─ FINGER2_L
   │                         ├─ FINGER3_L
   │                         └─ THUMB_L
   ├─ SHOULDER_R → ELBOW_R → WRIST_R → HAND_R
   │                         ├─ FINGER1_R
   │                         ├─ FINGER2_R
   │                         ├─ FINGER3_R
   │                         └─ THUMB_R
   ├─ LEG_L → FOOT_L
   └─ LEG_R → FOOT_R

IMPORTANT
---------
Les mains restent exactement à 4 doigts : 3 doigts + 1 pouce.
Le rig est mécanique : on privilégie des pièces rigides et des pivots plutôt
que des déformations organiques.

BLENDER
-------
BLENDER_RIG_BOOTSTRAP.py crée une première armature et conserve le mesh source.
Il ne prétend pas séparer automatiquement la géométrie en pièces lorsque le
GLB source est encore un mesh unique. La vraie segmentation doit être validée
sur la topologie pour éviter de couper arbitrairement le personnage.

PROCHAINE ÉTAPE
---------------
1. Importer le GLB.
2. Séparer/nommer les pièces mécaniques.
3. Repositionner les pivots sur les vraies articulations.
4. Assigner chaque pièce au bone correspondant.
5. Ajouter IK bras/jambes + contrôleurs.
6. Tester les rotations et exporter GLB/FBX.
