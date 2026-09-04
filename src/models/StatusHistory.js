const mongoose = require('mongoose');

const statusEnum = ['FILED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];

const statusHistorySchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
      index: true
    },
    previousStatus: {
      type: String,
      required: [true, 'Previous status is required'],
      enum: {
        values: statusEnum,
        message: '{VALUE} is not a valid status'
      }
    },
    newStatus: {
      type: String,
      required: [true, 'New status is required'],
      enum: {
        values: statusEnum,
        message: '{VALUE} is not a valid status'
      }
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID of person changing status is required']
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

statusHistorySchema.index({ complaintId: 1, createdAt: -1 });

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
