
let cart = [];
let currentUser = null;
let pendingOrderVerification = null;
let productsCache = [];

const { normalizeSafeImageUrl } = window.sgSecurity || {};
const PRODUCT_PAGE_SIZE = 6;
const SUPABASE_WAKE_MODAL_DELAY_MS = 700;
const SUPABASE_WAKE_STATUS_REFRESH_MS = 12000;
const catalogFilters = {
  search: '',
  sort: 'newest',
  page: 1,
};

const catalogSearchEl = document.getElementById('catalogSearch');
const catalogSortEl = document.getElementById('catalogSort');
const supabaseWakeModalEl = document.getElementById('supabaseWakeModal');
const supabaseWakeTextEl = document.getElementById('supabaseWakeText');
const supabaseWakeStatusEl = document.getElementById('supabaseWakeStatus');
const supabaseWakeServicesEl = document.getElementById('supabaseWakeServices');
const supabaseWakeProgressEl = document.getElementById('supabaseWakeProgress');
let supabaseWakeModalDelayTimer = null;

function initStaticGraphics() {
  const logoWrap = document.getElementById('logoIconWrap');
  if (logoWrap) logoWrap.innerHTML = icon('cake', 'logo-icon');

  const heroEl = document.getElementById('heroIllustration');
  if (heroEl) heroEl.innerHTML = illustration('cakeHero');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setCatalogLoading(message) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = `<p class="loading-text">${escapeHtml(message)}</p>`;
}

function showSupabaseWakeModal() {
  if (!supabaseWakeModalEl) return;

  clearSupabaseWakeModalDelay();
  supabaseWakeModalEl.hidden = false;
  document.body.classList.add('supabase-wake-active');
  requestAnimationFrame(() => {
    supabaseWakeModalEl.classList.add('supabase-wake-modal--visible');
  });
}

function scheduleSupabaseWakeModal(options = {}) {
  if (!supabaseWakeModalEl || supabaseWakeModalDelayTimer) return;
  if (supabaseWakeModalEl.classList.contains('supabase-wake-modal--visible')) return;

  supabaseWakeModalDelayTimer = setTimeout(() => {
    supabaseWakeModalDelayTimer = null;
    updateSupabaseWakeModal(options);
  }, SUPABASE_WAKE_MODAL_DELAY_MS);
}

function clearSupabaseWakeModalDelay() {
  if (!supabaseWakeModalDelayTimer) return;

  clearTimeout(supabaseWakeModalDelayTimer);
  supabaseWakeModalDelayTimer = null;
}

function updateSupabaseWakeModal({
  text = 'Supabase може прокидатися після паузи на безкоштовному тарифі. Каталог відкриється автоматично, щойно база відповість.',
  status = 'Оновлюємо стани сервісів Supabase',
  state = 'loading',
  services = [],
} = {}) {
  if (!supabaseWakeModalEl) return;

  showSupabaseWakeModal();

  if (supabaseWakeTextEl) {
    supabaseWakeTextEl.textContent = text;
  }

  if (supabaseWakeStatusEl) {
    supabaseWakeStatusEl.textContent = status;
    supabaseWakeStatusEl.dataset.state = state;
  }

  if (supabaseWakeProgressEl) {
    supabaseWakeProgressEl.removeAttribute('style');
  }

  renderSupabaseServiceStatus(services);
}

function renderSupabaseServiceStatus(services = []) {
  if (!supabaseWakeServicesEl) return;

  if (!Array.isArray(services) || services.length === 0) {
    supabaseWakeServicesEl.innerHTML = '';
    return;
  }

  const stateLabels = {
    healthy: 'Healthy',
    starting: 'Coming up...',
    unhealthy: 'Unavailable',
    unknown: 'Checking...',
  };

  supabaseWakeServicesEl.innerHTML = services.map(service => {
    const state = ['healthy', 'starting', 'unhealthy', 'unknown'].includes(service.state)
      ? service.state
      : 'unknown';
    const label = escapeHtml(service.label || service.key || 'Supabase service');
    const stateLabel = escapeHtml(stateLabels[state] || stateLabels.unknown);

    return `
      <div class="supabase-wake-service" data-state="${escapeAttribute(state)}">
        <span class="supabase-wake-service__dot" aria-hidden="true"></span>
        <span class="supabase-wake-service__name">${label}</span>
        <span class="supabase-wake-service__state">${stateLabel}</span>
      </div>
    `;
  }).join('');
}

