const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 10;

const isBcryptHash = (value = '') => /^\$2[aby]\$\d{2}\$/.test(value);
const isWerkzeugHash = (value = '') => /^(pbkdf2|scrypt):/.test(value);

// Verifies hashes produced by the legacy Flask app (werkzeug.security.generate_password_hash).
const verifyWerkzeug = (password, stored) => {
  const [method, salt, expectedHex] = stored.split('$');
  if (!method || !salt || !expectedHex) return false;
  const parts = method.split(':');
  let derived;

  if (parts[0] === 'pbkdf2') {
    const digest = parts[1] || 'sha256';
    const iterations = Number(parts[2]) || 600000;
    derived = crypto.pbkdf2Sync(password, salt, iterations, expectedHex.length / 2, digest);
  } else if (parts[0] === 'scrypt') {
    const N = Number(parts[1]) || 32768;
    const r = Number(parts[2]) || 8;
    const p = Number(parts[3]) || 1;
    derived = crypto.scryptSync(password, salt, expectedHex.length / 2, { N, r, p, maxmem: 132 * N * r * p });
  } else {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
};

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

const verifyPassword = async (password, stored) => {
  if (!password || !stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compare(password, stored);
  if (isWerkzeugHash(stored)) return verifyWerkzeug(password, stored);
  return false;
};

module.exports = { hashPassword, verifyPassword, isBcryptHash, isWerkzeugHash };
