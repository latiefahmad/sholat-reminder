// options.js
const API_EQURAN_PROVINSI = 'https://equran.id/api/v2/shalat/provinsi';
const API_EQURAN_KABKOTA  = 'https://equran.id/api/v2/shalat/kabkota';
const API_EQURAN_JADWAL   = 'https://equran.id/api/v2/shalat';
const API_CITY  = 'https://api.aladhan.com/v1/timingsByCity';
const API_COORD = 'https://api.aladhan.com/v1/timings';

const DEFAULTS = {
  apiSource: 'equran',
  provinsi: 'DKI Jakarta',
  kabkota: 'Kota Jakarta',
  city: 'Jakarta',
  country: 'Indonesia',
  method: 20,
  school: 0,
  useCoords: false,
  lat: null,
  lng: null
};

function get(k) { return new Promise(r => chrome.storage.sync.get(k, v => r(v))); }
function set(v) { return new Promise(r => chrome.storage.sync.set(v, r)); }

// ── UI helpers ──────────────────────────────────────────────────────────────

function showSection(source) {
  document.getElementById('sectionEquran').classList.toggle('active', source === 'equran');
  document.getElementById('sectionAladhan').classList.toggle('active', source === 'aladhan');
}

// ── eQuran helpers ──────────────────────────────────────────────────────────

async function loadProvinsi(selectedProvinsi) {
  const sel = document.getElementById('provinsi');
  try {
    const res = await fetch(API_EQURAN_PROVINSI);
    const json = await res.json();
    const list = json?.data || [];
    sel.innerHTML = list.map(p =>
      `<option value="${p}"${p === selectedProvinsi ? ' selected' : ''}>${p}</option>`
    ).join('');
  } catch (e) {
    sel.innerHTML = '<option value="">Gagal memuat provinsi</option>';
  }
}

async function loadKabkota(provinsi, selectedKabkota) {
  const sel = document.getElementById('kabkota');
  sel.innerHTML = '<option value="">Memuat...</option>';
  try {
    const res = await fetch(API_EQURAN_KABKOTA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provinsi })
    });
    const json = await res.json();
    const list = json?.data || [];
    sel.innerHTML = list.map(k =>
      `<option value="${k}"${k === selectedKabkota ? ' selected' : ''}>${k}</option>`
    ).join('');
  } catch (e) {
    sel.innerHTML = '<option value="">Gagal memuat kota</option>';
  }
}

// ── Render today's schedule ─────────────────────────────────────────────────

async function renderTodayTimesEquran(provinsi, kabkota) {
  const el = document.getElementById('todayTimes');
  try {
    const now = new Date();
    const res = await fetch(API_EQURAN_JADWAL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provinsi,
        kabkota,
        bulan: now.getMonth() + 1,
        tahun: now.getFullYear()
      })
    });
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    const jadwal = json?.data?.jadwal || [];
    const entry = jadwal.find(j => j.tanggal === now.getDate());
    if (!entry) throw new Error('Jadwal hari ini tidak ditemukan');

    const rows = [
      ['Imsak',   entry.imsak],
      ['Subuh',   entry.subuh],
      ['Terbit',  entry.terbit],
      ['Dhuha',   entry.dhuha],
      ['Dzuhur',  entry.dzuhur],
      ['Ashar',   entry.ashar],
      ['Maghrib', entry.maghrib],
      ['Isya',    entry.isya]
    ].map(([k, v]) => `<tr><th>${k}</th><td>${v || '--:--'}</td></tr>`).join('');

    el.innerHTML = `<p style="margin:0 0 8px;font-size:13px;color:#74654a;">
      ${json.data.kabkota}, ${json.data.provinsi} — ${entry.hari}, ${entry.tanggal_lengkap}
    </p><table>${rows}</table>`;
  } catch (err) {
    el.textContent = 'Gagal memuat jadwal: ' + err;
  }
}

