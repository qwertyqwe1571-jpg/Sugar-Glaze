const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createEmailTransport,
} = require('../lib/email-delivery');

test('uses Brevo HTTPS API when a Brevo API key is configured', async () => {
  const calls = [];
  const transport = createEmailTransport({
    BREVO_API_KEY: 'brevo-api-key',
    BREVO_SENDER_EMAIL: 'sender@example.com',
    BREVO_SENDER_NAME: 'Sugar & Glaze',
    ORDER_NOTIFICATIONS_EMAIL: 'orders@example.com',
  }, {
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 201,
        json: async () => ({ messageId: '<message-id@brevo>' }),
      };
    },
  });

  assert.equal(transport.provider, 'brevo');

  const result = await transport.sendMail({
    to: 'customer@example.com',
    subject: 'Код підтвердження',
    text: 'Ваш код: 123456',
    html: '<strong>Ваш код: 123456</strong>',
    replyTo: 'reply@example.com',
  });

  assert.equal(result.messageId, '<message-id@brevo>');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['api-key'], 'brevo-api-key');

  const payload = JSON.parse(calls[0].options.body);
  assert.deepEqual(payload.sender, {
    name: 'Sugar & Glaze',
    email: 'sender@example.com',
  });
  assert.deepEqual(payload.to, [{ email: 'customer@example.com' }]);
  assert.deepEqual(payload.replyTo, { email: 'reply@example.com' });
  assert.equal(payload.subject, 'Код підтвердження');
  assert.equal(payload.htmlContent, '<strong>Ваш код: 123456</strong>');
  assert.equal(Object.hasOwn(payload, 'textContent'), false);
});

test('falls back to Gmail SMTP transport when Brevo is not configured', () => {
  const calls = [];
  const fakeNodemailer = {
    createTransport(options) {
      calls.push(options);
      return { provider: 'gmail' };
    },
  };

  const transport = createEmailTransport({
    GMAIL_USER: 'local@example.com',
    GMAIL_APP_PASSWORD: 'app-password',
  }, {
    nodemailerImpl: fakeNodemailer,
  });

  assert.deepEqual(calls, [{
    service: 'gmail',
    auth: {
      user: 'local@example.com',
      pass: 'app-password',
    },
  }]);
  assert.equal(transport.provider, 'gmail');
});

test('does not configure email delivery without Brevo or Gmail credentials', () => {
  const transport = createEmailTransport({});

  assert.equal(transport, null);
});
