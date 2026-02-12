import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AdminCouponsScreen extends StatefulWidget {
  const AdminCouponsScreen({super.key});
  @override
  State<AdminCouponsScreen> createState() => _AdminCouponsScreenState();
}

class _AdminCouponsScreenState extends State<AdminCouponsScreen> {
  final _supabase = Supabase.instance.client;
  String _activeTab = 'coupons';
  List<Map<String, dynamic>> _coupons = [];
  List<Map<String, dynamic>> _pointRules = [];
  bool _loading = true;
  bool _showCouponForm = false;
  bool _showPointForm = false;

  // 쿠폰 폼
  final _codeCtrl = TextEditingController();
  String _discountType = 'PERCENTAGE';
  final _discountValueCtrl = TextEditingController(text: '0');
  final _minPurchaseCtrl = TextEditingController(text: '0');
  final _usageLimitCtrl = TextEditingController(text: '1');
  String _expiryDate = '';
  bool _isStackable = false;

  // 포인트 규칙 폼
  final _ruleNameCtrl = TextEditingController();
  String _actionType = 'PURCHASE';
  final _pointRateCtrl = TextEditingController(text: '0.1');
  final _maxPointsCtrl = TextEditingController(text: '100');
  bool _isRuleActive = true;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() { super.initState(); _fetchAll(); }

