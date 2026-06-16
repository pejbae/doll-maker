'use strict';
/* ─────────────────────────────────────────
   DOLLZ MAKER  –  drag-and-drop engine
   ───────────────────────────────────────── */

// ── DOM refs
const canvas     = document.getElementById('canvas');
const ghost      = document.getElementById('drag-ghost');
const catTabs    = document.getElementById('cat-tabs');
const spriteGrid = document.getElementById('sprite-grid');

// ── State
let placed      = [];   // { el, src, scale }
let selected    = null; // currently selected canvas item
let nextZ       = 10;
let globalScale = 1;    // from the scale slider

// ── Drag state  (null when not dragging)
// { type: 'tray'|'canvas', src, el?, offsetX, offsetY }
let drag = null;

// ══════════════════════════════════════
// WARDROBE
// ══════════════════════════════════════

function buildWardrobe() {
  const categories = Object.keys(SPRITE_MANIFEST);
  if (!categories.length) { catTabs.textContent = 'No sprites found.'; return; }

  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (i === 0 ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      catTabs.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fillGrid(cat);
    });
    catTabs.appendChild(btn);
  });

  fillGrid(categories[0]);
}

function fillGrid(cat) {
  spriteGrid.innerHTML = '';
  const sprites = SPRITE_MANIFEST[cat] || [];

  sprites.forEach(src => {
    const img = document.createElement('img');
    img.src        = src;
    img.className  = 'sprite-thumb';
    img.title      = src.split('/').pop().replace(/\.\w+$/, '').replace(/[_-]/g, ' ');
    img.draggable  = false;
    img.addEventListener('mousedown',  e => onTrayMouseDown(e, src));
    img.addEventListener('touchstart', e => onTrayTouchStart(e, src), { passive: false });
    spriteGrid.appendChild(img);
  });
}

// ══════════════════════════════════════
// DRAG FROM TRAY  (mouse)
// ══════════════════════════════════════

function onTrayMouseDown(e, src) {
  if (e.button !== 0) return;
  e.preventDefault();
  drag = { type: 'tray', src };
  showGhost(src, e.clientX, e.clientY);
}

// ══════════════════════════════════════
// REPOSITION CANVAS ITEM  (mouse)
// ══════════════════════════════════════

function onCanvasItemMouseDown(e, item) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  selectItem(item);
  const rect = item.el.getBoundingClientRect();
  drag = {
    type:    'canvas',
    item,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
  };
}

// ══════════════════════════════════════
// GLOBAL MOUSE EVENTS
// ══════════════════════════════════════

document.addEventListener('mousemove', e => {
  if (!drag) return;

  if (drag.type === 'tray') {
    moveGhost(e.clientX, e.clientY);
  } else if (drag.type === 'canvas') {
    const r   = canvas.getBoundingClientRect();
    const x   = e.clientX - r.left - drag.offsetX;
    const y   = e.clientY - r.top  - drag.offsetY;
    drag.item.el.style.left = x + 'px';
    drag.item.el.style.top  = y + 'px';
  }
});

document.addEventListener('mouseup', e => {
  if (!drag) return;

  if (drag.type === 'tray') {
    hideGhost();
    const r = canvas.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom) {
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      placeItem(drag.src, x, y);
    }
  }

  drag = null;
});

// ══════════════════════════════════════
// TOUCH SUPPORT  (tray → canvas)
// ══════════════════════════════════════

function onTrayTouchStart(e, src) {
  e.preventDefault();
  const t = e.touches[0];
  drag = { type: 'tray', src };
  showGhost(src, t.clientX, t.clientY);
}

document.addEventListener('touchmove', e => {
  if (!drag) return;
  e.preventDefault();
  const t = e.touches[0];

  if (drag.type === 'tray') {
    moveGhost(t.clientX, t.clientY);
  } else if (drag.type === 'canvas') {
    const r = canvas.getBoundingClientRect();
    drag.item.el.style.left = (t.clientX - r.left - drag.offsetX) + 'px';
    drag.item.el.style.top  = (t.clientY - r.top  - drag.offsetY) + 'px';
  }
}, { passive: false });

document.addEventListener('touchend', e => {
  if (!drag) return;

  if (drag.type === 'tray') {
    hideGhost();
    const t = e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    if (t.clientX >= r.left && t.clientX <= r.right &&
        t.clientY >= r.top  && t.clientY <= r.bottom) {
      placeItem(drag.src, t.clientX - r.left, t.clientY - r.top);
    }
  }

  drag = null;
});

// ══════════════════════════════════════
// GHOST IMAGE
// ══════════════════════════════════════

function showGhost(src, cx, cy) {
  ghost.src             = src;
  ghost.style.display   = 'block';
  ghost.style.maxWidth  = '80px';
  ghost.style.maxHeight = '120px';
  moveGhost(cx, cy);
}

function moveGhost(cx, cy) {
  ghost.style.left = cx + 'px';
  ghost.style.top  = cy + 'px';
}

function hideGhost() {
  ghost.style.display = 'none';
}

