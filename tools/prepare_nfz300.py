# Prépare le Minitel 1 NFZ 300 (La Radiotechnique) pour le Web, à partir des
# deux scans Artec de Velta-3D publiés sur Cults sous licence CC0 (passée en
# CC0 le 13 octobre 2026) : 0_S_Fusion.obj (boîtier) et 0_SFusion.obj
# (clavier rabattable). Les scans sont des coques en millimètres, sans UV, ni
# couleur, ni écran, ni touches, et le dessus arrière du logement du tube manque.
# Ce script les redresse et les assemble, allège le maillage, referme le
# logement, pose un écran Vidéotex dans la fenêtre et une plaque de touches
# cliquables dans le bac du clavier, puis exporte un GLB.
#
# Usage (Blender 5) :
#   blender -b -P tools/prepare_nfz300.py -- [dossier des scans] [sortie.glb]
# puis : node tools/optimize_glb.mjs <sortie.glb> public/models/minitel-nfz-300.glb
import math
import sys
from collections import deque
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
SOURCE = Path(args[0]) if args else ROOT / "sources/02_SOURCES_3D/minitel-1-nfz-300-la-radiotechnique20200302-6124-q4n48m/Velta-3D/minitel-1-nfz-300-la-radiotechnique"
OUTPUT = Path(args[1]) if len(args) > 1 else ROOT / "sources/build/nfz300-prepare.glb"

# Artec exporte en millimètres ; le site compte 8 unités par mètre. Un peu
# moins (0,94) pour que boîtier et clavier tiennent sur les tables du lot.
SCALE = 0.008 * 0.94
DECIMATE = 0.45
# Redressement du boîtier : sa face avant penche de 12,8° dans le scan, et il
# y est la tête en bas (les bosses de charnière du clavier vont en bas).
BODY_PITCH = -12.8
# Retournement du clavier après l'alignement sur ses axes principaux : face des
# touches vers le haut, charnière côté boîtier.
KEYBOARD_FLIPS = (-1.0, 1.0, -1.0)
# Arrière du boîtier, en unités (repère three.js : z vers le visiteur), pour
# que l'ensemble se pose sur les tables comme le Minitel 1 (src/scene/furniture.ts).
BACK_Z = -1.63


def log(*items):
    print("[nfz300]", *items)


bpy.ops.wm.read_factory_settings(use_empty=True)


def load(name):
    bpy.ops.wm.obj_import(filepath=str(SOURCE / f"{name}.obj"))
    obj = bpy.context.selected_objects[0]
    obj.name = name
    # Coordonnées brutes du scan (l'import ajoute un quart de tour).
    obj.matrix_world = Matrix.Identity(4)
    return obj


def transform(obj, matrix):
    obj.data.transform(matrix)
    obj.data.update()


def vertices(obj):
    return np.array([v.co[:] for v in obj.data.vertices])


def decimate(obj, ratio):
    modifier = obj.modifiers.new("decimate", "DECIMATE")
    modifier.ratio = ratio
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


body = load("0_S_Fusion")
keyboard = load("0_SFusion")
log("triangles d'origine", len(body.data.polygons), len(keyboard.data.polygons))

# --- Redressement -------------------------------------------------------------
transform(body, Matrix.Rotation(math.pi, 4, "Y") @ Matrix.Rotation(math.radians(BODY_PITCH), 4, "X"))
points = vertices(keyboard)
centre = points.mean(axis=0)
values, vectors = np.linalg.eigh(np.cov((points - centre).T))
order = values.argsort()[::-1]
length, width, normal = (vectors[:, i] for i in order)
rows = np.array([width * KEYBOARD_FLIPS[0], length * KEYBOARD_FLIPS[1], normal * KEYBOARD_FLIPS[2]])
if np.linalg.det(rows) < 0:
    rows[0] *= -1
align = Matrix.Identity(4)
for i in range(3):
    for j in range(3):
        align[i][j] = rows[i][j]
transform(keyboard, Matrix.Translation(-Vector(centre)))
transform(keyboard, align)

for obj in (body, keyboard):
    decimate(obj, DECIMATE)
