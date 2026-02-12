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
    setState(() => _loading = true);
    try {
      final perfumes = await ApiService.fetchPerfumes(size: 100);
      if (mounted) {
        setState(() {
          _allPerfumes = perfumes;
          _applyFilters();
        });
      }
    } catch (e) {
      debugPrint('향수 로딩 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    List<Perfume> result = [..._allPerfumes];

    // 검색어 필터링
    final searchTerm = _searchController.text.trim().toLowerCase();
    if (searchTerm.isNotEmpty) {
      result = result.where((p) {
        return p.name.toLowerCase().contains(searchTerm) ||
            (p.nameEn?.toLowerCase().contains(searchTerm) ?? false) ||
            (p.brandName?.toLowerCase().contains(searchTerm) ?? false) ||
            (p.category?.toLowerCase().contains(searchTerm) ?? false);
      }).toList();
    }

    // 태그 필터링
    if (_selectedTags.isNotEmpty) {
      result = result.where((p) {
        if (p.tags == null) return false;
        return _selectedTags.any((selectedTag) =>
            p.tags!.any((tag) =>
                tag.toLowerCase().contains(selectedTag.toLowerCase())));
      }).toList();
    }

    // 정렬
    switch (_sortBy) {
      case 'latest':
        // 기본 순서 유지
        break;
      case 'price-low':
        result.sort((a, b) => a.displayPrice.compareTo(b.displayPrice));
        break;
      case 'price-high':
        result.sort((a, b) => b.displayPrice.compareTo(a.displayPrice));
        break;
      case 'rating':
        result.sort((a, b) =>
            (b.avgRating ?? 0).compareTo(a.avgRating ?? 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.compareTo(b.name));
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

  @override
  Widget build(BuildContext context) {
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
          // 검색 및 필터 영역
          _buildSearchSection(),

          // 결과 카운트 및 정렬
          _buildResultHeader(),

          // 향수 그리드
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: _gold))
                : _filteredPerfumes.isEmpty
                    ? _buildEmptyState()
                    : _buildPerfumeGrid(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: _gold.withOpacity(0.2)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 검색 입력
          TextField(
            controller: _searchController,
            onChanged: (_) => _applyFilters(),
            decoration: InputDecoration(
              hintText: '향수명, 브랜드, 카테고리 검색',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.black26),
              prefixIcon: const Icon(Icons.search, color: _grey, size: 20),
              border: OutlineInputBorder(
                borderSide: BorderSide(color: _gold.withOpacity(0.3)),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: _gold),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
            style: const TextStyle(fontSize: 14),
          ),

          const SizedBox(height: 16),

          // 태그 입력
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _tagController,
                  onSubmitted: (_) => _addTag(),
                  decoration: InputDecoration(
                    hintText: '태그 입력 후 엔터',
                    hintStyle: const TextStyle(fontSize: 12, color: Colors.black26),
                    prefixIcon: const Icon(Icons.local_offer, color: _grey, size: 18),
                    border: OutlineInputBorder(
                      borderSide: BorderSide(color: _gold.withOpacity(0.3)),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: _gold),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
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
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _selectedTags.map((tag) {
                return Chip(
                  label: Text(
                    tag,
                    style: const TextStyle(fontSize: 11, color: _dark),
                  ),
                  deleteIcon: const Icon(Icons.close, size: 16),
                  onDeleted: () => _removeTag(tag),
                  backgroundColor: _gold.withOpacity(0.2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: _gold.withOpacity(0.5)),
                  ),
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
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: _gold.withOpacity(0.1)),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '${_filteredPerfumes.length}개의 향수',
            style: const TextStyle(
              color: _grey,
              fontSize: 12,
              letterSpacing: 1,
            ),
          ),
          DropdownButton<String>(
            value: _sortBy,
            underline: Container(),
            style: const TextStyle(color: _dark, fontSize: 12),
            icon: const Icon(Icons.arrow_drop_down, color: _gold, size: 20),
            items: const [
              DropdownMenuItem(value: 'latest', child: Text('최신순')),
              DropdownMenuItem(value: 'price-low', child: Text('낮은 가격순')),
              DropdownMenuItem(value: 'price-high', child: Text('높은 가격순')),
              DropdownMenuItem(value: 'rating', child: Text('평점순')),
              DropdownMenuItem(value: 'name', child: Text('이름순')),
            ],
            onChanged: (value) {
              if (value != null) {
                setState(() => _sortBy = value);
                _applyFilters();
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPerfumeGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        crossAxisSpacing: 16,
        mainAxisSpacing: 20,
      ),
      itemCount: _filteredPerfumes.length,
      itemBuilder: (context, index) {
        return _buildPerfumeCard(_filteredPerfumes[index]);
      },
    );
  }

  Widget _buildPerfumeCard(Perfume perfume) {
    return GestureDetector(
      onTap: () {
        // TODO: 향수 상세 페이지
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: _gold.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 이미지
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    color: _bg,
                    child: perfume.imageUrl != null
                        ? Image.network(
                            perfume.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _placeholderImage(),
                          )
                        : _placeholderImage(),
                  ),
                  
                  // 할인율 배지
                  if (perfume.isOnSale)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${perfume.saleRate}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // 정보
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (perfume.brandName != null)
                      Text(
                        perfume.brandName!,
                        style: const TextStyle(
                          color: _grey,
                          fontSize: 10,
                          letterSpacing: 1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 4),
                    Text(
                      perfume.name,
                      style: const TextStyle(
                        color: _dark,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),

                    // 평점
                    if (perfume.avgRating != null && perfume.avgRating! > 0)
                      Row(
                        children: [
                          const Icon(Icons.star, color: _gold, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            perfume.avgRating!.toStringAsFixed(1),
                            style: const TextStyle(
                              color: _grey,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(height: 4),

                    // 가격
                    Row(
                      children: [
                        if (perfume.isOnSale) ...[
                          Text(
                            '${_formatPrice(perfume.price)}원',
                            style: const TextStyle(
                              color: _grey,
                              fontSize: 10,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          '${_formatPrice(perfume.displayPrice)}원',
                          style: TextStyle(
                            color: perfume.isOnSale ? Colors.red : _dark,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: _grey.withOpacity(0.5)),
          const SizedBox(height: 16),
          const Text(
            '검색 결과가 없습니다',
            style: TextStyle(color: _grey, fontSize: 14),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () {
              _searchController.clear();
              _selectedTags.clear();
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

  Widget _placeholderImage() {
    return const Center(
      child: Icon(Icons.local_florist, size: 48, color: _gold),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
  }
}