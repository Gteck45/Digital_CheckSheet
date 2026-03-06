const router = require('express').Router();
const BrandController = require('../controllers/brandController');

router.get('/', BrandController.getAll);
router.post('/', BrandController.create);
router.put('/:id', BrandController.update);
router.delete('/:id', BrandController.delete);

module.exports = router;