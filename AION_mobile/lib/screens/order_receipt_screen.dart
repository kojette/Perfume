import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF1A1A1A);
const _bg = Color(0xFFFAF8F3);
const _grey = Color(0xFF8B8278);

class OrderReceiptScreen extends StatefulWidget {
  final String orderId;
  const OrderReceiptScreen({super.key, required this.orderId});

  @override
  State<OrderReceiptScreen> createState() => _OrderReceiptScreenState();
}

class _OrderReceiptScreenState extends State<OrderReceiptScreen> {
  Map<String, dynamic>? _order;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrder();
  }

  Future<void> _fetchOrder() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    if (token.isEmpty) { if (mounted) Navigator.pushReplacementNamed(context, '/login'); return; }
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/orders/${widget.orderId}'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() => _order = json['data'] as Map<String, dynamic>?);
      }
    } catch (e) { debugPrint('주문 조회 오류: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  String _numFmt(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(backgroundColor: _bg, body: Center(child: CircularProgressIndicator(color: _gold)));
    }
    if (_order == null) {
      return Scaffold(
        backgroundColor: _bg,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0,
            iconTheme: const IconThemeData(color: _dark)),
        body: const Center(child: Text('주문 정보를 찾을 수 없습니다')),
      );
    }

    final o = _order!;
    final items = o['orderItems'] as List? ?? [];
    final totalAmount = o['totalAmount'] ?? o['finalAmount'] ?? 0;
    final finalAmount = o['finalAmount'] ?? totalAmount;
    final discountAmount = o['discountAmount'] ?? 0;
    final pointsUsed = o['pointsUsed'] ?? 0;
    final pointsEarned = o['pointsEarned'] ?? ((finalAmount is num ? finalAmount * 0.001 : 0).toInt());

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: _dark),
        title: const Text('ORDER RECEIPT',
            style: TextStyle(color: Color(0xFF1A1A1A), fontSize: 11, letterSpacing: 4, fontWeight: FontWeight.w400)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _gold.withOpacity(0.3)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─ 헤더 ─
              Center(
                child: Column(
                  children: [
                    Text('ORDER CONFIRMED',
                        style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold, fontStyle: FontStyle.italic)),
                    const SizedBox(height: 8),
                    const Text('Receipt',
                        style: TextStyle(fontSize: 28, letterSpacing: 4, color: _dark, fontWeight: FontWeight.w300, fontStyle: FontStyle.italic)),
                    const SizedBox(height: 4),
                    Text('NO. ${o['orderNumber'] ?? o['orderId'] ?? ''}',
                        style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 3)),
                    const SizedBox(height: 20),
                    _buildOrnament(),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // ─ 배송 정보 ─
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCFBF9),
                  border: const Border(left: BorderSide(color: _gold, width: 2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Shipping Info',
                        style: TextStyle(fontSize: 9, letterSpacing: 3, color: _grey, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    _infoRow('Recipient', o['receiverName'] ?? ''),
                    _infoRow('Contact', o['receiverPhone'] ?? ''),
                    _infoRow('Address', '(${o['shippingZipcode'] ?? ''}) ${o['shippingAddress'] ?? ''}'),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // ─ 주문 상품 ─
              Text('Items', style: TextStyle(fontSize: 9, letterSpacing: 3, color: _grey, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              ...items.map((item) => _buildItemRow(item as Map<String, dynamic>)),
              const SizedBox(height: 20),

              // ─ 금액 ─
              const Divider(color: Color(0xFFEEEEEE)),
              const SizedBox(height: 12),
              _amountRow('SUBTOTAL', '₩${_numFmt(totalAmount)}', textColor: _grey),
              if ((discountAmount as num) > 0)
                _amountRow('COUPON DISCOUNT', '- ₩${_numFmt(discountAmount)}', textColor: Colors.red.shade400),
              if ((pointsUsed as num) > 0)
                _amountRow('POINTS USED', '- ${_numFmt(pointsUsed)}P', textColor: Colors.red.shade400),
              const SizedBox(height: 12),
              Container(height: 2, color: _dark),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Amount',
                      style: TextStyle(fontSize: 18, color: _gold, fontStyle: FontStyle.italic, fontWeight: FontWeight.w400, letterSpacing: 1)),
                  Text('₩${_numFmt(finalAmount)}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: _dark)),
                ],
              ),
              const SizedBox(height: 24),

              // ─ 포인트 ─
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCFBF9),
                  border: Border.all(color: _gold.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Points Summary',
                        style: TextStyle(fontSize: 9, letterSpacing: 3, color: _grey, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    if ((pointsUsed as num) > 0)
                      _amountRow('사용 포인트', '- ${_numFmt(pointsUsed)}P', textColor: Colors.red.shade400),
                    _amountRow('이번 주문 적립 (0.1%)', '+ ${_numFmt(pointsEarned)}P', textColor: _gold),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // ─ 버튼 ─
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _dark,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: const RoundedRectangleBorder(),
                  ),
                  child: const Text('CONTINUE SHOPPING',
                      style: TextStyle(fontSize: 10, letterSpacing: 4, fontWeight: FontWeight.w400)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrnament() {
    return Row(
      children: [
        Expanded(child: Container(height: 1, color: _gold.withOpacity(0.3))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('✦', style: TextStyle(color: _gold.withOpacity(0.5), fontSize: 10)),
        ),
        Expanded(child: Container(height: 1, color: _gold.withOpacity(0.3))),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(label, style: TextStyle(fontSize: 11, color: _grey)),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 11, color: _dark, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  Widget _buildItemRow(Map<String, dynamic> item) {
    final imageUrl = item['imageUrl'];
    final name = item['perfumeNameSnapshot'] ?? item['name'] ?? '';
    final qty = item['quantity'] ?? 1;
    final price = item['finalPrice'] ?? 0;
    final isCustom = item['perfumeId'] == null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          // 이미지
          Container(
            width: 64,
            height: 76,
            color: const Color(0xFFF5F0E8),
            child: imageUrl != null
                ? Image.network(imageUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _fallbackImg())
                : _fallbackImg(),
          ),
          const SizedBox(width: 16),
          // 정보
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(fontSize: 15, color: _dark, fontWeight: FontWeight.w400, fontStyle: FontStyle.italic)),
                const SizedBox(height: 4),
                Text(
                  '${isCustom ? 'CUSTOM' : '${item['volumeMl'] ?? 50}ML'} / $qty Unit(s)',
                  style: TextStyle(fontSize: 9, color: _grey, letterSpacing: 2),
                ),
              ],
            ),
          ),
          // 가격
          Text('₩${_numFmt(price)}',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: _dark)),
        ],
      ),
    );
  }

  Widget _fallbackImg() {
    return const Center(child: Text('✦', style: TextStyle(fontSize: 24, color: _gold)));
  }

  Widget _amountRow(String label, String value, {Color? textColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 10, letterSpacing: 2, color: textColor ?? _grey)),
          Text(value, style: TextStyle(fontSize: 10, letterSpacing: 2, color: textColor ?? _grey)),
        ],
      ),
    );
  }
}
