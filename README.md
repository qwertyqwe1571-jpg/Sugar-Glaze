# Sugar & Glaze

## Українська версія

Sugar & Glaze - вебзастосунок для кондитерського магазину, у якому клієнт переглядає каталог десертів, додає позиції до кошика, підтверджує замовлення через email-код і бачить власну історію замовлень. Адміністратор працює з окремою захищеною панеллю: додає, редагує й видаляє товари, завантажує зображення та змінює статуси замовлень.

Проєкт побудований як серверний застосунок на Node.js та Express. Клієнтська частина розміщена у папці `public`, стилі пишуться у `public/style.scss` і збираються у `public/style.css`. Дані зберігаються у Supabase, зображення товарів завантажуються в Cloudinary, а email-повідомлення надсилаються через Brevo або локальний Gmail SMTP fallback.

### Основні можливості

- Каталог десертів із зображеннями, описами та цінами.
- Кошик із кількістю товарів, підсумковою сумою, прокручуванням списку та мініатюрами товарів.
- Оформлення замовлення з email-підтвердженням.
- Особистий кабінет клієнта з історією замовлень.
- Адмін-панель для керування товарами, зображеннями та статусами замовлень.
- Автоматична перевірка доступності Supabase під час відкриття головної сторінки.
- Модальне вікно очікування, якщо безкоштовний Supabase-проєкт призупинений або ще запускається.
- Обмеження частоти запитів для реєстрації, входу та підтвердження замовлень.
- Автоматизовані тести на серверну логіку, безпеку, поштову доставку та ключові елементи інтерфейсу.

### Вимоги

- Node.js 20 або новіше.
- npm.
- Активний Supabase-проєкт.
- Cloudinary-обліковий запис для збереження зображень товарів.
- Brevo API key для пошти на Render.
- Gmail app password як локальний запасний спосіб надсилання пошти.

### Локальний запуск

Встановіть залежності:

```powershell
npm install
```

Створіть локальний `.env` на основі прикладу:

```powershell
Copy-Item .env.example .env
```

Заповніть `.env` реальними значеннями. Не додавайте `.env` у Git. Сервер використовує `SUPABASE_SERVICE_ROLE_KEY`; `SUPABASE_ANON_KEY` залишено лише як довідкову змінну і не є запасним ключем для серверного доступу.

Запуск у режимі розробки:

```powershell
npm run dev
```

Якщо у `.env` вказано `PORT=3100`, сайт відкривається за адресою:

```text
http://localhost:3100
```

### Змінні середовища

Основні змінні описані у `.env.example`.

Важливі групи налаштувань:

- `APP_URL`, `CORS_ORIGIN`, `SESSION_COOKIE_NAME` - адреса застосунку, дозволені джерела запитів і назва cookie сесії.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - серверне підключення до Supabase.
- `SUPABASE_PROJECT_REF`, `SUPABASE_MANAGEMENT_TOKEN` - необов'язкові змінні для автоматичного запиту на відновлення призупиненого Supabase-проєкту та отримання станів сервісів.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - завантаження і видалення зображень товарів.
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` - рекомендована пошта для Render, бо Brevo працює через HTTPS API.
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` - локальний запасний SMTP-варіант.
- `ORDER_NOTIFICATIONS_EMAIL` - пошта, на яку приходять повідомлення про нові замовлення.

Не зберігайте реальні ключі, токени або паролі в README, комітах, скриншотах чи публічних обговореннях.

### База даних

Supabase використовується як основне сховище даних. У ньому зберігаються користувачі, сесії, товари, замовлення та записи підтвердження замовлень. Сервер звертається до Supabase через service role key, тому доступ до цього ключа має бути тільки на сервері або в Render Environment Variables.

Папка `database/` не публікується в Git і додана в `.gitignore`. Перед розгортанням потрібно виконати актуальний SQL-скрипт схеми з локальної приватної копії проєкту або іншого внутрішнього джерела. Демонстраційні seed-файли не призначені для production-бази.

