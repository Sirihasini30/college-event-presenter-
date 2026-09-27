const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required']
  },
  activityName: {
    type: String,
    required: [true, 'Please provide schedule activity / session name'],
    trim: true
  },
  scheduleDate: {
    type: Date,
    required: [true, 'Please provide schedule date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide activity start time'],
    trim: true
  },
  endTime: {
    type: String,
    required: [true, 'Please provide activity end time'],
    trim: true
  },
  venue: {
    type: String,
    required: [true, 'Please provide activity venue'],
    trim: true
  },
  speakerOrLead: {
    type: String,
    default: '',
    trim: true
  },
  orderIndex: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
