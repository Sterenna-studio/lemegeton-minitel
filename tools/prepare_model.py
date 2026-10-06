"""Create an oriented web copy. Original GLB is never overwritten."""
import json
import math
from pathlib import Path
import sys
import bpy
import bmesh
from mathutils import Matrix, Vector

# Usage: blender --background --python tools/<script>.py [-- <minitel_1982-france.glb>]
WEB = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else WEB / 'lemegeton' / '06_MODEL' / 'minitel_1982-france.glb'
OUT = WEB / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
rotation = Matrix.Rotation(math.radians(-110), 4, 'Z')
for obj in objects:
    world = rotation @ obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = Matrix.Identity(4)
    obj.data.transform(world)
body = bpy.data.objects['Object_28']
points = [v.co for v in body.data.vertices]
low = Vector([min(v[i] for v in points) for i in range(3)])
high = Vector([max(v[i] for v in points) for i in range(3)])
offset = Vector(((low.x+high.x)/2, (low.y+high.y)/2, min(v.co.z for o in objects for v in o.data.vertices)))
scale = 2.4/(high.z-offset.z)
transform = Matrix.Diagonal((scale,scale,scale,1)) @ Matrix.Translation(-offset)
report = []
for obj in objects:
    obj.data.transform(transform)
    obj.data.update()
    p = [v.co for v in obj.data.vertices]
    bounds = [[min(v[i] for v in p) for i in range(3)], [max(v[i] for v in p) for i in range(3)]]
    faces = sorted(obj.data.polygons, key=lambda f:f.area, reverse=True)[:8]
    report.append({'name':obj.name,'bounds':bounds,'material':[m.name for m in obj.data.materials],
                   'uv_center': [sum(l.uv[i] for l in obj.data.uv_layers.active.data)/len(obj.data.uv_layers.active.data) for i in range(2)] if obj.data.uv_layers.active else None,
                   'faces':[{'area':f.area,'center':list(f.center),'normal':list(f.normal),
                             'points':[list(obj.data.vertices[i].co) for i in f.vertices]} for f in faces]})
# The two largest triangles in this asset are the photographed CRT rectangle.
front = bpy.data.objects['Object_73']
screen_faces = sorted(front.data.polygons, key=lambda f:f.area, reverse=True)[:2]
indices = sorted({i for f in screen_faces for i in f.vertices})
lookup = {old:new for new,old in enumerate(indices)}
screen_data = bpy.data.meshes.new('Minitel_Screen')
screen_data.from_pydata([front.data.vertices[i].co for i in indices], [],
                       [[lookup[i] for i in f.vertices] for f in screen_faces])
screen = bpy.data.objects.new('Minitel_Screen', screen_data)
bpy.context.scene.collection.objects.link(screen)
uv = screen_data.uv_layers.new(name='UVMap')
coords = [v.co for v in screen_data.vertices]
xs = [v.x for v in coords]; zs = [v.z for v in coords]
for p in screen_data.polygons:
    for li in p.loop_indices:
        v = screen_data.vertices[screen_data.loops[li].vertex_index].co
        uv.data[li].uv = ((v.x-min(xs))/(max(xs)-min(xs)), (v.z-min(zs))/(max(zs)-min(zs)))
mat = bpy.data.materials.new('Screen_Dynamic')
mat.diffuse_color = (.015,.025,.02,1)
screen_data.materials.append(mat)
bm = bmesh.new(); bm.from_mesh(front.data); bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.faces[f.index] for f in screen_faces], context='FACES')
bm.to_mesh(front.data); bm.free()
body.name = 'Minitel_Body'
front.name = 'Minitel_Bezel'
objects.append(screen)
bpy.ops.object.select_all(action='DESELECT')
for obj in objects: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT / 'minitel.glb'), export_format='GLB', use_selection=True, export_yup=True)
(WEB / 'docs' / 'asset-audit' / 'normalized.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('PREPARED_WEB_MODEL', scale)
