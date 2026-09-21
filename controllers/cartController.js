const Product = require('../models/Product');
const Order = require('../models/Order');

const cartController = {
  // Xem giỏ hàng
  getCart(req, res) {
    const cart = req.session.cart || [];
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 300000 || subtotal === 0 ? 0 : 25000;
    const total = subtotal + shippingFee;

    res.render('cart/index', {
      title: 'Giỏ hàng của bạn - Bình Mỹ Xanh',
      cart,
      subtotal,
      shippingFee,
      total,
      layout: 'layouts/main'
    });
  },

  // Thêm sản phẩm vào giỏ (hỗ trợ cả Fetch API và Form thông thường)
  async addToCart(req, res) {
    try {
      const productId = parseInt(req.body.productId);
      const quantity = parseInt(req.body.quantity) || 1;

      const product = await Product.getById(productId);
      if (!product) {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        return res.redirect('back');
      }

      if (!req.session.cart) {
        req.session.cart = [];
      }

      const existingItemIndex = req.session.cart.findIndex(item => item.product_id === productId);

      if (existingItemIndex > -1) {
        req.session.cart[existingItemIndex].quantity += quantity;
      } else {
        req.session.cart.push({
          product_id: product.id,
          product_name: product.name,
          product_image: product.image,
          unit: product.unit,
          price: parseFloat(product.price),
          quantity: quantity
        });
      }

      const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
      const cartTotal = req.session.cart.reduce((total, item) => total + (item.price * item.quantity), 0);

      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({
          success: true,
          message: `Đã thêm "${product.name}" vào giỏ hàng!`,
          cartCount,
          cartTotal
        });
      }

      res.redirect('/cart');
    } catch (error) {
      console.error('Lỗi thêm giỏ hàng:', error);
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
      }
      res.redirect('back');
    }
  },

  // Cập nhật số lượng
  updateCart(req, res) {
    const { productId, quantity } = req.body;
    const pId = parseInt(productId);
    const qty = parseInt(quantity);

    if (req.session.cart) {
      if (qty <= 0) {
        req.session.cart = req.session.cart.filter(item => item.product_id !== pId);
      } else {
        const item = req.session.cart.find(item => item.product_id === pId);
        if (item) {
          item.quantity = qty;
        }
      }
    }

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const cart = req.session.cart || [];
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = subtotal > 300000 || subtotal === 0 ? 0 : 25000;
      const total = subtotal + shippingFee;
      const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      return res.json({
        success: true,
        cartCount,
        subtotal,
        shippingFee,
        total
      });
    }

    res.redirect('/cart');
  },

  // Xóa sản phẩm khỏi giỏ
  removeFromCart(req, res) {
    const productId = parseInt(req.params.id);
    if (req.session.cart) {
      req.session.cart = req.session.cart.filter(item => item.product_id !== productId);
    }
    res.redirect('/cart');
  },

  // Giao diện thanh toán
  getCheckout(req, res) {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      return res.redirect('/cart');
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 300000 ? 0 : 25000;
    const total = subtotal + shippingFee;

    res.render('cart/checkout', {
      title: 'Thanh toán đơn hàng - Bình Mỹ Xanh',
      cart,
      subtotal,
      shippingFee,
      total,
      layout: 'layouts/main'
    });
  },

  // Xử lý hoàn tất đặt hàng
  async postCheckout(req, res) {
    try {
      const cart = req.session.cart || [];
      if (cart.length === 0) {
        return res.redirect('/cart');
      }

      const { customer_name, customer_phone, customer_email, shipping_address, note, payment_method } = req.body;

      if (!customer_name || !customer_phone || !shipping_address) {
        req.session.error = 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng!';
        return res.redirect('/cart/checkout');
      }

      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = subtotal > 300000 ? 0 : 25000;
      const total = subtotal + shippingFee;

      // Sinh mã đơn hàng duy nhất, ví dụ: NSX2026-A89F
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderCode = `NSX${Date.now().toString().slice(-4)}-${randomSuffix}`;

      const orderData = {
        order_code: orderCode,
        user_id: req.session.user ? req.session.user.id : null,
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        note,
        payment_method: payment_method || 'cod',
        payment_status: 'unpaid',
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: 0,
        total_amount: total
      };

      await Order.create(orderData, cart);

      // Xóa giỏ hàng sau khi đặt thành công
      req.session.cart = [];

      res.redirect(`/cart/success/${orderCode}`);
    } catch (error) {
      console.error('Lỗi khi thanh toán đặt hàng:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Không thể xử lý đơn hàng lúc này, vui lòng thử lại sau.',
        layout: 'layouts/main'
      });
    }
  },

  // Trang thông báo đặt hàng thành công
  async orderSuccess(req, res) {
    try {
      const { orderCode } = req.params;
      const order = await Order.getByCode(orderCode);

      if (!order) {
        return res.redirect('/');
      }

      res.render('cart/success', {
        title: `Đặt hàng thành công - ${order.order_code}`,
        order,
        layout: 'layouts/main'
      });
    } catch (error) {
      console.error('Lỗi xem đơn hàng thành công:', error);
      res.redirect('/');
    }
  }
};

module.exports = cartController;