### Supabase wake flow

На безкоштовному плані Supabase проєкт може бути призупинений після простою. Під час відкриття головної сторінки браузер викликає `/api/health/supabase`. Сервер робить легкий запит до таблиці товарів, а якщо база недоступна, повертає стан очікування.

Якщо налаштовані `SUPABASE_MANAGEMENT_TOKEN` і `SUPABASE_PROJECT_REF`, сервер також може надіслати запит на відновлення проєкту через Supabase Management API. На сторінці показується модальне вікно зі станами сервісів, наприклад Database, PostgREST, Auth, Realtime, Storage і Pooler. Коли база відповідає, модальне вікно плавно зникає, а каталог завантажується повторно.

### Пошта

Основний спосіб надсилання пошти для Render - Brevo Transactional Email API. Він працює через HTTPS, тому краще підходить для безкоштовного Render, де SMTP-порти можуть бути недоступні.

Gmail SMTP залишено як локальний запасний механізм. Його можна використовувати під час розробки, якщо створено Gmail app password. Повідомлення про нові замовлення надсилаються на `ORDER_NOTIFICATIONS_EMAIL`, а клієнт отримує код підтвердження і лист про успішне оформлення.

### Зображення

Cloudinary використовується для збереження зображень товарів. Адміністратор завантажує файл через форму адмін-панелі, сервер передає його у Cloudinary, а в Supabase зберігається URL зображення. Під час видалення або заміни товару сервер також може прибрати пов'язане зображення з Cloudinary.

### Команди

```powershell
npm run dev
npm run build
npm start
npm test
```

Пояснення:

- `npm run dev` запускає сервер і Sass watcher.
- `npm run build` збирає `public/style.scss` у `public/style.css`.
- `npm start` запускає сервер без watcher.
- `npm test` запускає автоматизовані тести через Node.js test runner.

### Render

Для Render використовується Web Service.

Рекомендовані налаштування:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: `Node`
- `NODE_ENV=production`
- `APP_URL` і `CORS_ORIGIN` мають дорівнювати адресі Render-сервісу без зайвого `/` у кінці.
- Усі ключі Supabase, Cloudinary, Brevo і пошти потрібно додавати тільки через Render Environment Variables.

Після зміни environment variables на Render потрібно перезапустити або redeploy сервіс, щоб Node.js процес отримав нові значення.

### Безпека

- Сервер не використовує Supabase anon key як fallback для службових операцій.
- Service role key зберігається тільки на сервері.
- Сесії працюють через HTTP cookie.
- Для критичних маршрутів є rate limiting.
- Коди підтвердження не зберігаються відкритим текстом.
- Значення `items` у замовленнях має зберігатися як JSON-структура.
- Публічний Git не містить `.env`, `database/`, `output/` і локальні службові файли.

---

## English Version

Sugar & Glaze is a web application for a dessert shop. Customers can browse desserts, add items to the cart, confirm an order with an email code, and view their order history. Administrators use a protected admin panel to create, update, and delete products, upload images, and manage order statuses.

The project is built as a Node.js and Express server application. The client files live in `public`, styles are written in `public/style.scss`, and the compiled stylesheet is `public/style.css`. Data is stored in Supabase, product images are uploaded to Cloudinary, and transactional emails are sent through Brevo or a local Gmail SMTP fallback.

### Main Features

- Dessert catalog with images, descriptions, and prices.
- Cart with item quantities, total amount, scrollable item list, and product thumbnails.
- Order checkout with email verification.
- Customer account page with order history.
- Admin panel for products, images, and order statuses.
- Supabase availability check when the storefront opens.
- Startup modal when a free Supabase project is paused or still starting.
- Rate limiting for registration, login, and order verification endpoints.
- Automated tests for backend logic, security, email delivery, and important UI files.

### Requirements

