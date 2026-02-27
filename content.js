// content.js — show centered modal on prayer time
(function () {
  'use strict';

  function ensureStyles() {
    if (document.getElementById('sholat-reminder-styles')) return;
    const style = document.createElement('style');
    style.id = 'sholat-reminder-styles';
    style.textContent = `
      #sholat-reminder-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0,0,0,.5) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 2147483647 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      .sholat-card {
        max-width: 520px !important;
        width: calc(100% - 48px) !important;
        background: #0b1220 !important;
        color: #fff !important;
        border-radius: 16px !important;
        box-shadow: 0 10px 40px rgba(0,0,0,.6) !important;
        padding: 28px 28px !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important;
        position: relative !important;
        z-index: 2147483647 !important;
      }
      .sholat-badge {
        display: inline-block !important;
        font-size: 12px !important;
        letter-spacing: .4px !important;
        padding: 4px 12px !important;
        border-radius: 999px !important;
        background: #0b74da !important;
        color: #fff !important;
        margin-bottom: 10px !important;
        font-weight: 700 !important;
      }
      .sholat-title {
        font-size: 22px !important;
        font-weight: 700 !important;
        margin: 6px 0 12px !important;
        color: #fff !important;
      }
      .sholat-quote {
        font-size: 15px !important;
        opacity: .9 !important;
        line-height: 1.6 !important;
        margin: 0 0 20px !important;
        color: #fff !important;
      }
      .sholat-actions {
        display: flex !important;
        gap: 10px !important;
        justify-content: flex-end !important;
      }
      .sholat-btn {
        cursor: pointer !important;
        border: 0 !important;
        border-radius: 10px !important;
        padding: 10px 20px !important;
        background: #0b74da !important;
        color: white !important;
        font-weight: 600 !important;
        font-size: 14px !important;
      }
      .sholat-btn:hover {
        background: #0960b8 !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function showModal(prayerName, quote) {
    ensureStyles();

    // Hapus overlay lama jika ada
    const existing = document.getElementById('sholat-reminder-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'sholat-reminder-overlay';

    const card = document.createElement('div');
    card.className = 'sholat-card';
    card.innerHTML = `
      <div class="sholat-badge">🕌 Pengingat Waktu Sholat</div>
      <div class="sholat-title">Saatnya ${escapeHtml(prayerName)}</div>
      <p class="sholat-quote">${escapeHtml(quote)}</p>
      <div class="sholat-actions">
        <button class="sholat-btn" id="sholat-dismiss">Tutup</button>
      </div>`;

    overlay.appendChild(card);

    // Pastikan body tersedia
    const target = document.body || document.documentElement;
    target.appendChild(overlay);

    function close() {
      overlay.remove();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    const dismissBtn = card.querySelector('#sholat-dismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', close);

    // Auto-dismiss setelah 60 detik
    setTimeout(close, 60000);
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
