const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
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
  position: {
    type: String,
    required: [true, 'Please provide position or award (e.g. 1st Place, 2nd Place, Runner-up, Special Mention)'],
    trim: true
  },
  score: {
    type: Number,
    default: 0,
    min: [0, 'Score cannot be negative']
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  certificateIssued: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Avoid duplicate result for the same student in the same event
ResultSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Result', ResultSchema);
