import 'package:flutter/material.dart';
import 'package:aion_perfume_app/screens/profile_edit_screen.dart';
import 'package:aion_perfume_app/screens/start_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MyPageScreen extends StatefulWidget {
  const MyPageScreen({super.key});

  @override
  State<MyPageScreen> createState() => _MyPageScreenState();
}

class _MyPageScreenState extends State<MyPageScreen> {
  String _userName = '고객';
  String _userEmail = '정보 없음';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = prefs.getString('userName') ?? '고객';
      _userEmail = prefs.getString('userEmail') ?? '정보 없음';
    });
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isLoggedIn', false);
    
    _showAlert('로그아웃 되었습니다.');
    
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const StartScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _handleDeleteAccount() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('회원 탈퇴', style: TextStyle(fontSize: 16)),
        content: const Text('정말 탈퇴하시겠습니까?', style: TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.clear();
              
              if (mounted) {
                Navigator.pop(context); // 다이얼로그 닫기
                _showAlertAndNavigate('회원 탈퇴가 완료되었습니다.');
              }
            },
            child: const Text('탈퇴', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
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

  void _showAlertAndNavigate(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const StartScreen()),
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
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F3),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'MY ACCOUNT',
          style: TextStyle(
            color: Color(0xFFC9A961),
            fontSize: 10,
            letterSpacing: 5,
            fontStyle: FontStyle.italic,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            _buildOrnament(),
            const SizedBox(height: 20),
            const Text(
              'My Account',
              style: TextStyle(
                fontSize: 30,
                letterSpacing: 3,
                color: Color(0xFF2A2620),
              ),
            ),
            const SizedBox(height: 40),

            // 메뉴 버튼들
            _buildMenuButton('OVERVIEW', isActive: true),
            _buildMenuButton('ACCOUNT PROFILE'),
            _buildMenuButton('ORDER HISTORY'),
            _buildMenuButton('PAST PURCHASES'),
            
            const SizedBox(height: 40),

            // 로그아웃 버튼
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _handleLogout,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: Color(0xFFC9A961)),
                  shape: const RoundedRectangleBorder(),
                ),
                child: const Text(
                  'SIGN OUT',
                  style: TextStyle(
                    color: Color(0xFFC9A961),
                    fontSize: 10,
                    letterSpacing: 2,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // 탈퇴 버튼
            TextButton(
              onPressed: _handleDeleteAccount,
              child: const Text(
                'DELETE ACCOUNT',
                style: TextStyle(
                  color: Colors.red,
                  fontSize: 10,
                  letterSpacing: 2,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),

            const SizedBox(height: 40),

            // 내 정보 섹션
            _buildInfoCard(
              title: 'PROFILE',
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Name: $_userName',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF555)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Email: $_userEmail',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF555)),
                  ),
                ],
              ),
              onViewAll: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ProfileEditScreen()),
                );
              },
            ),

            const SizedBox(height: 20),

            _buildInfoCard(
              title: 'ORDERS',
              content: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '최근 주문 내역이 없습니다.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF8B8278)),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '쇼핑 계속하기',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF2A2620),
                      fontWeight: FontWeight.w500,
                      decoration: TextDecoration.underline,
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

  Widget _buildMenuButton(String text, {bool isActive = false}) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(0xFFC9A961), width: 0.1),
        ),
      ),
      child: ListTile(
        title: Text(
          text,
          style: TextStyle(
            fontSize: 11,
            letterSpacing: 2,
            color: isActive ? const Color(0xFF2A2620) : const Color(0xFF8B8278),
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        onTap: () {},
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required Widget content,
    VoidCallback? onViewAll,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                  color: Color(0xFF2A2620),
                ),
              ),
              if (onViewAll != null)
                GestureDetector(
                  onTap: onViewAll,
                  child: const Text(
                    'VIEW ALL',
                    style: TextStyle(
                      fontSize: 9,
                      color: Color(0xFFC9A961),
                      decoration: TextDecoration.underline,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
            ],
          ),
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            height: 1,
            color: const Color(0xFFC9A961).withOpacity(0.2),
          ),
          content,
        ],
      ),
    );
  }
}
