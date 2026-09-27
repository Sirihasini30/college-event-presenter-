const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide event title'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide event description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Management', 'Other'],
    default: 'Technical'
  },
  venue: {
    type: String,
    required: [true, 'Please provide venue location (e.g. Main Auditorium, Seminar Hall 2, Lab A)'],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Please provide event date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time (e.g. 09:30 AM or 10:00)'],
    trim: true
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time (e.g. 04:30 PM or 17:00)'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide maximum student capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  presenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presenter',
    default: null
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'
  },
  bannerColor: {
    type: String,
    default: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
  },
  isRegistrationOpen: {
    type: Boolean,
    default: true
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: [0, 'Registration fee cannot be negative']
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  upiId: {
    type: String,
    default: 'RANGA SIRIHASINI'
  },
  upiHandle: {
    type: String,
    default: 'ranga.sirihasini@phonepe'
  },
  paymentQrImage: {
    type: String,
    default: '/img/payment-qr.jpg'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for registered count
EventSchema.virtual('registrations', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event',
  justOne: false
});

module.exports = mongoose.model('Event', EventSchema);
