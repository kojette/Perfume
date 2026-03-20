import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../services/api_service_extended.dart';

const _gold  = Color(0xFFC9A961);
const _dark  = Color(0xFF2A2620);
const _bg    = Color(0xFFFAF8F3);
const _grey  = Color(0xFF8B8278);
const _cream = Color(0xFFE8E2D6);

// ── 퀵 필터 이미지 경로 ─────────────────────────────────────────
// Hero 이미지와 동일 폴더 (assets/images/)
// pubspec.yaml에 반드시 등록:
//   flutter:
//     assets:
//       - assets/images/
const _filterImages = {
  '남성':     'assets/male.png',
  '여성':     'assets/female.png',
  '데이트':   'assets/date.png',
  '청량한':   'assets/cool.png',
  '봄/여름':  'assets/springsummer.png',
  '가을/겨울':'assets/fallwinter.png',
};

// ── 연령대 ──────────────────────────────────────────────────────
class _AgeGroup {
  final String id, label, en, range, symbol, desc, poem;
  final List<String> keywords, tags;
  final Color fromColor, toColor, accent, textColor;
  const _AgeGroup({
    required this.id, required this.label, required this.en,
    required this.range, required this.symbol, required this.desc,
    required this.keywords, required this.tags, required this.poem,
    required this.fromColor, required this.toColor,
    required this.accent, required this.textColor,
  });
}

const _ageGroups = [
  _AgeGroup(
    id:'10s', label:'10대', en:'TEENS', range:'15–19', symbol:'✦',
    desc:'청초하고 밝은 향', keywords:['플로럴','프루티','청량한'],
    tags:['플로럴','프루티','청량한','달콤한'],
    poem:'꽃이 피어나는 계절처럼,\n처음 맡는 향기가 세상을 물들인다',
    fromColor:Color(0xFFfce4ec), toColor:Color(0xFFf8bbd0),
    accent:Color(0xFFe91e8c), textColor:Color(0xFF880e4f),
  ),
  _AgeGroup(
    id:'20s', label:'20대', en:'TWENTIES', range:'20–29', symbol:'Ι',
    desc:'자유롭고 생동감 넘치는', keywords:['시트러스','아쿠아틱','머스크'],
    tags:['시트러스','아쿠아틱','머스크','청량한'],
    poem:'새벽 도시의 공기처럼,\n가능성으로 가득 찬 향기가 번져간다',
    fromColor:Color(0xFFe3f2fd), toColor:Color(0xFFbbdefb),
    accent:Color(0xFF1976d2), textColor:Color(0xFF0d47a1),
  ),
  _AgeGroup(
    id:'30s', label:'30대', en:'THIRTIES', range:'30–39', symbol:'ΙΙ',
    desc:'세련되고 깊이 있는', keywords:['우디','앰버','스파이시'],
    tags:['우디','앰버','스파이시','관능적인'],
    poem:'익어가는 포도주처럼,\n시간이 빚어낸 향기가 공간을 채운다',
    fromColor:Color(0xFFfff3e0), toColor:Color(0xFFffe0b2),
    accent:Color(0xFFf57c00), textColor:Color(0xFFe65100),
  ),
  _AgeGroup(
    id:'40s', label:'40대', en:'FORTIES', range:'40–49', symbol:'ΙΙΙ',
    desc:'클래식하고 우아한', keywords:['오리엔탈','파우더리','가죽'],
    tags:['오리엔탈','파우더리','가죽','클래식'],
    poem:'고전 음악의 선율처럼,\n세월이 담긴 향기가 품격을 말한다',
    fromColor:Color(0xFFf3e5f5), toColor:Color(0xFFe1bee7),
    accent:Color(0xFF7b1fa2), textColor:Color(0xFF4a148c),
  ),
  _AgeGroup(
    id:'50s', label:'50대+', en:'FIFTIES+', range:'50+', symbol:'IV',
    desc:'기품 있고 고혹적인', keywords:['바닐라','샌달우드','로즈'],
    tags:['바닐라','샌달우드','로즈','우아한'],
    poem:'깊은 밤 향나무 연기처럼,\n오래된 것들의 아름다움이 깃들다',
    fromColor:Color(0xFFefebe9), toColor:Color(0xFFd7ccc8),
    accent:Color(0xFF5d4037), textColor:Color(0xFF3e2723),
  ),
];

// ── 퀵 필터 ──────────────────────────────────────────────────────
class _QF {
  final String label, en, type;
  final dynamic value;
  const _QF({required this.label, required this.en, required this.type, required this.value});
}

