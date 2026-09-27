const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Cấu hình Multer upload hình ảnh sản phẩm
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/products'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});

const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh (jpg, png, webp, gif)'));
  }
});

// Tất cả các routes trong admin đều bắt buộc đăng nhập và quyền admin
router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/', adminController.dashboard);

// Quản lý sản phẩm
router.get('/products', adminController.products);
router.post('/products/add', uploadProduct.single('product_image_file'), adminController.createProduct);
router.post('/products/edit/:id', uploadProduct.single('product_image_file'), adminController.updateProduct);
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
