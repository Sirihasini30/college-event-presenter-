const express = require('express');
const router = express.Router();
const {
  getEventReports,
  getRegistrationReports,
  getPresenterReports,
  getResultReports,
  exportCSV
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/events', protect, authorize('admin', 'presenter'), getEventReports);
router.get('/registrations', protect, authorize('admin', 'presenter'), getRegistrationReports);
router.get('/presenters', protect, authorize('admin'), getPresenterReports);
router.get('/results', protect, authorize('admin', 'presenter'), getResultReports);
router.get('/export/csv', protect, authorize('admin', 'presenter'), exportCSV);

module.exports = router;
