# Assets

## Asset principal attendu

Le format de référence pour le Web est **GLB/GLTF**.

Le projet peut exploiter temporairement un modèle de remplacement en attendant un asset définitif.

## Organisation

```
public/
  models/
    minitel.glb
  textures/
```

## Contraintes

Le modèle doit idéalement fournir :

- une géométrie propre ;
- des matériaux séparés lorsque cela aide le rendu ;
- une surface d'écran identifiable ;
- des pivots cohérents ;
- des dimensions et orientations stables ;
- des noms d'objets explicites.

## Licences

Tout modèle tiers doit conserver sa licence et sa provenance dans la documentation du dépôt.

Ne pas intégrer automatiquement un asset tiers dans une distribution finale sans vérifier ses conditions d'utilisation.

## Préparation Web

Avant intégration :

1. vérifier l'échelle ;
2. vérifier les normales ;
3. réduire les données inutiles ;
4. optimiser textures et matériaux ;
5. identifier l'écran ;
6. définir les anchors utiles ;
7. exporter en GLB/GLTF ;
8. tester dans la scène Web.

Voir `MODEL_PREPARATION.md`.
