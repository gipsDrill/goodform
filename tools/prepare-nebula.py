"""Build smooth 6.8-second loops from Nebula.mp4 (600 frames, 1440p60).

Requires PyAV, numpy and FFmpeg with libx264. Source pixels stay in YUV420;
rounded 16-bit blend weights avoid a truncation/color-conversion step at wrap.
"""
import argparse
from pathlib import Path
import subprocess
import av
import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('--ffmpeg', default='ffmpeg')
parser.add_argument('--output-dir', type=Path)
parser.add_argument('--height', type=int, choices=[1440, 720])
args = parser.parse_args()
out = args.output_dir or Path(__file__).resolve().parents[1] / 'assets' / 'video'
out.mkdir(parents=True, exist_ok=True)

# Join at source frame 192 (3.2 s), away from the source jump at frame 180.
# Body is source frames 192..599. Blend source 408..599 into head 0..191.
# The quintic curve has zero first/second derivatives at each endpoint.
for width, height, fps, crf in [(2560, 1440, 60, 18), (1280, 720, 30, 14)]:
    if args.height and height != args.height:
        continue
    step = 60 // fps
    command = [
        args.ffmpeg, '-hide_banner', '-y', '-f', 'rawvideo',
        '-pixel_format', 'yuv420p', '-video_size', f'{width}x{height}',
        '-framerate', str(fps), '-i', 'pipe:0', '-an', '-map_metadata', '-1',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
        '-threads', '4', '-profile:v', 'high', '-g', str(fps * 2),
        '-color_primaries', 'bt709', '-color_trc', 'bt709',
        '-colorspace', 'bt709', '-color_range', 'tv',
        '-movflags', '+faststart', str(out / f'nebula-v3-{height}p.mp4')
    ]
    head = []
    count = written = 0
    with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
        try:
            with av.open(str(args.source)) as source:
                for index, frame in enumerate(source.decode(video=0)):
                    count += 1
                    if index % step:
                        continue
                    if frame.width != width or frame.height != height:
                        frame = frame.reformat(width=width, height=height,
                            format='yuv420p', interpolation='LANCZOS')
                    pixels = frame.to_ndarray(format='yuv420p')
                    if index < 192:
                        head.append(pixels.copy())
                        continue
                    if index >= 408:
                        j = index - 408
                        t = j / 192
                        weight = round(t*t*t*(t*(t*6-15)+10) * 65535)
                        # Round to nearest instead of truncating every plane.
                        pixels = ((pixels.astype(np.uint32) * (65535 - weight)
                            + head[j // step].astype(np.uint32) * weight
                            + 32767) // 65535).astype(np.uint8)
                    encoder.stdin.write(pixels.tobytes())
                    written += 1
            assert count == 600 and written == 408 // step, (count, written)
            encoder.stdin.close()
            if encoder.wait() != 0:
                raise RuntimeError('FFmpeg encoding failed')
        except BaseException:
            encoder.kill()
            raise
    del head
