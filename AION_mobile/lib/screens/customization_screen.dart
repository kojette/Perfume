// ════════════════════════════════════════════════════════════════
// customization_screen.dart  (정리 버전)
// 탭 0: 공병 디자인
// 탭 1: 향 조합 → AiScentStudioScreen으로 이동
// 탭 2: AI 조향  → AiScentStudioScreen으로 이동
// ════════════════════════════════════════════════════════════════

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'ai_studio_screen.dart';

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

class _CustomizationScreenState extends State<CustomizationScreen> {

  int _activeMode = 0; // 0=공병, 1=향조합, 2=AI

  // ── 공병 ──────────────────────────────────────────────────────
  List<Map<String, dynamic>> _designs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchDesigns();
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  Future<void> _fetchDesigns() async {
    if (mounted) setState(() => _loading = true);
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
        if (mounted) {
          setState(() =>
              _designs = List<Map<String, dynamic>>.from(json['data'] ?? []));
        }
      }
    } catch (e) {
      debugPrint('디자인 로드 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteDesign(int designId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('삭제 확인',
            style: TextStyle(fontSize: 14, color: _dark)),
        content: Text('"$name"을 삭제하시겠습니까?',
            style: const TextStyle(fontSize: 13, color: _grey)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('취소', style: TextStyle(color: _grey))),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
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
        setState(() =>
            _designs.removeWhere((d) => d['designId'] == designId));
        _snack('디자인이 삭제되었습니다');
      }
    } catch (_) {}
  }

  Future<void> _addToCart(Map<String, dynamic> design) async {
    final token = await _getToken();
    if (token == null) {
      if (mounted) Navigator.pushNamed(context, '/login');
      return;
    }
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/custom'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
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

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(color: _gold)),
      backgroundColor: _dark,
      behavior: SnackBarBehavior.floating,
    ));
  }

  String _numFmt(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n
        .toString()
        .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
            (m) => '${m[1]},');
  }

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(children: [
          _buildHeader(),
          _buildTabSwitcher(),
          Expanded(
            child: IndexedStack(
              index: _activeMode,
              children: [
                _buildBottleTab(),
                _buildScentTab(),
                _buildAiTab(),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  // ── 헤더 ──────────────────────────────────────────────────────
  Widget _buildHeader() => Container(
    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
    color: Colors.white,
    child: Column(children: [
      Stack(alignment: Alignment.center, children: [
        Align(
          alignment: Alignment.centerLeft,
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Icon(Icons.arrow_back_ios,
                size: 16, color: _grey.withOpacity(0.6)),
          ),
        ),
        const Text('CREATE YOUR SIGNATURE',
            style: TextStyle(
                fontSize: 9,
                letterSpacing: 5,
                color: _gold,
                fontStyle: FontStyle.italic)),
      ]),
      const SizedBox(height: 6),
      const Text('CUSTOMIZING',
          style: TextStyle(
              fontSize: 20,
              letterSpacing: 8,
              color: _dark,
              fontWeight: FontWeight.w300)),
      const SizedBox(height: 4),
      const Text('나만의 향수를 완성하세요',
          style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              color: _grey,
              fontStyle: FontStyle.italic)),
      const SizedBox(height: 12),
      Container(height: 0.5, color: _gold.withOpacity(0.3)),
    ]),
  );

  // ── 탭 전환 바 ────────────────────────────────────────────────
  Widget _buildTabSwitcher() => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
    child: Container(
      decoration:
          BoxDecoration(border: Border.all(color: _gold.withOpacity(0.4))),
      child: Row(children: [
        _tabBtn(0, Icons.local_drink_outlined, '공병 디자인'),
        Container(width: 0.5, color: _gold.withOpacity(0.3)),
        _tabBtn(1, Icons.water_drop_outlined, '향 조합'),
        Container(width: 0.5, color: _gold.withOpacity(0.3)),
        _tabBtn(2, Icons.auto_awesome_outlined, 'AI 조향'),
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
          padding: const EdgeInsets.symmetric(vertical: 11),
          color: active ? _dark : Colors.white,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 15, color: active ? _gold : _grey),
            const SizedBox(height: 3),
            Text(label,
                style: TextStyle(
                    fontSize: 9,
                    letterSpacing: 0.8,
                    color: active ? _gold : _grey)),
          ]),
        ),
      ),
    );
  }

  // ════════════════ 탭 0: 공병 ════════════════════════════════

  Widget _buildBottleTab() => Column(children: [
    Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: GestureDetector(
        onTap: () async {
          final token = await _getToken();
          if (token == null && mounted) {
            Navigator.pushNamed(context, '/login');
            return;
          }
          if (!mounted) return;
          final saved =
              await Navigator.pushNamed(context, '/bottle-editor');
          if (saved == true && mounted) {
            await _fetchDesigns();
          }
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration:
              BoxDecoration(border: Border.all(color: _gold, width: 1.5)),
          child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add, color: _gold, size: 16),
                SizedBox(width: 8),
                Text('내 향수 디자인 추가',
                    style: TextStyle(
                        color: _gold, fontSize: 12, letterSpacing: 2)),
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
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.72,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: _designs.length,
                  itemBuilder: (_, i) => _buildDesignCard(_designs[i]),
                ),
    ),
  ]);

  Widget _buildDesignCard(Map<String, dynamic> d) {
    final preview = d['previewImageUrl'] as String?;
    final name = d['name'] ?? '';
    final price = d['totalPrice'] ?? 0;
    final designId = d['designId'];
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04), blurRadius: 6)
        ],
      ),
      child: Column(children: [
        Expanded(
          child: Container(
            color: _light,
            child: _buildPreviewImage(preview),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name.toString(),
                  style: const TextStyle(fontSize: 13, color: _dark),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text('₩${_numFmt(price)}',
                  style: const TextStyle(fontSize: 11, color: _gold)),
              const SizedBox(height: 6),
              Row(children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => _addToCart(d),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      color: _dark,
                      child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.shopping_bag_outlined,
                                size: 12, color: Colors.white),
                            SizedBox(width: 4),
                            Text('CART',
                                style: TextStyle(
                                    fontSize: 9,
                                    color: Colors.white,
                                    letterSpacing: 2)),
                          ]),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () async {
                    final saved = await Navigator.pushNamed(
                      context,
                      '/bottle-editor',
                      arguments: d,
                    );
                    if (saved == true && mounted) {
                      await _fetchDesigns();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 8),
                    decoration:
                        BoxDecoration(border: Border.all(color: _gold)),
                    child: const Icon(Icons.edit, size: 14, color: _gold),
                  ),
                ),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () =>
                      _deleteDesign(designId, name.toString()),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 8),
                    decoration: BoxDecoration(
                        border:
                            Border.all(color: Colors.red.shade200)),
                    child: Icon(Icons.delete_outline,
                        size: 14, color: Colors.red.shade300),
                  ),
                ),
              ]),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildPreviewImage(String? src) {
    const placeholder = Center(
        child: Text('NO PREVIEW',
            style: TextStyle(
                color: _gold, fontSize: 9, letterSpacing: 2)));

    if (src == null || src.isEmpty) return placeholder;

    if (src.startsWith('data:image')) {
      try {
        final base64Str = src.split(',').last;
        return Image.memory(
          base64Decode(base64Str),
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => placeholder,
        );
      } catch (e) {
        debugPrint('프리뷰 base64 디코딩 오류: $e');
        return placeholder;
      }
    }

    return Image.network(
      src,
      fit: BoxFit.contain,
      errorBuilder: (_, __, ___) => placeholder,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return const Center(
            child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    color: _gold, strokeWidth: 1.5)));
      },
    );
  }

  // ════════════════ 탭 1: 향 조합 ═════════════════════════════

  Widget _buildScentTab() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('MY SCENT LAB',
              style: TextStyle(
                  fontSize: 9,
                  letterSpacing: 5,
                  color: _gold,
                  fontStyle: FontStyle.italic)),
          const SizedBox(height: 16),
          Icon(Icons.science_outlined,
              size: 56, color: _gold.withOpacity(0.35)),
          const SizedBox(height: 20),
          const Text('나만의 향 조합하기',
              style: TextStyle(
                  fontSize: 18,
                  letterSpacing: 3,
                  color: _dark,
                  fontWeight: FontWeight.w300)),
          const SizedBox(height: 10),
          const Text(
            '재료 선택, 비율 조절, 농도/용량/병 설정까지\n전체 기능을 스튜디오에서 이용하세요.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 12,
                color: _grey,
                height: 1.7,
                fontStyle: FontStyle.italic),
          ),
          const SizedBox(height: 28),
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => const AiScentStudioScreen()),
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              color: _dark,
              child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.science_outlined,
                        size: 15, color: _gold),
                    SizedBox(width: 8),
                    Text('AI SCENT STUDIO 열기',
                        style: TextStyle(
                            fontSize: 12,
                            letterSpacing: 3,
                            color: _gold)),
                  ]),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
                border: Border.all(color: _gold.withOpacity(0.4))),
            child: const Text('향 조합하기 · AI 소믈리에 · AI 조향사',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 9,
                    letterSpacing: 2,
                    color: _gold,
                    fontStyle: FontStyle.italic)),
          ),
        ]),
      ),
    );
  }

  // ════════════════ 탭 2: AI 조향 ═════════════════════════════

  Widget _buildAiTab() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('AI SCENT STUDIO',
              style: TextStyle(
                  fontSize: 9,
                  letterSpacing: 5,
                  color: _gold,
                  fontStyle: FontStyle.italic)),
          const SizedBox(height: 16),
          Icon(Icons.auto_awesome_outlined,
              size: 56, color: _gold.withOpacity(0.35)),
          const SizedBox(height: 20),
          const Text('AI 소믈리에 + AI 조향사',
              style: TextStyle(
                  fontSize: 18,
                  letterSpacing: 2,
                  color: _dark,
                  fontWeight: FontWeight.w300)),
          const SizedBox(height: 10),
          const Text(
            '이미지로 향수를 추천받거나\nAI 조향사와 대화로 나만의 향수를 설계하세요.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 12,
                color: _grey,
                height: 1.7,
                fontStyle: FontStyle.italic),
          ),
          const SizedBox(height: 28),
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => const AiScentStudioScreen()),
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              color: _dark,
              child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.auto_awesome_outlined,
                        size: 15, color: _gold),
                    SizedBox(width: 8),
                    Text('AI SCENT STUDIO 열기',
                        style: TextStyle(
                            fontSize: 12,
                            letterSpacing: 3,
                            color: _gold)),
                  ]),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
                border: Border.all(color: _gold.withOpacity(0.4))),
            child: const Text(
                'Gemini Vision · Claude Chat · My Scent Lab',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 9,
                    letterSpacing: 2,
                    color: _gold,
                    fontStyle: FontStyle.italic)),
          ),
        ]),
      ),
    );
  }

  // ── 공통 ──────────────────────────────────────────────────────
  Widget _emptyState(IconData icon, String msg) => Center(
    child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 56, color: _gold.withOpacity(0.3)),
        const SizedBox(height: 20),
        Text(msg,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 13,
                color: _grey,
                height: 1.7,
                fontStyle: FontStyle.italic)),
      ]),
    ),
  );
}