- Node.js 20 or newer.
- npm.
- Active Supabase project.
- Cloudinary account for product images.
- Brevo API key for email delivery on Render.
- Gmail app password as a local email fallback.

### Local Setup

Install dependencies:

```powershell
npm install
```

Create a local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Fill `.env` with real values. Do not commit `.env`. The server uses `SUPABASE_SERVICE_ROLE_KEY`; `SUPABASE_ANON_KEY` is kept only as a reference variable and is not used as a server fallback.

Start the development environment:

```powershell
npm run dev
```

If `PORT=3100` is set in `.env`, open:

```text
http://localhost:3100
```

### Environment Variables

The main variables are documented in `.env.example`.

Important groups:

- `APP_URL`, `CORS_ORIGIN`, `SESSION_COOKIE_NAME` - application origin, allowed request origins, and session cookie name.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - server-side Supabase connection.
- `SUPABASE_PROJECT_REF`, `SUPABASE_MANAGEMENT_TOKEN` - optional variables for requesting a restore of a paused Supabase project and reading service health states.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - image upload and removal.
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` - recommended email delivery on Render because Brevo uses an HTTPS API.
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` - local SMTP fallback.
- `ORDER_NOTIFICATIONS_EMAIL` - recipient for store order notifications.

Do not store real keys, tokens, or passwords in README files, commits, screenshots, or public messages.

### Database

Supabase is the primary data store. It stores users, sessions, products, orders, and order verification rows. The server accesses Supabase with a service role key, so that key must exist only on the server or inside Render Environment Variables.

The `database/` folder is not published to Git and is listed in `.gitignore`. Before deployment, run the current schema SQL from the local private project copy or another internal source. Demo seed files are not intended for the production database.

### Supabase Wake Flow

On the free Supabase plan, a project can be paused after inactivity. When the storefront opens, the browser calls `/api/health/supabase`. The server sends a lightweight query to the products table. If the database is unavailable, the endpoint returns a waiting state.

If `SUPABASE_MANAGEMENT_TOKEN` and `SUPABASE_PROJECT_REF` are configured, the server can also request project restore through the Supabase Management API. The storefront shows a modal with service states such as Database, PostgREST, Auth, Realtime, Storage, and Pooler. Once the database responds, the modal fades out and the catalog reloads.

### Email Delivery

The recommended production email provider for Render is Brevo Transactional Email API. It uses HTTPS, which makes it more reliable on Render Free than SMTP.

Gmail SMTP is kept as a local fallback. It can be used during development with a Gmail app password. Store notifications are sent to `ORDER_NOTIFICATIONS_EMAIL`, while the customer receives the verification code and order confirmation email.

### Images

Cloudinary stores product images. An administrator uploads an image through the admin form, the server sends it to Cloudinary, and the resulting image URL is stored in Supabase. When a product image is replaced or removed, the server can also remove the old Cloudinary asset.

### Commands

```powershell
npm run dev
npm run build
npm start
npm test
```

Command overview:

- `npm run dev` starts the server and Sass watcher.
- `npm run build` compiles `public/style.scss` into `public/style.css`.
- `npm start` starts the server without the watcher.
- `npm test` runs the automated test suite with the Node.js test runner.

### Render

Use a Render Web Service.

Recommended settings:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: `Node`
- `NODE_ENV=production`
- `APP_URL` and `CORS_ORIGIN` should match the Render service URL without a trailing `/`.
- All Supabase, Cloudinary, Brevo, and email secrets should be added only through Render Environment Variables.

After changing environment variables on Render, restart or redeploy the service so the Node.js process receives the new values.

### Security

- The server does not use Supabase anon key as a fallback for privileged operations.
- The service role key stays server-side only.
- Sessions use HTTP cookies.
- Critical routes are rate limited.
- Verification codes are not stored as plain text.
- Order `items` should be stored as a JSON structure.
- The public Git repository does not include `.env`, `database/`, `output/`, or local service files.
