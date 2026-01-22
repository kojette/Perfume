import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  String _gender = '';
  String _birth = '';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _nameController.text = prefs.getString('userName') ?? '';
      _emailController.text = prefs.getString('userEmail') ?? '';
      _phoneController.text = prefs.getString('userPhone') ?? '';
      _gender = prefs.getString('userGender') ?? '';
      _birth = prefs.getString('userBirth') ?? '';
    });
  }

  Future<void> _handleSave() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userName', _nameController.text);
    await prefs.setString('userPhone', _phoneController.text);
    await prefs.setString('userGender', _gender);
    await prefs.setString('userBirth', _birth);

    _showAlert('회원 정보가 수정되었습니다.');
  }

  void _showAlert(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // 다이얼로그 닫기
              Navigator.pop(context); // 이전 화면으로
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
              'PROFILE EDIT',
              style: TextStyle(
                color: Color(0xFFC9A961),
                fontSize: 10,
                letterSpacing: 4,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 20),
            _buildOrnament(),
            const SizedBox(height: 20),
            const Text(
              '회원 정보 수정',
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
                children: [
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: '이름',
                      labelStyle: TextStyle(fontSize: 12),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 20),

                  TextField(
                    controller: _emailController,
                    enabled: false,
                    decoration: const InputDecoration(
                      labelText: '이메일 (수정 불가)',
                      labelStyle: TextStyle(fontSize: 12, color: Colors.grey),
                      disabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Colors.grey, width: 0.5),
                      ),
                    ),
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 20),

                  TextField(
                    controller: _phoneController,
                    decoration: const InputDecoration(
                      labelText: '전화번호',
                      labelStyle: TextStyle(fontSize: 12),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 20),

                  DropdownButtonFormField<String>(
                    value: _gender.isEmpty ? null : _gender,
                    decoration: const InputDecoration(
                      labelText: '성별',
                      labelStyle: TextStyle(fontSize: 12),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'MALE', child: Text('남성', style: TextStyle(fontSize: 12))),
                      DropdownMenuItem(value: 'FEMALE', child: Text('여성', style: TextStyle(fontSize: 12))),
                    ],
                    onChanged: (value) => setState(() => _gender = value ?? ''),
                  ),
                  const SizedBox(height: 20),

                  TextField(
                    controller: TextEditingController(text: _birth),
                    decoration: const InputDecoration(
                      labelText: '생년월일 (YYYY-MM-DD)',
                      labelStyle: TextStyle(fontSize: 12),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                      ),
                    ),
                    onChanged: (value) => _birth = value,
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 40),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2A2620),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: const RoundedRectangleBorder(),
                      ),
                      child: const Text(
                        'SAVE',
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
    _phoneController.dispose();
    super.dispose();
  }
}