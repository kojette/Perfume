//import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
//import '../config/supabase_config.dart';

class SupabaseService {
  static SupabaseClient get _client => Supabase.instance.client;

  /// 이메일/비밀번호 로그인
  static Future<AuthResponse?> signInWithPassword({
    required String email,
    required String password,
  }) async {
    try {
      return await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
    } catch (e) {
      print('Supabase 로그인 오류: $e');
      return null;
    }
  }

  static Future<AuthResponse?> signUp({
    required String email,
    required String password,
  }) async {
    try {
      return await _client.auth.signUp(
        email: email,
        password: password,
      );
    } catch (e) {
      print('Supabase 회원가입 오류: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>?> getUserData(String email) async {
    try {
      return await _client
          .from('Users')
          .select()
          .eq('email', email)
          .single();
    } catch (e) {
      print('사용자 정보 조회 오류: $e');
      return null;
    }
  }

  static Future<bool> checkAdminAccount(String email) async {
    try {
      final res = await _client
          .from('Admin_Accounts')
          .select()
          .eq('email', email)
          .eq('is_active', true)
          .maybeSingle();
      return res != null;
    } catch (e) {
      print('관리자 확인 오류: $e');
      return false;
    }
  }
  static Future<bool> insertUser({
    required String email,
    required String name,
    String? phone,
    String? gender,
    String? birth,
  }) async {
    try {
      await _client.from('Users').insert({
        'email': email,
        'name': name,
        'phone': phone,
        'gender': gender,
        'birth': birth,
        'created_at': DateTime.now().toIso8601String(),
      });
      return true;
    } catch (e) {
      print('사용자 정보 저장 오류: $e');
      return false;
    }
  }

}
