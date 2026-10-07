"""Mesure le budget de chaque GLB publie (sans Blender, sans dependance).

Usage : python tools/budget_glb.py [fichiers.glb ...]
Sans argument, mesure tout public/models/ et ecrit docs/asset-audit/budgets.json.

Pour chaque fichier : poids, triangles, sommets, meshes et materiaux (chaque
primitive coute au moins un appel de rendu), textures embarquees (nombre,
format, plus grande taille) et estimation de la memoire GPU des textures
(mipmaps compris : RGBA 8 bits pour PNG/JPEG/WebP, 1 octet par pixel pour
KTX2, transcode dans un format compresse du GPU).
"""
import json
import struct
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]


KTX2_ID = b'\xabKTX 20\xbb\r\n\x1a\n'


def image_size(b):
    if b[:12] == KTX2_ID:
        return list(struct.unpack('<II', b[20:28]))
    if b[:8] == b'\x89PNG\r\n\x1a\n':
        return list(struct.unpack('>II', b[16:24]))
    if b[:2] == b'\xff\xd8':
        i = 2
        while i + 9 < len(b) and b[i] == 0xFF:
            marker, length = b[i + 1], struct.unpack('>H', b[i + 2:i + 4])[0]
            if marker in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack('>HH', b[i + 5:i + 9])
                return [w, h]
            i += 2 + length
    if b[:4] == b'RIFF' and b[8:12] == b'WEBP':
        chunk = b[12:16]
        if chunk == b'VP8 ':
            w, h = struct.unpack('<HH', b[26:30])
            return [w & 0x3FFF, h & 0x3FFF]
        if chunk == b'VP8L':
            v = int.from_bytes(b[21:25], 'little')
            return [(v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1]
        if chunk == b'VP8X':
            return [int.from_bytes(b[24:27], 'little') + 1, int.from_bytes(b[27:30], 'little') + 1]
    return None


def measure(path):
    data = path.read_bytes()
    json_length = struct.unpack('<I', data[12:16])[0]
    gltf = json.loads(data[20:20 + json_length])
    binary = 20 + json_length + 8
    accessors = gltf.get('accessors', [])
    primitives = [p for m in gltf.get('meshes', []) for p in m['primitives']]
    triangles = 0
    for p in primitives:
        if p.get('mode', 4) == 4:
            source = p['indices'] if 'indices' in p else p['attributes']['POSITION']
            triangles += accessors[source]['count'] // 3
    textures, texture_bytes, gpu = [], 0, 0.0
    for image in gltf.get('images', []):
        if 'bufferView' not in image:
            textures.append({'mime': image.get('mimeType'), 'size': None})
            continue
        view = gltf['bufferViews'][image['bufferView']]
        start = binary + view.get('byteOffset', 0)
        size = image_size(data[start:start + view['byteLength']])
        texture_bytes += view['byteLength']
        if size:
            # KTX2 is transcoded to a GPU format (ASTC 4x4, BC7...) : 1 byte per
            # pixel ; other formats are decoded to RGBA : 4 bytes per pixel.
            per_pixel = 1 if image.get('mimeType') == 'image/ktx2' else 4
            gpu += size[0] * size[1] * per_pixel * 4 / 3
        textures.append({'mime': image.get('mimeType'), 'size': size})
    sizes = [t['size'] for t in textures if t['size']]
    return {
        'file': path.relative_to(WEB).as_posix() if path.is_relative_to(WEB) else str(path),
        'kilobytes': round(len(data) / 1024),
        'triangles': triangles,
        'vertices': sum(accessors[p['attributes']['POSITION']]['count'] for p in primitives),
        'meshes': len(gltf.get('meshes', [])),
        'primitives': len(primitives),
        'materials': len(gltf.get('materials', [])),
        'textures': len(textures),
        'texture_kilobytes': round(texture_bytes / 1024),
        'largest_texture': max(sizes, key=lambda s: s[0] * s[1], default=None),
        'texture_formats': sorted({t['mime'] for t in textures if t['mime']}),
        'gpu_texture_megabytes': round(gpu / 1e6, 1),
        'extensions': gltf.get('extensionsUsed', []),
    }


def main():
    files = [Path(a).resolve() for a in sys.argv[1:]] or sorted((WEB / 'public' / 'models').rglob('*.glb'))
    report = [measure(f) for f in files]
    for row in report:
        print(f"{row['file']}: {row['kilobytes']} Ko, {row['triangles']} triangles, "
              f"{row['primitives']} primitives, {row['materials']} materiaux, "
              f"{row['textures']} textures (~{row['gpu_texture_megabytes']} Mo GPU)")
    if not sys.argv[1:]:
        out = WEB / 'docs' / 'asset-audit' / 'budgets.json'
        out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print('ecrit', out.relative_to(WEB).as_posix())


if __name__ == '__main__':
    main()
