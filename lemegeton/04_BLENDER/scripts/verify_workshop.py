"""Check rest geometry, rigid movement and planted feet in the workshop."""

import json
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '05_EXPORTS' / 'ATELIER_V4'
bpy.ops.wm.open_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_03_PIECES_PROVISOIRES.blend'))
scene = bpy.context.scene
rig = bpy.data.objects['LEMEGETON_DEFORM_V4_ETUDE']
ctrl = bpy.data.objects['LEMEGETON_CONTROLES_V4']
parts = list(bpy.data.collections['PIECES_RIGIDES_PROVISOIRES'].objects)
assert len(rig.data.bones) == 24
assert len(ctrl.data.bones) == 28
assert len(parts) == 15
assert all(not bone.use_deform for bone in ctrl.data.bones)
textures = [image for image in bpy.data.images if image.packed_file]
assert len(textures) == 3
assert all(list(image.size) == [2048, 2048] for image in textures)


def evaluated_coords(obj):
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    values = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get('co', values)
    values = values.reshape(-1, 3)
    evaluated.to_mesh_clear()
    return values


scene.frame_set(1)
rest = {obj.name: evaluated_coords(obj) for obj in parts}
max_rest_delta = 0
for obj in parts:
    original = np.empty(len(obj.data.vertices) * 3, dtype=np.float32)
    obj.data.vertices.foreach_get('co', original)
    max_rest_delta = max(max_rest_delta, float(np.abs(original.reshape(-1, 3) - rest[obj.name]).max()))
assert max_rest_delta < .00001, max_rest_delta

scene.frame_set(60)
max_edge_error = 0
fixed_parts_delta = 0
moving_parts_delta = 0
for obj in parts:
    posed = evaluated_coords(obj)
    edges = np.empty(len(obj.data.edges) * 2, dtype=np.int32)
    obj.data.edges.foreach_get('vertices', edges)
    edges = edges.reshape(-1, 2)
    before = np.linalg.norm(rest[obj.name][edges[:, 0]] - rest[obj.name][edges[:, 1]], axis=1)
    after = np.linalg.norm(posed[edges[:, 0]] - posed[edges[:, 1]], axis=1)
    max_edge_error = max(max_edge_error, float(np.abs(after - before).max()))
    delta = float(np.abs(posed - rest[obj.name]).max())
    if obj.name.endswith(('_L', 'HEAD', 'ANTENNA', 'BODY', 'LEG_R', 'FOOT_R')):
        fixed_parts_delta = max(fixed_parts_delta, delta)
    else:
        moving_parts_delta = max(moving_parts_delta, delta)
assert max_edge_error < .00001, max_edge_error
assert fixed_parts_delta < .00001, fixed_parts_delta
assert moving_parts_delta > .05, moving_parts_delta
scene.frame_set(120)
max_end_delta = max(float(np.abs(evaluated_coords(obj) - rest[obj.name]).max()) for obj in parts)
assert max_end_delta < .00001, max_end_delta

checks = {
    'rest_delta_metres': max_rest_delta,
    'max_rigid_edge_length_error_metres': max_edge_error,
    'feet_body_head_left_arm_delta_metres': fixed_parts_delta,
    'right_arm_movement_metres': moving_parts_delta,
    'return_to_rest_delta_metres': max_end_delta,
    'packed_textures': 3,
    'production_validated': False,
    'remaining': ['joint cut and pivot review', 'independent finger segmentation', 'IK pole review'],
}
(OUT / 'VERIFICATION_ATELIER.json').write_text(json.dumps(checks, indent=2) + '\n', encoding='utf-8')
print('WORKSHOP_VERIFIED', json.dumps(checks))