async function renderTodayTimesAladhan({ city, country, method, school, useCoords = false, lat = null, lng = null }) {
  const el = document.getElementById('todayTimes');
  try {
    let url = '';
    if (useCoords && typeof lat === 'number' && typeof lng === 'number') {
      url = `${API_COORD}?latitude=${lat}&longitude=${lng}&method=${encodeURIComponent(method)}&school=${encodeURIComponent(school)}`;
    } else {
      url = `${API_CITY}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${encodeURIComponent(method)}&school=${encodeURIComponent(school)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const t = data?.data?.timings || {};
    const safe = k => (t && t[k] ? String(t[k]).substring(0, 5) : '--:--');
    const rows = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(k => `<tr><th>${k}</th><td>${safe(k)}</td></tr>`).join('');
    el.innerHTML = `<table>${rows}</table>`;
  } catch (err) {
    el.textContent = 'Gagal memuat jadwal: ' + err;
  }
}

// ── Load settings ────────────────────────────────────────────────────────────

async function loadSettings() {
  const stored = await new Promise(r => chrome.storage.sync.get(DEFAULTS, r));

  document.getElementById('apiSource').value = stored.apiSource || 'equran';
  document.getElementById('city').value = stored.city;
  document.getElementById('country').value = stored.country;
  document.getElementById('method').value = String(stored.method);
  document.getElementById('school').value = String(stored.school);

  showSection(stored.apiSource || 'equran');

  await loadProvinsi(stored.provinsi);
  await loadKabkota(stored.provinsi, stored.kabkota);

  if (stored.apiSource === 'aladhan') {
    await renderTodayTimesAladhan(stored);
  } else {
    await renderTodayTimesEquran(stored.provinsi, stored.kabkota);
  }
}

// ── Save handlers ────────────────────────────────────────────────────────────

async function saveEquran() {
  const provinsi = document.getElementById('provinsi').value;
  const kabkota  = document.getElementById('kabkota').value;
  if (!provinsi || !kabkota) { alert('Pilih provinsi dan kabupaten/kota terlebih dahulu.'); return; }
  await set({ apiSource: 'equran', provinsi, kabkota });
  await renderTodayTimesEquran(provinsi, kabkota);
  chrome.runtime.sendMessage({ type: 'RESCHEDULE_PRAYERS' }, (resp) => {
    if (resp?.ok) alert('Disimpan. Jadwal pengingat diperbarui.');
    else alert('Tersimpan, tetapi gagal menjadwalkan ulang: ' + (resp?.error || 'Unknown'));
  });
}

async function saveAladhan() {
  const city    = document.getElementById('city').value.trim() || DEFAULTS.city;
  const country = document.getElementById('country').value.trim() || DEFAULTS.country;
  const method  = Number(document.getElementById('method').value);
  const school  = Number(document.getElementById('school').value);
  await set({ apiSource: 'aladhan', city, country, method, school });
  await renderTodayTimesAladhan({ city, country, method, school });
  chrome.runtime.sendMessage({ type: 'RESCHEDULE_PRAYERS' }, (resp) => {
    if (resp?.ok) alert('Disimpan. Jadwal pengingat diperbarui.');
    else alert('Tersimpan, tetapi gagal menjadwalkan ulang: ' + (resp?.error || 'Unknown'));
  });
}

// ── Event listeners ──────────────────────────────────────────────────────────

document.getElementById('apiSource').addEventListener('change', function () {
  showSection(this.value);
});

document.getElementById('provinsi').addEventListener('change', async function () {
  const stored = await new Promise(r => chrome.storage.sync.get({ kabkota: '' }, r));
  await loadKabkota(this.value, stored.kabkota);
});

document.getElementById('saveEquran').addEventListener('click', saveEquran);
document.getElementById('saveAladhan').addEventListener('click', saveAladhan);

document.addEventListener('DOMContentLoaded', loadSettings);