const _quickFilters = [
  _QF(label:'남성',    en:'MAN',    type:'gender', value:'MALE'),
  _QF(label:'여성',    en:'WOMAN',  type:'gender', value:'FEMALE'),
  _QF(label:'데이트',  en:'DATE',   type:'tags',   value:'데이트'),
  _QF(label:'청량한',  en:'FRESH',  type:'tags',   value:'청량한'),
  _QF(label:'봄/여름', en:'SPRING', type:'tags',   value:'플로럴'),
  _QF(label:'가을/겨울',en:'AUTUMN',type:'tags',   value:'우디'),
];

// ════════════════════════════════════════════════════════════════
class RecommendScreen extends StatefulWidget {
  const RecommendScreen({super.key});
  @override
  State<RecommendScreen> createState() => _RecommendScreenState();
}

class _RecommendScreenState extends State<RecommendScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;

  List<Map<String, dynamic>> _perfumes = [];
  bool    _loading = true;
  String? _error;

  final _searchCtrl = TextEditingController();
  final _tagCtrl    = TextEditingController();
  List<String> _selectedTags   = [];
  String       _selectedGender = '';
  String       _sortBy         = 'latest';
  Timer?       _debounce;

  Map<String, List<Map<String, dynamic>>> _ageData    = {};
  bool                                    _ageLoading = false;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _tabCtrl.addListener(() {
      if (_tabCtrl.index == 1 && _ageData.isEmpty) _fetchAgeGroupData();
    });
    _loadPerfumes();
  }

  @override
  void dispose() {
    _tabCtrl.dispose(); _searchCtrl.dispose(); _tagCtrl.dispose();
    _debounce?.cancel(); super.dispose();
  }

  Future<void> _loadPerfumes() async {
    setState(() { _loading = true; _error = null; });
    try {
      final items = await ApiService.fetchPerfumesRaw(
        search: _searchCtrl.text.trim().isEmpty ? null : _searchCtrl.text.trim(),
        tags: _selectedTags.isEmpty ? null : _selectedTags,
        gender: _selectedGender.isEmpty ? null : _selectedGender,
        sortBy: _sortBy, size: 100,
      );
      if (mounted) setState(() => _perfumes = items);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onFilterChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), _loadPerfumes);
  }

  Future<void> _fetchAgeGroupData() async {
    setState(() => _ageLoading = true);
    final result = <String, List<Map<String, dynamic>>>{};
    await Future.wait(_ageGroups.map((g) async {
      try {
        final res = await http.get(
            Uri.parse('${ApiConfig.baseUrl}/api/recommendations/age/${g.id}?limit=8'));
        if (res.statusCode == 200) {
          result[g.id] = (jsonDecode(utf8.decode(res.bodyBytes)) as List? ?? [])
              .cast<Map<String, dynamic>>();
          return;
        }
      } catch (_) {}
      try {
        result[g.id] = await ApiService.fetchPerfumesRaw(tags: g.tags, sortBy: 'rating', size: 8);
      } catch (_) { result[g.id] = []; }
    }));
    if (mounted) setState(() { _ageData = result; _ageLoading = false; });
  }

  void _handleQF(_QF f) {
    if (f.type == 'gender') {
      setState(() => _selectedGender = _selectedGender == f.value ? '' : f.value as String);
    } else {
      final tag = f.value as String;
      setState(() => _selectedTags.contains(tag)
          ? _selectedTags.remove(tag) : _selectedTags.add(tag));
    }
    _onFilterChanged();
  }

  bool _isActive(_QF f) =>
      f.type == 'gender' ? _selectedGender == f.value : _selectedTags.contains(f.value);

  void _addTag() {
    final tag = _tagCtrl.text.trim();
    if (tag.isNotEmpty && !_selectedTags.contains(tag)) {
      setState(() { _selectedTags.add(tag); _tagCtrl.clear(); });
      _onFilterChanged();
    }
  }

  void _resetFilters() {
    setState(() { _selectedGender = ''; _selectedTags = []; _searchCtrl.clear(); });
    _loadPerfumes();
  }

  void _goToCollections(Map<String, dynamic> p) =>
      Navigator.pushNamed(context, '/collections', arguments: p['id'] ?? p['perfumeId']);

  // ════════════════ BUILD ═══════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: NestedScrollView(
        headerSliverBuilder: (ctx, _) => [
          SliverAppBar(
            expandedHeight: 160, pinned: true,
            backgroundColor: const Color(0xFF1A1510),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(fit: StackFit.expand, children: [
                Container(color: const Color(0xFF1A1510)),
                Opacity(opacity: 0.08, child: CustomPaint(painter: _DotPainter())),
                Center(child: Text('RECOMMEND',
                  style: TextStyle(fontSize: MediaQuery.of(ctx).size.width * 0.18,
                      color: _gold.withOpacity(0.04), letterSpacing: 8, fontWeight: FontWeight.w900))),
                Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const SizedBox(height: 20),
                  Text('AION Parfums',
                      style: TextStyle(fontSize: 10, letterSpacing: 8, color: _gold.withOpacity(0.6))),
                  const SizedBox(height: 8),
                  const Text('RECOMMEND', style: TextStyle(fontSize: 28, letterSpacing: 12,
                      color: Colors.white, fontWeight: FontWeight.w300)),
                  const SizedBox(height: 8),
                  const _GoldDivider(),
                  const SizedBox(height: 8),
                  Text('당신을 위한 신화의 향',
                      style: TextStyle(fontSize: 11, letterSpacing: 3,
                          color: _gold.withOpacity(0.5), fontStyle: FontStyle.italic)),
                ]),
              ]),
            ),
            bottom: TabBar(
              controller: _tabCtrl,
              indicatorColor: _gold, indicatorWeight: 1.5,
              labelColor: _gold, unselectedLabelColor: Colors.white54,
              labelStyle: const TextStyle(fontSize: 10, letterSpacing: 4),
              tabs: const [
                Tab(text: '전체 추천'),
                Tab(child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text('연령별 추천', style: TextStyle(fontSize: 10, letterSpacing: 3)),
                  SizedBox(width: 4), _NewBadge(),
                ])),
              ],
            ),
          ),
        ],
        body: TabBarView(controller: _tabCtrl,
            children: [_buildAllTab(), _buildAgeTab()]),
      ),
    );
  }

  // ── 전체 추천 탭 ─────────────────────────────────────────────

  Widget _buildAllTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _label('QUICK FILTER'), const SizedBox(height: 10),
        _buildQuickFilters(), const SizedBox(height: 16),
        // 검색 + 정렬
        Row(children: [
          Expanded(child: TextField(
            controller: _searchCtrl, onChanged: (_) => _onFilterChanged(),
            decoration: InputDecoration(
              hintText: '향수명, 브랜드 검색',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.black26),
              prefixIcon: const Icon(Icons.search, color: _grey, size: 18),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              border: OutlineInputBorder(borderSide: BorderSide(color: _cream)),
              focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: _gold)),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: _cream)),
            ),
            style: const TextStyle(fontSize: 13),
          )),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(border: Border.all(color: _cream)),
            child: DropdownButtonHideUnderline(child: DropdownButton<String>(
              value: _sortBy, padding: const EdgeInsets.symmetric(horizontal: 10),
              style: const TextStyle(fontSize: 12, color: _dark),
              items: const [
                DropdownMenuItem(value: 'latest',     child: Text('최신순')),
                DropdownMenuItem(value: 'price-low',  child: Text('낮은가격')),
                DropdownMenuItem(value: 'price-high', child: Text('높은가격')),
                DropdownMenuItem(value: 'rating',     child: Text('인기순')),
              ],
              onChanged: (v) { if (v != null) { setState(() => _sortBy = v); _loadPerfumes(); } },
            )),
          ),
        ]),
        const SizedBox(height: 12),
        _label('PREFERENCE TAGS'), const SizedBox(height: 8),
        _buildTagInput(), const SizedBox(height: 12),
        if (_selectedGender.isNotEmpty || _selectedTags.isNotEmpty) ...[
          _buildActiveChips(), const SizedBox(height: 12),
        ],
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          _label('SCENTS FOR YOU'),
          Text('${_perfumes.length}개의 향수',
              style: const TextStyle(fontSize: 11, color: _grey, fontStyle: FontStyle.italic)),
        ]),
        const SizedBox(height: 10),
        _buildResults(),
      ],
    );
  }

  // ── 퀵 필터 (이미지 배경 버튼, 프론트 동일) ─────────────────
  Widget _buildQuickFilters() {
    return GridView.count(
      crossAxisCount: 3, childAspectRatio: 1.6,
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 8, mainAxisSpacing: 8,
      children: _quickFilters.map((f) {
        final active  = _isActive(f);
        final imgPath = _filterImages[f.label];
        return GestureDetector(
          onTap: () => _handleQF(f),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              border: Border.all(color: active ? _gold : _cream, width: active ? 2 : 1),
            ),
            child: Stack(fit: StackFit.expand, children: [
              // 배경 이미지
              if (imgPath != null)
                Opacity(
                  opacity: active ? 0.55 : 0.35,
                  child: Image.asset(imgPath, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          Container(color: active ? const Color(0xFF2A2620) : const Color(0xFFF0ECE4))),
                )
              else
                Container(color: active ? const Color(0xFF2A2620) : const Color(0xFFF0ECE4)),

              // 하단 다크 그라디언트
              Container(decoration: BoxDecoration(gradient: LinearGradient(
                begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(active ? 0.72 : 0.55),
                ],
                stops: const [0.35, 1.0],
              ))),

              // 활성 인너 테두리
              if (active)
                Container(decoration: BoxDecoration(border: Border.all(color: _gold, width: 2))),

              // 텍스트
              Positioned(
                bottom: 8, left: 0, right: 0,
                child: Column(children: [
                  Text(f.label, textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, letterSpacing: 1,
                          fontWeight: FontWeight.w500,
                          color: active ? _gold : Colors.white.withOpacity(0.92))),
                  Text(f.en, textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 8, letterSpacing: 3,
                          color: active ? _gold.withOpacity(0.8) : Colors.white.withOpacity(0.55))),
                ]),
              ),
            ]),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTagInput() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
      padding: const EdgeInsets.all(10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (_selectedTags.isNotEmpty) ...[
          Wrap(spacing: 6, runSpacing: 6,
              children: _selectedTags.map((tag) => GestureDetector(
                onTap: () { setState(() => _selectedTags.remove(tag)); _onFilterChanged(); },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(border: Border.all(color: _gold),
                      color: _gold.withOpacity(0.05)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Text('#$tag', style: const TextStyle(fontSize: 11, color: _gold)),
                    const SizedBox(width: 4),
                    const Icon(Icons.close, size: 10, color: _gold),
                  ]),
                ),
              )).toList()),
          const SizedBox(height: 8),
        ],
        Row(children: [
          Expanded(child: TextField(
            controller: _tagCtrl, onSubmitted: (_) => _addTag(),
            decoration: const InputDecoration(
              hintText: '태그 입력 후 엔터 (예: 플로럴, 우디)',
              hintStyle: TextStyle(fontSize: 12, color: Colors.black26),
              border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero,
            ),
            style: const TextStyle(fontSize: 13),
          )),
          GestureDetector(onTap: _addTag,
              child: const Icon(Icons.add_circle_outline, color: _gold, size: 20)),
        ]),
      ]),
    );
  }

  Widget _buildActiveChips() {
    return Wrap(spacing: 6, runSpacing: 6, children: [
      if (_selectedGender.isNotEmpty)
        _chip(_selectedGender == 'MALE' ? '남성' : '여성',
            () { setState(() => _selectedGender = ''); _onFilterChanged(); }),
      ..._selectedTags.map((t) => _chip('#$t',
          () { setState(() => _selectedTags.remove(t)); _onFilterChanged(); })),
      GestureDetector(onTap: _resetFilters,
          child: const Text('초기화', style: TextStyle(fontSize: 11, color: _grey,
              decoration: TextDecoration.underline))),
    ]);
  }

  Widget _chip(String label, VoidCallback onRemove) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    color: const Color(0xFF1A1510),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Text(label, style: const TextStyle(fontSize: 11, color: _gold)),
      const SizedBox(width: 4),
      GestureDetector(onTap: onRemove, child: const Icon(Icons.close, size: 10, color: _gold)),
    ]),
  );

  Widget _buildResults() {
    if (_loading) return const SizedBox(height: 200,
        child: Center(child: CircularProgressIndicator(color: _gold)));
    if (_error != null) return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(border: Border.all(color: _cream), color: Colors.white),
      child: Column(children: [
        Text(_error!, style: const TextStyle(color: _grey, fontSize: 13)),
        const SizedBox(height: 12),
        GestureDetector(onTap: _loadPerfumes,
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                decoration: BoxDecoration(border: Border.all(color: _gold)),
                child: const Text('다시 시도', style: TextStyle(color: _gold, fontSize: 12)))),
      ]),
    );
    if (_perfumes.isEmpty) return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(border: Border.all(color: _cream), color: Colors.white),
      child: const Column(children: [
        Text('?', style: TextStyle(fontSize: 40, color: Color(0xFFE8E2D6))),
        SizedBox(height: 12),
        Text('검색 결과가 없습니다', style: TextStyle(color: _grey, fontSize: 13)),
        Text('다른 키워드로 검색해보세요',
            style: TextStyle(color: Color(0xFFC0B8A8), fontSize: 11)),
      ]),
    );
    return ListView.separated(
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      itemCount: _perfumes.length,
      separatorBuilder: (_, __) => Divider(height: 1, color: _cream),
      itemBuilder: (_, i) => _PerfumeCard(
          perfume: _perfumes[i], onTap: () => _goToCollections(_perfumes[i])),
    );
  }

  // ── 연령별 탭 ────────────────────────────────────────────────

  Widget _buildAgeTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        Container(
          padding: const EdgeInsets.all(24), margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
          child: Column(children: [
            const Text('AGE-BASED CURATION',
                style: TextStyle(fontSize: 10, letterSpacing: 6, color: _gold)),
            const SizedBox(height: 8),
            const Text('연령별 맞춤 향수',
                style: TextStyle(fontSize: 20, color: Color(0xFF1A1510), letterSpacing: 4)),
            const SizedBox(height: 8), const _GoldDivider(), const SizedBox(height: 10),
            Text('삶의 단계마다 어울리는 향기가 있습니다.\n나이가 담긴 향기로 당신의 이야기를 완성하세요.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: _grey, fontStyle: FontStyle.italic, height: 1.7)),
          ]),
        ),
        ..._ageGroups.map((g) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _AgeSection(group: g, perfumes: _ageData[g.id] ?? [],
              loading: _ageLoading, onTap: _goToCollections),
        )),
        const SizedBox(height: 12), const _GoldDivider(), const SizedBox(height: 8),
        const Text('추천은 향수의 주요 특성과 연령대 선호도 데이터를 기반으로 제공됩니다',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, letterSpacing: 2, color: _grey, fontStyle: FontStyle.italic)),
      ],
    );
  }

  Widget _label(String t) =>
      Text(t, style: const TextStyle(fontSize: 9, letterSpacing: 5, color: _grey));
}

