import 'package:speech_to_text/speech_to_text.dart';

class SpeechService {
  static final SpeechToText _speech = SpeechToText();
  static bool _isInitialized = false;

  // Khởi tạo Speech To Text
  static Future<bool> initSpeech({Function(String error)? onError}) async {
    if (_isInitialized) return true;
    try {
      _isInitialized = await _speech.initialize(
        onError: (val) {
          print('Lỗi Speech: ${val.errorMsg}');
          if (onError != null) onError(val.errorMsg);
        },
        onStatus: (val) => print('Trạng thái Speech: $val'),
      );
      return _isInitialized;
    } catch (e) {
      print('Không thể khởi tạo SpeechToText: $e');
      if (onError != null) onError(e.toString());
      return false;
    }
  }

  static bool get isListening => _speech.isListening;
  static bool get isAvailable => _isInitialized;

  // Tìm locale tiếng Việt tốt nhất trên thiết bị (hoặc bắt buộc dùng vi_VN)
  static Future<String> getBestVietnameseLocale() async {
    try {
      final locales = await _speech.locales();
      print('SpeechService: Danh sách locales khả dụng: ${locales.map((l) => l.localeId).toList()}');
      
      final vnLocales = locales.where((l) => l.localeId.toLowerCase().startsWith('vi')).toList();
      if (vnLocales.isNotEmpty) {
        final exactVn = vnLocales.firstWhere(
          (l) => l.localeId.toLowerCase().contains('vn'),
          orElse: () => vnLocales.first,
        );
        print('SpeechService: Đã tìm thấy locale Tiếng Việt: ${exactVn.localeId}');
        return exactVn.localeId;
      }
    } catch (e) {
      print('Lỗi lấy danh sách locales: $e');
    }
    // BẮT BUỘC TIẾNG VIỆT: Tuyệt đối không fallback sang en_US hay ngôn ngữ khác!
    print('SpeechService: Ép buộc sử dụng locale Tiếng Việt: vi_VN');
    return 'vi_VN';
  }

  // Bắt đầu lắng nghe giọng nói Tiếng Việt
  static Future<bool> startListening({
    required Function(String recognizedWords, bool isFinal) onResult,
    Function(String errorMsg)? onError,
    String? preferredLocale,
  }) async {
    final available = await initSpeech(onError: onError);
    if (!available) {
      if (onError != null) {
        onError('Dịch vụ giọng nói không khả dụng. Trên máy ảo cần bật "Virtual microphone uses host audio input"');
      }
      return false;
    }

    try {
      // Luôn ưu tiên mã ngôn ngữ Tiếng Việt
      final targetLocale = (preferredLocale != null && preferredLocale.toLowerCase().startsWith('vi'))
          ? preferredLocale
          : await getBestVietnameseLocale();

      print('SpeechService.startListening -> targetLocale: $targetLocale');

      await _speech.listen(
        onResult: (result) {
          onResult(result.recognizedWords, result.finalResult);
        },
        localeId: targetLocale,
        listenFor: const Duration(seconds: 60),
        pauseFor: const Duration(seconds: 8),
        listenOptions: SpeechListenOptions(
          partialResults: true,
          cancelOnError: false,
        ),
      );
      return true;
    } catch (e) {
      print('Lỗi gọi _speech.listen: $e');
      if (onError != null) onError(e.toString());
      return false;
    }
  }

  // Dừng nghe
  static Future<void> stopListening() async {
    if (_speech.isListening) {
      await _speech.stop();
    }
  }

  // Hủy phiên nghe
  static Future<void> cancelListening() async {
    if (_speech.isListening) {
      await _speech.cancel();
    }
  }
}
