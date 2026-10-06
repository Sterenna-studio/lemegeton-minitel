"""Repair undersized skin buffer views without changing the binary payload."""

import hashlib
import json
from pathlib import Path
import struct


def repair_glb(source):
    source = Path(source)
    raw = source.read_bytes()
    if len(raw) < 20 or struct.unpack_from('<4sII', raw) != (b'glTF', 2, len(raw)):
        raise ValueError('Invalid GLB header')

    chunks = []
    offset = 12
    while offset < len(raw):
        length, kind = struct.unpack_from('<II', raw, offset)
        end = offset + 8 + length
        if length % 4 or end > len(raw):
            raise ValueError('Invalid GLB chunk length')
        chunks.append((kind, raw[offset + 8:end]))
        offset = end
    if [kind for kind, _ in chunks] != [0x4E4F534A, 0x004E4942]:
        raise ValueError('Expected one JSON chunk and one BIN chunk')

    document = json.loads(chunks[0][1])
    binary = chunks[1][1]
    buffers = document['buffers']
    if len(buffers) != 1 or 'uri' in buffers[0]:
        raise ValueError('Expected a single embedded buffer')
    buffer_length = buffers[0]['byteLength']
    if not 0 <= len(binary) - buffer_length <= 3:
        raise ValueError('Embedded buffer length mismatch')

    views = document['bufferViews']
    skin_accessors = {
        index
        for mesh in document['meshes']
        for primitive in mesh['primitives']
        for name, index in primitive['attributes'].items()
        if name.startswith(('JOINTS_', 'WEIGHTS_'))
    }
    component_sizes = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
    components = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
    repairs = []
    for index, accessor in enumerate(document['accessors']):
        if 'sparse' in accessor or 'bufferView' not in accessor:
            raise ValueError('This repair expects dense accessors')
        view = views[accessor['bufferView']]
        if view['buffer'] != 0:
            raise ValueError('Unexpected buffer index')
        element_size = component_sizes[accessor['componentType']] * components[accessor['type']]
        stride = view.get('byteStride', element_size)
        if stride < element_size or accessor['count'] < 1:
            raise ValueError('Invalid accessor stride or count')
        required = accessor.get('byteOffset', 0) + (accessor['count'] - 1) * stride + element_size
        start = view.get('byteOffset', 0)
        limit = min(
            [buffer_length] + [v.get('byteOffset', 0) for v in views if v.get('byteOffset', 0) > start]
        )
        if start + max(required, view['byteLength']) > limit:
            raise ValueError(f'Accessor {index} would read outside its binary region')
        if required > view['byteLength']:
            if index not in skin_accessors:
                raise ValueError(f'Unexpected undersized accessor {index}')
            repairs.append({
                'accessor': index,
                'bufferView': accessor['bufferView'],
                'old_byteLength': view['byteLength'],
                'new_byteLength': required,
            })
            view['byteLength'] = required

    if not repairs:
        print('GLB accessor bounds already valid:', source)
        return str(source)

    encoded = json.dumps(document, ensure_ascii=True, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * (-len(encoded) % 4)
    output = source.with_name(source.stem + '_IMPORT_FIXED.glb')
    repaired = (
        struct.pack('<4sII', b'glTF', 2, 12 + 16 + len(encoded) + len(binary))
        + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
        + struct.pack('<II', len(binary), 0x004E4942) + binary
    )
    output.write_bytes(repaired)
    report = {
        'source': source.name,
        'output': output.name,
        'source_sha256': hashlib.sha256(raw).hexdigest(),
        'output_sha256': hashlib.sha256(repaired).hexdigest(),
        'binary_payload_sha256': hashlib.sha256(binary).hexdigest(),
        'binary_payload_unchanged': True,
        'repairs': repairs,
    }
    output.with_suffix('.repair.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('GLB buffer view sizes repaired:', repairs)
    return str(output)
