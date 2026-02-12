import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/perfume.dart';

class ApiService {
  static Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken') ?? '';
  }

  static Map<String, String> _authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // ═══════════════════════════════════════════════════════════════
  // 기본 연결 테스트
  // ═══════════════════════════════════════════════════════════════

  static Future<String> ping() async {
    final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/admin/inventory/ping'));
    if (response.statusCode == 200) return response.body;
    throw Exception('API 연결 실패');
  }

  // ═══════════════════════════════════════════════════════════════
  // 향수 목록
  // ═══════════════════════════════════════════════════════════════

  static Future<List<Perfume>> fetchPerfumes() async {
    final response =
        await http.get(Uri.parse('${ApiConfig.baseUrl}/api/perfumes'));

    if (response.statusCode == 200) {
      // ⭐ UTF-8 필수
      final decoded = utf8.decode(response.bodyBytes);
      final Map<String, dynamic> body = jsonDecode(decoded);

      final List content = body['content']; // Page 핵심
      return content.map((e) => Perfume.fromJson(e)).toList();
    }

    throw Exception('향수 목록 불러오기 실패: ${response.statusCode}');
  }

  // ═══════════════════════════════════════════════════════════════
  // 인증 / 회원가입
  // ═══════════════════════════════════════════════════════════════

  static Future<bool> checkEmailDuplicate(String email) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/members/check-email?email=$email'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? false;
      }
      return false;
    } catch (e) {
      debugPrint('이메일 중복 체크 오류: $e');
      return false;
    }
  }

  static Future<bool> registerMember({
    required String email,
    required String password,
    required String name,
    String? phone,
    String? gender,
    String? birth,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/members/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'name': name,
          'phone': phone,
          'gender': gender,
          'birth': birth,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('회원가입 오류: $e');
      return false;
    }
  }

  static Future<void> recordLogin(String email, String accessToken) async {
    try {
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/login-record'),
        headers: _authHeaders(accessToken),
        body: jsonEncode({'email': email, 'loginMethod': 'EMAIL'}),
      );
    } catch (e) {
      debugPrint('로그인 기록 저장 오류: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 프로필
  // ═══════════════════════════════════════════════════════════════

  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return null;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/members/profile'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('프로필 조회 오류: $e');
      return null;
    }
  }

  /// 프로필 업데이트 - 닉네임, 프로필이미지 파일 지원
  static Future<bool> updateProfile({
    String? name,
    String? nickname,
    String? phone,
    String? gender,
    String? birth,
    File? profileImageFile,
  }) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      // 이미지 파일이 있으면 multipart 요청
      if (profileImageFile != null) {
        final request = http.MultipartRequest(
          'PUT',
          Uri.parse('${ApiConfig.baseUrl}/api/members/profile'),
        );
        request.headers['Authorization'] = 'Bearer $token';
        if (name != null) request.fields['name'] = name;
        if (nickname != null) request.fields['nickname'] = nickname;
        if (phone != null) request.fields['phone'] = phone;
        if (gender != null) request.fields['gender'] = gender;
        if (birth != null) request.fields['birth'] = birth;
        request.files.add(await http.MultipartFile.fromPath('profileImage', profileImageFile.path));

        final streamedResponse = await request.send();
        return streamedResponse.statusCode == 200;
      }

      // 이미지 없으면 JSON 요청
      final Map<String, dynamic> body = {};
      if (name != null) body['name'] = name;
      if (nickname != null) body['nickname'] = nickname;
      if (phone != null) body['phone'] = phone;
      if (gender != null) body['gender'] = gender;
      if (birth != null) body['birth'] = birth;

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/members/profile'),
        headers: _authHeaders(token),
        body: jsonEncode(body),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('프로필 업데이트 오류: $e');
      return false;
    }
  }

  /// 회원 탈퇴 - 탈퇴 사유 전달
  static Future<bool> deleteAccount({String? reason}) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/members/account'),
        headers: _authHeaders(token),
        body: jsonEncode({'reason': reason ?? ''}),
      );

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.clear();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('회원 탈퇴 오류: $e');
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 마이페이지 - 주문 내역
  // ═══════════════════════════════════════════════════════════════

  static Future<List<dynamic>?> getOrders() async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return null;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/orders/my'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('주문 내역 조회 오류: $e');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 관리자 - 회원 관리
  // ═══════════════════════════════════════════════════════════════

  static Future<List<dynamic>?> getAdminMembers() async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return null;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/members'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('관리자 회원 목록 조회 오류: $e');
      return null;
    }
  }

  static Future<bool> updateMemberStatus({required int memberId, required String status}) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/members/$memberId/status'),
        headers: _authHeaders(token),
        body: jsonEncode({'status': status}),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('회원 상태 업데이트 오류: $e');
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 관리자 - 향수 관리
  // ═══════════════════════════════════════════════════════════════

  static Future<List<dynamic>?> getAdminPerfumes() async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return null;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/perfumes'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('관리자 향수 목록 조회 오류: $e');
      return null;
    }
  }

  static Future<bool> deleteAdminPerfume(int perfumeId) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/admin/perfumes/$perfumeId'),
        headers: _authHeaders(token),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('향수 삭제 오류: $e');
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // (기존 유지) 마이페이지 정보 조회
  // ═══════════════════════════════════════════════════════════════

  static Future<Map<String, dynamic>?> getMyPageInfo(int userId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/members/mypage?userId=$userId'),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('마이페이지 정보 조회 오류: $e');
      return null;
    }
  }
}

// debugPrint 임포트 대체용
void debugPrint(String msg) { print(msg); }