// ══════════════════════════════════════
// PLACE ITEM ON CANVAS
// ══════════════════════════════════════

function placeItem(src, cx, cy) {
  const img        = document.createElement('img');
  img.src          = src;
  img.className    = 'canvas-item';
  img.draggable    = false;
  img.style.zIndex = nextZ++;

  // Position centred on drop point; adjust once loaded so we know actual size
  img.style.left = (cx - 30) + 'px';
  img.style.top  = (cy - 30) + 'px';

  img.onload = () => {
    img.style.left = (cx - img.naturalWidth  * globalScale / 2) + 'px';
    img.style.top  = (cy - img.naturalHeight * globalScale / 2) + 'px';
    applyScale(img);
  };

  const item = { el: img, src };
  placed.push(item);

  img.addEventListener('mousedown',  e => onCanvasItemMouseDown(e, item));
  img.addEventListener('touchstart', e => onCanvasItemTouchStart(e, item), { passive: false });
  img.addEventListener('dblclick',   () => removeItem(item));
  img.addEventListener('click',      e => { e.stopPropagation(); selectItem(item); });

  canvas.appendChild(img);
  selectItem(item);
}

function applyScale(el) {
  el.style.width  = (el.naturalWidth  * globalScale) + 'px';
  el.style.height = (el.naturalHeight * globalScale) + 'px';
}

// Touch reposition of canvas items
function onCanvasItemTouchStart(e, item) {
  e.preventDefault();
  e.stopPropagation();
  selectItem(item);
  const t = e.touches[0];
  const r = item.el.getBoundingClientRect();
  drag = {
    type:    'canvas',
    item,
    offsetX: t.clientX - r.left,
    offsetY: t.clientY - r.top,
  };
}

// ══════════════════════════════════════
// SELECTION
// ══════════════════════════════════════

function selectItem(item) {
  if (selected) selected.el.classList.remove('selected');
  selected = item;
  if (item) item.el.classList.add('selected');
}

canvas.addEventListener('click', () => selectItem(null));

// ══════════════════════════════════════
// REMOVE ITEM
// ══════════════════════════════════════

function removeItem(item) {
  item.el.remove();
  placed = placed.filter(i => i !== item);
  if (selected === item) selectItem(null);
}

// ══════════════════════════════════════
// TOOLBAR BUTTONS
// ══════════════════════════════════════

document.getElementById('btn-undo').addEventListener('click', () => {
  if (placed.length) removeItem(placed[placed.length - 1]);
});

document.getElementById('btn-clear').addEventListener('click', () => {
  placed.forEach(i => i.el.remove());
  placed = [];
  selectItem(null);
});

document.getElementById('btn-front').addEventListener('click', () => {
  if (selected) selected.el.style.zIndex = nextZ++;
});

document.getElementById('btn-back').addEventListener('click', () => {
  if (selected) selected.el.style.zIndex = 1;
});

document.getElementById('btn-delete').addEventListener('click', () => {
  if (selected) removeItem(selected);
});

// ── Background swatches
document.querySelectorAll('.bg-swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    canvas.style.backgroundColor = btn.dataset.color;
  });
});

// ── Scale slider
const scaleSlider = document.getElementById('scale-slider');
const scaleLabel  = document.getElementById('scale-label');

scaleSlider.addEventListener('input', () => {
  globalScale = scaleSlider.value / 100;
  scaleLabel.textContent = scaleSlider.value + '%';
  // Rescale all existing canvas items
  placed.forEach(item => {
    const el = item.el;
    if (el.naturalWidth) applyScale(el);
  });
});

// ══════════════════════════════════════
// SAVE AS PNG
// ══════════════════════════════════════

document.getElementById('btn-save').addEventListener('click', async () => {
  const btn = document.getElementById('btn-save');
  btn.textContent = '⏳ saving…';
  btn.disabled    = true;

  const out = document.createElement('canvas');
  out.width  = canvas.offsetWidth;
  out.height = canvas.offsetHeight;
  const ctx  = out.getContext('2d');

  // BG colour
  ctx.fillStyle = canvas.style.backgroundColor || '#1A0A2E';
  ctx.fillRect(0, 0, out.width, out.height);

  // Sort items by z-index and draw in order
  const sorted = [...canvas.querySelectorAll('.canvas-item')]
    .sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0));

  for (const el of sorted) {
    await drawEl(ctx, el);
  }

  // Attribution
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.font = '9px Arial';
  ctx.fillText('sprites © easydoll.com  |  dollzmaker passion project', 4, out.height - 4);

  const a   = document.createElement('a');
  a.download = 'my-doll.png';
  a.href     = out.toDataURL('image/png');
  a.click();

  btn.textContent = '💾 Save PNG';
  btn.disabled    = false;
});

function drawEl(ctx, el) {
  return new Promise(res => {
    const img   = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, parseInt(el.style.left) || 0, parseInt(el.style.top) || 0,
                    el.offsetWidth, el.offsetHeight);
      res();
    };
    img.onerror = res;
    img.src = el.src;
  });
}

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════

canvas.style.backgroundColor = '#1A0A2E';
buildWardrobe();
