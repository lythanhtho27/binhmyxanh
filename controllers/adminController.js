const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

const adminController = {
  // 1. Dashboard tổng quan
  async dashboard(req, res) {
    try {
      const stats = await Order.getDashboardStats();
      res.render('admin/dashboard', {
        title: 'Bảng Điều Khiển Quản Trị - Bình Mỹ Xanh',
        stats,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Lỗi tải Admin Dashboard:', error);
      res.status(500).send('Lỗi máy chủ Admin');
    }
  },

  // 2. Quản lý sản phẩm
  async products(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || null;
      const categoryId = req.query.category ? parseInt(req.query.category) : null;

      const [products, totalProducts, categories] = await Promise.all([
        Product.getAll({ categoryId, search, limit, offset }),
        Product.count({ categoryId, search }),
        Category.getAll()
      ]);

      const totalPages = Math.ceil(totalProducts / limit);
      const message = req.session.adminMessage || null;
      delete req.session.adminMessage;

      res.render('admin/products', {
        title: 'Quản Lý Sản Phẩm - Admin',
        products,
        categories,
        searchQuery: search || '',
        selectedCategory: categoryId,
        currentPage: page,
        totalPages,
        totalProducts,
        message,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Lỗi tải quản lý sản phẩm:', error);
      res.status(500).send('Lỗi tải trang sản phẩm');
    }
  },

  async createProduct(req, res) {
    try {
      const {
        category_id, name, price, original_price, unit, stock, origin,
        harvest_date, shelf_life, certification, image, short_description,
        description, nutrition_info, storage_guide, is_featured, is_new
      } = req.body;

      // Ưu tiên ảnh upload từ máy tính, nếu không thì lấy link URL
      let finalImage = image ? image.trim() : '';
      if (req.file) {
        finalImage = `/uploads/products/${req.file.filename}`;
      }
      if (!finalImage) {
        finalImage = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80';
      }

      await Product.create({
        category_id: parseInt(category_id),
        name: name.trim(),
        price: parseFloat(price),
        original_price: original_price ? parseFloat(original_price) : null,
        unit: unit || 'kg',
        stock: parseInt(stock) || 50,
        origin: origin || 'Việt Nam',
        harvest_date: harvest_date || 'Hái mới trong ngày',
        shelf_life: shelf_life || '5-7 ngày',
        certification: certification || 'VietGAP',
        image: finalImage,
        short_description: short_description || '',
        description: description || '',
        nutrition_info: nutrition_info || '',
        storage_guide: storage_guide || '',
        is_featured: is_featured === '1' || is_featured === 'true' || is_featured === 'on',
        is_new: is_new === '1' || is_new === 'true' || is_new === 'on'
      });

      req.session.adminMessage = { type: 'success', text: 'Đã thêm sản phẩm mới và cập nhật hình ảnh thành công!' };
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Lỗi thêm sản phẩm:', error);
      req.session.adminMessage = { type: 'error', text: 'Không thể thêm sản phẩm, vui lòng kiểm tra lại dữ liệu.' };
      res.redirect('/admin/products');
    }
  },

  async updateProduct(req, res) {
    try {
      const id = parseInt(req.params.id);
      const {
        category_id, name, price, original_price, unit, stock, origin,
        harvest_date, shelf_life, certification, image, short_description,
        description, nutrition_info, storage_guide, is_featured, is_new
      } = req.body;

      // Nếu có upload file ảnh mới thì lấy file ảnh mới
      let finalImage = image ? image.trim() : '';
      if (req.file) {
        finalImage = `/uploads/products/${req.file.filename}`;
      }
      // Nếu cả file lẫn ô URL đều trống, giữ lại ảnh cũ trong DB
      if (!finalImage) {
        const existing = await Product.getById(id);
        if (existing) {
          finalImage = existing.image;
        }
      }

      await Product.update(id, {
        category_id: parseInt(category_id),
        name: name.trim(),
        price: parseFloat(price),
        original_price: original_price ? parseFloat(original_price) : null,
        unit: unit || 'kg',
        stock: parseInt(stock) || 0,
        origin: origin || 'Việt Nam',
        harvest_date: harvest_date || 'Hái mới trong ngày',
        shelf_life: shelf_life || '5-7 ngày',
        certification: certification || 'VietGAP',
        image: finalImage,
        short_description: short_description || '',
        description: description || '',
        nutrition_info: nutrition_info || '',
        storage_guide: storage_guide || '',
        is_featured: is_featured === '1' || is_featured === 'true' || is_featured === 'on',
        is_new: is_new === '1' || is_new === 'true' || is_new === 'on'
      });

      req.session.adminMessage = { type: 'success', text: 'Cập nhật thông tin và hình ảnh sản phẩm thành công!' };
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Lỗi cập nhật sản phẩm:', error);
      req.session.adminMessage = { type: 'error', text: 'Lỗi cập nhật sản phẩm: ' + error.message };
      res.redirect('/admin/products');
    }
  },

  async deleteProduct(req, res) {
    try {
      const id = parseInt(req.params.id);
      await Product.delete(id);
      req.session.adminMessage = { type: 'success', text: 'Đã xóa sản phẩm thành công!' };
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Lỗi xóa sản phẩm:', error);
      req.session.adminMessage = { type: 'error', text: 'Lỗi khi xóa sản phẩm!' };
      res.redirect('/admin/products');
    }
  },

  // 3. Quản lý người dùng
  async users(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || null;

      const [users, totalUsers] = await Promise.all([
        User.getAll({ search, limit, offset }),
        User.count({ search })
      ]);

      const totalPages = Math.ceil(totalUsers / limit);
      const message = req.session.adminMessage || null;
      delete req.session.adminMessage;

      res.render('admin/users', {
        title: 'Quản Lý Người Dùng - Admin',
        users,
        searchQuery: search || '',
        currentPage: page,
        totalPages,
        totalUsers,
        message,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Lỗi tải người dùng:', error);
      res.status(500).send('Lỗi tải danh sách người dùng');
    }
  },

  async toggleUserRole(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { role } = req.body;
      if (['admin', 'customer'].includes(role)) {
        await User.updateRole(id, role);
        req.session.adminMessage = { type: 'success', text: 'Đã thay đổi vai trò tài khoản!' };
      }
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Lỗi đổi vai trò user:', error);
      res.redirect('/admin/users');
    }
  },

  async toggleUserStatus(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (['active', 'locked'].includes(status)) {
        await User.updateStatus(id, status);
        req.session.adminMessage = { type: 'success', text: 'Đã cập nhật trạng thái hoạt động của tài khoản!' };
      }
      res.redirect('/admin/users');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái user:', error);
      res.redirect('/admin/users');
    }
  },

  // 4. Quản lý đơn hàng
  async orders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const offset = (page - 1) * limit;
      const status = req.query.status || 'all';
      const search = req.query.search || null;

      const [orders, totalOrders] = await Promise.all([
        Order.getAll({ status, search, limit, offset }),
        Order.count({ status, search })
      ]);

      const totalPages = Math.ceil(totalOrders / limit);
      const message = req.session.adminMessage || null;
      delete req.session.adminMessage;

      res.render('admin/orders', {
        title: 'Quản Lý Đơn Hàng - Admin',
        orders,
        currentStatus: status,
        searchQuery: search || '',
        currentPage: page,
        totalPages,
        totalOrders,
        message,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Lỗi tải danh sách đơn hàng:', error);
      res.status(500).send('Lỗi tải danh sách đơn hàng');
    }
  },

  async orderDetail(req, res) {
    try {
      const id = parseInt(req.params.id);
      const order = await Order.getById(id);

      if (!order) {
        req.session.adminMessage = { type: 'error', text: 'Không tìm thấy đơn hàng này!' };
        return res.redirect('/admin/orders');
      }

      res.render('admin/order-detail', {
        title: `Chi Tiết Đơn Hàng #${order.order_code} - Admin`,
        order,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Lỗi tải chi tiết đơn hàng:', error);
      res.redirect('/admin/orders');
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { status, payment_status } = req.body;

      if (status) {
        await Order.updateStatus(id, status);
      }
      if (payment_status) {
        await Order.updatePaymentStatus(id, payment_status);
      }

      req.session.adminMessage = { type: 'success', text: 'Đã cập nhật trạng thái đơn hàng!' };
      res.redirect(`/admin/orders/${id}`);
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
      res.redirect('/admin/orders');
    }
  }
};

module.exports = adminController;
