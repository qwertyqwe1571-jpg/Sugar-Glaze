
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .icon {
      display: inline-block;
      width: 1em;
      height: 1em;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .toast-icon .icon { width: 18px; height: 18px; }
    .modal-icon .icon { width: 40px; height: 40px; }
    .toast-close .icon { width: 14px; height: 14px; opacity: 0.6; }

    #toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 280px;
      max-width: 380px;
      padding: 14px 16px;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.13);
      font-family: 'Inter', sans-serif;
      font-size: 0.92rem;
      line-height: 1.45;
      pointer-events: all;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      cursor: pointer;
    }
    .toast.show {
      opacity: 1;
      transform: translateX(0);
    }
    .toast.hide {
      opacity: 0;
      transform: translateX(20px);
    }

    .toast-error   { background: #fff0f0; border-left: 4px solid #e74c3c; color: #7b2020; }
    .toast-success { background: #f0fff5; border-left: 4px solid #27ae60; color: #1a5e35; }
    .toast-info    { background: #fdf8f0; border-left: 4px solid #c9a84c; color: #6b4c1a; }
    .toast-warn    { background: #fffbf0; border-left: 4px solid #f39c12; color: #7a5000; }

    .toast-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 1px; }
    .toast-body { flex: 1; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      font-size: 1rem; opacity: 0.4; padding: 0;
      flex-shrink: 0; color: inherit; line-height: 1;
    }
    .toast-close:hover { opacity: 0.8; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .modal-overlay.show { opacity: 1; }

    .modal-box {
      background: #fff;
      border-radius: 14px;
      padding: 32px 28px 24px;
      max-width: 380px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      text-align: center;
      transform: scale(0.93);
      transition: transform 0.2s ease;
      font-family: 'Inter', sans-serif;
    }
    .modal-overlay.show .modal-box { transform: scale(1); }

    .modal-icon  { font-size: 2.4rem; margin-bottom: 12px; }
    .modal-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.2rem;
      color: #3d2b1f;
      margin-bottom: 8px;
    }
    .modal-text  { color: #8a7060; font-size: 0.92rem; line-height: 1.5; margin-bottom: 24px; }

    .modal-actions { display: flex; gap: 10px; }

    .modal-btn {
      flex: 1;
      padding: 11px;
      border: none;
      border-radius: 8px;
      font-size: 0.92rem;
      font-weight: 500;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: opacity 0.2s;
    }
    .modal-btn:hover { opacity: 0.85; }
    .modal-btn-cancel  { background: #f3ede6; color: #3d2b1f; }
    .modal-btn-confirm { background: #e74c3c; color: white; }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
})();

function toast(message, type = 'info', duration = 4000) {
  const safeMessage = window.sgSecurity?.escapeHtml?.(message) || String(message ?? '');
  const svgIcons = {
    error:   icon('xCircle'),
    success: icon('checkCircle'),
    info:    icon('infoCircle'),
    warn:    icon('alertTriangle'),
  };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${svgIcons[type] ?? icon('infoCircle')}</span>
    <span class="toast-body">${safeMessage}</span>
    <button class="toast-close" aria-label="Закрити">${icon('close')}</button>
  `;

  const container = document.getElementById('toast-container');
  container.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });

  function dismiss() {
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => el.remove(), 350);
  }

  el.querySelector('.toast-close').addEventListener('click', dismiss);
  el.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

function showConfirm({
  title       = 'Ви впевнені?',
  text        = 'Цю дію не можна скасувати.',
  iconName    = 'trash',
  confirmText = 'Видалити',
  cancelText  = 'Скасувати',
} = {}) {
  return new Promise((resolve) => {
    const escape = window.sgSecurity?.escapeHtml || ((value) => String(value ?? ''));
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-icon">${icon(iconName)}</div>
        <div class="modal-title">${escape(title)}</div>
        <div class="modal-text">${escape(text)}</div>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel">${escape(cancelText)}</button>
          <button class="modal-btn modal-btn-confirm">${escape(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('show'));
    });

    function close(result) {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 220);
      resolve(result);
    }

    overlay.querySelector('.modal-btn-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('.modal-btn-confirm').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
}
