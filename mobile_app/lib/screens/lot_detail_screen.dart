import 'package:flutter/material.dart';
import '../models/farming_lot_model.dart';
import '../models/farming_log_model.dart';
import '../services/api_service.dart';
import 'voice_log_screen.dart';

class LotDetailScreen extends StatefulWidget {
  final int lotId;

  const LotDetailScreen({Key? key, required this.lotId}) : super(key: key);

  @override
  State<LotDetailScreen> createState() => _LotDetailScreenState();
}

class _LotDetailScreenState extends State<LotDetailScreen> {
  FarmingLotModel? _lot;
  List<FarmingStageGroupModel> _stages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLotDetail();
  }

  Future<void> _loadLotDetail() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getLotDetail(widget.lotId);
    if (mounted) {
      if (data != null) {
        setState(() {
          _lot = data['lot'];
          _stages = data['stages'];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    }
  }

  void _deleteLog(int logId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận xóa nhật ký'),
        content: const Text('Bạn có chắc chắn muốn xóa bản ghi nhật ký canh tác này?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await ApiService.deleteLog(logId);
      if (success) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã xóa bản ghi nhật ký')),
        );
        _loadLotDetail();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF7),
      appBar: AppBar(
        title: Text(_lot?.lotCode ?? 'Chi Tiết Lô Canh Tác'),
        backgroundColor: const Color(0xFF2E7D32),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadLotDetail,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF57C00),
        icon: const Icon(Icons.mic, color: Colors.white),
        label: const Text('NÓI GHI NHẬT KÝ', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        onPressed: () async {
          if (_lot != null) {
            final res = await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => VoiceLogScreen(lots: [_lot!], initialLot: _lot),
              ),
            );
            if (res == true) {
              _loadLotDetail();
            }
          }
        },
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2E7D32)))
          : _lot == null
              ? const Center(child: Text('Không tìm thấy thông tin lô canh tác'))
              : RefreshIndicator(
                  onRefresh: _loadLotDetail,
                  color: const Color(0xFF2E7D32),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Card Header Thông tin lô đất
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2EDE3)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF2E7D32),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      _lot!.lotCode,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE8F5E9),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: const Color(0xFFC8E6C9)),
                                    ),
                                    child: Text(
                                      _lot!.standard,
                                      style: const TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.bold, fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _lot!.name,
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1B5E20)),
                              ),
                              const SizedBox(height: 10),
                              const Divider(height: 1),
                              const SizedBox(height: 10),
                              _buildInfoRow(Icons.crop_square, 'Diện tích:', _lot!.area),
                              _buildInfoRow(Icons.qr_code, 'Mã vùng trồng:', _lot!.zoneCode),
                              _buildInfoRow(Icons.grass, 'Chủng loại giống:', _lot!.plantVariety),
                              _buildInfoRow(Icons.water_drop, 'Nguồn nước:', _lot!.waterSource),
                              _buildInfoRow(Icons.person, 'Phụ trách kỹ thuật:', _lot!.technicianName),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // TIÊU ĐỀ 5 GIAI ĐOẠN CANH TÁC
                        Row(
                          children: const [
                            Icon(Icons.timeline, color: Color(0xFF2E7D32), size: 22),
                            SizedBox(width: 8),
                            Text(
                              'Nhật Ký 5 Giai Đoạn Vòng Đời Canh Tác',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1C3121)),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        // Danh sách 5 giai đoạn
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _stages.length,
                          itemBuilder: (context, stageIndex) {
                            final stage = _stages[stageIndex];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 14),
                              elevation: 1,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: const BorderSide(color: Color(0xFFE2EDE3)),
                              ),
                              child: Theme(
                                data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                                child: ExpansionTile(
                                  initiallyExpanded: true,
                                  leading: CircleAvatar(
                                    backgroundColor: const Color(0xFFE8F5E9),
                                    radius: 16,
                                    child: Text(
                                      '${stage.id}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2E7D32), fontSize: 13),
                                    ),
                                  ),
                                  title: Text(
                                    stage.name,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1B5E20)),
                                  ),
                                  subtitle: Text(
                                    '${stage.timeRange} (${stage.logs.length} hoạt động)',
                                    style: const TextStyle(fontSize: 11.5, color: Colors.black54),
                                  ),
                                  children: [
                                    if (stage.logs.isEmpty)
                                      const Padding(
                                        padding: EdgeInsets.all(16.0),
                                        child: Text(
                                          'Chưa có ghi chép nào trong giai đoạn này.',
                                          style: TextStyle(color: Colors.black45, fontStyle: FontStyle.italic, fontSize: 13),
                                        ),
                                      )
                                    else
                                      ListView.separated(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        itemCount: stage.logs.length,
                                        separatorBuilder: (_, __) => const Divider(height: 1, indent: 16, endIndent: 16),
                                        itemBuilder: (context, logIndex) {
                                          final log = stage.logs[logIndex];
                                          return Padding(
                                            padding: const EdgeInsets.all(14.0),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: const Color(0xFFE8F5E9),
                                                        borderRadius: BorderRadius.circular(6),
                                                        border: Border.all(color: const Color(0xFFC8E6C9)),
                                                      ),
                                                      child: Text(
                                                        'Ngày ${log.dayNumber}',
                                                        style: const TextStyle(
                                                          color: Color(0xFF2E7D32),
                                                          fontWeight: FontWeight.bold,
                                                          fontSize: 11,
                                                        ),
                                                      ),
                                                    ),
                                                    if (log.sessionOfDay != 'all_day') ...[
                                                      const SizedBox(width: 6),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: const Color(0xFFFFF3E0),
                                                          borderRadius: BorderRadius.circular(6),
                                                        ),
                                                        child: Text(
                                                          log.sessionOfDay == 'morning' ? 'Buổi sáng' : 'Buổi chiều',
                                                          style: const TextStyle(
                                                            color: Color(0xFFE65100),
                                                            fontSize: 10.5,
                                                            fontWeight: FontWeight.w600,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                    const Spacer(),
                                                    IconButton(
                                                      icon: const Icon(Icons.delete_outline, size: 18, color: Colors.black38),
                                                      onPressed: () => _deleteLog(log.id),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  log.actionTitle,
                                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1C3121)),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  log.actionDetail,
                                                  style: const TextStyle(fontSize: 12.5, color: Colors.black87, height: 1.4),
                                                ),
                                                if (log.materialsUsed != null && log.materialsUsed!.isNotEmpty) ...[
                                                  const SizedBox(height: 6),
                                                  Row(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      const Icon(Icons.science, size: 14, color: Color(0xFF2E7D32)),
                                                      const SizedBox(width: 4),
                                                      Expanded(
                                                        child: Text(
                                                          'Vật tư: ${log.materialsUsed} (${log.dosage ?? "chuẩn"})',
                                                          style: const TextStyle(fontSize: 11.5, color: Color(0xFF2E7D32), fontWeight: FontWeight.w600),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                                if (log.isQuarantineNotice)
                                                  Container(
                                                    margin: const EdgeInsets.only(top: 8),
                                                    padding: const EdgeInsets.all(8),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFFFF3E0),
                                                      borderRadius: BorderRadius.circular(6),
                                                      border: Border.all(color: Colors.orange),
                                                    ),
                                                    child: Row(
                                                      children: const [
                                                        Icon(Icons.warning, color: Colors.orange, size: 16),
                                                        SizedBox(width: 6),
                                                        Expanded(
                                                          child: Text(
                                                            'Cách ly nghiêm ngặt: Ngừng mọi phân bón/chế phẩm trước thu hoạch',
                                                            style: TextStyle(color: Colors.deepOrange, fontSize: 11, fontWeight: FontWeight.bold),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                if (log.isHarvestTest)
                                                  Container(
                                                    margin: const EdgeInsets.only(top: 8),
                                                    padding: const EdgeInsets.all(8),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFE8F5E9),
                                                      borderRadius: BorderRadius.circular(6),
                                                      border: Border.all(color: Colors.green),
                                                    ),
                                                    child: Row(
                                                      children: const [
                                                        Icon(Icons.check_circle, color: Colors.green, size: 16),
                                                        SizedBox(width: 6),
                                                        Expanded(
                                                          child: Text(
                                                            'Kết quả kiểm nghiệm: Âm tính thuốc BVTV, Nitrat đạt chuẩn xuất vườn',
                                                            style: TextStyle(color: Color(0xFF1B5E20), fontSize: 11, fontWeight: FontWeight.bold),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          );
                                        },
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 15, color: const Color(0xFF2E7D32)),
          const SizedBox(width: 6),
          SizedBox(
            width: 115,
            child: Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1C3121)),
            ),
          ),
        ],
      ),
    );
  }
}
