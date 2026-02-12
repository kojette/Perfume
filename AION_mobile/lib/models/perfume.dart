class Perfume {
  final int id;
  final String name;
  final String? nameEn;

  // 기존 화면들이 사용하는 필드들 (null 허용)
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
    this.description,
    this.isActive = true,
  });

  factory Perfume.fromJson(Map<String, dynamic> json) {
    return Perfume(
      id: json['perfumeId'] ?? json['id'] ?? 0,
      name: json['name'] ?? '',
      nameEn: json['nameEn'] ?? json['name_en'],

      // ⭐ 핵심: 목록 API에 없으므로 안전하게 null
      brandName: json['brand']?['brandName'],
      imageUrl: json['imageUrl'] ?? json['image_url'],
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      category: json['category'],

      price: json['price'] ?? 0,
      salePrice: json['salePrice'] ?? json['sale_price'],
      saleRate: json['saleRate'] ?? json['sale_rate'],
      volumeMl: json['volumeMl'] ?? json['volume_ml'],
      concentration: json['concentration'],
      gender: json['gender'],
      season: json['season'] != null ? List<String>.from(json['season']) : null,
      occasion: json['occasion'] != null ? List<String>.from(json['occasion']) : null,
      avgRating: (json['avgRating'] as num?)?.toDouble(),
      description: json['description'],
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }

  int get displayPrice => salePrice ?? price;

  bool get isOnSale => saleRate != null && saleRate! > 0;

  String get genderDisplay {
    if (gender == 'MALE') return '남성';
    if (gender == 'FEMALE') return '여성';
    return '중성';
  }
}
