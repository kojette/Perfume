import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _loading = false;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _grey = Color(0xFF8B8278);

  // ✅ 비밀번호 유효성 검사 (ResetPassword.jsx와 동일한 규칙)
  bool _isValidPassword(String password) {
    final regex = RegExp(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$');
    return regex.hasMatch(password);
  }

  Future<void> _handleSubmit() async {
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (password.isEmpty || confirmPassword.isEmpty) {
      _showAlert('비밀번호를 모두 입력해주세요.');
      return;
    }

    if (password != confirmPassword) {
      _showAlert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!_isValidPassword(password)) {
      _showAlert('비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.');
      return;
    }

    setState(() => _loading = true);
    try {
      // ✅ supabase.auth.updateUser로 교체 (평문 저장 제거)
      await Supabase.instance.client.auth.updateUser(
        UserAttributes(password: password),
      );

      // ✅ 비밀번호 변경 후 로그아웃 처리
      await Supabase.instance.client.auth.signOut();

      if (mounted) {
        _showAlertWithNavigation('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
      }
    } on AuthException catch (e) {
      if (mounted) _showAlert('오류가 발생했습니다: ${e.message}');
    } catch (e) {
      if (mounted) _showAlert('오류가 발생했습니다: ${e.toString()}');
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
            child: const Text('확인', style: TextStyle(color: _gold)),
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
              Navigator.pop(context);
              // ✅ 로그인 화면으로 이동 (모든 스택 제거)
              Navigator.pushNamedAndRemoveUntil(
                context,
                '/login',
                (route) => false,
              );
            },
            child: const Text('확인', style: TextStyle(color: _gold)),
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
          icon: const Icon(Icons.arrow_back, color: _dark),
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
                color: _gold,
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
              style: TextStyle(fontSize: 24, letterSpacing: 2, color: _dark),
            ),
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: _gold.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'NEW PASSWORD',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: _grey,
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
                        borderSide: BorderSide(color: _gold),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      '* 최소 8자 이상, 영문과 숫자를 포함해주세요',
                      style: TextStyle(fontSize: 9, color: _grey, fontStyle: FontStyle.italic),
                    ),
                  ),
                  const SizedBox(height: 30),

                  const Text(
                    'CONFIRM PASSWORD',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: _grey,
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
                        borderSide: BorderSide(color: _gold),
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

                  if (_confirmPasswordController.text.isNotEmpty &&
                      isMatch &&
                      _passwordController.text.length >= 8)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        '✓ 비밀번호가 일치합니다.',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.green,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),

                  const SizedBox(height: 40),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: (_loading || !isMatch || _passwordController.text.length < 8)
                          ? null
                          : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _dark,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: const RoundedRectangleBorder(),
                        disabledBackgroundColor: _dark.withOpacity(0.5),
                      ),
                      child: _loading
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              '비밀번호 변경',
                              style: TextStyle(
                                letterSpacing: 3,
                                fontSize: 12,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.only(top: 20),
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(color: _gold.withOpacity(0.1)),
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
                            color: _grey,
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
        Container(width: 40, height: 1, color: _gold),
        const SizedBox(width: 8),
        const Icon(Icons.auto_awesome, size: 12, color: _gold),
        const SizedBox(width: 8),
        Container(width: 40, height: 1, color: _gold),
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