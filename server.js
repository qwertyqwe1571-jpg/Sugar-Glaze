// =============================================
// Sugar & Glaze — Головний сервер
// Стек: Express + Supabase + Cloudinary + OTP (Telegram / Email)
// =============================================

require('dotenv').config();

const express    = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors       = require('cors');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const TelegramBot = require('node-telegram-bot-api');
const nodemailer  = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// =============================================
// ПІДКЛЮЧЕННЯ СЕРВІСІВ
// =============================================

// --- Supabase ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Telegram Bot ---
// polling: true — бот постійно слухає повідомлення від користувачів
const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

// --- Nodemailer (Gmail SMTP) ---
const mailer = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Не звичайний пароль! Пояснення в .env
      },
    })
  : null;

// =============================================
// OTP СХОВИЩЕ (в пам'яті, без бази даних)
// =============================================
// Ключ: номер телефону або email клієнта
// Значення: { code, expiresAt }
// Коди живуть 5 хвилин, потім стають недійсними

const otpStore = new Map();

// Генерація 6-значного коду
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Зберегти код з терміном 5 хвилин
function saveOTP(key, code) {
  otpStore.set(key, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 хвилин
  });
}

// Перевірити код
function verifyOTP(key, inputCode) {
  const entry = otpStore.get(key);
  if (!entry) return { ok: false, reason: 'Код не знайдено. Запросіть новий.' };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return { ok: false, reason: 'Код застарів. Запросіть новий.' };
  }
  if (entry.code !== inputCode) {
    return { ok: false, reason: 'Невірний код.' };
  }
  otpStore.delete(key); // Використаний код видаляємо
  return { ok: true };
}

function roundMoney(value) {
  return Number(Number(value).toFixed(2));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function resolveOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Кошик порожній. Додайте товари перед оформленням.' };
  }

  const quantities = new Map();

  for (const item of rawItems) {
    const id = Number(item?.id);
    const qty = Number(item?.qty);

    if (!Number.isInteger(id) || id <= 0) {
      return { error: 'Замовлення містить некоректний товар.' };
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      return { error: 'Кількість товару має бути додатним цілим числом.' };
    }

    quantities.set(id, (quantities.get(id) || 0) + qty);
  }

  const productIds = Array.from(quantities.keys());
  const { data: products, error } = await supabase
    .from('sweets')
    .select('id, name, price')
    .in('id', productIds);

  if (error) {
    return { error: 'Не вдалося перевірити ціни товарів. Спробуйте ще раз.' };
  }

  if (!products || products.length !== productIds.length) {
    return { error: 'Частина товарів більше недоступна. Оновіть каталог і спробуйте знову.' };
  }

  const productMap = new Map(products.map(product => [Number(product.id), product]));
  const verifiedItems = productIds.map(id => {
    const product = productMap.get(id);
    const price = roundMoney(product.price);
    const qty = quantities.get(id);

    return {
      id,
      name: product.name,
      price,
      qty,
      subtotal: roundMoney(price * qty),
    };
  });

  const totalAmount = roundMoney(
    verifiedItems.reduce((sum, item) => sum + item.subtotal, 0)
  );

  return { verifiedItems, totalAmount };
}

async function sendOrderNotificationEmail({
  orderId,
  customerName,
  customerPhone,
  customerAddress,
  customerEmail,
  verifiedItems,
  totalAmount,
}) {
  if (!mailer) {
    return { sent: false, skipped: true };
  }

  const recipient = process.env.ORDER_NOTIFICATIONS_EMAIL || process.env.GMAIL_USER;
  const itemsHtml = verifiedItems.map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.price} грн</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.subtotal} грн</td>
    </tr>
  `).join('');

  const itemsText = verifiedItems
    .map(item => `- ${item.name}: ${item.qty} x ${item.price} грн = ${item.subtotal} грн`)
    .join('\n');

  try {
    await mailer.sendMail({
      from: `"Sugar & Glaze" <${process.env.GMAIL_USER}>`,
      to: recipient,
      replyTo: customerEmail || undefined,
      subject: `Нове замовлення ${orderId}`,
      text:
`Нове замовлення ${orderId}

Клієнт: ${customerName}
Телефон: ${customerPhone}
Адреса: ${customerAddress}
Email: ${customerEmail || 'не вказано'}

Склад замовлення:
${itemsText}

