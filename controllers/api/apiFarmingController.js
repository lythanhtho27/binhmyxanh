const FarmingLot = require('../../models/FarmingLot');
const FarmingLog = require('../../models/FarmingLog');
const voiceParserService = require('../../services/voiceParserService');

const apiFarmingController = {
  // 1. Lấy danh sách tất cả các lô canh tác
  async getLots(req, res) {
    try {
      const lots = await FarmingLot.getAll();

      // Bổ sung thông tin tiến độ canh tác cho từng lô
      const enrichedLots = lots.map(lot => {
        const currentDay = lot.current_day || 0;
        const totalStandardDays = 26; // Chu kỳ tiêu chuẩn VietGAP
        const progressPercent = Math.min(100, Math.round((currentDay / totalStandardDays) * 100));

        let statusText = 'Đang canh tác';
        let statusBadge = 'in_progress';
        if (lot.status === 'quarantine' || currentDay >= 21) {
          statusText = 'Thời kỳ cách ly';
          statusBadge = 'quarantine';
        }
        if (lot.status === 'harvested' || currentDay >= 26) {
          statusText = 'Đã thu hoạch';
          statusBadge = 'harvested';
        }

        return {
          ...lot,
          progress_percent: progressPercent,
          status_text: statusText,
          status_badge: statusBadge
        };
      });

      return res.json({
        success: true,
        count: enrichedLots.length,
        lots: enrichedLots
      });
    } catch (error) {
      console.error('Lỗi API getLots:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi lấy danh sách lô canh tác'
      });
    }
  },

  // 2. Lấy thông tin chi tiết 1 lô kèm toàn bộ nhật ký 5 giai đoạn
  async getLotDetail(req, res) {
    try {
      const { id } = req.params;
      const lot = await FarmingLot.getById(id);

      if (!lot) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lô canh tác yêu cầu'
        });
      }

      // Lấy toàn bộ nhật ký phân theo 5 Giai đoạn VietGAP
      const stages = await FarmingLog.getGroupedByStage(lot.id);

      return res.json({
        success: true,
        lot,
        stages,
        commitments: [
          {
            title: 'Tồn dư thuốc BVTV',
            detail: 'Không sử dụng thuốc hóa học độc hại trong suốt chu kỳ sinh trưởng; 100% sử dụng thảo mộc và chế phẩm sinh học.',
            badge: '100% Thảo mộc & Vi sinh'
          },
          {
            title: 'Thời gian cách ly',
            detail: 'Cách ly phân bón và mọi chế phẩm trên 5 ngày trước khi cắt hái.',
            badge: 'Cách ly ≥ 5 ngày xuất vườn'
          },
          {
            title: 'Vi sinh vật gây bệnh',
            detail: 'Không phát hiện Salmonella spp., mật độ E. coli đạt giới hạn quy định của VietGAP.',
            badge: 'Đạt chuẩn an toàn VietGAP'
          }
        ]
      });
    } catch (error) {
      console.error('Lỗi API getLotDetail:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi tải chi tiết lô canh tác'
      });
    }
  },

  // 3. API Bóc tách thông minh từ giọng nói (Speech-to-Text Preview)
  async parseVoice(req, res) {
    try {
      const { voice_text, lot_id } = req.body;

      if (!voice_text || typeof voice_text !== 'string' || voice_text.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp văn bản giọng nói voice_text'
        });
      }

      let defaultDay = 1;
      if (lot_id) {
        const lot = await FarmingLot.getById(lot_id);
        if (lot && lot.current_day) {
          defaultDay = Math.min(26, lot.current_day + 1);
        }
      }

      const parseResult = voiceParserService.parse(voice_text, { defaultDay });

      return res.json({
        success: true,
        message: 'Bóc tách dữ liệu giọng nói thành công',
        parsed: parseResult.data
      });
    } catch (error) {
      console.error('Lỗi API parseVoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi bóc tách giọng nói'
      });
    }
  },

  // 4. Tạo nhật ký canh tác mới (Chấp nhận cả văn bản nói trực tiếp hoặc form đã xác nhận)
  async createLog(req, res) {
    try {
      const {
        lot_id,
        voice_text,
        day_number,
        stage_id,
        stage_name,
        session_of_day,
        action_title,
        action_detail,
        materials_used,
        dosage,
        image_url,
        notes,
        is_quarantine_notice,
        is_harvest_test,
        log_date
      } = req.body;

      if (!lot_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mã ID lô canh tác (lot_id)'
        });
      }

      const lot = await FarmingLot.getById(lot_id);
      if (!lot) {
        return res.status(404).json({
          success: false,
          message: 'Lô canh tác không tồn tại'
        });
      }

      let logPayload = {};

      // Nếu app gửi voice_text trực tiếp mà chưa bóc tách
      if (voice_text && !action_title) {
        const parsed = voiceParserService.parse(voice_text, {
          defaultDay: lot.current_day ? Math.min(26, lot.current_day + 1) : 1
        });
        logPayload = {
          ...parsed.data,
          lot_id: parseInt(lot_id, 10),
          user_id: req.user ? req.user.id : null,
          log_date: log_date || new Date().toISOString().split('T')[0],
          image_url: image_url || null
        };
      } else {
        // App đã xác nhận các trường dữ liệu
        logPayload = {
          lot_id: parseInt(lot_id, 10),
          user_id: req.user ? req.user.id : null,
          log_date: log_date || new Date().toISOString().split('T')[0],
          day_number: parseInt(day_number, 10) || 1,
          stage_id: parseInt(stage_id, 10) || 1,
          stage_name: stage_name || 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể',
          session_of_day: session_of_day || 'all_day',
          action_title: action_title || 'Nhật ký chăm sóc ruộng đồng',
          action_detail: action_detail || voice_text || 'Hoàn thành công việc canh tác trong ngày',
          materials_used: materials_used || null,
          dosage: dosage || null,
          voice_raw_text: voice_text || null,
          image_url: image_url || null,
          notes: notes || null,
          is_quarantine_notice: is_quarantine_notice ? 1 : 0,
          is_harvest_test: is_harvest_test ? 1 : 0
        };
      }

      const newLogId = await FarmingLog.create(logPayload);
      const createdLog = await FarmingLog.getById(newLogId);

      // Cập nhật trạng thái của Lô nếu rơi vào thời kỳ cách ly hoặc thu hoạch
      if (logPayload.is_quarantine_notice) {
        await FarmingLot.update(lot_id, { status: 'quarantine' });
      } else if (logPayload.day_number >= 26 || logPayload.action_title.includes('Thu hoạch')) {
        await FarmingLot.update(lot_id, { status: 'harvested' });
      }

      return res.status(201).json({
        success: true,
        message: 'Đã lưu nhật ký canh tác thành công!',
        log: createdLog
      });
    } catch (error) {
      console.error('Lỗi API createLog:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi lưu nhật ký canh tác'
      });
    }
  },

  // 5. Cập nhật nhật ký canh tác (chỉnh sửa khi nói nhầm)
  async updateLog(req, res) {
    try {
      const { id } = req.params;
      const existing = await FarmingLog.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhật ký canh tác cần sửa'
        });
      }

      await FarmingLog.update(id, req.body);
      const updatedLog = await FarmingLog.getById(id);

      return res.json({
        success: true,
        message: 'Cập nhật nhật ký canh tác thành công',
        log: updatedLog
      });
    } catch (error) {
      console.error('Lỗi API updateLog:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi sửa nhật ký'
      });
    }
  },

  // 6. Xóa nhật ký canh tác
  async deleteLog(req, res) {
    try {
      const { id } = req.params;
      const existing = await FarmingLog.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhật ký cần xóa'
        });
      }

      await FarmingLog.delete(id);

      return res.json({
        success: true,
        message: 'Đã xóa bản ghi nhật ký canh tác thành công'
      });
    } catch (error) {
      console.error('Lỗi API deleteLog:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi xóa nhật ký'
      });
    }
  },

  // 7. Lấy danh sách các hoạt động nhật ký mới nhất trên toàn hệ thống
  async getRecentLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const logs = await FarmingLog.getRecent(limit);

      return res.json({
        success: true,
        count: logs.length,
        logs
      });
    } catch (error) {
      console.error('Lỗi API getRecentLogs:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi lấy nhật ký gần đây'
      });
    }
  },

  // 8. Thống kê tổng quan cho màn hình Dashboard Mobile
  async getDashboardStats(req, res) {
    try {
      const lots = await FarmingLot.getAll();
      const recentLogs = await FarmingLog.getRecent(5);

      const totalLots = lots.length;
      const inProgressLots = lots.filter(l => l.status === 'in_progress').length;
      const quarantineLots = lots.filter(l => l.status === 'quarantine').length;
      const harvestedLots = lots.filter(l => l.status === 'harvested').length;

      return res.json({
        success: true,
        stats: {
          total_lots: totalLots,
          in_progress_lots: inProgressLots,
          quarantine_lots: quarantineLots,
          harvested_lots: harvestedLots,
          standard: 'TCVN 11892-1:2017 (VietGAP)'
        },
        recent_logs: recentLogs
      });
    } catch (error) {
      console.error('Lỗi API getDashboardStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi thống kê'
      });
    }
  },

  // 9. Upload ảnh hiện trường chụp từ camera điện thoại
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn file ảnh để tải lên'
        });
      }

      const imageUrl = `/uploads/farming/${req.file.filename}`;
      return res.json({
        success: true,
        message: 'Tải ảnh hiện trường thành công',
        image_url: imageUrl
      });
    } catch (error) {
      console.error('Lỗi API uploadImage:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi tải ảnh lên'
      });
    }
  }
};

module.exports = apiFarmingController;
