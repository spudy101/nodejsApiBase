const MAX_STRING_LENGTH = 500;

function sanitizeAuditBody(body) {
  if (!body || typeof body !== 'object') return undefined;

  const safe = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      safe[key] = value.slice(0, MAX_STRING_LENGTH);
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      safe[key] = value;
    } else if (Array.isArray(value)) {
      safe[key] = value.slice(0, 10);
    } else if (value && typeof value === 'object') {
      safe[key] = '[Object]'; // ⛔ no deep clone
    }
  }

  return safe;
}

module.exports = sanitizeAuditBody;
