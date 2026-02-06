import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/perfume.dart';

class ApiService {
  // ============ 기존 메서드 ============
  static Future<String> ping() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/admin/inventory/ping'),
    );

    if (response.statusCode == 200) {
      return response.body;
    } else {
      throw Exception('API 연결 실패');
    }
  }

  static Future<List<Perfume>> fetchPerfumes() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/perfumes'),
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => Perfume.fromJson(e)).toList();
    } else {
      throw Exception('향수 목록 불러오기 실패');
    }
  }

  // ============ 인증 관련 메서드 ============
  
  /// 이메일 중복 체크
  static Future<bool> checkEmailDuplicate(String email) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/members/check-email?email=$email'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? false; // isDuplicated
      }
      return false;
    } catch (e) {
      print('이메일 중복 체크 오류: $e');
      return false;
    }
  }

  /// 회원가입
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
      print('회원가입 오류: $e');
      return false;
    }
  }

  /// 로그인 기록 저장
  static Future<void> recordLogin(String email, String accessToken) async {
    try {
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/login-record'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({
          'email': email,
          'loginMethod': 'EMAIL',
        }),
      );
    } catch (e) {
      print('로그인 기록 저장 오류: $e');
    }
  }

  /// 프로필 조회
  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');
      
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/members/profile'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('프로필 조회 오류: $e');
      return null;
    }
  }

  /// 프로필 업데이트
  static Future<bool> updateProfile({
    String? name,
    String? phone,
    String? gender,
    String? birth,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');
      
      if (token == null) return false;

      final Map<String, dynamic> body = {};
      if (name != null) body['name'] = name;
      if (phone != null) body['phone'] = phone;
      if (gender != null) body['gender'] = gender;
      if (birth != null) body['birth'] = birth;

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/members/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('프로필 업데이트 오류: $e');
      return false;
    }
  }

  /// 회원 탈퇴
  static Future<bool> deleteAccount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');
      
      if (token == null) return false;

      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/members/account'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        // 로컬 저장소 정리
        await prefs.clear();
        return true;
      }
      return false;
    } catch (e) {
      print('회원 탈퇴 오류: $e');
      return false;
    }
  }

  /// 마이페이지 정보 조회
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
      print('마이페이지 정보 조회 오류: $e');
      return null;
    }
  }
}
