class Perfume {
  final int id;
  final String name;
  final String? nameEn;

  final String? brandName;
  final String? imageUrl;
  final List<String>? tags;
  final String? category;

  final int price;
  final int? salePrice;
  final int? saleRate;
  final int? volumeMl;
  final String? concentration;
  final String? gender;
  final List<String>? season;
  final List<String>? occasion;
  final double? avgRating;
  final int? reviewCount;
  final String? description;
  final bool isActive;

  Perfume({
    required this.id,
    required this.name,
    this.nameEn,
    this.brandName,
    this.imageUrl,
    this.tags,
    this.category,
    required this.price,
    this.salePrice,
    this.saleRate,
    this.volumeMl,
    this.concentration,
    this.gender,
    this.season,
    this.occasion,
    this.avgRating,
    this.reviewCount,
    this.description,
    this.isActive = true,
  });

  /// 백엔드 PerfumeController가 Perfume 엔티티를 직접 반환하는 구조:
  /// {
  ///   "perfumeId": 1,
  ///   "name": "아테나",
  ///   "nameEn": "ATHENA",
  ///   "brand": { "brandId": 1, "brandName": "올림푸스" },  // 객체
  ///   "price": 150000,
  ///   "saleRate": 10,
  ///   "salePrice": 135000,   // DB computed column
  ///   "volumeMl": 50,
  ///   "gender": "FEMALE",
  ///   "avgRating": 4.5,
  ///   "reviewCount": 23,
  ///   "description": "...",
  ///   "isActive": true
  ///   // imageUrl, tags, concentration → 백엔드 미구현, null 처리
  /// }
  factory Perfume.fromJson(Map<String, dynamic> json) {
    return Perfume(
      id: json['perfumeId'] ?? json['id'] ?? 0,
      name: json['name'] ?? '',
      nameEn: json['nameEn'] ?? json['name_en'],

      // brand가 객체로 옴 { "brandId": 1, "brandName": "..." }
      brandName: json['brand'] is Map
          ? (json['brand']['brandName'] ?? json['brand']['name'])
          : json['brandName'],

      // 백엔드 미구현 필드 → null safe
      imageUrl: json['imageUrl'] ?? json['thumbnailUrl'] ?? json['image_url'],
      tags: json['tags'] != null
          ? List<String>.from(json['tags'])
          : null,

      category: json['concentration'] ?? json['category'],

      price: json['price'] ?? 0,
      salePrice: json['salePrice'] ?? json['sale_price'],
      saleRate: json['saleRate'] ?? json['sale_rate'],
      volumeMl: json['volumeMl'] ?? json['volume_ml'],
      concentration: json['concentration'],
      gender: json['gender'],
      season: json['season'] != null
          ? List<String>.from(json['season'])
          : null,
      occasion: json['occasion'] != null
          ? List<String>.from(json['occasion'])
          : null,
      avgRating: (json['avgRating'] as num?)?.toDouble() ??
          (json['avg_rating'] as num?)?.toDouble(),
      reviewCount: json['reviewCount'] ?? json['review_count'],
      description: json['description'],
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }

  // ──────────────────────────────────────────
  // 편의 getter
  // ──────────────────────────────────────────

  /// 실제 판매 가격 (할인가 우선)
  int get displayPrice => salePrice ?? price;

  /// 할인 중 여부
  bool get isOnSale => saleRate != null && saleRate! > 0;

  /// 성별 한글 표기
  String get genderDisplay {
    if (gender == 'MALE') return '남성';
    if (gender == 'FEMALE') return '여성';
    return '중성';
  }

  /// 가격 포맷 (콤마)
  String get formattedPrice => _formatNumber(displayPrice);
  String get formattedOriginalPrice => _formatNumber(price);

  static String _formatNumber(int n) {
    return n.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
  }
}