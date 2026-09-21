const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Tất cả các routes trong admin đều bắt buộc đăng nhập và quyền admin
router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/', adminController.dashboard);

// Quản lý sản phẩm
router.get('/products', adminController.products);
router.post('/products/add', adminController.createProduct);
router.post('/products/edit/:id', adminController.updateProduct);
router.post('/products/delete/:id', adminController.deleteProduct);

// Quản lý người dùng
router.get('/users', adminController.users);
router.post('/users/role/:id', adminController.toggleUserRole);
router.post('/users/status/:id', adminController.toggleUserStatus);

// Quản lý đơn hàng
router.get('/orders', adminController.orders);
router.get('/orders/:id', adminController.orderDetail);
router.post('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;