  Future<void> _fetchAll() async {
    setState(() => _loading = true);
    try {
      final coupons = await _supabase.from('Coupons').select('*').order('created_at', ascending: false);
      final rules = await _supabase.from('PointRules').select('*').order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _coupons = List<Map<String, dynamic>>.from(coupons);
          _pointRules = List<Map<String, dynamic>>.from(rules);
        });
      }
    } catch (e) { _alert('로드 실패: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _saveCoupon() async {
    if (_codeCtrl.text.trim().isEmpty) { _alert('쿠폰 코드를 입력해주세요.'); return; }
    try {
      await _supabase.from('Coupons').insert({
        'code': _codeCtrl.text.trim().toUpperCase(),
        'discount_type': _discountType,
        'discount_value': double.tryParse(_discountValueCtrl.text) ?? 0,
        'min_purchase': double.tryParse(_minPurchaseCtrl.text) ?? 0,
        'usage_limit': int.tryParse(_usageLimitCtrl.text) ?? 1,
        'expiry_date': _expiryDate.isEmpty ? null : _expiryDate,
        'is_stackable': _isStackable,
      });
      _alert('쿠폰이 생성되었습니다.');
      _resetCouponForm(); _fetchAll();
    } catch (e) { _alert('저장 실패: $e'); }
  }

  Future<void> _deleteCoupon(int id) async {
    _confirm('쿠폰을 삭제하시겠습니까?', () async {
      await _supabase.from('Coupons').delete().eq('id', id);
      _fetchAll();
    });
  }

  Future<void> _savePointRule() async {
    if (_ruleNameCtrl.text.trim().isEmpty) { _alert('규칙 이름을 입력해주세요.'); return; }
    try {
      await _supabase.from('PointRules').insert({
        'rule_name': _ruleNameCtrl.text.trim(),
        'action_type': _actionType,
        'point_rate': double.tryParse(_pointRateCtrl.text) ?? 0.1,
        'max_points': int.tryParse(_maxPointsCtrl.text) ?? 100,
        'is_active': _isRuleActive,
      });
      _alert('포인트 규칙이 생성되었습니다.');
      _resetPointForm(); _fetchAll();
    } catch (e) { _alert('저장 실패: $e'); }
  }

  Future<void> _deletePointRule(int id) async {
    _confirm('규칙을 삭제하시겠습니까?', () async {
      await _supabase.from('PointRules').delete().eq('id', id);
      _fetchAll();
    });
  }

  void _resetCouponForm() {
    _codeCtrl.clear(); _discountType = 'PERCENTAGE';
    _discountValueCtrl.text = '0'; _minPurchaseCtrl.text = '0';
    _usageLimitCtrl.text = '1'; _expiryDate = ''; _isStackable = false;
    setState(() => _showCouponForm = false);
  }

  void _resetPointForm() {
    _ruleNameCtrl.clear(); _actionType = 'PURCHASE';
    _pointRateCtrl.text = '0.1'; _maxPointsCtrl.text = '100'; _isRuleActive = true;
    setState(() => _showPointForm = false);
  }

  void _alert(String msg) {
    showDialog(context: context, builder: (_) => AlertDialog(
      content: Text(msg, style: const TextStyle(fontSize: 13)),
      actions: [TextButton(onPressed: () => Navigator.pop(context),
          child: const Text('확인', style: TextStyle(color: _gold)))],
    ));
  }

  void _confirm(String msg, VoidCallback onConfirm) {
    showDialog(context: context, builder: (_) => AlertDialog(
      content: Text(msg, style: const TextStyle(fontSize: 13)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('취소', style: TextStyle(color: Colors.grey))),
        TextButton(onPressed: () { Navigator.pop(context); onConfirm(); }, child: const Text('삭제', style: TextStyle(color: Colors.red))),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: _dark), onPressed: () => Navigator.pop(context)),
        title: const Text('쿠폰 / 포인트 관리', style: TextStyle(color: _dark, fontSize: 14, letterSpacing: 1)),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : Column(children: [
              _buildTabBar(),
              Expanded(child: _activeTab == 'coupons' ? _buildCouponsContent() : _buildPointsContent()),
            ]),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: Row(children: [
        _tab('쿠폰 관리', 'coupons', Icons.card_giftcard_outlined),
        _tab('포인트 규칙', 'points', Icons.monetization_on_outlined),
      ]),
    );
  }

  Widget _tab(String label, String value, IconData icon) {
    final active = _activeTab == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: active ? _gold : Colors.transparent, width: 2)),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 16, color: active ? _dark : _grey),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(
              fontSize: 12, letterSpacing: 1,
              color: active ? _dark : _grey, fontWeight: active ? FontWeight.bold : FontWeight.normal,
            )),
          ]),
        ),
      ),
    );
  }

  // ── 쿠폰 ────────────────────────────────────────────────────

  Widget _buildCouponsContent() {
    return Column(children: [
      if (_showCouponForm) _buildCouponForm(),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('총 ${_coupons.length}개', style: const TextStyle(fontSize: 12, color: _grey)),
          TextButton.icon(
            onPressed: () => setState(() => _showCouponForm = !_showCouponForm),
            icon: Icon(_showCouponForm ? Icons.close : Icons.add, size: 16, color: _gold),
            label: Text(_showCouponForm ? '닫기' : '쿠폰 추가', style: const TextStyle(fontSize: 12, color: _gold)),
          ),
        ]),
      ),
      Expanded(
        child: _coupons.isEmpty
            ? const Center(child: Text('등록된 쿠폰이 없습니다.', style: TextStyle(color: _grey)))
            : ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _coupons.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final c = _coupons[i];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white, border: Border.all(color: _gold.withOpacity(0.15)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.card_giftcard, color: _gold, size: 24),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(c['code'] as String? ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _dark, fontFamily: 'monospace')),
                        const SizedBox(height: 3),
                        Text(
                          c['discount_type'] == 'PERCENTAGE'
                              ? '${c['discount_value']}% 할인'
                              : '₩${c['discount_value']} 할인',
                          style: const TextStyle(fontSize: 12, color: _grey),
                        ),
                        if (c['expiry_date'] != null)
                          Text('만료: ${c['expiry_date']}', style: const TextStyle(fontSize: 11, color: _grey)),
                      ])),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                        onPressed: () => _deleteCoupon(c['id'] as int),
                      ),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }

  Widget _buildCouponForm() {
    return Container(
      color: Colors.white, padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('쿠폰 생성', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 1)),
        const SizedBox(height: 16),
        _field2('쿠폰 코드', _codeCtrl, hint: 'SUMMER2025'),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _discountType,
          decoration: const InputDecoration(labelText: '할인 유형', labelStyle: TextStyle(fontSize: 12, color: _grey),
              enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5))),
          items: const [
            DropdownMenuItem(value: 'PERCENTAGE', child: Text('퍼센트 (%)', style: TextStyle(fontSize: 13))),
            DropdownMenuItem(value: 'FIXED', child: Text('정액 (₩)', style: TextStyle(fontSize: 13))),
          ],
          onChanged: (v) => setState(() => _discountType = v ?? 'PERCENTAGE'),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _field2('할인 값', _discountValueCtrl, keyboardType: TextInputType.number)),
          const SizedBox(width: 12),
          Expanded(child: _field2('최소 구매액', _minPurchaseCtrl, keyboardType: TextInputType.number)),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _field2('사용 한도', _usageLimitCtrl, keyboardType: TextInputType.number)),
          const SizedBox(width: 12),
          Expanded(child: GestureDetector(
            onTap: () async {
              final picked = await showDatePicker(
                context: context, initialDate: DateTime.now(),
                firstDate: DateTime.now(), lastDate: DateTime(2030),
                builder: (ctx, child) => Theme(
                  data: ThemeData.light().copyWith(colorScheme: const ColorScheme.light(primary: _gold)),
                  child: child!,
                ),
              );
              if (picked != null) setState(() => _expiryDate = '${picked.year}-${picked.month.toString().padLeft(2,'0')}-${picked.day.toString().padLeft(2,'0')}');
            },
            child: InputDecorator(
              decoration: const InputDecoration(labelText: '만료일', labelStyle: TextStyle(fontSize: 12, color: _grey),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5))),
              child: Text(_expiryDate.isEmpty ? '날짜 선택' : _expiryDate,
                  style: TextStyle(fontSize: 13, color: _expiryDate.isEmpty ? Colors.grey : _dark)),
            ),
          )),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Switch(value: _isStackable, onChanged: (v) => setState(() => _isStackable = v), activeColor: _gold),
          const Text('중복 사용 가능', style: TextStyle(fontSize: 12, color: _dark)),
        ]),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: _saveCoupon,
          style: ElevatedButton.styleFrom(backgroundColor: _dark, padding: const EdgeInsets.symmetric(vertical: 14), shape: const RoundedRectangleBorder()),
          child: const Text('쿠폰 생성', style: TextStyle(color: Colors.white, letterSpacing: 2)),
        )),
      ]),
    );
  }

  // ── 포인트 규칙 ──────────────────────────────────────────────

  Widget _buildPointsContent() {
    return Column(children: [
      if (_showPointForm) _buildPointForm(),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('총 ${_pointRules.length}개 규칙', style: const TextStyle(fontSize: 12, color: _grey)),
          TextButton.icon(
            onPressed: () => setState(() => _showPointForm = !_showPointForm),
            icon: Icon(_showPointForm ? Icons.close : Icons.add, size: 16, color: _gold),
            label: Text(_showPointForm ? '닫기' : '규칙 추가', style: const TextStyle(fontSize: 12, color: _gold)),
          ),
        ]),
      ),
      Expanded(
        child: _pointRules.isEmpty
            ? const Center(child: Text('등록된 포인트 규칙이 없습니다.', style: TextStyle(color: _grey)))
            : ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _pointRules.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final r = _pointRules[i];
                  final isActive = r['is_active'] as bool? ?? false;
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white, border: Border.all(color: _gold.withOpacity(0.15)),
                    ),
                    child: Row(children: [
                      Container(
                        width: 8, height: 40,
                        color: isActive ? Colors.green : Colors.grey[300],
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(r['rule_name'] as String? ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark)),
                        const SizedBox(height: 3),
                        Text('${r['action_type']} · ${r['point_rate']}% · 최대 ${r['max_points']}P',
                            style: const TextStyle(fontSize: 11, color: _grey)),
                      ])),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        color: isActive ? Colors.green[50] : Colors.grey[100],
                        child: Text(isActive ? '활성' : '비활성',
                            style: TextStyle(fontSize: 10, color: isActive ? Colors.green : Colors.grey)),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                        onPressed: () => _deletePointRule(r['id'] as int),
                      ),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }

  Widget _buildPointForm() {
    return Container(
      color: Colors.white, padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('포인트 규칙 생성', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 1)),
        const SizedBox(height: 16),
        _field2('규칙 이름', _ruleNameCtrl, hint: '구매 적립 기본'),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _actionType,
          decoration: const InputDecoration(labelText: '적립 유형', labelStyle: TextStyle(fontSize: 12, color: _grey),
              enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5))),
          items: const [
            DropdownMenuItem(value: 'PURCHASE', child: Text('구매', style: TextStyle(fontSize: 13))),
            DropdownMenuItem(value: 'REVIEW', child: Text('리뷰', style: TextStyle(fontSize: 13))),
            DropdownMenuItem(value: 'EVENT', child: Text('이벤트', style: TextStyle(fontSize: 13))),
          ],
          onChanged: (v) => setState(() => _actionType = v ?? 'PURCHASE'),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _field2('적립률 (%)', _pointRateCtrl, keyboardType: TextInputType.number)),
          const SizedBox(width: 12),
          Expanded(child: _field2('최대 포인트 (P)', _maxPointsCtrl, keyboardType: TextInputType.number)),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Switch(value: _isRuleActive, onChanged: (v) => setState(() => _isRuleActive = v), activeColor: _gold),
          const Text('활성화', style: TextStyle(fontSize: 12, color: _dark)),
        ]),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: _savePointRule,
          style: ElevatedButton.styleFrom(backgroundColor: _dark, padding: const EdgeInsets.symmetric(vertical: 14), shape: const RoundedRectangleBorder()),
          child: const Text('규칙 생성', style: TextStyle(color: Colors.white, letterSpacing: 2)),
        )),
      ]),
    );
  }

  Widget _field2(String label, TextEditingController ctrl, {String? hint, TextInputType keyboardType = TextInputType.text}) {
    return TextField(
      controller: ctrl, keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label, hintText: hint,
        labelStyle: const TextStyle(fontSize: 12, color: _grey),
        hintStyle: const TextStyle(fontSize: 12, color: Colors.black26),
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: _gold)),
      ),
      style: const TextStyle(fontSize: 13),
    );
  }

  @override
  void dispose() {
    _codeCtrl.dispose(); _discountValueCtrl.dispose();
    _minPurchaseCtrl.dispose(); _usageLimitCtrl.dispose();
    _ruleNameCtrl.dispose(); _pointRateCtrl.dispose(); _maxPointsCtrl.dispose();
    super.dispose();
  }
}
