import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'scent_card_widget.dart';

const _gold  = Color(0xFFC9A961);
const _dark  = Color(0xFF1A1A1A);
const _bg    = Color(0xFFFAF8F3);
const _grey  = Color(0xFF8B8278);
const _cream = Color(0xFFE8E2D6);

class _Conc {
  final String id, name, nameEn, desc;
  final int price;
  const _Conc(this.id, this.name, this.nameEn, this.price, this.desc);
}

const _concs = [
  _Conc('EDP',     '오 드 퍼퓸',   'EDP',     250000, '15~20% 향료, 6~8시간 지속'),
  _Conc('EDT',     '오 드 뚜왈렛', 'EDT',     235000, '5~15% 향료, 3~5시간 지속'),
  _Conc('EDC',     '오 드 코롱',   'EDC',     220000, '2~5% 향료, 2~3시간 지속'),
  _Conc('COLOGNE', '코롱',         'COLOGNE', 205000, '2~4% 향료, 1~2시간 지속'),
];

const _vols = [50, 60, 70, 80, 90, 100];

const _catColors = [
  Color(0xFFE8A0BF), Color(0xFFF5C542), Color(0xFF8B6F47),
  Color(0xFFA0B4C8), Color(0xFFE17055), Color(0xFFFD79A8),
  Color(0xFF55EFC4), Color(0xFF74B9FF), Color(0xFFFFEAA7),
  Color(0xFFB2835F), Color(0xFFDFE6E9), Color(0xFF636E72),
  Color(0xFF6D4C41), Color(0xFFB0C4DE), Color(0xFFA8E6CF),
];

class _Ing {
  final int id;
  final String name;
  final String? desc;
  final bool? isNatural;
  const _Ing(this.id, this.name, this.desc, this.isNatural);
}

class _Cat {
  final int id;
  final String name;
  final List<_Ing> items;
  _Cat(this.id, this.name, this.items);
}

class _Sel {
  final _Ing ing;
  double ratio;
  _Sel(this.ing, {this.ratio = 50});
}

class ScentBlendScreen extends StatefulWidget {
  const ScentBlendScreen({super.key});
  @override
  State<ScentBlendScreen> createState() => _ScentBlendState();
}

class _ScentBlendState extends State<ScentBlendScreen> {
  List<_Cat> _cats = [];
  bool _loading = true;
  String? _err;

  final _searchCtrl = TextEditingController();
  String _q = '';

  final Map<int, _Sel> _sel = {};
  final Map<int, bool> _open = {};

  _Conc _conc = _concs[0];
  int _vol = 50;
  String _name = '';
  final _nameCtrl = TextEditingController();
  bool _saving = false;

  List<Map<String, dynamic>> _bottles = [];
  Map<String, dynamic>? _selBottle;

  bool _showMine = false;
  List<Map<String, dynamic>> _mine = [];
  bool _loadMine = false;


  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(() =>
        setState(() => _q = _searchCtrl.text.toLowerCase().trim()));
    _init();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<String?> _tok() async =>
      (await SharedPreferences.getInstance()).getString('accessToken');

  Future<void> _init() async {
    await Future.wait([_loadCats(), _loadBottles()]);
    await _restore();
  }

  Future<void> _restore() async {
    final p = await SharedPreferences.getInstance();
    final selStr = p.getString('sb_sel');
    final concId = p.getString('sb_conc');
    final vol    = p.getInt('sb_vol');
    final name   = p.getString('sb_name');
    if (!mounted) return;
    setState(() {
      if (selStr != null) {
        final m = jsonDecode(selStr) as Map;
        m.forEach((k, v) {
          final id = int.tryParse(k.toString());
          if (id == null) return;
          for (final c in _cats) {
            final ing = c.items.where((i) => i.id == id).firstOrNull;
            if (ing != null) {
              _sel[id] = _Sel(ing, ratio: (v as num).toDouble());
              break;
            }
          }
        });
      }
      if (concId != null) {
        _conc = _concs.firstWhere((c) => c.id == concId,
            orElse: () => _concs[0]);
      }
      if (vol != null) _vol = vol;
      if (name != null) {
        _name = name;
        _nameCtrl.text = name;
      }
    });
  }

  void _persist() async {
    final p = await SharedPreferences.getInstance();
    final m = <String, double>{};
    _sel.forEach((k, v) => m[k.toString()] = v.ratio);
    await p.setString('sb_sel', jsonEncode(m));
    await p.setString('sb_conc', _conc.id);
    await p.setInt('sb_vol', _vol);
    await p.setString('sb_name', _name);
  }

