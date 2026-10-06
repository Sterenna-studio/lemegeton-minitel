"""Web copies of the four pieces of "Wood Drawer & Tables Set". Original GLB is never overwritten.

Usage: blender --background --python tools/prepare_table.py [-- <wood_drawer__tables_set.glb>]

Source : "Wood Drawer & Tables Set" by brandon_grey, CC BY 4.0
https://sketchfab.com/3d-models/wood-drawer-tables-set-958db224ef514b2eabd69ac0a4e59ca0
Each piece is exported alone to public/models/mobilier/<id>.glb, centred, base
at 0, scaled like the terminals (1 m = 8 units), textures re-encoded as JPEG.
Measurements go to docs/asset-audit/mobilier.json (used by src/scene/furniture.ts).
"""
import json
import sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

WEB = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else WEB / 'lemegeton' / '06_MODEL' / 'wood_drawer__tables_set.glb'
PIECES = {
    'table-tiroir': 'SM_WoodenDrawer_1_LOD0_Drawer_1_INST_0',
    'chevet-haut': 'SM_WoodenDrawer_2_LOD0_Drawer_2_INST_0',
    'meuble-niche': 'SM_WoodenDrawer_3_LOD0_Drawer_3_INST_0',
    'table-basse': 'SM_WoodenTable_LOD0_Table_INST_0',
}
# Presentation scale shared with the terminals: the Minitel copy is 2.4 units
# high for about 30 cm, so one metre is 8 units.
UNITS_PER_METRE = 8.0
OUT = WEB / 'public' / 'models' / 'mobilier'
OUT.mkdir(parents=True, exist_ok=True)
report = {'source': SOURCE.name, 'units_per_metre': UNITS_PER_METRE, 'pieces': {}}
for piece, mesh_name in PIECES.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    keep = bpy.data.objects[mesh_name]
    world = keep.matrix_world.copy()
    keep.parent = None
    keep.matrix_world = Matrix.Identity(4)
    keep.data.transform(world)
    for obj in list(bpy.context.scene.objects):
        if obj is not keep:
            bpy.data.objects.remove(obj, do_unlink=True)
    points = [v.co for v in keep.data.vertices]
    low = Vector([min(p[i] for p in points) for i in range(3)])
    high = Vector([max(p[i] for p in points) for i in range(3)])
    # Every piece faces -Y in Blender (+Z after glTF export). Centre it, base at 0.
    keep.data.transform(Matrix.Diagonal((UNITS_PER_METRE,) * 3 + (1,)) @ Matrix.Translation(-Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))))
    keep.data.update()
    keep.name = keep.data.name = 'Table'
    out = OUT / f'{piece}.glb'
    bpy.ops.object.select_all(action='DESELECT')
    keep.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', use_selection=True, export_yup=True,
                              export_image_format='JPEG', export_jpeg_quality=82)
    size = (high - low) * UNITS_PER_METRE
    report['pieces'][piece] = {
        'mesh': mesh_name,
        'size_metres': [round(v, 3) for v in (high - low)],
        'top_height_units': round(size.z, 4),
        'width_units': round(size.x, 4),
        'depth_units': round(size.y, 4),
        'bytes': out.stat().st_size,
    }
(WEB / 'docs' / 'asset-audit' / 'mobilier.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('PREPARED_FURNITURE', json.dumps(report))
