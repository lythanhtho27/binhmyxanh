const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.index);
router.get('/:id/qrcode', productController.getQrCode);
router.get('/:id', productController.detail);

module.exports = router;

