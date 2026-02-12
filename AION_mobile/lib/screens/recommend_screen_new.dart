import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RecommendScreen extends StatefulWidget {
  const RecommendScreen({super.key});

  @override
  State<RecommendScreen> createState() => _RecommendScreenState();
}

class _RecommendScreenState extends State<RecommendScreen> {
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> perfumeData = [];
  bool isLoading = true;
  String? error;

  String searchTerm = '';
  String tagInput = '';
  List<String> selectedTags = [];
  String sortBy = 'latest';

  @override
  void initState() {
    super.initState();
    _fetchPerfumes();
  }

  Future<void> _fetchPerfumes() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await supabase
          .from('Perfumes')
          .select('''
            perfume_id,
            name,
            name_en,
            price,
            sale_rate,
            sale_price,
            volume_ml,
            concentration,
            gender,
            season,
            occasion,
            avg_rating,
            is_active,
            brand_id,
            Brands (
              brand_name,
              brand_name_en
            ),
            Perfume_Notes (
              note_type,
              Scents (
                scent_name
              )
            ),
            Perfume_Tags (
              Preference_Tags (
                tag_name,
                tag_type
              )
            )
          ''')
          .eq('is_active', true)
          .order('created_at', ascending: false);

      final transformedData = (response as List).map((perfume) {
        final scentCategories = <String>{};
        if (perfume['Perfume_Notes'] != null) {
          for (var note in perfume['Perfume_Notes']) {
            if (note['Scents']?['scent_category'] != null) {
              scentCategories.add(note['Scents']['scent_category']);
            }
          }
        }

        final tags = <String>[];
        if (perfume['Perfume_Tags'] != null) {
          for (var pt in perfume['Perfume_Tags']) {
            if (pt['Preference_Tags']?['tag_name'] != null) {
              tags.add(pt['Preference_Tags']['tag_name']);
            }
          }
        }

        if (perfume['gender'] == 'MALE') {
          tags.add('남성');
        } else if (perfume['gender'] == 'FEMALE') {
          tags.add('여성');
        } else {
          tags.add('중성');
        }

        if (perfume['season'] != null) {
          tags.addAll((perfume['season'] as List).cast<String>());
        }
        if (perfume['occasion'] != null) {
          tags.addAll((perfume['occasion'] as List).cast<String>());
        }

        return {
          'id': perfume['perfume_id'],
          'name': perfume['name'],
          'nameEn': perfume['name_en'] ?? perfume['name'],
          'greekName': perfume['name'],
          'category': scentCategories.join(' & '),
          'price': perfume['sale_price'] ?? perfume['price'],
          'originalPrice': (perfume['sale_rate'] ?? 0) > 0 ? perfume['price'] : null,
          'discountRate': perfume['sale_rate'] ?? 0,
          'tags': tags,
          'description':
              '${perfume['Brands']?['brand_name'] ?? ''} ${perfume['volume_ml']}ml ${perfume['concentration'] ?? ''}',
          'rating': ((perfume['avg_rating'] ?? 0) as num).round(),
          'brand': perfume['Brands']?['brand_name'] ?? '',
        };
      }).toList();

      setState(() {
        perfumeData = transformedData;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get filteredAndSortedPerfumes {
    var result = List<Map<String, dynamic>>.from(perfumeData);

    // Search filter
    if (searchTerm.trim().isNotEmpty) {
      result = result.where((perfume) {
        final search = searchTerm.toLowerCase();
        return perfume['name'].toString().toLowerCase().contains(search) ||
            perfume['nameEn'].toString().toLowerCase().contains(search) ||
            perfume['category'].toString().toLowerCase().contains(search) ||
            perfume['brand'].toString().toLowerCase().contains(search);
      }).toList();
    }

    // Tag filter
    if (selectedTags.isNotEmpty) {
      result = result.where((perfume) {
        final perfumeTags = (perfume['tags'] as List).cast<String>();
        return selectedTags.any((selectedTag) => perfumeTags.any(
            (perfumeTag) => perfumeTag.toLowerCase().contains(selectedTag.toLowerCase())));
      }).toList();
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a['price'] as int).compareTo(b['price'] as int));
        break;
      case 'price-high':
        result.sort((a, b) => (b['price'] as int).compareTo(a['price'] as int));
        break;
      case 'rating':
        result.sort((a, b) => (b['rating'] as int).compareTo(a['rating'] as int));
        break;
      case 'popular':
        result.sort((a, b) {
          final ratingCompare = (b['rating'] as int).compareTo(a['rating'] as int);
          if (ratingCompare != 0) return ratingCompare;
          return (a['id'] as int).compareTo(b['id'] as int);
        });
        break;
      case 'latest':
      default:
        break;
    }

    return result;
  }

