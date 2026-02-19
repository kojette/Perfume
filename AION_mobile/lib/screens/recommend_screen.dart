import 'package:flutter/material.dart';
import '../services/api_service_extended.dart';
import '../models/perfume.dart';

class RecommendScreen extends StatefulWidget {
  const RecommendScreen({super.key});

  @override
  State<RecommendScreen> createState() => _RecommendScreenState();
}

class _RecommendScreenState extends State<RecommendScreen> {
  List<Perfume> _allPerfumes = [];
  List<Perfume> _filteredPerfumes = [];
  bool _loading = true;
  String? _error;

  final _searchController = TextEditingController();
  final _tagController = TextEditingController();
  List<String> _selectedTags = [];
  String _sortBy = 'latest';

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    _loadPerfumes();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  Future<void> _loadPerfumes() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final perfumes = await ApiService.fetchPerfumes();
      if (mounted) {
        setState(() {
          _allPerfumes = perfumes;
          _applyFilters();
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    List<Perfume> result = [..._allPerfumes];

    final searchTerm = _searchController.text.trim().toLowerCase();
    if (searchTerm.isNotEmpty) {
      result = result.where((p) {
        return p.name.toLowerCase().contains(searchTerm) ||
            (p.nameEn?.toLowerCase().contains(searchTerm) ?? false) ||
            (p.brandName?.toLowerCase().contains(searchTerm) ?? false);// ||
            //p.genderDisplay.contains(searchTerm);
      }).toList();
    }

    if (_selectedTags.isNotEmpty) {
      result = result.where((p) {
        // tags가 없으면 gender/season으로 매칭
        final autoTags = [
          p.genderDisplay,
          ...?p.season,
          ...?p.occasion,
          ...?p.tags,
        ];
        return _selectedTags.any((sel) => autoTags.any(
            (t) => t.toLowerCase().contains(sel.toLowerCase())));
      }).toList();
    }

    switch (_sortBy) {
      case 'price-low':
        result.sort((a, b) => a.displayPrice.compareTo(b.displayPrice));
        break;
      case 'price-high':
        result.sort((a, b) => b.displayPrice.compareTo(a.displayPrice));
        break;
      case 'rating':
        result.sort((a, b) => (b.avgRating ?? 0).compareTo(a.avgRating ?? 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.compareTo(b.name));
        break;
      case 'latest':
      default:
        break;
    }

    setState(() => _filteredPerfumes = result);
  }

  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_selectedTags.contains(tag)) {
      setState(() {
        _selectedTags.add(tag);
        _tagController.clear();
      });
      _applyFilters();
    }
  }

  void _removeTag(String tag) {
    setState(() => _selectedTags.remove(tag));
    _applyFilters();
  }

  void _applyTheme(List<String> tags) {
    setState(() => _selectedTags = tags);
    _applyFilters();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: _bg,
        appBar: AppBar(
          centerTitle: true,
          title: const Text('RECOMMEND', style: TextStyle(letterSpacing: 4)),
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: _gold),
              SizedBox(height: 16),
              Text(
                '향수 데이터를 불러오는 중...',
                style: TextStyle(
                  fontSize: 14,
                  color: _grey,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: _bg,
        appBar: AppBar(
          centerTitle: true,
          title: const Text('RECOMMEND', style: TextStyle(letterSpacing: 4)),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('⚠️', style: TextStyle(fontSize: 60)),
              const SizedBox(height: 16),
              const Text(
                '데이터를 불러오는 중 오류가 발생했습니다',
                style: TextStyle(fontSize: 16, color: Colors.red),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: const TextStyle(fontSize: 12, color: _grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loadPerfumes,
                style: ElevatedButton.styleFrom(backgroundColor: _gold),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'SEARCH & RECOMMEND',
          style: TextStyle(
            color: _dark,
            fontSize: 12,
            letterSpacing: 3,
            fontWeight: FontWeight.w500,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // 퀵 테마 버튼
          _buildThemeBar(),

          // 검색 및 필터
          _buildSearchSection(),

          // 결과 카운트 + 정렬
          _buildResultHeader(),

          // 향수 그리드
          Expanded(
            child: _filteredPerfumes.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadPerfumes,
                    color: _gold,
                    child: _buildPerfumeGrid(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildThemeBar() {
    return SizedBox(
      height: 80,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          _buildThemeButton('💼', '오피스', () => _applyTheme(['남성', '중성'])),
          const SizedBox(width: 8),
          _buildThemeButton('💕', '데이트', () => _applyTheme(['여성', '중성'])),
          const SizedBox(width: 8),
          _buildThemeButton('🌸', '봄/여름', () => _applyTheme(['봄', '여름'])),
          const SizedBox(width: 8),
          _buildThemeButton('🍂', '가을/겨울', () => _applyTheme(['가을', '겨울'])),
          const SizedBox(width: 8),
          _buildThemeButton('✨', '전체 보기', () {
            setState(() => _selectedTags = []);
            _applyFilters();
          }),
        ],
      ),
    );
  }

  Widget _buildThemeButton(String emoji, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: _gold.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                letterSpacing: 0.5,
                color: _dark,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: _gold.withOpacity(0.2))),
      ),
      child: Column(
        children: [
          // 검색 입력
          TextField(
            controller: _searchController,
            onChanged: (_) => _applyFilters(),
            decoration: InputDecoration(
              hintText: '향수명, 브랜드 검색',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.black26),
              prefixIcon: const Icon(Icons.search, color: _grey, size: 20),
              border: OutlineInputBorder(
                borderSide: BorderSide(color: _gold.withOpacity(0.3)),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: _gold),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            style: const TextStyle(fontSize: 14),
          ),
          const SizedBox(height: 10),

          // 태그 입력
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _tagController,
                  onSubmitted: (_) => _addTag(),
                  decoration: InputDecoration(
                    hintText: '태그 입력 후 엔터 (예: 남성, 봄)',
                    hintStyle:
                        const TextStyle(fontSize: 12, color: Colors.black26),
                    prefixIcon:
                        const Icon(Icons.local_offer, color: _grey, size: 18),
                    border: OutlineInputBorder(
                      borderSide: BorderSide(color: _gold.withOpacity(0.3)),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: _gold),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                  ),
                  style: const TextStyle(fontSize: 13),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _addTag,
                icon: const Icon(Icons.add_circle, color: _gold),
              ),
            ],
          ),

          // 선택된 태그
          if (_selectedTags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: _selectedTags.map((tag) {
                return Chip(
                  label: Text(tag,
                      style: const TextStyle(fontSize: 11, color: _dark)),
                  deleteIcon: const Icon(Icons.close, size: 14),
                  onDeleted: () => _removeTag(tag),
                  backgroundColor: _gold.withOpacity(0.15),
                  side: BorderSide(color: _gold.withOpacity(0.4)),
                  padding: EdgeInsets.zero,
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildResultHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border:
            Border(bottom: BorderSide(color: _gold.withOpacity(0.1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '${_filteredPerfumes.length}개의 향수',
            style: const TextStyle(color: _grey, fontSize: 12, letterSpacing: 1),
          ),
          GestureDetector(
            onTap: () async {
              final labels = {
                'latest': '최신순', 'price-low': '낮은 가격순',
                'price-high': '높은 가격순', 'rating': '평점순', 'name': '이름순',
              };
              final picked = await showModalBottomSheet<String>(
                context: context,
                builder: (_) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: labels.entries.map((e) => ListTile(
                    title: Text(e.value, style: TextStyle(
                      color: _sortBy == e.key ? _gold : _dark,
                      fontWeight: _sortBy == e.key ? FontWeight.bold : FontWeight.normal,
                    )),
                    onTap: () => Navigator.pop(context, e.key),
                  )).toList(),
                ),
              );
              if (picked != null) {
                setState(() => _sortBy = picked);
                _applyFilters();
              }
            },
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  {'latest':'최신순','price-low':'낮은 가격순','price-high':'높은 가격순','rating':'평점순','name':'이름순'}[_sortBy] ?? '최신순',
                  style: const TextStyle(color: _dark, fontSize: 12),
                ),
                const Icon(Icons.arrow_drop_down, color: _gold, size: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerfumeGrid() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: (_filteredPerfumes.length / 2).ceil(),
      itemBuilder: (context, rowIndex) {
        final left = rowIndex * 2;
        final right = left + 1;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildPerfumeCard(_filteredPerfumes[left])),
              const SizedBox(width: 12),
              Expanded(
                child: right < _filteredPerfumes.length
                    ? _buildPerfumeCard(_filteredPerfumes[right])
                    : const SizedBox(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPerfumeCard(Perfume perfume) {
    return GestureDetector(
      onTap: () {},
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // 이미지: AspectRatio 비율 고정 → overflow 불가
          AspectRatio(
            aspectRatio: 3 / 4,
            child: Container(
              decoration: BoxDecoration(
                color: _bg,
                border: Border.all(color: _gold.withOpacity(0.2)),
              ),
              child: Stack(
                children: [
                  perfume.imageUrl != null
                      ? Image.network(
                          perfume.imageUrl!,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          errorBuilder: (_, __, ___) => _placeholder(),
                        )
                      : _placeholder(),
                  if (perfume.isOnSale)
                    Positioned(
                      top: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          '${perfume.saleRate}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          // 텍스트: mainAxisSize.min → 내용만큼만
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 6, 4, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (perfume.brandName != null)
                  Text(
                    perfume.brandName!,
                    style: const TextStyle(color: _grey, fontSize: 9, letterSpacing: 0.5),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 2),
                Text(
                  perfume.name,
                  style: const TextStyle(
                    color: _dark,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (perfume.avgRating != null && perfume.avgRating! > 0)
                  Row(
                    children: [
                      const Icon(Icons.star, color: _gold, size: 11),
                      const SizedBox(width: 2),
                      Text(
                        perfume.avgRating!.toStringAsFixed(1),
                        style: const TextStyle(color: _grey, fontSize: 10),
                      ),
                    ],
                  ),
                const SizedBox(height: 2),
                if (perfume.isOnSale)
                  Text(
                    '${perfume.formattedOriginalPrice}원',
                    style: const TextStyle(
                      color: _grey,
                      fontSize: 9,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                Text(
                  '${perfume.formattedPrice}원',
                  style: TextStyle(
                    color: perfume.isOnSale ? Colors.red : _dark,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: _grey.withOpacity(0.4)),
          const SizedBox(height: 16),
          const Text(
            '검색 결과가 없습니다',
            style: TextStyle(color: _grey, fontSize: 14),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              _searchController.clear();
              setState(() => _selectedTags = []);
              _applyFilters();
            },
            child: const Text(
              '필터 초기화',
              style: TextStyle(color: _gold, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholder() {
    return const Center(
      child: Icon(Icons.local_florist, size: 40, color: _gold),
    );
  }
}