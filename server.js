
require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const { createEmailTransport } = require('./lib/email-delivery');
const { applySecurityHeaders, buildCorsOptions } = require('./lib/http-security');
const { normalizeProductPayload } = require('./lib/product-validation');
const {
  validateLoginInput,
  validateProfileInput,
  validateRegistrationInput,
} = require('./lib/auth-validation');
const {
  createSupabaseServiceHealthRequester,
  createSupabaseRestoreRequester,
  createSupabaseWakeHandler,
  isSupabaseUnavailableError,
  sendSupabaseWakeResponse,
} = require('./lib/supabase-wake');
const { isConfiguredValue, resolveSupabaseConfig } = require('./lib/supabase-config');
const {
  createRateLimiter,
  getClientIp,
  normalizeRateLimitKeyPart,
} = require('./lib/rate-limit');
const {
  ORDER_VERIFICATION_TTL_MS,
  ORDER_VERIFICATION_MAX_ATTEMPTS,
  cleanupExpiredOrderVerifications,
  clearPendingOrderVerification,
  createOrderVerificationId,
  generateOrderVerificationCode,
  getPendingOrderVerification,
  storePendingOrderVerification,
  updatePendingOrderVerificationAttempts,
  verifyOrderVerificationCode,
} = require('./lib/order-verifications');

const app = express();
const publicDir = path.join(__dirname, 'public');
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sg_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const ORDER_STATUSES = ['new', 'confirmed', 'completed', 'cancelled'];
const supabaseConfig = resolveSupabaseConfig(process.env);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(applySecurityHeaders);
app.use(cors(buildCorsOptions(process.env)));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.key
);
const restoreSupabaseProject = createSupabaseRestoreRequester({
  supabaseUrl: supabaseConfig.url,
  projectRef: process.env.SUPABASE_PROJECT_REF,
  accessToken: process.env.SUPABASE_MANAGEMENT_TOKEN,
});
const getSupabaseServiceHealth = createSupabaseServiceHealthRequester({
  supabaseUrl: supabaseConfig.url,
  projectRef: process.env.SUPABASE_PROJECT_REF,
  accessToken: process.env.SUPABASE_MANAGEMENT_TOKEN,
});

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const mailer = createEmailTransport(process.env, { nodemailerImpl: nodemailer });


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

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value ?? '').trim();
}

function trimText(value) {
  return String(value ?? '').trim();
}

function sendValidationErrors(res, errors, status = 400, fallbackMessage = 'Перевірте введені дані.') {
  return res.status(status).json({
    error: fallbackMessage,
    errors,
  });
}

function isCloudinaryImageUrl(value) {
  return String(value ?? '').includes('cloudinary.com/');
}

function getCloudinaryPublicIdFromUrl(imageUrl) {
  const normalizedUrl = trimText(imageUrl);
  if (!normalizedUrl || !isCloudinaryImageUrl(normalizedUrl)) {
    return null;
  }

  try {
    const { pathname } = new URL(normalizedUrl);
    const pathSegments = pathname.split('/').filter(Boolean);
    const uploadIndex = pathSegments.indexOf('upload');

    if (uploadIndex === -1) {
      return null;
    }

    let assetSegments = pathSegments.slice(uploadIndex + 1);
    const versionIndex = assetSegments.findIndex(segment => /^v\d+$/.test(segment));

    if (versionIndex !== -1) {
      assetSegments = assetSegments.slice(versionIndex + 1);
    } else if (assetSegments.length > 1) {
      assetSegments = assetSegments.slice(1);
    }

    if (assetSegments.length === 0) {
      return null;
    }

    assetSegments[assetSegments.length - 1] = assetSegments[assetSegments.length - 1]
      .replace(/\.[^/.?]+(?:\?.*)?$/, '');

    const publicId = assetSegments.join('/');
    return publicId || null;
  } catch {
    return null;
  }
}

function getEmailProductImageUrl(item) {
  if (item?.image_url) {
    return item.image_url;
  }

  try {
    const appUrl = trimText(process.env.APP_URL);
    return appUrl ? new URL('/favicon.svg', appUrl).href : '';
  } catch {
    return '';
  }
}

