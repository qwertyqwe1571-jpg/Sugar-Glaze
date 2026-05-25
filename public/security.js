(function initSugarGlazeSecurity(root) {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function normalizeSafeImageUrl(value) {
    const normalized = String(value ?? '').trim();

    if (!normalized || /["'<>`\u0000-\u001f\u007f]/.test(normalized)) {
      return '';
    }

    if (normalized.startsWith('/') && !normalized.startsWith('//')) {
      return normalized;
    }

    if (/^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(normalized)) {
      return normalized;
    }

    try {
      const parsed = new URL(normalized);
      return parsed.protocol === 'https:' ? normalized : '';
    } catch {
      return '';
    }
  }

  const api = {
    escapeAttribute,
    escapeHtml,
    normalizeSafeImageUrl,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.sgSecurity = api;
    root.escapeHtml = root.escapeHtml || escapeHtml;
  }
})(typeof window !== 'undefined' ? window : undefined);
