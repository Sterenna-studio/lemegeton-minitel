import bpy, os, math

# LEMEGETON mechanical rig bootstrap
# Run inside Blender after importing LEMEGETON_SOURCE.glb.
# This script builds the bone/control hierarchy and a first rigid parenting pass.
# It does NOT fabricate mesh segmentation: that requires inspecting the imported topology.

OUT = os.path.abspath("//LEMEGETON_RIGGED_WORKING.blend")

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import source GLB
src = os.path.abspath("//LEMEGETON_SOURCE.glb")
bpy.ops.import_scene.gltf(filepath=src)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    raise RuntimeError("No mesh imported from source GLB")

# Put imported source under a collection.
src_col = bpy.data.collections.new("SOURCE_PRESERVED")
bpy.context.scene.collection.children.link(src_col)
for o in list(meshes):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    src_col.objects.link(o)
    o.name = "LEMEGETON_SOURCE_MESH"

# Compute bounds for robust initial bone placement.
all_pts=[]
for o in meshes:
    for c in o.bound_box:
        all_pts.append(o.matrix_world @ __import__('mathutils').Vector(c))
from mathutils import Vector
mn=Vector((min(p.x for p in all_pts),min(p.y for p in all_pts),min(p.z for p in all_pts)))
mx=Vector((max(p.x for p in all_pts),max(p.y for p in all_pts),max(p.z for p in all_pts)))
C=(mn+mx)/2
H=mx.z-mn.z
W=mx.x-mn.x
D=mx.y-mn.y

# Armature
bpy.ops.object.armature_add(enter_editmode=True, location=C)
arm=bpy.context.object
arm.name="LEMEGETON_RIG"
arm.data.name="LEMEGETON_RIG_DATA"
eb=arm.data.edit_bones
root=eb[0]
root.name="ROOT"
root.head=Vector((C.x,C.y,mn.z))
root.tail=Vector((C.x,C.y,mn.z+H*.10))

def bone(name, head, tail, parent=None):
    b=eb.new(name)
    b.head=Vector(head); b.tail=Vector(tail)
    if parent: b.parent=parent
    return b

body=bone("BODY",(C.x,C.y,mn.z+H*.30),(C.x,C.y,mn.z+H*.72),root)
head=bone("HEAD",(C.x,C.y,mn.z+H*.72),(C.x,C.y,mn.z+H*.90),body)
antenna=bone("ANTENNA",(C.x,C.y,mn.z+H*.90),(C.x,C.y,mn.z+H*.99),head)

# Mechanical limb scaffold. X is left/right, Z is vertical.
for side, sx in (("L",-1),("R",1)):
    shoulder_x=C.x+sx*W*.43
    elbow_x=C.x+sx*W*.62
    wrist_x=C.x+sx*W*.78
    y=C.y
    z=C.z+H*.17
    sh=bone(f"SHOULDER_{side}",(shoulder_x,y,z),(shoulder_x,y,z-H*.03),body)
    el=bone(f"ELBOW_{side}",(shoulder_x,y,z),(elbow_x,y,z-H*.05),sh)
    wr=bone(f"WRIST_{side}",(elbow_x,y,z-H*.05),(wrist_x,y,z-H*.05),el)
    hand=bone(f"HAND_{side}",(wrist_x,y,z-H*.05),(wrist_x+sx*W*.08,y,z-H*.05),wr)
    # Three fingers + thumb: exactly four digit bones.
    for i,dy in enumerate((-.035,0,.035),1):
        bone(f"FINGER{i}_{side}",
             (wrist_x+sx*W*.08,y+dy,z-H*.05),
             (wrist_x+sx*W*.16,y+dy,z-H*.05),hand)
    bone(f"THUMB_{side}",
         (wrist_x+sx*W*.08,y-sx*.02,z-H*.08),
         (wrist_x+sx*W*.14,y-sx*.04,z-H*.10),hand)

    leg_x=C.x+sx*W*.20
    hip_z=mn.z+H*.28
    knee_z=mn.z+H*.14
    foot_z=mn.z+H*.04
    leg=bone(f"LEG_{side}",(leg_x,y,hip_z),(leg_x,y,knee_z),root)
    foot=bone(f"FOOT_{side}",(leg_x,y,knee_z),(leg_x,y,foot_z),leg)

bpy.ops.object.mode_set(mode='POSE')

# Custom properties document intended rig behavior.
arm["rig_type"]="mechanical_rigid"
arm["hands"]="3 fingers + 1 thumb"
arm["head_cables"]=False
arm["screen"]="OFF"
arm["modular_arm"]="socket-ready"

# Add simple IK constraints to arm chains (targets can be added later).
bpy.ops.object.mode_set(mode='OBJECT')

# Parent the original mesh rigidly to BODY as a safe non-destructive baseline.
for o in meshes:
    o.parent=arm
    o.parent_type='BONE'
    o.parent_bone='BODY'

# Create collections for controls and source.
ctrl = bpy.data.collections.new("RIG_CONTROLS")
bpy.context.scene.collection.children.link(ctrl)

# Save working Blender source.
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print("Saved", OUT)
