import 'package:flutter/material.dart';
import '../models/farming_lot_model.dart';
import '../services/api_service.dart';
import '../services/speech_service.dart';

class VoiceLogScreen extends StatefulWidget {
  final List<FarmingLotModel> lots;
  final FarmingLotModel? initialLot;

  const VoiceLogScreen({
    Key? key,
    required this.lots,
    this.initialLot,
  }) : super(key: key);

  @override
  State<VoiceLogScreen> createState() => _VoiceLogScreenState();
}

class _VoiceLogScreenState extends State<VoiceLogScreen> with SingleTickerProviderStateMixin {
  late FarmingLotModel _selectedLot;
  final _textController = TextEditingController();
  bool _isListening = false;
  bool _isParsing = false;
  bool _isSaving = false;

  Map<String, dynamic>? _parsedData;
  late AnimationController _animController;

  // Danh sách các câu mẫu bấm nhanh để demo hội đồng / thử nghiệm không cần mic
  final List<Map<String, String>> _samplePrompts = [
    {
      'label': 'Ngày 01: Khử trùng đất',
      'text': 'Hôm nay ngày một cày bừa phơi ải đất diệt mầm bệnh rải ba mươi lăm ký vôi nông nghiệp cho một nghìn mét vuông để khử trùng đất',
    },
    {
      'label': 'Ngày 10: Tưới đạm cá',
      'text': 'Sáng ngày mười cây có hai lá thật, tỉa dặm luống nhổ cỏ dại và tưới thúc đợt 1 bằng đạm cá vi sinh tỷ lệ 1 trên 300',
    },
    {
      'label': 'Ngày 14: Xử lý bọ nhảy',
      'text': 'Ngày mười bốn kiểm tra sâu bệnh phát hiện bọ nhảy mép bờ, phun thảo mộc tỏi ớt gừng với dầu khoáng SK Enspray 40 ml',
    },
    {
      'label': 'Ngày 21: Bắt đầu cách ly',
      'text': 'Ngày hai mươi mốt bắt đầu thời kỳ cách ly bắt buộc trước thu hoạch, ngừng tuyệt đối phân bón chỉ duy trì tưới nước sạch',
    },
    {
      'label': 'Ngày 25: Test nhanh Nitrat',
      'text': 'Ngày hai mươi lăm tiền thu hoạch, lấy mẫu test nhanh nitrat và thuốc bảo vệ thực vật kết quả âm tính cho phép thu hoạch',
    },
  ];

  @override
  void initState() {
    super.initState();
    _selectedLot = widget.initialLot ?? (widget.lots.isNotEmpty ? widget.lots.first : FarmingLotModel(
      id: 1, lotCode: 'RM-VG-2026-0901', name: 'Rau muống VietGAP', area: '1000m2', zoneCode: 'VN-01',
      facilityName: 'Bình Mỹ Xanh', location: 'Củ Chi', plantVariety: 'F1 Trang Nông',
      waterSource: 'Nước lọc', technicianName: 'Kỹ sư', standard: 'VietGAP', status: 'in_progress',
      statusText: 'Đang canh tác', progressPercent: 50, totalLogs: 5, currentDay: 10,
    ));

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    SpeechService.stopListening();
    _animController.dispose();
    _textController.dispose();
    super.dispose();
  }

  void _toggleListening() async {
    if (_isListening) {
      await SpeechService.stopListening();
      setState(() => _isListening = false);
      if (_textController.text.trim().isNotEmpty) {
        _parseVoiceText(_textController.text.trim());
      }
    } else {
      setState(() {
        _isListening = true;
        _parsedData = null;
      });

      final success = await SpeechService.startListening(
        preferredLocale: 'vi_VN',
        onResult: (words, isFinal) {
          setState(() {
            _textController.text = words;
          });
          if (isFinal && words.trim().isNotEmpty) {
            setState(() => _isListening = false);
            _parseVoiceText(words.trim());
          }
        },
        onError: (error) {
          setState(() => _isListening = false);
          if (mounted) {
            String message = 'Micro chưa nhận được âm thanh ($error).';
            if (error.contains('error_speech_timeout')) {
              message = 'Chưa nghe thấy giọng nói (quá thời gian chờ).\n👉 Hãy kiểm tra micro máy tính và bật "Host Audio Input" trên giả lập, hoặc bấm câu mẫu bên dưới!';
            } else if (error.contains('error_no_match')) {
              message = 'Không nhận dạng được từ nào. Vui lòng nói to và rõ hơn (hoặc kiểm tra cài đặt Tiếng Việt của máy).';
            }

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('⚠️ $message'),
                backgroundColor: Colors.amber.shade900,
                duration: const Duration(seconds: 5),
              ),
            );
          }
        },
      );

