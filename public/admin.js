let uploadedImageUrl = '';
let currentAdmin = null;
let editingProductId = null;
let editingOriginalImageUrl = '';
let imageUploadNonce = 0;
let unloadCleanupTriggered = false;
let productsCache = [];
let ordersCache = [];

const PRODUCT_PAGE_SIZE = 6;
const ORDER_PAGE_SIZE = 5;

const statusLabels = {
  new: 'Нове',
  confirmed: 'Підтверджено',
  completed: 'Завершено',
  cancelled: 'Скасовано',
};
const { normalizeSafeImageUrl } = window.sgSecurity || {};

const productSearchEl = document.getElementById('productSearch');
const productSortEl = document.getElementById('productSort');
const orderSearchEl = document.getElementById('orderSearch');
const orderStatusFilterEl = document.getElementById('orderStatusFilter');
const orderSortEl = document.getElementById('orderSort');
const productFormMessageEl = document.getElementById('productFormMessage');

const productFilters = {
  search: '',
  sort: productSortEl.value || 'newest',
  page: 1,
};

const orderFilters = {
  search: '',
  status: orderStatusFilterEl.value || 'all',
  sort: orderSortEl.value || 'newest',
  page: 1,
};

wireEvents();
init();

function wireEvents() {
  document.getElementById('imageInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    previewImage(file);
    await uploadImage(file);
  });

  const uploadArea = document.getElementById('uploadArea');
  uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', async (event) => {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');

    const file = event.dataTransfer.files[0];
    if (!file) return;

    previewImage(file);
    await uploadImage(file);
  });

  document.getElementById('addProductForm').addEventListener('submit', handleProductSubmit);
  document.getElementById('logoutBtn').addEventListener('click', logoutAdmin);
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    void resetProductForm();
  });
  document.getElementById('clearImageBtn').addEventListener('click', clearSelectedImage);
  document.getElementById('applyProductFiltersBtn').addEventListener('click', () => applyProductFilters(true));
  document.getElementById('applyOrderFiltersBtn').addEventListener('click', () => applyOrderFilters(true));
  document.getElementById('productPrevBtn').addEventListener('click', () => changeProductPage(-1));
  document.getElementById('productNextBtn').addEventListener('click', () => changeProductPage(1));
  document.getElementById('orderPrevBtn').addEventListener('click', () => changeOrderPage(-1));
  document.getElementById('orderNextBtn').addEventListener('click', () => changeOrderPage(1));

  productSearchEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyProductFilters(true);
    }
  });

  orderSearchEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyOrderFilters(true);
    }
  });

  window.addEventListener('pagehide', handlePageExitCleanup);
  window.addEventListener('beforeunload', handlePageExitCleanup);

  document.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-product]');
    if (deleteButton) {
      deleteProduct(deleteButton.dataset.deleteProduct, deleteButton.dataset.productName);
      return;
    }

    const editButton = event.target.closest('[data-edit-product]');
    if (editButton) {
      void startEditProduct(editButton.dataset.editProduct);
      return;
    }

    const saveButton = event.target.closest('[data-save-status]');
    if (saveButton) {
      updateOrderStatus(saveButton.dataset.saveStatus);
    }
  });
}

async function init() {
  await loadAdminSession();

  if (!currentAdmin || currentAdmin.role !== 'admin') {
    return;
  }

  await Promise.all([loadProducts(), loadOrders()]);
}

async function readApiResponse(response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return text ? JSON.parse(text) : {};
  }

  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Сервер повернув HTML замість JSON. Перезапустіть Node.js сервер і відкрийте сайт через http://localhost:3100.');
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || 'Сервер повернув неочікувану відповідь.');
  }
}

async function loadAdminSession() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await readApiResponse(response);

    if (!response.ok || !data.user || data.user.role !== 'admin') {
      window.location.href = '/auth.html?mode=admin&next=/admin.html';
      return;
    }

    currentAdmin = data.user;
    document.getElementById('adminIdentity').textContent = `Адміністратор: ${currentAdmin.name}`;
  } catch {
    window.location.href = '/auth.html?mode=admin&next=/admin.html';
  }
}

