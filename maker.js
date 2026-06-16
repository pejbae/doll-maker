/* ============================================
   KAWAII DOLLZ MAKER — interaction logic
   ============================================ */

const ITEMS = {
  hair: [
    { id: 'hair-bob',       name: 'PINK BOB',    src: 'assets/hair/bob.svg'       },
    { id: 'hair-twintails', name: 'TWIN TAILS',  src: 'assets/hair/twintails.svg'  },
    { id: 'hair-long',      name: 'LONG WAVE',   src: 'assets/hair/long.svg'       },
    { id: 'hair-buns',      name: 'SPACE BUNS',  src: 'assets/hair/buns.svg'       },
    { id: 'hair-curly',     name: 'CURLY',       src: 'assets/hair/curly.svg'      },
  ],
  tops: [
    { id: 'top-sailor',  name: 'SAILOR',   src: 'assets/tops/sailor.svg'  },
    { id: 'top-lolita',  name: 'LOLITA',   src: 'assets/tops/lolita.svg'  },
    { id: 'top-hoodie',  name: 'HOODIE',   src: 'assets/tops/hoodie.svg'  },
    { id: 'top-kimono',  name: 'KIMONO',   src: 'assets/tops/kimono.svg'  },
  ],
  bottoms: [
    { id: 'bottom-pleated', name: 'PLEATED',  src: 'assets/bottoms/pleated.svg' },
    { id: 'bottom-shorts',  name: 'SHORTS',   src: 'assets/bottoms/shorts.svg'  },
    { id: 'bottom-tutu',    name: 'TUTU',     src: 'assets/bottoms/tutu.svg'    },
  ],
  accessories: [
    { id: 'acc-catears', name: 'CAT EARS', src: 'assets/accessories/catears.svg' },
    { id: 'acc-bow',     name: 'BIG BOW',  src: 'assets/accessories/bow.svg'     },
    { id: 'acc-wand',    name: 'WAND',     src: 'assets/accessories/wand.svg'    },
    { id: 'acc-glasses', name: 'GLASSES',  src: 'assets/accessories/glasses.svg' },
  ],
  pets: [
    { id: 'pet-cat',    name: 'KITTY',  src: 'assets/pets/cat.svg'    },
    { id: 'pet-bunny',  name: 'BUNNY',  src: 'assets/pets/bunny.svg'  },
    { id: 'pet-shiba',  name: 'SHIBA',  src: 'assets/pets/shiba.svg'  },
  ],
};

const LAYER_MAP = {
  hair:        'layer-hair',
  tops:        'layer-top',
  bottoms:     'layer-bottom',
  accessories: 'layer-accessory',
  pets:        'layer-pet',
};

const CATEGORY_NAMES = {
  hair:        '💇 Hair',
  tops:        '👗 Top',
  bottoms:     '🩱 Bottom',
  accessories: '✨ Accessory',
  pets:        '🐾 Pet',
};

const selections = { hair: null, tops: null, bottoms: null, accessories: null, pets: null };
let activeCategory = 'hair';

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  renderGrid('hair');
  setupButtons();
  updateSummary();
});

/* ── TABS ── */
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      renderGrid(activeCategory);
    });
  });
}

/* ── GRID ── */
function renderGrid(category) {
  const grid = document.getElementById('item-grid');
  grid.innerHTML = '';

  // None option
  const noneCard = makeCard(null, category);
  grid.appendChild(noneCard);

  ITEMS[category].forEach(item => {
    grid.appendChild(makeCard(item, category));
  });
}

function makeCard(item, category) {
  const card = document.createElement('div');
  const isSelected = item === null
    ? selections[category] === null
    : selections[category]?.id === item?.id;

  card.className = 'item-card' + (item === null ? ' none-card' : '') + (isSelected ? ' selected' : '');
  card.setAttribute('role', 'option');
  card.setAttribute('aria-selected', isSelected);

  if (item === null) {
    card.innerHTML = `
      <div class="item-preview-icon">✕</div>
      <div class="item-name">NONE</div>
    `;
  } else {
    card.innerHTML = `
      <img class="item-preview" src="${item.src}" alt="${item.name}" loading="lazy" onerror="this.style.opacity='0.3'">
      <div class="item-name">${item.name}</div>
    `;
  }

  card.addEventListener('click', () => selectItem(category, item));
  return card;
}

/* ── SELECTION ── */
function selectItem(category, item) {
  selections[category] = item;

  const layer = document.getElementById(LAYER_MAP[category]);
  if (item) {
    layer.src = item.src;
    layer.style.display = 'block';
  } else {
    layer.src = '';
    layer.style.display = 'none';
  }

  renderGrid(category);
  updateSummary();
}

/* ── SUMMARY ── */
function updateSummary() {
  const parts = Object.entries(selections)
    .filter(([, v]) => v !== null)
    .map(([cat, item]) => `${CATEGORY_NAMES[cat]}: ${item.name}`);

  const el = document.getElementById('selection-summary');
  el.textContent = parts.length ? parts.join('  ·  ') : '(nothing selected yet!)';
}

/* ── BUTTONS ── */
function setupButtons() {
  document.getElementById('btn-random').addEventListener('click', randomize);
  document.getElementById('btn-clear').addEventListener('click', clearAll);
  document.getElementById('btn-save').addEventListener('click', saveDoll);
}

function randomize() {
  Object.keys(ITEMS).forEach(cat => {
    const pool = ITEMS[cat];
    const includeNone = cat !== 'hair' && Math.random() < 0.28;
    const chosen = includeNone ? null : pool[Math.floor(Math.random() * pool.length)];
    selectItem(cat, chosen);
  });
  renderGrid(activeCategory);
}

function clearAll() {
  Object.keys(ITEMS).forEach(cat => selectItem(cat, null));
  renderGrid(activeCategory);
}

/* ── SAVE ── */
async function saveDoll() {
  const btn = document.getElementById('btn-save');
  btn.textContent = '⏳ SAVING...';
  btn.disabled = true;

  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 200, 280);
  grad.addColorStop(0,   '#FFD6E0');
  grad.addColorStop(0.5, '#E8D5F0');
  grad.addColorStop(1,   '#C7E5F8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 200, 280);

  const layerIds = [
    'layer-pet', 'layer-base-body', 'layer-bottom',
    'layer-top', 'layer-base-head', 'layer-hair', 'layer-accessory'
  ];

  for (const id of layerIds) {
    const img = document.getElementById(id);
    const srcAttr = img?.getAttribute('src');
    if (!img || img.style.display === 'none' || !srcAttr) continue;
    await drawImgToCanvas(ctx, img.src);
  }

  const link = document.createElement('a');
  link.download = 'kawaii-doll.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  btn.innerHTML = '<span>💾</span> SAVE';
  btn.disabled = false;
}

function drawImgToCanvas(ctx, src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { ctx.drawImage(img, 0, 0, 200, 280); resolve(); };
    img.onerror = resolve;
    img.src = src;
  });
}