function hideSupabaseWakeModal() {
  if (!supabaseWakeModalEl) return;

  clearSupabaseWakeModalDelay();

  if (!supabaseWakeModalEl.classList.contains('supabase-wake-modal--visible')) {
    supabaseWakeModalEl.hidden = true;
    document.body.classList.remove('supabase-wake-active');
    return;
  }

  supabaseWakeModalEl.classList.remove('supabase-wake-modal--visible');
  document.body.classList.remove('supabase-wake-active');
  setTimeout(() => {
    if (!supabaseWakeModalEl.classList.contains('supabase-wake-modal--visible')) {
      supabaseWakeModalEl.hidden = true;
    }
  }, 280);
}

async function warmSupabase({ showStatus = false } = {}) {
  let statusModalScheduled = false;

  while (true) {
    if (showStatus) {
      setCatalogLoading('Підключаємо базу даних. Каталог оновиться автоматично, щойно Supabase відповість.');
      const modalState = {
        status: 'Перевіряємо стани сервісів Supabase',
      };

      if (!statusModalScheduled) {
        scheduleSupabaseWakeModal(modalState);
        statusModalScheduled = true;
      }
    }

    try {
      const response = await fetch('/api/health/supabase', {
        cache: 'no-store',
      });
      const status = await response.json().catch(() => ({}));

      if (response.ok && status.ok) {
        if (showStatus) {
          hideSupabaseWakeModal();
        }

        return true;
      }

      if (status?.waking && showStatus) {
        const manualRestoreRequired = Boolean(status.manual_restore_required);

        setCatalogLoading(manualRestoreRequired
          ? 'Supabase проєкт призупинений. Сторінка перевіряє стан автоматично; відновіть проєкт у Dashboard або налаштуйте restore token.'
          : 'Supabase запускає сервіси. Каталог оновиться автоматично, щойно база відповість.');
        updateSupabaseWakeModal({
          text: manualRestoreRequired
            ? 'Supabase проєкт зараз призупинений. Відновіть його у Dashboard або додайте Management API token, щоб сервер міг робити restore автоматично.'
            : 'Supabase запускає сервіси після паузи. Список нижче оновлюється автоматично.',
          status: buildSupabaseWakeStatus(status.services),
          state: manualRestoreRequired ? 'warning' : 'loading',
          services: status.services,
        });
      }

      if (status?.manual_restore_required && !status?.waking) {
        if (showStatus) {
          setCatalogLoading('Supabase проєкт призупинений. Відновіть його у Supabase Dashboard або налаштуйте автоматичний restore token.');
          updateSupabaseWakeModal({
            text: 'Supabase проєкт зараз призупинений. Відновіть його у Dashboard або додайте Management API token, щоб сервер міг робити restore автоматично.',
            status: 'Потрібне відновлення Supabase проєкту',
            state: 'warning',
            services: status.services,
          });
        }

        if (!showStatus) {
          return false;
        }
      }
    } catch {
      if (!showStatus) {
        return false;
      }

      updateSupabaseWakeModal({
        text: 'Не вдалося отримати поточні стани сервісів. Сторінка повторить перевірку автоматично.',
        status: 'Очікуємо відповідь Supabase',
        state: 'warning',
      });
    }

    if (!showStatus) {
      return false;
    }

    await wait(SUPABASE_WAKE_STATUS_REFRESH_MS);
  }
}

