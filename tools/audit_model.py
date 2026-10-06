"""Inspect and render a supplied asset without changing the original."""
import json
from pathlib import Path
import sys
import bpy
from mathutils import Vector

# Usage: blender --background --python tools/<script>.py -- <minitel_1982-france.glb>
WEB = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else WEB / 'assets-src' / 'minitel_1982-france.glb'
OUT = WEB / 'docs' / 'asset-audit'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
scene = bpy.context.scene
meshes = [o for o in scene.objects if o.type == 'MESH']
def bounds(obj):
    p = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    return [min(v[i] for v in p) for i in range(3)], [max(v[i] for v in p) for i in range(3)]
allpoints = [o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
low = Vector([min(v[i] for v in allpoints) for i in range(3)])
high = Vector([max(v[i] for v in allpoints) for i in range(3)])
center = (low + high) / 2
size = max(high - low)
report = {'bounds': [list(low), list(high)], 'meshes': [
    {'name': o.name, 'bounds': bounds(o), 'vertices': len(o.data.vertices),
     'triangles': sum(len(p.vertices)-2 for p in o.data.polygons),
     'materials': [m.name for m in o.data.materials]} for o in meshes],
    'images': [{'name': i.name, 'size': list(i.size)} for i in bpy.data.images]}
(OUT / 'model.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 12
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('World')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .7
scene.view_settings.view_transform = 'AgX'
data = bpy.data.cameras.new('Camera')
camera = bpy.data.objects.new('Camera', data)
scene.collection.objects.link(camera)
scene.camera = camera
data.type = 'ORTHO'
data.ortho_scale = size * 1.25
data.clip_end = size * 50
for direction, name in [((0,-1,0),'negY'),((0,1,0),'posY'),((1,0,0),'posX'),((-1,0,0),'negX'),((3,-4,2),'quarter')]:
    camera.location = center + Vector(direction).normalized() * size * 3
    camera.rotation_euler = (center-camera.location).to_track_quat('-Z','Y').to_euler()
    ld = bpy.data.lights.new('Key', 'AREA')
    ld.energy = size**2 * 300
    ld.size = size * 2
    light = bpy.data.objects.new('Key', ld)
    scene.collection.objects.link(light)
    light.location = camera.location + Vector((0,0,size))
    light.rotation_euler = (center-light.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(OUT / (name+'.png'))
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(light, do_unlink=True)
print('AUDIT_COMPLETE', len(meshes), list(low), list(high))
