const express = require('express');
const router = express.Router();
const {
  getResultsByEvent,
  getMyResults,
  createResult,
  updateResult,
  deleteResult
} = require('../controllers/resultController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/my', protect, authorize('student'), getMyResults);
router.get('/:eventId', getResultsByEvent);
router.post('/', protect, authorize('admin', 'presenter'), createResult);
router.put('/:id', protect, authorize('admin', 'presenter'), updateResult);
router.delete('/:id', protect, authorize('admin', 'presenter'), deleteResult);

module.exports = router;
