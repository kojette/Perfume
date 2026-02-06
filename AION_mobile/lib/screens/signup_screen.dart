import 'package:flutter/material.dart';
import 'login_screen.dart';
import '../services/supabase_service.dart';
import '../services/api_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  
  String _gender = '';
  String _birthYear = '';
  String _birthMonth = '';
  String _birthDay = '';
  bool _agreeAll = false;
  bool _loading = false;

  Future<void> _handleSignup() async {
    // 유효성 검사
    if (_nameController.text.isEmpty) {
      _showAlert('이름을 입력해주세요.');
      return;
    }
    if (_emailController.text.isEmpty || !_emailController.text.contains('@')) {
      _showAlert('올바른 이메일을 입력해주세요.');
      return;
    }
    if (_passwordController.text.length < 8) {
      _showAlert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      _showAlert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (_phoneController.text.isEmpty) {
      _showAlert('전화번호를 입력해주세요.');
      return;
    }
    if (_gender.isEmpty) {
      _showAlert('성별을 선택해주세요.');
      return;
    }
    if (_birthYear.isEmpty || _birthMonth.isEmpty || _birthDay.isEmpty) {
      _showAlert('생년월일을 입력해주세요.');
      return;
    }
    if (!_agreeAll) {
      _showAlert('필수 약관에 동의해주세요.');
      return;
    }

    setState(() => _loading = true);

    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text;
      final name = _nameController.text.trim();
      final phone = _phoneController.text.trim();
      final birth = '$_birthYear-$_birthMonth-$_birthDay';

      // 1. 이메일 중복 체크
      final isDuplicated = await ApiService.checkEmailDuplicate(email);
      if (isDuplicated) {
        _showAlert('이미 사용 중인 이메일입니다.');
        return;
      }

      // 2. Supabase 회원가입
      final authResponse = await SupabaseService.signUp(
        email: email,
        password: password,
      );

      if (authResponse == null || authResponse.user == null) {
        _showAlert('회원가입 중 오류가 발생했습니다.');
        return;
      }

      // 3. Supabase Users 테이블에 사용자 정보 저장
      final userInserted = await SupabaseService.insertUser(
        email: email,
        name: name,
        phone: phone,
        gender: _gender,
        birth: birth,
      );

      if (!userInserted) {
        _showAlert('사용자 정보 저장 중 오류가 발생했습니다.');
        return;
      }

      // 4. 백엔드에 회원 정보 등록
      final backendRegistered = await ApiService.registerMember(
        email: email,
        password: password,
        name: name,
        phone: phone,
        gender: _gender,
        birth: birth,
      );

      if (!backendRegistered) {
        print('백엔드 등록 실패 (계속 진행)');
        // 백엔드 실패해도 회원가입은 완료
      }

      _showAlert('가입이 완료되었습니다!', () {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      });
    } catch (err) {
      print('회원가입 오류: $err');
      _showAlert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
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
            const SizedBox(height: 20),
            const Text(
              'REGISTRATION',
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

            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 이름 & 이메일
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            hintText: '이름',
                            hintStyle: TextStyle(fontSize: 13),
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                            ),
                          ),
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            hintText: '이메일',
                            hintStyle: TextStyle(fontSize: 13),
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                            ),
                          ),
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // 비밀번호
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      hintText: '비밀번호',
                      hintStyle: TextStyle(fontSize: 13),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '* 영문과 숫자를 혼합하여 8자 이상 입력해주세요.',
                    style: TextStyle(
                      fontSize: 9,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 비밀번호 확인
                  TextField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      hintText: '비밀번호 확인',
                      hintStyle: TextStyle(fontSize: 13),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 24),

                  // 전화번호
                  const Text(
                    'PHONE NUMBER',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      hintText: '010-0000-0000',
                      hintStyle: TextStyle(fontSize: 13),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 24),

                  // 성별
                  const Text(
                    'GENDER',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    hint: const Text('성별 (선택)', style: TextStyle(fontSize: 12)),
                    value: _gender.isEmpty ? null : _gender,
                    items: const [
                      DropdownMenuItem(value: 'MALE', child: Text('남성', style: TextStyle(fontSize: 12))),
                      DropdownMenuItem(value: 'FEMALE', child: Text('여성', style: TextStyle(fontSize: 12))),
                    ],
                    onChanged: (value) => setState(() => _gender = value ?? ''),
                  ),
                  const SizedBox(height: 24),

                  // 생년월일
                  const Text(
                    'BIRTH DATE',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 2,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          decoration: const InputDecoration(
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                            ),
                          ),
                          hint: const Text('년', style: TextStyle(fontSize: 12)),
                          value: _birthYear.isEmpty ? null : _birthYear,
                          items: List.generate(100, (i) => 2026 - i)
                              .map((year) => DropdownMenuItem(
                                    value: year.toString(),
                                    child: Text(year.toString(), style: const TextStyle(fontSize: 12)),
                                  ))
                              .toList(),
                          onChanged: (value) => setState(() => _birthYear = value ?? ''),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          decoration: const InputDecoration(
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                            ),
                          ),
                          hint: const Text('월', style: TextStyle(fontSize: 12)),
                          value: _birthMonth.isEmpty ? null : _birthMonth,
                          items: List.generate(12, (i) => i + 1)
                              .map((month) => DropdownMenuItem(
                                    value: month.toString().padLeft(2, '0'),
                                    child: Text('$month월', style: const TextStyle(fontSize: 12)),
                                  ))
                              .toList(),
                          onChanged: (value) => setState(() => _birthMonth = value ?? ''),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          decoration: const InputDecoration(
                            enabledBorder: UnderlineInputBorder(
                              borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                            ),
                          ),
                          hint: const Text('일', style: TextStyle(fontSize: 12)),
                          value: _birthDay.isEmpty ? null : _birthDay,
                          items: List.generate(31, (i) => i + 1)
                              .map((day) => DropdownMenuItem(
                                    value: day.toString().padLeft(2, '0'),
                                    child: Text('$day일', style: const TextStyle(fontSize: 12)),
                                  ))
                              .toList(),
                          onChanged: (value) => setState(() => _birthDay = value ?? ''),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // 약관 동의
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: const Color(0xFFFAF8F3),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: _agreeAll,
                              onChanged: (value) => setState(() => _agreeAll = value ?? false),
                              activeColor: const Color(0xFFC9A961),
                            ),
                            const Text(
                              '전체 동의',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.only(left: 40),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '서비스 이용약관 동의 (필수)',
                                style: TextStyle(
                                  fontSize: 9,
                                  color: Color(0xFF8B8278),
                                  decoration: TextDecoration.underline,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                '개인정보 수집 및 이용 동의 (필수)',
                                style: TextStyle(
                                  fontSize: 9,
                                  color: Color(0xFF8B8278),
                                  decoration: TextDecoration.underline,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 가입 버튼
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _handleSignup,
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
                              'CREATE ACCOUNT',
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
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
}
