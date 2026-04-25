/* ===== LUMINOR 3D PRINTING — CORE APP ===== */
/* Güvenli localStorage tabanlı kullanıcı yönetimi + sepet */

'use strict';

// ===== UTILITIES =====

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&"'`]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== TOAST NOTIFICATION =====

function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toast');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };

  const item = document.createElement('div');
  item.className = `toast-item ${type}`;
  item.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHTML(message)}</span>`;
  container.appendChild(item);

  setTimeout(() => {
    item.style.animation = 'slideInToast .3s ease reverse';
    setTimeout(() => item.remove(), 280);
  }, duration);
}

window.showToast = showToast;

// ===== SECURE AUTH SYSTEM =====
// Production'da bu backend API ile yapılmalıdır.
// Burada demo amaçlı localStorage kullanılmaktadır.
// Şifre hash'i: basit SHA-256 (browser WebCrypto API)

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'luminor_salt_2025');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Kullanıcı veritabanı (localStorage)
function getUsers() {
  try { return JSON.parse(localStorage.getItem('lum_users') || '[]'); }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem('lum_users', JSON.stringify(users));
}

// Oturum
function getSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem('lum_session') || 'null');
    if (!s) return null;
    // Token süresi 8 saat
    if (Date.now() - s.created > 8 * 60 * 60 * 1000) {
      sessionStorage.removeItem('lum_session');
      return null;
    }
    return s;
  } catch { return null; }
}

function setSession(user) {
  const session = {
    token: generateToken(),
    userId: user.id,
    name: user.name,
    email: user.email,
    created: Date.now()
  };
  sessionStorage.setItem('lum_session', JSON.stringify(session));
  return session;
}

function clearSession() {
  sessionStorage.removeItem('lum_session');
}

function isLoggedIn() {
  return getSession() !== null;
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find(u => u.id === session.userId) || null;
}

window.LumAuth = {
  async register({ name, email, phone, password }) {
    const users = getUsers();

    // Validasyon
    if (!name || name.trim().length < 2) return { ok: false, msg: 'İsim en az 2 karakter olmalıdır.' };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, msg: 'Geçerli bir e-posta adresi girin.' };
    if (!phone || !/^(\+90|0)?[5][0-9]{9}$/.test(phone.replace(/\s/g,''))) return { ok: false, msg: 'Geçerli bir Türk telefon numarası girin.' };
    if (!password || password.length < 8) return { ok: false, msg: 'Şifre en az 8 karakter olmalıdır.' };
    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(password)) return { ok: false, msg: 'Şifre en az 1 büyük harf ve 1 rakam içermelidir.' };

    // Tekrar kayıt kontrolü
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, msg: 'Bu e-posta adresi zaten kayıtlı.' };
    }

    const hashed = await hashPassword(password);
    const user = {
      id: generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash: hashed,
      createdAt: new Date().toISOString(),
      address: {}
    };

    users.push(user);
    saveUsers(users);
    setSession(user);
    return { ok: true, user };
  },

  async login({ identifier, password }) {
    // Giriş: email veya telefon ile
    if (!identifier || !password) return { ok: false, msg: 'Tüm alanları doldurun.' };

    const users = getUsers();
    const normalId = identifier.toLowerCase().trim();
    const user = users.find(u =>
      u.email === normalId ||
      u.phone.replace(/\s/g,'') === normalId.replace(/\s/g,'')
    );

    if (!user) return { ok: false, msg: 'Kullanıcı bulunamadı.' };

    const hashed = await hashPassword(password);
    if (hashed !== user.passwordHash) return { ok: false, msg: 'Şifre hatalı.' };

    setSession(user);
    return { ok: true, user };
  },

  logout() {
    clearSession();
    LumCart.clearLocal();
    window.location.href = 'index.html';
  },

  isLoggedIn,
  getCurrentUser,
  getSession,

  async updatePassword({ currentPwd, newPwd }) {
    const user = getCurrentUser();
    if (!user) return { ok: false, msg: 'Oturum açın.' };
    if (newPwd.length < 8) return { ok: false, msg: 'Yeni şifre en az 8 karakter olmalıdır.' };
    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(newPwd)) return { ok: false, msg: 'Şifre en az 1 büyük harf ve 1 rakam içermelidir.' };

    const currentHash = await hashPassword(currentPwd);
    if (currentHash !== user.passwordHash) return { ok: false, msg: 'Mevcut şifre hatalı.' };

    const newHash = await hashPassword(newPwd);
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    users[idx].passwordHash = newHash;
    saveUsers(users);
    return { ok: true };
  },

  updateProfile(data) {
    const user = getCurrentUser();
    if (!user) return { ok: false };
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    Object.assign(users[idx], data);
    saveUsers(users);
    return { ok: true };
  }
};

// ===== CART SYSTEM =====

window.LumCart = {
  getItems() {
    if (!isLoggedIn()) {
      try { return JSON.parse(sessionStorage.getItem('lum_cart_guest') || '[]'); }
      catch { return []; }
    }
    const user = getSession();
    try { return JSON.parse(localStorage.getItem(`lum_cart_${user.userId}`) || '[]'); }
    catch { return []; }
  },

  saveItems(items) {
    if (!isLoggedIn()) {
      sessionStorage.setItem('lum_cart_guest', JSON.stringify(items));
    } else {
      const user = getSession();
      localStorage.setItem(`lum_cart_${user.userId}`, JSON.stringify(items));
    }
    this.updateBadge();
  },

  addItem(product, qty = 1) {
    const items = this.getItems();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ ...product, qty });
    }
    this.saveItems(items);
    showToast(`${product.name} sepete eklendi!`, 'success');
  },

  removeItem(productId) {
    const items = this.getItems().filter(i => i.id !== productId);
    this.saveItems(items);
  },

  updateQty(productId, qty) {
    if (qty < 1) { this.removeItem(productId); return; }
    const items = this.getItems();
    const item = items.find(i => i.id === productId);
    if (item) item.qty = qty;
    this.saveItems(items);
  },

  getCount() {
    return this.getItems().reduce((s, i) => s + i.qty, 0);
  },

  getTotal() {
    return this.getItems().reduce((s, i) => s + i.price * i.qty, 0);
  },

  clearLocal() {
    sessionStorage.removeItem('lum_cart_guest');
  },

  updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      const count = this.getCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

// ===== ORDERS SYSTEM =====

window.LumOrders = {
  getOrders() {
    const user = getCurrentUser();
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem(`lum_orders_${user.id}`) || '[]'); }
    catch { return []; }
  },

  createOrder(items, total, shippingAddress) {
    const user = getCurrentUser();
    if (!user) return null;

    const order = {
      id: 'LMN' + Date.now().toString(36).toUpperCase(),
      items,
      total,
      shippingAddress,
      status: 'Hazırlanıyor',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    };

    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem(`lum_orders_${user.id}`, JSON.stringify(orders));
    return order;
  },

  formatStatus(status) {
    const map = {
      'Hazırlanıyor': 'warning',
      'Baskı Aşamasında': 'info',
      'Kargoya Verildi': 'info',
      'Teslim Edildi': 'success',
      'İptal Edildi': 'danger'
    };
    return map[status] || 'info';
  }
};

// ===== NAVBAR =====

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (navbar) {
    const handleScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click (mobile)
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage) a.classList.add('active');
    else a.classList.remove('active');
  });

  // Update cart badge
  LumCart.updateBadge();

  // Show correct account icon
  updateAccountNav();
}

function updateAccountNav() {
  // Giriş durumuna göre farklı şey göster (opsiyonel)
  const session = getSession();
  const accountLink = document.querySelector('.nav-icon[href="account.html"]');
  if (accountLink && session) {
    accountLink.title = session.name;
  }
}

// ===== PRODUCT DATA (Demo) =====

window.PRODUCTS = [
  {
    id: 'p1',
    name: 'Dekoratif Vazo',
    desc: 'Geometrik tasarımlı PLA malzeme dekoratif vazo',
    price: 189,
    emoji: '🏺',
    badge: 'popular',
    badgeText: 'Popüler',
    category: 'dekorasyon',
    material: 'PLA',
    colors: ['#2D9B7F', '#e53e3e', '#d69e2e', '#805ad5'],
    stock: 12
  },
  {
    id: 'p2',
    name: 'Telefon Standı',
    desc: 'Ergonomik tasarım, tüm telefon modelleri ile uyumlu',
    price: 129,
    emoji: '📱',
    badge: 'new',
    badgeText: 'Yeni',
    category: 'aksesuar',
    material: 'PETG',
    colors: ['#1a202c', '#e2e8f0', '#2D9B7F'],
    stock: 25
  },
  {
    id: 'p3',
    name: 'Prototip Raf Sistemi',
    desc: 'Modüler duvar raf sistemi, özelleştirilebilir',
    price: 349,
    emoji: '🗂️',
    badge: '',
    badgeText: '',
    category: 'ev',
    material: 'ABS',
    colors: ['#1a202c', '#e2e8f0'],
    stock: 8
  },
  {
    id: 'p4',
    name: 'Mini Heykel',
    desc: 'Yüksek detaylı reçine mini heykel figür',
    price: 249,
    emoji: '🗿',
    badge: 'popular',
    badgeText: 'Popüler',
    category: 'sanat',
    material: 'Reçine',
    colors: ['#d4a574', '#718096', '#2D9B7F'],
    stock: 15
  },
  {
    id: 'p5',
    name: 'Anahtar Organizörü',
    desc: 'Duvara monte kompakt anahtar askısı',
    price: 89,
    emoji: '🔑',
    badge: 'new',
    badgeText: 'Yeni',
    category: 'ev',
    material: 'PLA',
    colors: ['#2D9B7F', '#1a202c'],
    stock: 40
  },
  {
    id: 'p6',
    name: 'Yazı Tipi Lambası',
    desc: 'LED uyumlu özel tasarım neon tarzı masa lambası',
    price: 399,
    emoji: '💡',
    badge: '',
    badgeText: '',
    category: 'dekorasyon',
    material: 'TPU',
    colors: ['#e2e8f0', '#faf089'],
    stock: 6
  },
  {
    id: 'p7',
    name: 'Kulaklık Askısı',
    desc: 'Masaüstü ya da duvara monte kulaklık standı',
    price: 159,
    emoji: '🎧',
    badge: 'popular',
    badgeText: 'Popüler',
    category: 'aksesuar',
    material: 'PETG',
    colors: ['#1a202c', '#2D9B7F', '#718096'],
    stock: 18
  },
  {
    id: 'p8',
    name: 'Oyun Koleksiyon',
    desc: 'Detaylı oyun figürleri seti — 4 adet',
    price: 599,
    emoji: '🎮',
    badge: '',
    badgeText: '',
    category: 'sanat',
    material: 'Reçine',
    colors: ['#2D9B7F', '#805ad5', '#e53e3e'],
    stock: 4
  }
];

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
});
