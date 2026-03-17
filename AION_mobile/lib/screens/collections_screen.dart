import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

const _gold = Color(0xFFC9A961);
const _darkDeep = Color(0xFF1A0C04);
const _bg = Color(0xFFF5EDE0);

const _spinePalettes = [
  {'bg': Color(0xFF4A2C10), 'accent': Color(0xFFC9A961)},
  {'bg': Color(0xFF2E1A06), 'accent': Color(0xFFD4A853)},
  {'bg': Color(0xFF5C3518), 'accent': Color(0xFFE0C070)},
  {'bg': Color(0xFF3A2410), 'accent': Color(0xFFB8954F)},
  {'bg': Color(0xFF6B3F1E), 'accent': Color(0xFFF0D080)},
  {'bg': Color(0xFF4F3015), 'accent': Color(0xFFC9A961)},
  {'bg': Color(0xFF382010), 'accent': Color(0xFFDDB870)},
  {'bg': Color(0xFF5A3820), 'accent': Color(0xFFCFAA4A)},
];

class CollectionsScreen extends StatefulWidget {
  const CollectionsScreen({super.key});
  @override
  State<CollectionsScreen> createState() => _CollectionsScreenState();
}

class _CollectionsScreenState extends State<CollectionsScreen> {
  List<Map<String, dynamic>> _perfumes = [];
  bool _loading = true;
  bool _isFetchingMore = false;
  bool _hasMore = true;
  int _page = 0;
  static const int _pageSize = 20;

