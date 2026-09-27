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

  // Lấy lô canh tác riêng theo từng sản phẩm
  async getByProductId(productId) {
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
      WHERE l.product_id = ?
      GROUP BY l.id
      ORDER BY l.id DESC
      LIMIT 1
    `, [productId]);
    return rows[0] || null;
  },

  // Tự động tìm hoặc tạo mới lô canh tác VietGAP riêng biệt cho từng sản phẩm
  async getOrCreateForProduct(product) {
    if (!product) return null;
    let lot = await this.getByProductId(product.id);
    if (lot) return lot;

    // Sinh tiền tố mã lô theo tên sản phẩm
    const words = product.name
      .split(' ')
      .filter(w => w.length > 1)
      .slice(0, 2);
    const prefix = words
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[Đ]/g, 'D') || 'VG';

    const lotCode = `${prefix}-VG-2026-${String(product.id).padStart(4, '0')}`;

    // Kiểm tra xem lotCode này đã tồn tại chưa
    const existing = await this.getByCode(lotCode);
    if (existing) {
      const pool = getPool();
      await pool.query('UPDATE farming_lots SET product_id = ? WHERE id = ?', [product.id, existing.id]);
      return this.getById(existing.id);
    }

    // Xác định thông số đặc thù theo tên nông sản
    const nameLower = product.name.toLowerCase();
    let plantVariety = `Hạt giống thuần chủng F1 ${product.name} (Tỉ lệ nảy mầm >85%, có chứng nhận kiểm nghiệm kiểm dịch)`;
    let area = `1.200 m² (Vùng chuyên canh Lô ${product.id})`;
    let facility = 'Hợp tác xã Nông nghiệp Công nghệ cao Bình Mỹ Xanh';
    let waterSource = 'Nước giếng khoan qua hệ thống lắng lọc khử khuẩn (Đạt chuẩn QCVN 01-1:2018/BYT)';

    if (nameLower.includes('cà chua')) {
      plantVariety = 'Giống Cà chua bi Cherry F1 Sakata (Kháng virus TYLCV, tỉ lệ nảy mầm 92%)';
      area = '1.000 m² (Nhà màng công nghệ cao A1)';
      facility = 'Nông trại Rau Quả Công nghệ cao Bình Mỹ Xanh';
    } else if (nameLower.includes('dâu tây')) {
      plantVariety = 'Dâu tây giống Hana (Tochiotome Nhật Bản) - Cây cấy mô F1 đạt chuẩn';
      area = '800 m² (Nhà kính kiểm soát vi khí hậu)';
      facility = 'Trang trại Dâu tây VietGAP Mộc Châu - Đối tác Bình Mỹ Xanh';
    } else if (nameLower.includes('bắp cải') || nameLower.includes('cải')) {
      plantVariety = `Giống rau cải sạch ${product.name} - Hạt giống Trang Nông F1`;
      area = '1.500 m² (Lô B3 Vùng chuyên canh)';
    } else if (nameLower.includes('nấm')) {
      plantVariety = 'Meo giống nấm thuần chủng F1 trên cơ chất mùn cưa gỗ sồi hữu cơ tiệt trùng';
      area = '500 m² (Nhà nuôi trồng vô trùng nhiệt độ 18 - 22°C)';
      waterSource = 'Nước RO tiệt trùng phun sương siêu mịn tự động';
    } else if (nameLower.includes('xoài') || nameLower.includes('bưởi') || nameLower.includes('cam')) {
      plantVariety = `Cây ghép đầu dòng chuẩn VietGAP ${product.name} (Độ tuổi 5-7 năm sinh trưởng mạnh)`;
      area = '5.000 m² (Vườn cây ăn trái chuyên canh hữu cơ)';
    } else if (nameLower.includes('gạo')) {
      plantVariety = 'Giống lúa thuần ST25 chính hãng DNTN Hồ Quang Trí (Độ thuần >99%)';
      area = '10.000 m² (Vùng luân canh Lúa - Rươi hữu cơ)';
      waterSource = 'Nước tự nhiên cửa sông phù sa màu mỡ triều cường kiểm định';
    }

    const lotId = await this.create({
      lot_code: lotCode,
      name: `Nhật Ký Canh Tác ${product.name} (Chuẩn VietGAP)`,
      product_id: product.id,
      area: area,
      zone_code: `VN-HCM-${String(product.id).padStart(3, '0')}`,
      facility_name: facility,
      location: product.origin || 'Bình Mỹ, Củ Chi',
      plant_variety: plantVariety,
      water_source: waterSource,
      technician_name: 'Kỹ sư nông học VietGAP - Ban Kỹ thuật Cơ sở',
      standard: product.certification || 'TCVN 11892-1:2017 (VietGAP)',
      start_date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expected_harvest_date: new Date().toISOString().split('T')[0],
      status: 'harvested'
    });

    // Tạo các mốc nhật ký sinh trưởng đặc thù mẫu cho sản phẩm này
    await this.seedInitialLogsForLot(lotId, product);

    return this.getById(lotId);
  },

  // Tạo các mốc nhật ký 5 giai đoạn cho Lô canh tác của sản phẩm
  async seedInitialLogsForLot(lotId, product) {
    const FarmingLog = require('./FarmingLog');
    const name = product.name;
    const nameLower = name.toLowerCase();

    const sampleLogs = [
      {
        lot_id: lotId,
        day_number: 1,
        stage_id: 1,
        stage_name: 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể',
        session_of_day: 'morning',
        action_title: 'Khử trùng đất canh tác & Cân bằng độ pH',
        action_detail: `Cày xới, phơi ải đất nhằm diệt mầm bệnh và trứng côn trùng cho luống trồng ${name}. Rải vôi nông nghiệp (CaCO3) liều lượng 35 kg/1.000 m² để cân bằng độ pH đất trong ngưỡng 6.0 - 6.5.`,
        materials_used: 'Vôi nông nghiệp (CaCO3)',
        dosage: '35 kg / 1.000 m²',
        notes: 'Duy trì pH 6.0 - 6.5, phơi ải 3 ngày',
        is_quarantine_notice: 0,
        is_harvest_test: 0
      },
      {
        lot_id: lotId,
        day_number: 2,
        stage_id: 1,
        stage_name: 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể',
        session_of_day: 'all_day',
        action_title: 'Bón lót vi sinh & Phối trộn tầng hữu cơ',
        action_detail: `Bón lót toàn bộ diện tích trồng ${name}: Phân chuồng ủ hoai mục bằng nấm đối kháng Trichoderma: 1.000 kg; Phân hữu cơ vi sinh Sông Gianh: 60 kg; Lân nung chảy: 20 kg. Bừa đều trộn sâu vào tầng canh tác mặt 15 - 20 cm.`,
        materials_used: 'Phân chuồng hoai mục Trichoderma, Vi sinh Sông Gianh, Lân Lâm Thao',
        dosage: '1.000 kg phân chuồng + 60 kg vi sinh',
        notes: 'Cung cấp hệ vi sinh vật bản địa dồi dào',
        is_quarantine_notice: 0,
        is_harvest_test: 0
      },
      {
        lot_id: lotId,
        day_number: 4,
        stage_id: 2,
        stage_name: 'Giai đoạn 2: Xử lý giống & Xuống giống gieo trồng',
        session_of_day: 'morning',
        action_title: 'Xử lý phá miên trạng & Xuống giống gieo trồng',
        action_detail: `Tiến hành ngâm ủ hoặc xử lý cây giống ${name} bằng nước ấm 2 sôi 3 lạnh (45-50°C), kích thích nảy mầm đạt trên 90%. Xuống giống theo hàng quy chuẩn VietGAP, phủ lớp rơm mục mỏng giữ ẩm đất.`,
        materials_used: `Hạt giống / Cây con ${name} F1`,
        dosage: 'Mật độ tiêu chuẩn VietGAP',
        notes: 'Tưới phun sương giữ ẩm đất 75-80%',
        is_quarantine_notice: 0,
        is_harvest_test: 0
      },
      {
        lot_id: lotId,
        day_number: 10,
        stage_id: 3,
        stage_name: 'Giai đoạn 3: Chăm sóc & Cây con phát triển',
        session_of_day: 'morning',
        action_title: 'Tưới thúc đợt 1 bằng dinh dưỡng đạm cá hữu cơ',
        action_detail: `Tỉa dặm cây con, nhổ cỏ dại thủ công. Tưới thúc đợt 1 bằng đạm cá ủ vi sinh thủy phân pha loãng tỉ lệ 1:300 tưới gốc nhằm kích thích phát triển rễ khỏe, thân mập mạp tự nhiên.`,
        materials_used: 'Chế phẩm đạm cá ủ vi sinh thủy phân',
        dosage: 'Pha loãng 1:300 tưới gốc',
        notes: 'Không sử dụng phân bón hóa học vô cơ kích phổng',
        is_quarantine_notice: 0,
        is_harvest_test: 0
      },
      {
        lot_id: lotId,
        day_number: 15,
        stage_id: 3,
        stage_name: 'Giai đoạn 3: Chăm sóc & Cây con phát triển',
        session_of_day: 'afternoon',
        action_title: 'Kiểm tra sâu bệnh IPM & Phun xua đuổi sinh học',
        action_detail: `Thăm đồng kiểm tra sâu bệnh IPM trên luống ${name}. Áp dụng biện pháp sinh học an toàn: Phun dung dịch chiết xuất từ gừng, tỏi, ớt kết hợp dầu khoáng nông nghiệp SK Enspray 99 EC để xua đuổi côn trùng gây hại. Tuyệt đối không dùng thuốc BVTV hóa học độc hại.`,
        materials_used: 'Dung dịch thảo mộc tỏi ớt gừng, Dầu khoáng SK Enspray 99 EC',
        dosage: '40 ml / bình 16 lít nước',
        notes: 'An toàn tuyệt đối cho người và thiên địch',
        is_quarantine_notice: 0,
        is_harvest_test: 0
      },
      {
        lot_id: lotId,
        day_number: 21,
        stage_id: 4,
        stage_name: 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn',
        session_of_day: 'morning',
        action_title: 'Bắt đầu thời kỳ cách ly bắt buộc trước thu hoạch',
        action_detail: `Ngừng tuyệt đối mọi hoạt động bón phân bón lá, phân hữu cơ hay chế phẩm xua đuổi côn trùng. Chỉ duy trì tưới nước sạch đã kiểm định để thanh lọc tự nhiên cho ${name} trước khi thu hoạch xuất vườn.`,
        materials_used: 'Nước sạch kiểm định QCVN 01-1:2018/BYT',
        dosage: 'Tưới ẩm nhẹ 2 lần/ngày',
        notes: 'Thời gian cách ly bắt buộc tối thiểu 5 ngày',
        is_quarantine_notice: 1,
        is_harvest_test: 0
      },
      {
        lot_id: lotId,
        day_number: 25,
        stage_id: 5,
        stage_name: 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện',
        session_of_day: 'morning',
        action_title: 'Tiền thu hoạch - Kiểm nghiệm dư lượng Nitrat & BVTV',
        action_detail: `Kỹ sư kiểm nghiệm lấy mẫu ngẫu nhiên tại ruộng ${name} để test nhanh chỉ tiêu an toàn: Kết quả âm tính với hóa chất BVTV; chỉ số NO3- nằm trong giới hạn an toàn theo QCVN 8-2:2011/BYT. Đạt chứng nhận đủ điều kiện thu hoạch xuất vườn.`,
        materials_used: 'Bộ kit test nhanh Nitrat & Hóa chất BVTV',
        dosage: 'Lấy mẫu ngẫu nhiên 5 điểm thực địa',
        notes: 'Âm tính 100% dư lượng hóa chất độc hại',
        is_quarantine_notice: 0,
        is_harvest_test: 1
      },
      {
        lot_id: lotId,
        day_number: 26,
        stage_id: 5,
        stage_name: 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện',
        session_of_day: 'morning',
        action_title: 'Thu hoạch chính thức & Đóng gói dán tem truy xuất QR',
        action_detail: `Thu hái ${name} từ sáng sớm khi trời còn mát bằng dụng cụ chuyên dụng khử trùng cồn 70°. Sơ chế qua 2 lần nước sạch luân lưu trên bồn inox an toàn thực phẩm. Đóng gói bảo quản lạnh và dán tem mã QR truy xuất nhật ký điện tử.`,
        materials_used: `Bao bì màng thở an toàn, Tem QR mã lô`,
        dosage: 'Quy cách chuẩn đóng gói',
        notes: 'Bảo quản nhiệt độ mát kiểm soát vi sinh',
        is_quarantine_notice: 0,
        is_harvest_test: 0
      }
    ];

    for (const log of sampleLogs) {
      await FarmingLog.create(log);
    }
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
      data.plant_variety || 'Giống thuần chủng VietGAP',
      data.water_source || 'Nước giếng khoan qua hệ thống lắng lọc',
      data.technician_name || 'Kỹ sư nông học VietGAP',
      data.standard || 'TCVN 11892-1:2017',
      data.start_date || new Date().toISOString().split('T')[0],
      data.expected_harvest_date || null,
      data.status || 'in_progress'
    ]);
    return result.insertId;
  },

  // Cập nhật lô canh tác (đầy đủ các trường)
  async update(id, data) {
    const pool = getPool();
    const [result] = await pool.query(`
      UPDATE farming_lots SET
        name = COALESCE(?, name),
        lot_code = COALESCE(?, lot_code),
        area = COALESCE(?, area),
        zone_code = COALESCE(?, zone_code),
        facility_name = COALESCE(?, facility_name),
        location = COALESCE(?, location),
        plant_variety = COALESCE(?, plant_variety),
        water_source = COALESCE(?, water_source),
        technician_name = COALESCE(?, technician_name),
        standard = COALESCE(?, standard),
        status = COALESCE(?, status),
        start_date = COALESCE(?, start_date),
        expected_harvest_date = COALESCE(?, expected_harvest_date)
      WHERE id = ?
    `, [
      data.name ?? null,
      data.lot_code ?? null,
      data.area ?? null,
      data.zone_code ?? null,
      data.facility_name ?? null,
      data.location ?? null,
      data.plant_variety ?? null,
      data.water_source ?? null,
      data.technician_name ?? null,
      data.standard ?? null,
      data.status ?? null,
      data.start_date ?? null,
      data.expected_harvest_date ?? null,
      id
    ]);
    return result.affectedRows > 0;
  }
};

module.exports = FarmingLot;
