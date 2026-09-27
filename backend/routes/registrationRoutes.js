const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  getAllRegistrations,
  cancelRegistration,
  updateRegistrationStatus
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, registerForEvent);
router.get('/my', protect, getMyRegistrations);
router.get('/event/:eventId', protect, authorize('admin', 'presenter'), getEventRegistrations);
router.get('/', protect, authorize('admin', 'presenter'), getAllRegistrations);
router.delete('/:id', protect, cancelRegistration);
router.put('/:id/status', protect, authorize('admin', 'presenter'), updateRegistrationStatus);

module.exports = router;