  Future<void> _loadCats() async {
    setState(() => _loading = true);
    try {
      final r = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/api/custom/scents'));
      if (r.statusCode == 200) {
        final j = jsonDecode(utf8.decode(r.bodyBytes));
        final data = (j['data'] ?? j) as List;
        final cats = data.map((c) {
          final ings = ((c['ingredients'] as List?) ?? []).map((i) =>
              _Ing(
                i['ingredientId'] as int,
                i['name'] ?? '',
                i['description']?.toString(),
                i['isNatural'] as bool?,
              )).toList();
          return _Cat(c['categoryId'] as int, c['categoryName'] ?? '', ings);
        }).toList();
        if (mounted) {
          setState(() {
            _cats = cats;
            _loading = false;
          });
        }
        if (cats.isNotEmpty && _open.isEmpty) _open[cats[0].id] = true;
      } else {
        if (mounted) setState(() { _err = '향 재료 목록을 불러오지 못했습니다.'; _loading = false; });
      }
    } catch (_) {
      if (mounted) setState(() { _err = '향 재료 목록을 불러오지 못했습니다.'; _loading = false; });
    }
  }

  Future<void> _loadBottles() async {
    final tok = await _tok();
    if (tok == null) return;
    try {
      final r = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/designs'),
        headers: {'Authorization': 'Bearer $tok'},
      );
      if (r.statusCode == 200) {
        final j = jsonDecode(utf8.decode(r.bodyBytes));
        if (mounted) {
          setState(() =>
              _bottles = List<Map<String, dynamic>>.from(j['data'] ?? []));
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchMine() async {
    final tok = await _tok();
    if (tok == null) {
      Navigator.pushNamed(context, '/login');
      return;
    }
    setState(() => _loadMine = true);
    try {
      final r = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {'Authorization': 'Bearer $tok'},
      );
      if (r.statusCode == 200) {
        final j = jsonDecode(utf8.decode(r.bodyBytes));
        if (mounted) {
          setState(() =>
              _mine = List<Map<String, dynamic>>.from(j['data'] ?? []));
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadMine = false);
    }
  }

  double get _sum => _sel.values.fold(0, (s, v) => s + v.ratio);

  Map<int, double> _norms() {
    final s = _sum;
    if (s == 0) return {};
    final r = <int, double>{};
    _sel.forEach((id, it) => r[id] = it.ratio / s * 100);
    return r;
  }

  int get _total {
    final ex = ((_vol - 50) / 10).floor().clamp(0, 999) * 30000;
    final bottlePrice = _selBottle != null
        ? (_selBottle!['totalPrice'] as int? ?? 0)
        : 0;
    return _conc.price + ex + bottlePrice;
  }

  void _toggle(_Ing ing) {
    setState(() {
      if (_sel.containsKey(ing.id)) {
        _sel.remove(ing.id);
      } else {
        _sel[ing.id] = _Sel(ing);
      }
    });
    _persist();
  }

  Future<void> _save() async {
    final tok = await _tok();
    if (tok == null) { Navigator.pushNamed(context, '/login'); return; }
    if (_sel.isEmpty) { _snack('향 재료를 하나 이상 선택해주세요'); return; }
    if (_name.trim().isEmpty) { _snack('블렌드 이름을 입력해주세요'); return; }
    setState(() => _saving = true);
    try {
      final norms = _norms();
      final r = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {
          'Authorization': 'Bearer $tok',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'name': _name.trim(),
          'concentration': _conc.id,
          'volumeMl': _vol,
          'totalPrice': _total,
          'bottleDesignId': _selBottle?['designId'],
          'items': norms.entries
              .map((e) => {'ingredientId': e.key, 'ratio': e.value})
              .toList(),
        }),
      );
      if (r.statusCode == 200 || r.statusCode == 201) {
        _snack('블렌드가 저장되었습니다!');
        _reset();
      } else {
        _snack('저장에 실패했습니다.');
      }
    } catch (_) {
      _snack('오류가 발생했습니다.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _addCart() async {
    final tok = await _tok();
    if (tok == null) { Navigator.pushNamed(context, '/login'); return; }
    if (_sel.isEmpty) { _snack('향 재료를 선택해주세요'); return; }
    if (_name.trim().isEmpty) { _snack('블렌드 이름을 입력해주세요'); return; }
    setState(() => _saving = true);
    try {
      final norms = _norms();
      final sr = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {
          'Authorization': 'Bearer $tok',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'name': _name.trim(),
          'concentration': _conc.id,
          'volumeMl': _vol,
          'totalPrice': _total,
          'bottleDesignId': _selBottle?['designId'],
          'items': norms.entries
              .map((e) => {'ingredientId': e.key, 'ratio': e.value})
              .toList(),
        }),
      );
      if (sr.statusCode != 200 && sr.statusCode != 201) {
        _snack('향 조합 저장에 실패했습니다.');
        return;
      }
      final cr = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/scent-blend'),
        headers: {
          'Authorization': 'Bearer $tok',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'name': '[향조합] ${_name.trim()}',
          'price': _total,
          'quantity': 1,
          'imageUrl':
              '__blend__${jsonEncode({'blendName': _name.trim(), 'concentration': _conc.name, 'volume': '${_vol}ml'})}',
        }),
      );
      if (cr.statusCode == 200 || cr.statusCode == 201) {
        _snack('장바구니에 담겼습니다!');
        _reset();
      } else {
        _snack('장바구니 추가에 실패했습니다.');
      }
    } catch (_) {
      _snack('오류가 발생했습니다.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _reset() {
    setState(() {
      _sel.clear();
      _name = '';
      _nameCtrl.clear();
      _conc = _concs[0];
      _vol = 50;
      _selBottle = null;
      _searchCtrl.clear();
      _q = '';
      if (_cats.isNotEmpty) {
        _open.clear();
        _open[_cats[0].id] = true;
      }
    });
    _persist();
  }

  void _loadBlend(Map<String, dynamic> b) {
    final items = (b['items'] as List?) ?? [];
    setState(() {
      _name = b['name'] ?? '';
      _nameCtrl.text = _name;
      _conc = _concs.firstWhere((c) => c.id == b['concentration'],
          orElse: () => _concs[0]);
      final v = b['volumeMl'] as int?;
      if (v != null && _vols.contains(v)) _vol = v;
      _sel.clear();
      for (final item in items) {
        final id = item['ingredientId'] as int?;
        if (id == null) continue;
        for (final cat in _cats) {
          final ing = cat.items.where((i) => i.id == id).firstOrNull;
          if (ing != null) {
            final r = (item['ratio'] as num?)?.toDouble() ?? 50;
            _sel[id] = _Sel(ing, ratio: r > 1 ? r : r * 100);
            break;
          }
        }
      }
      _showMine = false;
    });
    _snack('"${b['name']}" 조합을 불러왔습니다.');
  }

  void _snack(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(m, style: const TextStyle(color: _gold)),
      backgroundColor: _dark,
      behavior: SnackBarBehavior.floating,
    ));
  }

  List<_Cat> get _filtered {
    if (_q.isEmpty) return _cats;
    return _cats.map((c) {
      if (c.name.toLowerCase().contains(_q)) return c;
      final m = c.items
          .where((i) =>
              i.name.toLowerCase().contains(_q) ||
              (i.desc?.toLowerCase().contains(_q) ?? false))
          .toList();
      return m.isEmpty ? null : _Cat(c.id, c.name, m);
    }).whereType<_Cat>().toList();
  }

  String _f(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: _gold));
    }
    if (_err != null) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(_err!, style: const TextStyle(color: _grey)),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _loadCats,
            style: OutlinedButton.styleFrom(
                side: const BorderSide(color: _gold),
                shape: const RoundedRectangleBorder()),
            child: const Text('다시 시도',
                style: TextStyle(color: _gold)),
          ),
        ]),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      children: [
        _buildTitle(),
        const SizedBox(height: 12),
        if (_showMine) _buildMinePanel(),
        const SizedBox(height: 8),
        const Text('① 향 재료 선택',
            style: TextStyle(fontSize: 10, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 8),
        _buildSearchBar(),
        if (_q.isNotEmpty) ...[
          const SizedBox(height: 6),
          _buildSearchCount(),
        ],
        const SizedBox(height: 8),
        ..._buildCatList(),
        const SizedBox(height: 16),
        _buildRatioPanel(),
        const SizedBox(height: 12),
        _buildConcPanel(),
        const SizedBox(height: 12),
        _buildVolPanel(),
        const SizedBox(height: 12),
        _buildBottlePanel(),
        const SizedBox(height: 12),
        _buildSavePanel(),
      ],
    );
  }

  Widget _buildTitle() {
    return Column(children: [
      const Text('COMPOSE YOUR SIGNATURE',
          style: TextStyle(
              fontSize: 9,
              letterSpacing: 5,
              color: _gold,
              fontStyle: FontStyle.italic)),
      const SizedBox(height: 4),
      const Text('나만의 향 조합하기',
          style: TextStyle(
              fontSize: 18,
              letterSpacing: 4,
              color: _dark,
              fontWeight: FontWeight.w300)),
      const SizedBox(height: 4),
      const Text('원하는 향 재료를 선택하고 비율을 조절하세요',
          style: TextStyle(
              fontSize: 11, color: _grey, fontStyle: FontStyle.italic)),
      const SizedBox(height: 10),
      OutlinedButton.icon(
        onPressed: () async {
          if (!_showMine) await _fetchMine();
          setState(() => _showMine = !_showMine);
        },
        icon: const Icon(Icons.list, size: 12, color: _grey),
        label: Text(
          _showMine ? '목록 닫기' : '내 저장된 조합 보기',
          style: const TextStyle(
              fontSize: 10, letterSpacing: 1, color: _grey),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: _gold.withOpacity(0.4)),
          shape: const RoundedRectangleBorder(),
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        ),
      ),
    ]);
  }

  Widget _buildMinePanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('저장된 향 조합',
              style: TextStyle(
                  fontSize: 10, letterSpacing: 3, color: _grey)),
          IconButton(
            onPressed: _fetchMine,
            icon: const Icon(Icons.refresh, size: 14, color: _grey),
            padding: EdgeInsets.zero,
          ),
        ]),
        const SizedBox(height: 8),
        if (_loadMine)
          const Center(
              child: CircularProgressIndicator(
                  color: _gold, strokeWidth: 1.5))
        else if (_mine.isEmpty)
          const Text('저장된 조합이 없습니다.',
              style: TextStyle(
                  fontSize: 11,
                  color: _grey,
                  fontStyle: FontStyle.italic))
        else
          ..._mine.map((b) => GestureDetector(
                onTap: () => _loadBlend(b),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: _cream),
                    color: _bg,
                  ),
                  child: Row(children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(b['name'] ?? '',
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: _dark,
                                  fontWeight: FontWeight.w500)),
                          const SizedBox(height: 2),
                          Text(
                              '${b['concentration']} · ${b['volumeMl']}ml',
                              style: const TextStyle(
                                  fontSize: 10, color: _grey)),
                          Text('₩${_f(b['totalPrice'] ?? 0)}',
                              style: const TextStyle(
                                  fontSize: 10, color: _gold)),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () => showScentCard(context, b),
                      child: Padding(
                        padding: const EdgeInsets.all(6),
                        child: Row(children: const [
                          Icon(Icons.auto_awesome,
                              size: 12, color: _gold),
                          SizedBox(width: 2),
                          Text('향 카드',
                              style: TextStyle(
                                  fontSize: 9, color: _gold)),
                        ]),
                      ),
                    ),
                    const Icon(Icons.chevron_right,
                        size: 14, color: _grey),
                  ]),
                ),
              )),
      ]),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _cream),
      ),
      child: Row(children: [
        const Icon(Icons.search, size: 14, color: _grey),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            controller: _searchCtrl,
            style: const TextStyle(fontSize: 12, color: _dark),
            decoration: const InputDecoration(
              hintText: '향 재료 검색 (예: 로즈, 바닐라...)',
              hintStyle: TextStyle(fontSize: 12, color: _grey),
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
        if (_q.isNotEmpty)
          GestureDetector(
            onTap: () {
              _searchCtrl.clear();
              setState(() => _q = '');
            },
            child: const Icon(Icons.close, size: 14, color: _grey),
          ),
      ]),
    );
  }

  Widget _buildSearchCount() {
    final total =
        _filtered.fold<int>(0, (s, c) => s + c.items.length);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          total == 0
              ? '검색 결과 없음'
              : '"$_q" — $total종 재료 발견',
          style: const TextStyle(fontSize: 10, color: _grey),
        ),
        GestureDetector(
          onTap: () {
            _searchCtrl.clear();
            setState(() => _q = '');
          },
          child: const Text('전체 보기',
              style: TextStyle(
                  fontSize: 9,
                  color: _gold,
                  decoration: TextDecoration.underline)),
        ),
      ],
    );
  }

  List<Widget> _buildCatList() {
    final cats = _filtered;
    if (cats.isEmpty) {
      return [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _cream),
          ),
          child: Center(
            child: Text('"$_q"에 해당하는 재료가 없습니다.',
                style: const TextStyle(
                    fontSize: 11,
                    color: _grey,
                    fontStyle: FontStyle.italic)),
          ),
        )
      ];
    }
    if (_q.isNotEmpty) {
      for (final cat in cats) {
        _open[cat.id] = true;
      }
    }
    return cats.asMap().entries.map((entry) {
      final origIdx =
          _cats.indexWhere((c) => c.id == entry.value.id);
      final color =
          _catColors[origIdx.clamp(0, _catColors.length - 1)];
      return _catWidget(entry.value, color);
    }).toList();
  }

  Widget _catWidget(_Cat cat, Color color) {
    final isOpen = _open[cat.id] ?? false;
    final selCnt =
        cat.items.where((i) => _sel.containsKey(i.id)).length;

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(children: [
        InkWell(
          onTap: () {
            setState(() => _open[cat.id] = !isOpen);
            _persist();
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 10),
            child: Row(children: [
              Expanded(
                child: Row(children: [
                  Text(cat.name,
                      style: const TextStyle(
                          fontSize: 12,
                          letterSpacing: 2,
                          color: _dark,
                          fontWeight: FontWeight.w500)),
                  const SizedBox(width: 4),
                  Text('${cat.items.length}종',
                      style:
                          const TextStyle(fontSize: 9, color: _grey)),
                  if (selCnt > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('$selCnt',
                          style: const TextStyle(
                              fontSize: 9, color: Colors.white)),
                    ),
                  ],
                ]),
              ),
              Icon(
                isOpen ? Icons.expand_less : Icons.expand_more,
                size: 16,
                color: _grey,
              ),
            ]),
          ),
        ),
        if (isOpen)
          Container(
            padding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
            decoration: BoxDecoration(
              border: Border(
                  top: BorderSide(
                      color: _gold.withOpacity(0.1))),
            ),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: cat.items.map((ing) {
                final s = _sel.containsKey(ing.id);
                return GestureDetector(
                  onTap: () => _toggle(ing),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: s ? _dark : _bg,
                      border: Border.all(
                          color: s
                              ? _gold
                              : _gold.withOpacity(0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(mainAxisSize: MainAxisSize.min,
                            children: [
                          Text(ing.name,
                              style: TextStyle(
                                  fontSize: 11,
                                  color: s ? _gold : _dark,
                                  fontWeight:
                                      FontWeight.w500)),
                          if (s) ...[
                            const SizedBox(width: 4),
                            Container(
                              width: 5,
                              height: 5,
                              decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ]),
                        if (ing.desc != null &&
                            ing.desc!.isNotEmpty)
                          Text(ing.desc!,
                              style: TextStyle(
                                  fontSize: 9,
                                  color: s
                                      ? _gold.withOpacity(0.6)
                                      : _grey),
                              maxLines: 1,
                              overflow:
                                  TextOverflow.ellipsis),
                        if (ing.isNatural != null)
                          Text(
                            ing.isNatural! ? '천연' : '합성',
                            style: TextStyle(
                              fontSize: 8,
                              color: ing.isNatural!
                                  ? const Color(0xFF55a66a)
                                  : _grey,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
      ]),
    );
  }

  Widget _buildRatioPanel() {
    final sl = _sel.entries.toList();
    final sm = _sum;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        const Text('② 비율 조절',
            style: TextStyle(
                fontSize: 10, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 12),
        if (sl.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text('왼쪽에서 향 재료를 선택하세요',
                  style: TextStyle(
                      fontSize: 10,
                      color: _grey,
                      fontStyle: FontStyle.italic)),
            ),
          )
        else ...[
          ...sl.map((e) {
            final id = e.key;
            final it = e.value;
            final norm =
                sm > 0 ? (it.ratio / sm * 100).round() : 0;
            final ci = _cats.indexWhere(
                (c) => c.items.any((i) => i.id == id));
            final color =
                _catColors[ci.clamp(0, _catColors.length - 1)];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                Row(children: [
                  Expanded(
                    child: Row(children: [
                      Flexible(
                        child: Text(it.ing.name,
                            style: const TextStyle(
                                fontSize: 11, color: _dark),
                            overflow: TextOverflow.ellipsis),
                      ),
                      const SizedBox(width: 4),
                      Text('→ $norm%',
                          style: const TextStyle(
                              fontSize: 9, color: _grey)),
                    ]),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() => _sel.remove(id));
                      _persist();
                    },
                    child: const Icon(Icons.close,
                        size: 14, color: _grey),
                  ),
                ]),
                const SizedBox(height: 4),
                Row(children: [
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: color,
                        inactiveTrackColor:
                            const Color(0xFFE8E0D0),
                        thumbColor: color,
                        thumbShape:
                            const RoundSliderThumbShape(
                                enabledThumbRadius: 7),
                        trackHeight: 4,
                      ),
                      child: Slider(
                        min: 0,
                        max: 100,
                        divisions: 100,
                        value: it.ratio,
                        onChanged: (v) {
                          setState(() => it.ratio = v);
                          _persist();
                        },
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 28,
                    child: Text('${it.ratio.round()}',
                        style: const TextStyle(
                            fontSize: 11, color: _dark),
                        textAlign: TextAlign.right),
                  ),
                ]),
              ]),
            );
          }),
          const SizedBox(height: 8),
          Row(
              mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,
              children: [
            const Text('비율 미리보기',
                style:
                    TextStyle(fontSize: 9, color: _grey)),
            const Text('합산 100% 자동 환산',
                style: TextStyle(
                    fontSize: 9,
                    color: _gold,
                    fontStyle: FontStyle.italic)),
          ]),
          const SizedBox(height: 4),
          if (sm > 0)
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                height: 8,
                child: Row(
                  children: sl.map((e) {
                    final ci = _cats.indexWhere((c) =>
                        c.items.any((i) => i.id == e.key));
                    return Expanded(
                      flex: (e.value.ratio / sm * 1000)
                          .round(),
                      child: Container(
                          color: _catColors[ci.clamp(
                              0,
                              _catColors.length - 1)]),
                    );
                  }).toList(),
                ),
              ),
            ),
        ],
      ]),
    );
  }

  Widget _buildConcPanel() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        const Text('③ 향수 종류',
            style: TextStyle(
                fontSize: 10, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 10),
        ..._concs.map((t) {
          final s = _conc.id == t.id;
          return GestureDetector(
            onTap: () {
              setState(() => _conc = t);
              _persist();
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: s
                    ? _gold.withOpacity(0.05)
                    : Colors.transparent,
                border: Border.all(
                    color: s ? _gold : _cream),
              ),
              child: Row(
                  mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,
                  children: [
                Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                  Row(children: [
                    Text(t.name,
                        style: const TextStyle(
                            fontSize: 12, color: _dark)),
                    const SizedBox(width: 6),
                    Text(t.nameEn,
                        style: const TextStyle(
                            fontSize: 9, color: _grey)),
                  ]),
                  Text(t.desc,
                      style: const TextStyle(
                          fontSize: 9, color: _grey)),
                ]),
                Text('₩${_f(t.price)}',
                    style: const TextStyle(
                        fontSize: 11, color: _gold)),
              ]),
            ),
          );
        }),
      ]),
    );
  }

  Widget _buildVolPanel() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        const Text('④ 용량 선택',
            style: TextStyle(
                fontSize: 10, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _vols.map((v) {
            final s = _vol == v;
            final ex =
                ((v - 50) / 10).floor().clamp(0, 999) * 30000;
            return GestureDetector(
              onTap: () {
                setState(() => _vol = v);
                _persist();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: s
                      ? _gold.withOpacity(0.05)
                      : Colors.transparent,
                  border: Border.all(
                      color: s ? _gold : _cream),
                ),
                child: Column(children: [
                  Text('${v}ml',
                      style: const TextStyle(
                          fontSize: 12, color: _dark)),
                  Text(
                    ex > 0 ? '+₩${_f(ex)}' : '기본',
                    style: const TextStyle(
                        fontSize: 9, color: _gold),
                  ),
                ]),
              ),
            );
          }).toList(),
        ),
      ]),
    );
  }

  Widget _buildBottlePanel() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        const Text('⑤ 병 선택',
            style: TextStyle(
                fontSize: 10, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 10),
        _bottleItem(null, '기본 병', 'AION 기본 제공 병', 0),
        ..._bottles.map((b) => _bottleItem(
              b,
              b['name'] ?? '나만의 병',
              '커스텀 디자인',
              b['totalPrice'] as int? ?? 0,
            )),
        if (_bottles.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: GestureDetector(
              onTap: () =>
                  Navigator.pushNamed(context, '/bottle-editor'),
              child: const Text(
                '+ 나만의 병 디자인하기',
                style: TextStyle(
                    fontSize: 10,
                    color: _gold,
                    decoration: TextDecoration.underline),
              ),
            ),
          ),
      ]),
    );
  }

  Widget _bottleItem(
    Map<String, dynamic>? b,
    String name,
    String sub,
    int price,
  ) {
    final isSelected = b == null
        ? _selBottle == null
        : _selBottle?['designId'] == b['designId'];
    return GestureDetector(
      onTap: () {
        setState(() => _selBottle = b);
        _persist();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(
            horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? _gold.withOpacity(0.05)
              : Colors.transparent,
          border:
              Border.all(color: isSelected ? _gold : _cream),
        ),
        child: Row(children: [
          Icon(
            b == null
                ? Icons.local_drink_outlined
                : Icons.science_outlined,
            size: 16,
            color: _gold.withOpacity(0.6),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
              Text(name,
                  style: const TextStyle(
                      fontSize: 12, color: _dark)),
              Text(
                sub + (price > 0 ? ' · ₩${_f(price)}' : ''),
                style: const TextStyle(
                    fontSize: 9, color: _grey),
              ),
            ]),
          ),
          if (isSelected)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                  color: _gold, shape: BoxShape.circle),
            ),
        ]),
      ),
    );
  }

  Widget _buildSavePanel() {
    final ex =
        ((_vol - 50) / 10).floor().clamp(0, 999) * 30000;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
      ),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        const Text('⑥ 저장',
            style: TextStyle(
                fontSize: 10, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 12),
        TextField(
          controller: _nameCtrl,
          maxLength: 100,
          onChanged: (v) {
            _name = v;
            _persist();
          },
          decoration: const InputDecoration(
            labelText: '블렌드 이름 *',
            labelStyle:
                TextStyle(fontSize: 11, color: _grey),
            enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: _cream)),
            focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: _gold)),
            counterText: '',
          ),
        ),
        const SizedBox(height: 16),
        _pr('${_conc.name} (${_vol}ml)', _conc.price),
        if (ex > 0) _pr('추가 용량 +${_vol - 50}ml', ex),
        if (_selBottle != null)
          _pr(
            '커스텀 병 (${_selBottle!['name']})',
            _selBottle!['totalPrice'] ?? 0,
          ),
        const Divider(color: _cream, height: 20),
        Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
          const Text('Total',
              style: TextStyle(
                  fontSize: 13,
                  color: _gold,
                  fontStyle: FontStyle.italic)),
          Text('₩${_f(_total)}',
              style: const TextStyle(
                  fontSize: 18,
                  color: _dark,
                  fontWeight: FontWeight.bold)),
        ]),
        Text('선택된 재료: ${_sel.length}종',
            style:
                const TextStyle(fontSize: 9, color: _grey)),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                          strokeWidth: 1.5,
                          color: _gold))
                  : const Icon(Icons.save_outlined,
                      size: 12, color: _gold),
              label: const Text('저장',
                  style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 1,
                      color: _gold)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: _gold),
                shape:
                    const RoundedRectangleBorder(),
                padding: const EdgeInsets.symmetric(
                    vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _saving ? null : _addCart,
              icon: _saving
                  ? const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                          strokeWidth: 1.5,
                          color: Colors.white))
                  : const Icon(
                      Icons.shopping_bag_outlined,
                      size: 12),
              label: const Text('장바구니',
                  style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 1)),
              style: ElevatedButton.styleFrom(
                backgroundColor: _dark,
                foregroundColor: Colors.white,
                shape:
                    const RoundedRectangleBorder(),
                padding: const EdgeInsets.symmetric(
                    vertical: 12),
              ),
            ),
          ),
        ]),
      ]),
    );
  }

  Widget _pr(String l, dynamic v) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
          Text(l,
              style: const TextStyle(
                  fontSize: 11, color: _dark)),
          Text('₩${_f(v)}',
              style: const TextStyle(
                  fontSize: 11, color: _dark)),
        ]),
      );
}