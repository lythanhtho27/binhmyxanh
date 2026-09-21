const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/logout', authController.logout);

router.get('/profile', requireAuth, authController.profile);
router.post('/profile', requireAuth, authController.updateProfile);

module.exports = router;
