/* ===== CART PAGE JS ===== */

const SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 49.90;
const COUPONS = { 'LUMINOR10': 10, 'ILKSIPARIS': 15 };

let appliedCoupon = null;
let currentCheckoutStep = 1;

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function formatPrice(n) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '₺';
}

function renderCart() {
  const items = LumCart.getItems();
  const emptyEl = document.getElementById('emptyCart');
  const contentEl = document.getElementById('cartContent');
  const headerCount = document.getElementById('cartHeaderCount');

  if (items.length === 0) {
    emptyEl.style.display = 'block';
    contentEl.style.display = 'none';
    if (headerCount) headerCount.textContent = 'Sepetiniz boş.';
    return;
  }

  emptyEl.style.display = 'none';
  contentEl.style.display = 'block';
  if (headerCount) headerCount.textContent = `Sepetinizde ${items.length} ürün bulunmaktadır.`;

  // Render items
  const cartItemsEl = document.getElementById('cartItems');
  cartItemsEl.innerHTML = items.map(item => `
    <div class="cart-item" id="ci-${item.id}">
      <div class="cart-item-img">${item.emoji || '📦'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHTML(item.name)}</div>
        <div class="cart-item-price">${formatPrice(item.price)} / adet</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn-sm" onclick="updateQty('${item.id}', ${item.qty - 1})">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn-sm" onclick="updateQty('${item.id}', ${item.qty + 1})">+</button>
      </div>
      <div class="cart-item-total">${formatPrice(item.price * item.qty)}</div>
      <button class="remove-btn" onclick="removeItem('${item.id}')" title="Kaldır">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');

  updateSummary();
  renderCheckoutArea();
}

function updateSummary() {
  const items = LumCart.getItems();
  const subtotal = LumCart.getTotal();

  // Shipping
  let shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const shippingEl = document.getElementById('summaryShipping');
  if (shippingEl) {
    if (shipping === 0) {
      shippingEl.textContent = 'Ücretsiz';
      shippingEl.classList.add('shipping-free');
    } else {
      const remaining = SHIPPING_THRESHOLD - subtotal;
      shippingEl.textContent = `${formatPrice(SHIPPING_COST)} (${formatPrice(remaining)} daha ekleyin, ücretsiz olsun!)`;
      shippingEl.classList.remove('shipping-free');
    }
  }

  // Coupon discount
  let discount = 0;
  if (appliedCoupon) {
    discount = (subtotal * COUPONS[appliedCoupon]) / 100;
    document.getElementById('discountRow').style.display = 'flex';
    document.getElementById('discountAmount').textContent = `-${formatPrice(discount)}`;
  } else {
    document.getElementById('discountRow').style.display = 'none';
  }

  const total = subtotal + shipping - discount;

  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal);
  document.getElementById('summaryTotal').textContent = formatPrice(total);
}

function renderCheckoutArea() {
  const area = document.getElementById('checkoutArea');
  if (!area) return;

  if (LumAuth.isLoggedIn()) {
    area.innerHTML = `<button class="btn-primary" style="width:100%; margin-top:8px;" onclick="openCheckout()">
      Siparişi Tamamla
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>`;
  } else {
    area.innerHTML = `
      <button class="btn-primary" style="width:100%; margin-top:8px; opacity:.6;" disabled>Siparişi Tamamla</button>
      <div class="login-prompt-card">
        <p>Siparişi tamamlamak için <a href="account.html">giriş yapın</a> veya <a href="account.html">üye olun</a>.</p>
        <a href="account.html" class="btn-ghost" style="font-size:.85rem; padding:8px 20px;">Giriş Yap</a>
      </div>
    `;
  }
}

function updateQty(id, qty) {
  LumCart.updateQty(id, qty);
  renderCart();
}

function removeItem(id) {
  const el = document.getElementById(`ci-${id}`);
  if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; }
  setTimeout(() => { LumCart.removeItem(id); renderCart(); }, 200);
}

function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  if (!code) { showToast('İndirim kodu girin.', 'error'); return; }
  if (COUPONS[code]) {
    appliedCoupon = code;
    showToast(`%${COUPONS[code]} indirim uygulandı!`, 'success');
    updateSummary();
  } else {
    showToast('Geçersiz indirim kodu.', 'error');
  }
}

// ===== CHECKOUT FLOW =====

function openCheckout() {
  // Prefill user info
  const user = LumAuth.getCurrentUser();
  if (user) {
    document.getElementById('coName').value = user.name || '';
    document.getElementById('coPhone').value = user.phone || '';
    if (user.address) {
      document.getElementById('coAddress').value = user.address.line || '';
      document.getElementById('coDistrict').value = user.address.district || '';
      document.getElementById('coCity').value = user.address.city || '';
    }
  }
  document.getElementById('checkoutModal').classList.add('open');
  currentCheckoutStep = 1;
  showCheckoutStep(1);
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

function checkoutStep(step) {
  // Validate current step before advancing
  if (step > currentCheckoutStep) {
    if (currentCheckoutStep === 1) {
      const name = document.getElementById('coName').value.trim();
      const phone = document.getElementById('coPhone').value.trim();
      const address = document.getElementById('coAddress').value.trim();
      const city = document.getElementById('coCity').value.trim();
      if (!name || !phone || !address || !city) {
        showToast('Lütfen tüm adres alanlarını doldurun.', 'error'); return;
      }
    }
    if (currentCheckoutStep === 2) {
      const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value;
      if (payMethod === 'card') {
        const num = document.getElementById('cardNum').value.replace(/\s/g,'');
        const exp = document.getElementById('cardExp').value;
        const cvv = document.getElementById('cardCvv').value;
        const nm = document.getElementById('cardName').value.trim();
        if (!nm || num.length < 16 || exp.length < 5 || cvv.length < 3) {
          showToast('Lütfen kart bilgilerini eksiksiz girin.', 'error'); return;
        }
      }
    }
  }

  if (step === 3) {
    buildReview();
  }

  currentCheckoutStep = step;
  showCheckoutStep(step);
}

function showCheckoutStep(step) {
  [1,2,3].forEach(s => {
    const el = document.getElementById(`checkoutStep${s}`);
    if (el) el.style.display = s === step ? 'block' : 'none';
    const indicator = document.getElementById(`cstep${s}`);
    if (indicator) {
      indicator.classList.remove('active', 'done');
      if (s === step) indicator.classList.add('active');
      else if (s < step) indicator.classList.add('done');
    }
  });

  // Payment method toggle
  if (step === 2) {
    document.querySelectorAll('input[name="payMethod"]').forEach(r => {
      r.addEventListener('change', () => {
        document.getElementById('cardFields').style.display = r.value === 'card' ? 'block' : 'none';
        document.getElementById('transferFields').style.display = r.value === 'transfer' ? 'block' : 'none';
      });
    });
  }
}

function buildReview() {
  const items = LumCart.getItems();
  const subtotal = LumCart.getTotal();
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  let discount = 0;
  if (appliedCoupon) discount = (subtotal * COUPONS[appliedCoupon]) / 100;
  const total = subtotal + shipping - discount;

  const name = escapeHTML(document.getElementById('coName').value.trim());
  const phone = escapeHTML(document.getElementById('coPhone').value.trim());
  const addr = escapeHTML(document.getElementById('coAddress').value.trim());
  const district = escapeHTML(document.getElementById('coDistrict').value.trim());
  const city = escapeHTML(document.getElementById('coCity').value.trim());

  const container = document.getElementById('reviewContent');
  container.innerHTML = `
    <div class="review-address-block">
      <strong style="color:var(--white);">Teslimat Adresi</strong><br>
      ${name} — ${phone}<br>
      ${addr}, ${district}, ${city}
    </div>
    ${items.map(i => `
      <div class="review-order-item">
        <div class="review-order-emoji">${i.emoji || '📦'}</div>
        <div class="review-order-name">${escapeHTML(i.name)} <span style="color:var(--mid-300);">× ${i.qty}</span></div>
        <div class="review-order-price">${formatPrice(i.price * i.qty)}</div>
      </div>
    `).join('')}
    <div class="summary-row" style="margin-top:16px; border-top:1px solid rgba(255,255,255,.06); padding-top:12px;">
      <span>Kargo</span>
      <span>${shipping === 0 ? 'Ücretsiz' : formatPrice(shipping)}</span>
    </div>
    ${discount > 0 ? `<div class="summary-row"><span>İndirim (${appliedCoupon})</span><span style="color:var(--green-300);">-${formatPrice(discount)}</span></div>` : ''}
    <div class="summary-row" style="font-family:var(--font-head); font-weight:700; color:var(--white); font-size:1.05rem;">
      <span>Toplam</span>
      <span style="color:var(--green-300);">${formatPrice(total)}</span>
    </div>
  `;
}

async function placeOrder() {
  const btnText = document.getElementById('placeOrderText');
  const spinner = document.getElementById('placeOrderSpinner');
  btnText.style.display = 'none';
  spinner.style.display = 'flex';

  // Simulate processing
  await new Promise(r => setTimeout(r, 1800));

  const items = LumCart.getItems();
  const subtotal = LumCart.getTotal();
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  let discount = 0;
  if (appliedCoupon) discount = (subtotal * COUPONS[appliedCoupon]) / 100;
  const total = subtotal + shipping - discount;

  const address = {
    name: document.getElementById('coName').value,
    phone: document.getElementById('coPhone').value,
    line: document.getElementById('coAddress').value,
    district: document.getElementById('coDistrict').value,
    city: document.getElementById('coCity').value
  };

  const order = LumOrders.createOrder(items, total, address);

  // Clear cart
  LumCart.saveItems([]);

  btnText.style.display = 'flex';
  spinner.style.display = 'none';

  // Close checkout, open success
  document.getElementById('checkoutModal').classList.remove('open');
  document.getElementById('successModal').classList.add('open');

  if (order) {
    const el = document.getElementById('successOrderId');
    el.innerHTML = `Sipariş numaranız: <strong style="color:var(--green-300);">#${order.id}</strong>`;
  }

  renderCart();
}

// Card number formatting
function formatCardNum(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 4);
  if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2);
  input.value = val;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  // Close modals on overlay click
  ['checkoutModal', 'successModal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      if (e.target.id === id) document.getElementById(id).classList.remove('open');
    });
  });
});
