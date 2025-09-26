// background.js (service worker) — v4.2
const API_CITY = 'https://api.aladhan.com/v1/timingsByCity';
const API_COORD = 'https://api.aladhan.com/v1/timings';

const QUOTES = [
  "Sholat adalah tiang agama.",
  "Sesungguhnya sholat mencegah dari perbuatan keji dan mungkar. (QS. 29:45)",
  "Dirikanlah sholat untuk mengingat-Ku. (QS. 20:14)",
  "Jangan tinggalkan sholat, karena ia cahaya bagi hati.",
  "Amal pertama yang dihisab adalah sholat."
];

const DEFAULT_SETTINGS = {
  city: 'Jakarta',
  country: 'Indonesia',
  method: 20,
  school: 0,
  useCoords: false,
  lat: null,
  lng: null
};

function randomQuote() { return QUOTES[Math.floor(Math.random() * QUOTES.length)]; }
function nextMidnightPlus(minutes = 5) {
  const now = new Date(); const nxt = new Date(now);
  nxt.setHours(24, 0, 0, 0); return nxt.getTime() + minutes * 60 * 1000;
}
function parse24hToTodayMillis(timeStr) {
  const [hh, mm] = String(timeStr).substring(0,5).split(':').map(Number);
  const d = new Date(); d.setSeconds(0,0); d.setHours(hh||0, mm||0, 0, 0); return d.getTime();
}
const getSettings = () => new Promise(r => chrome.storage.sync.get(DEFAULT_SETTINGS, r));

async function fetchTimings(settings) {
  let url = '';
  if (settings.useCoords && typeof settings.lat === 'number' && typeof settings.lng === 'number') {
    url = `${API_COORD}?latitude=${settings.lat}&longitude=${settings.lng}&method=${encodeURIComponent(settings.method)}&school=${encodeURIComponent(settings.school)}&iso8601=true`;
  } else {
    url = `${API_CITY}?city=${encodeURIComponent(settings.city)}&country=${encodeURIComponent(settings.country)}&method=${encodeURIComponent(settings.method)}&school=${encodeURIComponent(settings.school)}&iso8601=true`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('API ' + res.status);
  const json = await res.json();
  if (!json?.data?.timings) throw new Error('No timings');
  return json.data.timings;
}

async function scheduleTodayAlarms() {
  let settings = await getSettings();
  let timings;
  try { timings = await fetchTimings(settings); }
  catch(e){ console.error('Fetch timings failed', e); return; }

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
    for (const [name, t] of prayers) {
      if (!t) continue;
      const when = parse24hToTodayMillis(t);
      if (when > now) {
        chrome.alarms.create(`pray:${name}`, { when });
        if (when < nextWhen) { nextWhen = when; nextLabel = name; }
      }
    }
    chrome.action.setBadgeText({ text: nextLabel ? 'ON' : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#0b74da' });
    chrome.alarms.create('refresh:tomorrow', { when: nextMidnightPlus(5) });
  });
}

function notifyTabs(prayerName) {
  const payload = { type: 'SHOW_PRAYER_MODAL', prayerName, quote: randomQuote() };
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, payload, () => void chrome.runtime.lastError);
      }
    }
  });
}

chrome.runtime.onInstalled.addListener(scheduleTodayAlarms);
chrome.runtime.onStartup.addListener(scheduleTodayAlarms);
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name.startsWith('pray:')) {
    const prayerName = alarm.name.split(':')[1];
    notifyTabs(prayerName);
    scheduleTodayAlarms();
  }
  if (alarm.name === 'refresh:tomorrow') scheduleTodayAlarms();
});
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'RESCHEDULE_PRAYERS') {
    scheduleTodayAlarms().then(() => sendResponse({ ok: true })).catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});
