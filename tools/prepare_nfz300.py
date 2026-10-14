# Prépare le Minitel 1 NFZ 300 (La Radiotechnique) pour le Web, à partir des
# deux scans Artec de Velta-3D publiés sur Cults (CC0 depuis le 13 octobre 2026) :
#   0_SFusion.obj  : le socle, un biseau ouvert en dessus, épais à l'arrière ;
#   0_S_Fusion.obj : le capot, plateau du clavier et pyramide du tube.
# Le NFZ 300 est un monobloc (photos ACONIT 20199, vues de face et de profil) :
# le capot se pose sur le socle, l'écran est dans la face avant de la pyramide,
# presque verticale, le clavier sur le plateau devant elle. Les scans sont des
# coques sans écran, ni touches, ni couleurs : ce script les assemble, pose
# l'écran Vidéotex dans la fenêtre et le clavier relevé sur la photo
# (tools/nfz300_keyboard.json, inscriptions de tools/nfz300_atlas.py), puis
# exporte un GLB.
#
# Usage (Blender 5) :
#   python tools/nfz300_atlas.py
#   blender -b -P tools/prepare_nfz300.py -- [dossier des scans] [sortie.glb]
#   node tools/optimize_glb.mjs <sortie.glb> public/models/minitel-nfz-300.glb
import json
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
ATLAS = ROOT / "sources/build/nfz300-atlas.png"
LAYOUT = json.loads((ROOT / "tools/nfz300_keyboard.json").read_text(encoding="utf-8"))

# Artec exporte en millimètres ; le site compte 8 unités par mètre : taille réelle.
SCALE = 0.008
DECIMATE = 0.45
# Centre de l'emprise des tables du musée, en z three.js (src/scene/furniture.ts).
TABLE_CENTER_Z = 0.75
# Profondeur (mm) au-delà de laquelle un rayon passe par la fenêtre de l'écran.
WINDOW_DEPTH = 120
# Atlas des inscriptions (tools/nfz300_atlas.py) : cases de 128 x 64, panneau à y = 600.
ATLAS_SIZE, CELL_W, CELL_H, CELL_COLS, PANEL_TOP = 1024, 128, 64, 8, 600


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


def co(obj):
    return np.array([v.co[:] for v in obj.data.vertices])


def apply(obj, matrix):
    obj.data.transform(matrix)
    obj.data.update()


def pca_frame(obj):
    """Axes principaux : longueur sur Y, largeur sur X, épaisseur sur Z."""
    p = co(obj)
    c = p.mean(axis=0)
    vals, vecs = np.linalg.eigh(np.cov((p - c).T))
    order = vals.argsort()[::-1]
    length, width, normal = (vecs[:, i] for i in order)
    width = np.cross(length, normal)
    m = Matrix.Identity(4)
    for j in range(3):
        m[0][j], m[1][j], m[2][j] = width[j], length[j], normal[j]
    apply(obj, Matrix.Translation(-Vector(c)))
    apply(obj, m)


def level_face(obj, towards):
    """La grande face plane tournée vers `towards` (dessous du socle, plateau) y pointe exactement."""
    want = Vector(towards)
    total = Vector((0, 0, 0))
    for poly in obj.data.polygons:
        if poly.normal.dot(want) > 0.95:
            total += poly.normal * poly.area
    apply(obj, total.normalized().rotation_difference(want).to_matrix().to_4x4())


def level(obj, points):
    """Le plan des points (moindres carrés) horizontal, normale vers +Z."""
    c = points.mean(axis=0)
    _, _, vt = np.linalg.svd(points - c)
    n = vt[2] if vt[2][2] > 0 else -vt[2]
    apply(obj, Vector(n).rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4())


def side_angle(points):
    """Angle des bords latéraux vus de dessus (x = a y + b de chaque côté, moyenne)."""
    angles = []
    for sign in (1, -1):
        ys, xs = [], []
        lo, hi = np.percentile(points[:, 1], [10, 90])
        edges = np.linspace(lo, hi, 13)
        for a, e in zip(edges[:-1], edges[1:]):
            sl = points[(points[:, 1] >= a) & (points[:, 1] < e)]
            if len(sl):
                ys.append((a + e) / 2)
                xs.append((sl[:, 0] * sign).max() * sign)
        angles.append(math.atan(np.polyfit(ys, xs, 1)[0]))
    return sum(angles) / 2


