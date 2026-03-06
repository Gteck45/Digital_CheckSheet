const express = require('express');
const router = express.Router();

const StationController = require('../controllers/stationController');


// Get All
router.get('/', StationController.getAll);

// Get One
router.get('/:id', StationController.getOne);

// Create
router.post('/', StationController.create);

// Update
router.put('/:id', StationController.update);

// Change Status
router.post('/:id/status', StationController.changeStatus);

// Hard Delete
router.delete('/:id/hard', StationController.hardDelete);


module.exports = router;