Сума: ${totalAmount} грн
Статус: демо-режим без онлайн-оплати`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; background: #fdf8f3; color: #3d2b1f;">
          <h2 style="margin: 0 0 10px; font-family: Georgia, serif;">Нове замовлення ${escapeHtml(orderId)}</h2>
          <p style="margin: 0 0 24px; color: #7a675b;">Онлайн-оплату вимкнено. Замовлення оформлене в демо-режимі.</p>
          <div style="background:#fff;border-radius:14px;padding:20px 22px;margin-bottom:18px;">
            <p style="margin:0 0 8px;"><strong>Клієнт:</strong> ${escapeHtml(customerName)}</p>
            <p style="margin:0 0 8px;"><strong>Телефон:</strong> ${escapeHtml(customerPhone)}</p>
            <p style="margin:0 0 8px;"><strong>Адреса:</strong> ${escapeHtml(customerAddress)}</p>
            <p style="margin:0;"><strong>Email:</strong> ${escapeHtml(customerEmail || 'не вказано')}</p>
          </div>
          <div style="background:#fff;border-radius:14px;padding:20px 22px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="text-align:left;color:#8a7060;">
                  <th style="padding-bottom:10px;">Товар</th>
                  <th style="padding-bottom:10px;text-align:center;">К-сть</th>
                  <th style="padding-bottom:10px;text-align:right;">Ціна</th>
                  <th style="padding-bottom:10px;text-align:right;">Сума</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p style="margin:18px 0 0;text-align:right;font-size:18px;"><strong>Разом: ${totalAmount} грн</strong></p>
          </div>
        </div>
      `,
    });

    return { sent: true, recipient };
  } catch (error) {
    console.error('Order notification email error:', error.message);
    return { sent: false, skipped: false };
  }
}

// =============================================
// TELEGRAM БОТ — реєстрація та прив'язка телефону
// =============================================
// Як це працює:
// 1. Клієнт тисне "Отримати код у Telegram"
// 2. Сайт показує посилання на бота з параметром ?start=PHONE
// 3. Клієнт переходить в бота, натискає START
// 4. Бот отримує номер телефону з параметра, генерує код і відправляє клієнту
// 5. Клієнт вводить код на сайті

// Map для очікуючих кодів: phone → chatId (після того як клієнт натиснув START)
const pendingTelegramVerifications = new Map();

// Обробник команди /start від клієнта
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  // Параметр після /start — це номер телефону, закодований у base64
  const encodedPhone = match[1];

  try {
    const phone = Buffer.from(encodedPhone, 'base64').toString('utf8');

    // Генеруємо код і відправляємо клієнту в Telegram
    const code = generateOTP();
    saveOTP(phone, code);

    bot.sendMessage(chatId, [
      `🍰 *Sugar & Glaze*`,
      ``,
      `Ваш код підтвердження замовлення:`,
      ``,
      `*${code}*`,
      ``,
      `Код дійсний 5 хвилин. Не передавайте його нікому.`,
    ].join('\n'), { parse_mode: 'Markdown' });

    console.log(`📱 OTP відправлено в Telegram для ${phone}`);

  } catch (e) {
    bot.sendMessage(chatId, 'Виникла помилка. Спробуйте ще раз на сайті.');
  }
});

// Просто /start без параметра — вітальне повідомлення
bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '👋 Привіт! Я бот магазину *Sugar & Glaze*.\n\nПовертайтесь на сайт і натисніть "Отримати код у Telegram" — я надішлю вам код підтвердження! 🍭',
    { parse_mode: 'Markdown' }
  );
});

// =============================================
// МАРШРУТИ: OTP
// =============================================

// --- Відправити OTP через Telegram ---
// Повертає посилання на бота — клієнт сам переходить і отримує код
// Це єдиний можливий спосіб: бот не може писати першим без дозволу
app.post('/api/otp/send-telegram', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Вкажіть номер телефону' });

  // Кодуємо телефон у base64 щоб безпечно передати через URL
  const encodedPhone = Buffer.from(phone).toString('base64');
  const botUsername  = process.env.TG_BOT_USERNAME; // @SugarGlazeBot
  const botLink      = `https://t.me/${botUsername}?start=${encodedPhone}`;

  console.log(`📲 Telegram OTP запит для ${phone}`);
  // Повертаємо посилання — фронтенд відкриє його для клієнта
  res.json({ success: true, botLink });
});

// --- Відправити OTP через Email ---
app.post('/api/otp/send-email', async (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) return res.status(400).json({ error: 'Вкажіть email та телефон' });
  if (!mailer) return res.status(500).json({ error: 'Email не налаштований на сервері.' });

  const code = generateOTP();
  // Ключ — телефон, щоб верифікація була прив'язана до номера, а не до email
  saveOTP(phone, code);

  try {
    await mailer.sendMail({
      from: `"Sugar & Glaze" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🍰 Ваш код підтвердження замовлення',
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fdf8f3; border-radius: 12px;">
          <h2 style="color: #3d2b1f; font-size: 1.5rem; margin-bottom: 8px;">Sugar & Glaze</h2>
          <p style="color: #8a7060; margin-bottom: 24px;">Код підтвердження вашого замовлення:</p>
          <div style="background: white; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px; border: 2px solid #e8d5a0;">
            <span style="font-size: 2.5rem; font-weight: bold; color: #c9a84c; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #8a7060; font-size: 0.9rem;">Код дійсний <strong>5 хвилин</strong>. Не передавайте його нікому.</p>
        </div>
      `,
    });

    console.log(`📧 OTP відправлено на email ${email} для ${phone}`);
    res.json({ success: true });

  } catch (err) {
    console.error('Email помилка:', err.message);
    res.status(500).json({ error: 'Не вдалося відправити email. Перевірте налаштування Gmail.' });
  }
});

