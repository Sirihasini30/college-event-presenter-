const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: [true, 'Please provide student roll/ID number'],
    unique: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: String,
    required: [true, 'Please provide department (e.g. Computer Science, IT, Mechanical)'],
    trim: true
  },
  year: {
    type: String,
    required: [true, 'Please provide academic year (e.g. 1st Year, 2nd Year, 3rd Year, 4th Year)'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide contact phone number'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', StudentSchema);
