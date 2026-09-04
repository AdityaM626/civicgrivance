const mongoose = require('mongoose');

const resolutionProofSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
      index: true
    },
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Officer ID is required']
    },
    notes: {
      type: String,
      required: [true, 'Resolution notes are required'],
      trim: true
    },
    photoUrls: {
      type: [String],
      default: []
    },
    resolvedAt: {
      type: Date,
      default: Date.now
    },
    resolutionCycle: {
      type: Number,
      default: 1,
      min: [1, 'Resolution cycle must be at least 1']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one resolution proof per complaint per resolution cycle
resolutionProofSchema.index({ complaintId: 1, resolutionCycle: 1 }, { unique: true });

module.exports = mongoose.model('ResolutionProof', resolutionProofSchema);
