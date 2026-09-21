const DEFAULTS = {
  city: 'Jakarta',
  country: 'Indonesia',
  method: 20,
  school: 0,
  useCoords: false,
  lat: null,
  lng: null,
  accuracy: null,
  locUpdatedAt: null
};

function hasValidCoords(s) {
  return s?.useCoords === true
    && typeof s?.lat === 'number' && Number.isFinite(s.lat) && s.lat >= -90 && s.lat <= 90
    && typeof s?.lng === 'number' && Number.isFinite(s.lng) && s.lng >= -180 && s.lng <= 180;
}

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
  Saturday: 'Sabtu',
  // Varian dari API Aladhan untuk hijri.weekday.en
  'Al Ahad': 'Ahad',
  'Al Ithnayn': 'Senin',
  'Ath Thulatha': 'Selasa',
  "Ath Thulathaa'": 'Selasa',
  'Al Arbiaa': 'Rabu',
  'Al Khamees': 'Kamis',
  'Al Jumuah': 'Jumat',
  'Al Sabt': 'Sabtu',
  'As Sabt': 'Sabtu',
  Ahad: 'Ahad',
  Ithnayn: 'Senin',
  Thulatha: 'Selasa',
  Arbiaa: 'Rabu',
  Khamees: 'Kamis',
  Jumuah: 'Jumat',
  Sabt: 'Sabtu'
};

