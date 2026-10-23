"""Build silent, seamless 9-second loops from NEW Nebula.mp4 (10s, 1440p60).

python tools/prepare-nebula.py SOURCE.mp4 --ffmpeg /path/to/ffmpeg
The supplied source contains 600 frames at 60 fps (10 s of video).
"""
import argparse
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('--ffmpeg', default='ffmpeg')
args = parser.parse_args()
out = Path(__file__).resolve().parents[1] / 'assets' / 'video'
out.mkdir(parents=True, exist_ok=True)

for width, height, fps, crf in [(2560, 1440, 60, 18), (1280, 720, 30, 19)]:
    # Start at source t=1. Blend source t=9..10 with t=0..1.
    # The loop boundary joins adjacent source frames around t=1.
    # Preserve playback speed; only the one-second overlap shortens the cycle.
    filters = (
        f'[0:v]scale={width}:{height}:flags=lanczos,setsar=1,'
        'split=2[body][head];'
        '[body]trim=start=1:end=10,setpts=PTS-STARTPTS,fps=60[b];'
        '[head]trim=start=0:end=1,setpts=PTS-STARTPTS,fps=60[h];'
        '[b][h]xfade=transition=fade:duration=1:offset=8,'
        f'fps={fps},trim=duration=9,format=yuv420p[v]'
    )
    subprocess.run([
        args.ffmpeg, '-hide_banner', '-y', '-i', str(args.source),
        '-filter_complex_threads', '2', '-filter_complex', filters,
        '-map', '[v]', '-an', '-map_metadata', '-1',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
        '-threads', '4', '-profile:v', 'high', '-g', str(fps * 2),
        '-color_primaries', 'bt709', '-color_trc', 'bt709',
        '-colorspace', 'bt709', '-color_range', 'tv',
        '-movflags', '+faststart', str(out / f'nebula-v2-{height}p.mp4')
    ], check=True)
