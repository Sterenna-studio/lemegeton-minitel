import bpy, os

# Open the rigged GLB and make the armature easy to inspect.
# File expected next to this script.
path=os.path.abspath(os.path.join(os.path.dirname(__file__),"LEMEGETON_RIGGED_v1.glb"))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)

rig=next((o for o in bpy.context.scene.objects if o.type=="ARMATURE"),None)
if rig:
    rig.show_in_front=True
    rig.data.display_type='BBONE'
    bpy.context.view_layer.objects.active=rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='POSE')
    for b in rig.pose.bones:
        b.rotation_mode='XYZ'
    bpy.ops.object.mode_set(mode='OBJECT')

# Save editable Blender scene.
out=os.path.abspath(os.path.join(os.path.dirname(__file__),"LEMEGETON_RIG_V1_INSPECTION.blend"))
bpy.ops.wm.save_as_mainfile(filepath=out)
print("Saved:",out)
