/* ===== ACCOUNT PAGE JS ===== */

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
  }
}

function togglePwd(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.style.opacity = isText ? '1' : '0.5';
}

// Password strength meter
document.addEventListener('DOMContentLoaded', () => {
  const pwdInput = document.getElementById('regPwd');
  const strengthEl = document.getElementById('pwdStrength');

  if (pwdInput && strengthEl) {
    pwdInput.addEventListener('input', () => {
      const val = pwdInput.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const levels = ['', 'weak', 'medium', 'medium', 'strong'];
      const bars = 4;
      strengthEl.innerHTML = Array.from({ length: bars }, (_, i) => {
        const cls = i < score ? levels[score] : '';
        return `<div class="strength-bar ${cls}"></div>`;
      }).join('');
    });
  }
});

async function doLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pwd = document.getElementById('loginPwd').value;
  const errEl = document.getElementById('loginError');
  const btnText = document.getElementById('loginBtnText');
  const spinner = document.getElementById('loginSpinner');

  errEl.style.display = 'none';
  btnText.style.display = 'none';
  spinner.style.display = 'flex';

  const result = await LumAuth.login({ identifier: id, password: pwd });

  btnText.style.display = 'flex';
  spinner.style.display = 'none';

  if (result.ok) {
    showToast(`Hoş geldiniz, ${result.user.name}!`, 'success');
    setTimeout(() => initAccountSection(), 300);
  } else {
    errEl.textContent = result.msg;
    errEl.style.display = 'block';
  }
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pwd = document.getElementById('regPwd').value;
  const pwd2 = document.getElementById('regPwd2').value;
  const agreed = document.getElementById('agreeTerms').checked;
  const errEl = document.getElementById('registerError');
  const btnText = document.getElementById('regBtnText');
  const spinner = document.getElementById('regSpinner');

  errEl.style.display = 'none';

  if (!agreed) {
    errEl.textContent = 'Kullanım koşullarını kabul etmeniz gerekmektedir.';
    errEl.style.display = 'block';
    return;
  }

  if (pwd !== pwd2) {
    errEl.textContent = 'Şifreler eşleşmiyor.';
    errEl.style.display = 'block';
    return;
  }

  btnText.style.display = 'none';
  spinner.style.display = 'flex';

  const result = await LumAuth.register({ name, email, phone, password: pwd });

  btnText.style.display = 'flex';
  spinner.style.display = 'none';

  if (result.ok) {
    showToast('Hesabınız başarıyla oluşturuldu!', 'success');
    setTimeout(() => initAccountSection(), 300);
  } else {
    errEl.textContent = result.msg;
    errEl.style.display = 'block';
  }
}

function switchAccountTab(tab, btn) {
  document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.account-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (btn) btn.classList.add('active');

  if (tab === 'orders') renderOrders();
  if (tab === 'info') loadProfileInfo();
  if (tab === 'address') loadAddress();
}

function loadProfileInfo() {
  const user = LumAuth.getCurrentUser();
  if (!user) return;
  const nameEl = document.getElementById('editName');
  const emailEl = document.getElementById('editEmail');
  const phoneEl = document.getElementById('editPhone');
  if (nameEl) nameEl.value = user.name || '';
  if (emailEl) emailEl.value = user.email || '';
  if (phoneEl) phoneEl.value = user.phone || '';
}

function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();

  if (!name || name.length < 2) { showToast('İsim en az 2 karakter olmalıdır.', 'error'); return; }

  LumAuth.updateProfile({ name, phone });
  showToast('Bilgileriniz güncellendi!', 'success');

  document.getElementById('profileName').textContent = name;
  document.getElementById('profileAvatar').textContent = name[0].toUpperCase();
  document.getElementById('accountGreeting').textContent = `Hoş geldiniz, ${name}!`;
}

