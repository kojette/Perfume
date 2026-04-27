import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class OrderTrackingScreen extends StatefulWidget {
  final String orderId;
  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF1A1A1A);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  Map<String, dynamic>? _order;
  bool _loading = true;

  /// 배송 단계 정의 (프론트와 동일한 순서)
  static const List<_TrackingStep> _steps = [
    _TrackingStep(code: 'PAID', label: '결제완료', icon: Icons.payment),
    _TrackingStep(code: 'CONFIRMED', label: '주문확인', icon: Icons.check_circle_outline),
    _TrackingStep(code: 'PREPARING', label: '상품준비중', icon: Icons.inventory_2_outlined),
    _TrackingStep(code: 'SHIPPED', label: '배송중', icon: Icons.local_shipping_outlined),
    _TrackingStep(code: 'DELIVERED', label: '배송완료', icon: Icons.home_outlined),
    _TrackingStep(code: 'COMPLETED', label: '구매확정', icon: Icons.verified_outlined),
  ];

  @override
  void initState() {
    super.initState();
    _fetchOrder();
  }

  Future<void> _fetchOrder() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    if (token.isEmpty) {
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
      return;
    }
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/orders/${widget.orderId}'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() => _order = json['data'] as Map<String, dynamic>?);
      }
    } catch (e) {
      debugPrint('주문 조회 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int _currentStepIndex(String? status) {
    if (status == null) return 0;
    final idx = _steps.indexWhere((s) => s.code == status);
    return idx < 0 ? 0 : idx;
  }

  String _formatDate(String iso) {
    if (iso.isEmpty) return '-';
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.year}.${d.month.toString().padLeft(2, '0')}.${d.day.toString().padLeft(2, '0')} '
          '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: _bg,
        body: Center(child: CircularProgressIndicator(color: _gold)),
      );
    }
    if (_order == null) {
      return Scaffold(
        backgroundColor: _bg,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: const IconThemeData(color: _dark),
        ),
        body: const Center(child: Text('주문 정보를 찾을 수 없습니다')),
      );
    }

    final o = _order!;
    final status = o['orderStatus'] as String? ?? 'PAID';
    final currentIdx = _currentStepIndex(status);
    final trackingNumber = o['trackingNumber'] as String? ?? '';
    final courierName = o['courierName'] as String? ?? '';

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: _dark),
        title: const Text('ORDER TRACKING',
            style: TextStyle(color: _dark, fontSize: 11, letterSpacing: 4, fontWeight: FontWeight.w400)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─ 헤더 ─
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: _gold.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Order Number',
                      style: TextStyle(fontSize: 9, letterSpacing: 3, color: _grey, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  Text(
                    o['orderNumber']?.toString() ?? o['orderId']?.toString() ?? '-',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold, color: _dark, fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('주문일', style: TextStyle(fontSize: 11, color: _grey)),
                      Text(_formatDate(o['createdAt'] as String? ?? ''),
                          style: const TextStyle(fontSize: 11, color: _dark)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ─ 배송 진행 단계 ─
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: _gold.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Delivery Status',
                      style: TextStyle(fontSize: 10, letterSpacing: 3, color: _gold, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 20),
                  ..._steps.asMap().entries.map((entry) {
                    final i = entry.key;
                    final step = entry.value;
                    final isPast = i < currentIdx;
                    final isCurrent = i == currentIdx;
                    final isFuture = i > currentIdx;
                    final isLast = i == _steps.length - 1;

                    return _buildStepItem(
                      icon: step.icon,
                      label: step.label,
                      code: step.code,
                      isPast: isPast,
                      isCurrent: isCurrent,
                      isFuture: isFuture,
                      isLast: isLast,
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ─ 송장 정보 ─
            if (trackingNumber.isNotEmpty || courierName.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: _gold.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tracking Info',
                        style: TextStyle(fontSize: 10, letterSpacing: 3, color: _gold, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    if (courierName.isNotEmpty) _infoRow('택배사', courierName),
                    if (trackingNumber.isNotEmpty)
                      _infoRow('송장번호', trackingNumber, isMono: true),
                  ],
                ),
              ),
            if (trackingNumber.isNotEmpty || courierName.isNotEmpty)
              const SizedBox(height: 20),

            // ─ 배송지 정보 ─
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: _gold.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Shipping Info',
                      style: TextStyle(fontSize: 10, letterSpacing: 3, color: _gold, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  _infoRow('수령인', (o['receiverName'] ?? '-').toString()),
                  _infoRow('연락처', (o['receiverPhone'] ?? '-').toString()),
                  _infoRow('주소',
                      '(${o['shippingZipcode'] ?? ''}) ${o['shippingAddress'] ?? '-'}'),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // ─ 닫기 버튼 ─
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _dark,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: const RoundedRectangleBorder(),
                ),
                child: const Text('CLOSE',
                    style: TextStyle(fontSize: 10, letterSpacing: 4, fontWeight: FontWeight.w400)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepItem({
    required IconData icon,
    required String label,
    required String code,
    required bool isPast,
    required bool isCurrent,
    required bool isFuture,
    required bool isLast,
  }) {
    final color = isPast || isCurrent ? _gold : _grey.withOpacity(0.3);
    final textColor = isCurrent ? _dark : (isPast ? _gold : _grey);
    final fontWeight = isCurrent ? FontWeight.bold : FontWeight.w400;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 아이콘 + 세로선
          Column(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: isPast || isCurrent ? _gold : Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 2),
                ),
                child: Icon(
                  isPast ? Icons.check : icon,
                  color: isPast || isCurrent ? Colors.white : color,
                  size: 18,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: isPast ? _gold : _grey.withOpacity(0.2),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          // 텍스트
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(top: 6, bottom: isLast ? 0 : 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(fontSize: 14, color: textColor, fontWeight: fontWeight)),
                  const SizedBox(height: 2),
                  Text(code,
                      style: TextStyle(fontSize: 9, color: _grey, letterSpacing: 2)),
                  if (isCurrent) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      color: _gold.withOpacity(0.15),
                      child: const Text('현재 단계',
                          style: TextStyle(fontSize: 9, color: _gold, letterSpacing: 1)),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool isMono = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(label, style: const TextStyle(fontSize: 11, color: _grey)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                color: _dark,
                fontWeight: FontWeight.w500,
                fontFamily: isMono ? 'monospace' : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrackingStep {
  final String code;
  final String label;
  final IconData icon;
  const _TrackingStep({required this.code, required this.label, required this.icon});
}
