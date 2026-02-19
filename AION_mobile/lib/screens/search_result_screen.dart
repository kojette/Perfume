import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/perfume.dart';

class SearchResultScreen extends StatefulWidget {
  final String initialQuery;

  const SearchResultScreen({
    super.key,
    this.initialQuery = '',
  });

  @override
  State<SearchResultScreen> createState() => _SearchResultScreenState();
}

class _SearchResultScreenState extends State<SearchResultScreen> {
  final _searchController = TextEditingController();
  List<Perfume> _results = [];
  bool _isLoading = false;

  // 전체 향수 캐시 (한 번만 로드, 앱 세션 동안 재사용)
  static List<Perfume>? _cachedPerfumes;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery.isNotEmpty) {
      _searchController.text = widget.initialQuery;
      _performSearch(widget.initialQuery);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String keyword) async {
    if (keyword.trim().isEmpty) return;

    setState(() => _isLoading = true);

    try {
      // 캐시 없으면 파라미터 없이 단순 호출
      if (_cachedPerfumes == null) {
        final response = await http.get(
          Uri.parse('${ApiConfig.baseUrl}/api/perfumes'),
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(utf8.decode(response.bodyBytes));
          List items = [];
          if (data is List) {
            items = data;
          } else if (data is Map) {
            if (data['content'] is List) items = data['content'];
            else if (data['data'] is List) items = data['data'];
          }
          _cachedPerfumes = items
              .map((e) => Perfume.fromJson(e as Map<String, dynamic>))
              .toList();
        } else {
          throw Exception('향수 로드 실패: ${response.statusCode}');
        }
      }

      // Flutter에서 키워드 필터링
      final kw = keyword.trim().toLowerCase();
      final filtered = (_cachedPerfumes ?? []).where((p) {
        return p.name.toLowerCase().contains(kw) ||
            (p.nameEn?.toLowerCase().contains(kw) ?? false) ||
            (p.brandName?.toLowerCase().contains(kw) ?? false) ||
            (p.description?.toLowerCase().contains(kw) ?? false);
      }).toList();

      if (mounted) setState(() => _results = filtered);
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

  void _handleSearchSubmit() {
    if (_searchController.text.trim().isNotEmpty) {
      _performSearch(_searchController.text.trim());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('SEARCH', style: TextStyle(letterSpacing: 4)),
      ),
      body: Column(
        children: [
          // 검색 바
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _handleSearchSubmit(),
                    decoration: InputDecoration(
                      hintText: '찾으시는 컬렉션이나 향을 입력해주세요',
                      hintStyle: TextStyle(
                        fontSize: 14,
                        letterSpacing: 1,
                        color: _grey.withOpacity(0.5),
                      ),
                      border: const OutlineInputBorder(
                        borderSide: BorderSide(color: _gold),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderSide: BorderSide(color: _gold),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 16),
                    ),
                    style: const TextStyle(
                      fontSize: 14,
                      letterSpacing: 1.5,
                      color: _dark,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _handleSearchSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _dark,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 16),
                    shape: const RoundedRectangleBorder(),
                  ),
                  child: const Text(
                    '검색',
                    style: TextStyle(letterSpacing: 3, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),

          // 결과 카운트
          if (_searchController.text.isNotEmpty && !_isLoading)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: _gold.withOpacity(0.2)),
                ),
              ),
              child: Row(
                children: [
                  Text(
                    "'${_searchController.text}'에 대한 ",
                    style: const TextStyle(
                        fontSize: 12, letterSpacing: 1.5, color: _grey),
                  ),
                  Text(
                    '${_results.length}',
                    style: const TextStyle(
                        fontSize: 12,
                        letterSpacing: 1.5,
                        color: _dark,
                        fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    '개의 결과',
                    style: TextStyle(
                        fontSize: 12, letterSpacing: 1.5, color: _grey),
                  ),
                ],
              ),
            ),

          // 결과
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: _gold))
                : _results.isEmpty
                    ? _buildEmptyState()
                    : _buildResultsGrid(),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    if (_searchController.text.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search, size: 80, color: _gold),
            SizedBox(height: 16),
            Text(
              '검색어를 입력해주세요',
              style: TextStyle(
                fontSize: 14,
                color: _grey,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

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
            Text(
              "'${_searchController.text}'에 대한\n상품이 존재하지 않습니다.",
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                letterSpacing: 1.5,
                color: _grey,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: () =>
                  Navigator.of(context).pushNamed('/collections'),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: _gold),
                padding: const EdgeInsets.symmetric(
                    horizontal: 32, vertical: 12),
              ),
              child: const Text(
                '전체 컬렉션 보기',
                style: TextStyle(color: _gold, letterSpacing: 3, fontSize: 10),
              ),
            ),
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
      onTap: () {},
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // 이미지: AspectRatio로 비율 고정, 절대 overflow 없음
          AspectRatio(
            aspectRatio: 3 / 4,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFFAF8F3),
                border: Border.all(color: const Color(0xFFEEEEEE)),
              ),
              child: Stack(
                children: [
                  perfume.imageUrl != null
                      ? Image.network(
                          perfume.imageUrl!,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          errorBuilder: (_, __, ___) => _placeholder(perfume),
                        )
                      : _placeholder(perfume),
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
          // 텍스트: mainAxisSize.min → 내용만큼만 차지
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 6, 4, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (perfume.brandName != null)
                  Text(
                    perfume.brandName!,
                    style: const TextStyle(fontSize: 9, color: _grey),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                Text(
                  perfume.name,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A1A),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (perfume.isOnSale)
                  Text(
                    '₩${perfume.formattedOriginalPrice}',
                    style: const TextStyle(
                      fontSize: 9,
                      color: _grey,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                Text(
                  '₩${perfume.formattedPrice}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: perfume.isOnSale ? Colors.red : _dark,
                  ),
                ),
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
        perfume.name.isNotEmpty ? perfume.name.substring(0, 1) : '?',
        style: const TextStyle(fontSize: 40, color: Color(0xFFCCCCCC)),
      ),
    );
  }
}