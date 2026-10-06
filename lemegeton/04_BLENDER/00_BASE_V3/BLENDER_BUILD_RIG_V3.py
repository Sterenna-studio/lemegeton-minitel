import bpy, os, math, sys
from mathutils import Vector

D=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, D)
from repair_v3_glb import repair_glb

GLB=os.path.join(D,"LEMEGETON_RIGGED_V3_BASE.glb")
OUT=os.path.join(D,"LEMEGETON_RIG_V3.blend")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=repair_glb(GLB))

rig=next((o for o in bpy.context.scene.objects if o.type=="ARMATURE"),None)
if not rig: raise RuntimeError("No deform armature found")

rig.name="LEMEGETON_RIG_V3"
rig.show_in_front=True
rig.data.display_type="BBONE"

# Normalize pose-bone rotation modes.
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode="POSE")
for pb in rig.pose.bones:
    pb.rotation_mode="XYZ"
bpy.ops.object.mode_set(mode="OBJECT")

# Create animator controls as a separate armature.
bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0))
ctrl=bpy.context.object
ctrl.name="LEMEGETON_ANIM_CONTROLS"
ctrl.data.name="LEMEGETON_ANIM_CONTROLS_DATA"
eb=ctrl.data.edit_bones
root=eb[0]; root.name="CTRL_ROOT"; root.head=(0,0,0); root.tail=(0,0,.25)

def add(n,h,t,p=None):
    b=eb.new(n); b.head=h; b.tail=t; b.parent=p; return b

body=add("CTRL_BODY",(0,0,.8),(0,0,1.15),root)
head=add("CTRL_HEAD",(0,0,1.35),(0,0,1.65),body)

for s,x in (("L",-1),("R",1)):
    arm=add(f"CTRL_ARM_{s}_IK",(x*1.1,0,1.0),(x*1.4,0,1.0),body)
    pole=add(f"CTRL_ELBOW_{s}_POLE",(x*.75,-.8,1.0),(x*.75,-1.0,1.0),body)
    leg=add(f"CTRL_LEG_{s}_IK",(x*.28,0,.12),(x*.28,0,-.15),root)
    foot=add(f"CTRL_FOOT_{s}",(x*.28,-.2,.05),(x*.28,-.5,.05),leg)
    for i in (1,2,3):
        add(f"CTRL_FINGER{i}_{s}",(x*1.25,(i-2)*.045,.98),(x*1.4,(i-2)*.045,.98),arm)
    add(f"CTRL_THUMB_{s}",(x*1.25,-.06,.93),(x*1.4,-.09,.90),arm)
bpy.ops.object.mode_set(mode="OBJECT")

# Add IK constraints to the deform rig when the named bones exist.
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode="POSE")
pbones=rig.pose.bones

def add_ik(chain_end, target_name, pole_name, chain_len=2):
    if chain_end not in pbones: return
    c=pbones[chain_end].constraints.new("IK")
    c.name="IK_"+chain_end
    c.target=ctrl
    c.subtarget=target_name
    c.chain_count=chain_len
    if pole_name:
        c.pole_target=ctrl
        c.pole_subtarget=pole_name
        c.pole_angle=math.radians(90)

add_ik("WRIST_L","CTRL_ARM_L_IK","CTRL_ELBOW_L_POLE",2)
add_ik("WRIST_R","CTRL_ARM_R_IK","CTRL_ELBOW_R_POLE",2)
add_ik("FOOT_L","CTRL_LEG_L_IK",None,1)
add_ik("FOOT_R","CTRL_LEG_R_IK",None,1)

# Head: a direct controller relationship.
if "HEAD" in pbones:
    c=pbones["HEAD"].constraints.new("COPY_ROTATION")
    c.name="HEAD_CONTROL"
    c.target=ctrl; c.subtarget="CTRL_HEAD"
    c.mix_mode="REPLACE"

# Custom properties for animation/export tooling.
rig["rig_version"]="V3"
rig["mechanical_rig"]=True
rig["screen"]="OFF"
rig["head_cables"]=False
rig["hands"]="3 fingers + 1 thumb"
rig["exploded_amount"]=0.0
ctrl["exploded_amount"]=0.0

bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print("Saved",OUT)
