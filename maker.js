/* =========================================
   DOLLZ MAKER — drag-and-drop engine
   =========================================
   Architecture:
   - Items in tray are draggable source images
   - Canvas is the drop target (free-position)
   - Each dropped item = absolutely-positioned <img> on canvas
   - Items can be re-dragged to reposition
   - Double-click removes; toolbar for layer control
   ========================================= */

/* ── ITEM DATA ──────────────────────────────
   src: the actual SVG shown on canvas
   w/h: display size on canvas (pixels)
   Add real PNG/SVG sprites here later.
   ------------------------------------------ */
const ITEMS = {
  hair: [
    { id: 'hair-long-brown',    name: 'Long Brown',    src: 'assets/hair/long-brown.svg',    w: 80,  h: 100 },
    { id: 'hair-long-blonde',   name: 'Long Blonde',   src: 'assets/hair/long-blonde.svg',   w: 80,  h: 100 },
    { id: 'hair-wavy-black',    name: 'Wavy Black',    src: 'assets/hair/wavy-black.svg',    w: 80,  h: 110 },
    { id: 'hair-updo',          name: 'Updo',          src: 'assets/hair/updo.svg',          w: 70,  h: 70  },
    { id: 'hair-ponytail',      name: 'Ponytail',      src: 'assets/hair/ponytail.svg',      w: 75,  h: 95  },
  ],
  tops: [
    { id: 'top-crop-pink',      name: 'Crop Top',      src: 'assets/tops/crop-pink.svg',     w: 80,  h: 55  },
    { id: 'top-tube-blue',      name: 'Tube Top',      src: 'assets/tops/tube-blue.svg',     w: 80,  h: 48  },
    { id: 'top-halter',         name: 'Halter',        src: 'assets/tops/halter.svg',        w: 80,  h: 55  },
    { id: 'top-jacket',         name: 'Jacket',        src: 'assets/tops/jacket.svg',        w: 90,  h: 75  },
    { id: 'top-dress',          name: 'Mini Dress',    src: 'assets/tops/dress.svg',         w: 82,  h: 120 },
  ],
  bottoms: [
    { id: 'bottom-flare-jeans', name: 'Flare Jeans',  src: 'assets/bottoms/flare-jeans.svg', w: 80, h: 120 },
    { id: 'bottom-miniskirt',   name: 'Mini Skirt',    src: 'assets/bottoms/miniskirt.svg',   w: 80, h: 55  },
    { id: 'bottom-skirt-long',  name: 'Long Skirt',    src: 'assets/bottoms/skirt-long.svg',  w: 80, h: 110 },
    { id: 'bottom-shorts',      name: 'Shorts',        src: 'assets/bottoms/shorts.svg',      w: 80, h: 50  },
  ],
  shoes: [
    { id: 'shoes-platforms',    name: 'Platforms',     src: 'assets/shoes/platforms.svg',    w: 80,  h: 35  },
    { id: 'shoes-heels',        name: 'Heels',         src: 'assets/shoes/heels.svg',        w: 80,  h: 35  },
    { id: 'shoes-boots',        name: 'Knee Boots',    src: 'assets/shoes/boots.svg',        w: 80,  h: 75  },
    { id: 'shoes-sneakers',     name: 'Sneakers',      src: 'assets/shoes/sneakers.svg',     w: 80,  h: 30  },
  ],
  accessories: [
    { id: 'acc-sunglasses',     name: 'Sunglasses',    src: 'assets/accessories/sunglasses.svg', w: 60, h: 22 },
    { id: 'acc-bag',            name: 'Handbag',       src: 'assets/accessories/bag.svg',         w: 45, h: 50 },
    { id: 'acc-necklace',       name: 'Necklace',      src: 'assets/accessories/necklace.svg',    w: 60, h: 20 },
    { id: 'acc-wings',          name: 'Fairy Wings',   src: 'assets/accessories/wings.svg',       w: 130,h: 100 },
    { id: 'acc-crown',          name: 'Tiara',         src: 'assets/accessories/crown.svg',       w: 55, h: 30 },
    { id: 'acc-wand',           name: 'Wand',          src: 'assets/accessories/wand.svg',        w: 40, h: 90 },
  ],
  pets: [
    { id: 'pet-cat',            name: 'Cat',           src: 'assets/pets/cat.svg',           w: 65,  h: 55  },
    { id: 'pet-dog',            name: 'Puppy',         src: 'assets/pets/dog.svg',           w: 65,  h: 55  },
    { id: 'pet-butterfly',      name: 'Butterfly',     src: 'assets/pets/butterfly.svg',     w: 55,  h: 45  },
  ],
};

/* ── STATE ─────────────────────────────── */
let activeCategory = 'hair';
let nextZ = 10;
let canvasItems = []; // { el, item }
let selectedItem = null; // currently selected canvas item element
let activeDrag = null;   // { type: 'tray'|'canvas', ... }
const ghost = document.getElementById('drag-ghost');

