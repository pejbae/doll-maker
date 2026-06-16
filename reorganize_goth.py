#!/usr/bin/env python3
"""
Reorganize goth sprite folders into wardrobe-ready subcategories
and regenerate the sprite manifest.
"""

import os
import shutil
from pathlib import Path

BASE = Path(__file__).parent
SPRITES = BASE / 'assets/sprites'

# ── heads-bodies classification rules (checked in order, first match wins)
HEADS_BODIES_RULES = [
    # category_folder, keywords that must appear in filename
    ('bases',  ['fullgothbody', 'whitebody', 'whitetorso', 'gothbody']),
    ('bases',  ['body']),          # body, body3..6
    ('hair',   ['hair']),          # bluehair, redhair, greyhair
    ('arms',   ['arm', 'arms', 'gotharm', 'glovedhands', 'hands', 'crossedarms']),
    ('legs',   ['legs', 'gothlegs', 'greylegs', 'chainedlegs', 'crossedlegs',
                'holeypants', 'greypants2']),
    ('heads',  []),                # everything else goes to heads
]

def classify_head_body(name):
    stem = name.lower().replace('.png', '')
    for folder, keywords in HEADS_BODIES_RULES:
        if not keywords:
            return folder
        for kw in keywords:
            if kw in stem:
                return folder
    return 'heads'

def reorganize():
    hb = SPRITES / 'heads-bodies'
    subfolders = ['bases', 'heads', 'hair', 'arms', 'legs']

    for sf in subfolders:
        (hb / sf).mkdir(exist_ok=True)

    moved = {sf: [] for sf in subfolders}

    for png in sorted(hb.glob('*.png')):
        dest_folder = classify_head_body(png.name)
        dest = hb / dest_folder / png.name
        shutil.move(str(png), str(dest))
        moved[dest_folder].append(png.name)

    for sf, files in moved.items():
        print(f"  {sf}/  ({len(files)} files)")

def make_manifest():
    categories = {
        '🧍 Bodies':      list_sprites('heads-bodies/bases'),
        '👤 Heads':       list_sprites('heads-bodies/heads'),
        '💇 Hair':        list_sprites('heads-bodies/hair'),
        '💪 Arms & Hands': list_sprites('heads-bodies/arms'),
        '🦵 Legs':        list_sprites('heads-bodies/legs'),
        '👚 Tops':        list_sprites('tops'),
        '👖 Bottoms':     list_sprites('bottoms'),
        '👗 Dresses':     list_sprites('dresses'),
        '👠 Shoes':       list_sprites('shoes'),
        '🦋 Wings':       list_sprites('wings'),
        '✨ Props':       list_sprites('props'),
    }

    lines = ['/* Auto-generated sprite manifest – Goth Maker */']
    lines.append('var SPRITE_MANIFEST = {')
    for cat, paths in categories.items():
        if not paths:
            continue
        entries = ',\n    '.join(f"'{p}'" for p in paths)
        lines.append(f"  {json_str(cat)}: [\n    {entries}\n  ],")
    lines.append('};')

    manifest = SPRITES / 'manifest.js'
    manifest.write_text('\n'.join(lines) + '\n')
    print(f"\nManifest written: {manifest}")
    for cat, paths in categories.items():
        print(f"  {cat}: {len(paths)} sprites")

def list_sprites(rel):
    folder = SPRITES / rel
    if not folder.exists():
        return []
    return sorted(
        f'assets/sprites/{rel}/{p.name}'
        for p in folder.glob('*.png')
    )

def json_str(s):
    return '"' + s.replace('"', '\\"') + '"'

if __name__ == '__main__':
    print('Reorganizing heads-bodies...')
    reorganize()
    print('\nBuilding manifest...')
    make_manifest()
    print('\nDone.')