function buildSupabaseWakeStatus(services = []) {
  if (!Array.isArray(services) || services.length === 0) {
    return 'Оновлюємо стани сервісів Supabase';
  }

  const starting = services.filter(service => service.state === 'starting');
  const unhealthy = services.filter(service => service.state === 'unhealthy');

  if (starting.length > 0) {
    return `Запускається: ${starting.map(service => service.label).join(', ')}`;
  }

  if (unhealthy.length > 0) {
    return `Очікуємо доступність: ${unhealthy.map(service => service.label).join(', ')}`;
  }

  return 'Сервіси відповідають, завантажуємо каталог';
}

async function fetchProducts() {
  const response = await fetch('/api/products', {
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);

  if (response.status === 202 && payload?.waking) {
    const error = new Error(payload.error || 'Supabase is waking up.');
    error.status = response.status;
    error.waking = true;
    error.manualRestoreRequired = Boolean(payload.manual_restore_required);
    throw error;
  }

  if (!response.ok) {
    const error = new Error(payload?.error || 'Помилка сервера');
    error.status = response.status;
    throw error;
  }

  if (!Array.isArray(payload)) {
    const error = new Error('Сервер повернув неочікувану відповідь.');
    error.status = response.status;
    throw error;
  }

  return payload;
}

function shouldWakeAfterProductsError(error) {
  return error.waking || !error.status || [500, 502, 503, 504].includes(error.status);
}

async function loadProducts({ allowWakeRetry = true } = {}) {
  const grid = document.getElementById('productGrid');

  try {
    const products = await fetchProducts();
    hideSupabaseWakeModal();

    if (products.length === 0) {
      productsCache = [];
      grid.innerHTML = '<p class="loading-text">Товарів поки немає</p>';
      updateCatalogPagination(0, 0, 0, 0);
      document.getElementById('catalogCount').value = '0 товарів';
      return;
    }

    productsCache = Array.isArray(products) ? products : [];
    renderCatalogProducts();
  } catch (error) {
    if (!error.manualRestoreRequired && allowWakeRetry && shouldWakeAfterProductsError(error)) {
      const isReady = await warmSupabase({ showStatus: true });
      if (isReady) {
        return loadProducts({ allowWakeRetry: false });
      }
    }

    productsCache = [];
    grid.innerHTML = `<p class="loading-text">${
      error.manualRestoreRequired
        ? 'Supabase призупинений. Відновіть проєкт у Supabase Dashboard або налаштуйте автоматичний restore token.'
        : 'Не вдалося завантажити товари.'
    }</p>`;
    updateCatalogPagination(0, 0, 0, 0);
    document.getElementById('catalogCount').value = '0 товарів';
  }
}

function applyCatalogFilters(resetPage = false) {
  catalogFilters.search = catalogSearchEl.value.trim().toLowerCase();
  catalogFilters.sort = catalogSortEl.value;
  catalogFilters.page = resetPage ? 1 : catalogFilters.page;
  renderCatalogProducts();
}

function getFilteredProducts() {
  const search = catalogFilters.search;

  const filtered = productsCache.filter((product) => {
    const haystack = `${product.name} ${product.description || ''} ${product.price || ''}`.toLowerCase();
    return haystack.includes(search);
  });

  return sortCatalogProducts(filtered, catalogFilters.sort);
}

function sortCatalogProducts(items, sort) {
  const sorted = [...items];

  switch (sort) {
    case 'name_asc':
      return sorted.sort((a, b) => String(a.name).localeCompare(String(b.name), 'uk'));
    case 'name_desc':
      return sorted.sort((a, b) => String(b.name).localeCompare(String(a.name), 'uk'));
    case 'price_asc':
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case 'price_desc':
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case 'newest':
    default:
      return sorted.sort((a, b) => Number(b.id) - Number(a.id));
  }
}

function renderCatalogProducts() {
  const grid = document.getElementById('productGrid');
  const filteredItems = getFilteredProducts();
  const totalItems = filteredItems.length;
  const totalPages = getTotalPages(totalItems, PRODUCT_PAGE_SIZE);

  catalogFilters.page = clamp(catalogFilters.page, 1, totalPages);

  const startIndex = (catalogFilters.page - 1) * PRODUCT_PAGE_SIZE;
  const pageItems = filteredItems.slice(startIndex, startIndex + PRODUCT_PAGE_SIZE);

  document.getElementById('catalogCount').value = `${totalItems} товарів`;
  updateCatalogPagination(totalItems, totalPages, pageItems.length, startIndex);

  if (pageItems.length === 0) {
    grid.innerHTML = '<p class="loading-text">Нічого не знайдено.</p>';
    return;
  }

  grid.innerHTML = pageItems.map(product => {
    const safeImageUrl = normalizeSafeImageUrl?.(product.image_url) || '';
    const safeName = escapeHtml(product.name);
    const safeDescription = escapeHtml(product.description || '');
    const safePrice = escapeHtml(product.price);

    return `
      <div class="card">
        ${safeImageUrl
          ? `<img class="card-img" src="${escapeAttribute(safeImageUrl)}" alt="${safeName}"/>
             <div class="card-placeholder" style="display:none">${illustration('cupcake')}</div>`
          : `<div class="card-placeholder">${illustration('cupcake')}</div>`
        }
        <div class="card-body">
          <h3 class="card-name">${safeName}</h3>
          <p class="card-desc">${safeDescription}</p>
          <div class="card-footer">
            <span class="card-price">${safePrice} грн</span>
            <button
              class="card-btn"
              type="button"
              data-add-to-cart="${escapeAttribute(product.id)}">
              + До кошика
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.card-img').forEach((image) => {
    image.addEventListener('error', () => {
      image.style.display = 'none';
      image.nextElementSibling?.style?.setProperty('display', 'flex');
    });
  });
}

function updateCatalogPagination(totalItems, totalPages, visibleItems, startIndex) {
  const pageInfo = document.getElementById('catalogPageInfo');
  const prevBtn = document.getElementById('catalogPrevBtn');
  const nextBtn = document.getElementById('catalogNextBtn');

  if (totalItems === 0) {
    pageInfo.textContent = 'Сторінка 0 з 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const from = startIndex + 1;
  const to = startIndex + visibleItems;
  pageInfo.textContent = `${from}-${to} з ${totalItems} · сторінка ${catalogFilters.page} з ${totalPages}`;
  prevBtn.disabled = catalogFilters.page <= 1;
  nextBtn.disabled = catalogFilters.page >= totalPages;
}

function changeCatalogPage(delta) {
  const totalPages = getTotalPages(getFilteredProducts().length, PRODUCT_PAGE_SIZE);
  const nextPage = clamp(catalogFilters.page + delta, 1, totalPages);

  if (nextPage === catalogFilters.page) return;

  catalogFilters.page = nextPage;
  renderCatalogProducts();
}

function addToCart(id, name, price, imageUrl = '') {
  invalidatePendingOrderVerification('Склад замовлення змінено. Надішліть новий код.');
  const existing = cart.find(item => item.id === id);
  const safeImageUrl = normalizeSafeImageUrl?.(imageUrl) || '';

  if (existing) {
    existing.qty++;
    if (!existing.imageUrl && safeImageUrl) {
      existing.imageUrl = safeImageUrl;
    }
  } else {
    cart.push({ id, name, price, imageUrl: safeImageUrl, qty: 1 });
  }

  updateCartUI();
  openCart();
}

function addProductToCart(productId) {
  const product = productsCache.find(item => Number(item.id) === Number(productId));
  if (!product) return;

  addToCart(
    Number(product.id),
    String(product.name || ''),
    Number(product.price),
    String(product.image_url || '')
  );
}

function removeFromCart(id) {
  const existing = cart.find(item => item.id === id);
  if (!existing) return;

  invalidatePendingOrderVerification('Склад замовлення змінено. Надішліть новий код.');
  existing.qty > 1
    ? existing.qty--
    : (cart = cart.filter(item => item.id !== id));

  updateCartUI();
}

function getTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').textContent = totalQty;

  const cartItemsEl = document.getElementById('cartItems');
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="cart-empty">${icon('cart', 'cart-empty-icon')}Кошик порожній</p>`;
  } else {
    cartItemsEl.innerHTML = cart.map(item => {
      const safeImageUrl = normalizeSafeImageUrl?.(item.imageUrl) || '';
      const safeName = escapeHtml(item.name);

      return `
      <div class="cart-item">
        <div class="cart-item-media">
          ${safeImageUrl
            ? `<img class="cart-item-img" src="${escapeAttribute(safeImageUrl)}" alt="${safeName}"/>
               <div class="cart-item-placeholder" style="display:none">${illustration('cupcake')}</div>`
            : `<div class="cart-item-placeholder">${illustration('cupcake')}</div>`
          }
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${safeName}</div>
          <div class="cart-item-price">${escapeHtml(item.price)} грн × ${escapeHtml(item.qty)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" type="button" data-cart-dec="${escapeAttribute(item.id)}">−</button>
          <span>${escapeHtml(item.qty)}</span>
          <button class="qty-btn" type="button" data-cart-inc="${escapeAttribute(item.id)}">+</button>
        </div>
      </div>
    `;
    }).join('');

    cartItemsEl.querySelectorAll('.cart-item-img').forEach((image) => {
      image.addEventListener('error', () => {
        image.style.display = 'none';
        image.nextElementSibling?.style?.setProperty('display', 'grid');
      });
    });
  }

  document.getElementById('cartTotal').textContent = getTotal();
}

async function loadCurrentUser() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) throw new Error('Не вдалося отримати сесію');

    const data = await response.json();
    currentUser = data.user || null;
  } catch {
    currentUser = null;
  }

  renderAccountArea();
  renderCustomerAuthHint();
  prefillOrderForm();
}

