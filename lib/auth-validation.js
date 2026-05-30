const NAME_PLACEHOLDER_WORDS = new Set([
  'піб',
  'імя',
  "ім'я",
  'імʼя',
  'прізвище',
  'name',
  'fullname',
  'test',
  'тест',
]);

const NAME_WORD_PATTERN = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ʼ-]+$/u;

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeNameWord(value) {
  return value.toLowerCase().replace(/[’ʼ`]/g, "'");
}

function normalizePhone(value) {
  const raw = normalizeText(value);
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `+38${digits}`;
  if (/^380\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\+380\d{9}$/.test(raw.replace(/[\s()-]/g, ''))) return raw.replace(/[\s()-]/g, '');

  return raw;
}

function validateFullName(value) {
  const name = normalizeText(value);

  if (!name) {
    return {
      value: name,
      error: {
        field: 'name',
        message: "Вкажіть ім'я та прізвище.",
      },
    };
  }

  const parts = name.split(' ');
  const normalizedParts = parts.map(normalizeNameWord);
  const hasBadPart = parts.some(part => part.length < 2 || !NAME_WORD_PATTERN.test(part));
  const hasPlaceholder = normalizedParts.some(part => NAME_PLACEHOLDER_WORDS.has(part));
  const hasRepeatedWords = new Set(normalizedParts).size < 2;

  if (
    parts.length < 2 ||
    parts.length > 4 ||
    hasBadPart ||
    hasPlaceholder ||
    hasRepeatedWords
  ) {
    return {
      value: name,
      error: {
        field: 'name',
        message: "Вкажіть справжнє ім'я та прізвище без шаблонних або повторюваних слів.",
      },
    };
  }

  if (name.length > 80) {
    return {
      value: name,
      error: {
        field: 'name',
        message: "Ім'я та прізвище мають містити не більше 80 символів.",
      },
    };
  }

  return { value: name };
}

function validateEmail(value) {
  const email = normalizeEmail(value);

  if (!email) {
    return {
      value: email,
      error: {
        field: 'email',
        message: 'Вкажіть email.',
      },
    };
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      value: email,
      error: {
        field: 'email',
        message: 'Вкажіть коректний email.',
      },
    };
  }

  return { value: email };
}

function validatePassword(value) {
  const password = String(value ?? '');

  if (!password) {
    return {
      value: password,
      error: {
        field: 'password',
        message: 'Вкажіть пароль.',
      },
    };
  }

  if (password.length < 8) {
    return {
      value: password,
      error: {
        field: 'password',
        message: 'Пароль має містити щонайменше 8 символів.',
      },
    };
  }

  if (password.length > 128) {
    return {
      value: password,
      error: {
        field: 'password',
        message: 'Пароль має містити не більше 128 символів.',
      },
    };
  }

  return { value: password };
}

function validatePhone(value) {
  const phone = normalizePhone(value);

  if (!phone) return { value: null };

  if (!/^\+380\d{9}$/.test(phone)) {
    return {
      value: phone,
      error: {
        field: 'phone',
        message: 'Телефон має бути у форматі +380XXXXXXXXX.',
      },
    };
  }

  return { value: phone };
}

function validateAddress(value) {
  const address = normalizeText(value);

  if (!address) return { value: null };

  if (address.length < 5) {
    return {
      value: address,
      error: {
        field: 'address',
        message: 'Адреса має містити щонайменше 5 символів.',
      },
    };
  }

  if (address.length > 180) {
    return {
      value: address,
      error: {
        field: 'address',
        message: 'Адреса має містити не більше 180 символів.',
      },
    };
  }

  return { value: address };
}

function collectErrors(validations) {
  return validations
    .map(validation => validation.error)
    .filter(Boolean);
}

function validateRegistrationInput(body = {}) {
  const name = validateFullName(body.name);
  const email = validateEmail(body.email);
  const phone = validatePhone(body.phone);
  const address = validateAddress(body.address);
  const password = validatePassword(body.password);
  const errors = collectErrors([name, email, phone, address, password]);

  return {
    payload: {
      name: name.value,
      email: email.value,
      phone: phone.value,
      address: address.value,
      password: password.value,
    },
    errors,
  };
}

function validateLoginInput(body = {}) {
  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const errors = collectErrors([email, password]);

  return {
    payload: {
      email: email.value,
      password: password.value,
    },
    errors,
  };
}

function validateProfileInput(body = {}) {
  const name = validateFullName(body.name);
  const phone = validatePhone(body.phone);
  const address = validateAddress(body.address);
  const errors = collectErrors([name, phone, address]);

  return {
    payload: {
      name: name.value,
      phone: phone.value,
      address: address.value,
    },
    errors,
  };
}

module.exports = {
  validateLoginInput,
  validateProfileInput,
  validateRegistrationInput,
};
