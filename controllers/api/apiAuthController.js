const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'nongsan_jwt_secret_key_vietgap_2026';

const apiAuthController = {
  // Đăng nhập cho Nông dân / Kỹ thuật viên qua Mobile App
  async login(req, res) {
    try {
      const { username, email, phone, password } = req.body;
      const accountIdentifier = (username || phone || email || '').trim();

      if (!accountIdentifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập số điện thoại (hoặc email) và mật khẩu'
        });
      }

      const pool = getPool();
      const [users] = await pool.query(
        'SELECT * FROM users WHERE (email = ? OR phone = ?) LIMIT 1',
        [accountIdentifier, accountIdentifier]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản hoặc số điện thoại không tồn tại trong hệ thống'
        });
      }

      const user = users[0];

      if (user.status === 'locked') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu không chính xác. Vui lòng thử lại.'
        });
      }

      // Tạo Token JWT thời hạn 30 ngày cho Mobile App
      const tokenPayload = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });

      return res.json({
        success: true,
        message: `Chào mừng ${user.full_name} đăng nhập thành công!`,
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          address: user.address
        }
      });
    } catch (error) {
      console.error('Lỗi API đăng nhập:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi xử lý đăng nhập'
      });
    }
  },

  // Lấy thông tin tài khoản hiện tại
  async getProfile(req, res) {
    try {
      const pool = getPool();
      const [users] = await pool.query(
        'SELECT id, full_name, email, phone, address, role, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tài khoản'
        });
      }

      return res.json({
        success: true,
        user: users[0]
      });
    } catch (error) {
      console.error('Lỗi lấy profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ'
      });
    }
  }
};

module.exports = apiAuthController;