function renderAccountArea() {
  const accountArea = document.getElementById('accountArea');
  if (!accountArea) return;

  if (!currentUser) {
    accountArea.innerHTML = `
      <a href="/auth.html?next=/" class="account-guest-link">
        Увійти
      </a>
    `;
    return;
  }

  const adminLink = currentUser.role === 'admin'
    ? `<a class="account-link" href="/admin.html">Адмін</a>`
    : '';

  accountArea.innerHTML = `
    <div class="account-chip">
      <span class="account-greeting">Привіт, ${escapeHtml(currentUser.name)}</span>
      <div class="account-links">
        <a class="account-link" href="/account.html">Кабінет</a>
        ${adminLink}
        <button class="account-logout" id="logoutBtn" type="button">Вийти</button>
      </div>
    </div>
  `;
}

function renderCustomerAuthHint() {
  const hint = document.getElementById('customerAuthHint');
  if (!hint) return;

  if (!currentUser) {
    hint.innerHTML = `<a href="/auth.html?next=/">Увійти або зареєструватися</a>`;
    return;
  }

  hint.innerHTML = `<strong>${escapeHtml(currentUser.name)}</strong>`;
}

function prefillOrderForm() {
  if (!currentUser) return;

  setInputValueIfEmpty('custName', currentUser.name);
  setInputValueIfEmpty('custPhone', currentUser.phone);
  setInputValueIfEmpty('custAddress', currentUser.address);
  setInputValueIfEmpty('custEmail', currentUser.email);
}

