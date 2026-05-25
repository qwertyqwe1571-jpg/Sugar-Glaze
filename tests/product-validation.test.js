const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeProductPayload,
} = require('../lib/product-validation');

test('normalizes valid product input', () => {
  assert.deepEqual(
    normalizeProductPayload({
      name: ' Наполеон ',
      price: '850.50',
      description: '  Кремовий торт ',
      image_url: 'https://res.cloudinary.com/demo/image/upload/cake.webp',
    }),
    {
      payload: {
        name: 'Наполеон',
        price: 850.5,
        description: 'Кремовий торт',
        image_url: 'https://res.cloudinary.com/demo/image/upload/cake.webp',
      },
    }
  );
});

test('rejects invalid price and unsafe image URL', () => {
  assert.deepEqual(
    normalizeProductPayload({ name: 'Торт', price: '-1', description: '', image_url: '' }),
    { error: 'Ціна має бути додатним числом.' }
  );
  assert.deepEqual(
    normalizeProductPayload({ name: 'Торт', price: '120', description: '', image_url: 'javascript:alert(1)' }),
    { error: 'Зображення має бути безпечним HTTPS, data:image або локальним URL.' }
  );
});
