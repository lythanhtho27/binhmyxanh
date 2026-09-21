const { getPool } = require('../config/db');

const Category = {
  async getAll() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return rows;
  },

  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getBySlug(slug) {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
    return rows[0] || null;
  }
};

module.exports = Category;
