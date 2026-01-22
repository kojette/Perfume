import 'package:flutter/material.dart';
import 'package:aion_perfume_app/screens/signup_screen.dart';
import 'package:aion_perfume_app/screens/find_password_screen.dart';
import 'package:aion_perfume_app/screens/home_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
      final prefs = await SharedPreferences.getInstance();
      final savedEmail = prefs.getString('userEmail');
      final savedPassword = prefs.getString('userPassword');

      if (savedEmail == _emailController.text && 
          savedPassword == _passwordController.text) {
        await prefs.setBool('isLoggedIn', true);
        
        final userName = prefs.getString('userName') ?? '고객';
        _showAlert('$userName님, 환영합니다!');
        
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const MainHomePage()),
          );
        }
      } else {
        _showAlert('이메일 또는 비밀번호가 일치하지 않습니다.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAlert(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
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