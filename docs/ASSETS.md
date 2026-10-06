# Assets

## Asset principal attendu

Le format de référence pour le Web est **GLB/GLTF**.

Le projet peut exploiter temporairement un modèle de remplacement en attendant un asset définitif.

## Asset retenu

| Champ | Valeur |
| --- | --- |
| Titre | Minitel 1982-France |
| Auteur | okotaru (https://sketchfab.com/loaferspore) |
| Source | https://sketchfab.com/3d-models/minitel-1982-france-864f54ce4e1f41abab0688b88a45babf |
| Licence | CC BY 4.0 : usage commercial et redistribution autorisés, crédit obligatoire |
| Fichier | `public/models/minitel.glb` (3,6 Mo) |
| Modifications | rotation, échelle, origine au sol, écran extrait en `Minitel_Screen` |

Licence et auteur vérifiés via l'API Sketchfab ; ils figurent aussi dans
`asset.extras` du GLB d'origine. Le crédit est affiché dans l'interface et
dans le README. Le GLB d'origine et ses textures ne sont pas versionnés.

Autres pistes repérées, non retenues :

- Cults : Minitel 1 NFZ 300 — https://cults3d.com/en/3d-model/art/minitel-1-nfz-300-la-radiotechnique
- CGTrader : Minitel – TELTEL — https://www.cgtrader.com/free-3d-models/interior/office-interior/minitel-teltel

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
