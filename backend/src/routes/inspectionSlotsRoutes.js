const express = require('express');
const router = express.Router();

const InspectionSlotController = require('../controllers/inspectionSlotController');

// Get All (paged + search)
router.get('/', InspectionSlotController.getAll);

// Summary for dashboard cards
router.get('/stats/summary', InspectionSlotController.summary);

// Get One
router.get('/:id', InspectionSlotController.getOne);

// Create
router.post('/', InspectionSlotController.create);

// Update
router.put('/:id', InspectionSlotController.update);

// Hard Delete
router.delete('/:id/hard', InspectionSlotController.hardDelete);

module.exports = router;