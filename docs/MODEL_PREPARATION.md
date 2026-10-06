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

## Modèle temporaire

Un modèle placeholder est acceptable pour démarrer le développement Web.

Le code ne doit pas dépendre d'un maillage précis pour fonctionner.
