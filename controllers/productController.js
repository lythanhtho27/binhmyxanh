const Product = require('../models/Product');
const Category = require('../models/Category');
const QRCode = require('qrcode');

const productController = {
  // Danh sách sản phẩm & bộ lọc tìm kiếm
  async index(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 12;
      const offset = (page - 1) * limit;

      const categoryId = req.query.category ? parseInt(req.query.category) : null;
      const search = req.query.search ? req.query.search.trim() : null;
      const sort = req.query.sort || 'newest';

      const [products, totalProducts, categories] = await Promise.all([
        Product.getAll({ categoryId, search, sort, limit, offset }),
        Product.count({ categoryId, search }),
        Category.getAll()
      ]);

      const totalPages = Math.ceil(totalProducts / limit);

      let currentCategory = null;
      if (categoryId) {
        currentCategory = categories.find(c => c.id === categoryId);
      }

      res.render('products/index', {
        title: currentCategory ? `${currentCategory.name} - Bình Mỹ Xanh` : 'Tất cả nông sản - Bình Mỹ Xanh',
        products,
        categories,
        currentCategory,
        selectedCategoryId: categoryId,
        searchQuery: search || '',
        currentSort: sort,
        currentPage: page,
        totalPages,
        totalProducts,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách sản phẩm:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Không thể tải danh sách sản phẩm.',
        layout: 'layouts/main'
      });
    }
  },

  // Chi tiết sản phẩm kiểu sách / e-commerce chi tiết
  async detail(req, res) {
    try {
      const id = parseInt(req.params.id);
      const product = await Product.getById(id);

      if (!product) {
        return res.status(404).render('error', {
          title: 'Không tìm thấy',
          message: 'Sản phẩm nông sản bạn tìm kiếm không tồn tại hoặc đã ngừng kinh doanh.',
          layout: 'layouts/main'
        });
      }

      // Lấy các sản phẩm tương tự cùng danh mục
      const relatedProducts = await Product.getRelated(product.category_id, product.id, 4);

      // Lấy nhật ký canh tác riêng biệt cho từng sản phẩm chuẩn VietGAP
      let farmingLot = null;
      let farmingStages = null;
      try {
        const FarmingLot = require('../models/FarmingLot');
        const FarmingLog = require('../models/FarmingLog');
        farmingLot = await FarmingLot.getByProductId(product.id);
        if (!farmingLot) {
          farmingLot = await FarmingLot.getOrCreateForProduct(product);
        }
        if (farmingLot) {
          farmingStages = await FarmingLog.getGroupedByStage(farmingLot.id);
        }
      } catch (err) {
        console.warn('Lưu ý: Không tải được farming lot từ CSDL:', err.message);
      }

      res.render('products/detail', {
        title: `${product.name} - Bình Mỹ Xanh`,
        product,
        relatedProducts,
        farmingLot,
        farmingStages,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Lỗi xem chi tiết sản phẩm:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Đã có sự cố khi hiển thị thông tin sản phẩm.',
        layout: 'layouts/main'
      });
    }
  },

  // Tạo và trả về ảnh mã QR cho sản phẩm
  async getQrCode(req, res) {
    try {
      const id = parseInt(req.params.id);
      const product = await Product.getById(id);

      if (!product) {
        return res.status(404).send('Sản phẩm không tồn tại');
      }

      // URL đầy đủ của trang chi tiết sản phẩm
      const host = req.get('host');
      const protocol = req.protocol;
      const productUrl = `${protocol}://${host}/products/${product.id}`;

      // Cấu hình mã QR với tông màu xanh lá nông sản
      const qrOptions = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        color: {
          dark: '#1b5e20',  // Màu xanh lá đậm VietGAP
          light: '#ffffff'  // Nền trắng
        },
        width: 320
      };

      const qrBuffer = await QRCode.toBuffer(productUrl, qrOptions);

      if (req.query.download === '1') {
        res.setHeader('Content-Disposition', `attachment; filename="QR-${product.slug}.png"`);
      }
      res.setHeader('Content-Type', 'image/png');
      res.send(qrBuffer);
    } catch (error) {
      console.error('Lỗi tạo mã QR:', error);
      res.status(500).send('Lỗi tạo mã QR');
    }
  }
};

module.exports = productController;

