const router = require('express').Router();
const ModelController = require('../controllers/modelController');

router.get('/', ModelController.getAll);
router.get('/by-brand/:brandId', ModelController.getByBrand);

router.post('/', ModelController.create);
router.put('/:id', ModelController.update);
router.delete('/:id', ModelController.delete);

module.exports = router;