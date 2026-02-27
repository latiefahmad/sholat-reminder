// content.js — show centered modal on prayer time
function ensureStyles() {
  if (document.getElementById('sholat-reminder-styles')) return;
  const style = document.createElement('style');
  style.id = 'sholat-reminder-styles';
  style.textContent = `
    .sholat-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 2147483647; }
    .sholat-card { max-width: 520px; width: calc(100% - 32px); background: #0b1220; color: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35); padding: 20px 22px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    .sholat-badge { display: inline-block; font-size: 12px; letter-spacing: .4px; padding: 4px 10px; border-radius: 999px; background: #0b74da; color: #fff; margin-bottom: 8px; font-weight: 700; }
    .sholat-title { font-size: 20px; font-weight: 700; margin: 4px 0 10px; }
    .sholat-quote { font-size: 15px; opacity: .9; line-height: 1.5; margin: 0 0 16px; }
    .sholat-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .sholat-btn { cursor: pointer; border: 0; border-radius: 10px; padding: 10px 14px; background: #0b74da; color: white; font-weight: 600; }
    .sholat-btn:hover { filter: brightness(0.95); }
  `;
  document.documentElement.appendChild(style);
}
function showModal(prayerName, quote) {
  ensureStyles();
  const existing = document.getElementById('sholat-reminder-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sholat-reminder-overlay';
  overlay.className = 'sholat-overlay';
  const card = document.createElement('div');
  card.className = 'sholat-card';
  card.innerHTML = `
    <div class="sholat-badge">Pengingat Waktu Sholat</div>
    <div class="sholat-title">Saatnya ${prayerName}</div>
    <p class="sholat-quote">${quote}</p>
    <div class="sholat-actions">
      <button class="sholat-btn" id="sholat-dismiss">Dismiss</button>
    </div>`;
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  function close() { overlay.remove(); }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  card.querySelector('#sholat-dismiss').addEventListener('click', close);
}
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'SHOW_PRAYER_MODAL') { showModal(msg.prayerName, msg.quote); }
});
