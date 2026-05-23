import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../screens/login_screen.dart';

class AuthGuard {
  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('isLoggedIn') ?? false;
  }

  static Future<void> require(
    BuildContext context, {
    required String reason,
    required VoidCallback onAuthorized,
  }) async {
    if (await isLoggedIn()) {
      onAuthorized();
      return;
    }
    if (!context.mounted) return;

    final goLogin = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFFFAF8F3),
        title: const Text(
          'MEMBERS ONLY',
          style: TextStyle(
            color: Color(0xFFC9A961),
            fontSize: 11,
            letterSpacing: 4,
          ),
        ),
        content: Text(
          reason + ' 로그인이 필요합니다.',
          style: const TextStyle(fontSize: 13, color: Color(0xFF2A2620)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('둘러보기'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('SIGN IN'),
          ),
        ],
      ),
    );

    if (goLogin == true && context.mounted) {
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      if (result == true && context.mounted) {
        onAuthorized();
      }
    }
  }
}
