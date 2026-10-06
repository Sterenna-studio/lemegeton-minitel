"""Web copy of the side table from "Wood Drawer & Tables Set". Original GLB is never overwritten.

Usage: blender --background --python tools/prepare_table.py [-- <wood_drawer__tables_set.glb>]

Source : "Wood Drawer & Tables Set" by brandon_grey, CC BY 4.0
https://sketchfab.com/3d-models/wood-drawer-tables-set-958db224ef514b2eabd69ac0a4e59ca0
Only the side table with a drawer (SM_WoodenDrawer_1) is kept; textures are
written as JPEG to keep the file light.
"""
import json
import sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

WEB = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else WEB / 'lemegeton' / '06_MODEL' / 'wood_drawer__tables_set.glb'
KEEP = 'SM_WoodenDrawer_1_LOD0_Drawer_1_INST_0'
# Presentation scale shared with the terminals: the Minitel copy is 2.4 units
# high for about 30 cm, so one metre is 8 units.
UNITS_PER_METRE = 8.0
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
for obj in list(bpy.context.scene.objects):
    if obj.type == 'MESH' and obj.name == KEEP:
        continue
    if obj.type == 'MESH':
        bpy.data.objects.remove(obj, do_unlink=True)
table = bpy.data.objects[KEEP]
world = table.matrix_world.copy()
table.parent = None
table.matrix_world = Matrix.Identity(4)
table.data.transform(world)
for obj in list(bpy.context.scene.objects):
    if obj is not table:
        bpy.data.objects.remove(obj, do_unlink=True)
points = [v.co for v in table.data.vertices]
low = Vector([min(p[i] for p in points) for i in range(3)])
high = Vector([max(p[i] for p in points) for i in range(3)])
# The drawer already faces -Y in Blender (+Z after glTF export). Centre it, base at 0.
table.data.transform(Matrix.Diagonal((UNITS_PER_METRE,) * 3 + (1,)) @ Matrix.Translation(-Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))))
table.data.update()
table.name = table.data.name = 'Table'
out = WEB / 'public' / 'models' / 'table.glb'
bpy.ops.object.select_all(action='DESELECT')
table.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', use_selection=True, export_yup=True,
                          export_image_format='JPEG', export_jpeg_quality=82)
size = (high - low) * UNITS_PER_METRE
report = {'source': SOURCE.name, 'kept': KEEP, 'units_per_metre': UNITS_PER_METRE,
          'size_metres': [round(v, 3) for v in (high - low)], 'top_height_units': round(size.z, 4),
          'width_units': round(size.x, 4), 'depth_units': round(size.y, 4), 'bytes': out.stat().st_size}
(WEB / 'docs' / 'asset-audit' / 'table.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('PREPARED_TABLE', json.dumps(report))
