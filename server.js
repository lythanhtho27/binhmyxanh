const express = require('express');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./config/db');
const { globalVariables } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Bật CORS cho phép Web Flutter và Mobile App kết nối
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Cấu hình View Engine (EJS & Layouts)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware xử lý dữ liệu Form và JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Phục vụ các file tĩnh (CSS, JS, Hình ảnh)
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình Session (Quản lý giỏ hàng & tài khoản đăng nhập)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'nongsan_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 ngày
    }
  })
);

// Gắn biến toàn cục cho EJS (người dùng hiện tại, số lượng giỏ hàng, menu active)
app.use(globalVariables);

// Đăng ký các Routes chính
app.use('/', require('./routes/index'));
app.use('/products', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api')); // API Backend phục vụ Mobile App Nhật Ký Giọng Nói


// Xử lý trang 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Không tìm thấy trang',
    message: 'Trang nông sản bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.',
    layout: 'layouts/main'
  });
});

// Xử lý lỗi hệ thống chung
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err);
  res.status(500).render('error', {
    title: '500 - Lỗi máy chủ',
    message: 'Hệ thống đang bảo trì hoặc gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.',
    layout: 'layouts/main'
  });
});

// Khởi tạo Cơ sở dữ liệu và khởi động Server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log('=====================================================');
      console.log(`🌿 Website Bình Mỹ Xanh đang chạy tại:`);
      console.log(`👉 http://localhost:${PORT}`);
      console.log(`👉 Quản trị Admin: http://localhost:${PORT}/admin`);
      console.log(`🔐 Tài khoản Admin: admin@nongsan.vn / admin123`);
      console.log(`🛒 Tài khoản User:  khachhang@gmail.com / user123`);
      console.log('=====================================================');
    });
  })
  .catch(err => {
    console.error('❌ Không thể kết nối cơ sở dữ liệu để khởi động server:', err);
  });
