const mongoose = require('mongoose');

const PresenterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: [true, 'Please provide designation (e.g. Associate Professor, Tech Lead, Industry Expert)'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please provide department / organization'],
    trim: true
  },
  contact: {
    type: String,
    required: [true, 'Please provide contact information'],
    trim: true
  },
  bio: {
    type: String,
    default: 'Experienced speaker and academic mentor.',
    trim: true
  },
  specialization: {
    type: String,
    default: 'General'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Presenter', PresenterSchema);
