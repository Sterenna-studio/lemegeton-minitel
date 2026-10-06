"""Create the web copy of the 1950's Retro Television. Original GLB is never overwritten.

Usage: blender --background --python tools/prepare_television.py [-- <1950s_retro_television (1).glb>]

Source : "1950's Retro Television" by Huuxloc, CC BY 4.0
https://sketchfab.com/3d-models/1950s-retro-television-640b18f7fcbb489eb47bda1927e5b653
The 1k-texture variant is used (1.6 MB) rather than the 2k one (5.4 MB).
"""
import json
import sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

WEB = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else WEB / 'lemegeton' / '06_MODEL' / '1950s_retro_television (1).glb'
OUT = WEB / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for obj in objects:
    world = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = Matrix.Identity(4)
    obj.data.transform(world)
# The cabinet already faces -Y in Blender (+Z after glTF export): no rotation.
points = [v.co for o in objects for v in o.data.vertices]
low = Vector([min(p[i] for p in points) for i in range(3)])
high = Vector([max(p[i] for p in points) for i in range(3)])
offset = Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))
# Same presentation height as the Minitel copy, so anchors and camera framing stay comparable.
scale = 2.4 / (high.z - low.z)
transform = Matrix.Diagonal((scale, scale, scale, 1)) @ Matrix.Translation(-offset)
for obj in objects:
    obj.data.transform(transform)
    obj.data.update()
names = {'TV_2': 'Television_Front', 'Wood': 'Television_Cabinet', 'embelm': 'Television_Emblem',
         'TVFeet': 'Television_Feet', 'TVScreen': 'Minitel_Screen'}
for obj in objects:
    material = obj.data.materials[0].name if obj.data.materials else ''
    obj.name = obj.data.name = names.get(material, obj.name)
# The CRT keeps its slight curvature; planar UVs map the dynamic Canvas texture onto it.
screen = bpy.data.objects['Minitel_Screen']
coords = [v.co for v in screen.data.vertices]
xs = [c.x for c in coords]; zs = [c.z for c in coords]
for layer in list(screen.data.uv_layers):
    screen.data.uv_layers.remove(layer)
uv = screen.data.uv_layers.new(name='UVMap')
for loop in screen.data.loops:
    co = screen.data.vertices[loop.vertex_index].co
    uv.data[loop.index].uv = ((co.x - min(xs)) / (max(xs) - min(xs)), (co.z - min(zs)) / (max(zs) - min(zs)))
screen.data.materials.clear()
material = bpy.data.materials.new('Screen_Dynamic')
material.diffuse_color = (.015, .025, .02, 1)
screen.data.materials.append(material)
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT / 'television-1950.glb'), export_format='GLB', use_selection=True, export_yup=True)
report = {'source': SOURCE.name, 'scale': scale,
          'screen': {'width': max(xs) - min(xs), 'height': max(zs) - min(zs), 'center_x': (max(xs) + min(xs)) / 2, 'center_z': (max(zs) + min(zs)) / 2},
          'meshes': sorted(o.name for o in objects)}
(WEB / 'docs' / 'asset-audit' / 'television-1950.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('PREPARED_TELEVISION', json.dumps(report))
