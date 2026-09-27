const Schedule = require('../models/Schedule');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Registration = require('../models/Registration');
const { validateScheduleInput } = require('../validators/inputValidator');

// @desc    Get schedules for an event
// @route   GET /api/schedules/:eventId
// @access  Public
exports.getSchedulesByEvent = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ event: req.params.eventId })
      .populate('event', 'title eventDate venue')
      .sort('scheduleDate startTime');

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create schedule item
// @route   POST /api/schedules
// @access  Private (Admin / Presenter)
exports.createSchedule = async (req, res, next) => {
  try {
    const validation = validateScheduleInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const { event: eventId, activityName, scheduleDate, startTime, endTime, venue, speakerOrLead } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const schedule = await Schedule.create({
      event: eventId,
      activityName,
      scheduleDate,
      startTime,
      endTime,
      venue,
      speakerOrLead: speakerOrLead || ''
    });

    // Notify registered students about updated schedule
    const registrations = await Registration.find({
      event: eventId,
      registrationStatus: { $ne: 'cancelled' }
    }).populate('student');

    const notifications = registrations.map(reg => ({
      user: reg.student.user,
      message: `Schedule Update for "${event.title}": New session "${activityName}" at ${startTime} added.`,
      type: 'schedule',
      link: `/events/${eventId}`
    })).filter(n => n.user);

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Schedule item added successfully!',
      schedule
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update schedule item
// @route   PUT /api/schedules/:id
// @access  Private (Admin / Presenter)
exports.updateSchedule = async (req, res, next) => {
  try {
    let schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule item not found'
      });
    }

    schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Schedule item updated successfully!',
      schedule
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete schedule item
// @route   DELETE /api/schedules/:id
// @access  Private (Admin / Presenter)
exports.deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule item not found'
      });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Schedule item removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};
