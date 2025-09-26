const DEFAULTS = { city: 'Jakarta', country: 'Indonesia', method: 20, school: 0, useCoords: false, lat: null, lng: null };
const API_CITY = 'https://api.aladhan.com/v1/timingsByCity';
const API_COORD = 'https://api.aladhan.com/v1/timings';

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

async function renderTodayTimes({ city, country, method, school, useCoords=false, lat=null, lng=null }) {
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
    const safe = k => (t && t[k] ? String(t[k]).substring(0,5) : '--:--');
    const rows = ['Fajr','Dhuhr','Asr','Maghrib','Isha'].map(k => `<tr><th>${k}</th><td>${safe(k)}</td></tr>`).join('');
    el.innerHTML = `<table>${rows}</table>`;
  } catch(err) {
    el.textContent = 'Gagal memuat jadwal: ' + err;
  }
}

async function save() {
  const city = document.getElementById('city').value.trim() || DEFAULTS.city;
  const country = document.getElementById('country').value.trim() || DEFAULTS.country;
  const method = Number(document.getElementById('method').value);
  const school = Number(document.getElementById('school').value);
  await set({ city, country, method, school });
  await renderTodayTimes({ city, country, method, school });
  chrome.runtime.sendMessage({ type: 'RESCHEDULE_PRAYERS' }, (resp) => {
    if (resp?.ok) alert('Disimpan. Jadwal pengingat diperbarui.');
    else alert('Tersimpan, tetapi gagal menjadwalkan ulang: ' + (resp?.error || 'Unknown'));
  });
}

document.getElementById('save').addEventListener('click', save);
document.addEventListener('DOMContentLoaded', loadSettings);
