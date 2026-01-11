import 'package:flutter/material.dart';

/// 웹 Recommend.jsx 대응 화면
/// - 검색어
/// - 태그 입력
/// - 정렬
/// - 필터링 로직 그대로 이식
class RecommendScreen extends StatefulWidget {
  const RecommendScreen({super.key});

  @override
  State<RecommendScreen> createState() => _RecommendScreenState();
}

class _RecommendScreenState extends State<RecommendScreen> {
  // 🔍 검색어 (웹: searchTerm)
  String searchTerm = "";

  // 🏷️ 태그 입력값 (웹: tagInput)
  final TextEditingController tagController = TextEditingController();

  // 🏷️ 선택된 태그들 (웹: selectedTags)
  List<String> selectedTags = [];

  // 🔃 정렬 기준 (웹: sortBy)
  String sortBy = "latest";

  // 📦 실제 향수 데이터 (웹 perfumeData 그대로)
  final List<Map<String, dynamic>> perfumeData = [
    {
      "id": 1,
      "name": "아폴론의 빛",
      "nameEn": "APOLLO'S RADIANCE",
      "category": "시트러스 & 우디",
      "price": 385000,
      "tags": ["시트러스", "우디", "남성", "데이트", "아폴론", "밝은"],
      "rating": 5,
    },
    {
      "id": 2,
      "name": "아프로디테의 정원",
      "nameEn": "APHRODITE'S GARDEN",
      "category": "플로럴 & 머스크",
      "price": 365000,
      "tags": ["플로럴", "머스크", "여성", "로맨틱", "아프로디테", "우아한"],
      "rating": 5,
    },
    {
      "id": 3,
      "name": "아르테미스의 숲",
      "nameEn": "ARTEMIS' FOREST",
      "category": "그린 & 우디",
      "price": 345000,
      "tags": ["그린", "우디", "중성", "자연", "아르테미스", "청량한"],
      "rating": 5,
    },
  ];

  /// 🔁 웹 useMemo → Flutter getter
  List<Map<String, dynamic>> get filteredPerfumes {
    List<Map<String, dynamic>> result = [...perfumeData];

    // 1️⃣ 검색어 필터링
    if (searchTerm.isNotEmpty) {
      result = result.where((p) {
        return p["name"].contains(searchTerm) ||
            p["nameEn"].contains(searchTerm) ||
            p["category"].contains(searchTerm);
      }).toList();
    }

    // 2️⃣ 태그 필터링
    if (selectedTags.isNotEmpty) {
      result = result.where((p) {
        return selectedTags.any((tag) =>
            (p["tags"] as List).any((t) => t.contains(tag)));
      }).toList();
    }

    // 3️⃣ 정렬
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a["price"] - b["price"]);
        break;
      case "price-high":
        result.sort((a, b) => b["price"] - a["price"]);
        break;
      case "rating":
        result.sort((a, b) => b["rating"] - a["rating"]);
        break;
      case "latest":
      default:
        result = result.reversed.toList();
        break;
    }

    return result;
  }

  // 🏷️ 태그 추가 (웹 handleKeyDown 대응)
  void addTag() {
    final value = tagController.text.trim();
    if (value.isNotEmpty && !selectedTags.contains(value)) {
      setState(() {
        selectedTags.add(value);
      });
    }
    tagController.clear();
  }

  // 🗑️ 태그 제거
  void removeTag(String tag) {
    setState(() {
      selectedTags.remove(tag);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 🔤 타이틀
              const Center(
                child: Column(
                  children: [
                    Text(
                      'RECOMMEND',
                      style: TextStyle(
                        fontSize: 28,
                        letterSpacing: 6,
                        color: Color(0xFFC9A961),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      '당신의 취향을 바탕으로 향을 제안합니다',
                      style: TextStyle(fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),

              // 🔍 검색창
              TextField(
                decoration: const InputDecoration(
                  hintText: '상품명, 카테고리 검색',
                ),
                onChanged: (v) => setState(() => searchTerm = v),
              ),

              const SizedBox(height: 12),

              // 🏷️ 태그 입력
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: tagController,
                      decoration: const InputDecoration(
                        hintText: '태그 입력 후 추가',
                      ),
                      onSubmitted: (_) => addTag(),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: addTag,
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // 🏷️ 선택된 태그 표시
              Wrap(
                spacing: 8,
                children: selectedTags
                    .map(
                      (tag) => Chip(
                        label: Text('#$tag'),
                        onDeleted: () => removeTag(tag),
                      ),
                    )
                    .toList(),
              ),

              const SizedBox(height: 20),

              // 📃 리스트
              Expanded(
                child: filteredPerfumes.isNotEmpty
                    ? ListView.builder(
                        itemCount: filteredPerfumes.length,
                        itemBuilder: (context, index) {
                          final p = filteredPerfumes[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              title: Text(p["name"]),
                              subtitle: Text(p["category"]),
                              trailing: Text(
                                '₩${p["price"]}',
                                style: const TextStyle(
                                    color: Color(0xFFC9A961)),
                              ),
                            ),
                          );
                        },
                      )
                    : const Center(
                        child: Text('검색 결과가 없습니다'),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
