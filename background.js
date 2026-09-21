// background.js (service worker) - v4.3
importScripts('api.js');

const QUOTES = [
  'Sesungguhnya salat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman. (QS. An-Nisa: 103)',
  'أَقِمِ الصَّلَاةَ لِذِكْرِي — Dirikanlah salat untuk mengingat-Ku. (QS. Thaha: 14)',
  'Perintahkanlah keluargamu melaksanakan salat. (QS. Thaha: 132)',
  'إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ — Salat mencegah dari perbuatan keji dan mungkar. (QS. Al-Ankabut: 45)',
  'وَأَقِيمُوا الصَّلَاةَ — Dan dirikanlah salat. (QS. Al-Baqarah: 43)',
  'حَافِظُوا عَلَى الصَّلَوَاتِ — Peliharalah semua salat(mu). (QS. Al-Baqarah: 238)',
  'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ — Mohonlah pertolongan dengan sabar dan salat. (QS. Al-Baqarah: 153)',
  'Jadikanlah sabar dan salat sebagai penolongmu. (QS. Al-Baqarah: 45)',
  'وَاسْجُدْ وَاقْتَرِبْ — Bersujudlah dan dekatkanlah diri kepada Allah. (QS. Al-Alaq: 19)',
  'Maka celakalah orang yang salat, yaitu yang lalai dari salatnya. (QS. Al-Maun: 4-5)',
  'قَدْ أَفْلَحَ الْمُؤْمِنُونَ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ — Sungguh beruntung orang beriman yang khusyuk dalam salatnya. (QS. Al-Muminun: 1-2)',
  'Dirikanlah salat sejak matahari tergelincir sampai gelap malam. (QS. Al-Isra: 78)',
  'Pada sebagian malam, bertahajudlah sebagai ibadah tambahan bagimu. (QS. Al-Isra: 79)',
  'Dirikanlah salat pada kedua ujung siang dan bagian malam. (QS. Hud: 114)',
  'Dirikanlah salat dan tunaikanlah zakat. (QS. Al-Baqarah: 110)',
  'Kecuali orang-orang yang menjaga salatnya dengan tekun. (QS. Al-Maarij: 22-23)',
  'Mereka menyia-nyiakan salat dan memperturutkan hawa nafsu. (QS. Maryam: 59)',
  'Apakah yang memasukkanmu ke dalam Saqar? Kami dahulu tidak mengerjakan salat. (QS. Al-Muddattsir: 42-43)',
  'Perjanjian antara kami dan mereka adalah salat, barang siapa meninggalkannya maka ia telah kafir. (HR. Tirmidzi)',
  'Amal pertama yang dihisab pada hari kiamat adalah salat. (HR. Tirmidzi)',
  'Pokok segala perkara adalah Islam dan tiangnya adalah salat. (HR. Tirmidzi)',
  'Jagalah (perintah) Allah, niscaya Allah menjagamu. (HR. Tirmidzi)',
  'Doa yang paling didengar adalah doa di akhir malam dan setelah salat wajib. (HR. Tirmidzi)',
  'Salat malam adalah kebiasaan orang-orang saleh sebelummu. (HR. Tirmidzi)',
  'Salat berjemaah lebih utama 27 derajat daripada salat sendirian. (HR. Bukhari & Muslim)',
  'Salat pada waktunya adalah amal yang paling dicintai Allah. (HR. Bukhari & Muslim)',
  'Barang siapa meninggalkan salat Asar, hapuslah amalnya. (HR. Bukhari)',
  'Malaikat malam dan siang berkumpul pada salat Subuh dan Asar. (HR. Bukhari & Muslim)',
  'Salat Isya dan Subuh berjemaah paling berat bagi orang munafik. (HR. Bukhari & Muslim)',
  'Jika mendengar azan, ucapkanlah seperti yang diucapkan muazin. (HR. Bukhari & Muslim)',
  'Pembeda antara seseorang dengan kesyirikan dan kekufuran adalah meninggalkan salat. (HR. Muslim)',
  'Salat lima waktu menghapus dosa di antaranya. (HR. Muslim)',
  'Salat adalah cahaya. (HR. Muslim)',
  'Isya berjemaah seperti salat separuh malam. (HR. Muslim)',
  'Subuh berjemaah seperti salat semalam penuh. (HR. Muslim)',
  'Dua rakaat Subuh lebih baik dari dunia dan seisinya. (HR. Muslim)',
  'Air wudu menggugurkan dosa bersama tetesnya. (HR. Muslim)',
  'Langkah ke masjid menghapus dosa dan mengangkat derajat. (HR. Muslim)',
  'Sujud adalah saat terdekat antara hamba dan Rabb-nya. (HR. Muslim)',
  'Dua rakaat Dhuha mencukupi sedekah seluruh persendian. (HR. Muslim)',
  'Siapa menyempurnakan wudu lalu salat dua rakaat dengan khusyuk, wajib baginya surga. (HR. Muslim)',
  'Perintahkan anak salat sejak umur tujuh tahun. (HR. Abu Dawud)',
  'Istirahatkanlah kami dengan salat, wahai Bilal. (HR. Abu Dawud)',
  'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ — Ya Allah, tolonglah aku mengingat-Mu, bersyukur dan beribadah dengan baik. (Doa Nabi, HR. Abu Dawud)'
];
const PRAYER_LABELS = {
  Fajr: 'Subuh',
  Dhuhr: 'Dzuhur',
  Asr: 'Ashar',
  Maghrib: 'Maghrib',
  Isha: 'Isya'
};

