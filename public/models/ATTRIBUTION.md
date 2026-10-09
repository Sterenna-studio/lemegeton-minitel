# Model attribution

Minitel 1982-France by okotaru (https://sketchfab.com/loaferspore).
Source: https://sketchfab.com/3d-models/minitel-1982-france-864f54ce4e1f41abab0688b88a45babf
License: Creative Commons Attribution 4.0 International.
License URL: https://creativecommons.org/licenses/by/4.0/

Author, title, source and license are recorded in the supplied original GLB metadata.
Derived web asset: minitel.glb. Changes: orientation, centering, presentation
scale, separate CRT faces and replacement screen UVs.
Web compression (tools/optimize_glb.mjs): textures re-encoded as KTX2
(Basis Universal; colour maps up to 1024 px, other maps up to 512 px),
geometry compressed with meshopt.
Keep this attribution and the visible credit when distributing the derived model.

---

1950's Retro Television by Huuxloc (https://sketchfab.com/rjh41).
Source: https://sketchfab.com/3d-models/1950s-retro-television-640b18f7fcbb489eb47bda1927e5b653
License: Creative Commons Attribution 4.0 International.
License URL: https://creativecommons.org/licenses/by/4.0/

Derived web asset: television-1950.glb (from the 1k-texture variant), made by
tools/prepare_television.py. Changes: centering, presentation scale (2.4 units
high), mesh names, screen material replaced and planar screen UVs.
Web compression (tools/optimize_glb.mjs): textures re-encoded as KTX2
(Basis Universal; colour maps up to 1024 px, other maps up to 512 px),
geometry compressed with meshopt. Keep this attribution and the visible credit when
distributing the derived model.

---

Wood Drawer & Tables Set by brandon_grey (https://sketchfab.com/brandondmc10).
Source: https://sketchfab.com/3d-models/wood-drawer-tables-set-958db224ef514b2eabd69ac0a4e59ca0
License: Creative Commons Attribution 4.0 International.
License URL: https://creativecommons.org/licenses/by/4.0/

Derived web assets: mobilier/table-tiroir.glb, chevet-haut.glb, meuble-niche.glb
and table-basse.glb, made by tools/prepare_table.py. Changes: each piece exported
alone, centred, scaled to 8 units per metre.
Web compression (tools/optimize_glb.mjs): textures re-encoded as KTX2
(Basis Universal; colour maps up to 1024 px, other maps up to 512 px),
geometry compressed with meshopt. Keep this attribution and the visible credit
when distributing the derived model.

---

Door_Wooden_Old -9MB by Mehdi Shahsavan (https://sketchfab.com/ahmagh2e).
Source: https://sketchfab.com/3d-models/door-wooden-old-9mb-77815b3a55504037aa4641eb9650e9de
License: Creative Commons Attribution 4.0 International.
License URL: https://creativecommons.org/licenses/by/4.0/

Derived web asset: monde/porte.glb (placeholder temporal door), made by
tools/prepare_door.mjs then tools/optimize_glb.mjs. Changes: open duplicate and
camera removed, scaled to 8 units per metre, frame centred on the origin, nodes
renamed (cadre, battant, poignee). Web compression: KTX2 textures (colour
1024 px, other maps 256 px), meshopt geometry. Keep this attribution and the
visible credit when distributing the derived model.

---

Mantel Clock 01 (modelling and textures Rico Cilliers, rigging Yann Kervran)
and Vintage Grandfather Clock 01 (modelling and textures James Ray Cock,
rigging Yann Kervran), Poly Haven.
Sources: https://polyhaven.com/a/mantel_clock_01,
https://polyhaven.com/a/vintage_grandfather_clock_01
License: CC0 1.0 (public domain dedication) ; credited for traceability.

Derived web assets: monde/pendule.glb (simplified to about a quarter of its
vertices) and monde/horloge.glb, made by tools/optimize_glb.mjs from the
official glTF 1k files. Changes: scaled to 8 units per metre, KTX2 textures
(metal/roughness maps in UASTC), meshopt geometry.

---

Material textures of the corridor, Poly Haven (https://polyhaven.com) :
Dark Paneled Wood, Decrepit Wallpaper, Herringbone Parquet.
Sources: https://polyhaven.com/a/dark_paneled_wood,
https://polyhaven.com/a/decrepit_wallpaper,
https://polyhaven.com/a/herringbone_parquet
License: CC0 1.0 (public domain dedication) ; credited for traceability.

Derived web assets: monde/textures/*.ktx2, made by tools/encode_textures.mjs
from the official 1k maps : colour in KTX2 ETC1S (1024 px), normal and ARM maps
in KTX2 UASTC (512 px). Tints are applied in code.
The same textures panel the 1950 living room of the explorable world.

---

Rooms of the explorable world (3D+ mode) : the decor (furniture, frames,
windows, clocks, plants, rugs, posters, calendar, marble) is built in code in
src/world/three/rooms/ and drawn on canvas. It uses no third-party asset besides
the ones credited above. Each room shows its terminal (credited above), its
furniture (Wood Drawer & Tables Set) and the temporal door back to the corridor
(Door_Wooden_Old, with the Mantel Clock).
