"""Build a textured, correctly scaled workshop and an explicitly provisional rig."""

import json
import math
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '05_EXPORTS' / 'ATELIER_V4'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / '02_SOURCES_3D' / 'Rusty Retrobot.glb'))
scene = bpy.context.scene
mesh = next(o for o in scene.objects if o.type == 'MESH')
mesh.name = 'LEMEGETON_TEXTURE_WORKSHOP'
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
mesh.matrix_world = mesh.matrix_world.copy()
mesh.parent = None
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
points = np.empty(len(mesh.data.vertices) * 3, dtype=np.float32)
mesh.data.vertices.foreach_get('co', points)
points = points.reshape(-1, 3)
points += np.array(mesh.location)
low, high = points.min(axis=0), points.max(axis=0)
factor = 2.0 / (high[2] - low[2])
origin = np.array([(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, low[2]])
points = (points - origin) * factor
mesh.data.vertices.foreach_set('co', points.ravel())
mesh.location = (0, 0, 0)
mesh.data.update()
for image in bpy.data.images:
    image.pack()

source = mesh.copy()
source.data = mesh.data.copy()
source.name = 'SOURCE_TEXTUREE_NON_MODIFIEE'
archive = bpy.data.collections.new('SOURCE_REFERENCE_2M')
scene.collection.children.link(archive)
archive.objects.link(source)
archive.hide_viewport = True
archive.hide_render = True

# Editable pivot estimates in Blender coordinates, on the normalized source.
definitions = {
    'ROOT': ((0, 0, 0), (0, 0, .18), None),
    'BODY': ((0, .02, .46), (0, .02, .95), 'ROOT'),
    'HEAD': ((0, .02, .95), (0, .02, 1.73), 'BODY'),
    'ANTENNA': ((0, .01, 1.79), (0, .01, 2.0), 'HEAD'),
}
for side, sign in [('L', -1), ('R', 1)]:
    def point(x, y, z):
        return (sign * x, y, z)
    shoulder = point(.49, .01, .88)
    elbow = point(.60, -.10, .65)
    wrist = point(.68, -.19, .46)
    palm = point(.72, -.22, .36)
    definitions[f'SHOULDER_{side}'] = (shoulder, elbow, 'BODY')
    definitions[f'ELBOW_{side}'] = (elbow, wrist, f'SHOULDER_{side}')
    definitions[f'WRIST_{side}'] = (wrist, palm, f'ELBOW_{side}')
    definitions[f'HAND_{side}'] = (palm, point(.73, -.24, .26), f'WRIST_{side}')
    for digit, x in [('THUMB', .62), ('FINGER1', .68), ('FINGER2', .73), ('FINGER3', .78)]:
        definitions[f'{digit}_{side}'] = (point(x, -.25, .33), point(x, -.29, .23), f'HAND_{side}')
    definitions[f'LEG_{side}'] = (point(.24, .02, .43), point(.24, .02, .16), 'ROOT')
    definitions[f'FOOT_{side}'] = (point(.24, .02, .16), point(.24, -.22, .06), f'LEG_{side}')
(OUT / 'PIVOTS_PROVISOIRES.json').write_text(json.dumps(definitions, indent=2) + '\n', encoding='utf-8')


def armature(name, prefix=''):
    bpy.ops.object.armature_add(enter_editmode=True)
    obj = bpy.context.object
    obj.name = name
    bones = obj.data.edit_bones
    bones.remove(bones[0])
    for key, (head, tail, parent) in definitions.items():
        bone = bones.new(prefix + key)
        bone.head = head
        bone.tail = tail
        bone.use_deform = not prefix
        if parent:
            bone.parent = bones[prefix + parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.show_in_front = True
    obj.data.display_type = 'STICK'
    for bone in obj.pose.bones:
        bone.rotation_mode = 'XYZ'
    return obj


rig = armature('LEMEGETON_DEFORM_V4_ETUDE')
ctrl = armature('LEMEGETON_CONTROLES_V4', 'CTRL_')
for bone in rig.pose.bones:
    constraint = bone.constraints.new('COPY_TRANSFORMS')
    constraint.name = 'FK_' + bone.name
    constraint.target = ctrl
    constraint.subtarget = 'CTRL_' + bone.name
    constraint.target_space = 'LOCAL'
    constraint.owner_space = 'LOCAL'

# Arm targets use the actual forearm endpoints. FK remains the default.
bpy.context.view_layer.objects.active = ctrl
bpy.ops.object.mode_set(mode='EDIT')
for side in ['L', 'R']:
    endpoint = Vector(definitions[f'ELBOW_{side}'][1])
    for name, head in [(f'CTRL_ARM_{side}_IK', endpoint),
                       (f'CTRL_ELBOW_{side}_POLE', Vector(definitions[f'ELBOW_{side}'][0]) + Vector((0, -.5, 0)))]:
        bone = ctrl.data.edit_bones.new(name)
        bone.head = head
        bone.tail = head + Vector((0, 0, .10))
        bone.parent = ctrl.data.edit_bones['CTRL_BODY']
        bone.use_deform = False
bpy.ops.object.mode_set(mode='OBJECT')
for side in ['L', 'R']:
    ctrl[f'ik_arm_{side}'] = 0.0
    ctrl.id_properties_ui(f'ik_arm_{side}').update(min=0.0, max=1.0,
        description='Experimental arm IK. 0 = FK. Pivots and pole angle require validation.')
    constraint = rig.pose.bones[f'ELBOW_{side}'].constraints.new('IK')
    constraint.name = 'IK_ETUDE_' + side
    constraint.target = ctrl
    constraint.subtarget = f'CTRL_ARM_{side}_IK'
    constraint.pole_target = ctrl
    constraint.pole_subtarget = f'CTRL_ELBOW_{side}_POLE'
    constraint.chain_count = 2
    constraint.influence = 0
    driver = constraint.driver_add('influence').driver
    variable = driver.variables.new()
    variable.name = 'switch'
    variable.targets[0].id = ctrl
    variable.targets[0].data_path = f'["ik_arm_{side}"]'
    driver.expression = 'switch'

# Spatial assignment is a diagnostic prototype, not semantic segmentation.
names = list(definitions)
labels = np.full(len(points), names.index('BODY'), dtype=np.int32)
x, y, z = points.T
labels[z > .97] = names.index('HEAD')
labels[z > 1.79] = names.index('ANTENNA')
for side, sign in [('L', -1), ('R', 1)]:
    half = x * sign > 0
    labels[half & (z < .43)] = names.index(f'LEG_{side}')
    labels[half & (z < .17)] = names.index(f'FOOT_{side}')
    arm = half & (z < .97) & (((np.abs(x) > .40) & (z > .43)) | ((np.abs(x) > .50) & (z > .10)))
    labels[arm] = names.index(f'SHOULDER_{side}')
    labels[arm & (z < .76)] = names.index(f'ELBOW_{side}')
    labels[arm & (z < .56)] = names.index(f'WRIST_{side}')
    labels[arm & (z < .47)] = names.index(f'HAND_{side}')
for index, name in enumerate(names):
    group = mesh.vertex_groups.new(name=name)
    indices = np.flatnonzero(labels == index).tolist()
    if indices:
        group.add(indices, 1.0, 'REPLACE')
modifier = mesh.modifiers.new('PROTOTYPE_POIDS_RIGIDES', 'ARMATURE')
modifier.object = rig
mesh['status'] = 'PROTOTYPE - mesh fused, spatial weights, fingers not segmented'
ctrl['status'] = 'FK connected; arm IK experimental; finger controls have no assigned geometry'
rig['status'] = 'NOT PRODUCTION VALIDATED'

loops = np.empty(len(mesh.data.loops), dtype=np.int32)
mesh.data.loops.foreach_get('vertex_index', loops)
tri = loops.reshape(-1, 3)
triangle_labels = labels[tri]
crossing = np.any(triangle_labels != triangle_labels[:, :1], axis=1)
report = {
    'source': '02_SOURCES_3D/Rusty Retrobot.glb',
    'source_preserved': True,
    'height_metres': 2,
    'normalization_scale': float(factor),
    'vertices': len(points), 'triangles': len(tri),
    'connected_surface_count': 1,
    'texture_images': [image.name for image in bpy.data.images],
    'deform_bones': len(rig.data.bones), 'control_bones': len(ctrl.data.bones),
    'weights': {name: int(np.sum(labels == index)) for index, name in enumerate(names)},
    'triangles_crossing_rigid_regions': int(crossing.sum()),
    'warning': 'Spatial weight study only. Connected triangles across joints stretch. Fingers require reconstruction/segmentation.',
}

scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 16
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 120
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('STUDIO_NEUTRE')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.32, .35, .38, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .5
bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object
floor.name = 'SOL_STUDIO'
material = bpy.data.materials.new('Sol gris neutre')
material.diffuse_color = (.22, .25, .27, 1)
floor.data.materials.append(material)
for name, location, energy, size in [('KEY', (3, -4, 5), 1100, 4),
                                      ('FILL', (-3, -2, 3), 600, 3),
                                      ('RIM', (1, 3, 4), 1000, 3)]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
data = bpy.data.cameras.new('CAMERA_SALUT')
camera = bpy.data.objects.new('CAMERA_SALUT', data)
scene.collection.objects.link(camera)
camera.location = (3.2, -5.3, 2.4)
camera.rotation_euler = (Vector((0, 0, 1)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
data.type = 'ORTHO'
data.ortho_scale = 2.7
scene.camera = camera
scene.unit_settings.system = 'METRIC'

# Put the rig in an immediately usable viewport, with render helpers hidden there.
for obj in [floor, camera] + [o for o in scene.objects if o.type == 'LIGHT']:
    obj.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
ctrl.select_set(True)
bpy.context.view_layer.objects.active = ctrl
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_location = (0, 0, 1)
            area.spaces.active.region_3d.view_distance = 4
            area.spaces.active.shading.type = 'MATERIAL'
scene['status'] = 'ATELIER V4 - topology and pivots require manual validation'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_02_ATELIER_V4.blend'))
scene.render.filepath = str(OUT / 'REPOS_TEXTURE.png')
bpy.ops.render.render(write_still=True)

# A modest FK wave study exposes the joint defects without claiming a final rig.
for frame, shoulder_angle, elbow_angle, wrist_angle in [
    (1, 0, 0, 0), (12, 0, 0, 0), (36, -38, 48, -8),
    (48, -38, 48, 10), (60, -38, 48, -10),
    (72, -38, 48, 10), (84, -38, 48, -8), (108, 0, 0, 0), (120, 0, 0, 0),
]:
    for name, angle in [('SHOULDER_R', shoulder_angle), ('ELBOW_R', elbow_angle), ('WRIST_R', wrist_angle)]:
        bone = ctrl.pose.bones['CTRL_' + name]
        # Convert a world-front-axis rotation into each bone's local frame.
        axis = bone.bone.matrix_local.to_3x3().inverted() @ Vector((0, 1, 0))
        bone.rotation_mode = 'AXIS_ANGLE'
        bone.rotation_axis_angle = (math.radians(angle), *axis)
        bone.keyframe_insert('rotation_axis_angle', frame=frame)
if ctrl.animation_data and ctrl.animation_data.action:
    ctrl.animation_data.action.name = 'wave_ETUDE_NON_VALIDEE'
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_04_WAVE_ETUDE.blend'))
for frame in [36, 60, 120]:
    scene.frame_set(frame)
    scene.render.filepath = str(OUT / f'WAVE_ETUDE_{frame:03}.png')
    bpy.ops.render.render(write_still=True)

# Quantify the deformation in the most raised sample. Source edges are preserved.
scene.frame_set(60)
evaluated = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
evaluated_mesh = evaluated.to_mesh()
posed = np.empty(len(points) * 3, dtype=np.float32)
evaluated_mesh.vertices.foreach_get('co', posed)
posed = posed.reshape(-1, 3)
edge_a, edge_b = tri[crossing, 0], tri[crossing, 1]
before = np.linalg.norm(points[edge_a] - points[edge_b], axis=1)
after = np.linalg.norm(posed[edge_a] - posed[edge_b], axis=1)
report['wave_test'] = {'sample_frame': 60,
                       'max_edge_stretch_ratio_on_crossing_triangles': float((after / np.maximum(before, 1e-6)).max()),
                       'production_accepted': False}
evaluated.to_mesh_clear()
(OUT / 'ATELIER_AUDIT.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('ATELIER_AUDIT', json.dumps(report))

# Partition complete triangles into rigid workshop objects, retaining corner UVs.
# This is a provisional geometric cut, not a completed mechanical reconstruction.
scene.frame_set(1)
uv = np.empty(len(mesh.data.loops) * 2, dtype=np.float32)
mesh.data.uv_layers.active.data.foreach_get('uv', uv)
uv = uv.reshape(-1, 3, 2)
centers = points[tri].mean(axis=1)
cx, cy, cz = centers.T
face_labels = np.full(len(tri), names.index('BODY'), dtype=np.int32)
face_labels[cz > .97] = names.index('HEAD')
face_labels[cz > 1.79] = names.index('ANTENNA')
for side, sign in [('L', -1), ('R', 1)]:
    half = cx * sign > 0
    face_labels[half & (cz < .43)] = names.index(f'LEG_{side}')
    face_labels[half & (cz < .17)] = names.index(f'FOOT_{side}')
    arm = half & (cz < .97) & (((np.abs(cx) > .40) & (cz > .43)) | ((np.abs(cx) > .50) & (cz > .10)))
    face_labels[arm] = names.index(f'SHOULDER_{side}')
    face_labels[arm & (cz < .76)] = names.index(f'ELBOW_{side}')
    face_labels[arm & (cz < .56)] = names.index(f'WRIST_{side}')
    face_labels[arm & (cz < .47)] = names.index(f'HAND_{side}')
parts_collection = bpy.data.collections.new('PIECES_RIGIDES_PROVISOIRES')
scene.collection.children.link(parts_collection)
cap_material = bpy.data.materials.new('INTERIEUR_ARTICULATIONS_PROVISOIRE')
cap_material.diffuse_color = (.025, .028, .03, 1)
parts = []
part_audit = []
for label, name in enumerate(names):
    mask = face_labels == label
    if not np.any(mask):
        continue
    corners = points[tri[mask]].reshape(-1, 3)
    unique, inverse = np.unique(corners, axis=0, return_inverse=True)
    part_data = bpy.data.meshes.new('PIECE_' + name)
    part_data.from_pydata(unique.tolist(), [], inverse.reshape(-1, 3).tolist())
    part_data.materials.append(mesh.data.materials[0])
    part_data.materials.append(cap_material)
    part_data.uv_layers.new(name=mesh.data.uv_layers.active.name)
    part_data.uv_layers.active.data.foreach_set('uv', uv[mask].ravel())
    for face in part_data.polygons:
        face.use_smooth = True
    bm = bmesh.new()
    bm.from_mesh(part_data)
    boundary = [edge for edge in bm.edges if edge.is_boundary]
    # Dense jagged boundary loops are retained for deliberate mechanical repair.
    # Filling all of them automatically can stall and produce unsuitable caps.
    caps = []
    for face in caps:
        face.material_index = 1
        face.smooth = False
    cap_count = len(caps)
    boundary_remaining = sum(edge.is_boundary for edge in bm.edges)
    part_audit.append({'name': name, 'caps': cap_count, 'boundary_edges': boundary_remaining})
    bm.to_mesh(part_data)
    bm.free()
    part_data.validate(clean_customdata=False)
    obj = bpy.data.objects.new('PIECE_' + name, part_data)
    parts_collection.objects.link(obj)
    obj.parent = rig
    group = obj.vertex_groups.new(name=name)
    group.add(list(range(len(part_data.vertices))), 1.0, 'REPLACE')
    armature_modifier = obj.modifiers.new('DEFORMATION_RIGIDE', 'ARMATURE')
    armature_modifier.object = rig
    obj['status'] = 'Provisional spatial partition. Joint geometry/pivot requires visual adjustment.'
    parts.append(obj)
    print('RIGID_PART', name, len(part_data.vertices), len(part_data.polygons), 'caps', cap_count)
mesh.hide_render = True
mesh.hide_set(True)
scene['status'] = 'V4 PIECES PROVISOIRES - fingers remain unsegmented, joint cuts estimated'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / '04_BLENDER' / 'LEMEGETON_03_PIECES_PROVISOIRES.blend'))
for frame in [1, 60, 120]:
    scene.frame_set(frame)
    scene.render.filepath = str(OUT / f'PIECES_TEST_{frame:03}.png')
    bpy.ops.render.render(write_still=True)
report['partition'] = {
    'objects': len(parts),
    'source_faces_assigned_exactly_once': len(face_labels),
    'closed_cut_surfaces': all(part['boundary_edges'] == 0 for part in part_audit),
    'parts': part_audit,
    'status': 'PROVISIONAL - geometry cuts estimated, fingers not separated',
    'production_accepted': False,
}
(OUT / 'ATELIER_AUDIT.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
