const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getStatsOverview
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/stats/overview', protect, getStatsOverview);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, authorize('admin', 'presenter'), createEvent);
router.put('/:id', protect, authorize('admin', 'presenter'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

module.exports = router;