  void _addTag(String tag) {
    if (tag.trim().isNotEmpty && !selectedTags.contains(tag.trim())) {
      setState(() {
        selectedTags.add(tag.trim());
      });
    }
  }

  void _removeTag(String tag) {
    setState(() {
      selectedTags.remove(tag);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: const Text('RECOMMEND', style: TextStyle(letterSpacing: 4)),
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Color(0xFFC9A961)),
              SizedBox(height: 16),
              Text(
                '향수 데이터를 불러오는 중...',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF8B8278),
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: const Text('RECOMMEND', style: TextStyle(letterSpacing: 4)),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                '⚠️',
                style: TextStyle(fontSize: 60),
              ),
              const SizedBox(height: 16),
              const Text(
                '데이터를 불러오는 중 오류가 발생했습니다',
                style: TextStyle(fontSize: 16, color: Colors.red),
              ),
              const SizedBox(height: 8),
              Text(
                error!,
                style: const TextStyle(fontSize: 12, color: Color(0xFFA39D8F)),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _fetchPerfumes,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC9A961),
                ),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('RECOMMEND', style: TextStyle(letterSpacing: 4)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 24),
            // Title
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  Text(
                    'RECOMMEND',
                    style: TextStyle(
                      fontSize: 32,
                      letterSpacing: 8,
                      color: Color(0xFFC9A961),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '당신의 취향을 바탕으로 향을 제안합니다',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6F6756),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Quick Theme Recommendations
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: [
                  _buildThemeButton('💼', '오피스', 'Office', () {
                    setState(() {
                      selectedTags = ['오피스', 'OFFICE'];
                    });
                  }),
                  const SizedBox(width: 12),
                  _buildThemeButton('💕', '데이트', 'Date', () {
                    setState(() {
                      selectedTags = ['데이트', 'DATE'];
                    });
                  }),
                  const SizedBox(width: 12),
                  _buildThemeButton('🌿', '청량한', 'Fresh', () {
                    setState(() {
                      selectedTags = ['청량한', 'FRESH'];
                    });
                  }),
                  const SizedBox(width: 12),
                  _buildThemeButton('🌸', '봄/여름', 'Spring/Summer', () {
                    setState(() {
                      searchTerm = '플로럴';
                    });
                  }),
                  const SizedBox(width: 12),
                  _buildThemeButton('🍂', '가을/겨울', 'Fall/Winter', () {
                    setState(() {
                      searchTerm = '우디';
                    });
                  }),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Search and Sort
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          onChanged: (value) {
                            setState(() {
                              searchTerm = value;
                            });
                          },
                          decoration: InputDecoration(
                            hintText: '상품명, 카테고리 검색',
                            hintStyle: const TextStyle(
                              fontSize: 14,
                              fontStyle: FontStyle.italic,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: const Color(0xFFC9A961).withOpacity(0.3),
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Color(0xFFC9A961),
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: const Color(0xFFC9A961).withOpacity(0.3),
                          ),
                          borderRadius: BorderRadius.circular(12),
                          color: Colors.white.withOpacity(0.7),
                        ),
                        child: DropdownButton<String>(
                          value: sortBy,
                          onChanged: (value) {
                            if (value != null) {
                              setState(() {
                                sortBy = value;
                              });
                            }
                          },
                          underline: const SizedBox(),
                          items: const [
                            DropdownMenuItem(value: 'latest', child: Text('최신순')),
                            DropdownMenuItem(value: 'price-low', child: Text('가격 낮은순')),
                            DropdownMenuItem(value: 'price-high', child: Text('가격 높은순')),
                            DropdownMenuItem(value: 'rating', child: Text('평점순')),
                            DropdownMenuItem(value: 'popular', child: Text('인기순')),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Tag Input
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'PREFERENCE TAGS',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.5,
                          color: Color(0xFF6F6756),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: const Color(0xFFC9A961).withOpacity(0.3),
                          ),
                          borderRadius: BorderRadius.circular(16),
                          color: Colors.white.withOpacity(0.7),
                        ),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ...selectedTags.map((tag) => Chip(
                                  label: Text('#$tag'),
                                  deleteIcon: const Icon(Icons.close, size: 16),
                                  onDeleted: () => _removeTag(tag),
                                  backgroundColor: Colors.white,
                                  side: BorderSide(
                                    color: const Color(0xFFC9A961).withOpacity(0.5),
                                  ),
                                  labelStyle: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFFC9A961),
                                    fontStyle: FontStyle.italic,
                                  ),
                                )),
                            SizedBox(
                              width: 200,
                              child: TextField(
                                onSubmitted: (value) {
                                  _addTag(value);
                                  setState(() {
                                    tagInput = '';
                                  });
                                },
                                decoration: const InputDecoration(
                                  hintText: 'ex) 플로럴, 데이트',
                                  hintStyle: TextStyle(
                                    fontSize: 14,
                                    fontStyle: FontStyle.italic,
                                  ),
                                  border: InputBorder.none,
                                ),
                                style: const TextStyle(fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Enter 키로 태그 추가 · 태그 클릭으로 제거',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF8B8278),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Results Count
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'RECOMMENDED SCENTS',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.5,
                      color: Color(0xFF6F6756),
                    ),
                  ),
                  Text(
                    '${filteredAndSortedPerfumes.length}개의 향수',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Results List
            filteredAndSortedPerfumes.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(80),
                    child: Column(
                      children: [
                        Text('🔍', style: TextStyle(fontSize: 60)),
                        SizedBox(height: 16),
                        Text(
                          '검색 결과가 없습니다',
                          style: TextStyle(
                            fontSize: 16,
                            color: Color(0xFF8B8278),
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          '다른 키워드나 태그로 검색해보세요',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFFA39D8F),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    itemCount: filteredAndSortedPerfumes.length,
                    itemBuilder: (context, index) {
                      final perfume = filteredAndSortedPerfumes[index];
                      return _buildPerfumeCard(perfume);
                    },
                  ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeButton(
    String emoji,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 110,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.7),
          border: Border.all(
            color: const Color(0xFFC9A961).withOpacity(0.2),
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                letterSpacing: 1,
                color: Color(0xFF2A2620),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF8B8278),
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerfumeCard(Map<String, dynamic> perfume) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: const LinearGradient(
                colors: [Color(0xFFE8E2D6), Color(0xFFD4CFC3)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Center(
              child: Text(
                perfume['name'].toString().substring(0, 1),
                style: TextStyle(
                  fontSize: 24,
                  color: Colors.black.withOpacity(0.4),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  perfume['name'],
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.5,
                    color: Color(0xFF3F3B2F),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  perfume['nameEn'],
                  style: const TextStyle(
                    fontSize: 12,
                    letterSpacing: 1,
                    color: Color(0xFFC9A961),
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  perfume['category'],
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF7A735F),
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: (perfume['tags'] as List)
                      .take(4)
                      .map((tag) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F1E8),
                              border: Border.all(color: const Color(0xFFE8E2D6)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '#$tag',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Color(0xFF8B8278),
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
          // Price and Rating
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if ((perfume['discountRate'] ?? 0) > 0) ...[
                Text(
                  '₩${(perfume['originalPrice'] as int?)?.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},') ?? '0'}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.red,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      '₩${(perfume['price'] as int).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFC9A961),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${perfume['discountRate']}%',
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange,
                        ),
                      ),
                    ),
                  ],
                ),
              ] else
                Text(
                  '₩${(perfume['price'] as int).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFC9A961),
                  ),
                ),
              const SizedBox(height: 4),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    Icons.star,
                    size: 14,
                    color: i < (perfume['rating'] as int)
                        ? const Color(0xFFC9A961)
                        : const Color(0xFFE8E2D6),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