  Map<String, dynamic>? _selected;
  Map<String, List<String>> _notes = {'top': [], 'middle': [], 'base': []};
  bool _loadingNotes = false;
  final Map<int, Map<String, List<String>>> _notesCache = {};

  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);
    _fetchPerfumes(reset: true);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isFetchingMore && _hasMore) {
        _fetchPerfumes();
      }
    }
  }

  Future<void> _fetchPerfumes({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _page = 0;
        _hasMore = true;
        _perfumes = [];
      });
    } else {
      if (_isFetchingMore || !_hasMore) return;
      setState(() => _isFetchingMore = true);
    }

    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/perfumes?page=$_page&size=$_pageSize'),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));

        List items = [];
        bool isLast = true;

        if (data is List) {
          items = data;
          isLast = items.length < _pageSize;
        } else if (data is Map) {
          // Spring Page 응답 구조
          if (data['content'] is List) {
            items = data['content'];
            isLast = data['last'] == true || items.length < _pageSize;
          } else if (data['data'] is Map && data['data']['content'] is List) {
            items = data['data']['content'];
            isLast = data['data']['last'] == true || items.length < _pageSize;
          } else if (data['data'] is List) {
            items = data['data'];
            isLast = items.length < _pageSize;
          }
        }

        if (mounted) {
          setState(() {
            _perfumes.addAll(items.cast<Map<String, dynamic>>());
            _hasMore = !isLast;
            if (_hasMore) _page++;
          });
        }
      }
    } catch (e) {
      debugPrint('향수 로드 오류: $e');
    } finally {
      if (mounted) setState(() { _loading = false; _isFetchingMore = false; });
    }
  }

  Future<void> _fetchNotes(int perfumeId) async {
    if (_notesCache.containsKey(perfumeId)) {
      setState(() => _notes = _notesCache[perfumeId]!);
      return;
    }
    setState(() { _loadingNotes = true; _notes = {'top': [], 'middle': [], 'base': []}; });
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/collections/perfumes/$perfumeId/notes'));
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        final nd = data['data'] as Map<String, dynamic>? ?? {};
        final notes = {
          'top': List<String>.from(nd['top'] ?? []),
          'middle': List<String>.from(nd['middle'] ?? []),
          'base': List<String>.from(nd['base'] ?? []),
        };
        _notesCache[perfumeId] = notes;
        if (mounted) setState(() => _notes = notes);
      }
    } catch (_) {}
    finally { if (mounted) setState(() => _loadingNotes = false); }
  }

  Future<void> _toggleWishlist() async {
    if (_selected == null) return;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    if (token.isEmpty) { if (mounted) Navigator.pushNamed(context, '/login'); return; }
    final id = _selected!['perfumeId'] ?? _selected!['perfume_id'];
    try {
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/wishlist/toggle'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'perfumeId': id}),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('위시리스트에 추가되었습니다', style: TextStyle(color: _gold)),
            backgroundColor: _darkDeep,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {}
  }

  Future<void> _addToCart() async {
    if (_selected == null) return;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    if (token.isEmpty) { if (mounted) Navigator.pushNamed(context, '/login'); return; }
    final id = _selected!['perfumeId'] ?? _selected!['perfume_id'];
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/add'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'perfumeId': id, 'quantity': 1}),
      );
      if (res.statusCode == 200 && mounted) Navigator.pushNamed(context, '/cart');
    } catch (_) {}
  }

  void _selectPerfume(Map<String, dynamic> p) {
    final id = p['perfumeId'] ?? p['perfume_id'];
    final selId = _selected != null ? (_selected!['perfumeId'] ?? _selected!['perfume_id']) : null;
    if (id != null && id == selId) {
      setState(() { _selected = null; _notes = {'top': [], 'middle': [], 'base': []}; });
    } else {
      setState(() => _selected = p);
      if (id != null) _fetchNotes(id as int);
    }
  }

  String _formatPrice(Map<String, dynamic> p) {
    final saleRate = p['saleRate'] ?? p['sale_rate'] ?? 0;
    final salePrice = p['salePrice'] ?? p['sale_price'];
    final price = p['price'];
    if (saleRate > 0 && salePrice != null) return '₩${_numFmt(salePrice)}';
    return price != null ? '₩${_numFmt(price)}' : '-';
  }

  String _numFmt(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(
      backgroundColor: _bg,
      body: Center(child: CircularProgressIndicator(color: _gold)),
    );

    return Scaffold(
      backgroundColor: _bg,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverAppBar(
            backgroundColor: _darkDeep,
            pinned: true,
            expandedHeight: 240,
            flexibleSpace: FlexibleSpaceBar(
              background: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _selected != null
                    ? _buildOverlay()
                    : _buildEmptyOverlay(),
              ),
              title: _selected == null
                  ? const Text(
                      'FRAGRANCE LIBRARY',
                      style: TextStyle(
                        color: _gold,
                        fontSize: 9,
                        letterSpacing: 3,
                      ),
                    )
                  : null,
              centerTitle: true,
            ),
          ),
          SliverToBoxAdapter(child: _buildShelfHeader()),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate(
                (ctx, i) => _buildSpineBook(_perfumes[i], i),
                childCount: _perfumes.length,
              ),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                childAspectRatio: 0.38,
                crossAxisSpacing: 1,
                mainAxisSpacing: 0,
              ),
            ),
          ),
          // 추가 로딩 인디케이터
          if (_isFetchingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(
                  child: SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5),
                  ),
                ),
              ),
            ),
          // 마지막 도달 표시
          if (!_hasMore && _perfumes.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(0, 12, 0, 80),
                child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(width: 40, height: 0.5, color: const Color(0xFF8B6030).withOpacity(0.4)),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: Text('✦', style: TextStyle(color: Color(0xFF8B6030), fontSize: 10)),
                  ),
                  Container(width: 40, height: 0.5, color: const Color(0xFF8B6030).withOpacity(0.4)),
                ]),
              ),
            ),
        ],
      ),
    );
  }

  // ... (나머지 위젯 메서드들은 동일)
  Widget _buildEmptyOverlay() {
    return Container(
      color: _darkDeep,
      child: Center(
        child: Text(
          '아래 향수를 선택하세요',
          style: TextStyle(
            fontSize: 11, letterSpacing: 4,
            color: const Color(0xFF3D2010).withOpacity(0.5),
            fontStyle: FontStyle.italic,
          ),
        ),
      ),
    );
  }

  Widget _buildOverlay() {
    final p = _selected!;
    final thumbnail = p['thumbnail'] ?? p['imageUrl'];
    final name = p['name'] ?? '';
    final brand = p['brandName'] ?? p['brand_name'] ?? (p['brand'] is Map ? p['brand']['brandName'] : '') ?? '';
    final price = _formatPrice(p);
    return Container(
      color: _darkDeep,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (thumbnail != null)
            Positioned(
              left: 12, top: 56, bottom: 50, width: 80,
              child: Image.network(thumbnail, fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const SizedBox()),
            ),
          Positioned(
            left: 104, top: 60, right: 100,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (brand.toString().isNotEmpty)
                  Text(brand.toString().toUpperCase(),
                      style: TextStyle(fontSize: 8, letterSpacing: 3, color: _gold.withOpacity(0.7))),
                const SizedBox(height: 3),
                Text(name,
                    style: const TextStyle(fontSize: 16, color: Color(0xFF3D1F08), fontWeight: FontWeight.w600, height: 1.2),
                    maxLines: 2),
                const SizedBox(height: 6),
                Text(price, style: const TextStyle(fontSize: 12, color: _gold, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          Positioned(
            right: 8, top: 60, bottom: 48, width: 88,
            child: _buildNotesPanel(),
          ),
          Positioned(
            bottom: 8, left: 104, right: 8,
            child: Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: _toggleWishlist,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 7),
                    decoration: BoxDecoration(
                        border: Border.all(color: _gold.withOpacity(0.6)),
                        color: Colors.white.withOpacity(0.08)),
                    child: const Text('WISH', textAlign: TextAlign.center,
                        style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 2)),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: GestureDetector(
                  onTap: _addToCart,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 7),
                    color: _gold,
                    child: const Text('BUY', textAlign: TextAlign.center,
                        style: TextStyle(color: Color(0xFF1A0C04), fontSize: 9, letterSpacing: 2, fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildNotesPanel() {
    if (_loadingNotes) {
      return const Center(child: SizedBox(width: 14, height: 14,
          child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)));
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        _noteRow('Top', _notes['top'] ?? []),
        const SizedBox(height: 3),
        Container(height: 0.5, color: _gold.withOpacity(0.2)),
        const SizedBox(height: 3),
        _noteRow('Mid', _notes['middle'] ?? []),
        const SizedBox(height: 3),
        Container(height: 0.5, color: _gold.withOpacity(0.2)),
        const SizedBox(height: 3),
        _noteRow('Base', _notes['base'] ?? []),
      ],
    );
  }

  Widget _noteRow(String label, List<String> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(
            fontSize: 7.5, color: Color(0xFF7A4A1E), letterSpacing: 2,
            fontStyle: FontStyle.italic, fontWeight: FontWeight.w600)),
        const SizedBox(height: 1),
        Text(
          items.isEmpty ? '—' : items.take(3).join(' · '),
          style: const TextStyle(fontSize: 8, color: Color(0xFF3D1F08), height: 1.4),
          maxLines: 2, overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildShelfHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(0, 20, 0, 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [_darkDeep, _bg],
        ),
      ),
      child: Column(
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(width: 32, height: 1,
                decoration: BoxDecoration(gradient: LinearGradient(
                    colors: [Colors.transparent, const Color(0xFF8B6030)]))),
            const Padding(padding: EdgeInsets.symmetric(horizontal: 8),
                child: Text('✦', style: TextStyle(color: Color(0xFF8B6030), fontSize: 10))),
            Container(width: 32, height: 1,
                decoration: BoxDecoration(gradient: LinearGradient(
                    colors: [const Color(0xFF8B6030), Colors.transparent]))),
          ]),
          const SizedBox(height: 6),
          Text('${_perfumes.length}개의 향수',
              style: TextStyle(fontSize: 10,
                  color: const Color(0xFF8B6030).withOpacity(0.6),
                  fontStyle: FontStyle.italic, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _buildSpineBook(Map<String, dynamic> p, int idx) {
    final pal = _spinePalettes[idx % _spinePalettes.length];
    final bg = pal['bg'] as Color;
    final accent = pal['accent'] as Color;
    final name = p['name'] ?? '';
    final id = p['perfumeId'] ?? p['perfume_id'];
    final selId = _selected != null ? (_selected!['perfumeId'] ?? _selected!['perfume_id']) : null;
    final isSelected = id != null && id == selId;

    return GestureDetector(
      onTap: () => _selectPerfume(p),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        transform: Matrix4.translationValues(0, isSelected ? -10 : 0, 0),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.centerLeft, end: Alignment.centerRight,
            colors: [
              Color.lerp(bg, Colors.black, 0.4)!, bg, bg,
              Color.lerp(bg, Colors.black, 0.3)!
            ],
            stops: const [0, 0.12, 0.88, 1],
          ),
          border: Border(
            left: BorderSide(color: accent.withOpacity(0.35), width: 1.5),
            right: BorderSide(color: Colors.black.withOpacity(0.5), width: 0.5),
            top: isSelected
                ? const BorderSide(color: _gold, width: 2)
                : BorderSide.none,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(color: _gold.withOpacity(0.25), blurRadius: 8, offset: const Offset(0, -3))
            else
              BoxShadow(color: Colors.black.withOpacity(0.4), blurRadius: 3, offset: const Offset(1, 2)),
          ],
        ),
        child: Stack(
          children: [
            Positioned(top: 6, left: 0, right: 0,
                child: Container(height: 0.5, color: accent.withOpacity(0.3))),
            Positioned(bottom: 0, left: 0, right: 0,
                child: Container(height: 1, color: accent.withOpacity(0.5))),
            Center(
              child: RotatedBox(
                quarterTurns: 1,
                child: Text(
                  name,
                  style: TextStyle(
                    fontSize: 7.5, color: accent, letterSpacing: 0.5, fontWeight: FontWeight.w500,
                    shadows: [Shadow(color: Colors.black.withOpacity(0.9), blurRadius: 3)],
                  ),
                  overflow: TextOverflow.ellipsis, maxLines: 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}