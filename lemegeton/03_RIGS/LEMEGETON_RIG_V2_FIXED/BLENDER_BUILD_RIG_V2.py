import bpy, os
from mathutils import Vector
D=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(D,"LEMEGETON_RIGGED_V2_BASE.glb"))
rig=next((o for o in bpy.context.scene.objects if o.type=="ARMATURE"),None)
if not rig: raise RuntimeError("V1 armature missing")
rig.name="LEMEGETON_RIG_V2"; rig.show_in_front=True; rig.data.display_type="BBONE"
# Make an animator control armature.
bpy.ops.armature_add(enter_editmode=True, location=(0,0,0))
ctrl=bpy.context.object; ctrl.name="LEMEGETON_CONTROLS"; eb=ctrl.data.edit_bones
r=eb[0]; r.name="CTRL_ROOT"; r.head=(0,0,0); r.tail=(0,0,.25)
def add(n,h,t,p=None):
 b=eb.new(n); b.head=h; b.tail=t; b.parent=p; return b
body=add("CTRL_BODY",(0,0,.8),(0,0,1.15),r); head=add("CTRL_HEAD",(0,0,1.35),(0,0,1.65),body)
for s,x in (("L",-1),("R",1)):
 hand=add(f"CTRL_ARM_{s}_IK",(x*1.1,0,1),(x*1.35,0,1),body)
 add(f"CTRL_ELBOW_{s}_POLE",(x*.7,-.9,1),(x*.7,-1.05,1),body)
 leg=add(f"CTRL_LEG_{s}_IK",(x*.3,0,.05),(x*.3,0,-.2),r)
 add(f"CTRL_FOOT_{s}",(x*.3,-.2,.03),(x*.3,-.5,.03),leg)
 for i in (1,2,3): add(f"CTRL_FINGER{i}_{s}",(x*1.25,(i-2)*.04,.98),(x*1.38,(i-2)*.04,.98),hand)
 add(f"CTRL_THUMB_{s}",(x*1.25,-.06,.93),(x*1.38,-.09,.90),hand)
bpy.ops.object.mode_set(mode="OBJECT")
rig["rig_version"]="V2"; rig["mechanical_pivots"]=True; rig["digits"]="3 fingers + 1 thumb"; rig["exploded_amount"]=0.0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D,"LEMEGETON_RIG_V2.blend"))
