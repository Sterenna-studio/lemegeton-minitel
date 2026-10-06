# Préparation du modèle 3D

## But

Transformer un modèle de Minitel en asset exploitable proprement dans Three.js.

## Checklist Blender

### Géométrie

- [ ] origine et orientation cohérentes ;
- [ ] transformations appliquées ;
- [ ] normales correctes ;
- [ ] géométrie inutile supprimée ;
- [ ] subdivision maîtrisée ;
- [ ] détails visibles sans surcharge excessive.

### Nommage

Utiliser des noms prévisibles, par exemple :

```
Minitel
Minitel_Body
Minitel_ScreenFrame
Minitel_Screen
Minitel_Keyboard
```

### Écran

L'objet ou la surface d'écran doit être facilement identifiable.

Prévoir un cas où le rendu Web remplace ou recouvre son matériau par une texture dynamique.

### Anchors

Prévoir progressivement :

```
Anchor_Screen
Anchor_Keyboard
Anchor_Rear
Anchor_Top
Anchor_Accessory
```

Ces anchors pourront servir aux accessoires et animations futures.

## Export

Exporter en GLB quand cela est adapté.

Après export :

- tester le chargement dans Three.js ;
- contrôler les dimensions ;
- vérifier l'aspect des matériaux ;
- vérifier le coût mémoire ;
- vérifier la surface d'écran ;
- vérifier les points d'ancrage.

## Préparation du modèle actuel

`tools/prepare_model.py` produit `public/models/minitel.glb` à partir du GLB
Sketchfab, sans modifier l'original :

1. rotation de −110° autour de la verticale, écran face à +Z dans Three.js ;
2. mise à l'échelle à 2,4 unités de haut, origine centrée au sol ;
3. extraction des deux plus grands triangles de la façade (l'écran photographié)
   en un mesh `Minitel_Screen` doté d'UV propres, retirés de `Minitel_Bezel` ;
4. renommage du corps en `Minitel_Body`, export GLB.

`tools/audit_model.py` produit les rendus et le rapport de `docs/asset-audit/`.

```bash
blender --background --python-exit-code 1 --python tools/prepare_model.py -- chemin/vers/minitel_1982-france.glb
blender --background --python-exit-code 1 --python tools/audit_model.py -- chemin/vers/minitel_1982-france.glb
```

Sans argument, les scripts cherchent `assets-src/minitel_1982-france.glb`
(dossier ignoré par Git). Avec Blender 5.2, la sortie est identique à l'octet près.

## Modèle temporaire

Un modèle placeholder est acceptable pour démarrer le développement Web.

Le code ne doit pas dépendre d'un maillage précis pour fonctionner.
