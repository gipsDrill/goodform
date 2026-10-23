"""Decode every output frame and verify the loop. Requires av and numpy.

python tools/verify-nebula.py [--report report.json]
Metrics use RGB frames downsampled to 256x144; values are in 0..255 units.
The 3% seam metrics are upper bounds before screen's backdrop attenuation.
"""
import argparse
import json
from pathlib import Path
import av
import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--report', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
results = []
for height, fps in [(1080, 60), (720, 30)]:
    p = root / 'assets' / 'video' / f'nebula-{height}p.mp4'
    c = av.open(str(p))
    s = c.streams.video[0]
    first = prev = None
    diffs = []
    count = 0
    for frame in c.decode(s):
        a = frame.reformat(width=256, height=144, format='rgb24').to_ndarray().astype(np.float32)
        if first is None:
            first = a.copy()
        if prev is not None:
            diffs.append(float(np.mean(np.abs(a - prev))))
        prev = a
        count += 1
    seam = np.abs(prev - first)
    data = dict(file=p.name, bytes=p.stat().st_size,
        duration=float(s.duration*s.time_base), fps=str(s.average_rate),
        width=s.width, height=s.height, frames=count, codec=s.codec_context.name,
        audio_streams=len(c.streams.audio),
        adjacent_MAE_median=float(np.median(diffs)),
        adjacent_MAE_p95=float(np.percentile(diffs, 95)),
        adjacent_MAE_max=float(np.max(diffs)), seam_MAE=float(np.mean(seam)),
        seam_p99=float(np.percentile(seam, 99)),
        seam_at_3pct_MAE=float(np.mean(seam))*.03,
        faststart=(b := p.read_bytes()).find(b'moov') < b.find(b'mdat'))
    assert count == 28*fps and round(float(s.average_rate)) == fps, data
    assert s.height == height and s.codec_context.name == 'h264', data
    assert data['audio_streams'] == 0 and data['duration'] == 28 and data['faststart'], data
    assert data['seam_at_3pct_MAE'] < .1 and data['seam_p99']*.03 < 1, data
    results.append(data)
    c.close()
report = json.dumps(results, indent=2)
if args.report:
    args.report.write_text(report, encoding='utf8')
print(report)
