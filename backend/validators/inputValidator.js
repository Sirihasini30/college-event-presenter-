// Input Validation Helper Utility

const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
  return re.test(String(email).toLowerCase());
};

const validateRegisterInput = (data) => {
  const errors = [];
  const { name, email, password, role } = data;

  if (!name || name.trim().length === 0) errors.push('Name is required');
  if (!email || !validateEmail(email)) errors.push('A valid email address is required');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  
  if (role && !['admin', 'presenter', 'student'].includes(role)) {
    errors.push('Role must be one of: admin, presenter, student');
  }

  // If role is student, validate student fields
  if (role === 'student' || (!role && (data.studentId || data.department))) {
    if (!data.studentId || data.studentId.trim().length === 0) errors.push('Student ID / Roll Number is required');
    if (!data.department || data.department.trim().length === 0) errors.push('Department is required');
    if (!data.year || data.year.trim().length === 0) errors.push('Academic Year is required');
    if (!data.phone || data.phone.trim().length === 0) errors.push('Phone number is required');
  }

  // If role is presenter, validate presenter fields
  if (role === 'presenter') {
    if (!data.designation || data.designation.trim().length === 0) errors.push('Designation is required');
    if (!data.department || data.department.trim().length === 0) errors.push('Department is required');
    if (!data.contact || data.contact.trim().length === 0) errors.push('Contact information is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLoginInput = (data) => {
  const errors = [];
  const { email, password } = data;

  if (!email || !validateEmail(email)) errors.push('A valid email address is required');
  if (!password) errors.push('Password is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateEventInput = (data) => {
  const errors = [];
  const { title, description, category, venue, eventDate, startTime, endTime, capacity } = data;

  if (!title || title.trim().length === 0) errors.push('Event title is required');
  if (!description || description.trim().length === 0) errors.push('Event description is required');
  if (!category) errors.push('Category is required');
  if (!venue || venue.trim().length === 0) errors.push('Venue location is required');
  if (!eventDate) errors.push('Event date is required');
  if (!startTime) errors.push('Start time is required');
  if (!endTime) errors.push('End time is required');
  if (capacity === undefined || isNaN(capacity) || Number(capacity) < 1) {
    errors.push('Capacity must be a positive number greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateScheduleInput = (data) => {
  const errors = [];
  const { event, activityName, scheduleDate, startTime, endTime, venue } = data;

  if (!event) errors.push('Event reference is required');
  if (!activityName || activityName.trim().length === 0) errors.push('Activity name is required');
  if (!scheduleDate) errors.push('Schedule date is required');
  if (!startTime) errors.push('Start time is required');
  if (!endTime) errors.push('End time is required');
  if (!venue || venue.trim().length === 0) errors.push('Venue is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateResultInput = (data) => {
  const errors = [];
  const { event, student, position } = data;

  if (!event) errors.push('Event reference is required');
  if (!student) errors.push('Student reference is required');
  if (!position || position.trim().length === 0) errors.push('Position/award is required');

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateEventInput,
  validateScheduleInput,
  validateResultInput
};