log("triangles allégés", len(body.data.polygons), len(keyboard.data.polygons))

# --- Fenêtre de l'écran : carte de profondeur de la face avant ------------------
co = vertices(body)
low, high = co.min(axis=0), co.max(axis=0)
tree = BVHTree.FromPolygons([v.co.copy() for v in body.data.vertices], [p.vertices[:] for p in body.data.polygons])
step = 3.0
xs = np.arange(low[0] + 2, high[0] - 2, step)
zs = np.arange(low[2] + 2, high[2] - 2, step)
depth = np.full((len(zs), len(xs)), np.inf)
for i, z in enumerate(zs):
    for j, x in enumerate(xs):
        hit = tree.ray_cast(Vector((x, low[1] - 20, z)), Vector((0, 1, 0)))
        if hit[0] is not None:
            depth[i, j] = hit[0].y - low[1]
deep = ~np.isfinite(depth) | (depth > 120)
seen = np.zeros_like(deep)
window = []
for i in range(len(zs)):
    for j in range(len(xs)):
        if deep[i, j] and not seen[i, j]:
            region, queue = [], deque([(i, j)])
            seen[i, j] = True
            while queue:
                a, b = queue.popleft()
                region.append((a, b))
                for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    na, nb = a + da, b + db
                    if 0 <= na < len(zs) and 0 <= nb < len(xs) and deep[na, nb] and not seen[na, nb]:
                        seen[na, nb] = True
                        queue.append((na, nb))
            if len(region) > len(window):
                window = region
wr = [a for a, _ in window]
wc = [b for _, b in window]
win_x = (xs[min(wc)], xs[max(wc)])
win_z = (zs[min(wr)], zs[max(wr)])
ring = [
    depth[a, b]
    for a in range(max(0, min(wr) - 3), min(len(zs), max(wr) + 4))
    for b in range(max(0, min(wc) - 3), min(len(xs), max(wc) + 4))
    if np.isfinite(depth[a, b]) and depth[a, b] <= 120
]
bezel = float(np.median(ring))
log("fenêtre (mm)", np.round(win_x, 1), np.round(win_z, 1), "biseau", round(bezel, 1))

# --- Placement (mm) : écran centré en x, boîtier posé au sol, clavier devant ----
shift = Vector((-(win_x[0] + win_x[1]) / 2, -low[1], -low[2]))
transform(body, Matrix.Translation(shift))
co = vertices(body)
body_low, body_high = co.min(axis=0), co.max(axis=0)
k = vertices(keyboard)
transform(keyboard, Matrix.Translation(Vector((-(k[:, 0].min() + k[:, 0].max()) / 2, body_low[1] - k[:, 1].max(), -k[:, 2].min()))))
k = vertices(keyboard)
win_cx = 0.0
win_cz = (win_z[0] + win_z[1]) / 2 + shift.z
win_w = win_x[1] - win_x[0] + 10
win_h = win_z[1] - win_z[0] + 10
screen_y = body_low[1] + bezel + 4


