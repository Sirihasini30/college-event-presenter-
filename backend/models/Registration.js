const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registrationStatus: {
    type: String,
    enum: ['registered', 'attended', 'cancelled'],
    default: 'registered'
  },
  attended: {
    type: Boolean,
    default: false
  },
  qrCodeToken: {
    type: String,
    default: function() {
      return 'REG-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    }
  },
  paymentStatus: {
    type: String,
    enum: ['free', 'paid', 'pending', 'failed'],
    default: 'free'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  transactionId: {
    type: String,
    default: ''
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    default: 'UPI / QR Code'
  }
}, {
  timestamps: true
});

// Unique compound index: One active registration per student per event
RegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
