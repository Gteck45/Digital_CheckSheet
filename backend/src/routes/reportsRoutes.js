const express = require('express');
const router  = express.Router();
const ReportsController = require('../controllers/reportsController');

// GET /api/reports          — paginated list with filters
router.get('/', ReportsController.list);

// GET /api/reports/summary  — KPI counts
router.get('/summary', ReportsController.summary);

module.exports = router;
