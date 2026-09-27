class FarmingLotModel {
  final int id;
  final String lotCode;
  final String name;
  final int? productId;
  final String? productName;
  final String? productImage;
  final String area;
  final String zoneCode;
  final String facilityName;
  final String location;
  final String plantVariety;
  final String waterSource;
  final String technicianName;
  final String standard;
  final String status;
  final String statusText;
  final int progressPercent;
  final int totalLogs;
  final int currentDay;

  FarmingLotModel({
    required this.id,
    required this.lotCode,
    required this.name,
    this.productId,
    this.productName,
    this.productImage,
    required this.area,
    required this.zoneCode,
    required this.facilityName,
    required this.location,
    required this.plantVariety,
    required this.waterSource,
    required this.technicianName,
    required this.standard,
    required this.status,
    required this.statusText,
    required this.progressPercent,
    required this.totalLogs,
    required this.currentDay,
  });

  factory FarmingLotModel.fromJson(Map<String, dynamic> json) {
    return FarmingLotModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      lotCode: json['lot_code'] ?? 'LOT-001',
      name: json['name'] ?? 'Lô canh tác',
      productId: json['product_id'],
      productName: json['product_name'],
      productImage: json['product_image'],
      area: json['area'] ?? '1.000 m²',
      zoneCode: json['zone_code'] ?? 'VN-XX-YY-ZZZ',
      facilityName: json['facility_name'] ?? 'Hợp tác xã Nông nghiệp Bình Mỹ Xanh',
      location: json['location'] ?? 'Bình Mỹ, Củ Chi',
      plantVariety: json['plant_variety'] ?? 'Rau củ chuẩn VietGAP',
      waterSource: json['water_source'] ?? 'Nước kiểm định',
      technicianName: json['technician_name'] ?? 'Kỹ sư nông học',
      standard: json['standard'] ?? 'TCVN 11892-1:2017',
      status: json['status'] ?? 'in_progress',
      statusText: json['status_text'] ?? (json['status'] == 'harvested' ? 'Đã thu hoạch' : 'Đang canh tác'),
      progressPercent: json['progress_percent'] is int ? json['progress_percent'] : int.tryParse(json['progress_percent']?.toString() ?? '0') ?? 0,
      totalLogs: json['total_logs'] is int ? json['total_logs'] : int.tryParse(json['total_logs']?.toString() ?? '0') ?? 0,
      currentDay: json['current_day'] is int ? json['current_day'] : int.tryParse(json['current_day']?.toString() ?? '1') ?? 1,
    );
  }
}