function loadAddress() {
  const user = LumAuth.getCurrentUser();
  if (!user || !user.address) return;
  const a = user.address;
  if (a.title) document.getElementById('addrTitle').value = a.title;
  if (a.line) document.getElementById('addrLine').value = a.line;
  if (a.district) document.getElementById('addrDistrict').value = a.district;
  if (a.city) document.getElementById('addrCity').value = a.city;
  if (a.postal) document.getElementById('addrPostal').value = a.postal;
}

function saveAddress() {
  const address = {
    title: document.getElementById('addrTitle').value.trim(),
    line: document.getElementById('addrLine').value.trim(),
    district: document.getElementById('addrDistrict').value.trim(),
    city: document.getElementById('addrCity').value.trim(),
    postal: document.getElementById('addrPostal').value.trim()
  };

  if (!address.line || !address.city) { showToast('Lütfen zorunlu alanları doldurun.', 'error'); return; }
  LumAuth.updateProfile({ address });
  showToast('Adresiniz kaydedildi!', 'success');
}

async function changePassword() {
  const currentPwd = document.getElementById('currentPwd').value;
  const newPwd = document.getElementById('newPwd').value;
  const newPwd2 = document.getElementById('newPwd2').value;
  const errEl = document.getElementById('securityError');

  errEl.style.display = 'none';

  if (newPwd !== newPwd2) {
    errEl.textContent = 'Yeni şifreler eşleşmiyor.';
    errEl.style.display = 'block';
    return;
  }

  const result = await LumAuth.updatePassword({ currentPwd, newPwd });
  if (result.ok) {
    showToast('Şifreniz başarıyla güncellendi!', 'success');
    document.getElementById('currentPwd').value = '';
    document.getElementById('newPwd').value = '';
    document.getElementById('newPwd2').value = '';
  } else {
    errEl.textContent = result.msg;
    errEl.style.display = 'block';
  }
}

function renderOrders() {
  const container = document.getElementById('ordersList');
  if (!container) return;

  const orders = LumOrders.getOrders();

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="no-orders">
        <div class="emoji">📦</div>
        <h3>Henüz siparişiniz yok</h3>
        <p>Ürünleri keşfetmek için <a href="products.html" style="color:var(--green-300);">ürünler sayfasına</a> gidin.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const date = new Date(order.createdAt).toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric' });
    const statusCls = LumOrders.formatStatus(order.status);
    return `
      <div class="order-item">
        <div class="order-header">
          <div>
            <div class="order-id">#${escapeHTML(order.id)}</div>
            <div class="order-date">${date}</div>
          </div>
          <span class="badge badge-${statusCls}">${escapeHTML(order.status)}</span>
        </div>
        <div class="order-items-preview">
          ${order.items.map(i => `<div class="order-item-thumb" title="${escapeHTML(i.name)}">${i.emoji || '📦'}</div>`).join('')}
        </div>
        <div class="order-footer">
          <span style="color:var(--mid-300);">${order.items.length} ürün</span>
          <span class="order-total">${order.total.toFixed(2)}₺</span>
        </div>
      </div>
    `;
  }).join('');
}

function initAccountSection() {
  const authSection = document.getElementById('authSection');
  const accountSection = document.getElementById('accountSection');

  if (!LumAuth.isLoggedIn()) {
    authSection.style.display = 'block';
    accountSection.style.display = 'none';
    return;
  }

  authSection.style.display = 'none';
  accountSection.style.display = 'block';

  const user = LumAuth.getCurrentUser();
  if (user) {
    document.getElementById('accountGreeting').textContent = `Hoş geldiniz, ${user.name}!`;
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileAvatar').textContent = user.name[0].toUpperCase();
    loadProfileInfo();
    loadAddress();
  }

  // Check anchor
  const hash = location.hash.replace('#','');
  if (hash && document.getElementById(`tab-${hash}`)) {
    const btn = document.querySelector(`[data-tab="${hash}"]`);
    switchAccountTab(hash, btn);
  }
}

// Enter key on login
document.addEventListener('DOMContentLoaded', () => {
  initAccountSection();

  document.getElementById('loginPwd')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('loginId')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});
