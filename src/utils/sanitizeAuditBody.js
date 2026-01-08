const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 10;

function sanitizeAuditBody(body) {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const safe = {};
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey'];

  for (const [key, value] of Object.entries(body)) {
    if (sensitiveFields.includes(key)) {
      safe[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      safe[key] = value.length > MAX_STRING_LENGTH 
        ? value.slice(0, MAX_STRING_LENGTH) + '...[truncated]'
        : value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    } else if (Array.isArray(value)) {
      safe[key] = value.length > MAX_ARRAY_LENGTH
        ? [...value.slice(0, MAX_ARRAY_LENGTH), `...[${value.length - MAX_ARRAY_LENGTH} more]`]
        : value;
    } else if (value && typeof value === 'object') {
      safe[key] = '[Object]';
    } else {
      safe[key] = value;
    }
  }

  return safe;
}

module.exports = sanitizeAuditBody;