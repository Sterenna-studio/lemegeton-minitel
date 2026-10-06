"""Assemble rendered frames with Blender's bundled FFmpeg encoder."""

from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '05_EXPORTS' / 'ATELIER_V4'
FRAMES = OUT / 'WAVE_ETUDE_FRAMES'
for frame in range(1, 121):
    assert (FRAMES / f'wave_{frame:04}.png').is_file(), frame
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
editor = scene.sequence_editor_create()
strip = editor.strips.new_image('wave_ETUDE', str(FRAMES / 'wave_0001.png'), channel=1, frame_start=1)
for frame in range(2, 121):
    strip.elements.append(f'wave_{frame:04}.png')
strip.frame_final_duration = 120
scene.frame_start = 1
scene.frame_end = 120
scene.render.fps = 24
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.render.image_settings.media_type = 'VIDEO'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = str(OUT / 'LEMEGETON_WAVE_ETUDE.mp4')
bpy.ops.render.render(animation=True)
clip = bpy.data.movieclips.load(str(OUT / 'LEMEGETON_WAVE_ETUDE.mp4'))
assert clip.frame_duration == 120, clip.frame_duration
assert list(clip.size) == [720, 720], list(clip.size)
print('VIDEO_VERIFIED: 120 frames, 24 fps, 720x720, five seconds')
