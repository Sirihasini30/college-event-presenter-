const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Schedule = require('../models/Schedule');
const Result = require('../models/Result');
const Presenter = require('../models/Presenter');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { validateEventInput } = require('../validators/inputValidator');

// @desc    Get all events (with search, category, status, date filtering)
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const { search, category, status, presenter, fromDate, toDate } = req.query;
    
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (presenter) {
      query.presenter = presenter;
    }

    if (fromDate || toDate) {
      query.eventDate = {};
      if (fromDate) query.eventDate.$gte = new Date(fromDate);
      if (toDate) query.eventDate.$lte = new Date(toDate);
    }

    const events = await Event.find(query)
      .populate({
        path: 'presenter',
        populate: { path: 'user', select: 'name email avatar' }
      })
      .sort('eventDate');

    // Attach real-time registered count and available seats
    const eventsWithStats = await Promise.all(
      events.map(async (ev) => {
        const registeredCount = await Registration.countDocuments({
          event: ev._id,
          registrationStatus: { $ne: 'cancelled' }
        });
        const attendedCount = await Registration.countDocuments({
          event: ev._id,
          registrationStatus: 'attended'
        });

        return {
          ...ev.toObject(),
          registeredCount,
          attendedCount,
          availableSeats: Math.max(0, ev.capacity - registeredCount),
          isFull: registeredCount >= ev.capacity
        };
      })
    );

    res.status(200).json({
      success: true,
      count: eventsWithStats.length,
      events: eventsWithStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate({
      path: 'presenter',
      populate: { path: 'user', select: 'name email avatar' }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registeredCount = await Registration.countDocuments({
      event: event._id,
      registrationStatus: { $ne: 'cancelled' }
    });

    const schedules = await Schedule.find({ event: event._id }).sort('startTime');
    const results = await Result.find({ event: event._id })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('position score');

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        registeredCount,
        availableSeats: Math.max(0, event.capacity - registeredCount),
        isFull: registeredCount >= event.capacity,
        schedules,
        results
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin / Presenter)
exports.createEvent = async (req, res, next) => {
  try {
    const validation = validateEventInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    let presenterId = req.body.presenter || null;

    // If presenter is creating event, auto-assign self
    if (req.user.role === 'presenter' && !presenterId) {
      const p = await Presenter.findOne({ user: req.user._id });
      if (p) presenterId = p._id;
    }

    const eventData = {
      ...req.body,
      presenter: presenterId,
      capacity: Number(req.body.capacity)
    };

    const event = await Event.create(eventData);

    // Notify students about new event
    const studentUsers = await User.find({ role: 'student' }).select('_id');
    const notifications = studentUsers.slice(0, 50).map(u => ({
      user: u._id,
      message: `New Event Announced: "${event.title}" on ${new Date(event.eventDate).toLocaleDateString()} at ${event.venue}. Register now!`,
      type: 'event',
      link: `/events/${event._id}`
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    const populatedEvent = await Event.findById(event._id).populate({
      path: 'presenter',
      populate: { path: 'user', select: 'name email' }
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event: populatedEvent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin / Assigned Presenter)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Role check
    if (req.user.role === 'presenter') {
      const presenter = await Presenter.findOne({ user: req.user._id });
      if (!presenter || !event.presenter || event.presenter.toString() !== presenter._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to edit events assigned to you.'
        });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'presenter',
      populate: { path: 'user', select: 'name email' }
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      event: updatedEvent
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Cascade delete associated records
    await Registration.deleteMany({ event: event._id });
    await Schedule.deleteMany({ event: event._id });
    await Result.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event and all associated registrations, schedules, and results deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Dashboard Statistics Overview
// @route   GET /api/events/stats/overview
// @access  Private (Admin / Presenter / Student)
exports.getStatsOverview = async (req, res, next) => {
  try {
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ status: 'upcoming' });
    const ongoingEvents = await Event.countDocuments({ status: 'ongoing' });
    const completedEvents = await Event.countDocuments({ status: 'completed' });

    const totalRegistrations = await Registration.countDocuments({ registrationStatus: { $ne: 'cancelled' } });
    const totalAttended = await Registration.countDocuments({ registrationStatus: 'attended' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalPresenters = await User.countDocuments({ role: 'presenter' });

    // Category breakdown
    const categoryStats = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Recent 5 events
    const recentEvents = await Event.find()
      .populate({
        path: 'presenter',
        populate: { path: 'user', select: 'name' }
      })
      .sort('-createdAt')
      .limit(5);

    // Recent 5 registrations
    const recentRegistrations = await Registration.find()
      .populate('event', 'title eventDate venue')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        upcomingEvents,
        ongoingEvents,
        completedEvents,
        totalRegistrations,
        totalAttended,
        totalStudents,
        totalPresenters,
        categoryStats,
        recentEvents,
        recentRegistrations
      }
    });
  } catch (err) {
    next(err);
  }
};
