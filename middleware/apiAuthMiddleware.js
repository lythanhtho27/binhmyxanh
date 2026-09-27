const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nongsan_jwt_secret_key_vietgap_2026';

const apiAuthMiddleware = {
  // Middleware bắt buộc phải có Token đăng nhập hợp lệ
  requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : (req.query.token || req.headers['x-access-token']);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Yêu cầu mã xác thực Token. Vui lòng đăng nhập tài khoản nông dân / kỹ thuật viên.',
        code: 'TOKEN_MISSING'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn hoặc mã Token không hợp lệ. Vui lòng đăng nhập lại.',
        code: 'TOKEN_INVALID'
      });
    }
  },

  // Middleware không bắt buộc token (nếu có thì gắn user, không có vẫn cho qua)
  optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      } catch (err) {
        // Bỏ qua lỗi token nếu là optional
      }
    }
    next();
  }
};

module.exports = apiAuthMiddleware;
