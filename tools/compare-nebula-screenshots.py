"""Verify no dimming and the 5% pixel bound in a frozen before/after capture.

Requires Pillow and numpy. Pass the QA_OUTPUT directory used by test-nebula.cjs.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

out = Path(sys.argv[1])
before = np.array(Image.open(out / 'desktop-original.png').convert('RGB')).astype(int)
after = np.array(Image.open(out / 'desktop-nebula-5pct.png').convert('RGB')).astype(int)
d = after - before
report = dict(min_channel_delta=int(d.min()), max_channel_delta=int(d.max()),
    mean_channel_delta=float(d.mean()), darkened_channels=int((d < 0).sum()))
assert report['darkened_channels'] == 0, report
assert report['max_channel_delta'] <= 13, report
(out / 'pixel-tests.json').write_text(json.dumps(report, indent=2), encoding='utf8')
print(json.dumps(report, indent=2))
