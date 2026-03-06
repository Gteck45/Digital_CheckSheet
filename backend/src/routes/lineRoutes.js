const express = require('express');
const router = express.Router();

const LineController = require('../controllers/lineController');


// Get All
router.get('/', LineController.getAll);

// Get One
router.get('/:id', LineController.getOne);

// Create
router.post('/', LineController.create);

// Update
router.put('/:id', LineController.update);

// Change Status
router.post('/:id/status', LineController.changeStatus);

// Hard Delete
router.delete('/:id/hard', LineController.hardDelete);


module.exports = router;