function setInputValueIfEmpty(id, value) {
  const input = document.getElementById(id);
  if (!input || !value) return;

  if (!input.value.trim()) {
    input.value = value;
  }
}

function resetOrderFormForLogout() {
  ['custName', 'custPhone', 'custAddress', 'custEmail', 'orderCode'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });

  clearPendingOrderVerification();
  setOrderStatusNote('');
}

async function logoutUser() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Не вдалося завершити сесію');

    currentUser = null;
    renderAccountArea();
    renderCustomerAuthHint();
    resetOrderFormForLogout();
    toast('Ви вийшли з акаунта.', 'info');
  } catch (error) {
    toast(error.message, 'error');
  }
}

function openCart() {
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

async function requestOrderVerification({ resend = false } = {}) {
  const triggerButton = resend
    ? document.getElementById('resendCodeBtn')
    : document.getElementById('orderVerificationBtn');

  let payload;

  try {
    payload = buildOrderPayload();
  } catch (error) {
    toast(error.message, 'warn');
    return;
  }

  setButtonLoading(triggerButton, resend ? 'Надсилання...' : 'Надсилаємо код...');

  try {
    const response = await fetch('/api/orders/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Не вдалося надіслати код підтвердження.');
    }

    pendingOrderVerification = {
      verificationId: data.verification_id,
      orderId: data.order?.order_id || payload.order_id,
      fingerprint: buildOrderFingerprint(payload),
      customerEmail: data.customer_email || payload.customer_email,
    };

    toggleVerificationStep(true);
    document.getElementById('orderCode').value = '';
    setOrderStatusNote(
      `Код відправлено на ${pendingOrderVerification.customerEmail}. Він дійсний 3 хвилини.`,
      'success'
    );
    document.getElementById('orderCode').focus();
  } catch (error) {
    if (error.message.includes('увійти')) {
      currentUser = null;
      renderAccountArea();
      renderCustomerAuthHint();
    }

    toast('Помилка: ' + error.message, 'error');
  } finally {
    restoreButtonLabel(triggerButton);
  }
}

