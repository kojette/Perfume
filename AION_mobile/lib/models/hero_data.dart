class HeroData {
  final String title;
  final String subtitle;
  final String tagline;
  final List<String> images;

  HeroData({
    required this.title,
    required this.subtitle,
    required this.tagline,
    required this.images,
  });

  factory HeroData.fromJson(Map<String, dynamic> json) {
    return HeroData(
      title: json['title'] ?? 'AION',
      subtitle: json['subtitle'] ?? '영원한 그들의 향을 담다',
      tagline: json['tagline'] ?? 'ESSENCE OF DIVINE',
      images: json['images'] != null 
          ? List<String>.from(json['images'])
          : [],
    );
  }

  static HeroData get defaultHero => HeroData(
    title: 'AION',
    subtitle: '영원한 그들의 향을 담다',
    tagline: 'ESSENCE OF DIVINE',
    images: [],
  );
}