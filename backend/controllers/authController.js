const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Presenter = require('../models/Presenter');
const Notification = require('../models/Notification');
const { validateRegisterInput, validateLoginInput } = require('../validators/inputValidator');

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_college_event_jwt_key_2026_jwt_token',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register a new user (Student / Presenter / Admin)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const { name, email, password, role = 'student', ...profileData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Create Base User
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role
    });

    let extraProfile = null;

    // Create role-specific profile
    if (role === 'student') {
      // Check if studentId already exists
      const existingStudent = await Student.findOne({ studentId: (profileData.studentId || '').toUpperCase() });
      if (existingStudent) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          message: 'Student ID / Roll Number is already registered.'
        });
      }

      extraProfile = await Student.create({
        user: user._id,
        studentId: (profileData.studentId || `STU-${Date.now().toString().slice(-4)}`).toUpperCase(),
        department: profileData.department || 'Computer Science',
        year: profileData.year || '1st Year',
        phone: profileData.phone || '9876543210'
      });
    } else if (role === 'presenter') {
      extraProfile = await Presenter.create({
        user: user._id,
        designation: profileData.designation || 'Guest Presenter',
        department: profileData.department || 'General Academics',
        contact: profileData.contact || profileData.phone || '9876543210',
        bio: profileData.bio || 'Expert presenter and seminar coordinator.'
      });
    }

    // Send welcome notification
    await Notification.create({
      user: user._id,
      message: `Welcome to College Event Presenter System, ${user.name}! Your ${user.role} account is ready.`,
      type: 'general'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: extraProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate User & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const validation = validateLoginInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id });
    } else if (user.role === 'presenter') {
      profile = await Presenter.findOne({ user: user._id });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Current Logged-in User Profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id });
    } else if (user.role === 'presenter') {
      profile = await Presenter.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, studentId, department, year, phone, designation, contact, bio } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    await user.save();

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOneAndUpdate(
        { user: user._id },
        { 
          ...(studentId && { studentId: studentId.toUpperCase().trim() }),
          ...(department && { department: department.trim() }),
          ...(year && { year: year.trim() }),
          ...(phone && { phone: phone.trim() })
        },
        { new: true, upsert: true }
      );
    } else if (user.role === 'presenter') {
      profile = await Presenter.findOneAndUpdate(
        { user: user._id },
        {
          ...(designation && { designation: designation.trim() }),
          ...(department && { department: department.trim() }),
          ...(contact && { contact: contact.trim() }),
          ...(bio !== undefined && { bio: bio.trim() })
        },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    
    const users = await User.find(query).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
};
