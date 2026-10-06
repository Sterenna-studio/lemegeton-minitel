"""Render local sources in Blender and record their actual imported structure."""

import json
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '05_EXPORTS' / 'AUDIT_SOURCES'
OUT.mkdir(parents=True, exist_ok=True)
REPORT = []


def camera_at(scene, center, height, direction):
    data = bpy.data.cameras.new('AuditCamera')
    camera = bpy.data.objects.new('AuditCamera', data)
    scene.collection.objects.link(camera)
    camera.location = center + Vector(direction).normalized() * height * 3
    camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.type = 'ORTHO'
    data.ortho_scale = height * 1.35
    data.clip_end = height * 20
    scene.camera = camera
    return camera


for stem, source in [
    ('MASTER', ROOT / '02_SOURCES_3D' / 'LEMEGETON_MASTER_SOURCE.glb'),
    ('RUSTY_TEXTURE', ROOT / '02_SOURCES_3D' / 'Rusty Retrobot.glb'),
    ('SAMPLE', ROOT / '02_SOURCES_3D' / 'sample_2026-10-04T011302.925.glb'),
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    scene = bpy.context.scene
    meshes = [o for o in scene.objects if o.type == 'MESH']
    points = [o.matrix_world @ Vector(corner) for o in meshes for corner in o.bound_box]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center = (low + high) / 2
    height = max(high - low)
    camera = camera_at(scene, center, height, (3, -5, 2.0))
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = 16
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.world = bpy.data.worlds.new('NeutralWorld')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.35, .38, .4, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .6
    for name, position, energy, size in [
        ('Key', (3, -4, 5), 600, 4),
        ('Fill', (-3, -2, 2), 300, 3),
        ('Rim', (2, 4, 4), 500, 3),
    ]:
        light = bpy.data.lights.new(name, 'AREA')
        light.energy = energy * height ** 2
        light.shape = 'DISK'
        light.size = size * height
        obj = bpy.data.objects.new(name, light)
        scene.collection.objects.link(obj)
        obj.location = center + Vector(position) * height
        obj.rotation_euler = (center - obj.location).to_track_quat('-Z', 'Y').to_euler()
    scene.view_settings.view_transform = 'AgX'
    entry = {
        'file': str(source.relative_to(ROOT)),
        'bbox_min': list(low), 'bbox_max': list(high),
        'meshes': [{'name': o.name, 'vertices': len(o.data.vertices),
                    'polygons': len(o.data.polygons),
                    'uv_layers': len(o.data.uv_layers)} for o in meshes],
        'materials': [m.name for m in bpy.data.materials],
        'images': [{'name': image.name, 'size': list(image.size)} for image in bpy.data.images],
    }
    for view, direction in [('THREE_QUARTER', (3, -5, 2)), ('FRONT', (0, -1, 0)),
                            ('BACK', (0, 1, 0)), ('SIDE', (1, 0, 0))]:
        camera.location = center + Vector(direction).normalized() * height * 3
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(OUT / f'{stem}_{view}.png')
        bpy.ops.render.render(write_still=True)
    REPORT.append(entry)
    (OUT / 'SOURCE_AUDIT.json').write_text(json.dumps(REPORT, indent=2) + '\n', encoding='utf-8')
    print('SOURCE_AUDITED', json.dumps(entry))
