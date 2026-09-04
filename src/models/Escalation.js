const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true
    },
    previousOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    escalationLevel: {
      type: Number,
      required: [true, 'Escalation level is required'],
      min: [1, 'Escalation level must be at least 1'],
      default: 1
    },
    reason: {
      type: String,
      required: [true, 'Escalation reason is required'],
      trim: true
    },
    escalatedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'RESOLVED'],
        message: '{VALUE} is not a valid escalation status'
      },
      default: 'OPEN',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Escalation', escalationSchema);