function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex === -1) return acc;
      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function getCookie(req, name) {
  return parseCookies(req.headers.cookie || '')[name];
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader('Set-Cookie');

  if (!existing) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieValue]);
    return;
  }

  res.setHeader('Set-Cookie', [existing, cookieValue]);
}

function serializeCookie(name, value, {
  maxAge,
  expires,
  path: cookiePath = '/',
  httpOnly = true,
  sameSite = 'Lax',
  secure = process.env.NODE_ENV === 'production',
} = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (cookiePath) parts.push(`Path=${cookiePath}`);
  if (typeof maxAge === 'number') parts.push(`Max-Age=${Math.max(0, Math.floor(maxAge))}`);
  if (expires instanceof Date) parts.push(`Expires=${expires.toUTCString()}`);
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  if (sameSite) parts.push(`SameSite=${sameSite}`);

  return parts.join('; ');
}

function setSessionCookie(res, sessionToken) {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE_NAME, sessionToken, {
    maxAge: SESSION_DURATION_MS / 1000,
  }));
}

function clearSessionCookie(res) {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    expires: new Date(0),
  }));
}

function createSessionToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;

  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const actualBuffer = Buffer.from(hash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

async function isProductImageStillUsed(imageUrl) {
  const normalizedUrl = trimText(imageUrl);
  if (!normalizedUrl) {
    return false;
  }

  const { data, error } = await supabase
    .from('sweets')
    .select('id')
    .eq('image_url', normalizedUrl)
    .limit(1);

  if (error) {
    console.warn('Cloudinary reference check:', error.message);
    return true;
  }

  return Array.isArray(data) && data.length > 0;
}

async function deleteCloudinaryImageIfUnused(imageUrl) {
  if (!cloudinaryConfigured || !isCloudinaryImageUrl(imageUrl)) {
    return;
  }

  if (await isProductImageStillUsed(imageUrl)) {
    return;
  }

  const publicId = getCloudinaryPublicIdFromUrl(imageUrl);
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (cloudinaryError) {
    console.warn('Cloudinary delete:', cloudinaryError.message);
  }
}

function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
    role: user.role,
  };
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
    .select('id, name, price, image_url')
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
      image_url: product.image_url || null,
      subtotal: roundMoney(price * qty),
    };
  });

  const totalAmount = roundMoney(
    verifiedItems.reduce((sum, item) => sum + item.subtotal, 0)
  );

  return { verifiedItems, totalAmount };
}

async function buildOrderDraft(body, currentUser) {
  const customerName = trimText(body.customer_name) || trimText(currentUser?.name);
  const customerPhone = normalizePhone(body.customer_phone) || normalizePhone(currentUser?.phone);
  const customerAddress = trimText(body.customer_address) || trimText(currentUser?.address);
  const customerEmail = normalizeEmail(body.customer_email) || normalizeEmail(currentUser?.email) || null;
  const orderId = trimText(body.order_id) || `SG-${Date.now()}-${crypto.randomInt(100, 1000)}`;

  if (!customerName || !customerPhone || !customerAddress || !customerEmail || !orderId) {
    return { error: "Заповніть ім'я, телефон, адресу, email та номер замовлення." };
  }

  const { verifiedItems, totalAmount, error: orderError } = await resolveOrderItems(body.items);
  if (orderError) {
    return { error: orderError };
  }

  return {
    draft: {
      orderId,
      userId: currentUser?.id || null,
      customerName,
      customerPhone,
      customerAddress,
      customerEmail,
      verifiedItems,
      totalAmount,
    },
  };
}

