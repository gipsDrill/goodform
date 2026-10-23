"""Rebuild both silent, pre-blended 28-second loops (FFmpeg 7+ required).

python tools/prepare-nebula.py SOURCE.mp4 --ffmpeg /path/to/ffmpeg
The supplied source contains 1671 frames at 60 fps (27.85 s of video).
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

for width, height, fps, crf in [(1920, 1080, 60, 20), (1280, 720, 30, 21)]:
    # Start at source t=2. Blend the last 2 seconds with source t=0..2.
    # The loop boundary is then two adjacent source frames around t=2.
    # Gently slow the resulting 25.85 s cycle to exactly 28 s.
    filters = (
        f'[0:v]scale={width}:{height}:flags=lanczos,setsar=1,'
        'split=2[body][head];'
        '[body]trim=start=2:end=27.85,setpts=PTS-STARTPTS,fps=60[b];'
        '[head]trim=start=0:end=2,setpts=PTS-STARTPTS,fps=60[h];'
        '[b][h]xfade=transition=fade:duration=2:offset=23.85,'
        f'setpts=PTS*28/25.85,fps={fps},trim=duration=28,format=yuv420p[v]'
    )
    subprocess.run([
        args.ffmpeg, '-hide_banner', '-y', '-i', str(args.source),
        '-filter_complex_threads', '2', '-filter_complex', filters,
        '-map', '[v]', '-an', '-map_metadata', '-1',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
        '-threads', '4', '-profile:v', 'high', '-g', str(fps * 2),
        '-color_primaries', 'bt709', '-color_trc', 'bt709',
        '-colorspace', 'bt709', '-color_range', 'tv',
        '-movflags', '+faststart', str(out / f'nebula-{height}p.mp4')
    ], check=True)
