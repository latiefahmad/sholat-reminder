// background.js (service worker) - v5.0
// Supports two API sources:
//   'equran'  → POST https://equran.id/api/v2/shalat  (Indonesia only, Kemenag data)
//   'aladhan' → GET  https://api.aladhan.com/v1/timingsByCity  (worldwide)

const API_EQURAN   = 'https://equran.id/api/v2/shalat';
const API_CITY     = 'https://api.aladhan.com/v1/timingsByCity';
const API_COORD    = 'https://api.aladhan.com/v1/timings';

const QUOTES = [
  'Sholat adalah tiang agama.',
  'Amal pertama yang dihisab pada hari kiamat adalah sholat. (HR. Tirmidzi)',
  'Sesungguhnya sholat mencegah dari perbuatan keji dan mungkar. (QS. Al-Ankabut: 45)',
  'Dirikanlah sholat untuk mengingat-Ku. (QS. Taha: 14)',
  'Peliharalah semua salat(mu), dan (peliharalah) salat wustha. (QS. Al-Baqarah: 238)',
  'Dan perintahkanlah keluargamu melaksanakan sholat. (QS. Taha: 132)',
  'Sesungguhnya sholat itu adalah kewajiban yang ditentukan waktunya atas orang beriman. (QS. An-Nisa: 103)',
  'أَقِمِ الصَّلَاةَ لِذِكْرِي — Dirikanlah salat untuk mengingat-Ku. (QS. Taha: 14)',
  'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ — Salat mencegah dari perbuatan keji dan mungkar. (QS. Al-Ankabut: 45)',
  'وَأَقِيمُوا الصَّلَاةَ — Dan dirikanlah salat. (QS. Al-Baqarah: 43)',
  'حَافِظُوا عَلَى الصَّلَوَاتِ — Peliharalah semua salat(mu). (QS. Al-Baqarah: 238)',
  'وَاسْجُدْ وَاقْتَرِبْ — Bersujudlah dan dekatkanlah diri (kepada Allah). (QS. Al-\'Alaq: 19)',
  'Sholat tepat waktu adalah amal yang paling dicintai Allah. (HR. Bukhari & Muslim)',
  'Ketika adzan berkumandang, mari tinggalkan sejenak urusan dunia.',
  'Jangan tunda sholat, karena waktu tidak akan kembali.',
  'Sholat adalah cahaya bagi hati dan ketenangan bagi jiwa.',
  'Setiap sujud mendekatkan hamba kepada Rabb-nya.',
  'Mulai lagi hari ini dengan menjaga sholat lima waktu.',
  'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ — Ya Allah, bantulah aku untuk mengingat-Mu, bersyukur kepada-Mu, dan beribadah dengan baik.',
  'Semoga Allah memudahkan kita menjaga sholat di awal waktu.'
];

const PRAYER_LABELS = {
  Fajr: 'Subuh',
  Dhuhr: 'Dzuhur',
  Asr: 'Ashar',
  Maghrib: 'Maghrib',
  Isha: 'Isya'
};

const DEFAULT_SETTINGS = {
  apiSource: 'equran',
  // eQuran settings
  provinsi: 'DKI Jakarta',
  kabkota: 'Kota Jakarta',
  // aladhan settings
  city: 'Jakarta',
  country: 'Indonesia',
  method: 20,
  school: 0,
  useCoords: false,
  lat: null,
  lng: null
};

let lastQuoteIndex = -1;
function randomQuote() {
  if (QUOTES.length === 1) return QUOTES[0];
  let idx = Math.floor(Math.random() * QUOTES.length);
  while (idx === lastQuoteIndex) idx = Math.floor(Math.random() * QUOTES.length);
  lastQuoteIndex = idx;
  return QUOTES[idx];
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
  // Kirim ke tab aktif terlebih dahulu
  chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
    if (chrome.runtime.lastError) return;
    const activeTabIds = new Set();

    if (Array.isArray(activeTabs)) {
      for (const tab of activeTabs) {
        if (!tab?.id || !tab.url) continue;
        // Hanya kirim ke halaman http/https (bukan chrome://, about:, dll)
        if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) continue;
        activeTabIds.add(tab.id);
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_PRAYER_MODAL',
          prayerName,
          quote
        }, () => { void chrome.runtime.lastError; });
      }
    }

    // Kirim juga ke semua tab http/https lainnya
    chrome.tabs.query({}, (allTabs) => {
      if (chrome.runtime.lastError || !Array.isArray(allTabs)) return;
      for (const tab of allTabs) {
        if (!tab?.id || !tab.url) continue;
        if (activeTabIds.has(tab.id)) continue; // sudah dikirim
        if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) continue;
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_PRAYER_MODAL',
          prayerName,
          quote
        }, () => { void chrome.runtime.lastError; });
      }
    });
  });
}

