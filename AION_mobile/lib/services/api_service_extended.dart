import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import '../config/api_config.dart';
import '../models/perfume.dart';
import '../models/hero_data.dart';

class ApiService {
  static Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken') ?? '';
  }

  static Map<String, String> _authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  static Map<String, String> get _jsonHeaders => {
    'Content-Type': 'application/json',
  };

  // ═══════════════════════════════════════════════════════════════
  // Hero 배너
  // ═══════════════════════════════════════════════════════════════

  static Future<HeroData?> getActiveHero() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/hero/active'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return HeroData.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('Hero 조회 오류: $e');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 향수 목록 및 검색
  //
  // 백엔드 /api/perfumes 는 Spring Page<Perfume> 반환:
  // {
  //   "content": [ { "perfumeId": 1, "name": "...", "brand": {...}, ... } ],
  //   "totalElements": 100,
  //   "totalPages": 5,
  //   "size": 20,
  //   "number": 0
  // }
  // ═══════════════════════════════════════════════════════════════

  static Future<List<Perfume>> fetchPerfumes({
    int page = 0,
    int size = 20,
  }) async {
    try {
      // 쿼리 파라미터 없이 단순 호출 (백엔드가 파라미터 거부함)
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/perfumes'),
      );

      if (response.statusCode == 200) {
        // ⭐ 한글 깨짐 방지: UTF-8 디코딩
        final decoded = utf8.decode(response.bodyBytes);
        final data = jsonDecode(decoded);

        List items = [];

        if (data is List) {
          // 케이스 1: 바로 배열
          items = data;
        } else if (data is Map) {
          if (data.containsKey('content') && data['content'] is List) {
            // 케이스 2: Spring Page { "content": [...] }
            items = data['content'];
          } else if (data.containsKey('data') && data['data'] is List) {
            // 케이스 3: 래핑된 { "data": [...] }
            items = data['data'];
          } else if (data.containsKey('data') &&
              data['data'] is Map &&
              data['data']['content'] is List) {
            // 케이스 4: 이중 래핑
            items = data['data']['content'];
          }
        }

        return items
            .map((e) => Perfume.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      debugPrint('향수 목록 실패: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('향수 목록 조회 오류: $e');
      return [];
    }
  }

  static Future<Perfume?> getPerfumeDetail(int perfumeId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/perfumes/$perfumeId'),
      );

      if (response.statusCode == 200) {
        final decoded = utf8.decode(response.bodyBytes);
        final data = jsonDecode(decoded);
        return Perfume.fromJson(data as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      debugPrint('향수 상세 조회 오류: $e');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 위시리스트
  // ═══════════════════════════════════════════════════════════════

  static Future<List<Perfume>> getWishlist() async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return [];

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/wishlist'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final decoded = utf8.decode(response.bodyBytes);
        final data = jsonDecode(decoded);

        List items = [];
        if (data is List) {
          items = data;
        } else if (data is Map) {
          if (data['data'] is List) {
            items = data['data'];
          } else if (data['content'] is List) {
            items = data['content'];
          }
        }

        return items.map((e) {
          // { perfume: {...} } 래핑 or 직접 구조 모두 처리
          final perfumeData = (e is Map && e.containsKey('perfume'))
              ? e['perfume'] as Map<String, dynamic>
              : e as Map<String, dynamic>;
          return Perfume.fromJson(perfumeData);
        }).toList();
      }
      return [];
    } catch (e) {
      debugPrint('위시리스트 조회 오류: $e');
      return [];
    }
  }

  static Future<bool> addToWishlist(int perfumeId) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/wishlist/$perfumeId'),
        headers: _authHeaders(token),
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('위시리스트 추가 오류: $e');
      return false;
    }
  }

  static Future<bool> removeFromWishlist(int perfumeId) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/wishlist/$perfumeId'),
        headers: _authHeaders(token),
      );

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      debugPrint('위시리스트 삭제 오류: $e');
      return false;
    }
  }

  static Future<bool> isInWishlist(int perfumeId) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/wishlist/check/$perfumeId'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['inWishlist'] ?? false;
      }
      return false;
    } catch (e) {
      debugPrint('위시리스트 확인 오류: $e');
      return false;
    }
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
        headers: _jsonHeaders,
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
        request.files.add(await http.MultipartFile.fromPath(
          'profileImage',
          profileImageFile.path,
        ));

        final streamedResponse = await request.send();
        return streamedResponse.statusCode == 200;
      } else {
        final response = await http.put(
          Uri.parse('${ApiConfig.baseUrl}/api/members/profile'),
          headers: _authHeaders(token),
          body: jsonEncode({
            if (name != null) 'name': name,
            if (nickname != null) 'nickname': nickname,
            if (phone != null) 'phone': phone,
            if (gender != null) 'gender': gender,
            if (birth != null) 'birth': birth,
          }),
        );
        return response.statusCode == 200;
      }
    } catch (e) {
      debugPrint('프로필 업데이트 오류: $e');
      return false;
    }
  }

  static Future<bool> deleteAccount({required String reason}) async {
    try {
      final token = await _getToken();
      if (token.isEmpty) return false;

      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/members/delete'),
        headers: _authHeaders(token),
        body: jsonEncode({'reason': reason}),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('회원 탈퇴 오류: $e');
      return false;
    }
  }
}