const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Presenter = require('../models/Presenter');

// Protect routes: verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_college_event_jwt_key_2026_jwt_token');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;

    // Attach student/presenter profile reference if available
    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ user: user._id });
      if (studentProfile) {
        req.student = studentProfile;
      }
    } else if (user.role === 'presenter') {
      const presenterProfile = await Presenter.findOne({ user: user._id });
      if (presenterProfile) {
        req.presenter = presenterProfile;
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired authentication token.'
    });
  }
};

module.exports = { protect };
