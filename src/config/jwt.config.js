// src/config/jwt.config.js

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// 🔥 Validación crítica: secrets DEBEN existir
if (!JWT_ACCESS_SECRET || JWT_ACCESS_SECRET === 'undefined') {
  throw new Error(
    '❌ FATAL: JWT_ACCESS_SECRET no está configurado. ' +
    'Define JWT_ACCESS_SECRET en tu archivo .env'
  );
}

if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET === 'undefined') {
  throw new Error(
    '❌ FATAL: JWT_REFRESH_SECRET no está configurado. ' +
    'Define JWT_REFRESH_SECRET en tu archivo .env'
  );
}

// Validar que los secrets sean seguros (mínimo 32 caracteres)
if (JWT_ACCESS_SECRET.length < 32) {
  console.warn(
    '⚠️  WARNING: JWT_ACCESS_SECRET es muy corto. ' +
    'Usa al menos 32 caracteres para mayor seguridad.'
  );
}

if (JWT_REFRESH_SECRET.length < 32) {
  console.warn(
    '⚠️  WARNING: JWT_REFRESH_SECRET es muy corto. ' +
    'Usa al menos 32 caracteres para mayor seguridad.'
  );
}

// Validar que los secrets sean diferentes
if (JWT_ACCESS_SECRET === JWT_REFRESH_SECRET) {
  throw new Error(
    '❌ FATAL: JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser diferentes'
  );
}

module.exports = {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET
};
