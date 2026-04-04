import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
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

  int _activeMode = 0;    // 0=공병, 1=향조합, 2=AI

  // ── 공병 ────────────────────────────────────────────────────
  List<Map<String, dynamic>> _designs = [];
  bool _loading = true;

  // ── 향 조합 ─────────────────────────────────────────────────
  List<Map<String, dynamic>> _categories    = [];
  bool                       _loadingScents = true;
  String?                    _scentsError;
  final Map<String, List<Map<String, dynamic>>> _selected = {
    'top': [], 'middle': [], 'base': [],
  };
  bool _blendSaved = false;

  // ── 향 탭 검색 ───────────────────────────────────────────────
  final _scentSearchCtrl = TextEditingController();
  String _scentSearchQuery = '';

  // ── AI 소믈리에 (Gemini) ─────────────────────────────────────
  final _keywordCtrl   = TextEditingController();
  int  _aiSubTab       = 0;   // 0=키워드, 1=이미지
  File? _pickedImage;
  Map<String, dynamic>? _geminiResult;
  bool _geminiLoading  = false;
  String? _geminiError;

  // ── AI 조향사 (Claude) ────────────────────────────────────────
  final List<Map<String, String>> _chatMessages = [];
  final _chatCtrl   = TextEditingController();
  bool  _chatLoading = false;
  Map<String, dynamic>? _recipe;
  bool  _recipeLoading = false;
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchDesigns();
    _fetchScents();
    _scentSearchCtrl.addListener(() {
      setState(() => _scentSearchQuery = _scentSearchCtrl.text.toLowerCase());
    });
    // Claude 초기 메시지
    _chatMessages.add({
      'role': 'assistant',
      'content': '안녕하세요. 저는 AI 조향사입니다. ✦\n\n어떤 향수를 만들고 싶으신가요? 평소 좋아하는 향이나 오늘의 기분을 말씀해주세요.',
    });
  }

  @override
  void dispose() {
    _scentSearchCtrl.dispose();
    _keywordCtrl.dispose();
    _chatCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  // ── API 헬퍼 ────────────────────────────────────────────────

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
        if (mounted) setState(() => _scentsError = '향 재료 목록을 불러오지 못했습니다.');
      }
    } catch (e) {
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
    try {
      final items = _selected.entries.expand((e) {
        return e.value.map((ing) => {
          'ingredientId': ing['ingredientId'],
          'type': e.key.toUpperCase(),
        });
      }).toList();
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'ingredients': items}),
      );
    } catch (_) {}
    setState(() => _blendSaved = true);
    _snack('향 조합이 저장되었습니다!');
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _blendSaved = false);
  }

  // ── Gemini AI 분석 ──────────────────────────────────────────

  Future<void> _analyzeKeyword() async {
    final q = _keywordCtrl.text.trim();
    if (q.isEmpty) { _snack('키워드를 입력해주세요'); return; }
    setState(() { _geminiLoading = true; _geminiResult = null; _geminiError = null; });
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/ai/keyword-search'),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: jsonEncode({'query': q}),
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() => _geminiResult = json['data'] ?? json);
      } else {
        if (mounted) setState(() => _geminiError = '분석 실패 (${res.statusCode})');
      }
    } catch (e) {
      if (mounted) setState(() => _geminiError = '네트워크 오류: $e');
    }
    finally { if (mounted) setState(() => _geminiLoading = false); }
  }

  Future<void> _analyzeImage() async {
    if (_pickedImage == null) { _snack('이미지를 선택해주세요'); return; }
    setState(() { _geminiLoading = true; _geminiResult = null; _geminiError = null; });
    try {
      final req = http.MultipartRequest(
        'POST', Uri.parse('${ApiConfig.baseUrl}/api/ai/image-to-scent'));
      req.files.add(await http.MultipartFile.fromPath('image', _pickedImage!.path));
      final streamed = await req.send();
      final res = await http.Response.fromStream(streamed);
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() => _geminiResult = json['data'] ?? json);
      } else {
        if (mounted) setState(() => _geminiError = '분석 실패 (${res.statusCode})');
      }
    } catch (e) {
      if (mounted) setState(() => _geminiError = '네트워크 오류: $e');
    }
    finally { if (mounted) setState(() => _geminiLoading = false); }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked != null && mounted) {
      setState(() { _pickedImage = File(picked.path); _geminiResult = null; });
    }
  }

  // ── Claude 채팅 ─────────────────────────────────────────────

  Future<void> _sendChat() async {
    final text = _chatCtrl.text.trim();
    if (text.isEmpty || _chatLoading) return;
    _chatCtrl.clear();

    // 사용 가능한 재료 목록 추출 (top 20)
    final allIngredients = _categories
        .expand((cat) => (cat['ingredients'] as List? ?? []).cast<Map>())
        .map((i) => i['name']?.toString() ?? '')
        .where((s) => s.isNotEmpty)
        .take(20)
        .toList();

    setState(() {
      _chatMessages.add({'role': 'user', 'content': text});
      _chatMessages.add({'role': 'assistant', 'content': ''});  // placeholder
      _chatLoading = true;
    });
    _scrollToBottom();

    try {
      // SSE 스트리밍: Flutter에서는 http.Client로 처리
      final client = http.Client();
      final request = http.Request('POST', Uri.parse('${ApiConfig.baseUrl}/api/ai/claude-blend'));
      request.headers['Content-Type'] = 'application/json; charset=utf-8';
      request.body = jsonEncode({
        'messages': _chatMessages.where((m) => m['content']!.isNotEmpty).take(_chatMessages.length - 1).toList(),
        'availableIngredients': allIngredients,
      });

      final streamed = await client.send(request);
      final stream = streamed.stream.transform(utf8.decoder);

      await for (final chunk in stream) {
        // SSE 라인 파싱
        for (final line in chunk.split('\n')) {
          if (!line.startsWith('data:')) continue;
          final data = line.substring(5).trim();
          try {
            final json = jsonDecode(data);
            final delta = json['delta'] as String? ?? '';
            if (delta.isNotEmpty && mounted) {
              setState(() {
                final last = _chatMessages.last;
                _chatMessages[_chatMessages.length - 1] = {
                  'role': 'assistant',
                  'content': (last['content'] ?? '') + delta,
                };
              });
              _scrollToBottom();
            }
          } catch (_) {}
        }
      }
      client.close();
    } catch (e) {
      if (mounted) {
        setState(() {
          _chatMessages[_chatMessages.length - 1] = {
            'role': 'assistant',
            'content': '오류가 발생했습니다. 다시 시도해주세요.',
          };
        });
      }
    }
    finally { if (mounted) setState(() => _chatLoading = false); }
  }

  Future<void> _generateRecipe() async {
    if (_chatMessages.length < 3) { _snack('조향사와 충분히 대화 후 생성해주세요'); return; }
    setState(() => _recipeLoading = true);
    final allIngredients = _categories
        .expand((cat) => (cat['ingredients'] as List? ?? []).cast<Map>())
        .map((i) => i['name']?.toString() ?? '')
        .where((s) => s.isNotEmpty).take(20).toList();
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/ai/claude-recipe'),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: jsonEncode({'messages': _chatMessages, 'availableIngredients': allIngredients}),
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() => _recipe = json['data'] ?? json);
      }
    } catch (_) { _snack('레시피 생성에 실패했습니다'); }
    finally { if (mounted) setState(() => _recipeLoading = false); }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
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

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(child: Column(children: [
        _buildHeader(),
        _buildTabSwitcher(),
        Expanded(child: IndexedStack(
          index: _activeMode,
          children: [
            _buildBottleTab(),
            _buildScentTab(),
            _buildAiTab(),
          ],
        )),
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
            Text(label, style: TextStyle(fontSize: 9, letterSpacing: 0.8,
                color: active ? _gold : _grey)),
          ]),
        ),
      ),
    );
  }

  // ════════════════ 공병 탭 ════════════════════════════════════

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

  // ════════════════ 향 조합 탭 (검색 추가) ════════════════════

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
          child: const Column(children: [
            Text('MY SCENT LAB',
                style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold)),
            SizedBox(height: 4),
            Text('원하는 향을 조합하세요',
                style: TextStyle(fontSize: 14, color: _dark, letterSpacing: 2)),
            SizedBox(height: 4),
            Text('각 계열별 최대 5개 선택',
                style: TextStyle(fontSize: 11, color: _grey, fontStyle: FontStyle.italic)),
          ]),
        ),
        const SizedBox(height: 12),

        // ── 재료 검색 (추가된 기능) ─────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _cream),
          ),
          child: Row(children: [
            const Icon(Icons.search, size: 16, color: _grey),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _scentSearchCtrl,
                style: const TextStyle(fontSize: 13, color: _dark),
                decoration: const InputDecoration(
                  hintText: '재료 이름 검색 (예: 로즈, 베르가못)',
                  hintStyle: TextStyle(fontSize: 12, color: _grey),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ),
            if (_scentSearchQuery.isNotEmpty)
              GestureDetector(
                onTap: () { _scentSearchCtrl.clear(); setState(() => _scentSearchQuery = ''); },
                child: const Icon(Icons.close, size: 16, color: _grey),
              ),
          ]),
        ),
        const SizedBox(height: 12),

        // 검색 결과 or 일반 노트 섹션
        if (_scentSearchQuery.isNotEmpty)
          _buildSearchResults()
        else ...[
          _buildNoteSection('top',    'TOP NOTE',    '첫인상 · 15–30분'),
          const SizedBox(height: 12),
          _buildNoteSection('middle', 'MIDDLE NOTE', '핵심 · 2–4시간'),
          const SizedBox(height: 12),
          _buildNoteSection('base',   'BASE NOTE',   '잔향 · 4시간+'),
        ],
        const SizedBox(height: 20),
        if (_selected.values.any((l) => l.isNotEmpty)) _buildBlendSummary(),
      ]),
    );
  }

  // 검색 결과 위젯 (검색어로 재료 필터링)
  Widget _buildSearchResults() {
    final allIngredients = _categories
        .expand((cat) {
          final catName = cat['categoryName'] ?? '';
          return (cat['ingredients'] as List? ?? [])
              .cast<Map<String, dynamic>>()
              .map((i) => {...i, 'categoryName': catName});
        })
        .where((i) => (i['name'] ?? '').toString().toLowerCase().contains(_scentSearchQuery))
        .toList();

    if (allIngredients.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
        child: Center(
          child: Text('"$_scentSearchQuery" 검색 결과가 없습니다',
              style: const TextStyle(fontSize: 12, color: _grey, fontStyle: FontStyle.italic)),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('검색 결과 ${allIngredients.length}개',
              style: TextStyle(fontSize: 9, letterSpacing: 2, color: _gold.withOpacity(0.8))),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8, runSpacing: 8,
            children: allIngredients.map((ing) {
              final name  = ing['name'] ?? '';
              final ingId = ing['ingredientId'];
              final isAnySelected = _selected.values.any(
                (l) => l.any((s) => s['ingredientId'] == ingId));
              final catLabel = ing['categoryName'] ?? '';

              return GestureDetector(
                onTap: () => _showNoteSelectionSheet(ing),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: isAnySelected ? _dark : Colors.transparent,
                    border: Border.all(color: isAnySelected ? _dark : _gold.withOpacity(0.4)),
                  ),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Text(name.toString(),
                        style: TextStyle(fontSize: 12,
                            color: isAnySelected ? _gold : _dark)),
                    Text(catLabel,
                        style: TextStyle(fontSize: 8, color: isAnySelected ? _gold.withOpacity(0.7) : _grey)),
                  ]),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // 검색 결과에서 재료 선택 시 Top/Middle/Base 시트
  void _showNoteSelectionSheet(Map<String, dynamic> ing) {
    final ingId = ing['ingredientId'];
    final name  = ing['name'] ?? '';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(0))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name.toString(),
              style: const TextStyle(fontSize: 16, color: _dark, letterSpacing: 2)),
          const SizedBox(height: 4),
          const Text('어느 노트에 추가할까요?',
              style: TextStyle(fontSize: 12, color: _grey)),
          const SizedBox(height: 20),
          Row(children: ['top', 'middle', 'base'].map((key) {
            final label = {'top': 'TOP', 'middle': 'MIDDLE', 'base': 'BASE'}[key]!;
            final isIn  = _selected[key]!.any((s) => s['ingredientId'] == ingId);
            final isFull = _selected[key]!.length >= 5;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    if (isIn) {
                      _selected[key]!.removeWhere((s) => s['ingredientId'] == ingId);
                    } else if (!isFull) {
                      _selected[key]!.add(ing);
                    }
                  });
                  Navigator.pop(context);
                },
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: isIn ? _dark : Colors.transparent,
                    border: Border.all(color: isIn ? _dark : _cream),
                  ),
                  child: Column(children: [
                    Text(label, style: TextStyle(fontSize: 11, letterSpacing: 2,
                        color: isIn ? _gold : _dark)),
                    if (isFull && !isIn)
                      const Text('가득참', style: TextStyle(fontSize: 9, color: _grey)),
                  ]),
                ),
              ),
            );
          }).toList()),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }

  Widget _buildNoteSection(String key, String title, String subtitle) {
    final sel = _selected[key]!;
    final allIngredients = _categories
        .expand((cat) => (cat['ingredients'] as List? ?? []).cast<Map<String, dynamic>>())
        .toList();

    return Container(
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
        ..._categories.map((cat) {
          final catName = cat['categoryName'] ?? '';
          final ingredients = (cat['ingredients'] as List? ?? []).cast<Map<String, dynamic>>();
          if (ingredients.isEmpty) return const SizedBox.shrink();
          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
              child: Text(catName, style: TextStyle(fontSize: 9, letterSpacing: 3,
                  color: _gold.withOpacity(0.8), fontStyle: FontStyle.italic)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: Wrap(spacing: 6, runSpacing: 6,
                children: ingredients.map((ing) {
                  final name  = ing['name'] ?? '';
                  final ingId = ing['ingredientId'];
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
                        border: Border.all(color: isSelected ? _dark : _grey.withOpacity(0.35)),
                      ),
                      child: Text(name,
                        style: TextStyle(fontSize: 11, letterSpacing: 0.5,
                            color: isSelected ? Colors.white : _dark.withOpacity(0.7))),
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
      const Text('MY SCENT BLEND', style: TextStyle(fontSize: 10, letterSpacing: 4, color: _gold)),
      const SizedBox(height: 14),
      ..._selected.entries.where((e) => e.value.isNotEmpty).map((e) {
        final label = {'top': 'Top', 'middle': 'Middle', 'base': 'Base'}[e.key]!;
        final notes = e.value.map((n) => n['name'] ?? '').join(', ');
        return Padding(padding: const EdgeInsets.only(bottom: 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 52, child: Text(label,
                style: TextStyle(fontSize: 10, color: _gold.withOpacity(0.7), fontStyle: FontStyle.italic))),
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

  // ════════════════ AI 탭 ══════════════════════════════════════

  Widget _buildAiTab() => DefaultTabController(
    length: 2,
    child: Column(children: [
      Container(
        color: Colors.white,
        child: TabBar(
          labelColor: _gold,
          unselectedLabelColor: _grey,
          indicatorColor: _gold,
          indicatorWeight: 1.5,
          labelStyle: const TextStyle(fontSize: 10, letterSpacing: 2),
          tabs: const [
            Tab(icon: Icon(Icons.image_search_outlined, size: 16), text: 'AI 소믈리에'),
            Tab(icon: Icon(Icons.chat_bubble_outline, size: 16), text: 'AI 조향사'),
          ],
        ),
      ),
      Expanded(child: TabBarView(children: [
        _buildGeminiSubTab(),
        _buildClaudeSubTab(),
      ])),
    ]),
  );

  // ── Gemini 서브탭 ─────────────────────────────────────────────

  Widget _buildGeminiSubTab() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // 모드 토글
      Container(
        decoration: BoxDecoration(border: Border.all(color: _cream)),
        child: Row(children: [
          _aiSubTabBtn(0, Icons.text_fields_outlined, '키워드'),
          Container(width: 0.5, color: _cream),
          _aiSubTabBtn(1, Icons.image_outlined, '이미지'),
        ]),
      ),
      const SizedBox(height: 16),

      if (_aiSubTab == 0) ...[
        const Text('DESCRIBE YOUR MOOD',
            style: TextStyle(fontSize: 9, letterSpacing: 4, color: _grey)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _keywordCtrl,
            maxLines: 3,
            style: const TextStyle(fontSize: 13, color: _dark),
            decoration: const InputDecoration(
              hintText: '예: "비 오는 날 카페에서 책 읽는 느낌"\n예: "깊은 숲속 새벽 안개"',
              hintStyle: TextStyle(fontSize: 12, color: _grey),
              border: InputBorder.none, isDense: true,
            ),
          ),
        ),
        const SizedBox(height: 8),
        // 예시 태그
        Wrap(spacing: 8, runSpacing: 6, children: [
          '봄 소풍 햇살', '도서관 오래된 책', '겨울 따뜻한 홍차', '재즈바 깊은 밤',
        ].map((ex) => GestureDetector(
          onTap: () => _keywordCtrl.text = ex,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(border: Border.all(color: _cream)),
            child: Text(ex, style: const TextStyle(fontSize: 10, color: _grey)),
          ),
        )).toList()),
        const SizedBox(height: 16),
        _geminiAnalyzeBtn(() => _analyzeKeyword()),
      ] else ...[
        const Text('UPLOAD YOUR IMAGE',
            style: TextStyle(fontSize: 9, letterSpacing: 4, color: _grey)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: _gold.withOpacity(0.3), width: 1.5),
            ),
            child: _pickedImage != null
                ? Stack(fit: StackFit.expand, children: [
                    Image.file(_pickedImage!, fit: BoxFit.cover),
                    Positioned(top: 8, right: 8,
                      child: GestureDetector(
                        onTap: () => setState(() => _pickedImage = null),
                        child: Container(
                          width: 28, height: 28,
                          color: Colors.white.withOpacity(0.9),
                          child: const Icon(Icons.close, size: 16, color: _grey),
                        ),
                      ),
                    ),
                  ])
                : const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.add_photo_alternate_outlined, color: _gold, size: 36),
                    SizedBox(height: 8),
                    Text('이미지 선택', style: TextStyle(fontSize: 12, color: _grey, letterSpacing: 2)),
                    SizedBox(height: 4),
                    Text('JPG, PNG · 최대 10MB', style: TextStyle(fontSize: 10, color: _cream)),
                  ]),
          ),
        ),
        const SizedBox(height: 16),
        _geminiAnalyzeBtn(() => _analyzeImage()),
      ],

      if (_geminiError != null)
        Padding(padding: const EdgeInsets.only(top: 8),
          child: Text(_geminiError!, style: const TextStyle(fontSize: 11, color: Colors.red))),

      if (_geminiResult != null) ...[
        const SizedBox(height: 20),
        _buildGeminiResult(_geminiResult!),
      ],
    ]),
  );

  Widget _aiSubTabBtn(int idx, IconData icon, String label) {
    final active = _aiSubTab == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() { _aiSubTab = idx; _geminiResult = null; }),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          color: active ? _dark : Colors.white,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 14, color: active ? _gold : _grey),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 10, color: active ? _gold : _grey)),
          ]),
        ),
      ),
    );
  }

  Widget _geminiAnalyzeBtn(VoidCallback onTap) => GestureDetector(
    onTap: _geminiLoading ? null : onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 15),
      color: _geminiLoading ? _cream : _dark,
      child: _geminiLoading
          ? const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              SizedBox(width: 16, height: 16,
                child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)),
              SizedBox(width: 10),
              Text('분석 중...', style: TextStyle(fontSize: 11, color: _grey, letterSpacing: 2)),
            ])
          : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.auto_awesome_outlined, color: _gold, size: 15),
              SizedBox(width: 8),
              Text('AI 향수 분석 시작', style: TextStyle(fontSize: 11, color: _gold, letterSpacing: 2)),
            ]),
    ),
  );

  Widget _buildGeminiResult(Map<String, dynamic> result) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // 무드 헤더
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        color: _dark,
        child: Column(children: [
          const Text('AI ANALYSIS', style: TextStyle(fontSize: 9, letterSpacing: 4, color: _gold)),
          const SizedBox(height: 8),
          Text(result['mood'] ?? '', style: const TextStyle(fontSize: 15, color: Colors.white, letterSpacing: 1)),
          const SizedBox(height: 8),
          Text(result['analysisText'] ?? '',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.white60, height: 1.6, fontStyle: FontStyle.italic)),
        ]),
      ),
      const SizedBox(height: 12),
      // 노트 구성
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        for (final entry in [
          {'label': 'TOP', 'desc': '15분', 'items': result['topNotes']},
          {'label': 'MIDDLE', 'desc': '2-4h', 'items': result['middleNotes']},
          {'label': 'BASE', 'desc': '4h+', 'items': result['baseNotes']},
        ]) Expanded(
          child: Container(
            margin: const EdgeInsets.only(right: 6),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(entry['label'] as String,
                  style: const TextStyle(fontSize: 8, letterSpacing: 2, color: _gold)),
              Text(entry['desc'] as String,
                  style: const TextStyle(fontSize: 8, color: _grey)),
              const SizedBox(height: 6),
              for (final n in (entry['items'] as List? ?? []))
                Padding(padding: const EdgeInsets.only(bottom: 3),
                  child: Text(n.toString(), style: const TextStyle(fontSize: 10, color: _dark))),
            ]),
          ),
        ),
      ]),
      const SizedBox(height: 12),
      // 추천 향수
      if ((result['recommendedPerfumes'] as List? ?? []).isNotEmpty) ...[
        const Text('RECOMMENDED', style: TextStyle(fontSize: 9, letterSpacing: 4, color: _grey)),
        const SizedBox(height: 8),
        for (final p in (result['recommendedPerfumes'] as List))
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
            child: Row(children: [
              Container(
                width: 48, height: 48, color: _light,
                child: p['imageUrl'] != null
                    ? Image.network(p['imageUrl'], fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const SizedBox())
                    : const SizedBox(),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p['name'] ?? '', style: const TextStyle(fontSize: 12, color: _dark)),
                Text(p['brand'] ?? '', style: const TextStyle(fontSize: 10, color: _gold, fontStyle: FontStyle.italic)),
                Text(p['matchReason'] ?? '', style: const TextStyle(fontSize: 9, color: _grey), maxLines: 1, overflow: TextOverflow.ellipsis),
              ])),
              Text('₩${_numFmt(p['price'] ?? 0)}', style: const TextStyle(fontSize: 11, color: _gold)),
            ]),
          ),
      ],
    ],
  );

  // ── Claude 서브탭 ─────────────────────────────────────────────

  Widget _buildClaudeSubTab() => Column(children: [
    // 레시피 버튼
    Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(children: [
        Expanded(child: Text(
          '조향사와 대화하며 나만의 향수를 설계해보세요',
          style: TextStyle(fontSize: 10, color: _grey.withOpacity(0.8), fontStyle: FontStyle.italic),
        )),
        GestureDetector(
          onTap: _recipeLoading ? null : _generateRecipe,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.5))),
            child: _recipeLoading
                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5))
                : const Text('조향지 생성', style: TextStyle(fontSize: 10, color: _gold, letterSpacing: 1)),
          ),
        ),
      ]),
    ),

    // 레시피 카드
    if (_recipe != null)
      Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
        padding: const EdgeInsets.all(14),
        color: _dark,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(_recipe!['perfumeName'] ?? '',
                style: const TextStyle(fontSize: 14, color: Colors.white, letterSpacing: 1)),
            GestureDetector(onTap: () => setState(() => _recipe = null),
              child: const Icon(Icons.close, size: 16, color: _grey)),
          ]),
          const SizedBox(height: 4),
          Text(_recipe!['concept'] ?? '',
              style: const TextStyle(fontSize: 10, color: _gold, fontStyle: FontStyle.italic)),
          const SizedBox(height: 12),
          for (final entry in [
            {'key': 'topNotes', 'label': 'TOP'},
            {'key': 'middleNotes', 'label': 'MIDDLE'},
            {'key': 'baseNotes', 'label': 'BASE'},
          ]) ...[
            Row(children: [
              SizedBox(width: 50, child: Text(entry['label']!,
                  style: TextStyle(fontSize: 9, color: _gold.withOpacity(0.6), letterSpacing: 2))),
              Expanded(child: Text(
                ((_recipe![entry['key']] as List? ?? [])
                    .map((n) => '${n['ingredientName']}(${(n['ratio']*100).round()}%)')
                    .join(' · ')),
                style: const TextStyle(fontSize: 10, color: Colors.white70),
              )),
            ]),
            const SizedBox(height: 4),
          ],
        ]),
      ),

    // 채팅 메시지 목록
    Expanded(
      child: ListView.builder(
        controller: _scrollCtrl,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        itemCount: _chatMessages.length,
        itemBuilder: (_, i) {
          final msg = _chatMessages[i];
          final isUser = msg['role'] == 'user';
          final isLast = i == _chatMessages.length - 1;
          final content = (msg['content'] ?? '').replaceAll(RegExp(r'<recipe>[\s\S]*?</recipe>'), '\n✦ [조향 레시피 포함됨]');
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isUser) ...[
                  Container(width: 26, height: 26, color: _dark,
                    child: const Center(child: Text('✦', style: TextStyle(color: _gold, fontSize: 10)))),
                  const SizedBox(width: 8),
                ],
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser ? _dark : Colors.white,
                      border: isUser ? null : Border.all(color: _cream),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Flexible(child: Text(content,
                          style: TextStyle(fontSize: 12, color: isUser ? Colors.white : _dark, height: 1.6))),
                        // 스트리밍 커서
                        if (_chatLoading && isLast && !isUser)
                          Container(width: 2, height: 14, color: _gold, margin: const EdgeInsets.only(left: 2)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    ),

    // 입력 바
    Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: _cream)),
      ),
      child: Row(children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _bg,
              border: Border.all(color: _cream),
            ),
            child: TextField(
              controller: _chatCtrl,
              maxLines: null,
              style: const TextStyle(fontSize: 13, color: _dark),
              decoration: const InputDecoration(
                hintText: '조향사와 대화해보세요...',
                hintStyle: TextStyle(fontSize: 12, color: _grey),
                border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero,
              ),
              onSubmitted: (_) => _sendChat(),
            ),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: _chatLoading ? null : _sendChat,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 42, height: 42,
            color: _chatLoading ? _cream : _dark,
            child: _chatLoading
                ? const Center(child: SizedBox(width: 14, height: 14,
                    child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)))
                : const Icon(Icons.send_rounded, color: _gold, size: 17),
          ),
        ),
      ]),
    ),
  ]);

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

  Widget _priceRow(String label, dynamic val) => Padding(
    padding: const EdgeInsets.only(bottom: 2),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(fontSize: 9, color: _grey)),
      Text('₩${_numFmt(val)}', style: const TextStyle(fontSize: 9, color: _grey)),
    ]),
  );
}
