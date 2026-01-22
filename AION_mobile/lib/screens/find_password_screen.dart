import 'package:flutter/material.dart';
import 'package:aion_perfume_app/screens/reset_password_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FindPasswordScreen extends StatefulWidget {
  const FindPasswordScreen({super.key});

  @override
  State<FindPasswordScreen> createState() => _FindPasswordScreenState();
}

class _FindPasswordScreenState extends State<FindPasswordScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();

  Future<void> _handleNext() async {
    if (_nameController.text.isEmpty || _emailController.text.isEmpty) {
      _showAlert('이름과 이메일을 모두 입력해주세요.');
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final savedName = prefs.getString('userName');
    final savedEmail = prefs.getString('userEmail');

    if (savedName == null || savedEmail == null) {
      _showAlert('가입된 계정이 없습니다.');
      return;
    }

    if (_nameController.text != savedName || _emailController.text != savedEmail) {
      _showAlert('가입 시 입력한 정보와 일치하지 않습니다.');
      return;
    }

    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ResetPasswordScreen()),
      );
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
            const SizedBox(height: 20),
            const Text(
              '비밀번호 찾기',
              style: TextStyle(
                fontSize: 24,
                letterSpacing: 2,
                color: Color(0xFF2A2620),
              ),
            ),
            const SizedBox(height: 40),

            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'NAME',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      hintText: '이름을 입력해주세요',
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
                    const SizedBox(height: 40),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _handleNext,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2A2620),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: const RoundedRectangleBorder(),
                        ),
                        child: const Text(
                          'NEXT',
                          style: TextStyle(
                            letterSpacing: 3,
                            fontSize: 12,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 30),

                    Container(
                      padding: const EdgeInsets.only(top: 20),
                      decoration: const BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Color(0xFFC9A961), width: 0.1),
                        ),
                      ),
                      child: Center(
                        child: TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text(
                            '로그인으로 돌아가기',
                            style: TextStyle(
                              fontSize: 10,
                              letterSpacing: 2,
                              color: Color(0xFF8B8278),
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
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
  _nameController.dispose();
  _emailController.dispose();
  super.dispose();
  }
}