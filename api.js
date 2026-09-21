// api.js — lapisan sumber data jadwal sholat bersama.
// Dipakai background.js (via importScripts), popup.js & options.js (via <script>).
// MyQuran (data Kemenag RI) = sumber utama untuk kota di Indonesia.
// Aladhan = fallback (kota tak ditemukan / luar Indonesia / mode koordinat).

const API_CITY = 'https://api.aladhan.com/v1/timingsByCity';
const API_COORD = 'https://api.aladhan.com/v1/timings';
const MYQURAN_SEARCH = 'https://api.myquran.com/v3/sholat/kabkota/cari';
const MYQURAN_JADWAL = 'https://api.myquran.com/v3/sholat/jadwal';

function deviceTimeZone(fallback = 'Asia/Jakarta') {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || fallback;
  } catch (_e) {
    return fallback;
  }
}

function isIndonesia(settings) {
  return /indonesia/i.test(String((settings && settings.country) || ''));
}

// Validasi koordinat internal (nama disengaja beda dari hasValidCoords di
// background/popup agar tidak bentrok di global scope yang sama).
function coordsValid(s) {
  return !!s && s.useCoords === true
    && typeof s.lat === 'number' && Number.isFinite(s.lat) && s.lat >= -90 && s.lat <= 90
    && typeof s.lng === 'number' && Number.isFinite(s.lng) && s.lng >= -180 && s.lng <= 180;
}

function myquranCacheGet() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get({ myquranCache: {} }, (st) => resolve((st && st.myquranCache) || {}));
    } catch (_e) {
      resolve({});
    }
  });
}

// Cari ID kab/kota MyQuran untuk nama kota. Hasil di-cache per nama kota.
// Prioritas: cocok persis (abaikan awalan KAB./KOTA), lalu hasil pertama.
async function resolveMyQuranId(city) {
  const key = String(city || '').trim().toLowerCase();
  if (!key) throw new Error('Nama kota kosong');
  const cache = await myquranCacheGet();
  if (cache[key] && cache[key].id) return cache[key];

  const res = await fetch(MYQURAN_SEARCH + '/' + encodeURIComponent(String(city).trim()));
  if (!res.ok) throw new Error('MyQuran search HTTP ' + res.status);
  const json = await res.json();
  const list = json && json.data;
  if (!json || json.status !== true || !Array.isArray(list) || !list.length) {
    throw new Error('Kota tidak ditemukan di MyQuran');
  }
  const norm = (s) => String(s || '').toLowerCase().replace(/^(kab\.?|kota)\s+/, '').trim();
  const want = norm(city);
  const exacts = list.filter((it) => norm(it && it.lokasi) === want);
  // Bila "KAB. X" dan "KOTA X" sama-sama cocok, pilih KOTA (lebih umum dimaksud).
  const exact = exacts.find((it) => /^kota\b/i.test(String((it && it.lokasi) || '')))
    || exacts[0] || list[0];
  if (!exact || !exact.id) throw new Error('Respons pencarian MyQuran tidak valid');
  const entry = { id: exact.id, label: exact.lokasi };
  try {
    const c2 = await myquranCacheGet();
    c2[key] = entry;
    chrome.storage.local.set({ myquranCache: c2 });
  } catch (_e) {}
  return entry;
}

// Ambil jadwal hari ini dari MyQuran, dinormalisasi ke format internal:
// { Imsak, Fajr, Sunrise, Dhuha, Dhuhr, Asr, Maghrib, Isha } berformat "HH:MM".
async function fetchMyQuranData(settings) {
  const entry = await resolveMyQuranId(settings.city);
  const tz = deviceTimeZone();
  const res = await fetch(MYQURAN_JADWAL + '/' + entry.id + '/today?tz=' + encodeURIComponent(tz));
  if (!res.ok) throw new Error('MyQuran jadwal HTTP ' + res.status);
  const json = await res.json();
  const map = json && json.data && json.data.jadwal;
  if (!json || json.status !== true || !map || typeof map !== 'object') {
    throw new Error('Jadwal MyQuran kosong');
  }
  const keys = Object.keys(map);
  if (!keys.length) throw new Error('Jadwal MyQuran kosong');
  const j = map[keys[0]];
  if (!j || !j.subuh || !j.dzuhur || !j.ashar || !j.maghrib || !j.isya) {
    throw new Error('Jadwal MyQuran tidak lengkap');
  }
  return {
    timings: {
      Imsak: j.imsak, Fajr: j.subuh, Sunrise: j.terbit, Dhuha: j.dhuha,
      Dhuhr: j.dzuhur, Asr: j.ashar, Maghrib: j.maghrib, Isha: j.isya
    },
    date: null,
    meta: { timezone: tz, kabko: (json.data && json.data.kabko) || entry.label, prov: (json.data && json.data.prov) || null },
    source: 'myquran'
  };
}

async function fetchAladhanData(settings) {
  const useCoords = coordsValid(settings);
  const url = useCoords
    ? API_COORD + '?latitude=' + settings.lat + '&longitude=' + settings.lng
      + '&method=' + encodeURIComponent(settings.method) + '&school=' + encodeURIComponent(settings.school)
    : API_CITY + '?city=' + encodeURIComponent(settings.city) + '&country=' + encodeURIComponent(settings.country)
      + '&method=' + encodeURIComponent(settings.method) + '&school=' + encodeURIComponent(settings.school);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Aladhan HTTP ' + res.status);
  const json = await res.json();
  if (!json || !json.data || !json.data.timings) throw new Error('Timings Aladhan kosong');
  return {
    timings: json.data.timings,
    date: json.data.date || null,
    meta: json.data.meta || null,
    source: 'aladhan'
  };
}

// Satu pintu: MyQuran dulu (kota Indonesia, tanpa koordinat), gagal → Aladhan.
async function fetchTimingsUnified(settings) {
  if (!coordsValid(settings) && isIndonesia(settings)) {
    try {
      return await fetchMyQuranData(settings);
    } catch (e) {
      try {
        console.warn('[SholatReminder] MyQuran gagal, fallback Aladhan:', (e && e.message) || e);
      } catch (_e) {}
    }
  }
  return fetchAladhanData(settings);
}

// Tanggal Hijriah via Intl (dipakai saat sumber data tidak membawa info Hijriah).
function hijriFallbackStr() {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const withSuffix = (s) => (/h$/i.test(s.trim()) ? s.trim() : s.trim() + ' H');
  try {
    return withSuffix(new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', opts).format(new Date()));
  } catch (_e) {
    try {
      return withSuffix(new Intl.DateTimeFormat('id-ID-u-ca-islamic', opts).format(new Date()));
    } catch (_e2) {
      return '-';
    }
  }
}
