// =============================================
// Sugar & Glaze — SVG Icon Library
// Всі іконки — Lucide-стиль, stroke-based,
// 24×24 viewBox, без fill, currentColor
// =============================================

const ICONS = {

  // Торт — логотип (кольоровий, деталізований)
  cake: `<svg viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lc-t1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#A87040"/>
        <stop offset="40%" stop-color="#EDD5B0"/>
        <stop offset="100%" stop-color="#A87040"/>
      </linearGradient>
      <linearGradient id="lc-t2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#9A3858"/>
        <stop offset="40%" stop-color="#F0A0B8"/>
        <stop offset="100%" stop-color="#9A3858"/>
      </linearGradient>
      <linearGradient id="lc-t3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#B09070"/>
        <stop offset="40%" stop-color="#FFF8F0"/>
        <stop offset="100%" stop-color="#B09070"/>
      </linearGradient>
    </defs>
    <!-- Свічка -->
    <rect x="14" y="1" width="4" height="8" rx="2" fill="#FFF8F0"/>
    <line x1="15" y1="4" x2="18" y2="4" stroke="#E8D5B0" stroke-width="0.7" opacity="0.5"/>
    <!-- Вогник -->
    <path d="M 16 1 Q 13.5 -1.5 14 -3.5 Q 15 -5.5 16 -4 Q 17 -5.5 18 -3.5 Q 18.5 -1.5 16 1 Z" fill="#FFB020" transform="translate(0,1)"/>
    <path d="M 16 0.5 Q 14.5 -1 15 -3 Q 16 -5 16 -3 Q 17 -5 17 -1 Z" fill="#FFD060" transform="translate(0,1)"/>
    <!-- Ярус 3 (верхній, слонова кістка) -->
    <rect x="9" y="9" width="14" height="7" rx="2" fill="url(#lc-t3)"/>
    <ellipse cx="16" cy="9" rx="7" ry="2" fill="#FFF8F2"/>
    <!-- Ярус 2 (середній, рожевий) -->
    <rect x="5" y="16" width="22" height="7" rx="2" fill="url(#lc-t2)"/>
    <ellipse cx="16" cy="16" rx="11" ry="2.5" fill="#F5B8C8"/>
    <!-- Хвиля крему між ярусами 2-3 -->
    <path d="M 5 18 Q 7 15.5 9 18 Q 11 15.5 13 18 Q 15 15.5 17 18 Q 19 15.5 21 18 Q 23 15.5 27 18"
          stroke="#FFF5F8" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- Ярус 1 (нижній, золотий) -->
    <rect x="1" y="23" width="30" height="9" rx="2" fill="url(#lc-t1)"/>
    <ellipse cx="16" cy="23" rx="15" ry="3.5" fill="#E8C060"/>
    <!-- Золоті патьоки -->
    <path d="M 8 24 Q 7.5 28 7.5 30" stroke="#9A6010" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M 16 24 Q 15.5 29 15.5 32" stroke="#9A6010" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M 24 24 Q 23.5 28 23.5 30" stroke="#9A6010" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85"/>
    <!-- Хвиля крему знизу ярусу 1 -->
    <path d="M 1 27 Q 3.5 24.5 6 27 Q 8.5 24.5 11 27 Q 13.5 24.5 16 27 Q 18.5 24.5 21 27 Q 23.5 24.5 26 27 Q 28.5 24.5 31 27"
          stroke="#FFF5EB" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- Тарілка -->
    <ellipse cx="16" cy="32" rx="15" ry="2.5" fill="#DCC8A0"/>
    <ellipse cx="16" cy="32" rx="15" ry="2.5" fill="none" stroke="#C4B080" stroke-width="0.5"/>
  </svg>`,

  // Кошик
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8"  cy="21" r="1"/>
    <circle cx="19" cy="21" r="1"/>
    <path d="M2 2h2.5l2.25 11.4a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-1.56L21.5 7H5.5"/>
  </svg>`,

  // Конверт — Email
  email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m2 7 10 7 10-7"/>
  </svg>`,

  // Паперовий літак — Telegram
  telegram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.5 2 2 9.5l7 2.5"/>
    <path d="m9 12 3 9 3-5.5 6-3.5"/>
    <path d="M9 12 21.5 2"/>
  </svg>`,

  // Кошик для сміття — Видалити
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>`,

  // Камера — Завантажити фото
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>`,

  // Шестерня — Налаштування / Адмін
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`,

  // Галочка в колі — Успіх
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>`,

  // X в колі — Помилка
  xCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9"  x2="9"  y2="15"/>
    <line x1="9"  y1="9"  x2="15" y2="15"/>
  </svg>`,

  // i в колі — Інформація
  infoCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8"  x2="12.01" y2="8"/>
  </svg>`,

  // Трикутник — Попередження
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9"  x2="12"    y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  // Стрілка ліворуч
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5"  y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>`,

  // Стрілка праворуч
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>`,

  // Закрити (×) — для тосту
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6"  x2="6"  y2="18"/>
    <line x1="6"  y1="6"  x2="18" y2="18"/>
  </svg>`,

  // Мерехтіння — Завантаження
  sparkle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
    <path d="M5.64 5.64 7.76 7.76M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12"/>
  </svg>`,

  // Глазур / хвиля — декоративна
  glaze: `<svg viewBox="0 0 48 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <path d="M0 8 C6 2, 12 14, 18 8 S30 2, 36 8 S42 14, 48 8"/>
  </svg>`,
};

// =============================================
// icon(name, extraClass?) → HTML-рядок <svg>
// Використання: element.innerHTML = icon('cart')
// =============================================
function icon(name, extraClass = '') {
  const svg = ICONS[name];
  if (!svg) {
    console.warn(`[icons] Невідома іконка: "${name}"`);
    return '';
  }
  // Додаємо клас .icon і опціональний extra-клас до кореневого <svg>
  return svg.replace('<svg ', `<svg class="icon${extraClass ? ' ' + extraClass : ''}" `);
}
