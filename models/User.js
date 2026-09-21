const { getPool } = require('../config/db');

const User = {
  async findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, full_name, email, phone, address, role, status, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ full_name, email, password, phone = null, address = null, role = 'customer' }) {
    const pool = getPool();
    const [result] = await pool.query(`
      INSERT INTO users (full_name, email, password, phone, address, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `, [full_name, email, password, phone, address, role]);
    return result.insertId;
  },

  async getAll({ search = null, limit = 20, offset = 0 } = {}) {
    const pool = getPool();
    let query = `SELECT id, full_name, email, phone, address, role, status, created_at FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count({ search = null } = {}) {
    const pool = getPool();
    let query = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async updateRole(id, role) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return result.affectedRows > 0;
  },

  async updateStatus(id, status) {
    const pool = getPool();
    const [result] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows > 0;
  },

  async updateProfile(id, { full_name, phone, address }) {
    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
      [full_name, phone, address, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = User;
