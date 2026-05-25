const params = new URLSearchParams(window.location.search);
const isAdminMode = params.get('mode') === 'admin';
const nextUrl = params.get('next') || '';

let authUser = null;
let activeTab = 'login';

const authTabs = document.getElementById('authTabs');
const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');
const authForms = document.getElementById('authForms');
const accountPanel = document.getElementById('accountPanel');
const authMessage = document.getElementById('authMessage');
const adminLock = document.getElementById('adminLock');

initPageMode();
wireTabs();
wireForms();
loadSession();

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

function initPageMode() {
  if (!isAdminMode) return;

  document.title = 'Вхід адміністратора | Sugar & Glaze';
  document.getElementById('heroEyebrow').textContent = 'Доступ адміністратора';
  document.getElementById('heroTitle').textContent = 'Увійдіть в адмін-панель Sugar & Glaze';
  document.getElementById('heroText').textContent = '';
  document.getElementById('authTitle').textContent = 'Вхід адміністратора';
  document.getElementById('authSubtitle').textContent = '';
  authTabs.style.display = 'none';
  registerPanel.classList.remove('active');
  loginPanel.classList.add('active');
  activeTab = 'login';
}

function wireTabs() {
  authTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;

    setActiveTab(button.dataset.tab);
  });
}

function setActiveTab(tab) {
  activeTab = tab;

  document.querySelectorAll('.tab-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });

  loginPanel.classList.toggle('active', tab === 'login');
  registerPanel.classList.toggle('active', tab === 'register');
  clearMessage();
}

function wireForms() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

async function loadSession() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) throw new Error('Не вдалося завантажити сесію');

    const data = await readApiResponse(response);
    authUser = data.user || null;
  } catch {
    authUser = null;
  }

  if (authUser && !isAdminMode) {
    window.location.href = '/account.html';
    return;
  }

  renderState();
}

function renderState() {
  const hasUser = Boolean(authUser);
  const hasAdminAccess = authUser?.role === 'admin';

  authForms.style.display = hasUser ? 'none' : 'block';
  accountPanel.classList.toggle('show', hasUser);

  if (!hasUser) {
    clearAccountPanel();
  } else {
    document.getElementById('accountName').textContent = authUser.name;
    document.getElementById('accountEmail').textContent = authUser.email;
    document.getElementById('accountRole').textContent = authUser.role === 'admin' ? 'Адміністратор' : 'Клієнт';
    document.getElementById('profileName').value = authUser.name || '';
    document.getElementById('profilePhone').value = authUser.phone || '';
    document.getElementById('profileAddress').value = authUser.address || '';
    document.getElementById('adminAction').style.display = hasAdminAccess ? 'inline-flex' : 'none';
  }

  if (isAdminMode && hasUser && !hasAdminAccess) {
    adminLock.textContent = 'Ви увійшли, але цей акаунт не має ролі адміністратора. Використайте admin-акаунт із бази даних.';
    adminLock.classList.add('show');
  } else {
    adminLock.classList.remove('show');
    adminLock.textContent = '';
  }
}

function clearAccountPanel() {
  document.getElementById('accountName').textContent = 'Ваш акаунт';
  document.getElementById('accountEmail').textContent = '';
  document.getElementById('accountRole').textContent = '';
  document.getElementById('profileName').value = '';
  document.getElementById('profilePhone').value = '';
  document.getElementById('profileAddress').value = '';
  document.getElementById('adminAction').style.display = 'none';
}

async function handleLogin(event) {
  event.preventDefault();
  clearMessage();

  const button = document.getElementById('loginSubmit');
  button.disabled = true;
  button.textContent = 'Вхід...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
        admin: isAdminMode,
      }),
    });

    const data = await readApiResponse(response);
    if (!response.ok) throw new Error(data.error || 'Не вдалося увійти');

    authUser = data.user;
    showMessage('Вхід виконано успішно.', 'success');
    renderState();

    const redirectTarget = resolveRedirectTarget(data.user);
    if (redirectTarget) {
      window.location.href = redirectTarget;
    }
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Увійти';
  }
}

async function handleRegister(event) {
  event.preventDefault();
  clearMessage();

  const button = document.getElementById('registerSubmit');
  button.disabled = true;
  button.textContent = 'Створення...';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('registerName').value.trim(),
        email: document.getElementById('registerEmail').value.trim(),
        phone: document.getElementById('registerPhone').value.trim(),
        address: document.getElementById('registerAddress').value.trim(),
        password: document.getElementById('registerPassword').value,
      }),
    });

    const data = await readApiResponse(response);
    if (!response.ok) throw new Error(data.error || 'Не вдалося створити акаунт');

    authUser = data.user;
    showMessage('Акаунт створено. Тепер можна оформлювати замовлення.', 'success');
    renderState();

    const redirectTarget = resolveRedirectTarget(data.user);
    if (redirectTarget) {
      window.location.href = redirectTarget;
    }
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Створити акаунт';
  }
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

    authUser = data.user;
    renderState();
    showMessage('Профіль оновлено.', 'success');
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
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Не вдалося завершити сесію');

    authUser = null;
    renderState();
    showMessage('Сесію завершено.', 'info');

    if (isAdminMode) {
      setActiveTab('login');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function resolveRedirectTarget(user) {
  if (nextUrl) {
    if (nextUrl === '/admin.html' && user.role !== 'admin') {
      return '';
    }

    return nextUrl;
  }

  if (isAdminMode && user.role === 'admin') {
    return '/admin.html';
  }

  return '/account.html';
}

function showMessage(message, type = 'info') {
  authMessage.textContent = message;
  authMessage.className = `message show ${type}`;
}

function clearMessage() {
  authMessage.textContent = '';
  authMessage.className = 'message';
}
