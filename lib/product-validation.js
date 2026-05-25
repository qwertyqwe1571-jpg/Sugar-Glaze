const { normalizeSafeImageUrl } = require('../public/security');

function trimText(value) {
  return String(value ?? '').trim();
}

function normalizeProductPayload({ name, price, description, image_url: imageUrl }) {
  const normalizedName = trimText(name);
  const normalizedPrice = Number(price);
  const normalizedDescription = trimText(description);
  const rawImageUrl = trimText(imageUrl);
  const normalizedImageUrl = rawImageUrl ? normalizeSafeImageUrl(rawImageUrl) : '';

  if (!normalizedName) {
    return { error: "Назва товару обов'язкова." };
  }

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    return { error: 'Ціна має бути додатним числом.' };
  }

  if (rawImageUrl && !normalizedImageUrl) {
    return { error: 'Зображення має бути безпечним HTTPS, data:image або локальним URL.' };
  }

  return {
    payload: {
      name: normalizedName,
      price: Number(normalizedPrice.toFixed(2)),
      description: normalizedDescription || null,
      image_url: normalizedImageUrl || null,
    },
  };
}

module.exports = {
  normalizeProductPayload,
};