document.getElementById('orderForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!pendingOrderVerification?.verificationId) {
    toast('Спершу отримайте код підтвердження на email.', 'warn');
    return;
  }

  const submitBtn = document.getElementById('orderSubmitBtn');
  const verificationCode = document.getElementById('orderCode').value.trim();

  if (!verificationCode) {
    toast('Введіть код з email.', 'warn');
    return;
  }

  let payload;

  try {
    payload = buildOrderPayload(pendingOrderVerification.orderId);
  } catch (error) {
    toast(error.message, 'warn');
    return;
  }

  if (buildOrderFingerprint(payload) !== pendingOrderVerification.fingerprint) {
    invalidatePendingOrderVerification('Дані замовлення змінено. Надішліть новий код.', 'warn');
    toast('Дані замовлення змінено. Надішліть новий код.', 'warn');
    return;
  }

  setButtonLoading(submitBtn, 'Підтвердження...');

  try {
    const orderResponse = await fetch('/api/orders/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_id: pendingOrderVerification.verificationId,
        verification_code: verificationCode,
      }),
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      if (orderResponse.status === 410 || orderResponse.status === 429 || orderResponse.status === 409) {
        invalidatePendingOrderVerification(orderData.error || 'Надішліть новий код.', 'warn');
      }

      throw new Error(orderData.error || 'Не вдалося зберегти замовлення');
    }

    const params = new URLSearchParams({
      orderId: pendingOrderVerification.orderId,
      account: '1',
    });

    if (orderData.notification?.storeEmailSent) {
      params.set('storeMail', 'sent');
    }

    if (orderData.notification?.customerEmailSent) {
      params.set('customerMail', 'sent');
    }

    clearPendingOrderVerification();
    setOrderStatusNote('');
    cart = [];
    updateCartUI();
    closeCart();

    window.location.href = `/success.html?${params.toString()}`;
  } catch (error) {
    if (error.message.includes('увійти')) {
      currentUser = null;
      renderAccountArea();
      renderCustomerAuthHint();
    }

    toast('Помилка: ' + error.message, 'error');
  } finally {
    restoreButtonLabel(submitBtn);
  }
});

