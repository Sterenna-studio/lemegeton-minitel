# Sources du monde explorable

Dossier de travail local du monde explorable ([docs/MONDE_EXPLORABLE.md](../docs/MONDE_EXPLORABLE.md)).

- **Hors Git** : les modèles, textures, `.blend` et sons téléchargés ou produits ici (voir `.gitignore`). Ils ne sont publiés qu'une fois préparés par un script `tools/prepare_*.py`, dans `public/models/`, avec leurs crédits dans `public/models/ATTRIBUTION.md`.
- **Versionné** : ce README, la provenance de chaque fichier dans [SOURCES.csv](SOURCES.csv) (licence, auteur, URL, date, SHA-256) et les notes texte.

Règles de licence : [docs/ASSETS.md](../docs/ASSETS.md#monde-explorable--sources-et-règles).

| Dossier | Contenu |
| --- | --- |
| `00_CORE/` | porte temporelle, poignée, horloge, compteur, effet temporel |
| `01_CORRIDOR/` | kit du couloir et son décor |
| `02_FURNITURE/` … `07_AUDIO/` | mobilier, objets d'époque, accessoires, textures, documents, sons |

## Contenu au 7 octobre 2026

| Élément | Source | Licence | État |
| --- | --- | --- | --- |
| `00_CORE/horloge-cheminee/` → `public/models/monde/pendule.glb` | Mantel Clock 01, Poly Haven | CC0 | glTF 1k téléchargé. **Aiguilles fusionnées au boîtier dans le glTF** . Décision du 7 octobre : elle reste un décor fixe au-dessus de la porte ; la grande horloge porte l'animation. |
| `01_CORRIDOR/horloge-parquet/` → `public/models/monde/horloge.glb` | Vintage Grandfather Clock 01, Poly Haven | CC0 | glTF 1k téléchargé ; **aiguilles séparées** (`minute_hand`, `houd_hand`), animables telles quelles : ce sont elles qui s'emballent pendant l'ouverture ; 2,19 m de haut ; 8 582 triangles. |
| `00_CORE/porte/` → `public/models/monde/porte.glb` | Door_Wooden_Old, Mehdi Shahsavan (Sketchfab) | CC BY 4.0 | glTF déposé par l'utilisateur (5,4 Mo, `license.txt` inclus). **Battant séparé** (`door`, pivot côté charnières), **poignée séparée** (`handel`), cadre (`F`) et charnières distincts. Battant de 1,00 × 2,30 m, cadre de 1,27 × 2,46 m. 5 289 triangles, 2 matériaux, 6 textures PNG 1024². À la préparation : garder la copie fermée (`01`), retirer la copie ouverte (`01_1`) et la caméra Cinema 4D, convertir les textures. |
| `05_TEXTURES/` → `public/models/monde/textures/` | Dark Paneled Wood, Decrepit Wallpaper, Herringbone Parquet (Poly Haven) | CC0 | textures 1k du couloir, encodées en KTX2 par `tools/encode_textures.mjs`. Painted Plaster Wall est téléchargé mais non publié : le plafond est d'une couleur unie. |
