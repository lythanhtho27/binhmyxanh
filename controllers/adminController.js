const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const FarmingLot = require('../models/FarmingLot');
const FarmingLog = require('../models/FarmingLog');

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
        origin: origin || 'Bình Mỹ, Củ Chi',
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
        origin: origin || 'Bình Mỹ, Củ Chi',
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
  },

  // 5. Quản lý Nhật ký canh tác theo sản phẩm
  async farmingLogs(req, res) {
    try {
      const allProducts = await Product.getAll({ limit: 100 });
      let allLots = await FarmingLot.getAll();

      // Nếu truyền product_id mà sản phẩm chưa có lot, tự động tạo
      let selectedLot = null;
      if (req.query.product_id) {
        const prodId = parseInt(req.query.product_id);
        selectedLot = await FarmingLot.getByProductId(prodId);
        if (!selectedLot) {
          const prod = allProducts.find(p => p.id === prodId) || await Product.getById(prodId);
          if (prod) {
            selectedLot = await FarmingLot.getOrCreateForProduct(prod);
            allLots = await FarmingLot.getAll();
          }
        }
      } else if (req.query.lot_id) {
        const lotId = parseInt(req.query.lot_id);
        selectedLot = await FarmingLot.getById(lotId);
      }

      // Nếu chưa chọn lô nào, mặc định lấy lô đầu tiên hoặc tạo cho sản phẩm đầu tiên
      if (!selectedLot && allLots.length > 0) {
        selectedLot = allLots[0];
      } else if (!selectedLot && allProducts.length > 0) {
        selectedLot = await FarmingLot.getOrCreateForProduct(allProducts[0]);
        allLots = await FarmingLot.getAll();
      }

      let farmingStages = [];
      let logs = [];
      if (selectedLot) {
        farmingStages = await FarmingLog.getGroupedByStage(selectedLot.id);
        logs = await FarmingLog.getByLotId(selectedLot.id);
      }

      const message = req.session.adminMessage || null;
      delete req.session.adminMessage;

      res.render('admin/farming-logs', {
        title: 'Quản Lý Nhật Ký Canh Tác VietGAP - Admin',
        allProducts,
        allLots,
        selectedLot,
        farmingStages,
        logs,
        message,
        layout: 'layouts/admin'
      });
    } catch (error) {
      console.error('Lỗi tải trang quản lý nhật ký canh tác:', error);
      res.status(500).send('Lỗi máy chủ Admin khi tải nhật ký');
    }
  },

  async updateFarmingLot(req, res) {
    try {
      const id = parseInt(req.params.id);
      await FarmingLot.update(id, req.body);
      req.session.adminMessage = { type: 'success', text: 'Đã cập nhật thông tin lô canh tác thành công!' };
      res.redirect(`/admin/farming-logs?lot_id=${id}`);
    } catch (error) {
      console.error('Lỗi cập nhật lô canh tác:', error);
      req.session.adminMessage = { type: 'error', text: 'Lỗi cập nhật lô canh tác: ' + error.message };
      res.redirect('/admin/farming-logs');
    }
  },

  async createFarmingLog(req, res) {
    try {
      const {
        lot_id, log_date, day_number, stage_id, session_of_day,
        action_title, action_detail, materials_used, dosage, notes,
        is_quarantine_notice, is_harvest_test
      } = req.body;

      const stageNames = {
        '1': 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể',
        '2': 'Giai đoạn 2: Xử lý giống & Xuống giống gieo trồng',
        '3': 'Giai đoạn 3: Chăm sóc & Cây con phát triển',
        '4': 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn',
        '5': 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện'
      };

      await FarmingLog.create({
        lot_id: parseInt(lot_id),
        log_date: log_date || new Date().toISOString().split('T')[0],
        day_number: parseInt(day_number) || 1,
        stage_id: parseInt(stage_id) || 1,
        stage_name: stageNames[String(stage_id)] || 'Giai đoạn canh tác',
        session_of_day: session_of_day || 'morning',
        action_title: (action_title || '').trim(),
        action_detail: (action_detail || '').trim(),
        materials_used: materials_used ? materials_used.trim() : null,
        dosage: dosage ? dosage.trim() : null,
        notes: notes ? notes.trim() : null,
        is_quarantine_notice: is_quarantine_notice === '1' || is_quarantine_notice === 'true' || is_quarantine_notice === 'on',
        is_harvest_test: is_harvest_test === '1' || is_harvest_test === 'true' || is_harvest_test === 'on'
      });

      req.session.adminMessage = { type: 'success', text: 'Đã thêm nhật ký canh tác mới thành công!' };
      res.redirect(lot_id ? `/admin/farming-logs?lot_id=${lot_id}` : '/admin/farming-logs');
    } catch (error) {
      console.error('Lỗi thêm nhật ký canh tác:', error);
      req.session.adminMessage = { type: 'error', text: 'Lỗi thêm nhật ký: ' + error.message };
      res.redirect(req.body && req.body.lot_id ? `/admin/farming-logs?lot_id=${req.body.lot_id}` : '/admin/farming-logs');
    }
  },

  async updateFarmingLog(req, res) {
    try {
      const id = parseInt(req.params.id);
      const existingLog = await FarmingLog.getById(id);
      const {
        lot_id, log_date, day_number, stage_id, session_of_day,
        action_title, action_detail, materials_used, dosage, notes,
        is_quarantine_notice, is_harvest_test
      } = req.body;

      const stageNames = {
        '1': 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể',
        '2': 'Giai đoạn 2: Xử lý giống & Xuống giống gieo trồng',
        '3': 'Giai đoạn 3: Chăm sóc & Cây con phát triển',
        '4': 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn',
        '5': 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện'
      };

      const finalLotId = lot_id || (existingLog ? existingLog.lot_id : null);

      await FarmingLog.update(id, {
        log_date: log_date || (existingLog ? existingLog.log_date : null),
        day_number: parseInt(day_number) || (existingLog ? existingLog.day_number : 1),
        stage_id: parseInt(stage_id) || (existingLog ? existingLog.stage_id : 1),
        stage_name: stageNames[String(stage_id)] || (existingLog ? existingLog.stage_name : 'Giai đoạn canh tác'),
        session_of_day: session_of_day || 'morning',
        action_title: (action_title || '').trim(),
        action_detail: (action_detail || '').trim(),
        materials_used: materials_used ? materials_used.trim() : null,
        dosage: dosage ? dosage.trim() : null,
        notes: notes ? notes.trim() : null,
        is_quarantine_notice: is_quarantine_notice === '1' || is_quarantine_notice === 'true' || is_quarantine_notice === 'on',
        is_harvest_test: is_harvest_test === '1' || is_harvest_test === 'true' || is_harvest_test === 'on'
      });

      req.session.adminMessage = { type: 'success', text: 'Đã cập nhật nhật ký canh tác thành công!' };
      res.redirect(finalLotId ? `/admin/farming-logs?lot_id=${finalLotId}` : '/admin/farming-logs');
    } catch (error) {
      console.error('Lỗi cập nhật nhật ký canh tác:', error);
      req.session.adminMessage = { type: 'error', text: 'Lỗi cập nhật nhật ký: ' + error.message };
      res.redirect('/admin/farming-logs');
    }
  },

  async deleteFarmingLog(req, res) {
    try {
      const id = parseInt(req.params.id);
      const log = await FarmingLog.getById(id);
      const lotId = log ? log.lot_id : null;
      await FarmingLog.delete(id);
      req.session.adminMessage = { type: 'success', text: 'Đã xóa nhật ký canh tác!' };
      res.redirect(lotId ? `/admin/farming-logs?lot_id=${lotId}` : '/admin/farming-logs');
    } catch (error) {
      console.error('Lỗi xóa nhật ký canh tác:', error);
      req.session.adminMessage = { type: 'error', text: 'Lỗi xóa nhật ký!' };
      res.redirect('/admin/farming-logs');
    }
  }
};

module.exports = adminController;
