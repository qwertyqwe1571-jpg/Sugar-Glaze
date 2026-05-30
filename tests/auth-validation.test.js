const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateLoginInput,
  validateProfileInput,
  validateRegistrationInput,
} = require('../lib/auth-validation');

test('registration validation returns all field errors at once', () => {
  const { errors } = validateRegistrationInput({
    name: 'ПІБ ПІБ',
    email: 'not-email',
    phone: '123',
    password: '123',
  });

  assert.deepEqual(
    errors.map(error => error.field),
    ['name', 'email', 'phone', 'password']
  );
});

test('registration validation accepts a realistic Ukrainian customer profile', () => {
  const { payload, errors } = validateRegistrationInput({
    name: 'Анна Коваль',
    email: '  ANNA@example.com ',
    phone: '+380671112233',
    address: 'Львів, вул. Солодка, 12',
    password: 'secret123',
  });

  assert.deepEqual(errors, []);
  assert.equal(payload.name, 'Анна Коваль');
  assert.equal(payload.email, 'anna@example.com');
});

test('login validation marks email and password independently', () => {
  const { errors } = validateLoginInput({ email: 'wrong', password: '' });

  assert.deepEqual(
    errors.map(error => error.field),
    ['email', 'password']
  );
});

test('profile validation rejects placeholder full names', () => {
  const { errors } = validateProfileInput({ name: 'ПІБ ПІБ' });

  assert.deepEqual(errors, [
    {
      field: 'name',
      message: "Вкажіть справжнє ім'я та прізвище без шаблонних або повторюваних слів.",
    },
  ]);
});
