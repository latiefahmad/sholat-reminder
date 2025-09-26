const API_CITY = 'https://api.aladhan.com/v1/timingsByCity';
const API_COORD = 'https://api.aladhan.com/v1/timings';
const DEFAULTS = { city: 'Jakarta', country: 'Indonesia', method: 20, school: 0, useCoords: false, lat: null, lng: null };

const CITY_LIST = ["Magelang","Madiun","Makassar","Malang","Manado","Mamuju","Mandailing Natal","Manokwari","Mataram","Martapura","Medan","Merauke","Meulaboh","Metro","Mojokerto","Muara Enim","Muara Teweh","Majalengka","Majene","Mamasa","Jakarta","Bandung","Surabaya","Semarang","Yogyakarta","Denpasar","Bogor","Bekasi","Tangerang","Depok","Padang","Pekanbaru","Palembang","Banjarmasin","Pontianak","Samarinda","Balikpapan","Palangkaraya","Batam","Tanjungpinang","Kupang","Ambon","Ternate","Sofifi","Jayapura","Sorong","Kendari","Palu","Dubai","Doha","Makkah","Madinah","Manama","Muscat","Male","Mogadishu","Madrid","Manila"];

const ids = s => document.getElementById(s);
const el = { today: ids('today'), hijriDate: ids('hijriDate'), nextName: ids('nextName'), nextTime: ids('nextTime'), countdown: ids('countdown'),
  tImsak: ids('tImsak'), tFajr: ids('tFajr'), tSunrise: ids('tSunrise'), tDhuha: ids('tDhuha'), tDhuhr: ids('tDhuhr'), tAsr: ids('tAsr'), tMaghrib: ids('tMaghrib'), tIsha: ids('tIsha'),
  city: ids('city'), country: ids('country'), method: ids('method'), school: ids('school'),
  btnGeo: ids('btnGeo'), btnSave: ids('btnSave'), locInfo: ids('locInfo'), methodInfo: ids('methodInfo'), acList: ids('cityList') };

const HIJRI_WEEKDAYS_ID = {
  'Sunday': 'Ahad',
  'Monday': 'Senin',
  'Tuesday': 'Selasa',
  'Wednesday': 'Rabu',
  'Thursday': 'Kamis',
  'Friday': 'Jumat',
  'Saturday': 'Sabtu'
};

const HIJRI_MONTHS_ID = {
  'Muharram': 'Muharram',
  'Safar': 'Safar',
  'Rabi\'al-Awwal': 'Rabiul Awal',
  'Rabi\'ath-Thani': 'Rabiul Akhir',
  'Jumada al-Awwal': 'Jumadil Awal',
  'Jumada al-Thani': 'Jumadil Akhir',
  'Rajab': 'Rajab',
  'Sha\'ban': 'Syaban',
  'Ramadan': 'Ramadhan',
  'Shawwal': 'Syawal',
  'Dhu al-Qi\'dah': 'Dzulqa\'dah',
  'Dhu al-Hijjah': 'Dzulhijjah'
};

function todayStr(){ const d=new Date(); return d.toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}); }
const fmt2=n=>String(n).padStart(2,'0');
function parseMillis(s){ const [h,m]=String(s).substring(0,5).split(':').map(Number); const d=new Date(); d.setSeconds(0,0); d.setHours(h||0,m||0,0,0); return d.getTime(); }

