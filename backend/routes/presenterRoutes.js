const express = require('express');
const router = express.Router();
const {
  getPresenters,
  getPresenterById,
  createPresenter,
  updatePresenter,
  deletePresenter,
  getMyAssignedEvents
} = require('../controllers/presenterController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', getPresenters);
router.get('/my/assigned-events', protect, authorize('presenter', 'admin'), getMyAssignedEvents);
router.get('/:id', getPresenterById);
router.post('/', protect, authorize('admin'), createPresenter);
router.put('/:id', protect, authorize('admin', 'presenter'), updatePresenter);
router.delete('/:id', protect, authorize('admin'), deletePresenter);

module.exports = router;