async function sendOrderVerificationCodeEmail({
  orderId,
  customerName,
  customerEmail,
  verifiedItems,
  totalAmount,
  verificationCode,
}) {
  if (!mailer || !customerEmail) {
    return { sent: false, skipped: true };
  }

  const previewItems = verifiedItems
    .slice(0, 3)
    .map(item => `${item.name} x ${item.qty}`)
    .join(', ');

  try {
    await mailer.sendMail({
      from: `"Sugar & Glaze" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `Код підтвердження для замовлення ${orderId}`,
      text:
`Вітаємо, ${customerName}!

Щоб підтвердити замовлення ${orderId}, введіть код:
${verificationCode}

Код дійсний 3 хвилини.
Сума замовлення: ${totalAmount} грн

Якщо це були не ви, просто проігноруйте цей лист.`,
      html: `
        <div style="margin:0;padding:24px 0;background:#f8efe6;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 20px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:linear-gradient(135deg,#fffaf5 0%,#f3e0c4 100%);border-radius:28px;overflow:hidden;">
                        <tr>
                          <td style="padding:34px 34px 30px;">
                            <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:#fff3d6;color:#8f6b19;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
                              Sugar &amp; Glaze
                            </div>
                            <h1 style="margin:18px 0 10px;font-family:Georgia,serif;font-size:34px;line-height:1.1;color:#3d2b1f;">
                              Підтвердьте замовлення
                            </h1>
                            <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#6f5a4b;">
                              ${escapeHtml(customerName)}, введіть код нижче на сайті, щоб завершити замовлення <strong>${escapeHtml(orderId)}</strong>.
                            </p>
                            <div style="display:inline-block;padding:18px 26px;border-radius:20px;background:#ffffff;color:#3d2b1f;font-size:32px;font-weight:700;letter-spacing:0.32em;">
                              ${escapeHtml(verificationCode)}
                            </div>
                            <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#6f5a4b;">
                              Код дійсний 3 хвилини. Якщо дані замовлення зміняться, запросіть новий код.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 20px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#ffffff;border-radius:24px;">
                        <tr>
                          <td style="padding:24px 28px;">
                            <h2 style="margin:0 0 14px;font-family:Georgia,serif;font-size:24px;color:#3d2b1f;">Коротко про замовлення</h2>
                            <div style="font-size:14px;line-height:1.8;color:#6f5a4b;">
                              Номер: <strong style="color:#3d2b1f;">${escapeHtml(orderId)}</strong><br/>
                              Сума: <strong style="color:#3d2b1f;">${totalAmount} грн</strong><br/>
                              Позиції: <strong style="color:#3d2b1f;">${escapeHtml(previewItems || 'Замовлення з каталогу')}</strong>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    return { sent: true, recipient: customerEmail };
  } catch (error) {
    console.error('Order verification email error:', error.message);
    return { sent: false, skipped: false, recipient: customerEmail };
  }
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
Статус: нове замовлення`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; background: #fdf8f3; color: #3d2b1f;">
          <h2 style="margin: 0 0 10px; font-family: Georgia, serif;">Нове замовлення ${escapeHtml(orderId)}</h2>
          <p style="margin: 0 0 24px; color: #7a675b;">Замовлення отримано через особистий кабінет / форму сайту.</p>
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

async function sendCustomerConfirmationEmail({
  orderId,
  customerName,
  customerEmail,
  verifiedItems,
  totalAmount,
}) {
  if (!mailer || !customerEmail) {
    return { sent: false, skipped: true };
  }

  const itemsHtml = verifiedItems.map(item => {
    const imageUrl = getEmailProductImageUrl(item);
    const imageCell = imageUrl
      ? `
            <td style="width:124px;padding:14px;vertical-align:top;">
              <img
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(item.name)}"
                width="110"
                height="86"
                style="display:block;width:110px;height:86px;object-fit:cover;border-radius:12px;border:0;background:#f6ead8;"
              />
            </td>`
      : '';

    return `
    <tr>
      <td style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fffaf6;border:1px solid #f0e2d3;border-radius:16px;">
          <tr>
            ${imageCell}
            <td style="padding:14px 14px 14px 0;vertical-align:top;">
              <div style="font-size:17px;font-weight:700;line-height:1.35;color:#3d2b1f;margin-bottom:6px;">${escapeHtml(item.name)}</div>
              <div style="font-size:13px;line-height:1.6;color:#866f61;">
                Кількість: <strong style="color:#3d2b1f;">${item.qty}</strong><br/>
                Ціна за одиницю: <strong style="color:#3d2b1f;">${item.price} грн</strong>
              </div>
              <div style="margin-top:10px;font-size:15px;font-weight:700;color:#b07b22;">Разом: ${item.subtotal} грн</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');

  const itemsText = verifiedItems
    .map(item => `- ${item.name}: ${item.qty} шт. = ${item.subtotal} грн`)
    .join('\n');

  try {
    await mailer.sendMail({
      from: `"Sugar & Glaze" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `Підтвердження замовлення ${orderId}`,
      text:
`Вітаємо, ${customerName}!

Ваше замовлення ${orderId} прийнято.

Склад замовлення:
${itemsText}

Сума: ${totalAmount} грн

Ми зв'яжемося з вами для уточнення деталей.`,
      html: `
        <div style="margin:0;padding:24px 0;background:#f8efe6;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 20px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:linear-gradient(135deg,#fffaf5 0%,#f3e0c4 100%);border-radius:28px;overflow:hidden;">
                        <tr>
                          <td style="padding:34px 34px 28px;">
                            <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:#fff3d6;color:#8f6b19;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
                              Sugar &amp; Glaze
                            </div>
                            <h1 style="margin:18px 0 10px;font-family:Georgia,serif;font-size:34px;line-height:1.1;color:#3d2b1f;">
                              Замовлення підтверджено
                            </h1>
                            <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#6f5a4b;">
                              Дякуємо, ${escapeHtml(customerName)}. Ми отримали ваше замовлення <strong>${escapeHtml(orderId)}</strong>.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                              <tr>
                                <td style="padding:0;">
                                  <div style="display:inline-block;padding:14px 18px;border-radius:18px;background:#ffffff;color:#3d2b1f;font-size:15px;font-weight:700;">
                                    Загальна сума: ${totalAmount} грн
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 20px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#ffffff;border-radius:24px;">
                        <tr>
                          <td style="padding:28px 28px 22px;">
                            <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;color:#3d2b1f;">Склад замовлення</h2>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                              <tbody>${itemsHtml}</tbody>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 20px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#ffffff;border-radius:24px;">
                        <tr>
                          <td style="padding:24px 28px;">
                            <div style="font-size:14px;line-height:1.7;color:#6f5a4b;">
                              Ми зв'яжемося з вами для уточнення деталей замовлення.<br/>
                              Якщо потрібні зміни, просто відповідайте на цей лист.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    return { sent: true, recipient: customerEmail };
  } catch (error) {
    console.error('Customer confirmation email error:', error.message);
    return { sent: false, recipient: customerEmail, error: error.message };
  }
}

async function persistOrderFromDraft(draft) {
  const { data, error } = await supabase.from('orders').insert([{
    order_id: draft.orderId,
    user_id: draft.userId,
    customer_name: draft.customerName,
    customer_phone: draft.customerPhone,
    customer_address: draft.customerAddress,
    customer_email: draft.customerEmail,
    items: draft.verifiedItems,
    total_amount: draft.totalAmount,
    status: 'new',
  }]);

  if (error) {
    return { error };
  }

  return { data };
}


async function createSession(userId) {
  const sessionToken = createSessionToken();
  const sessionHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  const { error } = await supabase.from('auth_sessions').insert([{
    user_id: userId,
    session_token_hash: sessionHash,
    expires_at: expiresAt,
  }]);

  if (error) throw error;

  return { sessionToken, expiresAt };
}

async function deleteSessionByToken(sessionToken) {
  if (!sessionToken) return;

  await supabase
    .from('auth_sessions')
    .delete()
    .eq('session_token_hash', hashSessionToken(sessionToken));
}

async function getCurrentUserFromRequest(req) {
  const sessionToken = getCookie(req, SESSION_COOKIE_NAME);
  if (!sessionToken) return null;

  const { data: session, error: sessionError } = await supabase
    .from('auth_sessions')
    .select('user_id, expires_at')
    .eq('session_token_hash', hashSessionToken(sessionToken))
    .maybeSingle();

  if (sessionError || !session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await deleteSessionByToken(sessionToken);
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email, phone, address, role')
    .eq('id', session.user_id)
    .maybeSingle();

  if (userError || !user) {
    await deleteSessionByToken(sessionToken);
    return null;
  }

  return sanitizeUser(user);
}

async function attachCurrentUser(req, res, next) {
  try {
    req.currentUser = await getCurrentUserFromRequest(req);
  } catch (error) {
    console.error('Session resolve error:', error.message);
    req.currentUser = null;
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Потрібно увійти в акаунт.' });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Потрібно увійти як адміністратор.' });
  }

  if (req.currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ дозволено лише адміністратору.' });
  }

  next();
}

function requireAdminPage(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.redirect('/auth.html?mode=admin&next=/admin.html');
  }

  next();
}

function requireUserPage(req, res, next) {
  if (!req.currentUser) {
    return res.redirect('/auth.html?next=/account.html');
  }

  next();
}

async function cleanupExpiredSessions() {
  const { error } = await supabase
    .from('auth_sessions')
    .delete()
    .lte('expires_at', new Date().toISOString());

  if (error) {
    console.warn('Session cleanup:', error.message);
  }
}

async function runMaintenanceCleanup() {
  await Promise.all([
    cleanupExpiredSessions(),
    cleanupExpiredOrderVerifications(supabase),
  ]);
}

function rateLimitKey(...parts) {
  return parts.map(normalizeRateLimitKeyPart).join(':');
}

function currentUserOrIpKey(req) {
  if (req.currentUser?.id) {
    return `user:${req.currentUser.id}`;
  }

  return `ip:${getClientIp(req)}`;
}

async function clearPendingOrderVerificationQuietly(verificationId) {
  try {
    await clearPendingOrderVerification(supabase, verificationId);
  } catch (error) {
    console.warn('Order verification cleanup:', error.message);
  }
}

const registerRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Забагато спроб реєстрації. Спробуйте ще раз пізніше.',
  keyGenerator: req => rateLimitKey('register', getClientIp(req), normalizeEmail(req.body?.email)),
});

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Забагато спроб входу. Спробуйте ще раз пізніше.',
  keyGenerator: req => rateLimitKey('login', getClientIp(req), normalizeEmail(req.body?.email)),
});

const sendOrderVerificationRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Забагато запитів коду підтвердження. Спробуйте ще раз пізніше.',
  keyGenerator: req => rateLimitKey('order-code-send', currentUserOrIpKey(req)),
});

const verifyOrderRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Забагато спроб перевірки коду. Запросіть новий код пізніше.',
  keyGenerator: req => rateLimitKey(
    'order-code-verify',
    currentUserOrIpKey(req),
    trimText(req.body?.verification_id)
  ),
});

const supabaseWakeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Забагато health-запитів. Спробуйте трохи пізніше.',
  keyGenerator: req => rateLimitKey('supabase-wake', getClientIp(req)),
});


app.use('/api', attachCurrentUser);

app.get(
  '/api/health/supabase',
  supabaseWakeRateLimiter,
  createSupabaseWakeHandler({
    supabase,
    restoreProject: restoreSupabaseProject,
    getServiceHealth: getSupabaseServiceHealth,
  })
);

app.get('/api/auth/me', (req, res) => {
  res.json({
    authenticated: Boolean(req.currentUser),
    user: req.currentUser || null,
  });
});

app.post('/api/auth/register', registerRateLimiter, async (req, res) => {
  const { payload, errors } = validateRegistrationInput(req.body);

  if (errors.length) {
    return sendValidationErrors(res, errors);
  }

  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('email', payload.email)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({ error: 'Не вдалося перевірити email. Спробуйте ще раз.' });
  }

  if (existingUser) {
    return sendValidationErrors(
      res,
      [{ field: 'email', message: 'Користувач із таким email уже існує.' }],
      409,
      'Користувач із таким email уже існує.'
    );
  }

  const { salt, hash } = hashPassword(payload.password);
  const { data: createdUser, error: insertError } = await supabase
    .from('users')
    .insert([{
      full_name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      role: 'customer',
      password_hash: hash,
      password_salt: salt,
    }])
    .select('id, full_name, email, phone, address, role')
    .single();

  if (insertError || !createdUser) {
    return res.status(500).json({ error: 'Не вдалося створити акаунт.' });
  }

  try {
    const session = await createSession(createdUser.id);
    setSessionCookie(res, session.sessionToken);
  } catch (error) {
    return res.status(500).json({ error: 'Акаунт створено, але не вдалося відкрити сесію.' });
  }

  res.json({
    success: true,
    user: sanitizeUser(createdUser),
  });
});

app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
  const { payload, errors } = validateLoginInput(req.body);
  const adminOnly = req.body.admin === true || req.body.admin === 'true';

  if (errors.length) {
    return sendValidationErrors(res, errors);
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, address, role, password_hash, password_salt')
    .eq('email', payload.email)
    .maybeSingle();

  if (error || !user || !verifyPassword(payload.password, user.password_salt, user.password_hash)) {
    return sendValidationErrors(
      res,
      [
        { field: 'email', message: 'Невірний email або пароль.' },
        { field: 'password', message: 'Невірний email або пароль.' },
      ],
      401,
      'Невірний email або пароль.'
    );
  }

  if (adminOnly && user.role !== 'admin') {
    return res.status(403).json({ error: 'Цей акаунт не має прав адміністратора.' });
  }

  try {
    const session = await createSession(user.id);
    setSessionCookie(res, session.sessionToken);
  } catch (sessionError) {
    return res.status(500).json({ error: 'Не вдалося створити сесію.' });
  }

  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/logout', async (req, res) => {
  const sessionToken = getCookie(req, SESSION_COOKIE_NAME);

  if (sessionToken) {
    await deleteSessionByToken(sessionToken);
  }

  clearSessionCookie(res);
  res.json({ success: true });
});

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const { payload, errors } = validateProfileInput(req.body);

  if (errors.length) {
    return sendValidationErrors(res, errors);
  }

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      full_name: payload.name,
      phone: payload.phone,
      address: payload.address,
    })
    .eq('id', req.currentUser.id)
    .select('id, full_name, email, phone, address, role')
    .single();

  if (error || !updatedUser) {
    return res.status(500).json({ error: 'Не вдалося оновити профіль.' });
  }

  res.json({
    success: true,
    user: sanitizeUser(updatedUser),
  });
});


const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Лише зображення'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post('/api/upload', requireAdmin, upload.single('image'), async (req, res) => {
  if (!cloudinaryConfigured) {
    return res.status(500).json({ error: 'Cloudinary не налаштований.' });
  }

  if (!req.file) return res.status(400).json({ error: 'Файл не отримано' });

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'sugar-and-glaze',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, uploadResult) => error ? reject(error) : resolve(uploadResult)
      );

      stream.end(req.file.buffer);
    });

    res.json({ success: true, imageUrl: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: 'Cloudinary: ' + error.message });
  }
});

app.post('/api/admin/images/remove', requireAdmin, async (req, res) => {
  const imageUrl = trimText(req.body.image_url);

  if (!imageUrl) {
    return res.status(400).json({ error: 'Не вказано адресу зображення.' });
  }

  await deleteCloudinaryImageIfUnused(imageUrl);
  res.json({ success: true });
});

app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sweets').select('*').order('id');
    if (error) {
      if (isSupabaseUnavailableError(error)) {
        return sendSupabaseWakeResponse(res, {
          restoreProject: restoreSupabaseProject,
          getServiceHealth: getSupabaseServiceHealth,
        });
      }

      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    if (isSupabaseUnavailableError(error)) {
      return sendSupabaseWakeResponse(res, {
        restoreProject: restoreSupabaseProject,
        getServiceHealth: getSupabaseServiceHealth,
      });
    }

    res.status(500).json({ error: 'Не вдалося завантажити товари.' });
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  const { payload, error: validationError } = normalizeProductPayload(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { data, error } = await supabase
    .from('sweets')
    .insert([payload])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, product: data[0] });
});

async function updateAdminProduct(req, res) {
  const { payload, error: validationError } = normalizeProductPayload(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { data: existingProduct, error: existingProductError } = await supabase
    .from('sweets')
    .select('id, image_url')
    .eq('id', req.params.id)
    .maybeSingle();

  if (existingProductError || !existingProduct) {
    return res.status(404).json({ error: 'Товар не знайдено.' });
  }

  const { data, error } = await supabase
    .from('sweets')
    .update(payload)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(400).json({ error: 'Не вдалося оновити товар.' });
  }

  const previousImageUrl = trimText(existingProduct.image_url);
  const nextImageUrl = trimText(data.image_url);

  if (previousImageUrl && previousImageUrl !== nextImageUrl) {
    await deleteCloudinaryImageIfUnused(previousImageUrl);
  }

  res.json({ success: true, product: data });
}

async function deleteAdminProduct(req, res) {
  const { data: product, error: productError } = await supabase
    .from('sweets')
    .select('image_url')
    .eq('id', req.params.id)
    .maybeSingle();

  if (productError || !product) {
    return res.status(404).json({ error: 'Товар не знайдено.' });
  }

  const { error } = await supabase
    .from('sweets')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });

  await deleteCloudinaryImageIfUnused(product.image_url);

  res.json({ success: true });
}

app.all('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  if (req.method === 'PATCH' || req.method === 'PUT' || req.method === 'POST') {
    return updateAdminProduct(req, res);
  }

  if (req.method === 'DELETE') {
    return deleteAdminProduct(req, res);
  }

  next();
});


app.post('/api/orders/send-verification', requireAuth, sendOrderVerificationRateLimiter, async (req, res) => {
  if (!mailer) {
    return res.status(500).json({ error: 'Email-підтвердження зараз недоступне.' });
  }

  const { draft, error: draftError } = await buildOrderDraft(req.body, req.currentUser);
  if (draftError) {
    return res.status(400).json({ error: draftError });
  }

  const verificationId = createOrderVerificationId();
  const verificationCode = generateOrderVerificationCode();

  try {
    await storePendingOrderVerification(supabase, {
      verificationId,
      verificationCode,
      userId: req.currentUser.id,
      draft,
    });
  } catch (error) {
    console.error('Order verification store error:', error.message);
    return res.status(500).json({ error: 'Не вдалося підготувати код підтвердження.' });
  }

  const verificationEmail = await sendOrderVerificationCodeEmail({
    orderId: draft.orderId,
    customerName: draft.customerName,
    customerEmail: draft.customerEmail,
    verifiedItems: draft.verifiedItems,
    totalAmount: draft.totalAmount,
    verificationCode,
  });

  if (!verificationEmail.sent) {
    await clearPendingOrderVerificationQuietly(verificationId);
    return res.status(500).json({ error: 'Не вдалося надіслати код підтвердження на email.' });
  }

  res.json({
    success: true,
    verification_id: verificationId,
    expires_in_minutes: Math.ceil(ORDER_VERIFICATION_TTL_MS / 60000),
    order: {
      order_id: draft.orderId,
      total_amount: draft.totalAmount,
    },
    customer_email: draft.customerEmail,
  });
});

app.post('/api/orders/verify', requireAuth, verifyOrderRateLimiter, async (req, res) => {
  const verificationId = trimText(req.body.verification_id);
  const verificationCode = String(req.body.verification_code || '').trim();

  if (!verificationId || !verificationCode) {
    return res.status(400).json({ error: 'Введіть код підтвердження з email.' });
  }

  let pendingVerification;

  try {
    pendingVerification = await getPendingOrderVerification(supabase, verificationId);
  } catch (error) {
    console.error('Order verification read error:', error.message);
    return res.status(500).json({ error: 'Не вдалося перевірити код. Спробуйте ще раз.' });
  }

  if (!pendingVerification) {
    return res.status(410).json({ error: 'Код прострочено. Надішліть новий код.' });
  }

  if (pendingVerification.userId !== req.currentUser.id) {
    await clearPendingOrderVerificationQuietly(verificationId);
    return res.status(403).json({ error: 'Цей код підтвердження належить іншому акаунту.' });
  }

  if (pendingVerification.attempts >= ORDER_VERIFICATION_MAX_ATTEMPTS) {
    await clearPendingOrderVerificationQuietly(verificationId);
    return res.status(429).json({ error: 'Ліміт спроб вичерпано. Надішліть новий код.' });
  }

  if (!verifyOrderVerificationCode(
    verificationCode,
    pendingVerification.salt,
    pendingVerification.hash
  )) {
    const nextAttempts = pendingVerification.attempts + 1;

    if (nextAttempts >= ORDER_VERIFICATION_MAX_ATTEMPTS) {
      await clearPendingOrderVerificationQuietly(verificationId);
      return res.status(429).json({ error: 'Ліміт спроб вичерпано. Надішліть новий код.' });
    }

    try {
      await updatePendingOrderVerificationAttempts(supabase, verificationId, nextAttempts);
    } catch (error) {
      console.error('Order verification attempt update error:', error.message);
      return res.status(500).json({ error: 'Не вдалося оновити кількість спроб.' });
    }

    return res.status(400).json({ error: 'Невірний код підтвердження.' });
  }

  const draft = pendingVerification.draft;
  const { data, error } = await persistOrderFromDraft(draft);

  if (error) {
    if (error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate')) {
      await clearPendingOrderVerificationQuietly(verificationId);
      return res.status(409).json({ error: 'Замовлення з таким номером уже існує. Надішліть новий код.' });
    }

    return res.status(400).json({ error: error.message });
  }

  await clearPendingOrderVerificationQuietly(verificationId);

  const emailNotification = await sendOrderNotificationEmail({
    orderId: draft.orderId,
    customerName: draft.customerName,
    customerPhone: draft.customerPhone,
    customerAddress: draft.customerAddress,
    customerEmail: draft.customerEmail,
    verifiedItems: draft.verifiedItems,
    totalAmount: draft.totalAmount,
  });
  const customerConfirmation = await sendCustomerConfirmationEmail({
    orderId: draft.orderId,
    customerName: draft.customerName,
    customerEmail: draft.customerEmail,
    verifiedItems: draft.verifiedItems,
    totalAmount: draft.totalAmount,
  });

  res.json({
    success: true,
    data,
    order: {
      order_id: draft.orderId,
      items: draft.verifiedItems,
      total_amount: draft.totalAmount,
      status: 'new',
    },
    notification: {
      storeEmailSent: emailNotification.sent,
      storeEmailTarget: emailNotification.sent ? emailNotification.recipient : null,
      customerEmailSent: customerConfirmation.sent,
      customerEmailTarget: customerConfirmation.sent ? customerConfirmation.recipient : null,
    },
  });
});

app.post('/api/orders', requireAuth, async (req, res) => {
  res.status(409).json({ error: 'Спершу надішліть код підтвердження на email.' });
});

app.get('/api/account/orders', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, customer_name, customer_phone, customer_address, customer_email, total_amount, status, created_at, items')
    .eq('user_id', req.currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json((data || []).map(order => ({
    ...order,
    items: parseJsonField(order.items, []),
  })));
});

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, customer_name, customer_phone, customer_address, customer_email, total_amount, status, created_at, items')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json((data || []).map(order => ({
    ...order,
    items: parseJsonField(order.items, []),
  })));
});

app.patch('/api/admin/orders/:orderId/status', requireAdmin, async (req, res) => {
  const nextStatus = trimText(req.body.status).toLowerCase();

  if (!ORDER_STATUSES.includes(nextStatus)) {
    return res.status(400).json({ error: 'Некоректний статус замовлення.' });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: nextStatus })
    .eq('order_id', req.params.orderId)
    .select('order_id, status')
    .maybeSingle();

  if (error || !data) {
    return res.status(400).json({ error: 'Не вдалося оновити статус замовлення.' });
  }

  res.json({ success: true, order: data });
});


app.get('/admin.html', attachCurrentUser, requireAdminPage, (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('/account.html', attachCurrentUser, requireUserPage, (req, res) => {
  res.sendFile(path.join(publicDir, 'account.html'));
});

app.get('/auth.html', attachCurrentUser, (req, res) => {
  if (req.query.mode !== 'admin' && req.currentUser) {
    return res.redirect('/account.html');
  }

  res.sendFile(path.join(publicDir, 'auth.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});


app.use(express.static(publicDir));


app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('зображення')) {
    return res.status(400).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});


const PORT = process.env.PORT || 3000;
const cleanupTimer = setInterval(runMaintenanceCleanup, 15 * 60 * 1000);
cleanupTimer.unref?.();
const startupCleanupTimer = setTimeout(runMaintenanceCleanup, 30 * 1000);
startupCleanupTimer.unref?.();

app.listen(PORT, () => {
  console.log(`✅ Sugar & Glaze: http://localhost:${PORT}`);
  console.log(`🛠️  Адмін: http://localhost:${PORT}/admin.html`);
  console.log(mailer ? `📧 Email підтвердження увімкнено (${mailer.provider || 'smtp'})` : '📧 Email підтвердження вимкнено');
});
