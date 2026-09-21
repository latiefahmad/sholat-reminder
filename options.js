const DEFAULTS = { city: 'Jakarta', country: 'Indonesia', method: 20, school: 0, useCoords: false, lat: null, lng: null, accuracy: null, locUpdatedAt: null };

function get(k) { return new Promise(r => chrome.storage.sync.get(k, v => r(v))); }
function set(v) { return new Promise(r => chrome.storage.sync.set(v, r)); }

async function loadSettings() {
  const stored = await new Promise(r => chrome.storage.sync.get(DEFAULTS, r));
  document.getElementById('city').value = stored.city;
  document.getElementById('country').value = stored.country;
  document.getElementById('method').value = String(stored.method);
  document.getElementById('school').value = String(stored.school);
  await renderTodayTimes(stored);
}

function extractHM(t) {
  if (!t) return '--:--';
  const s = String(t).trim();
  if (s.includes('T')) {
    const ts = Date.parse(s);
    if (!Number.isNaN(ts)) {
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  const m = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!m) return '--:--';
  return `${String(Number(m[1])).padStart(2, '0')}:${String(Number(m[2])).padStart(2, '0')}`;
}

async function renderTodayTimes(settings) {
  const el = document.getElementById('todayTimes');
  try {
    const data = await fetchTimingsUnified(settings);
    const t = data.timings || {};
    const safe = k => extractHM(t[k]);
    const rows = ['Fajr','Dhuhr','Asr','Maghrib','Isha'].map(k => `<tr><th>${k}</th><td>${safe(k)}</td></tr>`).join('');
    const src = data.source === 'myquran'
      ? `Kemenag RI (MyQuran)${data.meta?.kabko ? ' — ' + data.meta.kabko : ''}`
      : 'Aladhan';
    el.innerHTML = `<table>${rows}</table><p class="hint">Sumber: ${src}</p>`;
  } catch(err) {
    el.textContent = 'Gagal memuat jadwal: ' + err;
  }
}

async function save() {
  const btn = document.getElementById('save');
  const status = document.getElementById('saveStatus');
  const setStatus = (t) => { if (status) status.textContent = t; };
  btn.disabled = true;
  setStatus('Menyimpan & menjadwalkan ulang...');
  try {
    const city = document.getElementById('city').value.trim() || DEFAULTS.city;
    const country = document.getElementById('country').value.trim() || DEFAULTS.country;
    const method = Number(document.getElementById('method').value);
    const school = Number(document.getElementById('school').value);
    await set({ city, country, method, school, useCoords: false, lat: null, lng: null, accuracy: null, locUpdatedAt: null });
    await renderTodayTimes({ city, country, method, school, useCoords: false, lat: null, lng: null });
    const resp = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'RESCHEDULE_PRAYERS', reason: 'options-save' }, (r) => {
        if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
        else resolve(r || { ok: false, error: 'no-response' });
      });
    });
    if (resp?.ok) {
      const n = resp.scheduled?.length ?? 0;
      setStatus(`Disimpan. Jadwal pengingat diperbarui (${n} pengingat tersisa hari ini).`);
    } else {
      setStatus(`Tersimpan, tetapi gagal menjadwalkan ulang: ${resp?.error || 'Unknown'}. Akan dicoba otomatis 15 menit lagi.`);
    }
  } catch (e) {
    setStatus(`Gagal menyimpan: ${e?.message || e}`);
  } finally {
    btn.disabled = false;
  }
}

document.getElementById('save').addEventListener('click', save);
document.addEventListener('DOMContentLoaded', loadSettings);
