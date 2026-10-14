const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { z, objectId } = require('../validators/common');
const ctrl = require('../controllers/messagesController');

const router = express.Router();
const body = z.string().trim().min(1, 'Message cannot be empty').max(2000);

router.use(protect, authorize('user', 'agency'));

router.get('/', ctrl.getConversations);
router.post('/', authorize('user'), validate(z.object({
  bookingId: objectId.optional(),
  itemType: z.enum(['hotel', 'transport', 'package']).optional(),
  itemId: objectId.optional(),
  subject: z.string().trim().max(120).optional(),
  message: body
})), ctrl.startConversation);
router.get('/:id/messages', ctrl.getMessages);
router.post('/:id/messages', validate(z.object({ body })), ctrl.sendMessage);

module.exports = router;
