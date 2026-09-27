const express = require('express');
const router = express.Router();
const {
  getSchedulesByEvent,
  createSchedule,
  updateSchedule,
  deleteSchedule
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/:eventId', getSchedulesByEvent);
router.post('/', protect, authorize('admin', 'presenter'), createSchedule);
router.put('/:id', protect, authorize('admin', 'presenter'), updateSchedule);
router.delete('/:id', protect, authorize('admin', 'presenter'), deleteSchedule);

module.exports = router;
