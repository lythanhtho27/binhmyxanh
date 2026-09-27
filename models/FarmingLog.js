const { getPool } = require('../config/db');

const FarmingLog = {
  // Lấy toàn bộ nhật ký của 1 lô
  async getByLotId(lotId) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT g.*, u.full_name as author_name, u.role as author_role
      FROM farming_logs g
      LEFT JOIN users u ON g.user_id = u.id
      WHERE g.lot_id = ?
      ORDER BY g.day_number ASC, g.session_of_day ASC, g.id ASC
    `, [lotId]);
    return rows;
  },

  // Lấy nhật ký và tự động gom nhóm theo 5 Giai đoạn VietGAP
  async getGroupedByStage(lotId) {
    const logs = await this.getByLotId(lotId);

    const stagesDef = [
      { id: 1, name: 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể', timeRange: 'Ngày 01 – Ngày 03', icon: 'fa-tractor', logs: [] },
      { id: 2, name: 'Giai đoạn 2: Xử lý hạt & Gieo trồng', timeRange: 'Ngày 04', icon: 'fa-wheat-awn', logs: [] },
      { id: 3, name: 'Giai đoạn 3: Chăm sóc & Cây con phát triển', timeRange: 'Ngày 05 – Ngày 15', icon: 'fa-seedling', logs: [] },
      { id: 4, name: 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn', timeRange: 'Ngày 16 – Ngày 23', icon: 'fa-leaf', logs: [] },
      { id: 5, name: 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện', timeRange: 'Ngày 25 – Ngày 26', icon: 'fa-box-open', logs: [] }
    ];

    logs.forEach(log => {
      let targetStage = stagesDef.find(s => s.id === log.stage_id);
      if (!targetStage) {
        targetStage = stagesDef[0];
      }
      targetStage.logs.push(log);
    });

    return stagesDef;
  },

  // Lấy chi tiết 1 nhật ký
  async getById(id) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT g.*, u.full_name as author_name, l.lot_code, l.name as lot_name
      FROM farming_logs g
      LEFT JOIN users u ON g.user_id = u.id
      LEFT JOIN farming_lots l ON g.lot_id = l.id
      WHERE g.id = ?
    `, [id]);
    return rows[0] || null;
  },

  // Thêm mới nhật ký canh tác (từ giọng nói hoặc form nhập)
  async create(data) {
    const pool = getPool();
    const [result] = await pool.query(`
      INSERT INTO farming_logs (
        lot_id, user_id, log_date, day_number, stage_id,
        stage_name, session_of_day, action_title, action_detail,
        materials_used, dosage, voice_raw_text, image_url,
        notes, is_quarantine_notice, is_harvest_test
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.lot_id ?? null,
      data.user_id ?? null,
      data.log_date || new Date().toISOString().split('T')[0],
      data.day_number ?? 1,
      data.stage_id ?? 1,
      data.stage_name || 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể',
      data.session_of_day || 'morning',
      data.action_title ?? '',
      data.action_detail ?? '',
      data.materials_used ?? null,
      data.dosage ?? null,
      data.voice_raw_text ?? null,
      data.image_url ?? null,
      data.notes ?? null,
      data.is_quarantine_notice ? 1 : 0,
      data.is_harvest_test ? 1 : 0
    ]);
    return result.insertId;
  },

  // Cập nhật nhật ký canh tác (đầy đủ các trường)
  async update(id, data) {
    const pool = getPool();
    const [result] = await pool.query(`
      UPDATE farming_logs SET
        log_date = IFNULL(?, log_date),
        day_number = IFNULL(?, day_number),
        stage_id = IFNULL(?, stage_id),
        stage_name = IFNULL(?, stage_name),
        session_of_day = IFNULL(?, session_of_day),
        action_title = IFNULL(?, action_title),
        action_detail = IFNULL(?, action_detail),
        materials_used = ?,
        dosage = ?,
        notes = ?,
        image_url = IFNULL(?, image_url),
        is_quarantine_notice = IFNULL(?, is_quarantine_notice),
        is_harvest_test = IFNULL(?, is_harvest_test)
      WHERE id = ?
    `, [
      data.log_date ?? null,
      data.day_number ?? null,
      data.stage_id ?? null,
      data.stage_name ?? null,
      data.session_of_day ?? null,
      data.action_title ?? null,
      data.action_detail ?? null,
      data.materials_used !== undefined ? data.materials_used : null,
      data.dosage !== undefined ? data.dosage : null,
      data.notes !== undefined ? data.notes : null,
      data.image_url !== undefined ? data.image_url : null,
      data.is_quarantine_notice !== undefined ? (data.is_quarantine_notice ? 1 : 0) : null,
      data.is_harvest_test !== undefined ? (data.is_harvest_test ? 1 : 0) : null,
      id
    ]);
    return result.affectedRows > 0;
  },

  // Xóa nhật ký
  async delete(id) {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM farming_logs WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Lấy các nhật ký mới nhất trên toàn hệ thống (phục vụ dashboard app)
  async getRecent(limit = 10) {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT g.*, l.lot_code, l.name as lot_name, u.full_name as author_name
      FROM farming_logs g
      INNER JOIN farming_lots l ON g.lot_id = l.id
      LEFT JOIN users u ON g.user_id = u.id
      ORDER BY g.id DESC
      LIMIT ?
    `, [parseInt(limit, 10)]);
    return rows;
  }
};

module.exports = FarmingLog;
