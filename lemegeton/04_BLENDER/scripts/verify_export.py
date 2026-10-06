"""Reimport the GLB and compare animated bounds to the baked Blender scene."""

import json
from pathlib import Path
import struct

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '05_EXPORTS' / 'ATELIER_V4'
FILE = OUT / 'LEMEGETON_WAVE_ETUDE.glb'
raw = FILE.read_bytes()
length = struct.unpack_from('<I', raw, 12)[0]
document = json.loads(raw[20:20 + length])
assert len(document['meshes']) == 15
assert len(document['skins']) == 1
assert len(document['skins'][0]['joints']) == 24
assert len(document['animations']) == 1
assert len(document['images']) == 3
duration = max(document['accessors'][s['input']]['max'][0]
               for s in document['animations'][0]['samplers'])
assert abs(duration - 5) < .00001
for accessor in document['accessors']:
    if 'bufferView' not in accessor:
        continue
    view = document['bufferViews'][accessor['bufferView']]
    components = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[accessor['type']]
    size = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}[accessor['componentType']]
    stride = view.get('byteStride', components * size)
    required = accessor.get('byteOffset', 0) + (accessor['count'] - 1) * stride + components * size
    assert required <= view['byteLength'], (required, view['byteLength'])


def bounds():
    result = {}
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH' or not obj.name.startswith('PIECE_'):
            continue
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        values = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
        mesh.vertices.foreach_get('co', values)
        matrix = np.array(evaluated.matrix_world)
        world = values.reshape(-1, 3) @ matrix[:3, :3].T + matrix[:3, 3]
        result[obj.name] = np.array([world.min(axis=0), world.max(axis=0)])
        evaluated.to_mesh_clear()
    return result


bpy.ops.wm.open_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_05_EXPORT_ETUDE.blend'))
expected = {}
for frame in [1, 61, 121]:
    bpy.context.scene.frame_set(frame)
    expected[frame] = bounds()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 24
bpy.ops.import_scene.gltf(filepath=str(FILE))
imported_start = min(float(action.frame_range[0]) for action in bpy.data.actions)
errors = {}
for frame, reference in expected.items():
    # glTF starts at time zero; Blender imports that at frame zero, not frame one.
    bpy.context.scene.frame_set(round(imported_start + frame - 1))
    actual = bounds()
    assert actual.keys() == reference.keys(), (actual.keys(), reference.keys())
    errors[frame] = max(float(np.abs(actual[name] - box).max()) for name, box in reference.items())
assert max(errors.values()) < .0002, errors
result = {
    'meshes': 15, 'skin_joints': 24, 'animations': 1,
    'clip_name': document['animations'][0]['name'],
    'clip_duration_seconds': duration, 'textures': 3,
    'imported_start_frame': imported_start,
    'bounds_error_metres_by_frame': errors,
    'accessor_bounds_valid': True,
    'roundtrip_blender_passed': True,
    'browser_playback_tested': False,
    'production_validated': False,
}
(OUT / 'EXPORT_VERIFICATION.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print('EXPORT_ROUNDTRIP_VERIFIED', json.dumps(result))
