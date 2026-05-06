import 'package:flutter/material.dart';
import '../services/api_service_extended.dart';
import '../models/perfume.dart';

class SearchResultScreen extends StatefulWidget {
  final String initialQuery;
  const SearchResultScreen({super.key, this.initialQuery = ''});

  @override
  State<SearchResultScreen> createState() => _SearchResultScreenState();
}

class _SearchResultScreenState extends State<SearchResultScreen> {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();

  List<Perfume> _results = [];
  bool _isLoading = false;

  // 현재 입력 중인 텍스트 (# 없는 일반 검색어)
  String _searchText = '';
  // 선택된 태그 칩들
  List<String> _selectedTags = [];

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _grey = Color(0xFF8B8278);
  static const _cream = Color(0xFFE8E2D6);
  static const _bg = Color(0xFFFAF8F3);

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery.isNotEmpty) {
      _searchController.text = widget.initialQuery;
      _searchText = widget.initialQuery;
      _performSearch();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  // 입력값 파싱: #태그 → 칩, 나머지 → 텍스트
  void _onTextChanged(String value) {
    // #으로 시작하는 단어가 스페이스나 엔터로 끝나면 태그로 확정
    final tagMatch = RegExp(r'#(\S+)\s$').firstMatch(value);
    if (tagMatch != null) {
      final tag = tagMatch.group(1)!;
      if (!_selectedTags.contains(tag)) {
        setState(() => _selectedTags.add(tag));
      }
      _searchController.clear();
      setState(() => _searchText = '');
      _performSearch();
      return;
    }

    // #으로 시작하면 태그 입력 중 표시
    setState(() => _searchText = value.startsWith('#') ? '' : value);
  }

  void _onSubmitted(String value) {
    final trimmed = value.trim();
    if (trimmed.startsWith('#')) {
      // #태그 확정
      final tag = trimmed.substring(1);
      if (tag.isNotEmpty && !_selectedTags.contains(tag)) {
        setState(() => _selectedTags.add(tag));
      }
      _searchController.clear();
      setState(() => _searchText = '');
    } else if (trimmed.isNotEmpty) {
      setState(() => _searchText = trimmed);
    }
    _performSearch();
  }

  void _removeTag(String tag) {
    setState(() => _selectedTags.remove(tag));
    _performSearch();
  }

  void _clearAll() {
    setState(() {
      _selectedTags.clear();
      _searchText = '';
      _searchController.clear();
    });
    _performSearch();
  }

  Future<void> _performSearch() async {
    if (_searchText.isEmpty && _selectedTags.isEmpty) {
      setState(() => _results = []);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final results = await ApiService.fetchPerfumesRaw(
        search: _searchText.isEmpty ? null : _searchText,
        tags: _selectedTags.isEmpty ? null : List.from(_selectedTags),
        size: 100,
      );

      if (mounted) {
        setState(() {
          _results = results.map((p) => Perfume(
            id: p['id'] ?? p['perfumeId'] ?? 0,
            name: p['name'] ?? '',
            nameEn: p['nameEn'],
            brandName: p['brandName'],
            imageUrl: p['imageUrl'] ?? p['thumbnail'],
            price: (p['originalPrice'] ?? p['price'] ?? 0) as int,
            salePrice: p['salePrice'] as int?,
            saleRate: (p['saleRate'] ?? 0) as int,
            tags: (p['tags'] as List?)?.cast<String>(),
            gender: p['gender'],
            description: p['description'],
            concentration: p['concentration'],
          )).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('검색 실패: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1510),
        iconTheme: const IconThemeData(color: Colors.white),
        centerTitle: true,
        title: const Text('SEARCH',
            style: TextStyle(letterSpacing: 4, color: Colors.white, fontSize: 14, fontWeight: FontWeight.w300)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(0.5),
          child: Container(height: 0.5, color: _gold.withOpacity(0.4)),
        ),
      ),
      body: Column(
        children: [
          // ── 검색 입력 영역 ────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 태그 칩 + 입력창 통합
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: _cream),
                    color: _bg,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: _grey, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            // 선택된 태그 칩들
                            ..._selectedTags.map((tag) => _TagChip(
                              label: tag,
                              onRemove: () => _removeTag(tag),
                            )),
                            // 텍스트 입력
                            IntrinsicWidth(
                              child: TextField(
                                controller: _searchController,
                                focusNode: _focusNode,
                                onChanged: _onTextChanged,
                                onSubmitted: _onSubmitted,
                                style: const TextStyle(fontSize: 13, color: _dark),
                                decoration: InputDecoration(
                                  border: InputBorder.none,
                                  isDense: true,
                                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                                  hintText: _selectedTags.isEmpty
                                      ? '향수명 검색 또는 #태그 입력'
                                      : '#태그 추가...',
                                  hintStyle: TextStyle(
                                      fontSize: 12,
                                      color: _grey.withOpacity(0.5)),
                                  constraints: const BoxConstraints(minWidth: 120),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (_selectedTags.isNotEmpty || _searchText.isNotEmpty)
                        GestureDetector(
                          onTap: _clearAll,
                          child: const Icon(Icons.close, color: _grey, size: 16),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // 힌트 텍스트
                Text(
                  '#을 붙이면 태그로 검색됩니다  예) #데이트  #럭셔리',
                  style: TextStyle(fontSize: 10, color: _grey.withOpacity(0.6), letterSpacing: 0.5),
                ),
              ],
            ),
          ),

          // ── 결과 카운트 ──────────────────────────────────
          if ((_searchText.isNotEmpty || _selectedTags.isNotEmpty) && !_isLoading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: _gold.withOpacity(0.2))),
              ),
              child: Row(
                children: [
                  if (_selectedTags.isNotEmpty) ...[
                    ...(_selectedTags.map((t) => Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: Text('#$t', style: const TextStyle(fontSize: 11, color: _gold, fontWeight: FontWeight.w500)),
                    ))),
                    if (_searchText.isNotEmpty) const Text(' · ', style: TextStyle(color: _grey)),
                  ],
                  if (_searchText.isNotEmpty)
                    Text("'$_searchText'", style: const TextStyle(fontSize: 11, color: _dark)),
                  const Text(' 검색 결과  ', style: TextStyle(fontSize: 11, color: _grey)),
                  Text('${_results.length}개', style: const TextStyle(fontSize: 11, color: _dark, fontWeight: FontWeight.bold)),
                ],
              ),
            ),

          // ── 결과 목록 ────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: _gold))
                : (_searchText.isEmpty && _selectedTags.isEmpty)
                    ? _buildInitialState()
                    : _results.isEmpty
                        ? _buildEmptyState()
                        : _buildResultsGrid(),
          ),
        ],
      ),
    );
  }

  Widget _buildInitialState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('✦', style: TextStyle(fontSize: 40, color: _gold.withOpacity(0.2))),
          const SizedBox(height: 16),
          const Text('향수명 또는 #태그로 검색하세요',
              style: TextStyle(fontSize: 13, color: _grey, fontStyle: FontStyle.italic)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6, runSpacing: 6,
            alignment: WrapAlignment.center,
            children: ['#데이트', '#럭셔리', '#청량함', '#신비로운', '#로맨틱한', '#달콤함'].map((t) =>
              GestureDetector(
                onTap: () {
                  final tag = t.substring(1);
                  if (!_selectedTags.contains(tag)) {
                    setState(() => _selectedTags.add(tag));
                    _performSearch();
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    border: Border.all(color: _gold.withOpacity(0.4)),
                    color: _gold.withOpacity(0.05),
                  ),
                  child: Text(t, style: const TextStyle(fontSize: 11, color: _gold)),
                ),
              ),
            ).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: _gold.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('?', style: TextStyle(fontSize: 40, color: Color(0xFFE8E2D6))),
            const SizedBox(height: 12),
            const Text('검색 결과가 없습니다',
                style: TextStyle(fontSize: 13, color: _grey, fontStyle: FontStyle.italic)),
            const SizedBox(height: 4),
            const Text('다른 키워드나 태그로 검색해보세요',
                style: TextStyle(fontSize: 11, color: Color(0xFFC0B8A8))),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsGrid() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: (_results.length / 2).ceil(),
      itemBuilder: (context, rowIndex) {
        final left = rowIndex * 2;
        final right = left + 1;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildProductCard(_results[left])),
              const SizedBox(width: 12),
              Expanded(
                child: right < _results.length
                    ? _buildProductCard(_results[right])
                    : const SizedBox(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProductCard(Perfume perfume) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/perfumes/${perfume.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          AspectRatio(
            aspectRatio: 3 / 4,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFFAF8F3),
                border: Border.all(color: _cream),
              ),
              child: Stack(
                children: [
                  perfume.imageUrl != null
                      ? Image.network(perfume.imageUrl!, fit: BoxFit.cover,
                          width: double.infinity, height: double.infinity,
                          errorBuilder: (_, __, ___) => _placeholder(perfume))
                      : _placeholder(perfume),
                  if (perfume.isOnSale)
                    Positioned(
                      top: 6, left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        color: const Color(0xFF1A1510),
                        child: Text('${perfume.saleRate}%',
                            style: const TextStyle(color: _gold, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 6, 4, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (perfume.brandName != null)
                  Text(perfume.brandName!,
                      style: const TextStyle(fontSize: 9, color: _grey, letterSpacing: 1),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(perfume.name,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _dark),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                if (perfume.isOnSale)
                  Text('₩${perfume.formattedOriginalPrice}',
                      style: const TextStyle(fontSize: 9, color: _grey,
                          decoration: TextDecoration.lineThrough)),
                Text('₩${perfume.formattedPrice}',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _gold)),
                // 태그 표시
                if (perfume.tags != null && perfume.tags!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 4,
                    children: perfume.tags!.take(2).map((t) => Text(
                      '#$t',
                      style: TextStyle(fontSize: 9, color: _grey.withOpacity(0.7)),
                    )).toList(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholder(Perfume perfume) {
    return Center(
      child: Text(
        perfume.name.isNotEmpty ? perfume.name[0] : '✦',
        style: TextStyle(fontSize: 36, color: _gold.withOpacity(0.25)),
      ),
    );
  }
}

// ── 태그 칩 위젯 ─────────────────────────────────────────────────
class _TagChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;
  const _TagChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1510),
        border: Border.all(color: const Color(0xFFC9A961)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('#$label',
              style: const TextStyle(fontSize: 11, color: Color(0xFFC9A961))),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 10, color: Color(0xFFC9A961)),
          ),
        ],
      ),
    );
  }
}