def center_x(obj):
    p = co(obj)
    apply(obj, Matrix.Translation(Vector((-(p[:, 0].min() + p[:, 0].max()) / 2, 0, 0))))


def decimate(obj, ratio):
    modifier = obj.modifiers.new("decimate", "DECIMATE")
    modifier.ratio = ratio
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def pyramid_front(points):
    """Avant de la pyramide : le point le plus en avant (-Y) à plus de 100 mm du plateau."""
    return points[points[:, 2] > points[:, 2].min() + 100][:, 1].min()


base = load("0_SFusion")
cover = load("0_S_Fusion")
log("triangles d'origine", len(base.data.polygons), len(cover.data.polygons))

# --- Socle : dessous plat au sol, côtés parallèles à Y, bout épais à l'arrière (+Y) ---
pca_frame(base)
apply(base, Matrix.Rotation(math.pi, 4, "Y"))
for _ in range(3):
    level_face(base, (0, 0, -1))
apply(base, Matrix.Rotation(side_angle(co(base)), 4, "Z"))
center_x(base)
b = co(base)
apply(base, Matrix.Translation(Vector((0, 0, -b[:, 2].min()))))
b = co(base)
if b[b[:, 1] > np.percentile(b[:, 1], 90)][:, 2].max() < b[b[:, 1] < np.percentile(b[:, 1], 10)][:, 2].max():
    apply(base, Matrix.Rotation(math.pi, 4, "Z"))
    b = co(base)
# Rebord : le haut des parois latérales, tranche par tranche.
side = b[np.abs(b[:, 0]) > np.abs(b[:, 0]).max() - 12]
edges = np.linspace(side[:, 1].min() + 15, side[:, 1].max() - 15, 16)
ys, zs = [], []
for a, e in zip(edges[:-1], edges[1:]):
    sl = side[(side[:, 1] >= a) & (side[:, 1] < e)]
    if len(sl):
        ys.append((a + e) / 2)
        zs.append(np.percentile(sl[:, 2], 95))
slope, intercept = np.polyfit(ys, zs, 1)
log("socle", np.round(b.min(axis=0), 1), np.round(b.max(axis=0), 1), "rebord", round(math.degrees(math.atan(slope)), 1), "degres")

# --- Capot : pyramide en haut, calé sur le plateau du clavier, devant à -Y ---
pca_frame(cover)
apply(cover, Matrix.Rotation(math.pi, 4, "X"))
for _ in range(3):
    level_face(cover, (0, 0, 1))
for _ in range(3):
    c = co(cover)
    deck = c[(c[:, 1] < pyramid_front(c) - 15) & (c[:, 2] < c[:, 2].min() + 40)]
    level(cover, deck)
c = co(cover)
tall = c[c[:, 2] > c[:, 2].min() + 100]
if tall[:, 1].mean() < c[:, 1].mean():
    # Le plateau doit dépasser davantage devant la pyramide que derrière.
    apply(cover, Matrix.Rotation(math.pi, 4, "Z"))
apply(cover, Matrix.Rotation(side_angle(co(cover)), 4, "Z"))
center_x(cover)
# Posé sur le rebord : même pente, centré sur le socle, plateau sur le rebord.
apply(cover, Matrix.Rotation(math.atan(slope), 4, "X"))
c = co(cover)
apply(cover, Matrix.Translation(Vector((0, (b[:, 1].min() + b[:, 1].max()) / 2 - (c[:, 1].min() + c[:, 1].max()) / 2, 0))))
c = co(cover)
low = c[c[:, 2] < np.percentile(c[:, 2], 5)]
gap = min(z - (slope * y + intercept) for y, z in low[:, 1:3])
apply(cover, Matrix.Translation(Vector((0, 0, -gap))))
c = co(cover)
log("capot", np.round(c.min(axis=0), 1), np.round(c.max(axis=0), 1))