function buildOrderPayload(forcedOrderId) {
  if (!currentUser) {
    throw new Error('Спершу увійдіть у свій акаунт.');
  }

  if (cart.length === 0) {
    throw new Error('Кошик порожній.');
  }

  const customerName = document.getElementById('custName').value.trim();
  const customerPhone = document.getElementById('custPhone').value.trim();
  const customerAddress = document.getElementById('custAddress').value.trim();
  const customerEmail = document.getElementById('custEmail').value.trim() || currentUser.email || '';

  if (!customerName || !customerPhone || !customerAddress || !customerEmail) {
    throw new Error('Заповніть імʼя, телефон, адресу та email.');
  }

  return {
    order_id: forcedOrderId || pendingOrderVerification?.orderId || generateOrderId(),
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    customer_email: customerEmail,
    items: cart.map(item => ({
      id: item.id,
      qty: item.qty,
    })),
  };
}

function generateOrderId() {
  return `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function buildOrderFingerprint(payload) {
  return JSON.stringify({
    order_id: payload.order_id,
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    customer_address: payload.customer_address,
    customer_email: payload.customer_email,
    items: payload.items,
  });
}

function toggleVerificationStep(visible) {
  const verificationStep = document.getElementById('verificationStep');
  const verificationButton = document.getElementById('orderVerificationBtn');

  if (verificationStep) {
    verificationStep.hidden = !visible;
  }

  if (verificationButton) {
    verificationButton.hidden = visible;
  }
}

function clearPendingOrderVerification() {
  pendingOrderVerification = null;
  toggleVerificationStep(false);

  const codeInput = document.getElementById('orderCode');
  if (codeInput) {
    codeInput.value = '';
  }
}

function invalidatePendingOrderVerification(message, state = 'warn') {
  if (!pendingOrderVerification) return;

  clearPendingOrderVerification();
  setOrderStatusNote(message, state);
}

function setOrderStatusNote(message, state = 'info') {
  const note = document.getElementById('orderStatusNote');
  if (!note) return;

  note.textContent = message || '';
  note.dataset.state = state;
  note.hidden = !message;
}

function setButtonLoading(button, label) {
  if (!button) return;

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.innerHTML;
  }

  button.disabled = true;
  button.textContent = label;
}

function restoreButtonLabel(button) {
  if (!button) return;

  if (button.dataset.defaultLabel) {
    button.innerHTML = button.dataset.defaultLabel;
  }

  button.disabled = false;
}

function getTotalPages(totalItems, pageSize) {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

document.addEventListener('click', (event) => {
  const logoutButton = event.target.closest('#logoutBtn');
  if (logoutButton) {
    logoutUser();
    return;
  }

  const addButton = event.target.closest('[data-add-to-cart]');
  if (addButton) {
    addProductToCart(addButton.dataset.addToCart);
    return;
  }

  const incrementButton = event.target.closest('[data-cart-inc]');
  if (incrementButton) {
    addProductToCart(incrementButton.dataset.cartInc);
    return;
  }

  const decrementButton = event.target.closest('[data-cart-dec]');
  if (decrementButton) {
    removeFromCart(Number(decrementButton.dataset.cartDec));
  }
});

document.getElementById('orderVerificationBtn').addEventListener('click', () => {
  requestOrderVerification();
});

document.getElementById('resendCodeBtn').addEventListener('click', () => {
  requestOrderVerification({ resend: true });
});

document.getElementById('applyCatalogFiltersBtn').addEventListener('click', () => {
  applyCatalogFilters(true);
});

document.getElementById('catalogPrevBtn').addEventListener('click', () => {
  changeCatalogPage(-1);
});

document.getElementById('catalogNextBtn').addEventListener('click', () => {
  changeCatalogPage(1);
});

catalogSearchEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    applyCatalogFilters(true);
  }
});

['custName', 'custPhone', 'custAddress', 'custEmail'].forEach((id) => {
  const input = document.getElementById(id);
  if (!input) return;

  input.addEventListener('input', () => {
    invalidatePendingOrderVerification('Дані замовлення змінено. Надішліть новий код.');
  });
});

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

async function bootStorefront() {
  initStaticGraphics();
  await loadCurrentUser();
  const isSupabaseReady = await warmSupabase({ showStatus: true });
  await loadProducts({ allowWakeRetry: !isSupabaseReady });
}

bootStorefront();
