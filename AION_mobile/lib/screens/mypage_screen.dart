import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'profile_edit_screen.dart';
import 'start_screen.dart';
import '../services/api_service.dart';

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

  Future<void> _fetchCoupons(String email) async {
    try {
      final data = await _supabase
          .from('UserCoupons')
          .select('*, coupon:coupon_id(id, code, discount_type, discount_value, expiry_date)')
          .eq('user_email', email)
          .order('created_at', ascending: false);
      if (mounted) setState(() => _coupons = List<Map<String, dynamic>>.from(data));
    } catch (_) {}
  }

  Future<void> _fetchPoints(String email) async {
    try {
      final data = await _supabase
          .from('UserPoints')
          .select('*')
          .eq('user_email', email)
          .order('created_at', ascending: false);
      if (mounted) {
        final list = List<Map<String, dynamic>>.from(data);
        final total = list.fold<int>(0, (s, p) => s + ((p['points'] as num?)?.toInt() ?? 0));
        setState(() { _points = list; _totalPoints = total; });
      }
    } catch (_) {}
  }

  Future<void> _fetchEvents(String email) async {
    try {
      final data = await _supabase
          .from('EventParticipations')
          .select('*, event:event_id(*)')
          .eq('user_email', email)
          .order('participated_at', ascending: false);
      if (mounted) setState(() => _events = List<Map<String, dynamic>>.from(data));
    } catch (_) {}
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
    _showConfirmDialog(
      title: 'DELETE ACCOUNT',
      message: '정말 탈퇴하시겠습니까?\n탈퇴 후 30일간 재가입이 제한됩니다.',
      confirmLabel: '탈퇴',
      confirmColor: Colors.red,
      onConfirm: () async {
        final success = await ApiService.deleteAccount();
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
      },
    );
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
                  _buildStat('COUPONS', '${_coupons.length}'),
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
    if (_coupons.isEmpty) {
      return _buildEmptyState(
        icon: Icons.card_giftcard_outlined,
        message: '보유 중인 쿠폰이 없습니다.',
      );
    }
    return Column(
      children: _coupons.map((uc) {
        final coupon = uc['coupon'] as Map<String, dynamic>? ?? {};
        final isUsed = uc['used_at'] != null;
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
                      coupon['code'] as String? ?? '이벤트 당첨 쿠폰',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _dark, fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 4),
                    if (coupon['discount_type'] != null)
                      Text(
                        coupon['discount_type'] == 'PERCENTAGE'
                            ? '할인: ${coupon['discount_value']}%'
                            : '할인: ₩${coupon['discount_value']}',
                        style: const TextStyle(fontSize: 12, color: _grey),
                      ),
                    if (coupon['expiry_date'] != null)
                      Text('만료: ${coupon['expiry_date']}', style: const TextStyle(fontSize: 11, color: _grey)),
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

  Widget _buildOrdersTab() {
    if (_orders.isEmpty) {
      return _buildEmptyState(icon: Icons.shopping_bag_outlined, message: '주문 내역이 없습니다.');
    }
    return Column(
      children: _orders.map((order) {
        final orderId = order['orderId'] as int? ?? 0;
        final isExpanded = _expandedOrderId == orderId;
        return _buildCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _formatDate(order['createdAt'] as String? ?? '') + ' 결제',
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
                      order['orderStatus'] as String? ?? 'COMPLETED',
                      style: const TextStyle(fontSize: 9, color: _gold, letterSpacing: 1),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Amount', style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 1)),
                        const SizedBox(height: 2),
                        Text(
                          '₩${(order['finalAmount'] as num?)?.toStringAsFixed(0) ?? '-'}',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _dark),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton(
                    onPressed: () => setState(() => _expandedOrderId = isExpanded ? null : orderId),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: _gold),
                      shape: const RoundedRectangleBorder(),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    child: Text(
                      isExpanded ? '닫기' : '상세 보기',
                      style: const TextStyle(fontSize: 10, color: _gold),
                    ),
                  ),
                ],
              ),
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
}

extension on int {
  String toLocaleString() {
    return toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (m) => ',',
    );
  }
}