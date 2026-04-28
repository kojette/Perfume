import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'profile_edit_screen.dart';
import 'start_screen.dart';
import 'order_receipt_screen.dart';
import 'order_tracking_screen.dart';
import 'return_exchange_screen.dart';
import '../services/api_service.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class MyPageScreen extends StatefulWidget {
  const MyPageScreen({super.key});

  @override
  State<MyPageScreen> createState() => _MyPageScreenState();
}

class _MyPageScreenState extends State<MyPageScreen> {
  String _activeTab = 'overview';
  bool _loading = true;
  String? _error;

  // 사용자 정보
  Map<String, dynamic>? _userInfo;

  // 탭별 데이터
  List<Map<String, dynamic>> _coupons = [];
  List<Map<String, dynamic>> _points = [];
  int _totalPoints = 0;
  List<Map<String, dynamic>> _events = [];
  List<Map<String, dynamic>> _orders = [];
  int? _expandedOrderId;

  final _couponCodeController = TextEditingController();
  bool _couponRegisterLoading = false;

  final _supabase = Supabase.instance.client;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    _fetchUserProfile();
  }

  // ─── 데이터 로드 ────────────────────────────────────────────

  Future<void> _fetchUserProfile() async {
    try {
      setState(() { _loading = true; _error = null; });
      final profile = await ApiService.getProfile();
      if (profile != null && mounted) {
        setState(() => _userInfo = profile);
        await _fetchTabData('overview');
      } else {
        // 백엔드 실패 시 로컬 저장소 사용
        final prefs = await SharedPreferences.getInstance();
        setState(() {
          _userInfo = {
            'name': prefs.getString('userName') ?? '사용자',
            'email': prefs.getString('userEmail') ?? '',
            'phone': prefs.getString('userPhone') ?? '',
            'gender': prefs.getString('userGender') ?? '',
          };
        });
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _fetchTabData(String tab) async {
    if (_userInfo == null) return;
    final email = _userInfo!['email'] as String? ?? '';

    switch (tab) {
      case 'overview':
        await _fetchOrders();
        await _fetchPoints(email);
        await _fetchCoupons(email);
        break;
      case 'coupons':
        await _fetchCoupons(email);
        break;
      case 'points':
        await _fetchPoints(email);
        break;
      case 'events':
        await _fetchEvents(email);
        break;
      case 'orders':
        await _fetchOrders();
        break;
    }
  }

  // ─── 스프링부트 백엔드 연동 ──────────────────────────────────────

  Future<void> _fetchCoupons(String email) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken') ?? '';
      
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/coupons/my'), 
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );
      
      if (res.statusCode == 200) {
        final decoded = utf8.decode(res.bodyBytes);
        final data = jsonDecode(decoded);
        final items = (data['data'] ?? data['content'] ?? data) as List? ?? [];
        if (mounted) setState(() => _coupons = List<Map<String, dynamic>>.from(items));
      }
    } catch (e) {
      print('쿠폰 조회 오류: $e');
    }
  }

  Future<void> _fetchPoints(String email) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken') ?? '';
      
      final historyRes = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/points/history'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );

      final balanceRes = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/points/balance'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );

      if (historyRes.statusCode == 200) {
        final historyData = jsonDecode(utf8.decode(historyRes.bodyBytes));
        final items = (historyData['data'] ?? []) as List;
        if (mounted) setState(() => _points = List<Map<String, dynamic>>.from(items));
      }

      if (balanceRes.statusCode == 200) {
        final balanceData = jsonDecode(utf8.decode(balanceRes.bodyBytes));
        final bData = balanceData['data'];
        if (mounted) {
          setState(() {
            if (bData is Map) {
              _totalPoints = ((bData['balance'] ?? bData['totalPoints'] ?? bData['points'] ?? 0) as num).toInt();
            } else if (bData is num) {
              _totalPoints = bData.toInt();
            }
          });
        }
      }
    } catch (e) {
      print('포인트 조회 오류: $e');
    }
  }

  Future<void> _fetchEvents(String email) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken') ?? '';
      
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/events/participations'), 
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );
      
      if (res.statusCode == 200) {
        final decoded = utf8.decode(res.bodyBytes);
        final data = jsonDecode(decoded);
        final items = (data['data'] ?? data['content'] ?? data) as List? ?? [];
        if (mounted) setState(() => _events = List<Map<String, dynamic>>.from(items));
      }
    } catch (e) {
      print('이벤트 로드 오류: $e');
    }
  }

  Future<void> _fetchOrders() async {
    try {
      final result = await ApiService.getOrders();
      if (mounted && result != null) {
        setState(() => _orders = List<Map<String, dynamic>>.from(result));
      }
    } catch (_) {}
  }

  // ─── 탭 변경 ────────────────────────────────────────────────

  Future<void> _switchTab(String tab) async {
    setState(() => _activeTab = tab);
    await _fetchTabData(tab);
  }

  Future<void> _registerCoupon() async {
    final code = _couponCodeController.text.trim();
    if (code.isEmpty) {
      _showAlert('쿠폰 코드를 입력해주세요.');
      return;
    }
    setState(() => _couponRegisterLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken') ?? '';
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/coupons/register'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'couponCode': code}),
      );
      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if (res.statusCode == 200 && data['success'] == true) {
        _couponCodeController.clear();
        _showAlert('쿠폰이 성공적으로 등록되었습니다!');
        await _fetchCoupons(_userInfo?['email'] ?? '');
      } else {
        _showAlert(data['message'] ?? '유효하지 않은 쿠폰 코드입니다.');
      }
    } catch (e) {
      _showAlert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      if (mounted) setState(() => _couponRegisterLoading = false);
    }
  }

  // ─── 로그아웃 / 탈퇴 ─────────────────────────────────────────

  Future<void> _handleLogout() async {
    _showConfirmDialog(
      title: 'SIGN OUT',
      message: '로그아웃 하시겠습니까?',
      onConfirm: () async {
        final prefs = await SharedPreferences.getInstance();
        await prefs.clear();
        await _supabase.auth.signOut();
        if (mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const StartScreen()),
            (_) => false,
          );
        }
      },
    );
  }

  Future<void> _handleDeleteAccount() async {
    final reasonController = TextEditingController();
    bool confirmed = false;

    await showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('DELETE ACCOUNT', style: TextStyle(fontSize: 14, letterSpacing: 2)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('탈퇴 후 30일간 재가입이 제한됩니다.\n탈퇴 사유를 입력해주세요.',
                  style: TextStyle(fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: reasonController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: '탈퇴 사유를 입력해주세요 (최소 5자)',
                  hintStyle: TextStyle(fontSize: 12, color: Colors.black26),
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.all(12),
                ),
                style: const TextStyle(fontSize: 13),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('취소', style: TextStyle(color: Colors.grey)),
            ),
            TextButton(
              onPressed: () {
                if (reasonController.text.trim().length < 5) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('탈퇴 사유를 5자 이상 입력해주세요.')),
                  );
                  return;
                }
                confirmed = true;
                Navigator.pop(ctx);
              },
              child: const Text('탈퇴', style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );

    if (!confirmed) return;

    final success = await ApiService.deleteAccount(reason: reasonController.text.trim());
    if (success && mounted) {
      _showAlert('회원 탈퇴가 완료되었습니다.\n그동안 이용해 주셔서 감사합니다.', () {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const StartScreen()),
          (_) => false,
        );
      });
    } else {
      _showAlert('탈퇴 처리 중 오류가 발생했습니다.');
    }
  }

  // ─── 다이얼로그 유틸 ──────────────────────────────────────────

  void _showAlert(String message, [VoidCallback? onConfirm]) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () { Navigator.pop(context); onConfirm?.call(); },
            child: const Text('확인', style: TextStyle(color: _gold)),
          ),
        ],
      ),
    );
  }

  void _showConfirmDialog({
    required String title,
    required String message,
    String confirmLabel = '확인',
    Color confirmColor = _gold,
    required VoidCallback onConfirm,
  }) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title, style: const TextStyle(fontSize: 14, letterSpacing: 2)),
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () { Navigator.pop(context); onConfirm(); },
            child: Text(confirmLabel, style: TextStyle(color: confirmColor)),
          ),
        ],
      ),
    );
  }

  // ─── UI ─────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: _bg,
        body: Center(child: CircularProgressIndicator(color: _gold)),
      );
    }

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'MY ACCOUNT',
          style: TextStyle(color: _gold, fontSize: 10, letterSpacing: 5, fontStyle: FontStyle.italic),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _buildTabContent(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    final tabs = [
      ('overview', 'OVERVIEW'),
      ('coupons', 'COUPONS'),
      ('points', 'POINTS'),
      ('events', 'EVENTS'),
      ('orders', 'ORDERS'),
    ];
    return Container(
      color: Colors.white,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: tabs.map((t) {
            final isActive = _activeTab == t.$1;
            return GestureDetector(
              onTap: () => _switchTab(t.$1),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isActive ? _gold : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Text(
                  t.$2,
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: isActive ? _dark : _grey,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTab) {
      case 'overview':  return _buildOverviewTab();
      case 'coupons':   return _buildCouponsTab();
      case 'points':    return _buildPointsTab();
      case 'events':    return _buildEventsTab();
      case 'orders':    return _buildOrdersTab();
      default:          return _buildOverviewTab();
    }
  }

  // ── OVERVIEW ────────────────────────────────────────────────

  Widget _buildOverviewTab() {
    return Column(
      children: [
        // 프로필 카드
        _buildCard(
          child: Row(
            children: [
              // 이니셜 아바타
              Container(
                width: 60, height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: _gold.withOpacity(0.4)),
                  color: _bg,
                ),
                child: Center(
                  child: Text(
                    (_userInfo?['name'] as String? ?? 'U').substring(0, 1),
                    style: const TextStyle(fontSize: 24, color: _gold),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _userInfo?['nickname'] as String? ?? _userInfo?['name'] as String? ?? '사용자',
                      style: const TextStyle(fontSize: 20, letterSpacing: 1, color: _dark),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _userInfo?['email'] as String? ?? '',
                      style: const TextStyle(fontSize: 11, color: _grey),
                    ),
                  ],
                ),
              ),
              // 요약 통계
              Column(
                children: [
                  _buildStat('POINTS', '${_totalPoints}P'),
                  const SizedBox(height: 8),
                  _buildStat('COUPONS', '${_coupons.where((c) => c['isUsed'] != true).length}'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 연락처 카드
        _buildInfoCard(
          title: 'CONTACT DETAILS',
          rows: [
            ('Full Name', _userInfo?['name'] as String? ?? '-'),
            ('Email', _userInfo?['email'] as String? ?? '-'),
            ('Phone', _userInfo?['phone'] as String? ?? '-'),
            ('Gender', _genderText(_userInfo?['gender'] as String? ?? '')),
          ],
          action: ('EDIT PROFILE', () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileEditScreen()))
                .then((_) => _fetchUserProfile());
          }),
        ),
        const SizedBox(height: 16),

        // 최근 주문 카드
        _buildInfoCard(
          title: 'ORDER HISTORY',
          rows: _orders.isEmpty
              ? [('Status', '최근 주문 내역이 없습니다.')]
              : [
                  ('Order No.', _orders[0]['orderNumber'] as String? ?? '-'),
                  ('Date', _formatDate(_orders[0]['createdAt'] as String? ?? '')),
                  ('Amount', '₩${(_orders[0]['finalAmount'] as num?)?.toStringAsFixed(0) ?? '-'}'),
                  ('Status', _orders[0]['orderStatus'] as String? ?? '-'),
                ],
          action: ('VIEW ALL', () => _switchTab('orders')),
        ),
        const SizedBox(height: 32),

        // 로그아웃 버튼
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _handleLogout,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              side: const BorderSide(color: _gold),
              shape: const RoundedRectangleBorder(),
            ),
            child: const Text(
              'SIGN OUT',
              style: TextStyle(color: _gold, fontSize: 10, letterSpacing: 2, fontStyle: FontStyle.italic),
            ),
          ),
        ),
        const SizedBox(height: 12),

        TextButton(
          onPressed: _handleDeleteAccount,
          child: const Text(
            'DELETE ACCOUNT',
            style: TextStyle(color: Colors.red, fontSize: 10, letterSpacing: 2, decoration: TextDecoration.underline),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 8, color: _grey, letterSpacing: 1)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _dark)),
      ],
    );
  }

  // ── COUPONS ─────────────────────────────────────────────────

  Widget _buildCouponsTab() {
    return Column(
      children: [
        // 쿠폰 코드 등록 폼
        _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('REGISTER NEW COUPON',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2, color: _dark)),
              const SizedBox(height: 8),
              const Divider(color: Color(0xFFE5D9C0)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _couponCodeController,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(
                        hintText: '쿠폰 코드를 입력하세요 (예: WELCOME2026)',
                        hintStyle: TextStyle(fontSize: 12, color: Colors.black26),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5),
                        ),
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: _gold),
                        ),
                        contentPadding: EdgeInsets.symmetric(vertical: 8),
                      ),
                      style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
                      onSubmitted: (_) => _registerCoupon(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: _couponRegisterLoading ? null : _registerCoupon,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      color: _couponRegisterLoading ? Colors.grey : _dark,
                      child: _couponRegisterLoading
                          ? const SizedBox(
                              width: 14, height: 14,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('REGISTER',
                              style: TextStyle(fontSize: 10, color: Colors.white, letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text('* 대소문자를 구분하여 정확히 입력해 주세요.',
                  style: TextStyle(fontSize: 10, color: _grey, fontStyle: FontStyle.italic)),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // 보유 쿠폰 목록
        if (_coupons.isEmpty)
          _buildEmptyState(icon: Icons.card_giftcard_outlined, message: '보유 중인 쿠폰이 없습니다.')
        else
          ..._coupons.map((uc) {
        //final coupon = uc['coupon'] as Map<String, dynamic>? ?? {};
        final isUsed = uc['isUsed'] == true;
        return _buildCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.card_giftcard, color: _gold, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      //coupon['code'] as String? ?? '이벤트 당첨 쿠폰',
                      uc['couponCode'] as String? ?? '이벤트 당첨 쿠폰',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _dark, fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 4),
                    if (uc['discountType'] != null)
                      Text(
                        uc['discountType'] == 'PERCENTAGE'
                            ? '할인: ${uc['discountValue']}%'
                            : '할인: ₩${uc['discountValue']}',
                        style: const TextStyle(fontSize: 12, color: _grey),
                      ),
                    if (uc['expiryDate'] != null)
                      Text('만료: ${uc['expiryDate']}', style: const TextStyle(fontSize: 11, color: _grey)),
                    Text('발급: ${_formatDate(uc['created_at'] as String? ?? '')}',
                        style: const TextStyle(fontSize: 11, color: _grey)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isUsed ? Colors.grey[200] : _gold,
                  borderRadius: BorderRadius.circular(2),
                ),
                child: Text(
                  isUsed ? '사용완료' : '사용가능',
                  style: TextStyle(fontSize: 10, color: isUsed ? Colors.grey[600] : Colors.white),
                ),
              ),
            ],
          ),
        );
      }).toList(),
      ],
    );
  }

  // ── POINTS ──────────────────────────────────────────────────

  Widget _buildPointsTab() {
    return Column(
      children: [
        // 총 포인트 배너
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFC9A961), Color(0xFFB89851)],
            ),
            borderRadius: BorderRadius.circular(2),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('총 보유 포인트', style: TextStyle(fontSize: 12, color: Colors.white70)),
                  const SizedBox(height: 4),
                  Text(
                    '${_totalPoints.toLocaleString()}P',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              ),
              const Icon(Icons.monetization_on_outlined, size: 52, color: Colors.white24),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (_points.isEmpty)
          _buildEmptyState(icon: Icons.monetization_on_outlined, message: '포인트 내역이 없습니다.')
        else
          ..._points.map((p) {
            final pts = (p['points'] as num?)?.toInt() ?? 0;
            final isPlus = pts >= 0;
            return _buildCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p['description'] as String? ?? '포인트 적립',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _dark)),
                        const SizedBox(height: 4),
                        Text(_formatDatetime(p['created_at'] as String? ?? ''),
                            style: const TextStyle(fontSize: 11, color: _grey)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          color: Colors.blue[50],
                          child: Text(
                            p['action_type'] as String? ?? '',
                            style: const TextStyle(fontSize: 9, color: Colors.blueAccent),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${isPlus ? '+' : ''}$pts P',
                    style: TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold,
                      color: isPlus ? Colors.green[600] : Colors.red[600],
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  // ── EVENTS ──────────────────────────────────────────────────

  Widget _buildEventsTab() {
    if (_events.isEmpty) {
      return _buildEmptyState(icon: Icons.celebration_outlined, message: '참여한 이벤트가 없습니다.');
    }
    return Column(
      children: _events.map((participation) {
        final event = participation['event'] as Map<String, dynamic>? ?? {};
        final won = participation['won'] == true;
        return _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      event['title'] as String? ?? '이벤트',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _dark),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    color: won ? Colors.green[400] : Colors.grey[400],
                    child: Text(
                      won ? '🎉 당첨' : '미당첨',
                      style: const TextStyle(fontSize: 10, color: Colors.white),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '참여일: ${_formatDatetime(participation['participated_at'] as String? ?? '')}',
                style: const TextStyle(fontSize: 11, color: _grey),
              ),
              if (event['description'] != null) ...[
                const SizedBox(height: 4),
                Text(event['description'] as String, style: const TextStyle(fontSize: 12, color: _grey)),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }

  // ── ORDERS ──────────────────────────────────────────────────

   /// 배송 추적 가능한 주문 상태
  static const _trackableStatuses = {
    'PAID', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED'
  };
 
  /// 반품/교환 가능한 주문 상태
  static const _returnableStatuses = {
    'SHIPPED', 'DELIVERED', 'COMPLETED'
  };
 
  Widget _buildOrdersTab() {
    if (_orders.isEmpty) {
      return _buildEmptyState(icon: Icons.shopping_bag_outlined, message: '주문 내역이 없습니다.');
    }
    return Column(
      children: _orders.map((order) {
        final orderId = order['orderId'] as int? ?? 0;
        final isExpanded = _expandedOrderId == orderId;
        final orderStatus = (order['orderStatus'] as String?) ?? 'COMPLETED';
        final canTrack = _trackableStatuses.contains(orderStatus);
        final canReturn = _returnableStatuses.contains(orderStatus);
        final pointsUsed = (order['pointsUsed'] as num?)?.toInt() ?? 0;
        final pointsEarned = (order['pointsEarned'] as num?)?.toInt() ?? 0;
 
        return _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─ 상단: 주문일/번호 + 상태 ─
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${_formatDate(order['createdAt'] as String? ?? '')} 결제',
                          style: const TextStyle(fontSize: 11, color: _grey),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          order['orderNumber'] as String? ?? '-',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    color: _gold.withOpacity(0.15),
                    child: Text(
                      orderStatus,
                      style: const TextStyle(fontSize: 9, color: _gold, letterSpacing: 1),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
 
              // ─ 가격 + 포인트 ─
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total Amount',
                      style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 1)),
                  const SizedBox(height: 2),
                  Text(
                    '₩${(order['finalAmount'] as num?)?.toStringAsFixed(0) ?? '-'}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _dark),
                  ),
                  if (pointsUsed > 0 || pointsEarned > 0) ...[
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 8,
                      children: [
                        if (pointsUsed > 0)
                          Text('-${pointsUsed.toString()}P 사용',
                              style: TextStyle(fontSize: 10, color: Colors.red.shade400)),
                        if (pointsEarned > 0)
                          Text('+${pointsEarned.toString()}P 적립',
                              style: const TextStyle(fontSize: 10, color: _gold)),
                      ],
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
 
              // ─ 액션 버튼들 (Wrap으로 감싸 줄바꿈 허용) ─
              Wrap(
                spacing: 6,
                runSpacing: 6,
                alignment: WrapAlignment.end,
                children: [
                  // 영수증 보기
                  _orderActionButton(
                    label: '영수증',
                    color: _gold,
                    bgColor: _dark,
                    isFilled: true,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OrderReceiptScreen(orderId: orderId.toString()),
                        ),
                      );
                    },
                  ),
                  // 배송 추적 (조건부)
                  if (canTrack)
                    _orderActionButton(
                      label: '배송 추적',
                      color: _dark,
                      bgColor: _dark,
                      isFilled: false,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => OrderTrackingScreen(orderId: orderId.toString()),
                          ),
                        );
                      },
                    ),
                  // 반품/교환 (조건부)
                  if (canReturn)
                    _orderActionButton(
                      label: '반품/교환',
                      color: Colors.red.shade400,
                      bgColor: Colors.red.shade400,
                      isFilled: false,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ReturnExchangeScreen(orderId: orderId.toString()),
                          ),
                        );
                      },
                    ),
                  // 상세 보기 토글
                  _orderActionButton(
                    label: isExpanded ? '닫기' : '상세',
                    color: _gold,
                    bgColor: _gold,
                    isFilled: false,
                    onTap: () => setState(() => _expandedOrderId = isExpanded ? null : orderId),
                  ),
                ],
              ),
 
              // ─ 상세 (확장 시) ─
              if (isExpanded) ...[
                const SizedBox(height: 16),
                const Divider(color: Color(0xFFE5D9C0)),
                const SizedBox(height: 12),
                const Text('SHIPPING DETAILS',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 2)),
                const SizedBox(height: 12),
                _buildDetailRow('Receiver', order['receiverName'] as String? ?? '-'),
                _buildDetailRow('Phone', order['receiverPhone'] as String? ?? '-'),
                _buildDetailRow(
                  'Address',
                  '[${order['shippingZipcode'] ?? ''}] ${order['shippingAddress'] ?? '-'}',
                ),
                _buildDetailRow('Payment', order['paymentMethod'] as String? ?? 'CARD'),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }
 
  /// 주문 액션 버튼 (가로 공간 절약을 위해 작게)
  Widget _orderActionButton({
    required String label,
    required Color color,
    required Color bgColor,
    required bool isFilled,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: isFilled ? bgColor : Colors.transparent,
          border: Border.all(color: isFilled ? bgColor : color),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: isFilled ? Colors.white : color,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: const TextStyle(fontSize: 10, color: _grey, letterSpacing: 1)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 12, color: _dark, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }

  // ─── 공통 위젯 ───────────────────────────────────────────────

  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.15)),
      ),
      child: child,
    );
  }

  Widget _buildInfoCard({
    required String title,
    required List<(String, String)> rows,
    (String, VoidCallback)? action,
  }) {
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2, color: _dark)),
              if (action != null)
                GestureDetector(
                  onTap: action.$2,
                  child: Text(action.$1,
                      style: const TextStyle(fontSize: 9, color: _gold, decoration: TextDecoration.underline, fontStyle: FontStyle.italic)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(color: Color(0xFFE5D9C0)),
          ...rows.map((row) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              children: [
                SizedBox(
                  width: 90,
                  child: Text(row.$1, style: const TextStyle(fontSize: 11, color: _grey)),
                ),
                Expanded(
                  child: Text(row.$2, style: const TextStyle(fontSize: 12, color: _dark, fontWeight: FontWeight.w500)),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildEmptyState({required IconData icon, required String message}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Icon(icon, size: 48, color: _gold.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(fontSize: 13, color: _grey, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  // ─── 유틸 ────────────────────────────────────────────────────

  String _genderText(String? g) {
    if (g == 'MALE') return '남성';
    if (g == 'FEMALE') return '여성';
    return '미설정';
  }

  String _formatDate(String iso) {
    if (iso.isEmpty) return '-';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')}';
    } catch (_) { return iso; }
  }

  String _formatDatetime(String iso) {
    if (iso.isEmpty) return '-';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${_formatDate(iso)} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) { return iso; }
  }

  @override
  void dispose() {
    _couponCodeController.dispose();
    super.dispose();
  }
}

extension on int {
  String toLocaleString() {
    return toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (m) => ',',
    );
  }
}