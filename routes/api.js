const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const apiAuthController = require('../controllers/api/apiAuthController');
const apiFarmingController = require('../controllers/api/apiFarmingController');
const { requireAuth, optionalAuth } = require('../middleware/apiAuthMiddleware');

// 1. Cấu hình Multer để lưu ảnh chụp từ điện thoại nông dân
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/farming'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'farm-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file định dạng ảnh (jpg, png, webp)!'));
  }
});

// 2. CORS Middleware dành riêng cho Mobile App
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==========================================
// 3. API AUTHENTICATION (Đăng nhập Mobile)
// ==========================================
// POST /api/auth/login (Đăng nhập bằng số điện thoại hoặc email)
router.post('/auth/login', apiAuthController.login);

// GET /api/auth/me (Lấy thông tin tài khoản đang đăng nhập)
router.get('/auth/me', requireAuth, apiAuthController.getProfile);

// ==========================================
// 4. API BÓC TÁCH GIỌNG NÓI (Speech-to-Text)
// ==========================================
// POST /api/voice/parse (Gửi câu nói tiếng Việt, nhận về thực thể JSON)
router.post('/voice/parse', optionalAuth, apiFarmingController.parseVoice);

// ==========================================
// 5. API LÔ CANH TÁC (Farming Lots)
// ==========================================
// GET /api/farming/lots (Danh sách các lô canh tác kèm tiến độ)
router.get('/farming/lots', optionalAuth, apiFarmingController.getLots);

// GET /api/farming/lots/:id (Chi tiết 1 lô kèm toàn bộ nhật ký 5 giai đoạn)
router.get('/farming/lots/:id', optionalAuth, apiFarmingController.getLotDetail);

// ==========================================
// 6. API NHẬT KÝ CANH TÁC (Farming Logs)
// ==========================================
// POST /api/farming/logs (Lưu nhật ký mới từ giọng nói hoặc form)
router.post('/farming/logs', optionalAuth, apiFarmingController.createLog);

// PUT /api/farming/logs/:id (Chỉnh sửa nhật ký khi nói sai)
router.put('/farming/logs/:id', optionalAuth, apiFarmingController.updateLog);

// DELETE /api/farming/logs/:id (Xóa bản ghi nhật ký)
router.delete('/farming/logs/:id', optionalAuth, apiFarmingController.deleteLog);

// GET /api/farming/recent (Nhật ký mới ghi nhận gần đây)
router.get('/farming/recent', optionalAuth, apiFarmingController.getRecentLogs);

// GET /api/farming/stats (Thống kê tổng quan cho Dashboard Mobile)
router.get('/farming/stats', optionalAuth, apiFarmingController.getDashboardStats);

// POST /api/farming/upload-image (Tải ảnh hiện trường từ điện thoại)
router.post('/farming/upload-image', optionalAuth, upload.single('image'), apiFarmingController.uploadImage);

module.exports = router;
