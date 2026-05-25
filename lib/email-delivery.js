const BREVO_SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

function trimConfiguredValue(value) {
  const trimmed = String(value ?? '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function isConfiguredValue(value, placeholderFragments = []) {
  const normalized = trimConfiguredValue(value);
  if (!normalized) return false;

  return !placeholderFragments.some(fragment => normalized.includes(fragment));
}

function parseEmailAddress(value) {
  const raw = trimConfiguredValue(value);
  if (!raw) return null;

  const bracketMatch = raw.match(/^(.*?)<([^>]+)>$/);
  if (bracketMatch) {
    const name = bracketMatch[1].replace(/^"|"$/g, '').trim();
    const email = bracketMatch[2].trim();
    return {
      email,
      ...(name ? { name } : {}),
    };
  }

  return { email: raw };
}

function normalizeRecipients(value) {
  const values = Array.isArray(value) ? value : [value];
  const recipients = [];

  for (const item of values) {
    if (!item) continue;

    if (typeof item === 'object' && item.email) {
      recipients.push({
        email: trimConfiguredValue(item.email),
        ...(item.name ? { name: trimConfiguredValue(item.name) } : {}),
      });
      continue;
    }

    String(item)
      .split(',')
      .map(part => parseEmailAddress(part))
      .filter(Boolean)
      .forEach(recipient => recipients.push(recipient));
  }

  return recipients.filter(recipient => recipient.email);
}

function resolveBrevoSender(env, message = {}) {
  const configuredSender = parseEmailAddress(
    env.BREVO_SENDER_EMAIL ||
    env.EMAIL_FROM_EMAIL ||
    env.EMAIL_FROM ||
    message.from ||
    env.GMAIL_USER ||
    env.ORDER_NOTIFICATIONS_EMAIL
  );

  if (!configuredSender) return null;

  return {
    name: trimConfiguredValue(env.BREVO_SENDER_NAME || env.EMAIL_FROM_NAME || configuredSender.name || 'Sugar & Glaze'),
    email: configuredSender.email,
  };
}

function resolveReplyTo(env, message = {}) {
  const replyTo = parseEmailAddress(message.replyTo || env.EMAIL_REPLY_TO || env.ORDER_NOTIFICATIONS_EMAIL);
  return replyTo?.email ? replyTo : null;
}

function createBrevoTransport(env = {}, { fetchImpl = globalThis.fetch } = {}) {
  const apiKey = trimConfiguredValue(env.BREVO_API_KEY);
  if (!isConfiguredValue(apiKey, ['your_brevo_api_key']) || typeof fetchImpl !== 'function') {
    return null;
  }

  return {
    provider: 'brevo',
    async sendMail(message = {}) {
      const sender = resolveBrevoSender(env, message);
      const to = normalizeRecipients(message.to);

      if (!sender?.email) {
        throw new Error('Brevo sender email is not configured.');
      }

      if (to.length === 0) {
        throw new Error('Email recipient is not configured.');
      }

      const payload = {
        sender,
        to,
        subject: String(message.subject || ''),
      };
      const replyTo = resolveReplyTo(env, message);

      if (replyTo) {
        payload.replyTo = replyTo;
      }

      if (message.html) {
        payload.htmlContent = String(message.html);
      } else {
        payload.textContent = String(message.text || '');
      }

      const response = await fetchImpl(BREVO_SEND_EMAIL_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = result.message || result.code || `status ${response.status}`;
        throw new Error(`Brevo email API failed: ${detail}`);
      }

      return {
        messageId: result.messageId,
        provider: 'brevo',
      };
    },
  };
}

function createGmailTransport(env = {}, { nodemailerImpl } = {}) {
  if (!nodemailerImpl) return null;

  const user = trimConfiguredValue(env.GMAIL_USER);
  const pass = trimConfiguredValue(env.GMAIL_APP_PASSWORD);

  if (
    !isConfiguredValue(user, ['your.email@gmail.com']) ||
    !isConfiguredValue(pass, ['abcdabcdabcdabcd'])
  ) {
    return null;
  }

  const transport = nodemailerImpl.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  transport.provider = 'gmail';
  return transport;
}

function createEmailTransport(env = {}, options = {}) {
  return createBrevoTransport(env, options) || createGmailTransport(env, options);
}

module.exports = {
  BREVO_SEND_EMAIL_URL,
  createBrevoTransport,
  createEmailTransport,
  createGmailTransport,
  normalizeRecipients,
  parseEmailAddress,
  trimConfiguredValue,
};
