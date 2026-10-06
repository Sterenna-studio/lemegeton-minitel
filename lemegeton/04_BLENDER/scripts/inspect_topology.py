"""Find actual connected surfaces, ignoring duplicated UV-seam vertices."""

import json
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '05_EXPORTS' / 'AUDIT_SOURCES'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / '02_SOURCES_3D' / 'Rusty Retrobot.glb'))
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
mesh = obj.data
coords = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
mesh.vertices.foreach_get('co', coords)
coords = coords.reshape(-1, 3)
matrix = np.array(obj.matrix_world)
world = coords @ matrix[:3, :3].T + matrix[:3, 3]
loops = np.empty(len(mesh.loops), dtype=np.int32)
mesh.loops.foreach_get('vertex_index', loops)
triangles = loops.reshape(-1, 3)
_, inverse = np.unique(np.rint(world / 0.00001).astype(np.int32), axis=0, return_inverse=True)
tri = inverse[triangles]
parents = np.arange(inverse.max() + 1)
for iteration in range(200):
    roots = parents[tri]
    low = np.minimum(roots[:, 0], np.minimum(roots[:, 1], roots[:, 2]))
    if np.all(roots == low[:, None]):
        break
    for column in range(3):
        np.minimum.at(parents, roots[:, column], low)
    while not np.array_equal(parents, parents[parents]):
        parents = parents[parents]
else:
    raise RuntimeError('Topology component search did not converge')
labels = parents[inverse]
ids, counts = np.unique(labels, return_counts=True)
components = []
for component, count in sorted(zip(ids, counts), key=lambda entry: -entry[1]):
    points = world[labels == component]
    components.append({'id': int(component), 'vertices': int(count),
                       'min': points.min(axis=0).tolist(), 'max': points.max(axis=0).tolist()})
np.savez_compressed(OUT / 'RUSTY_COMPONENTS.npz', labels=labels)
(OUT / 'TOPOLOGY_AUDIT.json').write_text(json.dumps({
    'source': '02_SOURCES_3D/Rusty Retrobot.glb',
    'weld_tolerance_for_analysis_only': 0.00001,
    'iterations': iteration,
    'components': components,
}, indent=2) + '\n', encoding='utf-8')
print('CONNECTED_COMPONENTS', len(components))
print(json.dumps(components[:30], indent=2))
