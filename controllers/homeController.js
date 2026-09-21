const Product = require('../models/Product');
const Category = require('../models/Category');

const homeController = {
  async index(req, res) {
    try {
      const categories = await Category.getAll();
      const newArrivals = await Product.getNewArrivals(8);
      const featuredProducts = await Product.getFeatured(8);

      res.render('index', {
        title: 'Bình Mỹ Xanh - Nông sản hữu cơ tươi ngon từ nông trại',
        categories,
        newArrivals,
        featuredProducts,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Lỗi tải trang chủ:', error);
      res.status(500).render('error', {
        title: 'Đã có lỗi xảy ra',
        message: 'Không thể tải dữ liệu trang chủ, vui lòng thử lại sau.',
        layout: 'layouts/main'
      });
    }
  },

  about(req, res) {
    res.render('about', {
      title: 'Giới thiệu về Bình Mỹ Xanh',
      layout: 'layouts/main'
    });
  },

  contact(req, res) {
    res.render('contact', {
      title: 'Liên hệ với Bình Mỹ Xanh',
      layout: 'layouts/main'
    });
  }
};

module.exports = homeController;
