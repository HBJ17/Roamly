const { hashPassword, verifyPassword, isBcryptHash, isWerkzeugHash } = require('../../utils/passwords');

// Shared password behaviour for User, Agency and Admin accounts.
module.exports = function passwordPlugin(schema) {
  schema.add({
    passwordChangedAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false }
  });

  schema.pre('save', async function hashOnChange(next) {
    if (!this.isModified('password')) return next();
    // Already-hashed values (seed data, migrated Flask accounts) are stored untouched.
    if (!isBcryptHash(this.password) && !isWerkzeugHash(this.password)) {
      this.password = await hashPassword(this.password);
    }
    if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
    return next();
  });

  schema.methods.matchPassword = function matchPassword(entered) {
    return verifyPassword(entered, this.password);
  };

  schema.methods.needsRehash = function needsRehash() {
    return !isBcryptHash(this.password);
  };

  // True when the JWT was issued before the latest password change.
  schema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIssuedAt) {
    if (!this.passwordChangedAt) return false;
    return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAt;
  };
};
