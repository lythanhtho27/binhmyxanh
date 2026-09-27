const { getPool } = require('../config/db');

const FarmingLot = {
  // Lấy tất cả các lô canh tác kèm thống kê nhật ký
  async getAll() {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT 
        l.*,
        p.name as product_name,
        p.image as product_image,
        COUNT(g.id) as total_logs,
        MAX(g.day_number) as current_day
      FROM farming_lots l
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN farming_logs g ON l.id = g.lot_id
      GROUP BY l.id
      ORDER BY l.id DESC
    `);
    return rows;
  },

  // Lấy thông tin chi tiết của 1 lô
  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT 
        l.*,
        p.name as product_name,
        p.image as product_image,
        p.slug as product_slug,
        COUNT(g.id) as total_logs,
        MAX(g.day_number) as current_day
      FROM farming_lots l
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN farming_logs g ON l.id = g.lot_id
      WHERE l.id = ?
      GROUP BY l.id
    `, [id]);
    return rows[0] || null;
  },

  // Tìm lô theo mã lô (ví dụ: RM-VG-2026-0901)
  async getByCode(lotCode) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT l.*, p.name as product_name, p.image as product_image
      FROM farming_lots l
      LEFT JOIN products p ON l.product_id = p.id
      WHERE l.lot_code = ?
    `, [lotCode]);
    return rows[0] || null;
  },

  // Tạo lô canh tác mới
  async create(data) {
    const pool = getPool();
    const [result] = await pool.query(`
      INSERT INTO farming_lots (
        lot_code, name, product_id, area, zone_code,
        facility_name, location, plant_variety, water_source,
        technician_name, standard, start_date, expected_harvest_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.lot_code,
      data.name,
      data.product_id || null,
      data.area || '1.000 m² (Lô A2)',
      data.zone_code || 'VN-XX-YY-ZZZ',
      data.facility_name || 'Hợp tác xã / Trang trại Nông sản Sạch Xanh',
      data.location || 'Thôn/Ấp X, Xã Y, Huyện Z, Tỉnh/TP...',
      data.plant_variety || 'Rau muống lá tre (Hạt giống F1)',
      data.water_source || 'Nước giếng khoan qua hệ thống lắng lọc',
      data.technician_name || 'Kỹ sư nông học VietGAP',
      data.standard || 'TCVN 11892-1:2017',
      data.start_date || new Date().toISOString().split('T')[0],
      data.expected_harvest_date || null,
      data.status || 'in_progress'
    ]);
    return result.insertId;
  },

  // Cập nhật lô canh tác
  async update(id, data) {
    const pool = getPool();
    const [result] = await pool.query(`
      UPDATE farming_lots SET
        name = COALESCE(?, name),
        area = COALESCE(?, area),
        zone_code = COALESCE(?, zone_code),
        plant_variety = COALESCE(?, plant_variety),
        status = COALESCE(?, status),
        expected_harvest_date = COALESCE(?, expected_harvest_date)
      WHERE id = ?
    `, [
      data.name,
      data.area,
      data.zone_code,
      data.plant_variety,
      data.status,
      data.expected_harvest_date,
      id
    ]);
    return result.affectedRows > 0;
  }
};

module.exports = FarmingLot;
