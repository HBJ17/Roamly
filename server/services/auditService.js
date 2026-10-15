const AuditLog = require('../models/AuditLog');

const audit = (req, action, targetEntity, targetId, details = {}) =>
  AuditLog.create({
    action,
    actorType: req.userRole || 'system',
    actorId: req.user?._id,
    actorName: req.user?.username || 'system',
    targetEntity,
    targetId: targetId ? String(targetId) : '',
    details,
    ipAddress: req.ip || ''
  });

module.exports = { audit };
