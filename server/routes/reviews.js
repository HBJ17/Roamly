const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { z, objectId } = require('../validators/common');
const ctrl = require('../controllers/reviewsController');

const router = express.Router();
const score = z.coerce.number().int().min(1).max(5);

const reviewBody = z.object({
  bookingId: objectId,
  itemId: objectId,
  rating: score,
  ratings: z.object({ cleanliness: score, service: score, location: score, value: score }).partial().optional(),
  title: z.string().trim().min(3).max(120),
  comment: z.string().trim().min(10, 'Tell other travellers a little more (at least 10 characters)').max(3000),
  travelType: z.enum(['Solo', 'Couple', 'Family', 'Friends', 'Business']).optional()
});

router.get('/pending', protect, authorize('user'), ctrl.getReviewable);
router.get('/agency', protect, authorize('agency'), ctrl.getAgencyReviews);
router.get('/:itemType/:itemId', ctrl.getItemReviews);

router.post('/', protect, authorize('user'), validate(reviewBody), ctrl.createReview);
router.put('/:id', protect, authorize('user'), validate(reviewBody.omit({ bookingId: true, itemId: true }).partial()), ctrl.updateReview);
router.delete('/:id', protect, authorize('user'), ctrl.deleteReview);
router.post('/:id/helpful', protect, authorize('user'), ctrl.toggleHelpful);
router.put('/:id/reply', protect, authorize('agency'), validate(z.object({ message: z.string().trim().min(2).max(1500) })), ctrl.replyToReview);

module.exports = router;