def add_mesh(name, verts, faces, uvs=None, props=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    if uvs:
        layer = mesh.uv_layers.new(name="UVMap")
        for poly in mesh.polygons:
            for loop in poly.loop_indices:
                layer.data[loop].uv = uvs[mesh.loops[loop].vertex_index]
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for key, value in (props or {}).items():
        obj[key] = value
    return obj


# Écran : un plan tourné vers -Y (le visiteur), UV de 0 à 1 (bas gauche -> haut droit).
hw, hh = win_w / 2, win_h / 2
screen = add_mesh(
    "Minitel_Screen",
    [(win_cx - hw, screen_y, win_cz - hh), (win_cx + hw, screen_y, win_cz - hh), (win_cx + hw, screen_y, win_cz + hh), (win_cx - hw, screen_y, win_cz + hh)],
    [(0, 1, 2, 3)],
    uvs=[(0, 0), (1, 0), (1, 1), (0, 1)],
)

# Fond du tube : une boîte sombre derrière l'écran, qui cache l'intérieur de la coque.
def box(name, centre, size, rotation=None, props=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    if rotation is not None:
        bmesh.ops.rotate(bm, cent=Vector((0, 0, 0)), matrix=rotation, verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(centre), verts=bm.verts)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for key, value in (props or {}).items():
        obj[key] = value
    return obj


tube = box("Fond_Tube", (win_cx, screen_y + 14, win_cz), (win_w + 4, 20, win_h + 4))

# Capot arrière : le scan s'arrête au dessus du logement du tube, qui reste
# ouvert vu de dos. On le referme par l'enveloppe convexe du boîtier, en ne
# gardant que ses faces loin de la surface scannée (les ouvertures), sauf
# celles de la façade.
body_tree = BVHTree.FromPolygons([v.co.copy() for v in body.data.vertices], [p.vertices[:] for p in body.data.polygons])
hull = bmesh.new()
for v in body.data.vertices:
    hull.verts.new(v.co)
bmesh.ops.convex_hull(hull, input=hull.verts[:], use_existing_faces=False)
hull.normal_update()
drop = []
for face in hull.faces:
    centre_ = face.calc_center_median()
    nearest = body_tree.find_nearest(centre_)
    if face.normal.y < -0.3 or (nearest[0] is not None and nearest[3] < 3):
        drop.append(face)
bmesh.ops.delete(hull, geom=drop, context="FACES")
bmesh.ops.delete(hull, geom=[v for v in hull.verts if not v.link_faces], context="VERTS")
cap_mesh = bpy.data.meshes.new("Capot_Arriere")
hull.to_mesh(cap_mesh)
hull.free()
cap = bpy.data.objects.new("Capot_Arriere", cap_mesh)
bpy.context.scene.collection.objects.link(cap)
log("capot arrière, faces", len(cap_mesh.polygons))

# --- Plaque de touches : plan du rebord supérieur du bac du clavier --------------
k = vertices(keyboard)
kx = (k[:, 0].min(), k[:, 0].max())
ky = (k[:, 1].min(), k[:, 1].max())
bins = np.linspace(ky[0] + 10, ky[1] - 10, 24)
samples = []
for y0, y1 in zip(bins[:-1], bins[1:]):
    band = k[(k[:, 1] >= y0) & (k[:, 1] < y1)]
    if len(band):
        samples.append(((y0 + y1) / 2, np.percentile(band[:, 2], 98)))
sy, sz = np.array(samples).T
slope, intercept = np.polyfit(sy, sz, 1)
log("rebord du clavier : z =", round(slope, 4), "* y +", round(intercept, 1))
tilt = math.atan(slope)
plate_rot = Matrix.Rotation(tilt, 4, "X").to_3x3()
margin = 16


def on_plate(x, y, lift):
    """Point du plan des touches (mm), relevé de `lift` le long de sa normale."""
    normal = Vector((0, -math.sin(tilt), math.cos(tilt)))
    return Vector((x, y, slope * y + intercept)) + normal * lift


plate_y = (ky[0] + margin, ky[1] - 46)
plate_x = (kx[0] + margin, kx[1] - margin)
plate_len = (plate_y[1] - plate_y[0]) / math.cos(tilt)
plate_centre = on_plate((plate_x[0] + plate_x[1]) / 2, (plate_y[0] + plate_y[1]) / 2, -4)
plate = box("Plaque_Clavier", plate_centre, (plate_x[1] - plate_x[0], plate_len, 3), plate_rot)

# Disposition AZERTY du Minitel 1 (vue de l'utilisateur, du fond vers l'avant) :
# touches de fonction, chiffres du pavé, lettres, barre d'espace.
PITCH = 18.0
KEY = 15.0
keys = []


def key(name, value, x, y, w=KEY, d=KEY, kind="touche"):
    keys.append((name, value, x, y, w, d, kind))


# Bloc des touches vers l'avant du bac, côté utilisateur.
back = plate_y[0] + 40 + 5.6 * PITCH
front = plate_y[0] + 14
left = plate_x[0] + 14
functions = [
    ("Sommaire", "Sommaire"),
    ("Annulation", "Annulation"),
    ("Retour", "Retour"),
    ("Repetition", "Repetition"),
    ("Guide", "Guide"),
    ("Correction", "Correction"),
    ("Suite", "Suite"),
    ("ConnexionFin", "ConnexionFin"),
]
for i, (name, value) in enumerate(functions):
    key(f"Key_{name}", value, left + 10 + i * (PITCH + 7), back, w=KEY + 7, kind="fonction")
key("Key_Envoi", "Envoi", left + 10 + len(functions) * (PITCH + 7) + 6, back, w=KEY + 12, kind="envoi")
rows = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"]
for r, letters in enumerate(rows):
    y = back - (r + 1.4) * PITCH
    for c, letter in enumerate(letters):
        key(f"Key_{letter}", letter, left + r * 6 + c * PITCH, y)
key("Key_Espace", " ", left + 70, back - 4.6 * PITCH, w=7 * PITCH, kind="touche")
pad = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], ["*", "0", "#"]]
pad_left = plate_x[1] - 14 - 2 * PITCH
for r, line in enumerate(pad):
    for c, value in enumerate(line):
        name = {"*": "Etoile", "#": "Diese"}.get(value, value)
        key(f"Key_{name}", value, pad_left + c * PITCH, back - (r + 1.4) * PITCH)

