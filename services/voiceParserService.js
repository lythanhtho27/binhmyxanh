/**
 * Service Xử Lý & Bóc Tách Giọng Nói Tiếng Việt (Voice-to-Data Parser)
 * Phục vụ Mobile App Nông Nghiệp "Nhật Ký Số Bằng Giọng Nói"
 */

const VN_NUMBER_WORDS = [
  { word: 'hai mươi mốt', val: 21 },
  { word: 'hai mươi hai', val: 22 },
  { word: 'hai mươi ba', val: 23 },
  { word: 'hai mươi bốn', val: 24 },
  { word: 'hai mươi tư', val: 24 },
  { word: 'hai mươi lăm', val: 25 },
  { word: 'hai mươi năm', val: 25 },
  { word: 'hai mươi sáu', val: 26 },
  { word: 'hai mươi bảy', val: 27 },
  { word: 'hai mươi tám', val: 28 },
  { word: 'hai mươi chín', val: 29 },
  { word: 'ba mươi', val: 30 },
  { word: 'hai mốt', val: 21 },
  { word: 'hai lăm', val: 25 },
  { word: 'hai sáu', val: 26 },
  { word: 'hai mươi', val: 20 },
  { word: 'mười một', val: 11 },
  { word: 'mười hai', val: 12 },
  { word: 'mười ba', val: 13 },
  { word: 'mười bốn', val: 14 },
  { word: 'mười lăm', val: 15 },
  { word: 'mười sáu', val: 16 },
  { word: 'mười bảy', val: 17 },
  { word: 'mười tám', val: 18 },
  { word: 'mười chín', val: 19 },
  { word: 'mười', val: 10 },
  { word: 'chín', val: 9 },
  { word: 'tám', val: 8 },
  { word: 'bảy', val: 7 },
  { word: 'sáu', val: 6 },
  { word: 'năm', val: 5 },
  { word: 'bốn', val: 4 },
  { word: 'tư', val: 4 },
  { word: 'ba', val: 3 },
  { word: 'hai', val: 2 },
  { word: 'một', val: 1 },
  { word: 'mốt', val: 1 }
];