const DEFAULT_SETTINGS = {
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

// Antrean quote tanpa ulang: kocok semua indeks, habiskan satu per satu, kocok lagi.
// 44 quote bersumber = ~9 hari tanpa pengulangan (5 salat/hari).
function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const quoteStateGet = () => new Promise((resolve) => {
  try {
    chrome.storage.local.get({ quoteQueue: null, lastQuoteIndex: -1 }, resolve);
  } catch (_e) {
    resolve({ quoteQueue: null, lastQuoteIndex: -1 });
  }
});

async function nextQuote() {
  if (QUOTES.length === 1) return QUOTES[0];
  try {
    const state = await quoteStateGet();
    let queue = Array.isArray(state?.quoteQueue) ? state.quoteQueue.filter((i) => Number.isInteger(i) && i >= 0 && i < QUOTES.length) : [];
    // Migrasi dari versi lama (hanya lastQuoteIndex): buang indeks terakhir dari antrean baru
    if (!queue.length) {
      queue = shuffledInterfacesFallback(state?.lastQuoteIndex);
    }
    const idx = queue.shift();
    const quote = QUOTES[idx] || QUOTES[0];
    try {
      // Simpan sisa antrean + terakhir dipakai
      chrome.storage.local.set({ quoteQueue: queue, lastQuoteIndex: idx });
    } catch (_e) {}
    return quote;
  } catch (_e) {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }
}

function shuffledInterfacesFallback(lastIdx) {
  const q = shuffledIndices(QUOTES.length);
  // Hindari pengulangan langsung dengan quote terakhir versi lama
  if (Number.isInteger(lastIdx) && lastIdx >= 0 && q[0] === lastIdx && q.length > 1) {
    [q[0], q[1]] = [q[1], q[0]];
  }
  return q;
}

function showPrayerNotification(prayerName, quote) {
  chrome.notifications.create(`pray-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icon-sholat.png',
    title: 'Pengingat Waktu Salat',
    message: `${prayerName} sudah masuk. ${quote}`,
    priority: 2
  });
}

function showPrayerModalInTabs(prayerName, quote) {
  chrome.tabs.query({}, async (tabs) => {
    if (chrome.runtime.lastError || !Array.isArray(tabs)) return;
    for (const tab of tabs) {
      if (!tab?.id || !tab?.url) continue;
      // Content script hanya bisa jalan di http/https, skip chrome://, edge://, dll
      if (!/^https?:\/\//i.test(tab.url)) continue;
      // Skip halaman yang diblokir Chrome (web store)
      if (/^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)/i.test(tab.url)) continue;
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_PRAYER_MODAL',
          prayerName,
          quote
        });
      } catch (err) {
        // Kemungkinan content script belum ter-inject (tab lama sebelum install).
        // Coba inject programmatic lalu kirim ulang.
        const msg = String(err?.message || err);
        if (/no receiving end|receiving end does not exist|could not establish/i.test(msg)) {
          try {
            if (chrome.scripting?.executeScript) {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
              });
              await chrome.tabs.sendMessage(tab.id, {
                type: 'SHOW_PRAYER_MODAL',
                prayerName,
                quote
              });
            }
          } catch (_e) {
            // Abaikan tab yang memang tidak bisa di-inject (PDF, dsb)
          }
        }
      }
    }
  });
}

async function triggerPrayerReminder(prayerName) {
  const quote = await nextQuote();
  showPrayerNotification(prayerName, quote);
  showPrayerModalInTabs(prayerName, quote);
}

function nextMidnightPlus(minutes = 5) {
  const now = new Date();
  const nxt = new Date(now);
  nxt.setHours(24, 0, 0, 0);
  return nxt.getTime() + minutes * 60 * 1000;
}

function parse24hToTodayMillis(timeStr) {
  if (!timeStr) return NaN;
  const s = String(timeStr).trim();
  // Format ISO8601 dari Aladhan saat iso8601=true, contoh: 2026-09-19T04:27:00+07:00
  // Langsung pakai timestamp-nya karena sudah tanggal hari ini + zona benar.
  if (s.includes('T')) {
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return t;
  }
  // Format normal: "04:27" atau "04:27 (WIB)"
  const m = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!m) return NaN;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
}

const getSettings = () => new Promise((resolve) => chrome.storage.sync.get(DEFAULT_SETTINGS, resolve));

const alarmsGetAll = () => new Promise((resolve) => chrome.alarms.getAll((a) => resolve(a || [])));
const alarmsClear = (name) => new Promise((resolve) => chrome.alarms.clear(name, resolve));

async function scheduleTodayAlarms(reason = 'manual') {
  let timings;
  let settings;
  let apiMeta = null;
  let apiSource = 'aladhan';
  try {
    settings = await getSettings();
    const data = await fetchTimingsUnified(settings);
    timings = data.timings;
    apiMeta = data.meta || null;
    apiSource = data.source || 'aladhan';
  } catch (e) {
    console.error('Fetch timings failed', e);
    // Jadwalkan percobaan ulang 15 menit lagi agar tidak kosong seharian saat offline
    try {
      chrome.alarms.create('refresh:retry', { when: Date.now() + 15 * 60 * 1000 });
    } catch (_e) {}
    try {
      await chrome.storage.local.set({
        lastSchedule: {
          ok: false,
          at: Date.now(),
          reason,
          error: String(e?.message || e)
        }
      });
    } catch (_e) {}
    throw e;
  }

  // Hapus hanya alarm jadwal (pertahankan snooze: buatan user)
  try {
    const all = await alarmsGetAll();
    for (const a of all) {
      if (a?.name?.startsWith('pray:') || a?.name === 'refresh:tomorrow' || a?.name === 'refresh:retry') {
        await alarmsClear(a.name);
      }
    }
  } catch (e) {
    console.warn('Clear schedule alarms failed, fallback clearAll', e);
    await new Promise((resolve) => chrome.alarms.clearAll(resolve));
    // Kembalikan snooze yang terlanjur ikut terhapus? Tidak bisa — biarkan, user bisa snooze ulang.
  }

  const prayers = [
    ['Fajr', timings.Fajr],
    ['Dhuhr', timings.Dhuhr],
    ['Asr', timings.Asr],
    ['Maghrib', timings.Maghrib],
    ['Isha', timings.Isha]
  ];

  const now = Date.now();
  const scheduled = [];
  let nextLabel = '';
  let nextWhen = Number.POSITIVE_INFINITY;

  for (const [name, time] of prayers) {
    if (!time) continue;
    const when = parse24hToTodayMillis(time);
    if (Number.isNaN(when)) {
      console.warn('Skip prayer, bad time format', name, time);
      continue;
    }
    if (when > now) {
      chrome.alarms.create(`pray:${name}`, { when });
      scheduled.push({ name, when });
      if (when < nextWhen) {
        nextWhen = when;
        nextLabel = name;
      }
    }
  }

  chrome.action.setBadgeText({ text: nextLabel ? 'ON' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#1f7a57' });
  chrome.alarms.create('refresh:tomorrow', { when: nextMidnightPlus(5) });

  const result = {
    ok: true,
    at: Date.now(),
    reason,
    source: apiSource,
    scheduled: scheduled.map((s) => s.name),
    next: nextLabel ? { name: nextLabel, when: nextWhen } : null,
    location: hasValidCoords(settings)
      ? { mode: 'coords', lat: settings.lat, lng: settings.lng, accuracy: settings.accuracy ?? null }
      : { mode: 'city', city: settings.city, country: settings.country },
    timezone: apiMeta?.timezone || null
  };
  try {
    await chrome.storage.local.set({ lastSchedule: result });
  } catch (_e) {}
  return result;
}

let rescheduleDebounce = null;
function scheduleSoon(reason = 'storage-change', delayMs = 1500) {
  if (rescheduleDebounce) clearTimeout(rescheduleDebounce);
  rescheduleDebounce = setTimeout(() => {
    rescheduleDebounce = null;
    scheduleTodayAlarms(reason).catch(() => {});
  }, delayMs);
}

chrome.runtime.onInstalled.addListener(() => scheduleTodayAlarms('installed').catch(() => {}));
chrome.runtime.onStartup.addListener(() => scheduleTodayAlarms('startup').catch(() => {}));

// Jadwal ulang otomatis saat pengaturan berubah (popup / options / sync antar device)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  const keys = Object.keys(changes || {});
  if (!keys.length) return;
  if (keys.some((k) => k in DEFAULT_SETTINGS)) {
    scheduleSoon('storage-change');
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('pray:')) {
    const prayerKey = alarm.name.split(':')[1];
    const prayerName = PRAYER_LABELS[prayerKey] || prayerKey;
    triggerPrayerReminder(prayerName).catch((e) => console.error('Reminder failed', e));
    scheduleTodayAlarms('after-prayer').catch(() => {});
    return;
  }

  if (alarm.name.startsWith('snooze:')) {
    const prayerName = alarm.name.slice('snooze:'.length) || 'Waktu Salat';
    triggerPrayerReminder(prayerName).catch((e) => console.error('Snooze reminder failed', e));
    return;
  }

  if (alarm.name === 'refresh:tomorrow' || alarm.name === 'refresh:retry') {
    scheduleTodayAlarms(alarm.name === 'refresh:retry' ? 'retry' : 'midnight-refresh').catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'RESCHEDULE_PRAYERS') {
    scheduleTodayAlarms(msg?.reason || 'manual')
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));

    return true;
  }

  if (msg?.type === 'GET_SCHEDULE_STATUS') {
    Promise.all([
      alarmsGetAll(),
      new Promise((resolve) => chrome.storage.local.get({ lastSchedule: null }, resolve))
    ])
      .then(([alarms, stored]) => {
        const prayAlarms = (alarms || [])
          .filter((a) => a?.name?.startsWith('pray:'))
          .map((a) => ({ name: a.name.slice(5), when: a.scheduledTime }))
          .sort((a, b) => a.when - b.when);
        sendResponse({ ok: true, alarms: prayAlarms, lastSchedule: stored?.lastSchedule || null });
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (msg?.type === 'SNOOZE_PRAYER') {
    const minutes = Math.min(Math.max(Number(msg.minutes) || 5, 1), 30);
    const prayerName = String(msg.prayerName || 'Waktu Salat').trim() || 'Waktu Salat';
    chrome.alarms.create(`snooze:${prayerName}`, { when: Date.now() + minutes * 60 * 1000 });
    sendResponse({ ok: true });
    return;
  }

  if (msg?.type === 'TEST_PRAYER_NOTIFICATION') {
    const prayerName = String(msg.prayerName || 'Waktu Salat').trim() || 'Waktu Salat';
    // Tiap kanal (notifikasi/modal) dibungkus sendiri: satu gagal, yang lain tetap jalan.
    (async () => {
      const warnings = [];
      let quote;
      try {
        quote = await nextQuote();
      } catch (e) {
        quote = 'Saatnya menunaikan salat.';
        warnings.push('quote: ' + String(e?.message || e));
      }
      try {
        showPrayerNotification(prayerName, quote);
      } catch (e) {
        warnings.push('notification: ' + String(e?.message || e));
      }
      try {
        showPrayerModalInTabs(prayerName, quote);
      } catch (e) {
        warnings.push('modal: ' + String(e?.message || e));
      }
      sendResponse({ ok: true, warnings });
    })();
    return true;
  }
});
