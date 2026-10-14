const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { z, objectId } = require('../validators/common');
const ctrl = require('../controllers/savedController');

const router = express.Router();

router.use(protect, authorize('user'));
router.get('/', ctrl.getSaved);
router.get('/ids', ctrl.getSavedIds);
router.post('/toggle', validate(z.object({ itemType: z.enum(['hotel', 'transport', 'package']), itemId: objectId })), ctrl.toggleSaved);

module.exports = router;
