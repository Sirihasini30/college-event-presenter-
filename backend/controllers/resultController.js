const Result = require('../models/Result');
const Event = require('../models/Event');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { validateResultInput } = require('../validators/inputValidator');

// @desc    Get results for an event
// @route   GET /api/results/:eventId
// @access  Public
exports.getResultsByEvent = async (req, res, next) => {
  try {
    const results = await Result.find({ event: req.params.eventId })
      .populate('event', 'title category eventDate venue')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort('position score');

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get results for logged in student
// @route   GET /api/results/my
// @access  Private (Student)
exports.getMyResults = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(200).json({
        success: true,
        count: 0,
        results: []
      });
    }

    const results = await Result.find({ student: student._id })
      .populate('event', 'title category eventDate venue')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add / publish event result
// @route   POST /api/results
// @access  Private (Admin / Presenter)
exports.createResult = async (req, res, next) => {
  try {
    const validation = validateResultInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const { event: eventId, student: studentId, position, score = 0, remarks = '', certificateIssued = false } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const student = await Student.findById(studentId).populate('user');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if result already exists for this student & event
    let result = await Result.findOne({ event: eventId, student: studentId });

    if (result) {
      result.position = position;
      result.score = score;
      result.remarks = remarks;
      result.certificateIssued = certificateIssued;
      await result.save();
    } else {
      result = await Result.create({
        event: eventId,
        student: studentId,
        position,
        score,
        remarks,
        certificateIssued
      });
    }

    // Notify the student
    if (student.user) {
      await Notification.create({
        user: student.user._id,
        message: `Event Result Announced: You achieved "${position}" in "${event.title}"! Score: ${score}. Remarks: ${remarks || 'Congratulations!'}`,
        type: 'result',
        link: `/events/${eventId}`
      });
    }

    const populatedResult = await Result.findById(result._id)
      .populate('event', 'title')
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      });

    res.status(201).json({
      success: true,
      message: 'Result published successfully!',
      result: populatedResult
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update result
// @route   PUT /api/results/:id
// @access  Private (Admin / Presenter)
exports.updateResult = async (req, res, next) => {
  try {
    let result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result record not found'
      });
    }

    result = await Result.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('event', 'title').populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' }
    });

    res.status(200).json({
      success: true,
      message: 'Result updated successfully!',
      result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete result
// @route   DELETE /api/results/:id
// @access  Private (Admin / Presenter)
exports.deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result record not found'
      });
    }

    await Result.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Result removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};
