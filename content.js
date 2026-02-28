// content.js — show centered modal on prayer time
(function () {
  'use strict';

  /* ── Prayer name → Arabic calligraphy symbol ── */
  const PRAYER_ARABIC = {
    'Subuh':   'الفجر',
    'Dzuhur':  'الظهر',
    'Ashar':   'العصر',
    'Maghrib': 'المغرب',
    'Isya':    'العشاء',
    'Waktu Sholat': 'الصلاة'
  };

  /* ── Prayer name → gradient colors ── */
  const PRAYER_COLORS = {
    'Subuh':   { from: '#1a1a2e', to: '#16213e', accent: '#4fc3f7', glow: '#0288d1' },
    'Dzuhur':  { from: '#1a1a0a', to: '#2d2d00', accent: '#ffd54f', glow: '#f9a825' },
    'Ashar':   { from: '#1a0a00', to: '#2d1500', accent: '#ffb74d', glow: '#e65100' },
    'Maghrib': { from: '#1a0010', to: '#2d0020', accent: '#f48fb1', glow: '#c2185b' },
    'Isya':    { from: '#0a001a', to: '#10002d', accent: '#ce93d8', glow: '#7b1fa2' },
    'default': { from: '#0b1220', to: '#0d1b2a', accent: '#4dd0e1', glow: '#00838f' }
  };

  function ensureStyles() {
    if (document.getElementById('sholat-reminder-styles')) return;
    const style = document.createElement('style');
    style.id = 'sholat-reminder-styles';
    style.textContent = `
      @keyframes sholat-fadeIn {
        from { opacity: 0; transform: scale(0.92) translateY(16px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
      }
      @keyframes sholat-shimmer {
        0%   { background-position: -200% center; }
        100% { background-position:  200% center; }
      }
      @keyframes sholat-pulse-ring {
        0%   { transform: scale(1);    opacity: .6; }
        50%  { transform: scale(1.12); opacity: .2; }
        100% { transform: scale(1);    opacity: .6; }
      }
      @keyframes sholat-countdown {
        from { width: 100%; }
        to   { width: 0%; }
      }

      #sholat-reminder-overlay {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0,0,0,.65) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 2147483647 !important;
        margin: 0 !important;
        padding: 16px !important;
        box-sizing: border-box !important;
      }

      .sholat-card {
        max-width: 480px !important;
        width: 100% !important;
        border-radius: 24px !important;
        box-shadow: 0 24px 64px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08) !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important;
        position: relative !important;
        z-index: 2147483647 !important;
        overflow: hidden !important;
        animation: sholat-fadeIn .35s cubic-bezier(.34,1.56,.64,1) both !important;
      }

      .sholat-card-inner {
        padding: 32px 28px 24px !important;
        position: relative !important;
      }

      /* Decorative top bar */
      .sholat-topbar {
        height: 4px !important;
        width: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        background: linear-gradient(90deg, var(--sholat-accent), var(--sholat-glow), var(--sholat-accent)) !important;
        background-size: 200% auto !important;
        animation: sholat-shimmer 2.5s linear infinite !important;
      }

      /* Countdown bar */
      .sholat-countdown-bar {
        height: 3px !important;
        width: 100% !important;
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        background: rgba(255,255,255,.15) !important;
        overflow: hidden !important;
      }
      .sholat-countdown-bar-fill {
        height: 100% !important;
        background: var(--sholat-accent) !important;
        animation: sholat-countdown 60s linear forwards !important;
        transform-origin: left !important;
      }

      /* Header row */
      .sholat-header {
        display: flex !important;
        align-items: flex-start !important;
        gap: 16px !important;
        margin-bottom: 20px !important;
      }

      /* Icon circle */
      .sholat-icon-wrap {
        position: relative !important;
        flex-shrink: 0 !important;
      }
      .sholat-icon-ring {
        position: absolute !important;
        inset: -6px !important;
        border-radius: 50% !important;
        border: 2px solid var(--sholat-accent) !important;
        opacity: .4 !important;
        animation: sholat-pulse-ring 2s ease-in-out infinite !important;
      }
      .sholat-icon {
        width: 56px !important;
        height: 56px !important;
        border-radius: 50% !important;
        background: rgba(255,255,255,.08) !important;
        border: 1.5px solid rgba(255,255,255,.15) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 26px !important;
        line-height: 1 !important;
      }

      /* Title block */
      .sholat-title-block {
        flex: 1 !important;
        min-width: 0 !important;
      }
      .sholat-label {
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: 1.2px !important;
        text-transform: uppercase !important;
        color: var(--sholat-accent) !important;
        margin-bottom: 4px !important;
        opacity: .9 !important;
      }
      .sholat-title {
        font-size: 26px !important;
        font-weight: 800 !important;
        color: #fff !important;
        line-height: 1.15 !important;
        margin: 0 0 2px !important;
      }
      .sholat-arabic {
        font-size: 18px !important;
        color: var(--sholat-accent) !important;
        opacity: .75 !important;
        font-weight: 400 !important;
        direction: rtl !important;
        letter-spacing: .5px !important;
      }

      /* Divider */
      .sholat-divider {
        height: 1px !important;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent) !important;
        margin: 0 0 18px !important;
      }

      /* Quote */
      .sholat-quote-wrap {
        background: rgba(255,255,255,.05) !important;
        border: 1px solid rgba(255,255,255,.08) !important;
        border-radius: 14px !important;
        padding: 14px 16px !important;
        margin-bottom: 22px !important;
        position: relative !important;
      }
      .sholat-quote-mark {
        font-size: 36px !important;
        line-height: 1 !important;
        color: var(--sholat-accent) !important;
        opacity: .35 !important;
        position: absolute !important;
        top: 6px !important;
        left: 12px !important;
        font-family: Georgia, serif !important;
        pointer-events: none !important;
      }
      .sholat-quote {
        font-size: 14px !important;
        line-height: 1.7 !important;
        color: rgba(255,255,255,.85) !important;
        margin: 0 !important;
        padding-left: 8px !important;
        font-style: italic !important;
      }

      /* Actions */
      .sholat-actions {
        display: flex !important;
        gap: 10px !important;
        justify-content: flex-end !important;
        align-items: center !important;
      }
      .sholat-timer-text {
        font-size: 11px !important;
        color: rgba(255,255,255,.4) !important;
        flex: 1 !important;
      }
      .sholat-btn {
        cursor: pointer !important;
        border: 0 !important;
        border-radius: 12px !important;
        padding: 10px 24px !important;
        background: var(--sholat-accent) !important;
        color: #000 !important;
        font-weight: 700 !important;
        font-size: 13px !important;
        letter-spacing: .3px !important;
        transition: filter .15s, transform .1s !important;
        box-shadow: 0 4px 16px rgba(0,0,0,.3) !important;
      }
      .sholat-btn:hover {
        filter: brightness(1.12) !important;
        transform: translateY(-1px) !important;
      }
      .sholat-btn:active {
        transform: translateY(0) !important;
        filter: brightness(.95) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function showModal(prayerName, quote) {
    ensureStyles();

    const existing = document.getElementById('sholat-reminder-overlay');
    if (existing) existing.remove();

    const colors = PRAYER_COLORS[prayerName] || PRAYER_COLORS['default'];
    const arabic = PRAYER_ARABIC[prayerName] || PRAYER_ARABIC['Waktu Sholat'];

    const overlay = document.createElement('div');
    overlay.id = 'sholat-reminder-overlay';

    const card = document.createElement('div');
    card.className = 'sholat-card';
    card.style.cssText = `
      background: linear-gradient(145deg, ${colors.from}, ${colors.to}) !important;
      --sholat-accent: ${colors.accent} !important;
      --sholat-glow: ${colors.glow} !important;
    `;

    card.innerHTML = `
      <div class="sholat-topbar"></div>
      <div class="sholat-card-inner">
        <div class="sholat-header">
          <div class="sholat-icon-wrap">
            <div class="sholat-icon-ring"></div>
            <div class="sholat-icon">🕌</div>
          </div>
          <div class="sholat-title-block">
            <div class="sholat-label">Waktu Sholat Telah Tiba</div>
            <div class="sholat-title">Saatnya ${escapeHtml(prayerName)}</div>
            <div class="sholat-arabic">${escapeHtml(arabic)}</div>
          </div>
        </div>
        <div class="sholat-divider"></div>
        <div class="sholat-quote-wrap">
          <span class="sholat-quote-mark">"</span>
          <p class="sholat-quote">${escapeHtml(quote)}</p>
        </div>
        <div class="sholat-actions">
          <span class="sholat-timer-text">Menutup otomatis dalam 60 detik</span>
          <button class="sholat-btn" id="sholat-dismiss">Tutup ✕</button>
        </div>
      </div>
      <div class="sholat-countdown-bar">
        <div class="sholat-countdown-bar-fill"></div>
      </div>
    `;

    overlay.appendChild(card);

    const target = document.body || document.documentElement;
    target.appendChild(overlay);

    let autoTimer = null;

    function close() {
      if (autoTimer) clearTimeout(autoTimer);
      overlay.remove();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    const dismissBtn = card.querySelector('#sholat-dismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', close);

    // Auto-dismiss after 60 seconds
    autoTimer = setTimeout(close, 60000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (msg && msg.type === 'SHOW_PRAYER_MODAL') {
      try {
        showModal(msg.prayerName || 'Waktu Sholat', msg.quote || '');
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }
    return false;
  });
})();