async function logoutAdmin() {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Не вдалося завершити сесію');

    window.location.href = '/auth.html?mode=admin';
  } catch (error) {
    toast(error.message, 'error');
  }
}

function previewImage(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    setImagePreview(event.target.result);
  };
  reader.readAsDataURL(file);
}

function setImagePreview(url) {
  const preview = document.getElementById('imagePreview');
  if (!url) {
    preview.style.display = 'none';
    preview.removeAttribute('src');
    updateClearImageButtonState();
    return;
  }

  preview.src = url;
  preview.style.display = 'block';
  updateClearImageButtonState();
}

function updateClearImageButtonState() {
  const clearButton = document.getElementById('clearImageBtn');
  const preview = document.getElementById('imagePreview');
  clearButton.disabled = !preview.getAttribute('src');
}

function setUploadStatus(message = '', tone = 'muted') {
  const status = document.getElementById('uploadStatus');
  status.textContent = message;

  if (tone === 'success') {
    status.style.color = '#2f8f5b';
    return;
  }

  if (tone === 'error') {
    status.style.color = '#d94a4a';
    return;
  }

  status.style.color = '#7f6a5d';
}

function getCurrentTemporaryImageUrl() {
  return uploadedImageUrl && uploadedImageUrl !== editingOriginalImageUrl
    ? uploadedImageUrl
    : '';
}