// --- Перевірити OTP ---
app.post('/api/otp/verify', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Вкажіть телефон та код' });

  const result = verifyOTP(phone, code.trim());

  if (!result.ok) {
    return res.status(400).json({ error: result.reason });
  }

  res.json({ success: true, verified: true });
});

// =============================================
// МАРШРУТИ: ТОВАРИ
// =============================================

// --- Multer (пам'ять, для Cloudinary) ---
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Лише зображення'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --- Завантажити фото ---
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не отримано' });

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sugar-and-glaze', resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    res.json({ success: true, imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Cloudinary: ' + err.message });
  }
});

// --- Отримати всі товари ---
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase.from('sweets').select('*').order('id');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// --- Додати товар (адмін) ---
app.post('/api/admin/products', async (req, res) => {
  const { name, price, description, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Назва та ціна обов'язкові" });

  const { data, error } = await supabase
    .from('sweets').insert([{ name, price: parseFloat(price), description, image_url }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, product: data[0] });
});

// --- Видалити товар (адмін) ---
app.delete('/api/admin/products/:id', async (req, res) => {
  const { data: product } = await supabase.from('sweets').select('image_url').eq('id', req.params.id).single();
  const { error } = await supabase.from('sweets').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });

  if (product?.image_url?.includes('cloudinary.com')) {
    try {
      const parts    = product.image_url.split('/');
      const idx      = parts.indexOf('upload');
      const publicId = parts.slice(idx + 2).join('/').replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    } catch (e) { console.warn('Cloudinary delete:', e.message); }
  }

  res.json({ success: true });
});

// =============================================
// МАРШРУТИ: ЗАМОВЛЕННЯ
// =============================================

// --- Зберегти замовлення ---
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_phone, customer_address, customer_email, items, order_id } = req.body;

  if (!customer_name || !customer_phone || !customer_address || !order_id) {
    return res.status(400).json({ error: "Заповніть ім'я, телефон, адресу та номер замовлення." });
  }

  const { verifiedItems, totalAmount, error: orderError } = await resolveOrderItems(items);
  if (orderError) {
    return res.status(400).json({ error: orderError });
  }

  const { data, error } = await supabase.from('orders').insert([{
    order_id, customer_name, customer_phone, customer_address,
    items: JSON.stringify(verifiedItems), total_amount: totalAmount, status: 'new',
  }]);

  if (error) return res.status(400).json({ error: error.message });

  // Сповіщення власнику магазину в Telegram (якщо є OWNER_CHAT_ID)
  if (process.env.OWNER_CHAT_ID) {
    const itemNames = verifiedItems.map(i => `• ${i.name} × ${i.qty}`).join('\n');
    bot.sendMessage(process.env.OWNER_CHAT_ID,
      `🛒 *Нове замовлення #${order_id}*\n\n` +
      `👤 ${customer_name}\n📞 ${customer_phone}\n📍 ${customer_address}\n\n` +
      `${itemNames}\n\n💰 *Сума: ${totalAmount} грн*\n💌 Демо-режим: без онлайн-оплати`,
      { parse_mode: 'Markdown' }
    ).catch(() => {});
  }

  const emailNotification = await sendOrderNotificationEmail({
    orderId: order_id,
    customerName: customer_name,
    customerPhone: customer_phone,
    customerAddress: customer_address,
    customerEmail: customer_email,
    verifiedItems,
    totalAmount,
  });

  res.json({
    success: true,
    data,
    order: {
      order_id,
      items: verifiedItems,
      total_amount: totalAmount,
      status: 'new',
    },
    notification: {
      emailSent: emailNotification.sent,
      emailTarget: emailNotification.sent ? emailNotification.recipient : null,
    },
  });
});

// --- Обробник помилок ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('зображення')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

// =============================================
// ЗАПУСК
// =============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Sugar & Glaze: http://localhost:${PORT}`);
  console.log(`🛠️  Адмін: http://localhost:${PORT}/admin.html`);
  console.log(`🤖 Telegram бот активний`);
});