/* ── INIT ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  renderTray('hair');
  setupCanvas();
  setupToolbar();
  setupSkinButtons();
  setupBgButtons();
});

/* ── TABS ─────────────────────────────── */
function setupTabs() {
  document.querySelectorAll('.tray-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tray-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderTray(activeCategory);
    });
  });
}

/* ── TRAY RENDERING ──────────────────── */
function renderTray(category) {
  const container = document.getElementById('tray-items');
  container.innerHTML = '';

  (ITEMS[category] || []).forEach(item => {
    const card = document.createElement('div');
    card.className = 'tray-item';
    card.title = item.name;

    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.name;
    img.draggable = false;
    img.onerror = () => { img.style.opacity = '0.3'; };

    const label = document.createElement('div');
    label.className = 'tray-item-name';
    label.textContent = item.name;

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener('mousedown', (e) => startTrayDrag(e, item));
    card.addEventListener('touchstart', (e) => startTrayTouch(e, item), { passive: false });

    container.appendChild(card);
  });
}

/* ── CANVAS SETUP ─────────────────────── */
function setupCanvas() {
  const canvas = document.getElementById('canvas');

  // Click canvas background = deselect
  canvas.addEventListener('mousedown', (e) => {
    if (e.target === canvas || e.target.id === 'doll-base') {
      deselectAll();
    }
  });
}

/* ── DRAG FROM TRAY ──────────────────── */
function startTrayDrag(e, item) {
  e.preventDefault();

  ghost.src = item.src;
  ghost.style.width = item.w + 'px';
  ghost.style.height = item.h + 'px';
  ghost.style.display = 'block';
  positionGhost(e.clientX, e.clientY);

  activeDrag = { type: 'tray', item };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

/* ── DRAG CANVAS ITEM ────────────────── */
function startCanvasDrag(e, el, item) {
  e.preventDefault();
  e.stopPropagation();

  selectItem(el);

  const rect = el.getBoundingClientRect();
  const canvasRect = document.getElementById('canvas').getBoundingClientRect();

  activeDrag = {
    type: 'canvas',
    el,
    item,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

/* ── MOUSE MOVE ──────────────────────── */
function onMouseMove(e) {
  if (!activeDrag) return;

  if (activeDrag.type === 'tray') {
    positionGhost(e.clientX, e.clientY);
  } else if (activeDrag.type === 'canvas') {
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - activeDrag.offsetX;
    const y = e.clientY - canvasRect.top  - activeDrag.offsetY;
    activeDrag.el.style.left = x + 'px';
    activeDrag.el.style.top  = y + 'px';
  }
}

/* ── MOUSE UP ────────────────────────── */
function onMouseUp(e) {
  if (!activeDrag) return;

  if (activeDrag.type === 'tray') {
    ghost.style.display = 'none';

    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const { item } = activeDrag;

    // Only place if dropped inside canvas
    if (
      e.clientX >= canvasRect.left && e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top  && e.clientY <= canvasRect.bottom
    ) {
      const x = e.clientX - canvasRect.left - item.w / 2;
      const y = e.clientY - canvasRect.top  - item.h / 2;
      placeItemOnCanvas(item, x, y);
    }
  }

  activeDrag = null;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

/* ── PLACE ITEM ON CANVAS ────────────── */
function placeItemOnCanvas(item, x, y) {
  const canvas = document.getElementById('canvas');

  const el = document.createElement('img');
  el.src = item.src;
  el.alt = item.name;
  el.className = 'canvas-item';
  el.style.width  = item.w + 'px';
  el.style.height = item.h + 'px';
  el.style.left   = clamp(x, 0, 360 - item.w) + 'px';
  el.style.top    = clamp(y, 0, 420 - item.h) + 'px';
  el.style.zIndex = nextZ++;
  el.draggable    = false;

  // Select on click
  el.addEventListener('mousedown', (e) => {
    if (e.detail === 1) startCanvasDrag(e, el, item);
  });

  // Double-click removes
  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    removeCanvasItem(el);
  });

  // Touch support
  el.addEventListener('touchstart', (e) => startItemTouch(e, el, item), { passive: false });

  canvas.appendChild(el);
  canvasItems.push({ el, item });
  selectItem(el);
}

/* ── TOUCH SUPPORT ────────────────────── */
function startTrayTouch(e, item) {
  e.preventDefault();
  const touch = e.touches[0];

  ghost.src = item.src;
  ghost.style.width = item.w + 'px';
  ghost.style.height = item.h + 'px';
  ghost.style.display = 'block';
  positionGhost(touch.clientX, touch.clientY);

  function onTouchMove(ev) {
    const t = ev.touches[0];
    positionGhost(t.clientX, t.clientY);
  }

  function onTouchEnd(ev) {
    ghost.style.display = 'none';
    const t = ev.changedTouches[0];
    const canvas = document.getElementById('canvas');
    const r = canvas.getBoundingClientRect();
    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
      placeItemOnCanvas(item, t.clientX - r.left - item.w/2, t.clientY - r.top - item.h/2);
    }
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  }

  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
}

function startItemTouch(e, el, item) {
  e.preventDefault();
  e.stopPropagation();
  selectItem(el);

  const touch = e.touches[0];
  const rect = el.getBoundingClientRect();
  const canvasRect = document.getElementById('canvas').getBoundingClientRect();
  const offsetX = touch.clientX - rect.left;
  const offsetY = touch.clientY - rect.top;

  function onMove(ev) {
    const t = ev.touches[0];
    el.style.left = (t.clientX - canvasRect.left - offsetX) + 'px';
    el.style.top  = (t.clientY - canvasRect.top  - offsetY) + 'px';
  }

  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', () => {
    document.removeEventListener('touchmove', onMove);
  }, { once: true });
}