const voiceParserService = {
  /**
   * Bóc tách câu nói thành thực thể nhật ký canh tác chuẩn VietGAP
   * @param {string} voiceText Chuỗi nhận diện từ Speech-to-Text của nông dân
   * @param {object} contextOptions Thông tin thêm (lô đất, ngày gieo trồng...)
   */
  parse(voiceText, contextOptions = {}) {
    if (!voiceText || typeof voiceText !== 'string') {
      return {
        success: false,
        message: 'Văn bản giọng nói không hợp lệ'
      };
    }

    const cleanText = voiceText.trim();
    const lower = cleanText.toLowerCase();

    // 1. Nhận diện ngày canh tác (Day number)
    let dayNumber = null;

    // Tìm dạng chữ số: "ngày 10", "ngày thứ 14", "ngày 01"
    const digitMatch = lower.match(/(?:ngày|ngày thứ)\s*(\d{1,2})/i);
    if (digitMatch) {
      dayNumber = parseInt(digitMatch[1], 10);
    }

    // Nếu không thấy chữ số, tìm dạng chữ viết: "ngày mười", "ngày hai mươi lăm"
    if (!dayNumber) {
      for (const item of VN_NUMBER_WORDS) {
        if (lower.includes('ngày ' + item.word) || lower.includes('ngày thứ ' + item.word)) {
          dayNumber = item.val;
          break;
        }
      }
    }

    // Fallback: nếu không nói từ "ngày", tìm chữ số đầu tiên
    if (!dayNumber) {
      const standaloneDigit = lower.match(/\b(\d{1,2})\b/);
      if (standaloneDigit && parseInt(standaloneDigit[1], 10) <= 45) {
        dayNumber = parseInt(standaloneDigit[1], 10);
      }
    }

    if (!dayNumber) dayNumber = contextOptions.defaultDay || 1;

    // 2. Nhận diện buổi trong ngày (Session of day)
    let sessionOfDay = 'all_day';
    if (lower.includes('sáng') || lower.includes('buổi sáng') || lower.includes('sáng sớm')) {
      sessionOfDay = 'morning';
    } else if (lower.includes('chiều') || lower.includes('buổi chiều') || lower.includes('chiều mát')) {
      sessionOfDay = 'afternoon';
    } else if (lower.includes('tối') || lower.includes('buổi tối')) {
      sessionOfDay = 'evening';
    }

    // 3. Phân loại 5 Giai đoạn VietGAP
    let stageId = 1;
    let stageName = 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể';

    if (
      lower.includes('thu hoạch') || lower.includes('cắt rau') || lower.includes('thu hái') ||
      lower.includes('test nitrat') || lower.includes('test nhanh') || lower.includes('đóng gói') ||
      lower.includes('dán tem') || lower.includes('kho lạnh') || dayNumber >= 24
    ) {
      stageId = 5;
      stageName = 'Giai đoạn 5: Thu hoạch & Đóng gói hoàn thiện';
    } else if (
      lower.includes('cách ly') || lower.includes('thúc đợt 2') || lower.includes('hữu cơ khoáng') ||
      lower.includes('npk') || lower.includes('gỉ trắng') || dayNumber >= 16
    ) {
      stageId = 4;
      stageName = 'Giai đoạn 4: Thúc sinh trưởng & Kiểm soát an toàn';
    } else if (
      lower.includes('lá mầm') || lower.includes('lá thật') || lower.includes('cây con') ||
      lower.includes('tỉa dặm') || lower.includes('đạm cá') || lower.includes('thúc đợt 1') ||
      lower.includes('sâu bệnh') || lower.includes('bọ nhảy') || lower.includes('tỏi ớt') ||
      lower.includes('dầu khoáng') || (dayNumber >= 5 && dayNumber <= 15)
    ) {
      stageId = 3;
      stageName = 'Giai đoạn 3: Chăm sóc & Cây con phát triển';
    } else if (
      lower.includes('hạt giống') || lower.includes('ngâm hạt') || lower.includes('ủ ấm') ||
      lower.includes('nứt nanh') || lower.includes('gieo hạt') || lower.includes('phủ trấu') ||
      dayNumber === 4
    ) {
      stageId = 2;
      stageName = 'Giai đoạn 2: Xử lý hạt & Gieo trồng';
    } else {
      stageId = 1;
      stageName = 'Giai đoạn 1: Chuẩn bị đất & Xử lý giá thể';
    }

    // 4. Phát hiện cảnh báo đặc biệt
    const isQuarantineNotice = lower.includes('cách ly') || lower.includes('ngừng phân bón') || dayNumber === 21;
    const isHarvestTest = lower.includes('test') || lower.includes('kiểm nghiệm') || lower.includes('nitrat') || dayNumber === 25;

    // 5. Trích xuất vật tư & liều lượng
    const materialsFound = [];
    const dosageFound = [];

    if (lower.includes('vôi')) {
      materialsFound.push('Vôi nông nghiệp (CaCO3)');
      const match = cleanText.match(/(\d+\s*(?:kg|ký|tạ|yến))/i) || cleanText.match(/(ba mươi lăm\s*(?:kg|ký))/i);
      dosageFound.push(match ? match[1] : '35 kg/1.000 m²');
    }
    if (lower.includes('phân chuồng') || lower.includes('trichoderma')) {
      materialsFound.push('Phân chuồng ủ nấm Trichoderma');
    }
    if (lower.includes('sông gianh')) {
      materialsFound.push('Phân hữu cơ Sông Gianh');
    }
    if (lower.includes('lân')) {
      materialsFound.push('Lân nung chảy Lâm Thao');
    }
    if (lower.includes('hạt giống') || lower.includes('trang nông')) {
      materialsFound.push('Hạt giống F1 Trang Nông');
      dosageFound.push('3,5 kg/1.000 m²');
    }
    if (lower.includes('đạm cá')) {
      materialsFound.push('Đạm cá ủ vi sinh thủy phân');
      dosageFound.push('Tỉ lệ pha 1:300');
    }
    if (lower.includes('tỏi') || lower.includes('ớt') || lower.includes('gừng')) {
      materialsFound.push('Dung dịch thảo mộc (Gừng - Tỏi - Ớt)');
    }
    if (lower.includes('dầu khoáng') || lower.includes('enspray')) {
      materialsFound.push('Dầu khoáng nông nghiệp SK Enspray 99 EC');
      dosageFound.push('40 ml / bình 16L');
    }
    if (lower.includes('npk') || lower.includes('khoáng')) {
      materialsFound.push('Phân NPK hữu cơ sinh học khoáng (5-5-5 + TE)');
      dosageFound.push('15 kg/1.000 m²');
    }
    if (lower.includes('nước sạch') || lower.includes('tưới nước')) {
      materialsFound.push('Nước giếng khoan qua hệ thống lắng lọc QCVN');
    }
    if (lower.includes('test') || lower.includes('nitrat')) {
      materialsFound.push('Bộ kit test nhanh Nitrat & Hóa chất BVTV');
    }

    // 6. Tạo tiêu đề hành động ngắn gọn (Action Title)
    let actionTitle = 'Nhật ký chăm sóc ruộng đồng';
    if (lower.includes('cày bừa') || lower.includes('phơi ải') || lower.includes('rải vôi')) {
      actionTitle = 'Khử trùng đất & Phơi ải';
    } else if (lower.includes('bón lót')) {
      actionTitle = 'Bón lót & Phối trộn tầng canh tác';
    } else if (lower.includes('lên luống')) {
      actionTitle = 'Lên luống & Tưới ẩm chuẩn bị gieo';
    } else if (lower.includes('ngâm hạt') || lower.includes('ủ')) {
      actionTitle = 'Xử lý phá miên trạng hạt giống';
    } else if (lower.includes('gieo')) {
      actionTitle = 'Gieo hạt & Che phủ giữ ẩm';
    } else if (lower.includes('lá mầm') || lower.includes('nhú')) {
      actionTitle = 'Cây mầm nhú mầm & Điều chỉnh ánh sáng';
    } else if (lower.includes('lá thật') || lower.includes('thúc đợt 1') || lower.includes('tỉa')) {
      actionTitle = 'Tỉa dặm luống & Tưới thúc đợt 1';
    } else if (lower.includes('sâu bệnh') || lower.includes('bọ nhảy') || lower.includes('ipm')) {
      actionTitle = 'Kiểm tra sâu bệnh IPM & Xử lý thảo mộc sinh học';
    } else if (lower.includes('thúc đợt 2')) {
      actionTitle = 'Bón thúc đợt 2 qua hệ thống tưới';
    } else if (lower.includes('làm cỏ')) {
      actionTitle = 'Làm cỏ thủ công & Xới rãnh luống';
    } else if (lower.includes('cách ly')) {
      actionTitle = 'Bắt đầu thời kỳ cách ly bắt buộc trước thu hoạch';
    } else if (lower.includes('test') || lower.includes('nitrat')) {
      actionTitle = 'Tiền thu hoạch - Kiểm nghiệm chỉ tiêu an toàn';
    } else if (lower.includes('thu hoạch') || lower.includes('cắt')) {
      actionTitle = 'Thu hoạch chính thức & Đóng gói bảo quản';
    }

    return {
      success: true,
      raw_text: cleanText,
      data: {
        day_number: dayNumber,
        stage_id: stageId,
        stage_name: stageName,
        session_of_day: sessionOfDay,
        action_title: actionTitle,
        action_detail: cleanText,
        materials_used: materialsFound.length > 0 ? materialsFound.join(', ') : 'Vật tư canh tác đạt chuẩn VietGAP',
        dosage: dosageFound.length > 0 ? dosageFound.join(', ') : 'Theo định lượng kỹ thuật',
        voice_raw_text: cleanText,
        is_quarantine_notice: isQuarantineNotice ? 1 : 0,
        is_harvest_test: isHarvestTest ? 1 : 0,
        notes: isQuarantineNotice
          ? 'Cách ly tuyệt đối mọi chế phẩm và phân bón tối thiểu 5 ngày trước thu hoạch'
          : (isHarvestTest ? 'Chỉ số Nitrat âm tính, đạt chuẩn cho phép thu hoạch' : 'Ghi chép từ nhật ký giọng nói mobile')
      }
    };
  }
};

module.exports = voiceParserService;
