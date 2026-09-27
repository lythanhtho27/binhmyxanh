class FarmingLogModel {
  final int id;
  final int lotId;
  final String logDate;
  final int dayNumber;
  final int stageId;
  final String stageName;
  final String sessionOfDay;
  final String actionTitle;
  final String actionDetail;
  final String? materialsUsed;
  final String? dosage;
  final String? voiceRawText;
  final String? imageUrl;
  final String? notes;
  final bool isQuarantineNotice;
  final bool isHarvestTest;
  final String? authorName;

  FarmingLogModel({
    required this.id,
    required this.lotId,
    required this.logDate,
    required this.dayNumber,
    required this.stageId,
    required this.stageName,
    required this.sessionOfDay,
    required this.actionTitle,
    required this.actionDetail,
    this.materialsUsed,
    this.dosage,
    this.voiceRawText,
    this.imageUrl,
    this.notes,
    required this.isQuarantineNotice,
    required this.isHarvestTest,
    this.authorName,
  });

  factory FarmingLogModel.fromJson(Map<String, dynamic> json) {
    return FarmingLogModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      lotId: json['lot_id'] is int ? json['lot_id'] : int.tryParse(json['lot_id']?.toString() ?? '0') ?? 0,
      logDate: json['log_date'] ?? '',
      dayNumber: json['day_number'] is int ? json['day_number'] : int.tryParse(json['day_number']?.toString() ?? '1') ?? 1,
      stageId: json['stage_id'] is int ? json['stage_id'] : int.tryParse(json['stage_id']?.toString() ?? '1') ?? 1,
      stageName: json['stage_name'] ?? 'Giai đoạn 1',
      sessionOfDay: json['session_of_day'] ?? 'all_day',
      actionTitle: json['action_title'] ?? 'Hoạt động canh tác',
      actionDetail: json['action_detail'] ?? '',
      materialsUsed: json['materials_used'],
      dosage: json['dosage'],
      voiceRawText: json['voice_raw_text'],
      imageUrl: json['image_url'],
      notes: json['notes'],
      isQuarantineNotice: json['is_quarantine_notice'] == 1 || json['is_quarantine_notice'] == true,
      isHarvestTest: json['is_harvest_test'] == 1 || json['is_harvest_test'] == true,
      authorName: json['author_name'],
    );
  }
}

class FarmingStageGroupModel {
  final int id;
  final String name;
  final String timeRange;
  final String icon;
  final List<FarmingLogModel> logs;

  FarmingStageGroupModel({
    required this.id,
    required this.name,
    required this.timeRange,
    required this.icon,
    required this.logs,
  });

  factory FarmingStageGroupModel.fromJson(Map<String, dynamic> json) {
    var rawLogs = json['logs'] as List? ?? [];
    List<FarmingLogModel> parsedLogs = rawLogs.map((item) => FarmingLogModel.fromJson(item)).toList();
    return FarmingStageGroupModel(
      id: json['id'] ?? 1,
      name: json['name'] ?? '',
      timeRange: json['timeRange'] ?? '',
      icon: json['icon'] ?? 'fa-seedling',
      logs: parsedLogs,
    );
  }
}
