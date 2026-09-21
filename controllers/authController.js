const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');

const authController = {
  getLogin(req, res) {
    if (req.session.user) {
      return res.redirect('/');
    }
    const error = req.session.error || null;
    const success = req.session.success || null;
    delete req.session.error;
    delete req.session.success;

    res.render('auth/login', {
      title: 'Đăng nhập tài khoản - Bình Mỹ Xanh',
      error,
      success,
      layout: 'layouts/main'
    });
  },

  async postLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        req.session.error = 'Vui lòng nhập đầy đủ Email và Mật khẩu!';
        return res.redirect('/auth/login');
      }

      const user = await User.findByEmail(email.trim());
      if (!user) {
        req.session.error = 'Email hoặc mật khẩu không chính xác!';
        return res.redirect('/auth/login');
      }

      if (user.status === 'locked') {
        req.session.error = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!';
        return res.redirect('/auth/login');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.session.error = 'Email hoặc mật khẩu không chính xác!';
        return res.redirect('/auth/login');
      }

      // Lưu thông tin người dùng vào session (bỏ password)
      req.session.user = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      };

      const returnTo = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/');
      delete req.session.returnTo;
      res.redirect(returnTo);
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      req.session.error = 'Đã xảy ra lỗi máy chủ, vui lòng thử lại!';
      res.redirect('/auth/login');
    }
  },

  getRegister(req, res) {
    if (req.session.user) {
      return res.redirect('/');
    }
    const error = req.session.error || null;
    delete req.session.error;

    res.render('auth/register', {
      title: 'Đăng ký tài khoản mới - Bình Mỹ Xanh',
      error,
      layout: 'layouts/main'
    });
  },

  async postRegister(req, res) {
    try {
      const { full_name, email, password, confirm_password, phone, address } = req.body;

      if (!full_name || !email || !password) {
        req.session.error = 'Vui lòng nhập đủ các thông tin bắt buộc!';
        return res.redirect('/auth/register');
      }

      if (password !== confirm_password) {
        req.session.error = 'Mật khẩu xác nhận không trùng khớp!';
        return res.redirect('/auth/register');
      }

      if (password.length < 6) {
        req.session.error = 'Mật khẩu phải có ít nhất 6 ký tự!';
        return res.redirect('/auth/register');
      }

      const existingUser = await User.findByEmail(email.trim());
      if (existingUser) {
        req.session.error = 'Email này đã được sử dụng. Vui lòng chọn email khác!';
        return res.redirect('/auth/register');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = await User.create({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        role: 'customer'
      });

      // Tự động đăng nhập sau khi đăng ký
      req.session.user = {
        id: newUserId,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || '',
        address: address || '',
        role: 'customer'
      };

      res.redirect('/');
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      req.session.error = 'Lỗi hệ thống khi tạo tài khoản!';
      res.redirect('/auth/register');
    }
  },

  logout(req, res) {
    req.session.user = null;
    req.session.destroy(err => {
      if (err) console.error('Lỗi hủy session:', err);
      res.redirect('/');
    });
  },

  async profile(req, res) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.user.id);
    const orders = await Order.getByUserId(req.session.user.id);
    const message = req.session.message || null;
    delete req.session.message;

    res.render('auth/profile', {
      title: 'Tài khoản của tôi - Bình Mỹ Xanh',
      user,
      orders,
      message,
      layout: 'layouts/main'
    });
  },

  async updateProfile(req, res) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    try {
      const { full_name, phone, address } = req.body;
      await User.updateProfile(req.session.user.id, { full_name, phone, address });
      
      req.session.user.full_name = full_name;
      req.session.user.phone = phone;
      req.session.user.address = address;

      req.session.message = 'Cập nhật thông tin tài khoản thành công!';
      res.redirect('/auth/profile');
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      req.session.message = 'Không thể cập nhật thông tin lúc này.';
      res.redirect('/auth/profile');
    }
  }
};

module.exports = authController;
