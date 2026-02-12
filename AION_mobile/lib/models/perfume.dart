class Perfume {
  final int id;
  final String name;
  final String? nameEn;
  final String? brandName;
  final int price;
  final int? salePrice;
  final int? saleRate;
  final int? volumeMl;
  final String? concentration;
  final String? gender;
  final List<String>? season;
  final List<String>? occasion;
  final double? avgRating;
  final String? imageUrl;
  final List<String>? tags;
  final String? category;
  final String? description;
  final bool isActive;

  Perfume({
    required this.id,
    required this.name,
    this.nameEn,
    this.brandName,
    required this.price,
    this.salePrice,
    this.saleRate,
    this.volumeMl,
    this.concentration,
    this.gender,
    this.season,
    this.occasion,
    this.avgRating,
    this.imageUrl,
    this.tags,
    this.category,
    this.description,
    this.isActive = true,
  });

  factory Perfume.fromJson(Map<String, dynamic> json) {
    return Perfume(
      id: json['perfumeId'] ?? json['id'] ?? 0,
      name: json['name'] ?? '',
      nameEn: json['nameEn'] ?? json['name_en'],
      brandName: json['brandName'] ?? json['brand_name'],
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
      avgRating: json['avgRating']?.toDouble() ?? json['avg_rating']?.toDouble(),
      imageUrl: json['imageUrl'] ?? json['image_url'],
      tags: json['tags'] != null 
          ? List<String>.from(json['tags'])
          : null,
      category: json['category'],
      description: json['description'],
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'perfumeId': id,
      'name': name,
      'nameEn': nameEn,
      'brandName': brandName,
      'price': price,
      'salePrice': salePrice,
      'saleRate': saleRate,
      'volumeMl': volumeMl,
      'concentration': concentration,
      'gender': gender,
      'season': season,
      'occasion': occasion,
      'avgRating': avgRating,
      'imageUrl': imageUrl,
      'tags': tags,
      'category': category,
      'description': description,
      'isActive': isActive,
    };
  }

  int get displayPrice => salePrice ?? price;
  
  bool get isOnSale => saleRate != null && saleRate! > 0;
  
  String get genderDisplay {
    if (gender == 'MALE') return '남성';
    if (gender == 'FEMALE') return '여성';
    return '중성';
  }
}