function normalizeHijriMonth(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

const HIJRI_MONTHS_NORM = {
  muharram: 'Muharram',
  safar: 'Safar',
  rabialawwal: 'Rabiul Awal',
  rabiulawwal: 'Rabiul Awal',
  rabiaththani: 'Rabiul Akhir',
  rabiulakhir: 'Rabiul Akhir',
  jumadaalawwal: 'Jumadil Awal',
  jumadilawwal: 'Jumadil Awal',
  jumadaalthani: 'Jumadil Akhir',
  jumadilakhir: 'Jumadil Akhir',
  rajab: 'Rajab',
  shaban: 'Syaban',
  syaban: 'Syaban',
  ramadan: 'Ramadhan',
  ramadhan: 'Ramadhan',
  shawwal: 'Syawal',
  syawal: 'Syawal',
  dhualqidah: 'Dzulqa\u2019dah',
  dzulqadah: 'Dzulqa\u2019dah',
  dhualhijjah: 'Dzulhijjah',
  dzulhijjah: 'Dzulhijjah'
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
  btnTest: ids('btnTest'),
  locInfo: ids('locInfo'),
  methodInfo: ids('methodInfo'),
  scheduleInfo: ids('scheduleInfo'),
  acList: ids('cityList'),
  tabJadwal: ids('tab-jadwal'),
  tabPengaturan: ids('tab-pengaturan'),
  panelJadwal: ids('panel-jadwal'),
  panelPengaturan: ids('panel-pengaturan')
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
  if (!timeStr) return NaN;
  const s = String(timeStr).trim();
  if (s.includes('T')) {
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return t;
  }
  const m = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return NaN;
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(h, min, 0, 0);
  return d.getTime();
}

function extractHM(timeStr) {
  if (!timeStr) return '--:--';
  const s = String(timeStr).trim();
  // ISO: ambil jam lokal dari timestamp-nya agar sesuai zona user
  if (s.includes('T')) {
    const t = Date.parse(s);
    if (!Number.isNaN(t)) {
      const d = new Date(t);
      return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}`;
    }
  }
  const m = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!m) return '--:--';
  return `${fmt2(Number(m[1]))}:${fmt2(Number(m[2]))}`;
}

function addHourToTime(timeStr) {
  const hm = extractHM(timeStr);
  if (hm === '--:--') return '--:--';
  const [h, m] = hm.split(':').map(Number);
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

function fillTable(timings) {
  const safe = (key) => (timings && timings[key] ? extractHM(timings[key]) : '--:--');
  el.tImsak.textContent = safe('Imsak');
  el.tFajr.textContent = safe('Fajr');
  el.tSunrise.textContent = safe('Sunrise');
  el.tDhuha.textContent = timings?.Dhuha ? extractHM(timings.Dhuha) : (timings?.Sunrise ? addHourToTime(timings.Sunrise) : '--:--');
  el.tDhuhr.textContent = safe('Dhuhr');
  el.tAsr.textContent = safe('Asr');
  el.tMaghrib.textContent = safe('Maghrib');
  el.tIsha.textContent = safe('Isha');
}

const NEXT_HIGHLIGHT = {
  Imsak: 'Imsak',
  Subuh: 'Subuh',
  Terbit: 'Terbit',
  Dhuha: 'Dhuha',
  Dzuhur: 'Dzuhur',
  Ashar: 'Ashar',
  Maghrib: 'Maghrib',
  Isya: 'Isya'
};

function highlightNext(name) {
  try {
    const items = document.querySelectorAll('.time-item');
    items.forEach((item) => {
      const prayer = item.getAttribute('data-prayer');
      const isNext = prayer && name && (prayer === name || prayer === NEXT_HIGHLIGHT[name]);
      item.classList.toggle('next', Boolean(isNext));
    });
  } catch (_e) {}
}

function computeNext(timings) {
  const sunriseTime = timings.Sunrise ? addHourToTime(timings.Sunrise) : null;
  const rawItems = [
    ['Imsak', timings.Imsak],
    ['Subuh', timings.Fajr],
    ['Terbit', timings.Sunrise],
    ['Dhuha', sunriseTime],
    ['Dzuhur', timings.Dhuhr],
    ['Ashar', timings.Asr],
    ['Maghrib', timings.Maghrib],
    ['Isya', timings.Isha]
  ];
  // Normalisasi ke HH:mm agar tahan format "04:27", "04:27 (WIB)", maupun ISO
  const items = rawItems
    .map(([name, value]) => [name, value ? extractHM(value) : '--:--'])
    .filter(([, value]) => value && value !== '--:--');

  if (!items.length) return null;

  const now = Date.now();
  let best = null;
  let bestWhen = Number.POSITIVE_INFINITY;

  for (const [name, time] of items) {
    const when = parseMillis(time);
    if (Number.isNaN(when)) continue;
    if (when > now && when < bestWhen) {
      best = [name, time];
      bestWhen = when;
    }
  }

  if (!best) {
    const fallbackTime = extractHM(timings.Imsak || items[0][1]);
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

function formatLocInfo(stored, useCoords) {
  if (useCoords) {
    const acc = typeof stored.accuracy === 'number' && Number.isFinite(stored.accuracy)
      ? ` (±${Math.round(stored.accuracy)} m)`
      : '';
    let age = '';
    if (typeof stored.locUpdatedAt === 'number' && stored.locUpdatedAt > 0) {
      const days = Math.floor((Date.now() - stored.locUpdatedAt) / 86400000);
      if (days === 0) age = ', hari ini';
      else if (days === 1) age = ', kemarin';
      else if (days < 30) age = `, ${days} hari lalu`;
    }
    return `Lokasi: ${stored.lat.toFixed(4)}, ${stored.lng.toFixed(4)}${acc}${age} — presisi tinggi`;
  }
  return `Lokasi: ${stored.city}, ${stored.country} — presisi kota`;
}

async function refreshUI() {
  try {
    const stored = await getSettings();
    const useCoords = hasValidCoords(stored);

    el.today.textContent = todayStr();
    el.city.value = stored.city;
    el.country.value = stored.country;
    el.method.value = String(stored.method);
    el.school.value = String(stored.school);
    el.locInfo.textContent = formatLocInfo(stored, useCoords);

    const data = await fetchTimingsUnified(stored);
    const timings = data.timings;
    const date = data.date;
    if (data.source === 'myquran' && data.meta?.kabko) {
      el.locInfo.textContent = `Lokasi: ${data.meta.kabko}${data.meta.prov ? ', ' + data.meta.prov : ''} — Kemenag RI`;
      el.methodInfo.textContent = 'Metode: Kemenag RI, Sumber: MyQuran';
    } else {
      const methodName = METHOD_NAMES[stored.method] || `ID ${stored.method}`;
      const schoolName = stored.school === 0 ? 'Shafi' : 'Hanafi';
      el.methodInfo.textContent = `Metode: ${methodName}, Madzhab: ${schoolName}, Sumber: Aladhan`;
    }
    const apiTz = data.meta?.timezone || null;
    if (apiTz) {
      const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (deviceTz && apiTz !== deviceTz && useCoords) {
        el.methodInfo.textContent += ` (zona API: ${apiTz})`;
      }
    }

    if (!date) {
      // Sumber MyQuran tidak membawa info Hijriah → hitung lokal via Intl
      el.hijriDate.textContent = hijriFallbackStr();
    } else {
      const weekdayEn = date?.hijri?.weekday?.en || date?.gregorian?.weekday?.en || '-';
      const monthEn = date?.hijri?.month?.en || '-';
      const hijriWeekday = HIJRI_WEEKDAYS_ID[weekdayEn] || HIJRI_WEEKDAYS_ID[weekdayEn.trim()] || weekdayEn;
      const hijriMonth = HIJRI_MONTHS_NORM[normalizeHijriMonth(monthEn)] || monthEn;
      const hijriDay = date?.hijri?.day || '-';
      const hijriYear = date?.hijri?.year || '-';
      el.hijriDate.textContent = `${hijriWeekday}, ${hijriDay} ${hijriMonth} ${hijriYear} H`;
    }

    fillTable(timings);
    const next = computeNext(timings);
    if (next) {
      el.nextName.textContent = next.name;
      el.nextTime.textContent = extractHM(next.time);
      highlightNext(String(next.name || '').replace(' (Besok)', ''));
      startCountdown(next.when);
    } else {
      el.nextName.textContent = '-';
      el.nextTime.textContent = '-';
      el.countdown.textContent = '--:--:--';
    }
    await refreshScheduleInfo();
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
  setBusy(true);
  el.scheduleInfo.textContent = 'Jadwal: menyimpan & menjadwalkan ulang...';
  try {
    const city = el.city.value.trim() || DEFAULTS.city;
    const country = el.country.value.trim() || DEFAULTS.country;
    const method = Number(el.method.value);
    const school = Number(el.school.value);
    await setSettings({ city, country, method, school, useCoords: false, lat: null, lng: null, accuracy: null, locUpdatedAt: null });
    await refreshUI();
    const res = await reschedulePrayers('popup-save');
    if (res?.ok) {
      const n = res.scheduled?.length ?? 0;
      el.scheduleInfo.textContent = `Jadwal: aktif, ${n} pengingat tersisa hari ini`;
    } else {
      el.scheduleInfo.textContent = `Jadwal: gagal dijadwalkan (${res?.error || 'unknown'}) — coba lagi`;
    }
    await refreshScheduleInfo(false);
  } catch (e) {
    el.scheduleInfo.textContent = `Jadwal: gagal (${e?.message || e})`;
  } finally {
    setBusy(false);
  }
}

async function takeGeo() {
  setBusy(true);
  el.scheduleInfo.textContent = 'Jadwal: mengambil lokasi...';
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000
      });
    });

    const lat = Number(pos.coords.latitude);
    const lng = Number(pos.coords.longitude);
    const accuracy = Number.isFinite(Number(pos.coords.accuracy)) ? Number(pos.coords.accuracy) : null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Koordinat tidak valid dari browser');
    }
    const current = await getSettings();
    await setSettings({ ...current, useCoords: true, lat, lng, accuracy, locUpdatedAt: Date.now() });
    await refreshUI();
    const res = await reschedulePrayers('popup-geo');
    if (res?.ok) {
      const n = res.scheduled?.length ?? 0;
      el.scheduleInfo.textContent = `Jadwal: aktif (koordinat), ${n} pengingat tersisa`;
    } else {
      el.scheduleInfo.textContent = `Jadwal: lokasi tersimpan, penjadwalan gagal (${res?.error || 'unknown'})`;
    }
    await refreshScheduleInfo(false);
  } catch (e) {
    alert(`Gagal ambil lokasi: ${e.message}\nPastikan izin lokasi diizinkan untuk Chrome.`);
    await refreshScheduleInfo(false);
  } finally {
    setBusy(false);
  }
}

function setBusy(busy) {
  el.btnGeo.disabled = busy;
  el.btnSave.disabled = busy;
}

function reschedulePrayers(reason) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'RESCHEDULE_PRAYERS', reason }, (resp) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(resp || { ok: false, error: 'no-response' });
      });
    } catch (e) {
      resolve({ ok: false, error: String(e?.message || e) });
    }
  });
}

async function refreshScheduleInfo(showLoading = true) {
  if (!el.scheduleInfo) return;
  const current = el.scheduleInfo.textContent || '';
  // Jangan timpa pesan proses yang sedang berjalan (menyimpan/mengambil/menjadwalkan/mengetes)
  if (showLoading && /menyimpan|mengambil|menjadwalkan|^tes\b|terkirim|tes gagal|catatan/i.test(current)) return;
  try {
    const status = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SCHEDULE_STATUS' }, (resp) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(resp);
      });
    });
    if (!status?.ok) return;
    const n = status.alarms?.length ?? 0;
    if (n > 0) {
      const nextMs = status.alarms[0]?.when;
      let nextStr = '';
      if (nextMs) {
        const d = new Date(nextMs);
        nextStr = ` (berikutnya ${fmt2(d.getHours())}:${fmt2(d.getMinutes())})`;
      }
      // Pertahankan pesan sukses save yang lebih detail bila baru saja save
      if (/aktif/i.test(el.scheduleInfo.textContent || '')) return;
      el.scheduleInfo.textContent = `Jadwal: aktif, ${n} pengingat tersisa${nextStr}`;
    } else if (status.lastSchedule && status.lastSchedule.ok === false) {
      el.scheduleInfo.textContent = `Jadwal: gagal memuat (${status.lastSchedule.error || 'offline?'}) — akan dicoba lagi otomatis`;
    } else {
      el.scheduleInfo.textContent = 'Jadwal: tidak ada pengingat tersisa hari ini';
    }
  } catch (_e) {}
}

function testNotificationNow() {
  const prayerName = (el.nextName.textContent || '').trim();
  const payloadName = prayerName && prayerName !== '-' ? prayerName : 'Waktu Salat';
  el.btnTest.disabled = true;
  if (el.scheduleInfo) el.scheduleInfo.textContent = 'Tes: mengirim permintaan notifikasi...';

  let timer = null;
  let done = false;
  const finish = (ok, errMsg, warnings) => {
    if (done) return;
    done = true;
    if (timer) clearTimeout(timer);
    el.btnTest.disabled = false;
    if (!ok) {
      if (el.scheduleInfo) el.scheduleInfo.textContent = `Tes gagal: ${errMsg || 'Unknown error'}`;
      alert(`Gagal tes notifikasi: ${errMsg || 'Unknown error'}`);
      return;
    }
    if (warnings && warnings.length) {
      if (el.scheduleInfo) el.scheduleInfo.textContent = `Tes terkirim dengan catatan: ${warnings.join('; ')}`;
    } else if (el.scheduleInfo) {
      el.scheduleInfo.textContent = 'Tes terkirim! Cek notifikasi sistem & halaman web yang terbuka.';
    }
  };
  // Pengaman: service worker MV3 kadang lambat bangun; jangan biarkan tombol macet
  timer = setTimeout(() => finish(false, 'timeout (service worker tidak merespons, coba klik lagi)'), 10000);

  try {
    chrome.runtime.sendMessage({ type: 'TEST_PRAYER_NOTIFICATION', prayerName: payloadName }, (resp) => {
      if (chrome.runtime.lastError) {
        finish(false, chrome.runtime.lastError.message);
        return;
      }
      if (!resp?.ok) {
        finish(false, resp?.error || 'Unknown error');
        return;
      }
      finish(true, null, resp.warnings);
    });
  } catch (e) {
    finish(false, String(e?.message || e));
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

function switchTab(name) {
  const showJadwal = name !== 'pengaturan';
  if (el.tabJadwal) el.tabJadwal.classList.toggle('active', showJadwal);
  if (el.tabPengaturan) el.tabPengaturan.classList.toggle('active', !showJadwal);
  if (el.panelJadwal) el.panelJadwal.classList.toggle('active', showJadwal);
  if (el.panelPengaturan) el.panelPengaturan.classList.toggle('active', !showJadwal);
}

function init() {
  // Re-resolve tab nodes bila script dievaluasi sebelum DOM siap (defensif)
  if (!el.tabJadwal) el.tabJadwal = ids('tab-jadwal');
  if (!el.tabPengaturan) el.tabPengaturan = ids('tab-pengaturan');
  if (!el.panelJadwal) el.panelJadwal = ids('panel-jadwal');
  if (!el.panelPengaturan) el.panelPengaturan = ids('panel-pengaturan');
  if (el.tabJadwal) el.tabJadwal.addEventListener('click', () => switchTab('jadwal'));
  if (el.tabPengaturan) el.tabPengaturan.addEventListener('click', () => switchTab('pengaturan'));
  if (el.city) el.city.addEventListener('input', () => renderAc(filterCities(el.city.value)));
  if (el.city && el.acList) el.city.addEventListener('focusout', () => setTimeout(() => el.acList.classList.remove('show'), 120));
  if (el.btnSave) el.btnSave.addEventListener('click', save);
  if (el.btnGeo) el.btnGeo.addEventListener('click', takeGeo);
  if (el.btnTest) el.btnTest.addEventListener('click', testNotificationNow);
  switchTab('jadwal');
  refreshUI();
}

document.addEventListener('DOMContentLoaded', init);