/* ── SELECTION ────────────────────────── */
function selectItem(el) {
  deselectAll();
  el.classList.add('selected');
  selectedItem = el;
}

function deselectAll() {
  document.querySelectorAll('.canvas-item.selected').forEach(el => el.classList.remove('selected'));
  selectedItem = null;
}

function removeCanvasItem(el) {
  if (selectedItem === el) selectedItem = null;
  canvasItems = canvasItems.filter(c => c.el !== el);
  el.remove();
}

/* ── TOOLBAR ──────────────────────────── */
function setupToolbar() {
  document.getElementById('btn-undo').addEventListener('click', () => {
    if (canvasItems.length) removeCanvasItem(canvasItems[canvasItems.length - 1].el);
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    [...canvasItems].forEach(c => c.el.remove());
    canvasItems = [];
    selectedItem = null;
  });

  document.getElementById('btn-front').addEventListener('click', () => {
    if (selectedItem) selectedItem.style.zIndex = nextZ++;
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    if (selectedItem) {
      const minZ = Math.max(2, parseInt(selectedItem.style.zIndex) - 1);
      selectedItem.style.zIndex = minZ;
    }
  });

  document.getElementById('btn-remove').addEventListener('click', () => {
    if (selectedItem) removeCanvasItem(selectedItem);
  });
}

/* ── SKIN TONE ────────────────────────── */
function setupSkinButtons() {
  const base = document.getElementById('doll-base');
  document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      base.src = btn.dataset.src;
    });
  });
  // Default active
  document.querySelector('.skin-btn').classList.add('active');
}

/* ── BACKGROUND ──────────────────────── */
function setupBgButtons() {
  const canvas = document.getElementById('canvas');
  document.querySelectorAll('.bg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      canvas.style.background = btn.dataset.color;
    });
  });
  document.querySelector('.bg-btn').classList.add('active');
}

/* ── SAVE AS PNG ──────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-save').addEventListener('click', saveDoll);
});

async function saveDoll() {
  const btn = document.getElementById('btn-save');
  btn.textContent = '⏳ Saving…';
  btn.disabled = true;

  const canvasEl   = document.getElementById('canvas');
  const canvasRect = canvasEl.getBoundingClientRect();
  const W = canvasEl.offsetWidth;
  const H = canvasEl.offsetHeight;

  const offscreen = document.createElement('canvas');
  offscreen.width  = W;
  offscreen.height = H;
  const ctx = offscreen.getContext('2d');

  // Background
  ctx.fillStyle = canvasEl.style.background || '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Collect all visible images in z-order
  const layers = [];

  const baseImg = document.getElementById('doll-base');
  const baseRect = baseImg.getBoundingClientRect();
  layers.push({ src: baseImg.src, x: baseRect.left - canvasRect.left, y: baseRect.top - canvasRect.top, w: baseImg.offsetWidth, h: baseImg.offsetHeight, z: 1 });

  canvasItems.forEach(({ el }) => {
    const r = el.getBoundingClientRect();
    layers.push({ src: el.src, x: r.left - canvasRect.left, y: r.top - canvasRect.top, w: el.offsetWidth, h: el.offsetHeight, z: parseInt(el.style.zIndex) || 10 });
  });

  layers.sort((a, b) => a.z - b.z);

  for (const layer of layers) {
    await drawLayer(ctx, layer);
  }

  offscreen.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-doll.png';
    a.click();
    URL.revokeObjectURL(url);

    // Save to gallery
    const dataUrl = offscreen.toDataURL('image/png');
    const gallery = JSON.parse(localStorage.getItem('dollz-gallery') || '[]');
    gallery.unshift({ dataUrl, date: new Date().toLocaleDateString() });
    if (gallery.length > 30) gallery.pop();
    localStorage.setItem('dollz-gallery', JSON.stringify(gallery));

    btn.textContent = '✓ Saved!';
    setTimeout(() => { btn.innerHTML = '💾 Save PNG'; btn.disabled = false; }, 1800);
  });
}

function drawLayer(ctx, layer) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { ctx.drawImage(img, layer.x, layer.y, layer.w, layer.h); resolve(); };
    img.onerror = resolve;
    img.src = layer.src;
  });
}

/* ── UTILS ────────────────────────────── */
function positionGhost(x, y) {
  ghost.style.left = x + 'px';
  ghost.style.top  = y + 'px';
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
