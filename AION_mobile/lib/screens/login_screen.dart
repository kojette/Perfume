import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'signup_screen.dart';
import 'find_password_screen.dart';
import 'home_screen.dart';
import '../services/supabase_service.dart';
import '../services/api_service.dart';
import 'main_screen.dart';//

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;

  Future<void> _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showAlert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setState(() => _loading = true);

    try {
      // 1. Supabase 로그인
      final authResponse = await SupabaseService.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      if (authResponse == null || authResponse.session == null) {
        setState(() => _loading = false);
        _showAlert('이메일 또는 비밀번호가 일치하지 않습니다.');
        return;
      }

      // 2. JWT 토큰 저장
      final accessToken = authResponse.session!.accessToken;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', accessToken);

      // 3. Supabase에서 사용자 정보 조회
      final userData = await SupabaseService.getUserData(_emailController.text.trim());
      final isAdmin = await SupabaseService.checkAdminAccount(_emailController.text.trim());

      // 4. 세션 정보 저장
      await prefs.setBool('isLoggedIn', true);
      await prefs.setString('userEmail', userData?['email'] ?? _emailController.text);
      await prefs.setString('userName', userData?['name'] ?? '사용자');
      await prefs.setString('userPhone', userData?['phone'] ?? '');
      await prefs.setString('userGender', userData?['gender'] ?? '');
      await prefs.setString('userBirth', userData?['birth'] ?? '');
      await prefs.setBool('isAdmin', isAdmin);

      // 5. 백엔드에 로그인 기록
      try {
        await ApiService.recordLogin(_emailController.text.trim(), accessToken);
      } catch (e) {
        print('백엔드 로그인 기록 실패: $e');
        // 백엔드 실패해도 로그인은 진행
      }

      final userName = userData?['name'] ?? '사용자';
      if (mounted) {
        if (isAdmin) {
          _showAlert('$userName님, 관리자 페이지로 접속합니다.', () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) =>  MainScreen()),
            );
          });
        } else {
          _showAlert('$userName님, 환영합니다!', () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) =>  MainScreen()),
            );
          });
        }
      }
    } catch (err) {
      print('로그인 오류: $err');
      _showAlert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAlert(String message, [VoidCallback? onConfirm]) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              onConfirm?.call();
            },
            child: const Text('확인', style: TextStyle(color: Color(0xFFC9A961))),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F3),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF2A2620)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 40),
            
            // 타이틀
            const Text(
              'AUTHENTICATION',
              style: TextStyle(
                color: Color(0xFFC9A961),
                fontSize: 10,
                letterSpacing: 5,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 20),
            _buildOrnament(),
            const SizedBox(height: 40),

            // 로그인 박스
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 이메일
                  const Text(
                    'EMAIL ADDRESS',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: '이메일을 입력해주세요',
                      hintStyle: TextStyle(fontSize: 13, color: Colors.black26),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                      focusedBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A961)),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 30),

                  // 비밀번호
                  const Text(
                    'PASSWORD',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      hintText: '비밀번호를 입력해주세요',
                      hintStyle: TextStyle(fontSize: 13, color: Colors.black26),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                      focusedBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A961)),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 40),

                  // 로그인 버튼
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2A2620),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: const RoundedRectangleBorder(),
                      ),
                      child: _loading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              'SIGN IN',
                              style: TextStyle(
                                letterSpacing: 3,
                                fontSize: 12,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 30),

                  // 하단 링크
                  Container(
                    padding: const EdgeInsets.only(top: 20),
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(color: Color(0xFFC9A961), width: 0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const SignupScreen(),
                              ),
                            );
                          },
                          child: const Text(
                            '계정 생성하기',
                            style: TextStyle(
                              fontSize: 10,
                              letterSpacing: 2,
                              color: Color(0xFFC9A961),
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const FindPasswordScreen(),
                              ),
                            );
                          },
                          child: const Text(
                            '비밀번호 찾기',
                            style: TextStyle(
                              fontSize: 10,
                              letterSpacing: 2,
                              color: Color(0xFF8B8278),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrnament() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 40, height: 1, color: const Color(0xFFC9A961)),
        const SizedBox(width: 8),
        const Icon(Icons.auto_awesome, size: 12, color: Color(0xFFC9A961)),
        const SizedBox(width: 8),
        Container(width: 40, height: 1, color: const Color(0xFFC9A961)),
      ],
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