function triggerPrayerReminder(prayerName) {
  const quote = randomQuote();
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
  const [hh, mm] = String(timeStr).substring(0, 5).split(':').map(Number);
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.getTime();
}

const getSettings = () => new Promise((resolve) => chrome.storage.sync.get(DEFAULT_SETTINGS, resolve));

/**
 * Fetch timings from eQuran.id API.
 * Returns an object with keys: Fajr, Dhuhr, Asr, Maghrib, Isha, Imsak, Sunrise
 */
async function fetchTimingsEquran(settings) {
  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();
  const tanggal = now.getDate();

  const res = await fetch(API_EQURAN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provinsi: settings.provinsi || DEFAULT_SETTINGS.provinsi,
      kabkota: settings.kabkota || DEFAULT_SETTINGS.kabkota,
      bulan,
      tahun
    })
  });

  if (!res.ok) throw new Error(`eQuran API ${res.status}`);
  const json = await res.json();
  if (!json?.data?.jadwal) throw new Error('eQuran: no jadwal');

  // Find today's entry
  const entry = json.data.jadwal.find((j) => j.tanggal === tanggal);
  if (!entry) throw new Error(`eQuran: no entry for tanggal ${tanggal}`);

  // Map to aladhan-compatible keys
  return {
    Fajr: entry.subuh,
    Dhuhr: entry.dzuhur,
    Asr: entry.ashar,
    Maghrib: entry.maghrib,
    Isha: entry.isya,
    Imsak: entry.imsak,
    Sunrise: entry.terbit
  };
}

/**
 * Fetch timings from aladhan.com API.
 */
async function fetchTimingsAladhan(settings) {
  const hasCoords = settings.useCoords && typeof settings.lat === 'number' && typeof settings.lng === 'number';
  const url = hasCoords
    ? `${API_COORD}?latitude=${settings.lat}&longitude=${settings.lng}&method=${encodeURIComponent(settings.method)}&school=${encodeURIComponent(settings.school)}&iso8601=true`
    : `${API_CITY}?city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}&method=${encodeURIComponent(settings.method)}&school=${encodeURIComponent(settings.school)}&iso8601=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`aladhan API ${res.status}`);
  const json = await res.json();
  if (!json?.data?.timings) throw new Error('aladhan: No timings');
  return json.data.timings;
}

async function fetchTimings(settings) {
  if (settings.apiSource === 'aladhan') {
    return fetchTimingsAladhan(settings);
  }
  // Default: equran
  return fetchTimingsEquran(settings);
}

async function scheduleTodayAlarms() {
  let timings;
  try {
    const settings = await getSettings();
    timings = await fetchTimings(settings);
  } catch (e) {
    console.error('Fetch timings failed', e);
    return;
  }

  chrome.alarms.clearAll(() => {
    const prayers = [
      ['Fajr', timings.Fajr],
      ['Dhuhr', timings.Dhuhr],
      ['Asr', timings.Asr],
      ['Maghrib', timings.Maghrib],
      ['Isha', timings.Isha]
    ];

    const now = Date.now();
    let nextLabel = '';
    let nextWhen = Number.POSITIVE_INFINITY;

    for (const [name, time] of prayers) {
      if (!time) continue;
      const when = parse24hToTodayMillis(time);
      if (when > now) {
        chrome.alarms.create(`pray:${name}`, { when });
        if (when < nextWhen) {
          nextWhen = when;
          nextLabel = name;
        }
      }
    }

    chrome.action.setBadgeText({ text: nextLabel ? 'ON' : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#1f7a57' });
    chrome.alarms.create('refresh:tomorrow', { when: nextMidnightPlus(5) });
  });
}

chrome.runtime.onInstalled.addListener(scheduleTodayAlarms);
chrome.runtime.onStartup.addListener(scheduleTodayAlarms);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('pray:')) {
    const prayerKey = alarm.name.split(':')[1];
    const prayerName = PRAYER_LABELS[prayerKey] || prayerKey;
    triggerPrayerReminder(prayerName);
    scheduleTodayAlarms();
    return;
  }

  if (alarm.name === 'refresh:tomorrow') {
    scheduleTodayAlarms();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'RESCHEDULE_PRAYERS') {
    scheduleTodayAlarms()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));

    return true;
  }

  if (msg?.type === 'TEST_PRAYER_NOTIFICATION') {
    const prayerName = String(msg.prayerName || 'Waktu Salat').trim() || 'Waktu Salat';
    triggerPrayerReminder(prayerName);
    sendResponse({ ok: true });
  }
});
