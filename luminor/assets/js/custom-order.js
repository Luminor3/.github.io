/* ===== CUSTOM ORDER JS ===== */

let currentFormStep = 1;

function goFormStep(step) {
  // Validate
  if (step > currentFormStep) {
    if (currentFormStep === 1) {
      const cat = document.getElementById('selectedCategory').value;
      const desc = document.getElementById('productDesc').value.trim();
      if (!cat) { showToast('Lütfen bir kategori seçin.', 'error'); return; }
      if (desc.length < 20) { showToast('Ürün açıklaması en az 20 karakter olmalıdır.', 'error'); return; }
    }
    if (currentFormStep === 2) {
      // Material is always pre-selected, no required field here
    }
  }

  currentFormStep = step;

  document.querySelectorAll('.form-step-content').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === step);
  });

  document.querySelectorAll('.form-step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 === step) el.classList.add('active');
    else if (i + 1 < step) el.classList.add('done');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectCategory(el) {
  document.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('selectedCategory').value = el.dataset.val;
}

function selectMaterial(el) {
  document.querySelectorAll('.material-card').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('selectedMaterial').value = el.dataset.val;
}

function handleFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { showToast('Dosya boyutu 20MB\'ı aşamaz.', 'error'); return; }

  const preview = document.getElementById('filePreview');
  preview.style.display = 'flex';
  preview.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-300)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    <span class="file-preview-name">${file.name}</span>
    <span style="font-size:.75rem; color:var(--mid-300);">${(file.size / 1024).toFixed(0)} KB</span>
    <button class="file-remove" onclick="clearFile()">✕</button>
  `;
  document.getElementById('fileDrop').style.display = 'none';
}

function clearFile() {
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').style.display = 'none';
  document.getElementById('fileDrop').style.display = 'block';
}

// Char counter
document.addEventListener('DOMContentLoaded', () => {
  const descEl = document.getElementById('productDesc');
  const countEl = document.getElementById('descCount');
  if (descEl && countEl) {
    descEl.addEventListener('input', () => {
      const len = Math.min(descEl.value.length, 500);
      countEl.textContent = len;
      if (len > 480) countEl.style.color = '#f87171';
      else countEl.style.color = '';
      if (descEl.value.length > 500) descEl.value = descEl.value.slice(0, 500);
    });
  }

  // Pre-fill if logged in
  const user = LumAuth.getCurrentUser();
  if (user) {
    const nameEl = document.getElementById('coContactName');
    const emailEl = document.getElementById('coContactEmail');
    const phoneEl = document.getElementById('coContactPhone');
    if (nameEl) nameEl.value = user.name || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || '';
  }
});

async function submitCustomOrder() {
  const name = document.getElementById('coContactName').value.trim();
  const email = document.getElementById('coContactEmail').value.trim();
  const privacy = document.getElementById('coPrivacy').checked;
  const errEl = document.getElementById('customOrderError');
  const btnText = document.getElementById('submitText');
  const spinner = document.getElementById('submitSpinner');

  errEl.style.display = 'none';

  if (!name) { errEl.textContent = 'Ad soyad gereklidir.'; errEl.style.display = 'block'; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Geçerli bir e-posta adresi girin.'; errEl.style.display = 'block'; return;
  }
  if (!privacy) { errEl.textContent = 'Gizlilik politikasını kabul etmeniz gerekmektedir.'; errEl.style.display = 'block'; return; }

  btnText.style.display = 'none';
  spinner.style.display = 'flex';

  // Simulate submission
  await new Promise(r => setTimeout(r, 1500));

  btnText.style.display = 'flex';
  spinner.style.display = 'none';

  // Show all form steps hidden, show success
  document.querySelectorAll('.form-step-content, .form-steps').forEach(el => el.style.display = 'none');
  document.getElementById('customOrderSuccess').style.display = 'block';
}
