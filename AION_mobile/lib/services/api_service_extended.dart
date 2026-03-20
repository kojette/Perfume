import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import '../config/api_config.dart';
import '../models/perfume.dart';
import '../models/hero_data.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
  // [FIX] hero_images를 FK join 대신 별도 쿼리로 분리
  // → Supabase Foreign Key 미등록 시 join이 null 반환하는 문제 해결
  // ═══════════════════════════════════════════════════════════════

  static Future<HeroData?> getActiveHero() async {
    try {
      final supabase = Supabase.instance.client;

      // 프론트(Hero.jsx)와 동일한 방식
      // hero_history PK = 'id' (hero_id 아님!)
      // hero_images FK join은 Supabase에 등록되어 있어 작동함
      final heroList = await supabase
          .from('hero_history')
          .select('id, title, subtitle, tagline, hero_images(image_url)')
          .eq('is_active', true)
          .limit(1);

      if (heroList.isEmpty) return null;
      final item = heroList[0];

      // join 결과 파싱
      final imagesList = item['hero_images'] as List? ?? [];
      List<String> images = imagesList
          .map((img) => img['image_url'] as String? ?? '')
          .where((url) => url.isNotEmpty)
          .toList();

      // join 결과 비어있으면 hero id로 별도 쿼리 fallback
      if (images.isEmpty) {
        final heroId = item['id'];
        if (heroId != null) {
          try {
            final imgList = await supabase
                .from('hero_images')
                .select('image_url')
                .eq('hero_id', heroId);
            images = (imgList as List)
                .map((img) => img['image_url'] as String? ?? '')
                .where((url) => url.isNotEmpty)
                .toList();
          } catch (imgErr) {
            debugPrint('Hero 이미지 fallback 오류: $imgErr');
          }
        }
      }

      return HeroData(
        title: item['title'] ?? 'AION',
        subtitle: item['subtitle'] ?? '영원한 그들의 향을 담다',
        tagline: item['tagline'] ?? 'ESSENCE OF DIVINE',
        images: images,
      );
    } catch (e) {
      debugPrint('Hero 조회 오류: $e');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 향수 목록 + Supabase 이미지 일괄 매핑
  // [FIX] Spring API 응답에 imageUrl 없음 → Supabase Perfume_Images에서
  //       is_thumbnail=true 레코드를 batch 조회 후 주입
  // ═══════════════════════════════════════════════════════════════

  static Future<List<Perfume>> fetchPerfumes({
    int page = 0,
    int size = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/perfumes'),
      );

      if (response.statusCode == 200) {
        final decoded = utf8.decode(response.bodyBytes);
        final data = jsonDecode(decoded);

        List items = [];
        if (data is List) {
          items = data;
        } else if (data is Map) {
          if (data.containsKey('content') && data['content'] is List) {
            items = data['content'];
          } else if (data.containsKey('data') && data['data'] is List) {
            items = data['data'];
          } else if (data.containsKey('data') &&
              data['data'] is Map &&
              data['data']['content'] is List) {
            items = data['data']['content'];
          }
        }

        // 이미지 URL 주입
        final enriched = await _enrichWithImages(
          items.cast<Map<String, dynamic>>(),
        );

        return enriched
            .map((e) => Perfume.fromJson(e))
            .toList();
      }

      debugPrint('향수 목록 실패: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('향수 목록 조회 오류: $e');
      return [];
    }
  }

  /// Supabase Perfume_Images 테이블에서 thumbnail 이미지를 batch 조회하여
  /// 향수 Map 리스트에 imageUrl / thumbnail 필드를 주입합니다.
  static Future<List<Map<String, dynamic>>> _enrichWithImages(
    List<Map<String, dynamic>> perfumes,
  ) async {
    if (perfumes.isEmpty) return perfumes;

    try {
      final supabase = Supabase.instance.client;
      final ids = perfumes
          .map((p) => (p['perfumeId'] ?? p['perfume_id']) as int?)
          .whereType<int>()
          .toList();

      if (ids.isEmpty) return perfumes;

      final imgData = await supabase
          .from('Perfume_Images')
          .select('perfume_id, image_url')
          .inFilter('perfume_id', ids)
          .eq('is_thumbnail', true);

      // perfume_id → image_url 맵 생성
      final imgMap = <int, String>{
        for (final img in imgData as List)
          if (img['perfume_id'] != null && img['image_url'] != null)
            img['perfume_id'] as int: img['image_url'] as String,
      };

      return perfumes.map((p) {
        final pid = (p['perfumeId'] ?? p['perfume_id']) as int?;
        final url = pid != null ? imgMap[pid] : null;
        return {
          ...p,
          if (url != null) 'imageUrl': url,
          if (url != null) 'thumbnail': url,
        };
      }).toList();
    } catch (e) {
      debugPrint('이미지 batch 조회 오류: $e');
      return perfumes; // 실패 시 원본 반환 (이미지 없이 표시)
    }
  }

  /// 추천 페이지용: 필터/정렬 파라미터를 포함한 향수 조회
  /// Spring API + Supabase 이미지 자동 주입
  static Future<List<Map<String, dynamic>>> fetchPerfumesRaw({
    String? search,
    List<String>? tags,
    String? gender,
    String sortBy = 'latest',
    int page = 0,
    int size = 50,
  }) async {
    try {
      final supabase = Supabase.instance.client;

      // Supabase에서 직접 조회 (프론트와 동일한 방식)
      // filter 단계와 order 단계를 분리하여 타입 충돌 방지
      var filterQuery = supabase
          .from('Perfumes')
          .select('''
            perfume_id, name, name_en, description,
            price, sale_price, sale_rate, brand_id,
            gender, concentration,
            Brands(brand_name),
            Perfume_Images(image_url, is_thumbnail),
            Preference_Tags:Perfume_Tags(tag_name:Preference_Tags(tag_name))
          ''')
          .eq('is_active', true);

      if (gender != null && gender.isNotEmpty) {
        filterQuery = filterQuery.eq('gender', gender);
      }

      // order()는 PostgrestTransformBuilder를 반환하므로 별도 변수로 받음
      final String orderCol = (sortBy == 'price-low' || sortBy == 'price-high')
          ? 'price'
          : 'name';
      final bool ascending = sortBy != 'price-high';

      final data = await filterQuery
          .order(orderCol, ascending: ascending)
          .range(page * size, (page + 1) * size - 1);
      List<Map<String, dynamic>> items = (data as List).cast<Map<String, dynamic>>();

      // 검색어 필터 (클라이언트 사이드)
      if (search != null && search.isNotEmpty) {
        final s = search.toLowerCase();
        items = items.where((p) {
          final name = (p['name'] ?? '').toString().toLowerCase();
          final nameEn = (p['name_en'] ?? '').toString().toLowerCase();
          final brand = (p['Brands']?['brand_name'] ?? '').toString().toLowerCase();
          return name.contains(s) || nameEn.contains(s) || brand.contains(s);
        }).toList();
      }

      // 태그 필터 (클라이언트 사이드)
      if (tags != null && tags.isNotEmpty) {
        items = items.where((p) {
          final pTags = (p['Preference_Tags'] as List? ?? [])
              .map((t) => (t['tag_name'] ?? '').toString().toLowerCase())
              .toList();
          return tags.any((sel) => pTags.any((t) => t.contains(sel.toLowerCase())));
        }).toList();
      }

      // 정규화
      return items.map((p) {
        final imgList = p['Perfume_Images'] as List? ?? [];
        final thumbUrl = imgList
            .where((i) => i['is_thumbnail'] == true)
            .map((i) => i['image_url'] as String?)
            .firstWhere((u) => u != null, orElse: () => null);
        final tagList = (p['Preference_Tags'] as List? ?? [])
            .map((t) => (t['tag_name'] ?? '').toString())
            .where((t) => t.isNotEmpty)
            .toList();
        final salePrice = p['sale_price'];
        final price = p['price'] ?? 0;
        final saleRate = p['sale_rate'] ?? 0;
        return {
          'id': p['perfume_id'],
          'perfumeId': p['perfume_id'],
          'name': p['name'] ?? '',
          'nameEn': p['name_en'] ?? '',
          'brandName': p['Brands']?['brand_name'] ?? '',
          'description': p['description'] ?? '',
          'price': salePrice ?? price,
          'originalPrice': price,
          'salePrice': salePrice,
          'saleRate': saleRate,
          'discountRate': saleRate,
          'imageUrl': thumbUrl,
          'thumbnail': thumbUrl,
          'tags': tagList,
          'gender': p['gender'],
          'concentration': p['concentration'],
        };
      }).toList();
    } catch (e) {
      debugPrint('Supabase 향수 조회 오류, Spring fallback: $e');
      // fallback: Spring API
      final list = await fetchPerfumes(page: page, size: size);
      return list.map((p) => {
        'id': p.id,
        'perfumeId': p.id,
        'name': p.name,
        'nameEn': p.nameEn ?? '',
        'brandName': p.brandName ?? '',
        'price': p.displayPrice,
        'originalPrice': p.price,
        'salePrice': p.salePrice,
        'saleRate': p.saleRate,
        'discountRate': p.saleRate,
        'imageUrl': p.imageUrl,
        'thumbnail': p.imageUrl,
        'tags': p.tags ?? [],
        'gender': p.gender,
      }).toList();
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
        final perfume = Perfume.fromJson(data as Map<String, dynamic>);

        // 이미지 없으면 Supabase에서 보완
        if (perfume.imageUrl == null) {
          try {
            final supabase = Supabase.instance.client;
            final imgs = await supabase
                .from('Perfume_Images')
                .select('image_url')
                .eq('perfume_id', perfumeId)
                .eq('is_thumbnail', true)
                .limit(1);
            if ((imgs as List).isNotEmpty) {
              final url = imgs[0]['image_url'] as String?;
              if (url != null) {
                return Perfume(
                  id: perfume.id, name: perfume.name, nameEn: perfume.nameEn,
                  brandName: perfume.brandName, imageUrl: url,
                  tags: perfume.tags, category: perfume.category,
                  price: perfume.price, salePrice: perfume.salePrice,
                  saleRate: perfume.saleRate, volumeMl: perfume.volumeMl,
                  concentration: perfume.concentration, gender: perfume.gender,
                  season: perfume.season, occasion: perfume.occasion,
                  avgRating: perfume.avgRating, reviewCount: perfume.reviewCount,
                  description: perfume.description, isActive: perfume.isActive,
                );
              }
            }
          } catch (_) {}
        }
        return perfume;
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

        final rawList = items.map((e) {
          final perfumeData = (e is Map && e.containsKey('perfume'))
              ? e['perfume'] as Map<String, dynamic>
              : e as Map<String, dynamic>;
          return perfumeData;
        }).toList();

        final enriched = await _enrichWithImages(rawList.cast<Map<String, dynamic>>());
        return enriched.map((e) => Perfume.fromJson(e)).toList();
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
