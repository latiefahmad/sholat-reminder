const API_CITY = 'https://api.aladhan.com/v1/timingsByCity';
const API_COORD = 'https://api.aladhan.com/v1/timings';
const DEFAULTS = {
  city: 'Jakarta',
  country: 'Indonesia',
  method: 20,
  school: 0,
  useCoords: false,
  lat: null,
  lng: null
};

const CITY_LIST = [
  'Magelang', 'Madiun', 'Makassar', 'Malang', 'Manado', 'Mamuju', 'Mandailing Natal', 'Manokwari',
  'Mataram', 'Martapura', 'Medan', 'Merauke', 'Meulaboh', 'Metro', 'Mojokerto', 'Muara Enim',
  'Muara Teweh', 'Majalengka', 'Majene', 'Mamasa', 'Jakarta', 'Bandung', 'Surabaya', 'Semarang',
  'Yogyakarta', 'Denpasar', 'Bogor', 'Bekasi', 'Tangerang', 'Depok', 'Padang', 'Pekanbaru',
  'Palembang', 'Banjarmasin', 'Pontianak', 'Samarinda', 'Balikpapan', 'Palangkaraya', 'Batam',
  'Tanjungpinang', 'Kupang', 'Ambon', 'Ternate', 'Sofifi', 'Jayapura', 'Sorong', 'Kendari', 'Palu',
  'Dubai', 'Doha', 'Makkah', 'Madinah', 'Manama', 'Muscat', 'Male', 'Mogadishu', 'Madrid', 'Manila'
];

const METHOD_NAMES = {
  1: 'MWL',
  2: 'Karachi',
  3: 'ISNA',
  5: 'Egypt',
  13: 'Umm Al-Qura',
  15: 'Gulf',
  20: 'Moonsighting'
};

const HIJRI_WEEKDAYS_ID = {
  Sunday: 'Ahad',
  Monday: 'Senin',
  Tuesday: 'Selasa',
  Wednesday: 'Rabu',
  Thursday: 'Kamis',
  Friday: 'Jumat',
  Saturday: 'Sabtu'
};

const HIJRI_MONTHS_ID = {
  Muharram: 'Muharram',
  Safar: 'Safar',
  "Rabi'al-Awwal": 'Rabiul Awal',
  "Rabi'ath-Thani": 'Rabiul Akhir',
  'Jumada al-Awwal': 'Jumadil Awal',
  'Jumada al-Thani': 'Jumadil Akhir',
  Rajab: 'Rajab',
  "Sha'ban": 'Syaban',
  Ramadan: 'Ramadhan',
  Shawwal: 'Syawal',
  "Dhu al-Qi'dah": "Dzulqa'dah",
  'Dhu al-Hijjah': 'Dzulhijjah'
};

const ids = (name) => document.getElementById(name);
const el = {
  today: ids('today'),
  hijriDate: ids('hijriDate'),
  nextName: ids('nextName'),
  nextTime: ids('nextTime'),
  countdown: ids('countdown'),
  tImsak: ids('tImsak'),
  tFajr: ids('tFajr'),
  tSunrise: ids('tSunrise'),
  tDhuha: ids('tDhuha'),
  tDhuhr: ids('tDhuhr'),
  tAsr: ids('tAsr'),
  tMaghrib: ids('tMaghrib'),
  tIsha: ids('tIsha'),
  city: ids('city'),
  country: ids('country'),
  method: ids('method'),
  school: ids('school'),
  btnGeo: ids('btnGeo'),
  btnSave: ids('btnSave'),
  locInfo: ids('locInfo'),
  methodInfo: ids('methodInfo'),
  acList: ids('cityList')
};

const fmt2 = (n) => String(n).padStart(2, '0');
const getSettings = () => new Promise((resolve) => chrome.storage.sync.get(DEFAULTS, resolve));
const setSettings = (value) => new Promise((resolve) => chrome.storage.sync.set(value, resolve));

