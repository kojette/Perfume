class HeroData {
  final String title;
  final String subtitle;
  final String tagline;
  final List<String> images;
  final bool isAsset; // true면 Image.asset, false면 Image.network

  HeroData({
    required this.title,
    required this.subtitle,
    required this.tagline,
    required this.images,
    this.isAsset = false,
  });

  factory HeroData.fromJson(Map<String, dynamic> json) {
    return HeroData(
      title: json['title'] ?? 'AION',
      subtitle: json['subtitle'] ?? '영원한 그들의 향을 담다',
      tagline: json['tagline'] ?? 'ESSENCE OF DIVINE',
      images: json['images'] != null
          ? List<String>.from(json['images'])
          : [],
      isAsset: false,
    );
  }

  // Supabase 데이터 없을 때 로컬 assets로 fallback
  static HeroData get defaultHero => HeroData(
    title: 'AION',
    subtitle: '영원한 그들의 향을 담다',
    tagline: 'ESSENCE OF DIVINE',
    images: [
      'assets/11.png',
      'assets/12.jpg',
      'assets/13.jpg',
    ],
    isAsset: true,
  );
}
