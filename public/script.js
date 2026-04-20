// =============================================
// Sugar & Glaze — Логіка фронтенду
// Кошик + OTP верифікація (Telegram / Email) + демо-підтвердження замовлення
// =============================================

// --- Стан ---
let cart = [];

// =============================================
// 1. ЗАВАНТАЖЕННЯ ТОВАРІВ
// =============================================
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Помилка сервера');
    const products = await response.json();

    if (products.length === 0) {
      grid.innerHTML = '<p class="loading-text">Товарів поки немає</p>';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="card">
        ${p.image_url
          ? `<img class="card-img" src="${p.image_url}" alt="${p.name}"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"/>
             <div class="card-placeholder" style="display:none">${illustration('cupcake')}</div>`
          : `<div class="card-placeholder">${illustration('cupcake')}</div>`
        }
        <div class="card-body">
          <h3 class="card-name">${p.name}</h3>
          <p class="card-desc">${p.description || ''}</p>
          <div class="card-footer">
            <span class="card-price">${p.price} грн</span>
            <button class="card-btn"
              onclick="addToCart(${p.id}, '${escapeHtml(p.name)}', ${p.price})">
              + До кошика
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p class="loading-text">Не вдалося завантажити товари.</p>';
  }
}

// =============================================
// 2. КОШИК
// =============================================
function addToCart(id, name, price) {
  const existing = cart.find(i => i.id === id);
  existing ? existing.qty++ : cart.push({ id, name, price, qty: 1 });
  updateCartUI();
  openCart();
}

function removeFromCart(id) {
  const existing = cart.find(i => i.id === id);
  if (!existing) return;
  existing.qty > 1 ? existing.qty-- : (cart = cart.filter(i => i.id !== id));
  updateCartUI();
}

function getTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = totalQty;

  const cartItemsEl = document.getElementById('cartItems');
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="cart-empty">${icon('cart', 'cart-empty-icon')}Кошик порожній</p>`;
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price} грн × ${item.qty}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="removeFromCart(${item.id})">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="addToCart(${item.id}, '${escapeHtml(item.name)}', ${item.price})">+</button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('cartTotal').textContent = getTotal();
}

// =============================================
// 3. ВІДКРИТИ / ЗАКРИТИ КОШИК
// =============================================
function openCart() {
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

// =============================================
// 4. ПЕРЕМИКАННЯ EMAIL ПОЛЯ
// =============================================
// Якщо обрано Email — показуємо поле для email, інакше ховаємо
document.querySelectorAll('input[name="channel"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const emailField = document.getElementById('custEmail');
    emailField.style.display = radio.value === 'email' ? 'block' : 'none';
    if (radio.value === 'email') {
      emailField.setAttribute('required', '');
    } else {
      emailField.removeAttribute('required');
    }
  });
});

// =============================================
// 5. OTP: ВІДПРАВКА КОДУ
// =============================================
document.getElementById('sendOtpBtn').addEventListener('click', async () => {
  if (cart.length === 0) {
    toast('Кошик порожній! Додайте товари.', 'warn');
    return;
  }

  const name    = document.getElementById('custName').value.trim();
  const phone   = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name || !phone || !address) {
    toast('Заповніть усі поля: ім\'я, телефон та адресу.', 'warn');
    return;
  }

  const channel = document.querySelector('input[name="channel"]:checked').value;
  const email   = document.getElementById('custEmail').value.trim();

  if (channel === 'email' && !email) {
    toast('Введіть email для отримання коду.', 'warn');
    return;
  }

  const btn = document.getElementById('sendOtpBtn');
  btn.disabled = true;
  btn.textContent = 'Відправлення...';

  try {
    if (channel === 'telegram') {
      // Запитуємо у сервера посилання на бота з закодованим телефоном
      const res  = await fetch('/api/otp/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Показуємо інструкцію з посиланням на бота
      document.getElementById('otpInfo').innerHTML = `
        <b>1.</b> Натисніть кнопку нижче — відкриється Telegram з нашим ботом<br/>
        <b>2.</b> Натисніть <strong>START</strong> у боті<br/>
        <b>3.</b> Бот надішле вам 6-значний код<br/>
        <b>4.</b> Введіть код у поле нижче<br/><br/>
        <a href="${data.botLink}" target="_blank">
          ${icon('arrowRight')} Відкрити бота та отримати код
        </a>
      `;
    } else {
      // Відправляємо код на email
      const res  = await fetch('/api/otp/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      document.getElementById('otpInfo').innerHTML = `
        ${icon('email')} Код відправлено на <strong>${email}</strong><br/>
        Перевірте вхідні та папку "Спам".<br/>
        Код дійсний <strong>5 хвилин</strong>.
      `;
    }

    // Переходимо до кроку 2 — введення коду
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('otpCode').focus();

  } catch (err) {
    toast('Помилка: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отримати код →';
  }
});

// Кнопка "Назад / Відправити знову" — повертає до кроку 1
document.getElementById('resendBtn').addEventListener('click', () => {
  document.getElementById('step1').style.display = 'block';
  document.getElementById('step2').style.display = 'none';
  document.getElementById('otpCode').value = '';
});

// =============================================
// 6. OTP: ПІДТВЕРДЖЕННЯ КОДУ + ЗБЕРЕЖЕННЯ ЗАМОВЛЕННЯ
// =============================================
document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (cart.length === 0) return;

  const phone   = document.getElementById('custPhone').value.trim();
  const code    = document.getElementById('otpCode').value.trim();
  const payBtn  = document.querySelector('.pay-btn[type="submit"]');

  if (!code || code.length !== 6) {
    toast('Введіть 6-значний код підтвердження.', 'warn');
    return;
  }

  payBtn.disabled = true;
  payBtn.textContent = 'Перевірка коду...';

  try {
    // КРОК А: Перевіряємо код на сервері
    const verifyRes = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      toast(verifyData.error, 'error');
      payBtn.disabled = false;
      payBtn.textContent = 'Підтвердити замовлення';
      return;
    }

    // КРОК Б: Код вірний → зберігаємо замовлення
    payBtn.textContent = 'Збереження замовлення...';
    const orderId = `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const name    = document.getElementById('custName').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const email   = document.getElementById('custEmail').value.trim();

    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        customer_email: email || null,
        items: cart,
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(orderData.error || 'Не вдалося зберегти замовлення');
    }

    const params = new URLSearchParams({
      orderId,
      demo: '1',
    });

    if (orderData.notification?.emailSent) {
      params.set('mail', 'sent');
    }

    cart = [];
    window.location.href = `/success.html?${params.toString()}`;

  } catch (err) {
    toast('Помилка: ' + err.message, 'error');
    payBtn.disabled = false;
    payBtn.textContent = 'Підтвердити замовлення';
  }
});

// =============================================
// 7. ДОПОМІЖНІ ФУНКЦІЇ
// =============================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =============================================
// 8. ІНІЦІАЛІЗАЦІЯ
// =============================================
document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

loadProducts();