for obj in (base, cover):
    decimate(obj, DECIMATE)
log("triangles alleges", len(base.data.polygons), len(cover.data.polygons))

# --- Fenêtre de l'écran : dans la face avant de la pyramide -----------------------
c = co(cover)
front_y = pyramid_front(c)


def deck_z(y):
    return slope * y + intercept


total, centre, area = Vector((0, 0, 0)), Vector((0, 0, 0)), 0.0
for poly in cover.data.polygons:
    if poly.normal.y < -0.5 and poly.normal.z > 0.05 and poly.center.z > deck_z(poly.center.y) + 40:
        total += poly.normal * poly.area
        centre += poly.center * poly.area
        area += poly.area
face_n = total.normalized()
face_c = centre / area
v = face_n.cross(Vector((1, 0, 0))).normalized()
if v.z < 0:
    v = -v
u = v.cross(face_n).normalized()
log("face avant : penchee de", round(math.degrees(math.asin(max(-1, min(1, face_n.z)))), 1), "degres vers le haut")
tree = BVHTree.FromPolygons([vert.co.copy() for vert in cover.data.vertices], [p.vertices[:] for p in cover.data.polygons])
step = 3.0
grid_a = np.arange(-230, 230, step)
grid_b = np.arange(-230, 260, step)
depth = np.full((len(grid_b), len(grid_a)), np.inf)
for i, gb in enumerate(grid_b):
    for j, ga in enumerate(grid_a):
        hit = tree.ray_cast(face_c + u * float(ga) + v * float(gb) + face_n * 200, -face_n, 900)
        if hit[0] is not None:
            depth[i, j] = hit[3] - 200
deep = ~np.isfinite(depth) | (depth > WINDOW_DEPTH)
seen = np.zeros_like(deep)
window = []
for i in range(len(grid_b)):
    for j in range(len(grid_a)):
        if not deep[i, j] or seen[i, j]:
            continue
        region, queue, border = [], deque([(i, j)]), False
        seen[i, j] = True
        while queue:
            p, q = queue.popleft()
            region.append((p, q))
            if p in (0, len(grid_b) - 1) or q in (0, len(grid_a) - 1):
                border = True
            for dp, dq in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                np_, nq = p + dp, q + dq
                if 0 <= np_ < len(grid_b) and 0 <= nq < len(grid_a) and deep[np_, nq] and not seen[np_, nq]:
                    seen[np_, nq] = True
                    queue.append((np_, nq))
        # A deep region that touches the grid's edge is outside the terminal.
        if not border and len(region) > len(window):
            window = region
assert window, "fenetre de l'ecran introuvable"
rows = [p for p, _ in window]
cols = [q for _, q in window]
a0, a1 = grid_a[min(cols)], grid_a[max(cols)]
b0, b1 = grid_b[min(rows)], grid_b[max(rows)]
ring = [
    depth[p, q]
    for p in range(max(0, min(rows) - 3), min(len(grid_b), max(rows) + 4))
    for q in range(max(0, min(cols) - 3), min(len(grid_a), max(cols) + 4))
    if np.isfinite(depth[p, q]) and depth[p, q] <= WINDOW_DEPTH
]
bezel = float(np.median(ring))
win_w, win_h = float(a1 - a0 + 10), float(b1 - b0 + 10)
screen_c = face_c + u * float((a0 + a1) / 2) + v * float((b0 + b1) / 2) - face_n * (bezel + 4)
log("fenetre (mm)", round(win_w, 1), "x", round(win_h, 1), "biseau", round(bezel, 1))


