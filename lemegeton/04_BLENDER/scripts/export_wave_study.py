"""Bake and export a five-second rigid-parts study, never a production claim."""

import json
import math
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '05_EXPORTS' / 'ATELIER_V4'
FRAMES = OUT / 'WAVE_ETUDE_FRAMES'
FRAMES.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_03_PIECES_PROVISOIRES.blend'))
scene = bpy.context.scene
rig = bpy.data.objects['LEMEGETON_DEFORM_V4_ETUDE']
ctrl = bpy.data.objects['LEMEGETON_CONTROLES_V4']
parts = list(bpy.data.collections['PIECES_RIGIDES_PROVISOIRES'].objects)
ctrl.animation_data_clear()
for bone in ctrl.pose.bones:
    bone.matrix_basis.identity()
for frame, shoulder, elbow, wrist in [
    (1, 0, 0, 0), (12, 0, 0, 0), (36, -45, -65, -5),
    (48, -45, -65, 12), (60, -45, -65, -12),
    (72, -45, -65, 12), (84, -45, -65, -5),
    (108, 0, 0, 0), (120, 0, 0, 0), (121, 0, 0, 0),
]:
    for name, angle in [('SHOULDER_R', shoulder), ('ELBOW_R', elbow), ('WRIST_R', wrist)]:
        bone = ctrl.pose.bones['CTRL_' + name]
        axis = bone.bone.matrix_local.to_3x3().inverted() @ Vector((0, 1, 0))
        bone.rotation_mode = 'AXIS_ANGLE'
        bone.rotation_axis_angle = (math.radians(angle), *axis)
        bone.keyframe_insert('rotation_axis_angle', frame=frame)
ctrl.animation_data.action.name = 'wave_ETUDE_PIECES'
scene.frame_set(1)
scene.frame_end = 120
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_04_WAVE_PIECES_ETUDE.blend'))

before = {}
for frame in [1, 36, 60, 120, 121]:
    scene.frame_set(frame)
    before[frame] = {bone.name: np.array(bone.matrix) for bone in rig.pose.bones}
scene.frame_end = 121
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.nla.bake(frame_start=1, frame_end=121, step=1, only_selected=False,
                visual_keying=True, clear_constraints=True, use_current_action=False,
                bake_types={'POSE'})
rig.animation_data.action.name = 'wave_ETUDE_5S'
error = 0
for frame, matrices in before.items():
    scene.frame_set(frame)
    error = max(error, max(float(np.abs(np.array(rig.pose.bones[name].matrix) - matrix).max())
                           for name, matrix in matrices.items()))
assert error < .0001, error
assert not any(bone.constraints for bone in rig.pose.bones)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_05_EXPORT_ETUDE.blend'))
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(OUT / 'LEMEGETON_WAVE_ETUDE.glb'),
                         export_format='GLB', use_selection=True,
                         export_animations=True, export_animation_mode='ACTIVE_ACTIONS',
                         export_force_sampling=True, export_def_bones=True,
                         export_anim_slide_to_zero=True, export_extras=True)
(OUT / 'BAKE_VERIFICATION.json').write_text(json.dumps({
    'max_pose_matrix_difference_after_bake': error,
    'frames': [1, 121], 'fps': 24, 'clip_duration_seconds': 5,
    'constraints_after_bake': 0,
    'status': 'ETUDE - not production; joint cuts and fingers require further work',
}, indent=2) + '\n', encoding='utf-8')
print('BAKE_VERIFIED', error)

scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.eevee.taa_render_samples = 8
scene.frame_end = 120
scene.render.filepath = str(FRAMES / 'wave_')
bpy.ops.render.render(animation=True)
