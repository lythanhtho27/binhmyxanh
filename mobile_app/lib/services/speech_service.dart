import 'package:speech_to_text/speech_to_text.dart';

class SpeechService {
  static final SpeechToText _speech = SpeechToText();
  static bool _isInitialized = false;

  // Khởi tạo Speech To Text
  static Future<bool> initSpeech() async {
    if (_isInitialized) return true;
    try {
      _isInitialized = await _speech.initialize(
        onError: (val) => print('Lỗi Speech: $val'),
        onStatus: (val) => print('Trạng thái Speech: $val'),
      );
      return _isInitialized;
    } catch (e) {
      print('Không thể khởi tạo SpeechToText: $e');
      return false;
    }
  }

  static bool get isListening => _speech.isListening;
  static bool get isAvailable => _isInitialized;

  // Bắt đầu lắng nghe giọng nói tiếng Việt
  static Future<void> startListening({
    required Function(String recognizedWords, bool isFinal) onResult,
    String localeId = 'vi_VN',
  }) async {
    final available = await initSpeech();
    if (!available) {
      print('Speech recognition không khả dụng trên thiết bị');
      return;
    }

    await _speech.listen(
      onResult: (result) {
        onResult(result.recognizedWords, result.finalResult);
      },
      localeId: localeId,
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 4),
      partialResults: true,
      cancelOnError: true,
    );
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
