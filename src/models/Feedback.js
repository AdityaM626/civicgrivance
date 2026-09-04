const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
      index: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen ID is required'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Feedback rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    reopened: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one feedback record per complaint & citizen pair
feedbackSchema.index({ complaintId: 1, citizenId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
