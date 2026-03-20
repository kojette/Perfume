import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

const _gold  = Color(0xFFC9A961);
const _dark  = Color(0xFF1A1A1A);
const _bg    = Color(0xFFFAF8F3);
const _grey  = Color(0xFF8B8278);
const _light = Color(0xFFF0ECE4);
const _cream = Color(0xFFE8E2D6);

class CustomizationScreen extends StatefulWidget {
  const CustomizationScreen({super.key});
  @override
  State<CustomizationScreen> createState() => _CustomizationScreenState();
}

class _CustomizationScreenState extends State<CustomizationScreen>
    with SingleTickerProviderStateMixin {

  int  _activeMode = 0; // 0=공병, 1=향조합

  // 공병 디자인
  List<Map<String, dynamic>> _designs = [];
  bool _loading = true;

  // 향 조합 - /api/custom/scents → { categoryId, categoryName, ingredients:[{ingredientId, name}] }
  List<Map<String, dynamic>> _categories    = [];
  bool                       _loadingScents = true;
  String?                    _scentsError;

  // Top/Middle/Base 선택 (ingredientId → ingredient Map)
  final Map<String, List<Map<String, dynamic>>> _selected = {
    'top': [], 'middle': [], 'base': [],
  };
  bool _blendSaved = false;

  // 향 탭 내 검색
  final _scentSearchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchDesigns();
    _fetchScents();
  }

  @override
  void dispose() {
    _scentSearchCtrl.dispose();
    super.dispose();
  }

  // ── API ────────────────────────────────────────────────────────

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  Future<void> _fetchDesigns() async {
    setState(() => _loading = true);
    final token = await _getToken();
    if (token == null || token.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/designs'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() =>
            _designs = List<Map<String, dynamic>>.from(json['data'] ?? []));
      }
    } catch (e) { debugPrint('디자인 로드 오류: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  // [FIX] /api/notes (404) → /api/custom/scents
  // 응답 구조: { data: [ { categoryId, categoryName, ingredients: [{ingredientId, name}] } ] }
  Future<void> _fetchScents() async {
    setState(() { _loadingScents = true; _scentsError = null; });
    try {
      final res = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/custom/scents'));
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        final data = (json['data'] ?? json) as List? ?? [];
        if (mounted) setState(() =>
            _categories = data.cast<Map<String, dynamic>>());
      } else {
        if (mounted) setState(() => _scentsError = '향 재료 목록을 불러오지 못했습니다. (${res.statusCode})');
      }
    } catch (e) {
      debugPrint('향 재료 로드 오류: $e');
      if (mounted) setState(() => _scentsError = '향 재료 목록을 불러오지 못했습니다.');
    }
    finally { if (mounted) setState(() => _loadingScents = false); }
  }

  Future<void> _deleteDesign(int designId, String name) async {
    final confirmed = await showDialog<bool>(context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('삭제 확인', style: TextStyle(fontSize: 14, color: _dark)),
        content: Text('"$name"을 삭제하시겠습니까?',
            style: const TextStyle(fontSize: 13, color: _grey)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
              child: const Text('취소', style: TextStyle(color: _grey))),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('삭제', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirmed != true) return;
    final token = await _getToken();
    if (token == null) return;
    try {
      final res = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/designs/$designId'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() => _designs.removeWhere((d) => d['designId'] == designId));
        _snack('디자인이 삭제되었습니다');
      }
    } catch (_) {}
  }

  Future<void> _addToCart(Map<String, dynamic> design) async {
    final token = await _getToken();
    if (token == null) { if (mounted) Navigator.pushNamed(context, '/login'); return; }
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/custom'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'customDesignId': design['designId'],
          'name': design['name'],
          'price': design['totalPrice'],
          'quantity': 1,
          'imageUrl': design['previewImageUrl'],
        }),
      );
      if (res.statusCode == 200 && mounted) _snack('장바구니에 담겼습니다');
    } catch (_) {}
  }

  Future<void> _saveBlend() async {
    final token = await _getToken();
    if (token == null) { if (mounted) Navigator.pushNamed(context, '/login'); return; }
    final hasAny = _selected.values.any((l) => l.isNotEmpty);
    if (!hasAny) { _snack('최소 1개 이상의 노트를 선택해주세요'); return; }

    // 프론트와 동일: POST /api/custom/scent-blends
    try {
      final ingredientDetails = _selected.entries.expand((e) {
        final type = e.key;
        return e.value.map((ing) => {
          'ingredientId': ing['ingredientId'],
          'type': type.toUpperCase(),
        });
      }).toList();

      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'ingredients': ingredientDetails}),
      );
    } catch (_) {}

    setState(() => _blendSaved = true);
    _snack('향 조합이 저장되었습니다! 전문가가 검토 후 연락드립니다.');
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _blendSaved = false);
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(color: _gold)),
      backgroundColor: _dark, behavior: SnackBarBehavior.floating,
    ));
  }

  String _numFmt(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  // ════════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(child: Column(children: [
        _buildHeader(),
        _buildTabSwitcher(),
        Expanded(child: _activeMode == 0 ? _buildBottleTab() : _buildScentTab()),
      ])),
    );
  }

  Widget _buildHeader() => Container(
    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
    color: Colors.white,
    child: Column(children: [
      const Text('CREATE YOUR SIGNATURE',
          style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold, fontStyle: FontStyle.italic)),
      const SizedBox(height: 6),
      const Text('CUSTOMIZING',
          style: TextStyle(fontSize: 20, letterSpacing: 8, color: _dark, fontWeight: FontWeight.w300)),
      const SizedBox(height: 4),
      const Text('나만의 향수를 완성하세요',
          style: TextStyle(fontSize: 11, letterSpacing: 2, color: _grey, fontStyle: FontStyle.italic)),
      const SizedBox(height: 12),
      Container(height: 0.5, color: _gold.withOpacity(0.3)),
    ]),
  );

  Widget _buildTabSwitcher() => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
    child: Container(
      decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.4))),
      child: Row(children: [
        _tabBtn(0, Icons.local_drink_outlined, '향수 공병 디자인'),
        Container(width: 0.5, color: _gold.withOpacity(0.3)),
        _tabBtn(1, Icons.water_drop_outlined, '나만의 향 조합하기'),
      ]),
    ),
  );

  Widget _tabBtn(int idx, IconData icon, String label) {
    final active = _activeMode == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeMode = idx),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 12),
          color: active ? _dark : Colors.white,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 16, color: active ? _gold : _grey),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 10, letterSpacing: 1,
                color: active ? _gold : _grey)),
          ]),
        ),
      ),
    );
  }

  // ════════════════ 공병 디자인 탭 ═════════════════════════════

  Widget _buildBottleTab() => Column(children: [
    Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: GestureDetector(
        onTap: () async {
          final token = await _getToken();
          if (token == null && mounted) { Navigator.pushNamed(context, '/login'); return; }
          if (mounted) _snack('에디터는 웹 버전에서 이용해 주세요');
        },
        child: Container(
          width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(border: Border.all(color: _gold, width: 1.5)),
          child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.add, color: _gold, size: 16), SizedBox(width: 8),
            Text('내 향수 디자인 추가',
                style: TextStyle(color: _gold, fontSize: 12, letterSpacing: 2)),
          ]),
        ),
      ),
    ),
    const SizedBox(height: 12),
    Expanded(
      child: _loading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : _designs.isEmpty
              ? _emptyState(Icons.local_drink_outlined,
                  '아직 저장된 디자인이 없습니다.\n위 버튼을 눌러 첫 번째 디자인을 만들어보세요.')
              : GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, childAspectRatio: 0.72,
                    crossAxisSpacing: 12, mainAxisSpacing: 16,
                  ),
                  itemCount: _designs.length,
                  itemBuilder: (_, i) => _buildDesignCard(_designs[i]),
                ),
    ),
  ]);

  Widget _buildDesignCard(Map<String, dynamic> d) {
    final preview  = d['previewImageUrl'] as String?;
    final name     = d['name'] ?? '';
    final price    = d['totalPrice'] ?? 0;
    final designId = d['designId'];
    return Container(
      decoration: BoxDecoration(color: Colors.white,
          border: Border.all(color: _gold.withOpacity(0.2)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)]),
      child: Column(children: [
        Expanded(child: Container(color: _light,
          child: preview != null
              ? Image.network(preview, fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Center(
                      child: Text('NO PREVIEW',
                          style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 2))))
              : const Center(child: Text('NO PREVIEW',
                  style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 2))),
        )),
        Padding(padding: const EdgeInsets.all(10), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, style: const TextStyle(fontSize: 13, color: _dark),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text('₩${_numFmt(price)}', style: const TextStyle(fontSize: 11, color: _gold)),
            const SizedBox(height: 6),
            if ((d['bottlePrice'] ?? 0) > 0 || (d['printingPrice'] ?? 0) > 0)
              Padding(padding: const EdgeInsets.only(bottom: 6),
                child: Column(children: [
                  if ((d['bottlePrice'] ?? 0) > 0) _priceRow('공병', d['bottlePrice']),
                  if ((d['printingPrice'] ?? 0) > 0) _priceRow('프린팅', d['printingPrice']),
                  if ((d['stickerPrice'] ?? 0) > 0) _priceRow('스티커', d['stickerPrice']),
                  if ((d['engravingPrice'] ?? 0) > 0) _priceRow('각인', d['engravingPrice']),
                ]),
              ),
            Row(children: [
              Expanded(child: GestureDetector(
                onTap: () => _addToCart(d),
                child: Container(padding: const EdgeInsets.symmetric(vertical: 8), color: _dark,
                  child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.shopping_bag_outlined, size: 12, color: Colors.white),
                    SizedBox(width: 4),
                    Text('CART', style: TextStyle(fontSize: 9, color: Colors.white, letterSpacing: 2)),
                  ]),
                ),
              )),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: () => _deleteDesign(designId, name.toString()),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  decoration: BoxDecoration(border: Border.all(color: Colors.red.shade200)),
                  child: Icon(Icons.delete_outline, size: 14, color: Colors.red.shade300),
                ),
              ),
            ]),
          ],
        )),
      ]),
    );
  }

  Widget _priceRow(String label, dynamic val) => Padding(
    padding: const EdgeInsets.only(bottom: 2),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(fontSize: 9, color: _grey)),
      Text('₩${_numFmt(val)}', style: const TextStyle(fontSize: 9, color: _grey)),
    ]),
  );

  // ════════════════ 향 조합 탭 ═════════════════════════════════

  Widget _buildScentTab() {
    if (_loadingScents) return const Center(child: CircularProgressIndicator(color: _gold));
    if (_scentsError != null) return Center(child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(_scentsError!, style: const TextStyle(color: _grey, fontSize: 13)),
        const SizedBox(height: 12),
        GestureDetector(onTap: _fetchScents,
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                decoration: BoxDecoration(border: Border.all(color: _gold)),
                child: const Text('다시 시도', style: TextStyle(color: _gold, fontSize: 12)))),
      ],
    ));

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // 인트로
        Container(width: double.infinity, padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.2))),
          child: Column(children: [
            const Text('MY SCENT LAB',
                style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold)),
            const SizedBox(height: 4),
            const Text('원하는 향을 조합하세요',
                style: TextStyle(fontSize: 14, color: _dark, letterSpacing: 2)),
            const SizedBox(height: 4),
            Text('각 계열별 최대 5개 선택',
                style: TextStyle(fontSize: 11, color: _grey.withOpacity(0.7),
                    fontStyle: FontStyle.italic)),
          ]),
        ),
        const SizedBox(height: 16),

        // Top / Middle / Base 섹션
        _buildNoteSection('top',    'TOP NOTE',    '첫인상을 결정하는 향 · 15–30분'),
        const SizedBox(height: 12),
        _buildNoteSection('middle', 'MIDDLE NOTE', '향수의 핵심 · 2–4시간'),
        const SizedBox(height: 12),
        _buildNoteSection('base',   'BASE NOTE',   '잔향으로 남는 향 · 4시간 이상'),
        const SizedBox(height: 20),

        // 요약 + 저장
        if (_selected.values.any((l) => l.isNotEmpty)) _buildBlendSummary(),
      ]),
    );
  }

  Widget _buildNoteSection(String key, String title, String subtitle) {
    final sel = _selected[key]!;

    // 카테고리 전체의 ingredients를 flatten → 하나의 재료 목록
    final allIngredients = _categories
        .expand((cat) => (cat['ingredients'] as List? ?? [])
            .cast<Map<String, dynamic>>())
        .toList();

    return Container(
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // 헤더
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: _gold.withOpacity(0.15)))),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontSize: 11, letterSpacing: 4, color: _dark)),
              Text(subtitle, style: TextStyle(fontSize: 9, color: _grey.withOpacity(0.7),
                  fontStyle: FontStyle.italic)),
            ]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: sel.isNotEmpty ? _gold.withOpacity(0.1) : Colors.transparent,
                border: Border.all(color: _gold.withOpacity(0.3)),
              ),
              child: Text('${sel.length}/5',
                  style: TextStyle(fontSize: 10, color: sel.isNotEmpty ? _gold : _grey)),
            ),
          ]),
        ),

        // 선택된 재료 chips
        if (sel.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
            child: Wrap(spacing: 6, runSpacing: 6,
              children: sel.map((ing) {
                final name = ing['name'] ?? '';
                return GestureDetector(
                  onTap: () => setState(() => sel.remove(ing)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: _gold.withOpacity(0.12),
                        border: Border.all(color: _gold)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(name, style: const TextStyle(fontSize: 11, color: _gold)),
                      const SizedBox(width: 4),
                      const Icon(Icons.close, size: 10, color: _gold),
                    ]),
                  ),
                );
              }).toList(),
            ),
          ),

        // 카테고리별로 재료 표시
        if (_categories.isEmpty)
          const Padding(padding: EdgeInsets.all(16),
              child: Text('재료 데이터를 불러올 수 없습니다',
                  style: TextStyle(fontSize: 12, color: _grey, fontStyle: FontStyle.italic)))
        else
          ..._categories.map((cat) {
            final catName    = cat['categoryName'] ?? '';
            final ingredients = (cat['ingredients'] as List? ?? []).cast<Map<String, dynamic>>();
            if (ingredients.isEmpty) return const SizedBox.shrink();
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                child: Text(catName,
                    style: TextStyle(fontSize: 9, letterSpacing: 3,
                        color: _gold.withOpacity(0.8), fontStyle: FontStyle.italic)),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                child: Wrap(spacing: 6, runSpacing: 6,
                  children: ingredients.map((ing) {
                    final name     = ing['name'] ?? '';
                    final ingId    = ing['ingredientId'];
                    final isSelected = sel.any((s) => s['ingredientId'] == ingId);
                    return GestureDetector(
                      onTap: () => setState(() {
                        if (isSelected) {
                          sel.removeWhere((s) => s['ingredientId'] == ingId);
                        } else if (sel.length < 5) {
                          sel.add(ing);
                        }
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected ? _dark : Colors.transparent,
                          border: Border.all(
                              color: isSelected ? _dark : _grey.withOpacity(0.35)),
                        ),
                        child: Text(name,
                          style: TextStyle(fontSize: 11, letterSpacing: 0.5,
                              color: isSelected ? Colors.white : _dark.withOpacity(0.7)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ]);
          }),
      ]),
    );
  }

  Widget _buildBlendSummary() => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(color: _dark, border: Border.all(color: _gold.withOpacity(0.3))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('MY SCENT BLEND',
          style: TextStyle(fontSize: 10, letterSpacing: 4, color: _gold)),
      const SizedBox(height: 14),
      ..._selected.entries.where((e) => e.value.isNotEmpty).map((e) {
        final label = {'top': 'Top', 'middle': 'Middle', 'base': 'Base'}[e.key]!;
        final notes = e.value.map((n) => n['name'] ?? '').join(', ');
        return Padding(padding: const EdgeInsets.only(bottom: 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 52, child: Text(label,
                style: TextStyle(fontSize: 10, color: _gold.withOpacity(0.7),
                    fontStyle: FontStyle.italic))),
            Expanded(child: Text(notes,
                style: const TextStyle(fontSize: 11, color: Colors.white70, height: 1.5))),
          ]),
        );
      }),
      const SizedBox(height: 14),
      SizedBox(width: double.infinity,
        child: GestureDetector(
          onTap: _blendSaved ? null : _saveBlend,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 14),
            color: _blendSaved ? _gold.withOpacity(0.5) : _gold,
            child: Text(_blendSaved ? '저장됨 ✓' : '향 조합 저장하기',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, letterSpacing: 2,
                    fontWeight: FontWeight.w600, color: _dark)),
          ),
        ),
      ),
    ]),
  );

  Widget _emptyState(IconData icon, String msg) => Center(
    child: Padding(padding: const EdgeInsets.all(40),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 56, color: _gold.withOpacity(0.3)),
        const SizedBox(height: 20),
        Text(msg, textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: _grey,
                height: 1.7, fontStyle: FontStyle.italic)),
      ]),
    ),
  );
}
