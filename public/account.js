let currentUser = null;
let ordersCache = [];

const ORDERS_PAGE_SIZE = 5;
const ordersState = {
  page: 1,
};

const orderStatusLabels = {
  new: 'Нове',
  confirmed: 'Підтверджено',
  completed: 'Завершено',
  cancelled: 'Скасовано',
};

const messageEl = document.getElementById('accountMessage');

loadSession();
wireEvents();

function wireEvents() {
  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('ordersPrevBtn').addEventListener('click', () => changeOrdersPage(-1));
  document.getElementById('ordersNextBtn').addEventListener('click', () => changeOrdersPage(1));
}

async function loadSession() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await readApiResponse(response);

    if (!response.ok || !data.user) {
      window.location.href = '/auth.html?next=/account.html';
      return;
    }

    currentUser = data.user;
    renderUser();
    await loadOrders();
  } catch {
    window.location.href = '/auth.html?next=/account.html';
  }
}

function renderUser() {
  if (!currentUser) return;

  document.getElementById('accountName').textContent = currentUser.name || 'Користувач';
  document.getElementById('accountEmail').textContent = currentUser.email || '';
  document.getElementById('accountRole').textContent = currentUser.role === 'admin' ? 'Адміністратор' : 'Клієнт';
  document.getElementById('profileName').value = currentUser.name || '';
  document.getElementById('profilePhone').value = currentUser.phone || '';
  document.getElementById('profileAddress').value = currentUser.address || '';
  document.getElementById('adminAction').style.display = currentUser.role === 'admin' ? 'inline-flex' : 'none';
}

async function loadOrders() {
  try {
    const response = await fetch('/api/account/orders');
    const data = await readApiResponse(response);

    if (!response.ok) {
      throw new Error(data.error || 'Не вдалося завантажити замовлення.');
    }

    ordersCache = Array.isArray(data) ? data : [];
    renderOrders();
  } catch (error) {
    document.getElementById('ordersList').innerHTML = `<div class="empty-state">Помилка: ${escapeHtml(error.message)}</div>`;
    updateOrdersPagination(0, 0, 0, 0);
    document.getElementById('ordersCount').textContent = '0 замовлень';
  }
}

function renderOrders() {
  const ordersList = document.getElementById('ordersList');
  const totalItems = ordersCache.length;
  const totalPages = getTotalPages(totalItems, ORDERS_PAGE_SIZE);

  ordersState.page = clamp(ordersState.page, 1, totalPages);

  const startIndex = (ordersState.page - 1) * ORDERS_PAGE_SIZE;
  const pageItems = ordersCache.slice(startIndex, startIndex + ORDERS_PAGE_SIZE);

  document.getElementById('ordersCount').textContent = `${totalItems} замовлень`;
  updateOrdersPagination(totalItems, totalPages, pageItems.length, startIndex);

  if (pageItems.length === 0) {
    ordersList.innerHTML = '<div class="empty-state">У вас ще немає замовлень.</div>';
    return;
  }

  ordersList.innerHTML = pageItems.map((order) => `
    <article class="order-card">
      <div class="order-head">
        <div>
          <h3>Замовлення ${escapeHtml(order.order_id)}</h3>
          <div class="order-meta">
            ${formatDate(order.created_at)}<br/>
            ${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_phone)}
          </div>
        </div>
        <div class="status-badge status-${order.status}">
          ${orderStatusLabels[order.status] || order.status}
        </div>
      </div>

      <div class="order-grid">
        <div class="order-block">
          <h4>Доставка</h4>
          <p><strong>Адреса:</strong> ${escapeHtml(order.customer_address || 'не вказано')}</p>
          <p><strong>Email:</strong> ${escapeHtml(order.customer_email || 'не вказано')}</p>
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
      </div>
    </article>
  `).join('');
}

function updateOrdersPagination(totalItems, totalPages, visibleItems, startIndex) {
  const pageInfo = document.getElementById('ordersPageInfo');
  const prevBtn = document.getElementById('ordersPrevBtn');
  const nextBtn = document.getElementById('ordersNextBtn');

  if (totalItems === 0) {
    pageInfo.textContent = 'Сторінка 0 з 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const from = startIndex + 1;
  const to = startIndex + visibleItems;

  pageInfo.textContent = `${from}-${to} з ${totalItems} · сторінка ${ordersState.page} з ${totalPages}`;
  prevBtn.disabled = ordersState.page <= 1;
  nextBtn.disabled = ordersState.page >= totalPages;
}

function changeOrdersPage(delta) {
  const totalPages = getTotalPages(ordersCache.length, ORDERS_PAGE_SIZE);
  const nextPage = clamp(ordersState.page + delta, 1, totalPages);

  if (nextPage === ordersState.page) return;

  ordersState.page = nextPage;
  renderOrders();
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  clearMessage();

  const button = document.getElementById('profileSubmit');
  button.disabled = true;
  button.textContent = 'Збереження...';

  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('profileName').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        address: document.getElementById('profileAddress').value.trim(),
      }),
    });

    const data = await readApiResponse(response);
    if (!response.ok) throw new Error(data.error || 'Не вдалося оновити профіль');

    currentUser = data.user;
    renderUser();
    showMessage('Профіль успішно оновлено.', 'success');
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Оновити профіль';
  }
}

async function handleLogout() {
  clearMessage();

  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Не вдалося завершити сесію');

    window.location.href = '/auth.html';
  } catch (error) {
    showMessage(error.message, 'error');
  }
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

function showMessage(message, type = 'info') {
  messageEl.textContent = message;
  messageEl.className = `message show ${type}`;
}

function clearMessage() {
  messageEl.textContent = '';
  messageEl.className = 'message';
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