// ════════════════════════════════════════════════════════════════
// 공통 위젯
// ════════════════════════════════════════════════════════════════

class _GoldDivider extends StatelessWidget {
  const _GoldDivider();
  @override
  Widget build(BuildContext context) => Row(children: [
    Expanded(child: Container(height: 0.5, decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.transparent, _gold.withOpacity(0.4)])))),
    Container(margin: const EdgeInsets.symmetric(horizontal: 8),
        child: Text('◆', style: TextStyle(color: _gold.withOpacity(0.5), fontSize: 8))),
    Expanded(child: Container(height: 0.5, decoration: BoxDecoration(
        gradient: LinearGradient(colors: [_gold.withOpacity(0.4), Colors.transparent])))),
  ]);
}

class _NewBadge extends StatelessWidget {
  const _NewBadge();
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
    color: _gold.withOpacity(0.2),
    child: const Text('NEW', style: TextStyle(fontSize: 7, color: _gold, letterSpacing: 1)),
  );
}

class _PerfumeCard extends StatelessWidget {
  final Map<String, dynamic> perfume;
  final VoidCallback onTap;
  const _PerfumeCard({required this.perfume, required this.onTap});

  static String _fmt(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  @override
  Widget build(BuildContext context) {
    final name     = perfume['name'] ?? '';
    final nameEn   = perfume['nameEn'] ?? '';
    final brand    = perfume['brandName'] ?? '';
    final imageUrl = perfume['imageUrl'] ?? perfume['thumbnail'];
    final price    = perfume['price'] ?? 0;
    final origPrice= perfume['originalPrice'];
    final discRate = (perfume['discountRate'] ?? perfume['saleRate'] ?? 0) as int;
    final tags     = (perfume['tags'] as List? ?? []).cast<String>();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14), color: Colors.white,
        child: Row(children: [
          Container(width: 56, height: 56,
            decoration: const BoxDecoration(color: Color(0xFFF5F0E8)),
            child: imageUrl != null
                ? Image.network(imageUrl, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _ph(name))
                : _ph(name),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: const TextStyle(fontSize: 13, color: _dark,
                fontWeight: FontWeight.w500, letterSpacing: 1)),
            Text(nameEn.isNotEmpty ? nameEn : brand,
                style: const TextStyle(fontSize: 9, letterSpacing: 2,
                    color: _gold, fontStyle: FontStyle.italic)),
            const SizedBox(height: 4),
            Wrap(spacing: 4, children: tags.take(2).map((t) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: const Color(0xFFFAF8F3),
                  border: Border.all(color: _cream)),
              child: Text('#$t', style: const TextStyle(fontSize: 8, color: _grey)),
            )).toList()),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            if (discRate > 0 && origPrice != null)
              Text('₩${_fmt(origPrice)}', style: const TextStyle(fontSize: 9, color: _grey,
                  decoration: TextDecoration.lineThrough)),
            Text('₩${_fmt(price)}', style: const TextStyle(fontSize: 12, color: _gold,
                fontWeight: FontWeight.w600)),
          ]),
        ]),
      ),
    );
  }

  Widget _ph(String name) => Center(child: Text(name.isNotEmpty ? name[0] : '✦',
      style: TextStyle(fontSize: 18, color: _gold.withOpacity(0.4))));
}

