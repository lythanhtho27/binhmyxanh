const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.post('/update', cartController.updateCart);
router.get('/remove/:id', cartController.removeFromCart);
router.get('/checkout', cartController.getCheckout);
router.post('/checkout', cartController.postCheckout);
router.get('/success/:orderCode', cartController.orderSuccess);

module.exports = router;
