const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Register student for an event
// @route   POST /api/registrations
// @access  Private (Student)
exports.registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required.'
      });
    }

    // Ensure student profile exists
    let student = await Student.findOne({ user: req.user._id });
    if (!student) {
      if (req.user.role === 'student') {
        student = await Student.create({
          user: req.user._id,
          studentId: `STU-${Date.now().toString().slice(-4)}`,
          department: 'General Engineering',
          year: '1st Year',
          phone: '9876543210'
        });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Only students can register for events.'
        });
      }
    }

    // Check event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This event has been cancelled and registrations are closed.'
      });
    }

    if (event.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This event has already concluded.'
      });
    }

    // Check duplicate registration
    const existingRegistration = await Registration.findOne({
      event: event._id,
      student: student._id
    });

    if (existingRegistration) {
      if (existingRegistration.registrationStatus === 'cancelled') {
        // Reactivate registration if capacity allows
        const currentCount = await Registration.countDocuments({
          event: event._id,
          registrationStatus: { $ne: 'cancelled' }
        });

        if (currentCount >= event.capacity) {
          return res.status(400).json({
            success: false,
            message: 'Event capacity is full. Cannot re-activate registration.'
          });
        }

        existingRegistration.registrationStatus = 'registered';
        existingRegistration.registrationDate = new Date();
        await existingRegistration.save();

        // Notification
        await Notification.create({
          user: req.user._id,
          message: `Your registration for "${event.title}" has been reactivated!`,
          type: 'registration',
          link: `/events/${event._id}`
        });

        return res.status(200).json({
          success: true,
          message: 'Registration successfully reactivated!',
          registration: existingRegistration
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event.'
      });
    }

    // Check event capacity
    const currentRegisteredCount = await Registration.countDocuments({
      event: event._id,
      registrationStatus: { $ne: 'cancelled' }
    });

    if (currentRegisteredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: `Registration failed. Event capacity of ${event.capacity} seats has been reached.`
      });
    }

    const fee = event.registrationFee || 0;
    const isPaidEvent = fee > 0;
    const { transactionId = '', paymentMethod = 'UPI / QR Code' } = req.body;

    // Create registration
    const registration = await Registration.create({
      event: event._id,
      student: student._id,
      registrationStatus: 'registered',
      paymentStatus: isPaidEvent ? 'paid' : 'free',
      paymentAmount: fee,
      transactionId: transactionId || (isPaidEvent ? 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase() : 'N/A'),
      paymentDate: isPaidEvent ? new Date() : null,
      paymentMethod: isPaidEvent ? paymentMethod : 'Free'
    });

    // Notify student
    await Notification.create({
      user: req.user._id,
      message: `Registration Confirmed! You are registered for "${event.title}" on ${new Date(event.eventDate).toLocaleDateString()} at ${event.venue}. ${isPaidEvent ? `Paid: ₹${fee} (Txn: ${registration.transactionId}). ` : ''}Pass ID: ${registration.qrCodeToken}`,
      type: 'registration',
      link: `/events/${event._id}`
    });

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('event')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event!',
      registration: populatedRegistration
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in student's registrations
// @route   GET /api/registrations/my
// @access  Private (Student)
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(200).json({
        success: true,
        count: 0,
        registrations: []
      });
    }

    const registrations = await Registration.find({ student: student._id })
      .populate({
        path: 'event',
        populate: {
          path: 'presenter',
          populate: { path: 'user', select: 'name email' }
        }
      })
      .sort('-registrationDate');

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get registrations for a specific event
// @route   GET /api/registrations/event/:eventId
// @access  Private (Admin / Assigned Presenter)
exports.getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const registrations = await Registration.find({ event: eventId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email avatar' }
      })
      .sort('-registrationDate');

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all registrations (Admin)
// @route   GET /api/registrations
// @access  Private (Admin)
exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { status, eventId, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.registrationStatus = status;
    }

    if (eventId) {
      query.event = eventId;
    }

    const registrations = await Registration.find(query)
      .populate('event', 'title category eventDate venue capacity status')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('-registrationDate');

    let filtered = registrations;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = registrations.filter(r => 
        (r.event?.title && r.event.title.toLowerCase().includes(searchLower)) ||
        (r.student?.user?.name && r.student.user.name.toLowerCase().includes(searchLower)) ||
        (r.student?.studentId && r.student.studentId.toLowerCase().includes(searchLower))
      );
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      registrations: filtered
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel registration
// @route   DELETE /api/registrations/:id
// @access  Private (Student owner / Admin)
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event', 'title')
      .populate('student');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.'
      });
    }

    // Role check: Admin or student owner
    if (req.user.role !== 'admin') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || registration.student._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to cancel this registration.'
        });
      }
    }

    registration.registrationStatus = 'cancelled';
    await registration.save();

    // Create notification
    const studentUser = registration.student.user;
    if (studentUser) {
      await Notification.create({
        user: studentUser,
        message: `Your registration for "${registration.event?.title || 'Event'}" has been cancelled.`,
        type: 'registration'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update registration status / attendance
// @route   PUT /api/registrations/:id/status
// @access  Private (Admin / Presenter)
exports.updateRegistrationStatus = async (req, res, next) => {
  try {
    const { registrationStatus, attended } = req.body;

    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (registrationStatus) registration.registrationStatus = registrationStatus;
    if (attended !== undefined) registration.attended = attended;
    if (attended === true) registration.registrationStatus = 'attended';

    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Registration status updated.',
      registration
    });
  } catch (err) {
    next(err);
  }
};