function addHourToTime(timeStr) {
  const [h, m] = timeStr.substring(0,5).split(':').map(Number);
  const newH = (h + 1) % 24;
  return `${String(newH).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function fmtCountdown(ms){ if(ms<0)ms=0; const s=Math.floor(ms/1000), h=Math.floor(s/3600), m=Math.floor((s%3600)/60), ss=s%60; return `${fmt2(h)}:${fmt2(m)}:${fmt2(ss)}`; }
const getSettings=()=>new Promise(r=>chrome.storage.sync.get({ city:'Jakarta',country:'Indonesia',method:20,school:0,useCoords:false,lat:null,lng:null },r));
const setSettings=v=>new Promise(r=>chrome.storage.sync.set(v,r));

async function fetchTimings(stored){ let url=''; if(stored.useCoords&&typeof stored.lat==='number'&&typeof stored.lng==='number'){ url=`${API_COORD}?latitude=${stored.lat}&longitude=${stored.lng}&method=${encodeURIComponent(stored.method)}&school=${encodeURIComponent(stored.school)}`; } else { url=`${API_CITY}?city=${encodeURIComponent(stored.city)}&country=${encodeURIComponent(stored.country)}&method=${encodeURIComponent(stored.method)}&school=${encodeURIComponent(stored.school)}`; } const res=await fetch(url); if(!res.ok) throw new Error('API '+res.status); const json=await res.json(); if(!json?.data?.timings) throw new Error('Timings empty'); return { timings: json.data.timings, date: json.data.date }; }

function fillTable(t){ const safe=k=>(t&&t[k]?String(t[k]).substring(0,5):'--:--'); el.tImsak.textContent=safe('Imsak'); el.tFajr.textContent=safe('Fajr'); el.tSunrise.textContent=safe('Sunrise'); const dhuhaTime = t.Sunrise ? addHourToTime(t.Sunrise) : '--:--'; el.tDhuha.textContent=dhuhaTime; el.tDhuhr.textContent=safe('Dhuhr'); el.tAsr.textContent=safe('Asr'); el.tMaghrib.textContent=safe('Maghrib'); el.tIsha.textContent=safe('Isha'); }
function computeNext(t){
  const sunriseTime = t.Sunrise ? addHourToTime(t.Sunrise) : null;
  const items = [
    ['Imsak', t.Imsak],
    ['Subuh', t.Fajr],
    ['Terbit', t.Sunrise],
    ['Dhuha', sunriseTime],
    ['Dzuhur', t.Dhuhr],
    ['Ashar', t.Asr],
    ['Maghrib', t.Maghrib],
    ['Isya', t.Isha]
  ].filter(([,v]) => v);

  const now = Date.now();
  let best = null, bestWhen = Infinity;
  for (const [name, time] of items) {
    const when = parseMillis(time);
    if (when > now && when < bestWhen) {
      bestWhen = when;
      best = [name, time];
    }
  }

  if (!best) {
    // No future event today, next is tomorrow's Imsak
    const imsakWhen = parseMillis(t.Imsak);
    const tomorrowImsakWhen = imsakWhen + 24 * 60 * 60 * 1000;
    best = ['Imsak (Besok)', t.Imsak];
    bestWhen = tomorrowImsakWhen;
  }

  return {name: best[0], time: best[1], when: bestWhen};
}
let timer=null; function startCountdown(targetMs){ if(timer)clearInterval(timer); function tick(){ const left=targetMs-Date.now(); el.countdown.textContent=fmtCountdown(left);} tick(); timer=setInterval(tick,1000); }

async function refreshUI(){ try{ const stored=await getSettings(); el.today.textContent=todayStr(); el.city.value=stored.city; el.country.value=stored.country; el.method.value=String(stored.method); el.school.value=String(stored.school); el.locInfo.textContent=stored.useCoords&&typeof stored.lat==='number'?`Lokasi: ${stored.lat.toFixed(4)}, ${stored.lng.toFixed(4)}`:`Lokasi: ${stored.city}, ${stored.country}`; el.methodInfo.textContent=`Metode ${stored.method}, Madzhab ${stored.school===0?'Shafi':'Hanafi'}`; const data=await fetchTimings(stored); const t=data.timings; const date=data.date; const hijriWeekday = HIJRI_WEEKDAYS_ID[date.hijri.weekday.en] || date.hijri.weekday.en; const hijriMonth = HIJRI_MONTHS_ID[date.hijri.month.en] || date.hijri.month.en; el.hijriDate.textContent=`${hijriWeekday}, ${date.hijri.day} ${hijriMonth} ${date.hijri.year} H`; fillTable(t); const next=computeNext(t); if(next){ el.nextName.textContent=next.name; el.nextTime.textContent=String(next.time).substring(0,5); startCountdown(next.when);} else { el.nextName.textContent='—'; el.nextTime.textContent='—'; el.countdown.textContent='--:--:--'; } } catch(e){ console.error('[SholatReminder] refreshUI error:',e); el.nextName.textContent='Gagal memuat'; el.nextTime.textContent=String(e); el.tFajr.textContent=el.tDhuhr.textContent=el.tAsr.textContent=el.tMaghrib.textContent=el.tIsha.textContent='--:--'; el.hijriDate.textContent='—'; el.methodInfo.textContent='—'; } }

async function save(){ const city=el.city.value.trim()||'Jakarta'; const country=el.country.value.trim()||'Indonesia'; const method=Number(el.method.value); const school=Number(el.school.value); await setSettings({ city,country,method,school,useCoords:false,lat:null,lng:null }); await refreshUI(); chrome.runtime.sendMessage({type:'RESCHEDULE_PRAYERS'},()=>{}); }
async function takeGeo(){ el.btnGeo.disabled=true; try{ const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:15000})); const lat=+pos.coords.latitude,lng=+pos.coords.longitude; const s=await getSettings(); await setSettings({...s,useCoords:true,lat,lng}); await refreshUI(); chrome.runtime.sendMessage({type:'RESCHEDULE_PRAYERS'},()=>{});} catch(e){ alert('Gagal ambil lokasi: '+e.message+'\nPastikan izin lokasi diizinkan untuk Chrome.'); } finally { el.btnGeo.disabled=false; } }

function filterCities(p){ p=p.trim().toLowerCase(); if(!p)return []; return CITY_LIST.filter(c=>c.toLowerCase().startsWith(p)).slice(0,10); }
function renderAc(list){ el.acList.innerHTML=''; if(!list.length){ el.acList.classList.remove('show'); return; } for(const name of list){ const item=document.createElement('div'); item.className='ac-item'; item.textContent=name; item.addEventListener('click',()=>{ el.city.value=name; el.acList.classList.remove('show');}); el.acList.appendChild(item);} el.acList.classList.add('show'); }
el.city.addEventListener('input',()=>renderAc(filterCities(el.city.value))); el.city.addEventListener('focusout',()=>setTimeout(()=>el.acList.classList.remove('show'),120));
el.btnSave.addEventListener('click',save); el.btnGeo.addEventListener('click',takeGeo); document.addEventListener('DOMContentLoaded',refreshUI);