key_objects = []
for name, value, x, y, w, d, kind in keys:
    centre_ = on_plate(x, y, 2.5)
    obj = box(name, centre_, (w, d, 6), plate_rot, props={"key": value, "kind": kind})
    key_objects.append(obj)
log("touches", len(key_objects))

# --- Matières -----------------------------------------------------------------
def material(name, color, roughness, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


beige = material("Plastique_Beige", (0.69, 0.55, 0.36, 1), 0.55)
dark = material("Fond_Tube", (0.01, 0.01, 0.01, 1), 0.9)
plate_mat = material("Plaque", (0.42, 0.34, 0.24, 1), 0.7)
key_mat = material("Touches", (0.09, 0.08, 0.07, 1), 0.5)
function_mat = material("Touches_Fonction", (0.35, 0.28, 0.21, 1), 0.5)
send_mat = material("Touche_Envoi", (0.18, 0.33, 0.2, 1), 0.5)
screen_mat = material("Ecran", (0.02, 0.03, 0.03, 1), 0.2)
for obj, mat in ((body, beige), (keyboard, beige), (cap, beige), (tube, dark), (plate, plate_mat), (screen, screen_mat)):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
for obj in key_objects:
    kind = obj["kind"]
    obj.data.materials.append(send_mat if kind == "envoi" else function_mat if kind == "fonction" else key_mat)
    del obj["kind"]
for obj in (body, keyboard):
    obj.name = "Boitier" if obj is body else "Clavier"
    for poly in obj.data.polygons:
        poly.use_smooth = True

# --- Échelle, origine et export ------------------------------------------------
everything = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for obj in everything:
    transform(obj, Matrix.Scale(SCALE, 4))
back_y = max(vertices(o)[:, 1].max() for o in (body,))
for obj in everything:
    # Repère three.js : z = -y Blender ; l'arrière du boîtier va à z = BACK_Z.
    transform(obj, Matrix.Translation(Vector((0, -BACK_Z - back_y, 0))))
co = np.vstack([vertices(o) for o in everything])
low, high = co.min(axis=0), co.max(axis=0)
s = vertices(screen)
screen_centre = s.mean(axis=0)
log("emprise (unités, Blender)", np.round(low, 3), np.round(high, 3))
log("centre de l'écran, three.js", [round(screen_centre[0], 3), round(screen_centre[2], 3), round(-screen_centre[1], 3)])
log("taille de l'écran (unités)", round(win_w * SCALE, 3), round(win_h * SCALE, 3))
log("haut", round(high[2], 3), "gauche", round(low[0], 3), "droite", round(high[0], 3), "arrière (z three)", round(-high[1], 3), "avant", round(-low[1], 3))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_yup=True,
    export_extras=True,
    export_apply=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
)
log("écrit", OUTPUT)
