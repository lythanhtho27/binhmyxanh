module.exports = {
  // Kiểm tra đã đăng nhập chưa
  requireAuth(req, res, next) {
    if (req.session && req.session.user) {
      return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/auth/login?msg=required');
  },

  // Kiểm tra quyền Admin
  requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    res.status(403).render('error', {
      title: 'Truy cập bị từ chối',
      message: 'Bạn không có quyền truy cập vào khu vực quản trị viên!',
      layout: 'layouts/main'
    });
  },

  // Gắn thông tin người dùng và giỏ hàng vào res.locals cho mọi template EJS
  globalVariables(req, res, next) {
    res.locals.currentUser = req.session.user || null;
    res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
    
    // Tính tổng số lượng hàng trong giỏ
    const cart = req.session.cart || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    res.locals.cart = cart;
    res.locals.cartCount = cartCount;
    res.locals.cartTotal = cartTotal;
    res.locals.currentPath = req.path;
    next();
  }
};
