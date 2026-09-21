const { getPool } = require('../config/db');

const Order = {
  async create(orderData, items) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [orderResult] = await connection.query(`
        INSERT INTO orders (
          order_code, user_id, customer_name, customer_phone, customer_email,
          shipping_address, note, payment_method, payment_status, subtotal,
          shipping_fee, discount_amount, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        orderData.order_code,
        orderData.user_id || null,
        orderData.customer_name,
        orderData.customer_phone,
        orderData.customer_email || null,
        orderData.shipping_address,
        orderData.note || '',
        orderData.payment_method || 'cod',
        orderData.payment_status || 'unpaid',
        orderData.subtotal,
        orderData.shipping_fee || 25000,
        orderData.discount_amount || 0,
        orderData.total_amount
      ]);

      const orderId = orderResult.insertId;

      for (const item of items) {
        await connection.query(`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_image, unit, price, quantity, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id,
          item.product_name,
          item.product_image,
          item.unit || 'kg',
          item.price,
          item.quantity,
          item.price * item.quantity
        ]);

        // Cập nhật số lượng bán và tồn kho
        await connection.query(`
          UPDATE products 
          SET sold_count = sold_count + ?, stock = GREATEST(0, stock - ?)
          WHERE id = ?
        `, [item.quantity, item.quantity, item.product_id]);
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getByCode(orderCode) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_code = ?', [orderCode]);
    if (!rows[0]) return null;

    const order = rows[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;
    return order;
  },

  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!rows[0]) return null;

    const order = rows[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;
    return order;
  },

  async getByUserId(userId) {
    const pool = getPool();
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return orders;
  },

  async getAll({ status = null, search = null, limit = 20, offset = 0 } = {}) {
    const pool = getPool();
    let query = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count({ status = null, search = null } = {}) {
    const pool = getPool();
    let query = `SELECT COUNT(*) as total FROM orders WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async updateStatus(id, status) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows > 0;
  },

  async updatePaymentStatus(id, payment_status) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [payment_status, id]);
    return result.affectedRows > 0;
  },

  async getDashboardStats() {
    const pool = getPool();
    const [[revenueRow]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE status != 'cancelled'");
    const [[ordersRow]] = await pool.query("SELECT COUNT(*) as total_orders FROM orders");
    const [[pendingOrdersRow]] = await pool.query("SELECT COUNT(*) as pending_orders FROM orders WHERE status = 'pending'");
    const [[productsRow]] = await pool.query("SELECT COUNT(*) as total_products FROM products");
    const [[usersRow]] = await pool.query("SELECT COUNT(*) as total_users FROM users WHERE role = 'customer'");

    const [recentOrders] = await pool.query(`
      SELECT * FROM orders ORDER BY id DESC LIMIT 5
    `);

    return {
      totalRevenue: revenueRow.total_revenue,
      totalOrders: ordersRow.total_orders,
      pendingOrders: pendingOrdersRow.pending_orders,
      totalProducts: productsRow.total_products,
      totalUsers: usersRow.total_users,
      recentOrders
    };
  }
};

module.exports = Order;
