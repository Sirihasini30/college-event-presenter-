const Presenter = require('../models/Presenter');
const User = require('../models/User');
const Event = require('../models/Event');

// @desc    Get all presenters
// @route   GET /api/presenters
// @access  Public
exports.getPresenters = async (req, res, next) => {
  try {
    const presenters = await Presenter.find()
      .populate('user', 'name email role avatar')
      .sort('-createdAt');

    // Attach event count for each presenter
    const presentersWithEventCount = await Promise.all(
      presenters.map(async (p) => {
        const eventCount = await Event.countDocuments({ presenter: p._id });
        return {
          ...p.toObject(),
          eventsCount: eventCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: presentersWithEventCount.length,
      presenters: presentersWithEventCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single presenter by ID
// @route   GET /api/presenters/:id
// @access  Public
exports.getPresenterById = async (req, res, next) => {
  try {
    const presenter = await Presenter.findById(req.params.id)
      .populate('user', 'name email role avatar');

    if (!presenter) {
      return res.status(404).json({
        success: false,
        message: 'Presenter not found'
      });
    }

    const events = await Event.find({ presenter: presenter._id }).sort('eventDate');

    res.status(200).json({
      success: true,
      presenter,
      assignedEvents: events
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new presenter profile (Admin)
// @route   POST /api/presenters
// @access  Private (Admin)
exports.createPresenter = async (req, res, next) => {
  try {
    const { name, email, password, designation, department, contact, bio, specialization, userId } = req.body;

    let targetUserId = userId;

    if (!targetUserId) {
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required to create a new presenter account.'
        });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email address already exists.'
        });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: 'presenter'
      });
      targetUserId = newUser._id;
    } else {
      // Update existing user role to presenter
      await User.findByIdAndUpdate(targetUserId, { role: 'presenter' });
    }

    const existingPresenter = await Presenter.findOne({ user: targetUserId });
    if (existingPresenter) {
      return res.status(400).json({
        success: false,
        message: 'A presenter profile already exists for this user.'
      });
    }

    const presenter = await Presenter.create({
      user: targetUserId,
      designation: designation || 'Speaker / Faculty Lead',
      department: department || 'Academics',
      contact: contact || '9876543210',
      bio: bio || 'Expert presenter and coordinator.',
      specialization: specialization || 'Technology & Leadership'
    });

    const populatedPresenter = await Presenter.findById(presenter._id).populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Presenter profile created successfully!',
      presenter: populatedPresenter
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update presenter profile
// @route   PUT /api/presenters/:id
// @access  Private (Admin / Presenter self)
exports.updatePresenter = async (req, res, next) => {
  try {
    let presenter = await Presenter.findById(req.params.id);
    if (!presenter) {
      return res.status(404).json({
        success: false,
        message: 'Presenter not found'
      });
    }

    // Role check: Admin or the owner
    if (req.user.role !== 'admin' && presenter.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this presenter profile.'
      });
    }

    const { designation, department, contact, bio, specialization, name } = req.body;

    if (name) {
      await User.findByIdAndUpdate(presenter.user, { name: name.trim() });
    }

    presenter = await Presenter.findByIdAndUpdate(
      req.params.id,
      {
        ...(designation && { designation: designation.trim() }),
        ...(department && { department: department.trim() }),
        ...(contact && { contact: contact.trim() }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(specialization && { specialization: specialization.trim() })
      },
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Presenter updated successfully!',
      presenter
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete presenter profile (Admin)
// @route   DELETE /api/presenters/:id
// @access  Private (Admin)
exports.deletePresenter = async (req, res, next) => {
  try {
    const presenter = await Presenter.findById(req.params.id);
    if (!presenter) {
      return res.status(404).json({
        success: false,
        message: 'Presenter not found'
      });
    }

    // Unlink presenter from any events
    await Event.updateMany({ presenter: presenter._id }, { presenter: null });

    // Remove presenter record and optionally downgrade user
    await Presenter.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Presenter profile deleted and unassigned from events successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assigned events for logged-in presenter
// @route   GET /api/presenters/my/assigned-events
// @access  Private (Presenter)
exports.getMyAssignedEvents = async (req, res, next) => {
  try {
    const presenter = await Presenter.findOne({ user: req.user._id });
    if (!presenter) {
      return res.status(404).json({
        success: false,
        message: 'No presenter profile found for current user.'
      });
    }

    const events = await Event.find({ presenter: presenter._id })
      .populate('presenter')
      .sort('-eventDate');

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    next(err);
  }
};
