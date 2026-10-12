# Sources des modèles du site

Fichiers d'origine des terminaux et du mobilier, **locaux et hors Git** (seul ce
README est versionné). Ils étaient dans `lemegeton/06_MODEL/` avant que le
personnage n'ait son propre dépôt
([Sterenna-studio/lemegeton](https://github.com/Sterenna-studio/lemegeton),
12 octobre 2026).

- `06_MODEL/` : Minitel 1982-France (okotaru), 1950's Retro Television (Huuxloc),
  Wood Drawer & Tables Set (brandon_grey), tous CC BY 4.0 ; et le TELTEL de
  CGTrader, **écarté** (licence « Royalty Free, no AI »).
- `02_SOURCES_3D/` : Minitel 1 NFZ 300 (Cults), **écarté** : licence « Cults PU »
  et « No IA », à ne jamais publier ni traiter avec des outils d'IA.

Les scripts `tools/prepare_*.py` lisent `06_MODEL/` par défaut et écrivent les
modèles préparés dans `public/models/`. Licences et raisons des exclusions :
[docs/ASSETS.md](../docs/ASSETS.md).
