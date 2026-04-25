/* ===== PRODUCTS PAGE JS ===== */

let filteredProducts = [...PRODUCTS];
let selectedFilters = { category: 'all', materials: ['PLA','PETG','ABS','Reçine','TPU'], maxPrice: 700, search: '' };
let currentSort = 'default';

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productsCount');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  let products = PRODUCTS.filter(p => {
    if (selectedFilters.category !== 'all' && p.category !== selectedFilters.category) return false;
    if (!selectedFilters.materials.includes(p.material)) return false;
    if (p.price > selectedFilters.maxPrice) return false;
    if (selectedFilters.search && !p.name.toLowerCase().includes(selectedFilters.search)) return false;
    return true;
  });

  // Sort
  if (currentSort === 'price-asc') products.sort((a,b) => a.price - b.price);
  else if (currentSort === 'price-desc') products.sort((a,b) => b.price - a.price);
  else if (currentSort === 'name') products.sort((a,b) => a.name.localeCompare(b.name, 'tr'));

  if (countEl) countEl.textContent = `${products.length} ürün listeleniyor`;
  noResults.style.display = products.length === 0 ? 'block' : 'none';

  grid.innerHTML = products.map(p => `
    <div class="product-card" id="prod-${p.id}" onclick="openProductModal('${p.id}')">
      <div class="product-img">
        <span style="z-index:1; position:relative; font-size:3rem;">${p.emoji}</span>
      </div>
      <div class="product-info">
        <div class="product-name">${escapeHTML(p.name)}</div>
        <div class="product-desc">${escapeHTML(p.desc)}</div>
        <div style="display:flex;gap:4px;margin-bottom:12px;">
          ${p.colors.map(c => `<span style="width:14px;height:14px;border-radius:50%;background:${c};display:inline-block;border:1px solid rgba(255,255,255,.15)"></span>`).join('')}
        </div>
        <div class="product-footer">
          <div>
            <div class="product-price">${p.price.toFixed(2)}₺</div>
            ${p.badge ? `<span class="product-badge badge-${p.badge}">${escapeHTML(p.badgeText)}</span>` : ''}
          </div>
          <button class="add-to-cart-btn" onclick="event.stopPropagation(); quickAdd('${p.id}')" title="Sepete Ekle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Anchor jump
  const hash = location.hash.replace('#','');
  if (hash) {
    const el = document.getElementById(`prod-${hash}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); openProductModal(hash); }
  }
}

function quickAdd(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p) LumCart.addItem({ id: p.id, name: p.name, price: p.price, emoji: p.emoji }, 1);
}

let modalQty = 1;
let modalProduct = null;

function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  modalProduct = p;
  modalQty = 1;

  document.getElementById('modalTitle').textContent = p.name;

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-product-img">${p.emoji}</div>
    <div class="modal-product-meta">
      <span class="meta-tag">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        ${escapeHTML(p.material)}
      </span>
      <span class="meta-tag">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        Stok: ${p.stock} adet
      </span>
      ${p.badge ? `<span class="product-badge badge-${p.badge}">${escapeHTML(p.badgeText)}</span>` : ''}
    </div>

    <p style="font-size:.9rem; line-height:1.7; margin-bottom:16px;">${escapeHTML(p.desc)}</p>

    <div style="margin-bottom:8px; font-size:.82rem; color:var(--mid-200); font-weight:500;">Renk Seç</div>
    <div class="color-swatches">
      ${p.colors.map((c, i) => `<div class="color-swatch${i===0?' selected':''}" style="background:${c}" onclick="selectColor(this)" title="${c}"></div>`).join('')}
    </div>

    <div style="margin-bottom:8px; font-size:.82rem; color:var(--mid-200); font-weight:500;">Adet</div>
    <div class="qty-control">
      <button class="qty-btn" onclick="changeQty(-1)">−</button>
      <span class="qty-value" id="modalQtyVal">1</span>
      <button class="qty-btn" onclick="changeQty(1)">+</button>
      <span style="font-size:.82rem; color:var(--mid-300); margin-left:4px;">/ max ${p.stock}</span>
    </div>

    <div style="display:flex; gap:12px; align-items:center; margin-top:8px;">
      <div>
        <div style="font-size:.78rem; color:var(--mid-300);">Toplam</div>
        <div id="modalTotalPrice" style="font-family:var(--font-head); font-size:1.5rem; font-weight:800; color:var(--green-300);">${p.price.toFixed(2)}₺</div>
      </div>
      <button class="btn-primary" style="flex:1;" onclick="addToCartFromModal()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        Sepete Ekle
      </button>
    </div>
  `;

  document.getElementById('productModal').classList.add('open');
}

function selectColor(el) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}

function changeQty(delta) {
  if (!modalProduct) return;
  modalQty = Math.max(1, Math.min(modalProduct.stock, modalQty + delta));
  document.getElementById('modalQtyVal').textContent = modalQty;
  document.getElementById('modalTotalPrice').textContent = (modalProduct.price * modalQty).toFixed(2) + '₺';
}

function addToCartFromModal() {
  if (!modalProduct) return;
  LumCart.addItem({ id: modalProduct.id, name: modalProduct.name, price: modalProduct.price, emoji: modalProduct.emoji }, modalQty);
  document.getElementById('productModal').classList.remove('open');
}

// Filters
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();

  // Category filter
  document.querySelectorAll('[name="cat"]').forEach(r => {
    r.addEventListener('change', () => {
      selectedFilters.category = r.value;
      renderProducts();
    });
  });

  // Material filter
  document.querySelectorAll('#materialFilter input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      selectedFilters.materials = [...document.querySelectorAll('#materialFilter input:checked')].map(i => i.value);
      renderProducts();
    });
  });

  // Price range
  const priceRange = document.getElementById('priceRange');
  const priceVal = document.getElementById('priceVal');
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      selectedFilters.maxPrice = parseInt(priceRange.value);
      priceVal.textContent = priceRange.value + '₺';
      renderProducts();
    });
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      selectedFilters.search = searchInput.value.toLowerCase();
      renderProducts();
    });
  }

  // Sort
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    currentSort = e.target.value;
    renderProducts();
  });

  // Clear filters
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    selectedFilters = { category: 'all', materials: ['PLA','PETG','ABS','Reçine','TPU'], maxPrice: 700, search: '' };
    document.querySelectorAll('[name="cat"]')[0].checked = true;
    document.querySelectorAll('#materialFilter input').forEach(i => i.checked = true);
    document.getElementById('priceRange').value = 700;
    document.getElementById('priceVal').textContent = '700₺';
    if (searchInput) searchInput.value = '';
    currentSort = 'default';
    document.getElementById('sortSelect').value = 'default';
    renderProducts();
  });

  // Modal close
  document.getElementById('modalClose')?.addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('open');
  });
  document.getElementById('productModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('productModal')) {
      document.getElementById('productModal').classList.remove('open');
    }
  });
});
