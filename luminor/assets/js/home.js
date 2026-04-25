/* ===== HOME PAGE JS ===== */

function renderFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;

  // İlk 4 ürünü göster
  const featured = PRODUCTS.slice(0, 4);

  container.innerHTML = featured.map(p => `
    <div class="product-card" onclick="window.location.href='products.html#${p.id}'">
      <div class="product-img">
        <span style="z-index:1; position:relative;">${p.emoji}</span>
      </div>
      <div class="product-info">
        <div class="product-name">${escapeHTML(p.name)}</div>
        <div class="product-desc">${escapeHTML(p.desc)}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">${p.price.toFixed(2)}₺</div>
            ${p.badge ? `<span class="product-badge badge-${p.badge}">${p.badgeText}</span>` : ''}
          </div>
          <button class="add-to-cart-btn" onclick="event.stopPropagation(); LumCart.addItem({id:'${p.id}',name:'${escapeHTML(p.name)}',price:${p.price},emoji:'${p.emoji}'}, 1)" title="Sepete Ekle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

// Scroll reveal
function initScrollReveal() {
  const els = document.querySelectorAll('.feature-card, .product-card, .testimonial-card, .step');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'slideUp .6s ease forwards';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.animationDelay = `${i * 0.05}s`;
    io.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderFeaturedProducts();
  initScrollReveal();
});
