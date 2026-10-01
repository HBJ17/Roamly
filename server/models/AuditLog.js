const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  actorType: {
    type: String,
    enum: ['admin', 'agency', 'user', 'system'],
    default: 'admin'
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId
  },
  actorName: {
    type: String,
    default: 'System'
  },
  targetEntity: {
    type: String,
    default: ''
  },
  targetId: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
