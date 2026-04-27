import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ReturnExchangeScreen extends StatefulWidget {
  final String orderId;
  const ReturnExchangeScreen({super.key, required this.orderId});

  @override
  State<ReturnExchangeScreen> createState() => _ReturnExchangeScreenState();
}

class _ReturnExchangeScreenState extends State<ReturnExchangeScreen> {
  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF1A1A1A);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  Map<String, dynamic>? _order;
  bool _loading = true;
  bool _submitting = false;

  String _requestType = 'RETURN'; // RETURN 또는 EXCHANGE
  String _selectedReason = '';
  final _detailController = TextEditingController();
  final Set<int> _selectedItemIds = {};

  static const List<Map<String, String>> _reasons = [
    {'value': 'CHANGED_MIND', 'label': '단순 변심'},
    {'value': 'DEFECTIVE', 'label': '상품 불량/파손'},
    {'value': 'WRONG_ITEM', 'label': '다른 상품 배송'},
    {'value': 'NOT_AS_DESCRIBED', 'label': '상세설명과 다름'},
    {'value': 'DELIVERY_DELAY', 'label': '배송 지연'},
    {'value': 'OTHER', 'label': '기타'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchOrder();
  }

  @override
  void dispose() {
    _detailController.dispose();
    super.dispose();
  }

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken') ?? '';
  }

  Future<void> _fetchOrder() async {
    final token = await _getToken();
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
        if (mounted) {
          setState(() {
            _order = json['data'] as Map<String, dynamic>?;
            // 기본적으로 모든 상품 선택
            final items = _order?['orderItems'] as List? ?? [];
            _selectedItemIds.addAll(
              items.map<int>((i) => (i['orderItemId'] as num?)?.toInt() ?? 0)
                  .where((id) => id > 0),
            );
          });
        }
      }
    } catch (e) {
      debugPrint('주문 조회 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleSubmit() async {
    // 검증
    if (_selectedItemIds.isEmpty) {
      _showSnack('대상 상품을 선택해주세요.');
      return;
    }
    if (_selectedReason.isEmpty) {
      _showSnack('사유를 선택해주세요.');
      return;
    }
    if (_detailController.text.trim().length < 5) {
      _showSnack('상세 사유를 5자 이상 입력해주세요.');
      return;
    }

    final typeLabel = _requestType == 'RETURN' ? '반품' : '교환';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('$typeLabel 신청', style: const TextStyle(fontSize: 14, letterSpacing: 2)),
        content: Text(
          '선택하신 상품 ${_selectedItemIds.length}개에 대해 $typeLabel을(를) 신청하시겠습니까?\n\n신청 후에는 취소가 어려울 수 있습니다.',
          style: const TextStyle(fontSize: 12),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('취소')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('신청', style: TextStyle(color: _gold, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _submitting = true);
    try {
      final token = await _getToken();
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/orders/${widget.orderId}/return-exchange'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'requestType': _requestType,
          'reason': _selectedReason,
          'detail': _detailController.text.trim(),
          'orderItemIds': _selectedItemIds.toList(),
        }),
      );

      if (!mounted) return;
      if (res.statusCode == 200 || res.statusCode == 201) {
        await showDialog<void>(
          context: context,
          builder: (_) => AlertDialog(
            title: Text('$typeLabel 신청 완료',
                style: const TextStyle(fontSize: 14, letterSpacing: 2)),
            content: Text(
              '$typeLabel 신청이 정상적으로 접수되었습니다.\n처리 결과는 마이페이지에서 확인하실 수 있습니다.',
              style: const TextStyle(fontSize: 12),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('확인', style: TextStyle(color: _gold)),
              ),
            ],
          ),
        );
        if (mounted) Navigator.pop(context);
      } else {
        String msg = '$typeLabel 신청 처리 중 오류가 발생했습니다.';
        try {
          final err = jsonDecode(utf8.decode(res.bodyBytes));
          msg = (err['message'] ?? msg).toString();
        } catch (_) {}
        _showSnack(msg);
      }
    } catch (e) {
      _showSnack('신청 처리 중 오류: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
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

    final items = (_order!['orderItems'] as List?) ?? [];

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: _dark),
        title: const Text('RETURN / EXCHANGE',
            style: TextStyle(color: _dark, fontSize: 11, letterSpacing: 4, fontWeight: FontWeight.w400)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─ 신청 유형 선택 ─
            _buildCard(
              title: 'REQUEST TYPE',
              child: Row(
                children: [
                  Expanded(
                    child: _typeButton('RETURN', '반품', Icons.assignment_return_outlined),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _typeButton('EXCHANGE', '교환', Icons.swap_horiz),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ─ 상품 선택 ─
            _buildCard(
              title: 'SELECT ITEMS',
              child: Column(
                children: items.map((item) {
                  final m = item as Map<String, dynamic>;
                  final itemId = (m['orderItemId'] as num?)?.toInt() ?? 0;
                  final isSelected = _selectedItemIds.contains(itemId);
                  return _buildItemRow(m, itemId, isSelected);
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // ─ 사유 선택 ─
            _buildCard(
              title: 'REASON',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _reasons.map((r) {
                  final selected = _selectedReason == r['value'];
                  return GestureDetector(
                    onTap: () => setState(() => _selectedReason = r['value']!),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          Icon(
                            selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                            size: 18,
                            color: selected ? _gold : _grey,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            r['label']!,
                            style: TextStyle(
                              fontSize: 13,
                              color: selected ? _dark : _grey,
                              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // ─ 상세 사유 ─
            _buildCard(
              title: 'DETAIL',
              child: TextField(
                controller: _detailController,
                maxLines: 5,
                maxLength: 500,
                decoration: InputDecoration(
                  hintText: '상세한 사유를 5자 이상 입력해주세요.\n(예: 향이 상세설명과 다름, 포장이 파손되어 도착 등)',
                  hintStyle: const TextStyle(fontSize: 11, color: _grey),
                  filled: true,
                  fillColor: const Color(0xFFFCFBF9),
                  contentPadding: const EdgeInsets.all(12),
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
            const SizedBox(height: 16),

            // ─ 안내 문구 ─
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFCFBF9),
                border: Border(left: BorderSide(color: _gold, width: 2)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('안내사항',
                      style: TextStyle(fontSize: 10, letterSpacing: 2, color: _gold, fontWeight: FontWeight.w700)),
                  SizedBox(height: 6),
                  Text(
                    '• 상품 수령 후 7일 이내에만 신청 가능합니다.\n'
                    '• 개봉 후 사용한 향수는 반품/교환이 불가합니다.\n'
                    '• 단순 변심의 경우 왕복 배송비가 발생할 수 있습니다.',
                    style: TextStyle(fontSize: 11, color: _grey, height: 1.6),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // ─ 신청 버튼 ─
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _dark,
                  disabledBackgroundColor: _grey.withOpacity(0.3),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: const RoundedRectangleBorder(),
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 18, height: 18,
                        child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2,
                        ),
                      )
                    : Text(
                        _requestType == 'RETURN' ? 'REQUEST RETURN' : 'REQUEST EXCHANGE',
                        style: const TextStyle(fontSize: 10, letterSpacing: 4, fontWeight: FontWeight.w400),
                      ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _typeButton(String value, String label, IconData icon) {
    final selected = _requestType == value;
    return GestureDetector(
      onTap: () => setState(() => _requestType = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? _dark : Colors.white,
          border: Border.all(color: selected ? _dark : _gold.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? _gold : _grey, size: 22),
            const SizedBox(height: 4),
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    color: selected ? Colors.white : _grey,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 2)),
          ],
        ),
      ),
    );
  }

  Widget _buildItemRow(Map<String, dynamic> item, int itemId, bool isSelected) {
    final imageUrl = item['imageUrl'] as String?;
    final name = (item['perfumeNameSnapshot'] ?? item['name'] ?? '').toString();
    final qty = (item['quantity'] as num?)?.toInt() ?? 1;
    final price = (item['finalPrice'] as num?)?.toInt() ?? 0;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              setState(() {
                if (isSelected) {
                  _selectedItemIds.remove(itemId);
                } else {
                  _selectedItemIds.add(itemId);
                }
              });
            },
            child: Icon(
              isSelected ? Icons.check_box : Icons.check_box_outline_blank,
              size: 20, color: _gold,
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 48, height: 60,
            color: const Color(0xFFF5F0E8),
            child: imageUrl != null
                ? Image.network(imageUrl, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Center(
                          child: Text('✦', style: TextStyle(color: _gold, fontSize: 18)),
                        ))
                : const Center(child: Text('✦', style: TextStyle(color: _gold, fontSize: 18))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(fontSize: 13, color: _dark, fontWeight: FontWeight.w500),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('수량: $qty', style: const TextStyle(fontSize: 10, color: _grey)),
              ],
            ),
          ),
          Text('₩${_numFmt(price)}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _dark)),
        ],
      ),
    );
  }

  Widget _buildCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(fontSize: 10, letterSpacing: 3, color: _gold, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  String _numFmt(int v) {
    return v.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}
