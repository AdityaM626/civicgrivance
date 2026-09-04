const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      trim: true,
      default: ''
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
      default: null
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
      default: null
    }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    referenceCode: {
      type: String,
      required: [true, 'Complaint reference code is required'],
      unique: true,
      trim: true,
      index: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen ID is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true
    },
    ward: {
      type: String,
      required: [true, 'Ward identifier is required'],
      trim: true,
      index: true
    },
    area: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true
    },
    location: {
      type: locationSchema,
      default: () => ({})
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: '{VALUE} is not a valid priority'
      },
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: {
        values: ['FILED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'],
        message: '{VALUE} is not a valid status'
      },
      default: 'FILED',
      index: true
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    slaHours: {
      type: Number,
      default: null
    },
    slaDueAt: {
      type: Date,
      default: null,
      index: true
    },
    escalationLevel: {
      type: Number,
      default: 0,
      min: [0, 'Escalation level cannot be negative']
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for department queue filtering and ward reporting
complaintSchema.index({ departmentId: 1, status: 1 });
complaintSchema.index({ ward: 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