function todayStr() {
  const d = new Date();
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function parseMillis(timeStr) {
  const [h, m] = String(timeStr).substring(0, 5).split(':').map(Number);
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}

function addHourToTime(timeStr) {
  const [h, m] = String(timeStr).substring(0, 5).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '--:--';
  const newH = (h + 1) % 24;
  return `${fmt2(newH)}:${fmt2(m)}`;
}

function fmtCountdown(ms) {
  if (ms < 0) ms = 0;
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${fmt2(h)}:${fmt2(m)}:${fmt2(s)}`;
}

async function fetchTimings(stored) {
  const hasCoords = stored.useCoords && typeof stored.lat === 'number' && typeof stored.lng === 'number';
  const url = hasCoords
    ? `${API_COORD}?latitude=${stored.lat}&longitude=${stored.lng}&method=${encodeURIComponent(stored.method)}&school=${encodeURIComponent(stored.school)}`
    : `${API_CITY}?city=${encodeURIComponent(stored.city)}&country=${encodeURIComponent(stored.country)}&method=${encodeURIComponent(stored.method)}&school=${encodeURIComponent(stored.school)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  if (!json?.data?.timings) throw new Error('Timings empty');
  return { timings: json.data.timings, date: json.data.date };
}

function fillTable(timings) {
  const safe = (key) => (timings && timings[key] ? String(timings[key]).substring(0, 5) : '--:--');
  el.tImsak.textContent = safe('Imsak');
  el.tFajr.textContent = safe('Fajr');
  el.tSunrise.textContent = safe('Sunrise');
  el.tDhuha.textContent = timings?.Sunrise ? addHourToTime(timings.Sunrise) : '--:--';
  el.tDhuhr.textContent = safe('Dhuhr');
  el.tAsr.textContent = safe('Asr');
  el.tMaghrib.textContent = safe('Maghrib');
  el.tIsha.textContent = safe('Isha');
}

function computeNext(timings) {
  const sunriseTime = timings.Sunrise ? addHourToTime(timings.Sunrise) : null;
  const items = [
    ['Imsak', timings.Imsak],
    ['Subuh', timings.Fajr],
    ['Terbit', timings.Sunrise],
    ['Dhuha', sunriseTime],
    ['Dzuhur', timings.Dhuhr],
    ['Ashar', timings.Asr],
    ['Maghrib', timings.Maghrib],
    ['Isya', timings.Isha]
  ].filter(([, value]) => value && value !== '--:--');

  if (!items.length) return null;

  const now = Date.now();
  let best = null;
  let bestWhen = Number.POSITIVE_INFINITY;

  for (const [name, time] of items) {
    const when = parseMillis(time);
    if (when > now && when < bestWhen) {
      best = [name, time];
      bestWhen = when;
    }
  }

  if (!best) {
    const fallbackTime = timings.Imsak || items[0][1];
    best = ['Imsak (Besok)', fallbackTime];
    bestWhen = parseMillis(fallbackTime) + 24 * 60 * 60 * 1000;
  }

  return { name: best[0], time: best[1], when: bestWhen };
}

let timer = null;
function startCountdown(targetMs) {
  if (timer) clearInterval(timer);
  const tick = () => {
    const left = targetMs - Date.now();
    el.countdown.textContent = fmtCountdown(left);
  };
  tick();
  timer = setInterval(tick, 1000);
}

async function refreshUI() {
  try {
    const stored = await getSettings();
    const hasCoords = stored.useCoords && typeof stored.lat === 'number' && typeof stored.lng === 'number';

    el.today.textContent = todayStr();
    el.city.value = stored.city;
    el.country.value = stored.country;
    el.method.value = String(stored.method);
    el.school.value = String(stored.school);
    el.locInfo.textContent = hasCoords
      ? `Lokasi: ${stored.lat.toFixed(4)}, ${stored.lng.toFixed(4)}`
      : `Lokasi: ${stored.city}, ${stored.country}`;

    const methodName = METHOD_NAMES[stored.method] || `ID ${stored.method}`;
    const schoolName = stored.school === 0 ? 'Shafi' : 'Hanafi';
    el.methodInfo.textContent = `Metode: ${methodName}, Madzhab: ${schoolName}`;

    const data = await fetchTimings(stored);
    const timings = data.timings;
    const date = data.date;

    const weekdayEn = date?.hijri?.weekday?.en || '-';
    const monthEn = date?.hijri?.month?.en || '-';
    const hijriWeekday = HIJRI_WEEKDAYS_ID[weekdayEn] || weekdayEn;
    const hijriMonth = HIJRI_MONTHS_ID[monthEn] || monthEn;
    const hijriDay = date?.hijri?.day || '-';
    const hijriYear = date?.hijri?.year || '-';
    el.hijriDate.textContent = `${hijriWeekday}, ${hijriDay} ${hijriMonth} ${hijriYear} H`;

    fillTable(timings);
    const next = computeNext(timings);
    if (next) {
      el.nextName.textContent = next.name;
      el.nextTime.textContent = String(next.time).substring(0, 5);
      startCountdown(next.when);
    } else {
      el.nextName.textContent = '-';
      el.nextTime.textContent = '-';
      el.countdown.textContent = '--:--:--';
    }
  } catch (e) {
    console.error('[SholatReminder] refreshUI error:', e);
    el.nextName.textContent = 'Gagal memuat';
    el.nextTime.textContent = String(e);
    el.tImsak.textContent = '--:--';
    el.tFajr.textContent = '--:--';
    el.tSunrise.textContent = '--:--';
    el.tDhuha.textContent = '--:--';
    el.tDhuhr.textContent = '--:--';
    el.tAsr.textContent = '--:--';
    el.tMaghrib.textContent = '--:--';
    el.tIsha.textContent = '--:--';
    el.hijriDate.textContent = '-';
    el.methodInfo.textContent = 'Metode: -, Madzhab: -';
  }
}

async function save() {
  const city = el.city.value.trim() || DEFAULTS.city;
  const country = el.country.value.trim() || DEFAULTS.country;
  const method = Number(el.method.value);
  const school = Number(el.school.value);
  await setSettings({ city, country, method, school, useCoords: false, lat: null, lng: null });
  await refreshUI();
  chrome.runtime.sendMessage({ type: 'RESCHEDULE_PRAYERS' }, () => {});
}

async function takeGeo() {
  el.btnGeo.disabled = true;
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000
      });
    });

    const lat = Number(pos.coords.latitude);
    const lng = Number(pos.coords.longitude);
    const current = await getSettings();
    await setSettings({ ...current, useCoords: true, lat, lng });
    await refreshUI();
    chrome.runtime.sendMessage({ type: 'RESCHEDULE_PRAYERS' }, () => {});
  } catch (e) {
    alert(`Gagal ambil lokasi: ${e.message}\nPastikan izin lokasi diizinkan untuk Chrome.`);
  } finally {
    el.btnGeo.disabled = false;
  }
}

function filterCities(prefix) {
  const value = prefix.trim().toLowerCase();
  if (!value) return [];
  return CITY_LIST.filter((city) => city.toLowerCase().startsWith(value)).slice(0, 10);
}

function renderAc(list) {
  el.acList.innerHTML = '';
  if (!list.length) {
    el.acList.classList.remove('show');
    return;
  }

  for (const name of list) {
    const item = document.createElement('div');
    item.className = 'ac-item';
    item.textContent = name;
    item.addEventListener('click', () => {
      el.city.value = name;
      el.acList.classList.remove('show');
    });
    el.acList.appendChild(item);
  }

  el.acList.classList.add('show');
}

function init() {
  el.city.addEventListener('input', () => renderAc(filterCities(el.city.value)));
  el.city.addEventListener('focusout', () => setTimeout(() => el.acList.classList.remove('show'), 120));
  el.btnSave.addEventListener('click', save);
  el.btnGeo.addEventListener('click', takeGeo);
  refreshUI();
}

document.addEventListener('DOMContentLoaded', init);