class _AgeSection extends StatefulWidget {
  final _AgeGroup group;
  final List<Map<String, dynamic>> perfumes;
  final bool loading;
  final void Function(Map<String, dynamic>) onTap;
  const _AgeSection({required this.group, required this.perfumes,
      required this.loading, required this.onTap});
  @override
  State<_AgeSection> createState() => _AgeSectionState();
}

class _AgeSectionState extends State<_AgeSection> {
  bool _expanded = false;
  @override
  Widget build(BuildContext context) {
    final g = widget.group;
    final perfumes = widget.perfumes;
    final display = _expanded ? perfumes : perfumes.take(3).toList();
    return Container(
      decoration: BoxDecoration(border: Border.all(color: _cream), color: Colors.white),
      child: Column(children: [
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Container(
            decoration: BoxDecoration(gradient: LinearGradient(
                colors: [g.fromColor, g.toColor],
                begin: Alignment.topLeft, end: Alignment.bottomRight)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(children: [
              Container(width: 48, height: 48,
                decoration: BoxDecoration(shape: BoxShape.circle,
                    border: Border.all(color: g.accent, width: 1.5), color: Colors.white),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(g.label, style: TextStyle(fontSize: 11, color: g.accent, fontWeight: FontWeight.w600)),
                  Text(g.range, style: TextStyle(fontSize: 7, color: g.textColor, letterSpacing: 1)),
                ]),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(g.en, style: TextStyle(fontSize: 9, letterSpacing: 4, color: g.accent)),
                  const SizedBox(width: 6),
                  Text('— ${g.desc}', style: const TextStyle(fontSize: 9, color: _grey)),
                ]),
                const SizedBox(height: 4),
                Wrap(spacing: 4, children: g.keywords.map((kw) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.6),
                      border: Border.all(color: g.accent.withOpacity(0.3)),
                      borderRadius: BorderRadius.circular(20)),
                  child: Text(kw, style: TextStyle(fontSize: 9, color: g.textColor)),
                )).toList()),
              ])),
              Column(children: [
                Text('${perfumes.length}개', style: const TextStyle(fontSize: 10, color: _grey)),
                const SizedBox(height: 2),
                AnimatedRotation(turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(Icons.keyboard_arrow_down, color: g.accent, size: 18)),
              ]),
            ]),
          ),
        ),
        if (widget.loading)
          const Padding(padding: EdgeInsets.all(20),
              child: Center(child: SizedBox(width: 20, height: 20,
                  child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5))))
        else if (perfumes.isEmpty)
          Padding(padding: const EdgeInsets.all(20),
              child: Text('해당 연령대 추천 향수가 없습니다', textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: _grey, fontStyle: FontStyle.italic)))
        else ...[
          Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(g.poem, style: const TextStyle(fontSize: 11, color: _grey,
                  fontStyle: FontStyle.italic, height: 1.7, letterSpacing: 1))),
          const Divider(height: 1, color: Color(0xFFF0EBE0)),
          ...display.map((p) => Column(children: [
            _PerfumeCard(perfume: p, onTap: () => widget.onTap(p)),
            const Divider(height: 1, color: Color(0xFFF0EBE0)),
          ])),
          if (perfumes.length > 3)
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Container(width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Text(_expanded ? '접기 ▲' : '${perfumes.length - 3}개 더 보기 ▼',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 10, letterSpacing: 2, color: _grey))),
            ),
        ],
      ]),
    );
  }
}

class _DotPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = _gold..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 32) {
      for (double y = 0; y < size.height; y += 32) {
        canvas.drawCircle(Offset(x, y), 1, p);
      }
    }
  }
  @override
  bool shouldRepaint(_) => false;
}
