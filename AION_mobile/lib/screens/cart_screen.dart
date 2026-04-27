import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'order_receipt_screen.dart';
import 'profile_edit_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  // ── 데이터 ────────────────────────────────────────────────
  List<Map<String, dynamic>> cartItems = [];
  bool isLoading = true;

  // ── 선택 결제 ─────────────────────────────────────────────
  Set<int> _selectedIds = {};

  // ── 배송지 정보 (프로필에서 로드) ──────────────────────────
  Map<String, String> _shippingInfo = {
    'name': '',
    'phone': '',
    'zipcode': '',
    'address': '',
    'addressDetail': '',
  };
  bool _shippingLoaded = false;

  // ── 쿠폰 ──────────────────────────────────────────────────
  List<Map<String, dynamic>> _availableCoupons = [];
  Map<String, dynamic>? _selectedCoupon;
  int _couponDiscount = 0;

  // ── 포인트 ────────────────────────────────────────────────
  int _myTotalPoints = 0;
  int _pointsToUse = 0;
  final _pointsCtrl = TextEditingController();

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    _initData();
  }

  @override
  void dispose() {
    _pointsCtrl.dispose();
    super.dispose();
  }

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken') ?? '';
  }

  // ── 초기 데이터 병렬 로드 ──────────────────────────────────
  Future<void> _initData() async {
    setState(() => isLoading = true);
    final token = await _getToken();
    if (token.isEmpty) {
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
      return;
    }
    await Future.wait([
      _fetchCartItems(token),
      _fetchShippingInfo(token),
      _fetchAvailableCoupons(token),
      _fetchMyPoints(token),
    ]);
    if (mounted) setState(() => isLoading = false);
  }

  Future<void> _fetchCartItems(String token) async {
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/cart'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        final items = (data['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        if (mounted) {
          setState(() {
            cartItems = items;
            // 기본적으로 모든 상품 선택
            _selectedIds = items
                .map<int>((i) => (i['cartId'] as num?)?.toInt() ?? 0)
                .where((id) => id > 0)
                .toSet();
          });
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('장바구니 불러오기 실패: $e')),
      );
    }
  }

  Future<void> _fetchShippingInfo(String token) async {
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/members/profile'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );
      if (res.statusCode == 200) {
        final result = jsonDecode(utf8.decode(res.bodyBytes));
        if (result['success'] == true && result['data'] != null) {
          final d = result['data'] as Map<String, dynamic>;
          if (mounted) {
            setState(() {
              _shippingInfo = {
                'name': (d['name'] ?? '').toString(),
                'phone': (d['phone'] ?? '').toString(),
                'zipcode': (d['zipcode'] ?? '').toString(),
                'address': (d['address'] ?? '').toString(),
                'addressDetail': (d['addressDetail'] ?? '').toString(),
              };
              _shippingLoaded = true;
            });
          }
        }
      }
    } catch (e) {
      debugPrint('배송지 조회 에러: $e');
    }
  }

  Future<void> _fetchMyPoints(String token) async {
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/points/balance'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final result = jsonDecode(utf8.decode(res.bodyBytes));
        final data = result['data'] as Map<String, dynamic>?;
        final pts = (data?['totalPoints'] ?? data?['balance'] ?? data?['points'] ?? 0) as num;
        if (mounted) setState(() => _myTotalPoints = pts.toInt());
      }
    } catch (e) {
      debugPrint('포인트 조회 에러: $e');
    }
  }

  Future<void> _fetchAvailableCoupons(String token) async {
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/coupons/my'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final result = jsonDecode(utf8.decode(res.bodyBytes));
        final list = (result['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        if (mounted) {
          setState(() {
            _availableCoupons = list.where((c) => c['isUsed'] != true).toList();
          });
        }
      }
    } catch (e) {
      debugPrint('쿠폰 로드 에러: $e');
    }
  }

  // ── 합계 계산 ──────────────────────────────────────────────
  int get _selectedTotal {
    return cartItems
        .where((i) => _selectedIds.contains((i['cartId'] as num?)?.toInt() ?? -1))
        .fold<int>(0, (sum, item) {
      final price = (item['price'] as num?)?.toInt() ?? 0;
      final qty = (item['quantity'] as num?)?.toInt() ?? 1;
      return sum + price * qty;
    });
  }

  int get _finalAmount =>
      (_selectedTotal - _couponDiscount - _pointsToUse).clamp(0, 1 << 31).toInt();

  bool get _isAllSelected =>
      cartItems.isNotEmpty && _selectedIds.length == cartItems.length;

  // ── 선택 토글 ──────────────────────────────────────────────
  void _toggleItem(int cartId) {
    setState(() {
      if (_selectedIds.contains(cartId)) {
        _selectedIds.remove(cartId);
      } else {
        _selectedIds.add(cartId);
      }
      _recalcCouponAndPoints();
    });
  }

  void _toggleAll() {
    setState(() {
      if (_isAllSelected) {
        _selectedIds.clear();
      } else {
        _selectedIds = cartItems
            .map<int>((i) => (i['cartId'] as num?)?.toInt() ?? 0)
            .where((id) => id > 0)
            .toSet();
      }
      _recalcCouponAndPoints();
    });
  }

  // 선택/수량 변경 시 쿠폰/포인트 재계산
  void _recalcCouponAndPoints() {
    if (_selectedCoupon != null) {
      final c = _selectedCoupon!;
      final type = (c['discountType'] ?? '').toString();
      final val = (c['discountValue'] as num?)?.toInt() ?? 0;
      if (type == 'PERCENTAGE' || type == 'PERCENT') {
        _couponDiscount = (_selectedTotal * val / 100).floor();
      } else {
        _couponDiscount = val;
      }
    } else {
      _couponDiscount = 0;
    }
    final maxUsable = _myTotalPoints
        .clamp(0, (_selectedTotal - _couponDiscount).clamp(0, 1 << 31))
        .toInt();
    if (_pointsToUse > maxUsable) {
      _pointsToUse = maxUsable;
      _pointsCtrl.text = maxUsable.toString();
    }
  }

  // ── 쿠폰 선택 ──────────────────────────────────────────────
  void _onCouponChanged(int? userCouponId) {
    setState(() {
      if (userCouponId == null) {
        _selectedCoupon = null;
        _couponDiscount = 0;
      } else {
        final coupon = _availableCoupons
            .firstWhere((c) => c['userCouponId'] == userCouponId,
                orElse: () => <String, dynamic>{});
        if (coupon.isEmpty) {
          _selectedCoupon = null;
          _couponDiscount = 0;
        } else {
          _selectedCoupon = coupon;
          final type = (coupon['discountType'] ?? '').toString();
          final val = (coupon['discountValue'] as num?)?.toInt() ?? 0;
          if (type == 'PERCENTAGE' || type == 'PERCENT') {
            _couponDiscount = (_selectedTotal * val / 100).floor();
          } else {
            _couponDiscount = val;
          }
        }
      }
      // 쿠폰 변경 후 포인트 재조정
      final maxUsable = _myTotalPoints
          .clamp(0, (_selectedTotal - _couponDiscount).clamp(0, 1 << 31))
          .toInt();
      if (_pointsToUse > maxUsable) {
        _pointsToUse = maxUsable;
        _pointsCtrl.text = maxUsable.toString();
      }
    });
  }

  // ── 포인트 입력 ────────────────────────────────────────────
  void _onPointsChanged(String raw) {
    final cleaned = raw.replaceAll(RegExp(r'[^0-9]'), '');
    final parsed = int.tryParse(cleaned) ?? 0;
    final maxUsable = _myTotalPoints
        .clamp(0, (_selectedTotal - _couponDiscount).clamp(0, 1 << 31))
        .toInt();
    final actual = parsed > maxUsable ? maxUsable : parsed;
    setState(() => _pointsToUse = actual);
    if (cleaned != raw) {
      _pointsCtrl.value = TextEditingValue(
        text: cleaned,
        selection: TextSelection.collapsed(offset: cleaned.length),
      );
    }
  }

  void _useAllPoints() {
    final maxUsable = _myTotalPoints
        .clamp(0, (_selectedTotal - _couponDiscount).clamp(0, 1 << 31))
        .toInt();
    setState(() {
      _pointsToUse = maxUsable;
      _pointsCtrl.text = maxUsable.toString();
    });
  }

  void _clearPoints() {
    setState(() {
      _pointsToUse = 0;
      _pointsCtrl.clear();
    });
  }

  // ── 수량 변경 / 삭제 ───────────────────────────────────────
  Future<void> _updateQuantity(int cartId, int currentQty, int change) async {
    final newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      final token = await _getToken();
      final res = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/$cartId'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'quantity': newQty}),
      );

      if (res.statusCode == 200) {
        setState(() {
          final idx = cartItems.indexWhere((i) => i['cartId'] == cartId);
          if (idx != -1) {
            cartItems[idx]['quantity'] = newQty;
            _recalcCouponAndPoints();
          }
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('수량 변경 실패: $e')),
      );
    }
  }

  Future<void> _removeItem(int cartId) async {
    try {
      final token = await _getToken();
      final res = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/$cartId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200) {
        setState(() {
          cartItems.removeWhere((i) => i['cartId'] == cartId);
          _selectedIds.remove(cartId);
          _recalcCouponAndPoints();
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('삭제 실패: $e')),
      );
    }
  }

  // ── 결제 ───────────────────────────────────────────────────
  Future<void> _handleCheckout() async {
    if (_selectedIds.isEmpty) {
      _showSnack('구매할 상품을 선택해주세요.');
      return;
    }

    // 배송지 미등록 시 프로필로 이동
    if ((_shippingInfo['address'] ?? '').isEmpty) {
      final goToProfile = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('배송지 등록 필요'),
          content: const Text('등록된 배송지가 없습니다.\n프로필에서 배송지를 먼저 등록해주세요.\n\n프로필 페이지로 이동하시겠습니까?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('취소'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('확인', style: TextStyle(color: _gold)),
            ),
          ],
        ),
      );
      if (goToProfile == true && mounted) {
        await Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ProfileEditScreen()),
        );
        // 프로필 갱신 후 재로드
        final token = await _getToken();
        await _fetchShippingInfo(token);
      }
      return;
    }

    // 결제 확인 다이얼로그
    final fullAddress =
        '(${_shippingInfo['zipcode']}) ${_shippingInfo['address']}'
        '${(_shippingInfo['addressDetail'] ?? '').isNotEmpty ? ' ${_shippingInfo['addressDetail']}' : ''}';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('결제 확인', style: TextStyle(fontSize: 14, letterSpacing: 2)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('선택 상품: ${_selectedIds.length}개', style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 4),
            Text('결제 금액: ₩${_numFmt(_finalAmount)}',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _dark)),
            if (_couponDiscount > 0) ...[
              const SizedBox(height: 4),
              Text('쿠폰 할인: -₩${_numFmt(_couponDiscount)}',
                  style: TextStyle(fontSize: 11, color: Colors.red.shade400)),
            ],
            if (_pointsToUse > 0) ...[
              const SizedBox(height: 4),
              Text('포인트 사용: -${_numFmt(_pointsToUse)}P',
                  style: TextStyle(fontSize: 11, color: Colors.red.shade400)),
            ],
            const SizedBox(height: 12),
            Text('배송지: $fullAddress',
                style: const TextStyle(fontSize: 11, color: _grey)),
            const SizedBox(height: 12),
            const Text('결제를 진행하시겠습니까?', style: TextStyle(fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('취소')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('결제', style: TextStyle(color: _gold, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      final token = await _getToken();
      final addrCombined = (_shippingInfo['addressDetail'] ?? '').isNotEmpty
          ? '${_shippingInfo['address']} ${_shippingInfo['addressDetail']}'
          : (_shippingInfo['address'] ?? '');

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/orders/checkout'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'cartItemIds': _selectedIds.toList(),
          'userCouponId': _selectedCoupon?['userCouponId'],
          'pointsToUse': _pointsToUse,
          'paymentMethod': 'CARD',
          'receiverName': _shippingInfo['name'] ?? '',
          'receiverPhone': _shippingInfo['phone'] ?? '',
          'shippingZipcode': _shippingInfo['zipcode'] ?? '',
          'shippingAddress': addrCombined,
        }),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        final newOrderId = json['data']?['orderId'];
        if (mounted && newOrderId != null) {
          // 영수증 페이지로 이동 (장바구니 화면은 스택에서 제거)
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => OrderReceiptScreen(orderId: newOrderId.toString()),
            ),
          );
        } else if (mounted) {
          _showSnack('주문이 완료되었습니다');
          setState(() {
            cartItems.removeWhere((i) => _selectedIds.contains(i['cartId']));
            _selectedIds.clear();
          });
        }
      } else {
        String msg = '주문 처리 중 문제가 발생하였습니다.';
        try {
          final err = jsonDecode(utf8.decode(res.bodyBytes));
          msg = (err['message'] ?? msg).toString();
        } catch (_) {}
        _showSnack(msg);
      }
    } catch (e) {
      if (mounted) _showSnack('주문 처리 중 오류: $e');
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  // ─────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F3),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text('CART',
            style: TextStyle(letterSpacing: 4, color: _dark, fontSize: 14, fontWeight: FontWeight.w400)),
        iconTheme: const IconThemeData(color: _dark),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : cartItems.isEmpty
              ? _buildEmptyCart()
              : _buildCartList(),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_bag_outlined, size: 80, color: _gold),
          const SizedBox(height: 16),
          const Text('장바구니가 비어있습니다.', style: TextStyle(fontSize: 16, color: _grey)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: _dark,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: const RoundedRectangleBorder(),
            ),
            child: const Text('SHOP NOW', style: TextStyle(letterSpacing: 2, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildCartList() {
    return Column(
      children: [
        // 전체선택 헤더
        _buildSelectAllHeader(),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ...cartItems.map(_buildCartItem),
              const SizedBox(height: 12),
              _buildShippingInfoCard(),
              const SizedBox(height: 12),
              if (_availableCoupons.isNotEmpty) _buildCouponSection(),
              if (_availableCoupons.isNotEmpty) const SizedBox(height: 12),
              if (_myTotalPoints > 0) _buildPointsSection(),
            ],
          ),
        ),
        _buildCheckoutSection(),
      ],
    );
  }

  Widget _buildSelectAllHeader() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          GestureDetector(
            onTap: _toggleAll,
            child: Row(
              children: [
                Icon(
                  _isAllSelected ? Icons.check_box : Icons.check_box_outline_blank,
                  size: 20, color: _gold,
                ),
                const SizedBox(width: 8),
                Text(
                  '전체선택 (${_selectedIds.length}/${cartItems.length})',
                  style: const TextStyle(fontSize: 12, color: _dark, letterSpacing: 1),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(Map<String, dynamic> item) {
    final price = (item['price'] as num?)?.toInt() ?? 0;
    final qty = (item['quantity'] as num?)?.toInt() ?? 1;
    final cartId = (item['cartId'] as num?)?.toInt() ?? 0;
    final isSelected = _selectedIds.contains(cartId);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 체크박스
          GestureDetector(
            onTap: () => _toggleItem(cartId),
            child: Padding(
              padding: const EdgeInsets.only(top: 4, right: 8),
              child: Icon(
                isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                size: 20, color: _gold,
              ),
            ),
          ),
          Container(
            width: 64, height: 80,
            color: Colors.grey[100],
            child: item['imageUrl'] != null
                ? Image.network(item['imageUrl'], fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.local_florist, color: _gold))
                : const Icon(Icons.local_florist, color: _gold),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['name'] ?? '',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _dark)),
                const SizedBox(height: 4),
                const Text('50ML / EAU DE PARFUM',
                    style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 1.5)),
                const SizedBox(height: 10),
                Text('₩${_numFmt(price)}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _dark)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _qtyBtn(Icons.remove, () => _updateQuantity(cartId, qty, -1)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('$qty', style: const TextStyle(fontSize: 14)),
                    ),
                    _qtyBtn(Icons.add, () => _updateQuantity(cartId, qty, 1)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => _removeItem(cartId),
                      child: const Icon(Icons.close, size: 18, color: _grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text('₩${_numFmt(price * qty)}',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark)),
        ],
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 24, height: 24,
        decoration: BoxDecoration(border: Border.all(color: _gold)),
        child: Icon(icon, size: 16, color: _gold),
      ),
    );
  }

  // ── 배송지 카드 ────────────────────────────────────────────
  Widget _buildShippingInfoCard() {
    final hasAddress = (_shippingInfo['address'] ?? '').isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('SHIPPING INFO',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 2)),
              GestureDetector(
                onTap: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ProfileEditScreen()),
                  );
                  final token = await _getToken();
                  await _fetchShippingInfo(token);
                },
                child: const Text('변경 →',
                    style: TextStyle(fontSize: 10, color: _gold, letterSpacing: 1)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (!_shippingLoaded)
            const Text('배송지 정보를 불러오는 중...',
                style: TextStyle(fontSize: 11, color: _grey))
          else if (!hasAddress)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '등록된 배송지가 없습니다.\n프로필에서 배송지를 등록해주세요.',
                  style: TextStyle(fontSize: 11, color: Colors.red.shade400),
                ),
              ],
            )
          else ...[
            Text('${_shippingInfo['name']} | ${_shippingInfo['phone']}',
                style: const TextStyle(fontSize: 12, color: _dark, fontWeight: FontWeight.w500)),
            const SizedBox(height: 4),
            Text(
              '(${_shippingInfo['zipcode']}) ${_shippingInfo['address']}'
              '${(_shippingInfo['addressDetail'] ?? '').isNotEmpty ? ' ${_shippingInfo['addressDetail']}' : ''}',
              style: const TextStyle(fontSize: 11, color: _grey),
            ),
          ],
        ],
      ),
    );
  }

  // ── 쿠폰 섹션 ──────────────────────────────────────────────
  Widget _buildCouponSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('COUPON',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 2)),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: _gold.withOpacity(0.3)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int?>(
                isExpanded: true,
                value: _selectedCoupon?['userCouponId'] as int?,
                hint: const Text('쿠폰 선택', style: TextStyle(fontSize: 12, color: _grey)),
                items: <DropdownMenuItem<int?>>[
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text('쿠폰 사용 안 함', style: TextStyle(fontSize: 12)),
                  ),
                  ..._availableCoupons.map((c) {
                    final id = c['userCouponId'] as int?;
                    final name = (c['couponName'] ?? c['name'] ?? '쿠폰').toString();
                    final type = (c['discountType'] ?? '').toString();
                    final val = (c['discountValue'] as num?)?.toInt() ?? 0;
                    final desc = (type == 'PERCENTAGE' || type == 'PERCENT')
                        ? '$val%'
                        : '₩${_numFmt(val)}';
                    return DropdownMenuItem<int?>(
                      value: id,
                      child: Text('$name ($desc 할인)',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis),
                    );
                  }),
                ],
                onChanged: _onCouponChanged,
              ),
            ),
          ),
          if (_couponDiscount > 0) ...[
            const SizedBox(height: 8),
            Text('쿠폰 할인: -₩${_numFmt(_couponDiscount)}',
                style: TextStyle(fontSize: 11, color: Colors.red.shade400)),
          ],
        ],
      ),
    );
  }

  // ── 포인트 섹션 ────────────────────────────────────────────
  Widget _buildPointsSection() {
    final maxUsable = _myTotalPoints
        .clamp(0, (_selectedTotal - _couponDiscount).clamp(0, 1 << 31))
        .toInt();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('POINTS',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 2)),
              Text('보유: ${_numFmt(_myTotalPoints)} P',
                  style: const TextStyle(fontSize: 11, color: _gold, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _pointsCtrl,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onChanged: _onPointsChanged,
                  decoration: InputDecoration(
                    hintText: '사용할 포인트',
                    hintStyle: const TextStyle(fontSize: 12, color: _grey),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: _gold.withOpacity(0.3)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: _gold.withOpacity(0.3)),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: _gold),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _useAllPoints,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(border: Border.all(color: _gold)),
                  child: const Text('전액',
                      style: TextStyle(fontSize: 11, color: _gold, letterSpacing: 1)),
                ),
              ),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: _clearPoints,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(border: Border.all(color: _grey.withOpacity(0.5))),
                  child: const Text('초기화',
                      style: TextStyle(fontSize: 11, color: _grey, letterSpacing: 1)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text('사용 가능 최대: ${_numFmt(maxUsable)} P',
              style: const TextStyle(fontSize: 10, color: _grey)),
          if (_pointsToUse > 0) ...[
            const SizedBox(height: 4),
            Text('포인트 사용: -${_numFmt(_pointsToUse)} P',
                style: TextStyle(fontSize: 11, color: Colors.red.shade400)),
          ],
        ],
      ),
    );
  }

  // ── 결제 영역 ──────────────────────────────────────────────
  Widget _buildCheckoutSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: _gold.withOpacity(0.3))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Subtotal (${_selectedIds.length}개)',
                  style: const TextStyle(fontSize: 11, color: _grey)),
              Text('₩${_numFmt(_selectedTotal)}',
                  style: const TextStyle(fontSize: 12, color: _dark)),
            ],
          ),
          if (_couponDiscount > 0) ...[
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Coupon', style: TextStyle(fontSize: 11, color: _grey)),
                Text('-₩${_numFmt(_couponDiscount)}',
                    style: TextStyle(fontSize: 12, color: Colors.red.shade400)),
              ],
            ),
          ],
          if (_pointsToUse > 0) ...[
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Points', style: TextStyle(fontSize: 11, color: _grey)),
                Text('-${_numFmt(_pointsToUse)} P',
                    style: TextStyle(fontSize: 12, color: Colors.red.shade400)),
              ],
            ),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(height: 1, color: Color(0xFFEEEEEE)),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total',
                  style: TextStyle(fontSize: 16, fontStyle: FontStyle.italic, color: _dark)),
              Text('₩${_numFmt(_finalAmount)}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _dark)),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedIds.isEmpty ? null : _handleCheckout,
              style: ElevatedButton.styleFrom(
                backgroundColor: _dark,
                disabledBackgroundColor: _grey.withOpacity(0.3),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: const RoundedRectangleBorder(),
              ),
              child: const Text('CHECKOUT', style: TextStyle(letterSpacing: 3, fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }

  String _numFmt(int v) {
    return v.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
