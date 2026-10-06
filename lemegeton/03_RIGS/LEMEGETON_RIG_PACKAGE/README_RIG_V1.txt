LEMEGETON — RIG V1
===================

C'est la première version GLB avec VRAI SKIN + ARMATURE glTF.

Fichiers
--------
LEMEGETON_RIGGED_v1.glb
    Version riggée, 24 bones, 1 skin, poids rigides (1 bone/vertex).

LEMEGETON_SOURCE.glb
    Source Meshy inchangée.

RIG_STATUS.json
    État technique.

BLENDER_IMPORT_INSPECT.py
    Petit script pour importer la version riggée dans Blender et afficher
    l'armature en avant du mesh.

IMPORTANT
---------
Cette V1 est une passe de rigging mécanique automatique. Le mesh source est
un seul mesh très dense. Les poids sont donc attribués par zones spatiales
pour obtenir un squelette fonctionnel de départ.

Ce n'est PAS encore la version finale de production :
- la séparation sémantique des pièces doit être validée ;
- les pivots réels doivent être ajustés ;
- les doigts doivent être vérifiés individuellement ;
- les IK/controls et animations de test restent à ajouter.

Structure :
ROOT / BODY / HEAD / ANTENNA
bras gauche/droit : SHOULDER → ELBOW → WRIST → HAND → 3 FINGERS + THUMB
jambes : LEG → FOOT

Le principe reste mécanique et rigide, conforme au design LEMEGETON.
