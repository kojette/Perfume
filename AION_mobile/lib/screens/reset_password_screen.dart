import 'package:flutter/material.dart';
import 'package:aion_perfume_app/screens/login_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  Future<void> _handleSubmit() async {
    if (_passwordController.text.isEmpty || _confirmPasswordController.text.isEmpty) {
      _showAlert('비밀번호를 모두 입력해주세요.');
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      _showAlert('비밀번호가 일치하지 않습니다.');
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userPassword', _passwordController.text);

    _showAlertWithNavigation('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
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

  void _showAlertWithNavigation(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // 다이얼로그 닫기
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('확인', style: TextStyle(color: Color(0xFFC9A961))),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMatch = _passwordController.text == _confirmPasswordController.text;

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
              '비밀번호 재설정',
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
                    'NEW PASSWORD',
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
                    onChanged: (value) => setState(() {}),
                    decoration: const InputDecoration(
                      hintText: '새 비밀번호를 입력해주세요',
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
                    'CONFIRM PASSWORD',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  TextField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    onChanged: (value) => setState(() {}),
                    decoration: const InputDecoration(
                      hintText: '비밀번호를 다시 입력해주세요',
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

                  if (_confirmPasswordController.text.isNotEmpty && !isMatch)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        '비밀번호가 일치하지 않습니다.',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.red,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  const SizedBox(height: 40),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2A2620),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: const RoundedRectangleBorder(),
                      ),
                      child: const Text(
                        'RESET PASSWORD',
                        style: TextStyle(
                          letterSpacing: 3,
                          fontSize: 12,
                          color: Colors.white,
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
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}