const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { z, objectId } = require('../validators/common');
const ctrl = require('../controllers/paymentsController');

const router = express.Router();

router.get('/config', ctrl.getConfig);

router.use(protect, authorize('user'));

router.post('/bookings/:id', validate(z.object({ method: z.enum(['wallet', 'online']) })), ctrl.payForBooking);
router.post('/topup', validate(z.object({ amount: z.coerce.number().int() })), ctrl.topup);
router.post('/verify', validate(z.object({
  paymentId: objectId,
  orderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().min(1),
  method: z.string().max(30).optional()
})), ctrl.verify);
router.post('/fail', validate(z.object({ paymentId: objectId, reason: z.string().max(200).optional() })), ctrl.markFailed);
router.post('/sandbox/authorize', validate(z.object({ paymentId: objectId })), ctrl.sandboxAuthorize);

module.exports = router;
