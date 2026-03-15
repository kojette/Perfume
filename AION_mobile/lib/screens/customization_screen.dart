import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF1A1A1A);
const _bg = Color(0xFFFAF8F3);
const _grey = Color(0xFF8B8278);
const _light = Color(0xFFF0ECE4);

class CustomizationScreen extends StatefulWidget {
  const CustomizationScreen({super.key});
  @override
  State<CustomizationScreen> createState() => _CustomizationScreenState();
}

class _CustomizationScreenState extends State<CustomizationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _designs = [];
  bool _loading = true;

  // 향 조합 관련
  List<Map<String, dynamic>> _allNotes = [];
  final Map<String, List<Map<String, dynamic>>> _selectedNotes = {
    'top': [], 'middle': [], 'base': [],
  };
  bool _loadingNotes = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchDesigns();
    _fetchAllNotes();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  Future<void> _fetchDesigns() async {
    setState(() => _loading = true);
    final token = await _getToken();
    if (token == null || token.isEmpty) { if (mounted) setState(() => _loading = false); return; }
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/designs'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() => _designs = List<Map<String, dynamic>>.from(json['data'] ?? []));
      }
    } catch (e) { debugPrint('디자인 로드 오류: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _fetchAllNotes() async {
    setState(() => _loadingNotes = true);
    try {
      final res = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/notes'));
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        final items = json['data'] as List? ?? json['content'] as List? ?? [];
        if (mounted) setState(() => _allNotes = items.cast<Map<String, dynamic>>());
      }
    } catch (_) {}
    finally { if (mounted) setState(() => _loadingNotes = false); }
  }

  Future<void> _deleteDesign(int designId) async {
    final token = await _getToken();
    if (token == null) return;
    try {
      final res = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/designs/$designId'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() => _designs.removeWhere((d) => d['designId'] == designId));
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
      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('장바구니에 담겼습니다', style: TextStyle(color: _gold)), backgroundColor: Color(0xFF1A1A1A)),
        );
      }
    } catch (_) {}
  }

  String _numFmt(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('CUSTOMIZING',
            style: TextStyle(color: _dark, fontSize: 11, letterSpacing: 4, fontWeight: FontWeight.w400)),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: _gold,
          indicatorWeight: 1,
          labelColor: _dark,
          unselectedLabelColor: _grey,
          labelStyle: const TextStyle(fontSize: 10, letterSpacing: 2),
          tabs: const [
            Tab(icon: Icon(Icons.local_drink_outlined, size: 18), text: '공병 디자인'),
            Tab(icon: Icon(Icons.water_drop_outlined, size: 18), text: '향 조합'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBottleTab(),
          _buildScentTab(),
        ],
      ),
    );
  }

  // ─── 공병 디자인 탭 ─────────────────────────────────────────────
  Widget _buildBottleTab() {
    return Column(
      children: [
        // 새 디자인 버튼
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
          child: GestureDetector(
            onTap: () async {
              final token = await _getToken();
              if (token == null && mounted) { Navigator.pushNamed(context, '/login'); return; }
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('에디터는 웹 버전에서 이용해 주세요', style: TextStyle(color: _gold)), backgroundColor: Color(0xFF1A1A1A)),
                );
              }
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                border: Border.all(color: _gold, width: 1.5),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add, color: _gold, size: 18),
                  const SizedBox(width: 8),
                  const Text('내 향수 디자인 추가', style: TextStyle(color: _gold, fontSize: 12, letterSpacing: 2)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // 디자인 목록
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: _gold))
              : _designs.isEmpty
                  ? _buildEmptyState('아직 저장된 디자인이 없습니다.\n위 버튼을 눌러 첫 번째 디자인을 만들어보세요.')
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.7,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: _designs.length,
                      itemBuilder: (_, i) => _buildDesignCard(_designs[i]),
                    ),
        ),
      ],
    );
  }

  Widget _buildDesignCard(Map<String, dynamic> design) {
    final preview = design['previewImageUrl'];
    final name = design['name'] ?? '';
    final price = design['totalPrice'] ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Column(
        children: [
          // 이미지
          Expanded(
            child: Container(
              color: _light,
              child: preview != null
                  ? Image.network(preview, fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Center(
                        child: Text('NO PREVIEW', style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 2)),
                      ))
                  : const Center(
                      child: Text('NO PREVIEW', style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 2)),
                    ),
            ),
          ),
          // 정보
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontSize: 13, color: _dark, fontWeight: FontWeight.w400),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Text('₩${_numFmt(price)}', style: const TextStyle(fontSize: 11, color: _gold)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _addToCart(design),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 7),
                          color: _dark,
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.shopping_bag_outlined, size: 12, color: Colors.white),
                              SizedBox(width: 4),
                              Text('CART', style: TextStyle(fontSize: 9, color: Colors.white, letterSpacing: 2)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    GestureDetector(
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                            title: const Text('삭제 확인', style: TextStyle(fontSize: 14)),
                            content: Text('\"$name\"을 삭제하시겠습니까?', style: const TextStyle(fontSize: 13)),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(context), child: const Text('취소')),
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  _deleteDesign(design['designId']);
                                },
                                child: const Text('삭제', style: TextStyle(color: Colors.red)),
                              ),
                            ],
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
                        decoration: BoxDecoration(border: Border.all(color: Colors.red.shade200)),
                        child: Icon(Icons.delete_outline, size: 14, color: Colors.red.shade300),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── 향 조합 탭 ─────────────────────────────────────────────────
  Widget _buildScentTab() {
    return _loadingNotes
        ? const Center(child: CircularProgressIndicator(color: _gold))
        : Column(
            children: [
              // 안내 배너
              Container(
                padding: const EdgeInsets.all(16),
                color: _gold.withOpacity(0.08),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: _gold, size: 16),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        '탑, 미들, 베이스 노트를 선택해 나만의 향을 조합하세요',
                        style: TextStyle(fontSize: 11, color: Color(0xFF5A3820), height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildNoteSection('top', 'TOP NOTE', '첫 향기'),
                      const SizedBox(height: 20),
                      _buildNoteSection('middle', 'MIDDLE NOTE', '핵심 향기'),
                      const SizedBox(height: 20),
                      _buildNoteSection('base', 'BASE NOTE', '잔향'),
                      const SizedBox(height: 32),
                      // 선택 요약
                      if (_anySelected()) _buildScentSummary(),
                    ],
                  ),
                ),
              ),
            ],
          );
  }

  bool _anySelected() {
    return _selectedNotes.values.any((list) => list.isNotEmpty);
  }

  Widget _buildNoteSection(String type, String title, String subtitle) {
    final selected = _selectedNotes[type]!;
    final allNotesForType = _allNotes.where((n) {
      final t = n['noteType'] ?? n['type'] ?? '';
      return t.toString().toUpperCase() == type.toUpperCase();
    }).toList();

    // noteType 필터링이 안 될 경우 전체 노트 표시
    final displayNotes = allNotesForType.isNotEmpty ? allNotesForType : _allNotes;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 헤더
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: _gold.withOpacity(0.15))),
            ),
            child: Row(
              children: [
                Container(
                  width: 3,
                  height: 20,
                  color: _gold,
                  margin: const EdgeInsets.only(right: 10),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 11, letterSpacing: 3, color: _dark, fontWeight: FontWeight.w500)),
                    Text(subtitle, style: const TextStyle(fontSize: 9, color: _grey, letterSpacing: 1)),
                  ],
                ),
                const Spacer(),
                Text('${selected.length}개 선택', style: TextStyle(fontSize: 10, color: _gold)),
              ],
            ),
          ),
          // 선택된 노트 표시
          if (selected.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: selected.map((n) {
                  final name = n['noteName'] ?? n['name'] ?? '';
                  return GestureDetector(
                    onTap: () => setState(() => selected.remove(n)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: _gold.withOpacity(0.15),
                        border: Border.all(color: _gold),
                      ),
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
          // 노트 목록
          if (displayNotes.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('노트 데이터를 불러올 수 없습니다',
                  style: TextStyle(fontSize: 12, color: _grey, fontStyle: FontStyle.italic)),
            )
          else
            Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: displayNotes.take(20).map((n) {
                  final name = n['noteName'] ?? n['name'] ?? '';
                  final isSelected = selected.any((s) => (s['noteId'] ?? s['id']) == (n['noteId'] ?? n['id']));
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          selected.removeWhere((s) => (s['noteId'] ?? s['id']) == (n['noteId'] ?? n['id']));
                        } else if (selected.length < 5) {
                          selected.add(n);
                        }
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? _dark : Colors.transparent,
                        border: Border.all(color: isSelected ? _dark : _grey.withOpacity(0.4)),
                      ),
                      child: Text(
                        name,
                        style: TextStyle(
                          fontSize: 11,
                          color: isSelected ? Colors.white : _dark.withOpacity(0.7),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScentSummary() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        border: Border.all(color: _gold.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('MY SCENT BLEND',
              style: TextStyle(fontSize: 10, letterSpacing: 4, color: _gold)),
          const SizedBox(height: 16),
          ..._selectedNotes.entries.where((e) => e.value.isNotEmpty).map((e) {
            final label = {'top': 'Top', 'middle': 'Middle', 'base': 'Base'}[e.key]!;
            final notes = e.value.map((n) => n['noteName'] ?? n['name'] ?? '').join(', ');
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 52,
                    child: Text(label,
                        style: TextStyle(fontSize: 10, color: _gold.withOpacity(0.7), fontStyle: FontStyle.italic)),
                  ),
                  Expanded(
                    child: Text(notes, style: const TextStyle(fontSize: 11, color: Colors.white70, height: 1.5)),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('향 조합이 저장되었습니다! 전문가가 검토 후 연락드립니다.', style: TextStyle(color: _gold)),
                    backgroundColor: Color(0xFF1A1A1A),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: _gold,
                foregroundColor: const Color(0xFF1A1A1A),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: const RoundedRectangleBorder(),
              ),
              child: const Text('향 조합 저장하기', style: TextStyle(fontSize: 12, letterSpacing: 2, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.local_drink_outlined, size: 56, color: _gold.withOpacity(0.3)),
            const SizedBox(height: 20),
            Text(msg,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: _grey, height: 1.7, fontStyle: FontStyle.italic)),
          ],
        ),
      ),
    );
  }
}