      if (!success) {
        setState(() => _isListening = false);
      }
    }
  }

  void _parseVoiceText(String text) async {
    if (text.isEmpty) return;
    setState(() => _isParsing = true);

    final parsed = await ApiService.parseVoiceText(text, _selectedLot.id);

    setState(() {
      _parsedData = parsed;
      _isParsing = false;
    });
  }

  void _applySamplePrompt(String text) {
    _textController.text = text;
    _parseVoiceText(text);
  }

  void _saveLog() async {
    if (_parsedData == null && _textController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nói hoặc nhập nội dung nhật ký trước')),
      );
      return;
    }

    setState(() => _isSaving = true);

    Map<String, dynamic> payload;
    if (_parsedData != null) {
      payload = {
        'lot_id': _selectedLot.id,
        'day_number': _parsedData!['day_number'],
        'stage_id': _parsedData!['stage_id'],
        'stage_name': _parsedData!['stage_name'],
        'session_of_day': _parsedData!['session_of_day'],
        'action_title': _parsedData!['action_title'],
        'action_detail': _parsedData!['action_detail'],
        'materials_used': _parsedData!['materials_used'],
        'dosage': _parsedData!['dosage'],
        'voice_text': _textController.text.trim(),
        'notes': _parsedData!['notes'],
        'is_quarantine_notice': _parsedData!['is_quarantine_notice'] ?? 0,
        'is_harvest_test': _parsedData!['is_harvest_test'] ?? 0,
      };
    } else {
      payload = {
        'lot_id': _selectedLot.id,
        'voice_text': _textController.text.trim(),
      };
    }

    final res = await ApiService.createLog(payload);

    setState(() => _isSaving = false);

    if (res['success'] == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Đã lưu và đồng bộ lên Web thành công!'),
          backgroundColor: const Color(0xFF2E7D32),
        ),
      );
      Navigator.pop(context, true);
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Lỗi khi lưu nhật ký'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF7),
      appBar: AppBar(
        title: const Text('Ghi Nhật Ký Bằng Giọng Nói'),
        backgroundColor: const Color(0xFF2E7D32),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Chọn Lô Canh Tác
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2EDE3)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<FarmingLotModel>(
                  value: _selectedLot,
                  isExpanded: true,
                  icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF2E7D32)),
                  items: widget.lots.map((lot) {
                    return DropdownMenuItem<FarmingLotModel>(
                      value: lot,
                      child: Row(
                        children: [
                          const Icon(Icons.location_on, color: Color(0xFF2E7D32), size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${lot.lotCode} - ${lot.name}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (newLot) {
                    if (newLot != null) {
                      setState(() => _selectedLot = newLot);
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 20),

            // NÚT MICROPHONE TRUNG TÂM
            Center(
              child: Column(
                children: [
                  // Badge trạng thái ngôn ngữ
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFA5D6A7)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('🇻🇳', style: TextStyle(fontSize: 14)),
                        SizedBox(width: 8),
                        Text(
                          'Ngôn ngữ nhận diện: Tiếng Việt (vi-VN)',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF2E7D32),
                          ),
                        ),
                      ],
                    ),
                  ),

                  AnimatedBuilder(
                    animation: _animController,
                    builder: (context, child) {
                      final scale = _isListening ? 1.0 + (_animController.value * 0.15) : 1.0;
                      return Transform.scale(
                        scale: scale,
                        child: child,
                      );
                    },
                    child: GestureDetector(
                      onTap: _toggleListening,
                      child: Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isListening ? const Color(0xFFE53935) : const Color(0xFF2E7D32),
                          boxShadow: [
                            BoxShadow(
                              color: (_isListening ? Colors.red : const Color(0xFF2E7D32)).withOpacity(0.35),
                              blurRadius: 18,
                              spreadRadius: _isListening ? 4 : 2,
                            ),
                          ],
                        ),
                        child: Icon(
                          _isListening ? Icons.stop : Icons.mic,
                          color: Colors.white,
                          size: 44,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _isListening ? '🔴 Đang nghe bác nói... Bấm nút đỏ để dừng' : 'Chạm vào Micro để bắt đầu nói',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: _isListening ? const Color(0xFFC62828) : const Color(0xFF2E7D32),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Hộp hiển thị văn bản vừa nói
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Văn bản ghi nhận:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black54),
                        ),
                        if (_textController.text.isNotEmpty)
                          TextButton(
                            onPressed: () => _parseVoiceText(_textController.text),
                            child: const Text('Phân tích lại'),
                          ),
                      ],
                    ),
                    TextField(
                      controller: _textController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'Nói hoặc gõ nội dung công việc (ví dụ: bón vôi, tưới nước, sâu bệnh...)',
                        border: InputBorder.none,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Câu mẫu bấm nhanh (Hữu ích khi demo)
            const Text(
              'Gợi ý nhanh để thử nghiệm:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54),
            ),
            const SizedBox(height: 6),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _samplePrompts.map((p) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ActionChip(
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFC8E6C9)),
                      avatar: const Icon(Icons.bolt, size: 16, color: Color(0xFF2E7D32)),
                      label: Text(p['label']!, style: const TextStyle(fontSize: 12, color: Color(0xFF2E7D32))),
                      onPressed: () => _applySamplePrompt(p['text']!),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 18),

            // KẾT QUẢ BÓC TÁCH THÔNG MINH (Smart Preview Card)
            if (_isParsing)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: CircularProgressIndicator(color: Color(0xFF2E7D32)),
                ),
              )
            else if (_parsedData != null)
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: Color(0xFF81C784)),
                ),
                color: const Color(0xFFF1F8E9),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome, color: Color(0xFF2E7D32), size: 20),
                          const SizedBox(width: 8),
                          const Text(
                            'KẾT QUẢ AI BÓC TÁCH THỰC THỂ',
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 13.5,
                              color: Color(0xFF1B5E20),
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2E7D32),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Ngày ${_parsedData!['day_number']}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      const Divider(color: Color(0xFFC8E6C9)),
                      _buildPreviewRow('Giai đoạn:', _parsedData!['stage_name']),
                      _buildPreviewRow('Hoạt động:', _parsedData!['action_title']),
                      _buildPreviewRow('Vật tư:', _parsedData!['materials_used']),
                      _buildPreviewRow('Liều lượng:', _parsedData!['dosage']),

                      if (_parsedData!['is_quarantine_notice'] == 1)
                        Container(
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.orange),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.warning, color: Colors.orange, size: 18),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Cảnh báo: Bắt đầu thời kỳ cách ly nghiêm ngặt!',
                                  style: TextStyle(fontSize: 11.5, color: Colors.deepOrange, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),

                      if (_parsedData!['is_harvest_test'] == 1)
                        Container(
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.green),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.check_circle, color: Colors.green, size: 18),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Đạt kiểm định an toàn Nitrat và thuốc BVTV!',
                                  style: TextStyle(fontSize: 11.5, color: Color(0xFF1B5E20), fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 20),

            // NÚT LƯU VÀ ĐỒNG BỘ LÊN WEB
            ElevatedButton.icon(
              onPressed: _isSaving ? null : _saveLog,
              icon: _isSaving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.cloud_upload),
              label: Text(
                _isSaving ? 'ĐANG ĐỒNG BỘ...' : 'LƯU & ĐỒNG BỘ LÊN WEBSITE',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 85,
            child: Text(
              label,
              style: const TextStyle(fontSize: 12.5, color: Colors.black54, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(
              value ?? '---',
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF1C3121)),
            ),
          ),
        ],
      ),
    );
  }
}
