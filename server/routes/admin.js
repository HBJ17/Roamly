const express = require('express');
const router = express.Router();
const { getAdminDashboard, getAllAgencies, updateAgencyStatus, getGlobalBookings, getAuditLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/agencies', getAllAgencies);
router.put('/agencies/:id/status', updateAgencyStatus);
router.get('/bookings', getGlobalBookings);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
