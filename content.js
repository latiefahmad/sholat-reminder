// content.js — pop-up tengah halaman saat waktu sholat
(function () {
  if (window.__sholatReminderLoaded) return;
  window.__sholatReminderLoaded = true;

  const OVERLAY_ID = 'sholat-reminder-overlay';
  const STYLE_ID = 'sholat-reminder-styles';
  const AUTO_CLOSE_MS = 90 * 1000;

  let autoCloseTimer = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sholat-overlay { position: fixed; inset: 0; background: rgba(20, 25, 15, 0.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 2147483647; padding: 16px; animation: sholat-fade .25s ease-out; }
      @keyframes sholat-fade { from { opacity: 0; } to { opacity: 1; } }
      .sholat-card { max-width: 480px; width: 100%; background: linear-gradient(150deg, #fffdf6, #f6efdc); color: #332711; border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,.45); padding: 22px 22px 18px; font-family: "Trebuchet MS", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; border: 2px solid #1f7a57; animation: sholat-pop .28s ease-out; }
      @keyframes sholat-pop { from { transform: scale(.92) translateY(8px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      .sholat-badge { display: inline-block; font-size: 12px; letter-spacing: .5px; padding: 5px 12px; border-radius: 999px; background: #1f7a57; color: #fff; margin-bottom: 10px; font-weight: 800; text-transform: uppercase; }
      .sholat-title { font-size: 24px; font-weight: 800; margin: 2px 0 4px; line-height: 1.25; }
      .sholat-time { font-size: 13px; color: #7b6846; margin-bottom: 10px; }
      .sholat-quote { font-size: 15px; line-height: 1.6; margin: 0 0 18px; background: #fff; border: 1px dashed #e0d0ac; border-radius: 12px; padding: 12px 14px; }
      .sholat-actions { display: flex; gap: 10px; justify-content: flex-end; }
      .sholat-btn { cursor: pointer; border: 0; border-radius: 10px; padding: 11px 18px; background: #1f7a57; color: white; font-weight: 700; font-size: 14px; }
      .sholat-btn:hover { filter: brightness(0.92); }
      .sholat-btn-secondary { background: transparent; color: #5d4f35; border: 1px solid #d8c8a4; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function nowStr() {
    try {
      return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (_e) {
      return '';
    }
  }

  function closeModal() {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
    document.removeEventListener('keydown', onEsc, true);
  }

  function onEsc(e) {
    if (e.key === 'Escape') closeModal();
  }

  function showModal(prayerName, quote) {
    try {
      ensureStyles();
    } catch (_e) {
      return;
    }

    const mount = document.body || document.documentElement;
    if (!mount) return;

    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    if (autoCloseTimer) clearTimeout(autoCloseTimer);

    const safeName = String(prayerName || 'Waktu Salat');
    const safeQuote = String(quote || 'Saatnya menunaikan sholat.');

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'sholat-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'sholat-card';

    const badge = document.createElement('div');
    badge.className = 'sholat-badge';
    badge.textContent = 'Pengingat Waktu Sholat';

    const title = document.createElement('div');
    title.className = 'sholat-title';
    title.textContent = `Saatnya ${safeName} 🕌`;

    const time = document.createElement('div');
    time.className = 'sholat-time';
    time.textContent = `Pukul ${nowStr()} — tinggalkan sejenak urusan dunia`;

    const quoteEl = document.createElement('p');
    quoteEl.className = 'sholat-quote';
    quoteEl.textContent = safeQuote;

    const actions = document.createElement('div');
    actions.className = 'sholat-actions';

    const snoozeBtn = document.createElement('button');
    snoozeBtn.className = 'sholat-btn sholat-btn-secondary';
    snoozeBtn.type = 'button';
    snoozeBtn.textContent = 'Nanti 5 mnt';

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'sholat-btn';
    dismissBtn.type = 'button';
    dismissBtn.textContent = 'Tutup';

    dismissBtn.addEventListener('click', closeModal);
    snoozeBtn.addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({ type: 'SNOOZE_PRAYER', minutes: 5, prayerName: safeName });
      } catch (_e) {}
      closeModal();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    actions.appendChild(snoozeBtn);
    actions.appendChild(dismissBtn);
    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(time);
    card.appendChild(quoteEl);
    card.appendChild(actions);
    overlay.appendChild(card);
    mount.appendChild(overlay);

    document.addEventListener('keydown', onEsc, true);
    dismissBtn.focus();

    autoCloseTimer = setTimeout(closeModal, AUTO_CLOSE_MS);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'SHOW_PRAYER_MODAL') {
      showModal(msg.prayerName, msg.quote);
    }
  });
})();
