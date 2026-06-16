#!/usr/bin/env python3
"""
Remove solid-color backgrounds from sprite PNGs using flood-fill from corners.
Samples all 4 corners, picks the most common color, then replaces pixels
within tolerance with full transparency.
"""

import os
import sys
from pathlib import Path
from collections import Counter
from PIL import Image

SPRITE_DIRS = [
    'assets/sprites/heads-bodies',
    'assets/sprites/tops',
    'assets/sprites/bottoms',
    'assets/sprites/dresses',
    'assets/sprites/shoes',
    'assets/sprites/wings',
    'assets/sprites/props',
]

TOLERANCE = 30   # color distance threshold (Euclidean per channel)
MIN_COVERAGE = 0.03  # skip if bg color covers < 3% of image (probably no bg)

def color_distance(c1, c2):
    return max(abs(c1[0]-c2[0]), abs(c1[1]-c2[1]), abs(c1[2]-c2[2]))

def flood_fill_transparent(img, start_x, start_y, target_rgb, tol):
    """BFS flood-fill from (start_x, start_y), making matching pixels transparent."""
    pixels = img.load()
    w, h = img.size
    visited = set()
    queue = [(start_x, start_y)]
    changed = 0

    while queue:
        x, y = queue.pop()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        visited.add((x, y))

        px = pixels[x, y]
        r, g, b = px[0], px[1], px[2]
        if color_distance((r, g, b), target_rgb) <= tol:
            pixels[x, y] = (r, g, b, 0)
            changed += 1
            queue.append((x+1, y))
            queue.append((x-1, y))
            queue.append((x, y+1))
            queue.append((x, y-1))

    return changed

def remove_background(path):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    pixels = img.load()

    # Sample all 4 corners
    corners = [
        pixels[0,     0    ][:3],
        pixels[w-1,   0    ][:3],
        pixels[0,     h-1  ][:3],
        pixels[w-1,   h-1  ][:3],
    ]

    # Pick most common corner color
    counter = Counter(corners)
    bg_color, count = counter.most_common(1)[0]

    # Check how many pixels match this color (quick scan)
    total = w * h
    matching = sum(
        1 for y in range(h) for x in range(w)
        if color_distance(pixels[x, y][:3], bg_color) <= TOLERANCE
    )
    coverage = matching / total

    if coverage < MIN_COVERAGE:
        return False, f"skipped (bg coverage {coverage:.1%})"

    # Flood-fill from all 4 corners
    changed = 0
    for cx, cy in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        if color_distance(pixels[cx, cy][:3], bg_color) <= TOLERANCE:
            changed += flood_fill_transparent(img, cx, cy, bg_color, TOLERANCE)

    if changed == 0:
        return False, "skipped (no pixels changed)"

    img.save(path, 'PNG')
    return True, f"removed bg {bg_color} ({coverage:.1%} coverage, {changed}px)"

def main():
    base = Path(__file__).parent
    fixed = 0
    skipped = 0
    errors = 0

    for d in SPRITE_DIRS:
        folder = base / d
        if not folder.exists():
            print(f"MISSING: {d}")
            continue

        pngs = sorted(folder.glob('*.png'))
        print(f"\n── {d}  ({len(pngs)} files)")

        for p in pngs:
            try:
                ok, msg = remove_background(p)
                if ok:
                    fixed += 1
                    print(f"  ✓ {p.name}: {msg}")
                else:
                    skipped += 1
                    # Uncomment to see all skipped files:
                    # print(f"  · {p.name}: {msg}")
            except Exception as ex:
                errors += 1
                print(f"  ✗ {p.name}: {ex}")

    print(f"\n{'─'*50}")
    print(f"Done. Fixed: {fixed}  Skipped: {skipped}  Errors: {errors}")

if __name__ == '__main__':
    main()