async function removeTemporaryUploadedImage(imageUrl) {
  if (!imageUrl) return;

  const response = await fetch('/api/admin/images/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  const data = await readApiResponse(response);
  if (!response.ok) {
    throw new Error(data.error || 'Не вдалося очистити фото.');
  }
}

function requestTemporaryImageCleanupOnExit(imageUrl) {
  if (!imageUrl) return;

  const payload = JSON.stringify({ image_url: imageUrl });
  let queued = false;

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    queued = navigator.sendBeacon('/api/admin/images/remove', blob);
  }

  if (!queued) {
    fetch('/api/admin/images/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

function handlePageExitCleanup() {
  if (unloadCleanupTriggered) {
    return;
  }

  const temporaryImageUrl = getCurrentTemporaryImageUrl();
  if (!temporaryImageUrl) {
    return;
  }

  unloadCleanupTriggered = true;
  requestTemporaryImageCleanupOnExit(temporaryImageUrl);
  uploadedImageUrl = '';
}

async function clearSelectedImage() {
  const clearButton = document.getElementById('clearImageBtn');
  const temporaryImageUrl = getCurrentTemporaryImageUrl();

  imageUploadNonce += 1;
  clearButton.disabled = true;
  unloadCleanupTriggered = false;

  uploadedImageUrl = '';
  document.getElementById('imageInput').value = '';
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('uploadProgressBar').style.width = '0';
  setImagePreview('');

  try {
    if (temporaryImageUrl) {
      await removeTemporaryUploadedImage(temporaryImageUrl);
    }

    if (editingProductId && editingOriginalImageUrl) {
      setUploadStatus('Фото буде видалено після збереження товару.');
    } else {
      setUploadStatus('');
    }
  } catch (error) {
    setUploadStatus(error.message, 'error');
    toast(error.message, 'error');
  } finally {
    updateClearImageButtonState();
  }
}

async function uploadImage(file) {
  const currentUploadNonce = ++imageUploadNonce;
  const fallbackImageUrl = uploadedImageUrl;
  const previousTemporaryImageUrl = getCurrentTemporaryImageUrl();
  const progress = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('uploadProgressBar');

  progress.style.display = 'block';
  progressBar.style.width = '30%';
  setUploadStatus('Завантаження фото...');

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await readApiResponse(response);
    if (!response.ok) throw new Error(data.error || 'Помилка завантаження');

    if (currentUploadNonce !== imageUploadNonce) {
      if (data.imageUrl) {
        await removeTemporaryUploadedImage(data.imageUrl);
      }
      return;
    }

    uploadedImageUrl = data.imageUrl;
    setImagePreview(uploadedImageUrl);
    progressBar.style.width = '100%';
    setUploadStatus('Фото завантажено.', 'success');

    if (previousTemporaryImageUrl && previousTemporaryImageUrl !== uploadedImageUrl) {
      await removeTemporaryUploadedImage(previousTemporaryImageUrl);
    }
  } catch (error) {
    if (currentUploadNonce !== imageUploadNonce) {
      return;
    }

    uploadedImageUrl = fallbackImageUrl;
    setImagePreview(fallbackImageUrl);
    progressBar.style.width = '100%';
    setUploadStatus(error.message, 'error');
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();
  clearProductFormMessage();

  const payload = {
    name: document.getElementById('productName').value.trim(),
    price: document.getElementById('productPrice').value.trim(),
    description: document.getElementById('productDesc').value.trim(),
    image_url: uploadedImageUrl || null,
  };

  const validation = validateProductPayload(payload);
  if (!validation.ok) {
    showProductFormMessage(validation.error, 'error');
    document.getElementById(validation.fieldId)?.focus();
    return;
  }

  const button = document.getElementById('submitBtn');
  const isEditMode = Boolean(editingProductId);
  button.disabled = true;
  button.textContent = isEditMode ? 'Оновлення...' : 'Збереження...';

  try {
    await saveProduct(validation.payload, isEditMode);

    toast(isEditMode ? 'Товар успішно оновлено.' : 'Товар успішно додано.', 'success');
    await resetProductForm({ discardTemporaryUpload: false });
    await loadProducts();
  } catch (error) {
    showProductFormMessage(error.message, 'error');
    toast(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = editingProductId ? 'Оновити товар' : 'Зберегти товар';
  }
}

function validateProductPayload(payload) {
  if (!payload.name) {
    return { ok: false, error: 'Вкажіть назву товару.', fieldId: 'productName' };
  }

  if (payload.name.length < 2) {
    return { ok: false, error: 'Назва товару має містити щонайменше 2 символи.', fieldId: 'productName' };
  }

  if (!payload.price) {
    return { ok: false, error: 'Вкажіть ціну товару.', fieldId: 'productPrice' };
  }

  const normalizedPrice = Number(payload.price);
  if (!Number.isFinite(normalizedPrice)) {
    return { ok: false, error: 'Ціна має бути числом.', fieldId: 'productPrice' };
  }

  if (normalizedPrice <= 0) {
    return { ok: false, error: 'Ціна має бути більшою за нуль.', fieldId: 'productPrice' };
  }

  return {
    ok: true,
    payload: {
      ...payload,
      price: normalizedPrice,
    },
  };
}

async function saveProduct(payload, isEditMode) {
  const url = isEditMode ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
  const methods = isEditMode ? ['PATCH', 'PUT', 'POST'] : ['POST'];
  let lastErrorMessage = 'Не вдалося зберегти товар';

  for (const method of methods) {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await readApiResponse(response);

    if (response.ok) {
      return data;
    }

    lastErrorMessage = data.error || lastErrorMessage;

    const shouldRetry = (
      isEditMode &&
      (response.status === 404 || response.status === 405) &&
      (method === 'PATCH' || method === 'PUT') &&
      String(data.error || '').toLowerCase().includes('api route not found')
    );

    if (shouldRetry) {
      continue;
    }

    if (isEditMode && method !== 'POST' && response.status === 404) {
      continue;
    }

    throw new Error(lastErrorMessage);
  }

  throw new Error(lastErrorMessage);
}

async function resetProductForm({ discardTemporaryUpload = true } = {}) {
  const temporaryImageUrl = discardTemporaryUpload ? getCurrentTemporaryImageUrl() : '';

  if (temporaryImageUrl) {
    try {
      await removeTemporaryUploadedImage(temporaryImageUrl);
    } catch (error) {
      setUploadStatus(error.message, 'error');
      toast(error.message, 'error');
    }
  }

  editingProductId = null;
  editingOriginalImageUrl = '';
  uploadedImageUrl = '';
  imageUploadNonce += 1;
  unloadCleanupTriggered = false;
  clearProductFormMessage();

  document.getElementById('addProductForm').reset();
  setUploadStatus('');
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('uploadProgressBar').style.width = '0';
  document.getElementById('productFormTitle').textContent = 'Додати товар';
  document.getElementById('submitBtn').textContent = 'Зберегти товар';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('editBanner').classList.remove('show');
  document.getElementById('editBanner').textContent = '';
  document.getElementById('imageInput').value = '';
  setImagePreview('');
}

async function startEditProduct(productId) {
  const product = productsCache.find((item) => String(item.id) === String(productId));
  if (!product) return;

  const temporaryImageUrl = getCurrentTemporaryImageUrl();
  if (temporaryImageUrl) {
    try {
      await removeTemporaryUploadedImage(temporaryImageUrl);
    } catch (error) {
      setUploadStatus(error.message, 'error');
      toast(error.message, 'error');
    }
  }

  editingProductId = product.id;
  editingOriginalImageUrl = product.image_url || '';
  uploadedImageUrl = editingOriginalImageUrl;
  imageUploadNonce += 1;
  unloadCleanupTriggered = false;
  clearProductFormMessage();

  document.getElementById('productName').value = product.name || '';
  document.getElementById('productPrice').value = product.price || '';
  document.getElementById('productDesc').value = product.description || '';
  document.getElementById('imageInput').value = '';
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('uploadProgressBar').style.width = '0';
  document.getElementById('productFormTitle').textContent = 'Редагувати товар';
  document.getElementById('submitBtn').textContent = 'Оновити товар';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';

  const banner = document.getElementById('editBanner');
  banner.textContent = `Редагування: ${product.name}`;
  banner.classList.add('show');

  setImagePreview(uploadedImageUrl);
  setUploadStatus(editingOriginalImageUrl ? 'Поточне фото товару.' : '');
  document.querySelector('.dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showProductFormMessage(message, type = 'error') {
  productFormMessageEl.textContent = message;
  productFormMessageEl.className = `form-message show ${type}`;
}

function clearProductFormMessage() {
  productFormMessageEl.textContent = '';
  productFormMessageEl.className = 'form-message';
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const data = await readApiResponse(response);

    if (!response.ok) throw new Error(data.error || 'Не вдалося завантажити каталог');

    productsCache = Array.isArray(data) ? data : [];
    renderProducts();
  } catch (error) {
    document.getElementById('productsList').innerHTML = `<div class="empty-state">Помилка: ${escapeHtml(error.message)}</div>`;
    updateProductPagination(0, 0, 0, 0);
  }
}

function applyProductFilters(resetPage = false) {
  productFilters.search = productSearchEl.value.trim().toLowerCase();
  productFilters.sort = productSortEl.value;
  productFilters.page = resetPage ? 1 : productFilters.page;
  renderProducts();
}

function changeProductPage(delta) {
  const totalPages = getTotalPages(getFilteredProducts().length, PRODUCT_PAGE_SIZE);
  const nextPage = clamp(productFilters.page + delta, 1, totalPages);

  if (nextPage === productFilters.page) return;

  productFilters.page = nextPage;
  renderProducts();
}

function getFilteredProducts() {
  const search = productFilters.search;

  const filtered = productsCache.filter((product) => {
    const haystack = `${product.name} ${product.description || ''} ${product.price || ''}`.toLowerCase();
    return haystack.includes(search);
  });

  return sortProducts(filtered, productFilters.sort);
}

function renderProducts() {
  const list = document.getElementById('productsList');
  const filteredItems = getFilteredProducts();
  const totalItems = filteredItems.length;
  const totalPages = getTotalPages(totalItems, PRODUCT_PAGE_SIZE);

  productFilters.page = clamp(productFilters.page, 1, totalPages);

  const startIndex = (productFilters.page - 1) * PRODUCT_PAGE_SIZE;
  const pageItems = filteredItems.slice(startIndex, startIndex + PRODUCT_PAGE_SIZE);

  document.getElementById('productCount').value = `${totalItems} товарів`;
  updateProductPagination(totalItems, totalPages, pageItems.length, startIndex);

  if (pageItems.length === 0) {
    list.innerHTML = '<div class="empty-state">Нічого не знайдено.</div>';
    return;
  }

  list.innerHTML = pageItems.map((product) => {
    const safeImageUrl = normalizeSafeImageUrl?.(product.image_url) || '/favicon.svg';

    return `
    <article class="product-row">
      <img
        src="${escapeAttribute(safeImageUrl)}"
        alt="${escapeHtml(product.name)}"
      />
      <div>
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-price">${product.price} грн</div>
        ${product.description ? `<div class="product-desc">${escapeHtml(product.description)}</div>` : ''}
      </div>
      <div class="row-actions">
        <button type="button" class="soft-btn" data-edit-product="${product.id}">Редагувати</button>
        <button
          type="button"
          class="danger-btn"
          data-delete-product="${product.id}"
          data-product-name="${escapeAttribute(product.name)}"
        >
          Видалити
        </button>
      </div>
    </article>
  `;
  }).join('');
}

function updateProductPagination(totalItems, totalPages, visibleItems, startIndex) {
  const pageInfo = document.getElementById('productPageInfo');
  const prevBtn = document.getElementById('productPrevBtn');
  const nextBtn = document.getElementById('productNextBtn');

  if (totalItems === 0) {
    pageInfo.textContent = 'Сторінка 0 з 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const from = startIndex + 1;
  const to = startIndex + visibleItems;
  pageInfo.textContent = `${from}-${to} з ${totalItems} · сторінка ${productFilters.page} з ${totalPages}`;
  prevBtn.disabled = productFilters.page <= 1;
  nextBtn.disabled = productFilters.page >= totalPages;
}

function sortProducts(items, sort) {
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

async function deleteProduct(id, name) {
  const confirmed = await showConfirm({
    title: 'Видалити товар?',
    text: `"${name}" буде видалено з каталогу.`,
    iconName: 'trash',
    confirmText: 'Видалити',
    cancelText: 'Скасувати',
  });

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    const data = response.ok ? null : await readApiResponse(response);

    if (!response.ok) throw new Error(data?.error || 'Не вдалося видалити товар');

    if (String(editingProductId) === String(id)) {
      resetProductForm();
    }

    toast(`"${name}" видалено.`, 'success');
    await loadProducts();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function loadOrders() {
  try {
    const response = await fetch('/api/admin/orders');
    const data = await readApiResponse(response);

    if (!response.ok) throw new Error(data.error || 'Не вдалося завантажити замовлення');

    ordersCache = Array.isArray(data) ? data : [];
    renderOrders();
  } catch (error) {
    document.getElementById('ordersList').innerHTML = `<div class="empty-state">Помилка: ${escapeHtml(error.message)}</div>`;
    updateOrderPagination(0, 0, 0, 0);
  }
}

function applyOrderFilters(resetPage = false) {
  orderFilters.search = orderSearchEl.value.trim().toLowerCase();
  orderFilters.status = orderStatusFilterEl.value;
  orderFilters.sort = orderSortEl.value;
  orderFilters.page = resetPage ? 1 : orderFilters.page;
  renderOrders();
}

function changeOrderPage(delta) {
  const totalPages = getTotalPages(getFilteredOrders().length, ORDER_PAGE_SIZE);
  const nextPage = clamp(orderFilters.page + delta, 1, totalPages);

  if (nextPage === orderFilters.page) return;

  orderFilters.page = nextPage;
  renderOrders();
}

function getFilteredOrders() {
  const search = orderFilters.search;
  const statusFilter = orderFilters.status;

  const filtered = ordersCache.filter((order) => {
    const itemNames = (order.items || []).map((item) => item.name).join(' ');
    const haystack = [
      order.order_id,
      order.customer_name,
      order.customer_phone,
      order.customer_email,
      order.customer_address,
      itemNames,
    ].join(' ').toLowerCase();

    const matchesSearch = haystack.includes(search);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return sortOrders(filtered, orderFilters.sort);
}

function renderOrders() {
  const list = document.getElementById('ordersList');
  const filteredItems = getFilteredOrders();
  const totalItems = filteredItems.length;
  const totalPages = getTotalPages(totalItems, ORDER_PAGE_SIZE);

  orderFilters.page = clamp(orderFilters.page, 1, totalPages);

  const startIndex = (orderFilters.page - 1) * ORDER_PAGE_SIZE;
  const pageItems = filteredItems.slice(startIndex, startIndex + ORDER_PAGE_SIZE);

  document.getElementById('orderCount').value = `${totalItems} замовлень`;
  updateOrderPagination(totalItems, totalPages, pageItems.length, startIndex);

  if (pageItems.length === 0) {
    list.innerHTML = '<div class="empty-state">Нічого не знайдено.</div>';
    return;
  }

  list.innerHTML = pageItems.map((order) => `
    <article class="order-card">
      <div class="order-head">
        <div>
          <h3>Замовлення ${escapeHtml(order.order_id)}</h3>
          <div class="order-meta">
            ${formatDate(order.created_at)}<br/>
            ${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_phone)}
          </div>
        </div>
        <div class="status-badge status-${escapeAttribute(order.status)}">
          ${statusLabels[order.status] || order.status}
        </div>
      </div>

      <div class="order-grid">
        <div class="order-block">
          <h4>Клієнт</h4>
          <p><strong>Ім'я:</strong> ${escapeHtml(order.customer_name)}</p>
          <p><strong>Телефон:</strong> ${escapeHtml(order.customer_phone)}</p>
          <p><strong>Email:</strong> ${escapeHtml(order.customer_email || 'не вказано')}</p>
          <p><strong>Адреса:</strong> ${escapeHtml(order.customer_address || 'не вказано')}</p>
        </div>

        <div class="order-block">
          <h4>Склад</h4>
          <ul class="order-items">
            ${(order.items || []).map((item) => `
              <li>${escapeHtml(item.name)} — ${item.qty} × ${item.price} грн = ${item.subtotal} грн</li>
            `).join('')}
          </ul>
        </div>
      </div>

      <div class="order-footer">
        <div class="order-total">Разом: ${order.total_amount} грн</div>
        <div class="status-controls">
          <select class="status-select" id="status-${escapeAttribute(order.order_id)}">
            ${Object.entries(statusLabels).map(([value, label]) => `
              <option value="${value}" ${value === order.status ? 'selected' : ''}>${label}</option>
            `).join('')}
          </select>
          <button type="button" class="ghost-btn" data-save-status="${escapeAttribute(order.order_id)}">
            Оновити статус
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function updateOrderPagination(totalItems, totalPages, visibleItems, startIndex) {
  const pageInfo = document.getElementById('orderPageInfo');
  const prevBtn = document.getElementById('orderPrevBtn');
  const nextBtn = document.getElementById('orderNextBtn');

  if (totalItems === 0) {
    pageInfo.textContent = 'Сторінка 0 з 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const from = startIndex + 1;
  const to = startIndex + visibleItems;
  pageInfo.textContent = `${from}-${to} з ${totalItems} · сторінка ${orderFilters.page} з ${totalPages}`;
  prevBtn.disabled = orderFilters.page <= 1;
  nextBtn.disabled = orderFilters.page >= totalPages;
}

function sortOrders(items, sort) {
  const sorted = [...items];

  switch (sort) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case 'total_asc':
      return sorted.sort((a, b) => Number(a.total_amount) - Number(b.total_amount));
    case 'total_desc':
      return sorted.sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
    case 'customer_asc':
      return sorted.sort((a, b) => String(a.customer_name).localeCompare(String(b.customer_name), 'uk'));
    case 'status_asc':
      return sorted.sort((a, b) => String(statusLabels[a.status] || a.status).localeCompare(String(statusLabels[b.status] || b.status), 'uk'));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

async function updateOrderStatus(orderId) {
  const select = document.getElementById(`status-${orderId}`);
  const nextStatus = select.value;

  try {
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await readApiResponse(response);
    if (!response.ok) throw new Error(data.error || 'Не вдалося оновити статус');

    toast('Статус замовлення оновлено.', 'success');
    await loadOrders();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function getTotalPages(totalItems, pageSize) {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatDate(value) {
  if (!value) return 'Дата недоступна';

  return new Date(value).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
