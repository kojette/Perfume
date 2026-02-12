import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

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
  final searchController = TextEditingController();
  List<Map<String, dynamic>> results = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery.isNotEmpty) {
      searchController.text = widget.initialQuery;
      _performSearch(widget.initialQuery);
    }
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String keyword) async {
    if (keyword.trim().isEmpty) return;

    setState(() => isLoading = true);

    try {
      final response = await http.get(
        Uri.parse('http://localhost:8080/api/search/functions?keyword=$keyword'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        setState(() {
          results = (data['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('검색 실패: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _handleSearchSubmit() {
    if (searchController.text.trim().isNotEmpty) {
      _performSearch(searchController.text.trim());
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
          // Search Bar
          Container(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: searchController,
                    onSubmitted: (_) => _handleSearchSubmit(),
                    decoration: InputDecoration(
                      hintText: '찾으시는 컬렉션이나 향을 입력해주세요',
                      hintStyle: TextStyle(
                        fontSize: 14,
                        letterSpacing: 1,
                        color: const Color(0xFF8B8278).withOpacity(0.5),
                      ),
                      border: const OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A961)),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A961)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                    ),
                    style: const TextStyle(
                      fontSize: 14,
                      letterSpacing: 1.5,
                      color: Color(0xFF2A2620),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _handleSearchSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2A2620),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                    shape: const RoundedRectangleBorder(),
                  ),
                  child: const Text(
                    '검색',
                    style: TextStyle(
                      letterSpacing: 3,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Results Count
          if (searchController.text.isNotEmpty && !isLoading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: const Color(0xFFC9A961).withOpacity(0.2),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Text(
                    "'${searchController.text}'에 대한 ",
                    style: const TextStyle(
                      fontSize: 12,
                      letterSpacing: 1.5,
                      color: Color(0xFF8B8278),
                    ),
                  ),
                  Text(
                    '${results.length}',
                    style: const TextStyle(
                      fontSize: 12,
                      letterSpacing: 1.5,
                      color: Color(0xFF2A2620),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    '개의 결과',
                    style: TextStyle(
                      fontSize: 12,
                      letterSpacing: 1.5,
                      color: Color(0xFF8B8278),
                    ),
                  ),
                ],
              ),
            ),
          // Content
          Expanded(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFFC9A961),
                    ),
                  )
                : results.isEmpty
                    ? _buildEmptyState()
                    : _buildResultsGrid(),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    if (searchController.text.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search,
              size: 80,
              color: Color(0xFFC9A961),
            ),
            SizedBox(height: 16),
            Text(
              '검색어를 입력해주세요',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF8B8278),
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
          border: Border.all(
            color: const Color(0xFFC9A961).withOpacity(0.3),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "입력하신 '${searchController.text}'에 대한\n상품이 존재하지 않습니다.",
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                letterSpacing: 1.5,
                color: Color(0xFF8B8278),
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: () {
                Navigator.of(context).pushNamed('/collections');
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFC9A961)),
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
              ),
              child: const Text(
                '전체 컬렉션 보기',
                style: TextStyle(
                  color: Color(0xFFC9A961),
                  letterSpacing: 3,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(24),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.6,
        crossAxisSpacing: 16,
        mainAxisSpacing: 32,
      ),
      itemCount: results.length,
      itemBuilder: (context, index) {
        final item = results[index];
        return _buildProductCard(item);
      },
    );
  }

  Widget _buildProductCard(Map<String, dynamic> item) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).pushNamed(
          '/perfume-detail',
          arguments: item['perfumeId'],
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          AspectRatio(
            aspectRatio: 3 / 4,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFEEEEEE)),
                image: item['imageUrl'] != null
                    ? DecorationImage(
                        image: NetworkImage(item['imageUrl']),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: item['imageUrl'] == null
                  ? Center(
                      child: Text(
                        item['name']?.substring(0, 1) ?? '?',
                        style: const TextStyle(
                          fontSize: 48,
                          color: Color(0xFFCCCCCC),
                        ),
                      ),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 12),
          // Name
          Text(
            item['name'] ?? '',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A1A),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          // Brand
          Text(
            item['brand']?['name'] ?? 'AION SIGNATURE',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF8B8278),
            ),
          ),
          const SizedBox(height: 8),
          // Price
          Text(
            '₩${(item['price'] as int?)?.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},') ?? '0'}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Color(0xFF2A2620),
            ),
          ),
        ],
      ),
    );
  }
}
