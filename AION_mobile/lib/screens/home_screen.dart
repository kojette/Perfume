import 'package:flutter/material.dart';
import 'dart:async';
import '../services/api_service_extended.dart';
import '../models/hero_data.dart';
import '../models/perfume.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HeroData? _heroData;
  List<Perfume> _featuredPerfumes = [];
  bool _loading = true;
  int _currentHeroIndex = 0;
  Timer? _heroTimer;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _heroTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final heroData = await ApiService.getActiveHero();
      final perfumes = await ApiService.fetchPerfumes(size: 8);

      if (mounted) {
        setState(() {
          _heroData = heroData ?? HeroData.defaultHero;
          _featuredPerfumes = perfumes;
        });

        // Hero 이미지 자동 전환
        if (_heroData!.images.isNotEmpty) {
          _heroTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
            if (mounted) {
              setState(() {
                _currentHeroIndex = 
                    (_currentHeroIndex + 1) % _heroData!.images.length;
              });
            }
          });
        }
      }
    } catch (e) {
      debugPrint('데이터 로딩 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: _bg,
        body: Center(
          child: CircularProgressIndicator(color: _gold),
        ),
      );
    }

    return Scaffold(
      backgroundColor: _bg,
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: _gold,
        child: CustomScrollView(
          slivers: [
            // Hero Section
            _buildHeroSection(),
            
            // Featured Products Section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(
                  children: [
                    _buildSectionTitle('FEATURED PERFUMES'),
                    const SizedBox(height: 32),
                    _buildFeaturedGrid(),
                  ],
                ),
              ),
            ),

            // About Section (간단히)
            SliverToBoxAdapter(
              child: _buildAboutSection(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    final hero = _heroData ?? HeroData.defaultHero;
    final hasImages = hero.images.isNotEmpty;

    return SliverToBoxAdapter(
      child: Container(
        height: 500,
        decoration: BoxDecoration(
          image: hasImages
              ? DecorationImage(
                  image: NetworkImage(hero.images[_currentHeroIndex]),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(
                    Colors.black.withOpacity(0.4),
                    BlendMode.darken,
                  ),
                )
              : null,
          gradient: hasImages
              ? null
              : LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _dark.withOpacity(0.9),
                    _dark.withOpacity(0.6),
                  ],
                ),
        ),
        child: Stack(
          children: [
            // 텍스트 콘텐츠
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    hero.tagline,
                    style: const TextStyle(
                      color: _gold,
                      fontSize: 11,
                      letterSpacing: 4,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildOrnament(),
                  const SizedBox(height: 24),
                  Text(
                    hero.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 8,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    hero.subtitle,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),

            // 이미지 인디케이터
            if (hasImages && hero.images.length > 1)
              Positioned(
                bottom: 24,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    hero.images.length,
                    (index) => Container(
                      width: index == _currentHeroIndex ? 24 : 8,
                      height: 8,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: index == _currentHeroIndex
                            ? _gold
                            : Colors.white.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturedGrid() {
    if (_featuredPerfumes.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(40),
        child: Text(
          '등록된 향수가 없습니다',
          style: TextStyle(color: _grey, fontSize: 14),
          textAlign: TextAlign.center,
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        crossAxisSpacing: 16,
        mainAxisSpacing: 24,
      ),
      itemCount: _featuredPerfumes.length,
      itemBuilder: (context, index) {
        return _buildPerfumeCard(_featuredPerfumes[index]);
      },
    );
  }

  Widget _buildPerfumeCard(Perfume perfume) {
    return GestureDetector(
      onTap: () {
        // TODO: 향수 상세 페이지로 이동
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
              child: Container(
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
            ),

            // 정보
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 브랜드
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

                    // 향수명
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

                    // 가격
                    Row(
                      children: [
                        if (perfume.isOnSale) ...[
                          Text(
                            '${perfume.price.toString().replaceAllMapped(
                              RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                              (m) => '${m[1]},',
                            )}원',
                            style: const TextStyle(
                              color: _grey,
                              fontSize: 10,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          '${perfume.displayPrice.toString().replaceAllMapped(
                            RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                            (m) => '${m[1]},',
                          )}원',
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

  Widget _buildAboutSection() {
    return Container(
      padding: const EdgeInsets.all(40),
      margin: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      decoration: BoxDecoration(
        color: _dark,
        border: Border.all(color: _gold.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Text(
            'ABOUT AION',
            style: TextStyle(
              color: _gold,
              fontSize: 10,
              letterSpacing: 4,
            ),
          ),
          const SizedBox(height: 16),
          _buildOrnament(color: _gold),
          const SizedBox(height: 24),
          const Text(
            '영원의 신들이 머물던 향기',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'AION은 그리스 신화 속 신들의 영원한 향기를 현대에 재현합니다.\n'
            '각 향수는 신들의 이야기를 담고 있으며,\n'
            '당신만의 신화를 만들어갑니다.',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 12,
              height: 1.8,
              letterSpacing: 1,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Column(
      children: [
        Text(
          title,
          style: const TextStyle(
            color: _dark,
            fontSize: 11,
            letterSpacing: 4,
          ),
        ),
        const SizedBox(height: 12),
        _buildOrnament(),
      ],
    );
  }

  Widget _buildOrnament({Color color = _gold}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 40, height: 1, color: color),
        const SizedBox(width: 8),
        Icon(Icons.auto_awesome, size: 12, color: color),
        const SizedBox(width: 8),
        Container(width: 40, height: 1, color: color),
      ],
    );
  }

  Widget _placeholderImage() {
    return const Center(
      child: Icon(Icons.local_florist, size: 48, color: _gold),
    );
  }
}