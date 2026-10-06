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
| `00_CORE/horloge-cheminee/` | Mantel Clock 01, Poly Haven | CC0 | glTF 1k téléchargé. **Aiguilles fusionnées au boîtier dans le glTF** : il faudra les séparer à partir du `.blend` riggé (3,9 Mo), ou utiliser la grande horloge. |
| `01_CORRIDOR/horloge-parquet/` | Vintage Grandfather Clock 01, Poly Haven | CC0 | glTF 1k téléchargé ; **aiguilles séparées** (`minute_hand`, `houd_hand`), animables telles quelles ; 2,19 m de haut ; 8 582 triangles. |
| `00_CORE/porte/` | Door_Wooden_Old, Mehdi Shahsavan (Sketchfab) | CC BY 4.0 | à déposer : téléchargement avec connexion Sketchfab (GLB, 5,6 Mo). |
