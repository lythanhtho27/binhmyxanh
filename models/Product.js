const { getPool } = require('../config/db');

const Product = {
  async getAll({ categoryId = null, search = null, sort = 'newest', limit = 20, offset = 0 } = {}) {
    const pool = getPool();
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.short_description LIKE ? OR p.origin LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY p.price DESC`;
        break;
      case 'popular':
        query += ` ORDER BY p.sold_count DESC`;
        break;
      case 'rating':
        query += ` ORDER BY p.rating DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY p.id DESC`;
        break;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async count({ categoryId = null, search = null } = {}) {
    const pool = getPool();
    let query = `SELECT COUNT(*) as total FROM products WHERE 1=1`;
    const params = [];

    if (categoryId) {
      query += ` AND category_id = ?`;
      params.push(categoryId);
    }

    if (search) {
      query += ` AND (name LIKE ? OR short_description LIKE ? OR origin LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async getNewArrivals(limit = 6) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_new = 1
      ORDER BY p.id DESC
      LIMIT ?
    `, [parseInt(limit)]);
    return rows;
  },

  async getFeatured(limit = 8) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = 1
      ORDER BY p.sold_count DESC, p.id DESC
      LIMIT ?
    `, [parseInt(limit)]);
    return rows;
  },

  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async getRelated(categoryId, currentId, limit = 4) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ?
      ORDER BY RAND()
      LIMIT ?
    `, [categoryId, currentId, parseInt(limit)]);
    return rows;
  },

  async create(data) {
    const pool = getPool();
    const slug = data.slug || data.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    const [result] = await pool.query(`
      INSERT INTO products (
        category_id, name, slug, price, original_price, unit, stock, origin,
        harvest_date, shelf_life, certification, image, short_description,
        description, nutrition_info, storage_guide, is_featured, is_new
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.category_id,
      data.name,
      slug,
      data.price,
      data.original_price || null,
      data.unit || 'kg',
      data.stock || 50,
      data.origin || 'Việt Nam',
      data.harvest_date || 'Hái mới trong ngày',
      data.shelf_life || '5-7 ngày bảo quản mát',
      data.certification || 'VietGAP',
      data.image,
      data.short_description || '',
      data.description || '',
      data.nutrition_info || '',
      data.storage_guide || '',
      data.is_featured ? 1 : 0,
      data.is_new ? 1 : 0
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const pool = getPool();
    const [result] = await pool.query(`
      UPDATE products SET
        category_id = ?,
        name = ?,
        price = ?,
        original_price = ?,
        unit = ?,
        stock = ?,
        origin = ?,
        harvest_date = ?,
        shelf_life = ?,
        certification = ?,
        image = ?,
        short_description = ?,
        description = ?,
        nutrition_info = ?,
        storage_guide = ?,
        is_featured = ?,
        is_new = ?
      WHERE id = ?
    `, [
      data.category_id,
      data.name,
      data.price,
      data.original_price || null,
      data.unit,
      data.stock,
      data.origin,
      data.harvest_date,
      data.shelf_life,
      data.certification,
      data.image,
      data.short_description,
      data.description,
      data.nutrition_info,
      data.storage_guide,
      data.is_featured ? 1 : 0,
      data.is_new ? 1 : 0,
      id
    ]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Product;
