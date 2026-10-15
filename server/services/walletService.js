const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const ApiError = require('../utils/ApiError');

const credit = async (userId, amount, { reason, description = '', booking, payment } = {}) => {
  if (amount <= 0) return null;
  const user = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return WalletTransaction.create({
    user: userId, type: 'credit', amount, balanceAfter: user.walletBalance, reason, description, booking, payment
  });
};

// Atomic: fails instead of letting the balance go negative.
const debit = async (userId, amount, { reason, description = '', booking, payment } = {}) => {
  if (amount <= 0) return null;
  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );
  if (!user) throw ApiError.badRequest('Insufficient wallet balance');
  return WalletTransaction.create({
    user: userId, type: 'debit', amount, balanceAfter: user.walletBalance, reason, description, booking, payment
  });
};

module.exports = { credit, debit };
