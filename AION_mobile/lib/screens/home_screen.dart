import 'package:flutter/material.dart';
import 'dart:async';
import '../services/api_service_extended.dart';
import '../models/hero_data.dart';
import '../models/perfume.dart';
import '../widgets/event_banner_widget.dart';

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
        final resolvedHero = (heroData != null && heroData.images.isNotEmpty)
            ? heroData
            : HeroData.defaultHero;
        setState(() {
          _heroData = resolvedHero;
          _featuredPerfumes = perfumes;
        });
        if (_heroData!.images.isNotEmpty) {
          _heroTimer = Timer.periodic(const Duration(seconds: 5), (_) {
            if (mounted) setState(() => _currentHeroIndex = (_currentHeroIndex + 1) % _heroData!.images.length);
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
      return const Scaffold(backgroundColor: _bg, body: Center(child: CircularProgressIndicator(color: _gold)));
    }

    return Scaffold(
      backgroundColor: _bg,
      drawer: _buildDrawer(),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: _gold,
        child: CustomScrollView(
          slivers: [
            _buildSliverAppBar(),
            SliverToBoxAdapter(child: EventBannerWidget()),
            _buildHeroSection(),
            SliverToBoxAdapter(child: _buildQuickMenu()),
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
            SliverToBoxAdapter(child: _buildAboutSection()),
            SliverToBoxAdapter(child: _buildNewsletterSection()),
            SliverToBoxAdapter(child: _buildFooter()),
          ],
        ),
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      pinned: false,
      floating: true,
      leading: Builder(
        builder: (ctx) => IconButton(
          icon: const Icon(Icons.menu, color: _dark, size: 22),
          onPressed: () => Scaffold.of(ctx).openDrawer(),
        ),
      ),
      title: const Text(
        'AION',
        style: TextStyle(
          color: _dark,
          fontSize: 16,
          letterSpacing: 8,
          fontWeight: FontWeight.w300,
        ),
      ),
      centerTitle: true,
      actions: [
        IconButton(
          icon: Stack(
            children: [
              const Icon(Icons.notifications_none, color: _dark, size: 22),
              Positioned(
                top: 0, right: 0,
                child: Container(
                  width: 7, height: 7,
                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                ),
              ),
            ],
          ),
          onPressed: () => Navigator.pushNamed(context, '/notifications'),
        ),
        IconButton(
          icon: const Icon(Icons.search, color: _dark, size: 22),
          onPressed: () => Navigator.pushNamed(context, '/search'),
        ),

        IconButton(
          icon: const Icon(Icons.favorite_border, color: _dark, size: 22),
          onPressed: () => Navigator.pushNamed(context, '/wishlist'),
        ),
        IconButton(
          icon: const Icon(Icons.shopping_bag_outlined, color: _dark, size: 22),
          onPressed: () => Navigator.pushNamed(context, '/cart'),
        ),
        IconButton(
          icon: const Icon(Icons.person_outline, color: _dark, size: 22),
          onPressed: () => Navigator.pushNamed(context, '/mypage'),
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(0.5),
        child: Container(height: 0.5, color: _gold.withOpacity(0.2)),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: const Color(0xFF0E0C09),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('AION', style: TextStyle(color: _gold, fontSize: 28, letterSpacing: 10, fontWeight: FontWeight.w200)),
                  const SizedBox(height: 4),
                  Text('PERFUME', style: TextStyle(color: _gold.withOpacity(0.5), fontSize: 10, letterSpacing: 6)),
                  const SizedBox(height: 16),
                  Container(height: 1, color: _gold.withOpacity(0.2)),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _drawerItem(Icons.local_florist_outlined, '향수 추천', '/recommend'),
                    _drawerItem(Icons.menu_book_outlined, '컬렉션', null, onTap: () {
                      Navigator.pop(context);
                    }),
                    _drawerItem(Icons.water_drop_outlined, '나만의 향 조합', '/custom'),
                    _drawerItem(Icons.store_outlined, '매장 안내', '/store'),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Container(height: 0.5, color: _gold.withOpacity(0.15)),
                    ),
                    const SizedBox(height: 8),
                    _drawerItem(Icons.favorite_border, '위시리스트', '/wishlist'),
                    _drawerItem(Icons.shopping_bag_outlined, '장바구니', '/cart'),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Container(height: 0.5, color: _gold.withOpacity(0.15)),
                    ),
                    const SizedBox(height: 8),
                    _drawerItem(Icons.help_outline, 'FAQ', '/faq'),
                    _drawerItem(Icons.mail_outline, '고객 문의', '/customer-inquiry'),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Container(height: 0.5, color: _gold.withOpacity(0.15)),
                    ),
                    const SizedBox(height: 8),
                    _drawerItem(Icons.article_outlined, '이용약관', '/terms'),
                    _drawerItem(Icons.privacy_tip_outlined, '개인정보처리방침', '/privacy'),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                '© 2026 AION Perfume',
                style: TextStyle(fontSize: 10, color: _gold.withOpacity(0.25), letterSpacing: 1),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, String? route, {VoidCallback? onTap}) {
    return ListTile(
      leading: Icon(icon, color: _gold.withOpacity(0.6), size: 18),
      title: Text(
        label,
        style: TextStyle(
          color: Colors.white.withOpacity(0.75),
          fontSize: 13,
          letterSpacing: 1.5,
        ),
      ),
      dense: true,
      onTap: onTap ?? () {
        if (route != null) {
          Navigator.pop(context);
          Navigator.pushNamed(context, route);
        }
      },
      hoverColor: _gold.withOpacity(0.05),
    );
  }

  Widget _buildHeroSection() {
    final hero = _heroData ?? HeroData.defaultHero;
    final hasImages = hero.images.isNotEmpty;

    return SliverToBoxAdapter(
      child: SizedBox(
        height: 460,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (hasImages)
              hero.isAsset
                  ? Image.asset(
                      hero.images[_currentHeroIndex],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: _dark),
                    )
                  : Image.network(
                      hero.images[_currentHeroIndex],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: _dark),
                    )
            else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter, end: Alignment.bottomCenter,
                    colors: [_dark.withOpacity(0.9), _dark.withOpacity(0.6)],
                  ),
                ),
              ),
            Container(color: Colors.black.withOpacity(0.38)),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    hero.tagline,
                    style: const TextStyle(color: _gold, fontSize: 11, letterSpacing: 4, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 16),
                  _buildOrnament(),
                  const SizedBox(height: 24),
                  Text(
                    hero.title,
                    style: const TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.w200, letterSpacing: 8),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    hero.subtitle,
                    style: const TextStyle(color: Colors.white70, fontSize: 13, letterSpacing: 2),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/recommend'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      decoration: BoxDecoration(
                        border: Border.all(color: _gold.withOpacity(0.7)),
                        color: Colors.transparent,
                      ),
                      child: const Text(
                        'DISCOVER NOW',
                        style: TextStyle(color: _gold, fontSize: 10, letterSpacing: 4),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (hasImages && hero.images.length > 1)
              Positioned(
                bottom: 20, left: 0, right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(hero.images.length, (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: i == _currentHeroIndex ? 20 : 6,
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      color: i == _currentHeroIndex ? _gold : Colors.white.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  )),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickMenu() {
    final row1 = [
      {'icon': Icons.menu_book_outlined, 'label': 'LIBRARY', 'route': '/collections'},
      {'icon': Icons.auto_fix_high_outlined, 'label': 'SIGNATURE', 'route': '/signature'},
      {'icon': Icons.local_florist_outlined, 'label': 'RECOMMEND', 'route': '/recommend'},
      {'icon': Icons.water_drop_outlined, 'label': 'CUSTOM', 'route': '/custom'},
      {'icon': Icons.history_edu_outlined, 'label': 'STORY', 'route': '/story'},
      {'icon': Icons.store_outlined, 'label': 'STORE', 'route': '/store'},
    ];

    Widget menuItem(Map item) => GestureDetector(
      onTap: () {
        final route = item['route'] as String?;
        if (route != null) Navigator.pushNamed(context, route);
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              border: Border.all(color: _gold.withOpacity(0.3)),
              color: _gold.withOpacity(0.04),
            ),
            child: Icon(item['icon'] as IconData, color: _dark.withOpacity(0.6), size: 20),
          ),
          const SizedBox(height: 6),
          Text(
            item['label'] as String,
            style: TextStyle(fontSize: 8, letterSpacing: 1.5, color: _dark.withOpacity(0.6)),
          ),
        ],
      ),
    );

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        children: [
          Container(height: 0.5, color: _gold.withOpacity(0.15)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: row1.sublist(0, 3).map(menuItem).toList(),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: row1.sublist(3).map(menuItem).toList(),
          ),
          const SizedBox(height: 16),
          Container(height: 0.5, color: _gold.withOpacity(0.15)),
        ],
      ),
    );
  }

  Widget _buildFeaturedGrid() {
    if (_featuredPerfumes.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(40),
        child: Text('등록된 향수가 없습니다', style: TextStyle(color: _grey, fontSize: 14), textAlign: TextAlign.center),
      );
    }
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        crossAxisSpacing: 14,
        mainAxisSpacing: 20,
      ),
      itemCount: _featuredPerfumes.length,
      itemBuilder: (_, i) => _buildPerfumeCard(_featuredPerfumes[i]),
    );
  }

  Widget _buildPerfumeCard(Perfume perfume) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/perfumes/${perfume.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: _gold.withOpacity(0.15)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                color: const Color(0xFFF5F0E8),
                child: perfume.imageUrl != null
                    ? Image.network(perfume.imageUrl!, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _placeholderImage())
                    : _placeholderImage(),
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (perfume.brandName != null)
                      Text(perfume.brandName!, style: const TextStyle(color: _grey, fontSize: 9, letterSpacing: 1), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(perfume.name,
                        style: const TextStyle(color: _dark, fontSize: 12, fontWeight: FontWeight.w500, height: 1.3),
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                    const Spacer(),
                    Row(children: [
                      if (perfume.isOnSale) ...[
                        Text('₩${_numFmt(perfume.price)}',
                            style: const TextStyle(color: _grey, fontSize: 9, decoration: TextDecoration.lineThrough)),
                        const SizedBox(width: 4),
                      ],
                      Text('₩${_numFmt(perfume.displayPrice)}',
                          style: TextStyle(color: perfume.isOnSale ? Colors.red : _gold, fontSize: 12, fontWeight: FontWeight.w600)),
                    ]),
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
      padding: const EdgeInsets.all(36),
      margin: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
      decoration: BoxDecoration(
        color: _dark,
        border: Border.all(color: _gold.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text('ABOUT AION', style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 5)),
          const SizedBox(height: 16),
          _buildOrnament(color: _gold),
          const SizedBox(height: 20),
          const Text('영원의 신들이 머물던 향기',
              style: TextStyle(color: Colors.white, fontSize: 18, letterSpacing: 2, fontWeight: FontWeight.w300)),
          const SizedBox(height: 14),
          const Text(
            'AION은 그리스 신화 속 신들의 영원한 향기를 현대에 재현합니다.\n각 향수는 신들의 이야기를 담고 있으며,\n당신만의 신화를 만들어갑니다.',
            style: TextStyle(color: Colors.white60, fontSize: 12, height: 1.8, letterSpacing: 0.5),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNewsletterSection() {
    final controller = TextEditingController();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      color: const Color(0xFFF0ECE4),
      child: Column(
        children: [
          Text('NEWSLETTER', style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold)),
          const SizedBox(height: 12),
          const Text('최신 향수 소식을 가장 먼저 받아보세요',
              style: TextStyle(fontSize: 13, color: _dark, letterSpacing: 0.5)),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(
              child: TextField(
                controller: controller,
                decoration: InputDecoration(
                  hintText: '이메일 주소',
                  hintStyle: TextStyle(fontSize: 12, color: _grey.withOpacity(0.6)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: _gold.withOpacity(0.3))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: _gold.withOpacity(0.3))),
                  focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: _gold)),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
            ),
            GestureDetector(
              onTap: () {
                controller.clear();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('구독 신청이 완료되었습니다', style: TextStyle(color: _gold)), backgroundColor: Color(0xFF1A1A1A)),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                color: _dark,
                child: const Text('구독', style: TextStyle(color: Colors.white, fontSize: 12, letterSpacing: 1)),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      color: const Color(0xFF1A1A1A),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('AION', style: TextStyle(color: _gold, fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.w200)),
          const SizedBox(height: 4),
          Text('신들의 향기', style: TextStyle(color: _gold.withOpacity(0.4), fontSize: 10, letterSpacing: 3)),
          const SizedBox(height: 20),
          Container(height: 0.5, color: _gold.withOpacity(0.15)),
          const SizedBox(height: 20),
          Wrap(
            spacing: 20,
            runSpacing: 10,
            children: [
              _footerLink('이용약관', '/terms'),
              _footerLink('개인정보처리방침', '/privacy'),
              _footerLink('FAQ', '/faq'),
              _footerLink('고객문의', '/customer-inquiry'),
              _footerLink('매장안내', '/store'),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            '© 2026 AION Perfume. All rights reserved.',
            style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.25), letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  Widget _footerLink(String label, String route) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, route),
      child: Text(label, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.45), letterSpacing: 0.5)),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Column(children: [
      Text(title, style: const TextStyle(color: _dark, fontSize: 11, letterSpacing: 4)),
      const SizedBox(height: 12),
      _buildOrnament(),
    ]);
  }

  Widget _buildOrnament({Color color = _gold}) {
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(width: 36, height: 1, color: color.withOpacity(0.5)),
      Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text('✦', style: TextStyle(color: color, fontSize: 10))),
      Container(width: 36, height: 1, color: color.withOpacity(0.5)),
    ]);
  }

  Widget _placeholderImage() {
    return Center(child: Text('✦', style: TextStyle(fontSize: 36, color: _gold.withOpacity(0.25))));
  }

  String _numFmt(num v) {
    return v.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}