def add_mesh(name, verts, faces, uvs=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(p) for p in verts], [], faces)
    if uvs:
        layer = mesh.uv_layers.new(name="UVMap")
        for poly in mesh.polygons:
            for loop in poly.loop_indices:
                layer.data[loop].uv = uvs[mesh.loops[loop].vertex_index]
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# Écran : un plan tourné vers le visiteur, UV de 0 à 1 (bas gauche -> haut droit).
hw, hh = win_w / 2, win_h / 2
screen = add_mesh(
    "Minitel_Screen",
    [screen_c - u * hw - v * hh, screen_c + u * hw - v * hh, screen_c + u * hw + v * hh, screen_c - u * hw + v * hh],
    [(0, 1, 2, 3)],
    uvs=[(0, 0), (1, 0), (1, 1), (0, 1)],
)


def box(name, centre_, size, basis, uv_top=None, uv_other=None):
    """Boîte de taille `size` dans le repère `basis` (axes x, y, z), UV du dessus et des côtés."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.normal_update()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            if face.normal.z > 0.9 and uv_top:
                loop[uv_layer].uv = uv_top(loop.vert.co.x, loop.vert.co.y)
            elif uv_other:
                loop[uv_layer].uv = uv_other
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    m = Matrix((basis[0], basis[1], basis[2])).transposed().to_4x4()
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(centre_), verts=bm.verts)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# Fond du tube, derrière l'écran (la coque est vide).
tube = box("Fond_Tube", screen_c - face_n * 62, (win_w + 4, win_h + 4, 120), (u, v, face_n))

# --- Clavier : panneau et touches relevés sur la photo, sur le plateau ---------------
c = co(cover)
deck_pts = c[(c[:, 1] < front_y - 12) & (np.abs(c[:, 0]) < np.abs(c[:, 0]).max() - 20)]
edges = np.linspace(deck_pts[:, 1].min() + 4, deck_pts[:, 1].max() - 4, 10)
dys, dzs = [], []
for a, e in zip(edges[:-1], edges[1:]):
    sl = deck_pts[(deck_pts[:, 1] >= a) & (deck_pts[:, 1] < e)]
    if len(sl):
        dys.append((a + e) / 2)
        dzs.append(np.percentile(sl[:, 2], 97))
ka, kb = np.polyfit(dys, dzs, 1)
tilt = math.atan(ka)
deck_n = Vector((0, -math.sin(tilt), math.cos(tilt)))
deck_y = Vector((0, math.cos(tilt), math.sin(tilt)))
deck_x = Vector((1, 0, 0))
panel_w_px, panel_h_px = LAYOUT["panel"]["width"], LAYOUT["panel"]["height"]
avail_w = (c[:, 0].max() - c[:, 0].min()) - 28
avail_d = (front_y - 10) - (deck_pts[:, 1].min() + 8)
# Le clavier occupe le plateau d'un bord à l'autre, comme sur la photo : la
# disposition relevée s'étire un peu en profondeur si le plateau le permet.
panel_w = avail_w
panel_d = min(avail_d, panel_w * panel_h_px / panel_w_px * 1.2)
panel_back = front_y - 10
log("panneau du clavier (mm)", round(panel_w, 1), "x", round(panel_d, 1), "place", round(avail_w, 1), "x", round(avail_d, 1), "pente", round(math.degrees(tilt), 1))


def on_deck(x, y, lift):
    """Point du plateau (y horizontal), relevé de `lift` le long de sa normale."""
    return Vector((x, y, ka * y + kb)) + deck_n * lift


def atlas_uv(px, py):
    return (px / ATLAS_SIZE, 1 - py / ATLAS_SIZE)


def key_rect(index, w, h):
    col, row = index % CELL_COLS, index // CELL_COLS
    x0, y0 = col * CELL_W, row * CELL_H
    s = min((CELL_W - 8) / w, (CELL_H - 8) / h)
    return x0 + (CELL_W - w * s) / 2, y0 + (CELL_H - h * s) / 2, x0 + (CELL_W + w * s) / 2, y0 + (CELL_H + h * s) / 2


blank = CELL_COLS * (PANEL_TOP // CELL_H) - 1
blank_uv = atlas_uv((blank % CELL_COLS + 0.5) * CELL_W, (blank // CELL_COLS + 0.5) * CELL_H)
panel_px_h = round(ATLAS_SIZE * panel_h_px / panel_w_px)
along = 1 / math.cos(tilt)
panel = box(
    "Panneau_Clavier",
    on_deck(0, panel_back - panel_d / 2, 0.5),
    (panel_w, panel_d * along, 2),
    (deck_x, deck_y, deck_n),
    uv_top=lambda lx, ly: atlas_uv((lx + 0.5) * ATLAS_SIZE, PANEL_TOP + (0.5 - ly) * panel_px_h),
    uv_other=blank_uv,
)
keys = []
for index, key in enumerate(LAYOUT["keys"]):
    cx = (key["x"] + key["w"] / 2) / panel_w_px * panel_w - panel_w / 2
    cy = panel_back - (key["y"] + key["h"] / 2) / panel_h_px * panel_d
    size = (key["w"] / panel_w_px * panel_w * 0.94, key["h"] / panel_h_px * panel_d * 0.94 * along, 6)
    rect = key_rect(index, key["w"], key["h"])
    name = f"Key_{key['name']}" if key["key"] else f"Touche_{key['name']}"
    obj = box(
        name,
        on_deck(cx, cy, 1.5 + 3),
        size,
        (deck_x, deck_y, deck_n),
        uv_top=lambda lx, ly, r=rect: atlas_uv(r[0] + (lx + 0.5) * (r[2] - r[0]), r[1] + (0.5 - ly) * (r[3] - r[1])),
        uv_other=blank_uv,
    )
    if key["key"]:
        obj["key"] = key["key"]
    keys.append(obj)
log("touches", len(keys))


# --- Matières -------------------------------------------------------------------
def linear(r, g, b_):
    return tuple(((x / 255) / 12.92 if x / 255 <= 0.04045 else ((x / 255 + 0.055) / 1.055) ** 2.4) for x in (r, g, b_)) + (1.0,)


def material(name, colour, roughness, image=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.0
    if image:
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(image))
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


# Couleurs relevées sur les photos ACONIT : capot crème, socle grège plus sombre.
cover_mat = material("Plastique_Capot", linear(222, 215, 197), 0.5)
base_mat = material("Plastique_Socle", linear(170, 158, 136), 0.6)
keyboard_mat = material("Clavier", linear(238, 234, 222), 0.45, ATLAS)
screen_mat = material("Ecran", linear(20, 26, 24), 0.2)
tube_mat = material("Fond_Tube", linear(4, 4, 4), 0.9)
for obj, mat in ((cover, cover_mat), (base, base_mat), (screen, screen_mat), (tube, tube_mat), (panel, keyboard_mat), *((k, keyboard_mat) for k in keys)):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
cover.name, base.name = "Capot", "Socle"
for obj in (cover, base):
    for poly in obj.data.polygons:
        poly.use_smooth = True

# --- Échelle, position et export -----------------------------------------------------
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for obj in meshes:
    apply(obj, Matrix.Scale(SCALE, 4))
allp = np.vstack([co(o) for o in meshes])
y_mid = (allp[:, 1].min() + allp[:, 1].max()) / 2
floor = allp[:, 2].min()
for obj in meshes:
    # Repère three.js : z = -y ; le milieu de l'emprise au centre de la table.
    apply(obj, Matrix.Translation(Vector((0, -TABLE_CENTER_Z - y_mid, -floor))))
allp = np.vstack([co(o) for o in meshes])
s = co(screen).mean(axis=0)
log("emprise three.js : x", round(allp[:, 0].min(), 3), round(allp[:, 0].max(), 3), "y 0 ->", round(allp[:, 2].max(), 3), "z", round(-allp[:, 1].max(), 3), "->", round(-allp[:, 1].min(), 3))
log("centre de l'ecran, three.js", [round(float(s[0]), 3), round(float(s[2]), 3), round(float(-s[1]), 3)], "normale", [round(face_n.x, 3), round(face_n.z, 3), round(-face_n.y, 3)])
log("taille de l'ecran (unites)", round(win_w * SCALE, 3), round(win_h * SCALE, 3))

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
log("ecrit", OUTPUT)
