import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/farming_lot_model.dart';
import '../models/farming_log_model.dart';

class ApiService {
  static const String _keyBaseUrl = 'api_base_url';
  static const String _keyToken = 'jwt_token';
  static const String _keyUser = 'user_data';

  // Tự động nhận diện URL chuẩn theo nền tảng:
  // - Khi chạy trên Web (Chrome/Edge) hoặc Windows/macOS/Linux: http://localhost:3000/api
  // - Khi chạy trên Android Emulator: http://10.0.2.2:3000/api
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }

  static String _currentBaseUrl = '';

  static String get baseUrl {
    if (_currentBaseUrl.isNotEmpty) {
      return _currentBaseUrl;
    }
    return defaultBaseUrl;
  }

  static set baseUrl(String url) {
    _currentBaseUrl = url.trim();
  }

  // Khởi tạo và đọc URL đã lưu (nếu người dùng từng đổi)
  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_keyBaseUrl);
      if (saved != null && saved.trim().isNotEmpty) {
        _currentBaseUrl = saved.trim();
      } else {
        _currentBaseUrl = defaultBaseUrl;
      }
    } catch (_) {
      _currentBaseUrl = defaultBaseUrl;
    }
  }

  // Lưu URL tùy chỉnh vào bộ nhớ thiết bị
  static Future<void> saveBaseUrl(String url) async {
    _currentBaseUrl = url.trim();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyBaseUrl, _currentBaseUrl);
    } catch (_) {}
  }


  // Lấy header kèm Token
  static Future<Map<String, String>> _getHeaders({bool withAuth = true}) async {
    Map<String, String> headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
    };
    if (withAuth) {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_keyToken);
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // 1. Đăng nhập
  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final url = Uri.parse('$baseUrl/auth/login');
      final res = await http.post(
        url,
        headers: await _getHeaders(withAuth: false),
        body: jsonEncode({
          'phone': identifier,
          'password': password,
        }),
      );

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if (res.statusCode == 200 && data['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_keyToken, data['token'] ?? '');
        await prefs.setString(_keyUser, jsonEncode(data['user']));
        return {
          'success': true,
          'user': UserModel.fromJson(data['user']),
          'token': data['token'],
          'message': data['message'] ?? 'Đăng nhập thành công',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Đăng nhập thất bại',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối mạng hoặc địa chỉ máy chủ.',
      };
    }
  }

  // 2. Lấy thông tin tài khoản đã lưu
  static Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_keyUser);
    if (userJson != null) {
      try {
        return UserModel.fromJson(jsonDecode(userJson));
      } catch (_) {}
    }
    return null;
  }

  // 3. Đăng xuất
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUser);
  }

  // 4. Lấy danh sách lô canh tác
  static Future<List<FarmingLotModel>> getLots() async {
    try {
      final url = Uri.parse('$baseUrl/farming/lots');
      final res = await http.get(url, headers: await _getHeaders());
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true) {
          final List list = data['lots'] ?? [];
          return list.map((item) => FarmingLotModel.fromJson(item)).toList();
        }
      }
    } catch (e) {
      print('Lỗi getLots: $e');
    }
    return [];
  }

  // 5. Lấy chi tiết 1 lô canh tác kèm 5 giai đoạn nhật ký
  static Future<Map<String, dynamic>?> getLotDetail(int lotId) async {
    try {
      final url = Uri.parse('$baseUrl/farming/lots/$lotId');
      final res = await http.get(url, headers: await _getHeaders());
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true) {
          final lot = FarmingLotModel.fromJson(data['lot']);
          final List rawStages = data['stages'] ?? [];
          final stages = rawStages.map((s) => FarmingStageGroupModel.fromJson(s)).toList();
          return {
            'lot': lot,
            'stages': stages,
            'commitments': data['commitments'] ?? [],
          };
        }
      }
    } catch (e) {
      print('Lỗi getLotDetail: $e');
    }
    return null;
  }

  // 6. Bóc tách câu nói (Speech to Text Parser API)
  static Future<Map<String, dynamic>?> parseVoiceText(String voiceText, int lotId) async {
    try {
      final url = Uri.parse('$baseUrl/voice/parse');
      final res = await http.post(
        url,
        headers: await _getHeaders(),
        body: jsonEncode({
          'voice_text': voiceText,
          'lot_id': lotId,
        }),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true) {
          return data['parsed'];
        }
      }
    } catch (e) {
      print('Lỗi parseVoiceText: $e');
    }
    return null;
  }

  // 7. Lưu nhật ký canh tác mới
  static Future<Map<String, dynamic>> createLog(Map<String, dynamic> logData) async {
    try {
      final url = Uri.parse('$baseUrl/farming/logs');
      final res = await http.post(
        url,
        headers: await _getHeaders(),
        body: jsonEncode(logData),
      );
      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if (res.statusCode == 201 || (res.statusCode == 200 && data['success'] == true)) {
        return {
          'success': true,
          'message': data['message'] ?? 'Đã lưu nhật ký thành công!',
          'log': data['log'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Không thể lưu nhật ký',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Lỗi kết nối khi lưu nhật ký: $e',
      };
    }
  }

  // 8. Xóa nhật ký
  static Future<bool> deleteLog(int logId) async {
    try {
      final url = Uri.parse('$baseUrl/farming/logs/$logId');
      final res = await http.delete(url, headers: await _getHeaders());
      final data = jsonDecode(utf8.decode(res.bodyBytes));
      return res.statusCode == 200 && data['success'] == true;
    } catch (_) {
      return false;
    }
  }

  // 9. Thống kê tổng quan Dashboard
  static Future<Map<String, dynamic>?> getDashboardStats() async {
    try {
      final url = Uri.parse('$baseUrl/farming/stats');
      final res = await http.get(url, headers: await _getHeaders());
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data['success'] == true) {
          return data['stats'];
        }
      }
    } catch (_) {}
    return null;
  }
}
