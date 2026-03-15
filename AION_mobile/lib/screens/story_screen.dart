import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

// ──────────────────────────────────────────────────────
// 목 데이터 (API fallback)
// ──────────────────────────────────────────────────────
const _mockHistory = [
  {
    'storyId': 1,
    'yearLabel': '1847',
    'title': '신화의 시작',
    'subtitle': 'The Birth of Divinity',
    'content':
        '파리 마레 지구의 작은 공방에서 조향사 에드몬 뒤발은 그리스 신화에서 영감을 받아 AION을 창립했습니다. 신들이 숨쉬는 올림포스의 공기를 지상에 담겠다는 꿈을 가졌습니다.',
    'imageUrl': null,
  },
  {
    'storyId': 2,
    'yearLabel': '1923',
    'title': '황금 시대',
    'subtitle': "L'Âge d'Or",
    'content':
        '두 번의 세계대전을 거치며 AION의 향수는 유럽 귀족 사회의 필수품이 되었습니다. 아르테미스 컬렉션은 파리, 런던, 비엔나의 궁정을 사로잡았습니다.',
    'imageUrl': null,
  },
  {
    'storyId': 3,
    'yearLabel': '1989',
    'title': '동양과의 만남',
    'subtitle': 'East meets Olympus',
    'content':
        '일본 교토의 고급 백화점에 첫 아시아 매장을 오픈하며 AION은 동서양 향수 예술의 교류를 시작했습니다. 이 시기 탄생한 아프로디테 오드퍼퓸은 지금도 전설로 남아 있습니다.',
    'imageUrl': null,
  },
  {
    'storyId': 4,
    'yearLabel': '2024',
    'title': '영원한 현재',
    'subtitle': 'Into the Eternal Now',
    'content':
        '177년의 역사를 담아 AION은 새로운 신화를 씁니다. 전통 증류법과 현대 분자 조향 기술을 결합하여 과거와 미래를 잇는 향수를 창조합니다.',
    'imageUrl': null,
  },
];

const _mockProcess = [
  {
    'storyId': 5,
    'title': '원료 채집',
    'subtitle': 'Harvest of the Gods',
    'content':
        '그라스의 새벽, 이슬이 마르기 전에 장미 꽃잎을 손으로 채집합니다. 1킬로그램의 앱솔루트를 얻기 위해 3.5톤의 꽃잎이 필요합니다.',
    'imageUrl': null,
  },
  {
    'storyId': 6,
    'title': '증류와 추출',
    'subtitle': 'Alchemy of Essence',
    'content':
        '전통 구리 증류기와 냉압착법으로 꽃과 과실의 정수를 추출합니다. 이 연금술적 과정은 신들의 넥타르를 현실로 옮겨오는 의식입니다.',
    'imageUrl': null,
  },
  {
    'storyId': 7,
    'title': '조화의 작곡',
    'subtitle': 'Composing Harmony',
    'content':
        '수석 조향사는 300여 가지 원료를 오케스트라처럼 조율합니다. 탑 노트, 미들 노트, 베이스 노트가 완벽한 삼위일체를 이루기까지 수백 번의 시도가 반복됩니다.',
    'imageUrl': null,
  },
  {
    'storyId': 8,
    'title': '숙성과 완성',
    'subtitle': 'The Art of Patience',
    'content':
        '혼합된 향수는 오크통에서 최소 6개월 숙성됩니다. 시간이 녹아든 향은 처음과 전혀 다른 깊이와 복잡성을 가지게 됩니다.',
    'imageUrl': null,
  },
  {
    'storyId': 9,
    'title': '병에 담긴 신화',
    'subtitle': 'Myth in a Bottle',
    'content':
        '베네치아 유리 장인이 하나씩 손으로 제작한 플라콩에 향수를 담습니다. 병 하나를 완성하는 데 3시간, 그것은 하나의 조각품입니다.',
    'imageUrl': null,
  },
  {
    'storyId': 10,
    'title': '의식의 완성',
    'subtitle': 'The Sacred Ritual',
    'content':
        '포장부터 리본까지 모든 과정이 수작업으로 이루어집니다. AION의 향수를 받는 것은 올림포스로부터 선물을 받는 것과 같은 경험입니다.',
    'imageUrl': null,
  },
];

const _mockPhilosophy = [
  {
    'storyId': 11,
    'title': '시간을 초월한 아름다움',
    'subtitle': 'KAIROS — 카이로스',
    'content':
        "그리스어로 '완벽한 순간'을 의미하는 카이로스. AION은 향수가 단순한 향기가 아닌, 시간을 정지시키는 마법이라 믿습니다.\n\n뿌리는 순간, 당신은 신화 속으로 걸어 들어갑니다. 이오의 변신처럼, 아프로디테의 탄생처럼 — 향은 당신을 전혀 다른 존재로 만듭니다.",
    'imageUrl': null,
  },
  {
    'storyId': 12,
    'title': '장인 정신의 신성함',
    'subtitle': 'HEPHAESTUS — 헤파이스토스',
    'content':
        '불과 대장장이의 신 헤파이스토스는 완벽함을 추구했습니다. AION의 모든 조향사는 그 정신을 계승합니다.\n\n10년의 수련, 100번의 실패, 그리고 단 하나의 걸작. 우리는 빠른 것보다 옳은 것을 선택합니다.',
    'imageUrl': null,
  },
  {
    'storyId': 13,
    'title': '자연과의 신성한 계약',
    'subtitle': 'GAIA — 가이아',
    'content':
        '대지의 여신 가이아는 모든 생명의 근원입니다. AION은 자연에서 영감을 얻고, 자연에 다시 돌려줍니다.\n\n그라스의 장미 농장, 에티오피아의 프랑켄센스 나무, 인도의 재스민 밭 — 우리는 지속 가능한 관계를 맺습니다.',
    'imageUrl': null,
  },
];

// ──────────────────────────────────────────────────────
// Colors
// ──────────────────────────────────────────────────────
const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF0E0C09);
const _darkBrown = Color(0xFF1A1510);
const _brown = Color(0xFF6F6756);
const _bg = Color(0xFFFAF8F3);
const _bgAlt = Color(0xFFF5F0E8);

// ──────────────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────────────
class StoryScreen extends StatefulWidget {
  const StoryScreen({super.key});

  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, List<Map<String, dynamic>>> _storyData = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchStories();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchStories() async {
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/stories/public'),
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        final data = json['data'] as Map<String, dynamic>? ?? {};
        setState(() {
          _storyData = {
            'HISTORY': _parseList(data['HISTORY']) ?? List<Map<String, dynamic>>.from(_mockHistory),
            'PROCESS': _parseList(data['PROCESS']) ?? List<Map<String, dynamic>>.from(_mockProcess),
            'PHILOSOPHY': _parseList(data['PHILOSOPHY']) ?? List<Map<String, dynamic>>.from(_mockPhilosophy),
          };
        });
        return;
      }
    } catch (_) {}
    setState(() {
      _storyData = {
        'HISTORY': List<Map<String, dynamic>>.from(_mockHistory),
        'PROCESS': List<Map<String, dynamic>>.from(_mockProcess),
        'PHILOSOPHY': List<Map<String, dynamic>>.from(_mockPhilosophy),
      };
    });
  }

  List<Map<String, dynamic>>? _parseList(dynamic raw) {
    if (raw == null) return null;
    if (raw is List && raw.isNotEmpty) {
      return raw.cast<Map<String, dynamic>>();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _storyData.isEmpty) {
      return Scaffold(
        backgroundColor: _dark,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'ΑΙΩΝ',
                style: TextStyle(
                  fontFamily: 'serif',
                  fontSize: 48,
                  color: _gold.withOpacity(0.3),
                  letterSpacing: 12,
                ),
              ),
              const SizedBox(height: 24),
              CircularProgressIndicator(color: _gold.withOpacity(0.6), strokeWidth: 1),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: _bg,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          // Hero 헤더
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: _dark,
            flexibleSpace: FlexibleSpaceBar(
              background: _buildHero(),
            ),
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: _gold,
              indicatorWeight: 1,
              labelColor: _gold,
              unselectedLabelColor: _gold.withOpacity(0.4),
              labelStyle: const TextStyle(
                fontSize: 10,
                letterSpacing: 3,
                fontWeight: FontWeight.w500,
              ),
              tabs: const [
                Tab(text: 'HISTORY'),
                Tab(text: 'PROCESS'),
                Tab(text: 'PHILOSOPHY'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildHistoryTab(),
            _buildProcessTab(),
            _buildPhilosophyTab(),
          ],
        ),
      ),
    );
  }

  // ─── Hero ───────────────────────────────────────────────────
  Widget _buildHero() {
    return Container(
      color: _dark,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 배경 패턴
          CustomPaint(painter: _GridPatternPainter()),
          // 빛 그라디언트
          Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 0.8,
                colors: [
                  _gold.withOpacity(0.06),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          // 큰 그리스 문자
          Center(
            child: Text(
              'ΑΙΩΝ',
              style: TextStyle(
                fontSize: 80,
                color: _gold.withOpacity(0.04),
                letterSpacing: 20,
                fontWeight: FontWeight.w300,
              ),
            ),
          ),
          // 메인 텍스트
          Padding(
            padding: const EdgeInsets.only(bottom: 56),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildGoldLine(),
                const SizedBox(height: 16),
                Text(
                  'AION의 이야기',
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 6,
                    color: _gold.withOpacity(0.7),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'STORY',
                  style: TextStyle(
                    fontSize: 52,
                    letterSpacing: 12,
                    color: Colors.white,
                    fontWeight: FontWeight.w200,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Α  Ι  Ω  Ν',
                  style: TextStyle(
                    fontSize: 14,
                    letterSpacing: 8,
                    color: _gold.withOpacity(0.4),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '신화에서 탄생한 영원한 향기',
                  style: TextStyle(
                    fontSize: 12,
                    letterSpacing: 2,
                    color: _gold.withOpacity(0.5),
                    fontStyle: FontStyle.italic,
                  ),
                ),
                _buildGoldLine(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoldLine() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 40),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, _gold.withOpacity(0.4)],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text('◆', style: TextStyle(color: _gold.withOpacity(0.5), fontSize: 8)),
          ),
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [_gold.withOpacity(0.4), Colors.transparent],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── History Tab ─────────────────────────────────────────────
  Widget _buildHistoryTab() {
    final items = _storyData['HISTORY'] ?? [];
    return RefreshIndicator(
      onRefresh: _fetchStories,
      color: _gold,
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, i) {
                  if (i == 0) return _buildSectionHeader('브랜드 연혁', '1847년부터 이어온 신들의 향기', 'Ι');
                  final item = items[i - 1];
                  return _buildHistoryItem(item, i - 1);
                },
                childCount: items.length + 1,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(Map<String, dynamic> item, int idx) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: Column(
        children: [
          // 년도 배지
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              color: _dark,
              border: Border.all(color: _gold, width: 1),
            ),
            child: Text(
              item['yearLabel'] ?? '',
              style: const TextStyle(
                color: _gold,
                fontSize: 16,
                letterSpacing: 4,
                fontWeight: FontWeight.w300,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 이미지 플레이스홀더
          if (item['imageUrl'] != null)
            ClipRRect(
              child: Image.network(
                item['imageUrl']!,
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            )
          else
            _buildHistoryPlaceholder(idx),
          const SizedBox(height: 16),
          // 텍스트
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(left: BorderSide(color: _gold, width: 2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item['subtitle'] != null)
                  Text(
                    item['subtitle']!,
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 3,
                      color: _gold.withOpacity(0.7),
                    ),
                  ),
                const SizedBox(height: 6),
                Text(
                  item['title'] ?? '',
                  style: const TextStyle(
                    fontSize: 22,
                    letterSpacing: 2,
                    color: _darkBrown,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 10),
                Container(width: 32, height: 1, color: _gold),
                const SizedBox(height: 10),
                Text(
                  item['content'] ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.8,
                    color: _brown,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryPlaceholder(int idx) {
    final symbols = ['Α', 'Ω', 'Φ', 'Σ'];
    final symbol = symbols[idx % symbols.length];
    return Container(
      height: 180,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFF1A1510), const Color(0xFF2A2015)],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CustomPaint(painter: _GridPatternPainter()),
          Center(
            child: Text(
              symbol,
              style: TextStyle(
                fontSize: 120,
                color: _gold.withOpacity(0.08),
                fontWeight: FontWeight.w300,
              ),
            ),
          ),
          Center(
            child: Text(
              symbol,
              style: TextStyle(
                fontSize: 60,
                color: _gold.withOpacity(0.25),
                fontWeight: FontWeight.w200,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Process Tab ─────────────────────────────────────────────
  Widget _buildProcessTab() {
    final items = _storyData['PROCESS'] ?? [];
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(24),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, i) {
                if (i == 0) return _buildSectionHeader('향수 제조 과정', '장인의 손끝에서 탄생하는 연금술', 'ΙΙ');
                final item = items[i - 1];
                return _buildProcessCard(item, i - 1);
              },
              childCount: items.length + 1,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProcessCard(Map<String, dynamic> item, int idx) {
    final greekLetters = ['Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Ψ'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: _gold.withOpacity(0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 이미지 영역
            if (item['imageUrl'] != null)
              Image.network(
                item['imageUrl']!,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
              )
            else
              _buildProcessPlaceholder(idx, greekLetters[idx % greekLetters.length]),
            // 내용
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: _gold.withOpacity(0.5)),
                        ),
                        child: Center(
                          child: Text(
                            '${idx + 1}',
                            style: TextStyle(
                              color: _gold,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (item['subtitle'] != null)
                              Text(
                                item['subtitle']!,
                                style: TextStyle(
                                  fontSize: 9,
                                  letterSpacing: 2,
                                  color: _gold.withOpacity(0.7),
                                ),
                              ),
                            Text(
                              item['title'] ?? '',
                              style: const TextStyle(
                                fontSize: 15,
                                letterSpacing: 1,
                                color: _darkBrown,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    height: 1,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [_gold.withOpacity(0.4), Colors.transparent],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    item['content'] ?? '',
                    style: const TextStyle(
                      fontSize: 12,
                      height: 1.8,
                      color: _brown,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProcessPlaceholder(int idx, String letter) {
    final colors = [
      [const Color(0xFF1A1510), const Color(0xFF2D2010)],
      [const Color(0xFF0F1A15), const Color(0xFF102A1A)],
      [const Color(0xFF150F1A), const Color(0xFF20102D)],
      [const Color(0xFF1A1010), const Color(0xFF2D1515)],
      [const Color(0xFF101518), const Color(0xFF152028)],
      [const Color(0xFF181510), const Color(0xFF2D2510)],
    ];
    final pair = colors[idx % colors.length];
    return Container(
      height: 140,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: pair,
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CustomPaint(painter: _GridPatternPainter()),
          Center(
            child: Text(
              letter,
              style: TextStyle(
                fontSize: 64,
                color: _gold.withOpacity(0.15),
                fontWeight: FontWeight.w200,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Philosophy Tab ───────────────────────────────────────────
  Widget _buildPhilosophyTab() {
    final items = _storyData['PHILOSOPHY'] ?? [];
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(24),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, i) {
                if (i == 0) return _buildSectionHeader('브랜드 철학', 'AION이 추구하는 영원한 가치', 'ΙΙΙ');
                final item = items[i - 1];
                return _buildPhilosophyCard(item, i - 1);
              },
              childCount: items.length + 1,
            ),
          ),
        ),
        // 클로징
        SliverToBoxAdapter(child: _buildClosing()),
      ],
    );
  }

  Widget _buildPhilosophyCard(Map<String, dynamic> item, int idx) {
    final godSymbols = ['Α', 'Θ', 'Δ'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: Column(
        children: [
          // 비주얼 패널
          _buildPhilosophyVisual(idx, godSymbols[idx % godSymbols.length]),
          // 텍스트 패널
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item['subtitle'] != null)
                  Text(
                    item['subtitle']!,
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 3,
                      color: _gold.withOpacity(0.7),
                    ),
                  ),
                const SizedBox(height: 8),
                Text(
                  item['title'] ?? '',
                  style: const TextStyle(
                    fontSize: 22,
                    letterSpacing: 1,
                    color: _darkBrown,
                    fontWeight: FontWeight.w300,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Expanded(child: Divider(color: Color(0xFFC9A961), height: 1, thickness: 1, endIndent: 8)),
                  ],
                ),
                const SizedBox(height: 16),
                ...((item['content'] ?? '').split('\n\n')).map(
                  (para) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      para,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.9,
                        color: _brown,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      ['I', 'II', 'III'][idx],
                      style: TextStyle(
                        fontSize: 40,
                        color: _gold.withOpacity(0.15),
                        fontWeight: FontWeight.w300,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Container(
                        height: 1,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [_gold.withOpacity(0.3), Colors.transparent],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhilosophyVisual(int idx, String symbol) {
    final palettes = [
      [const Color(0xFF0E0B06), const Color(0xFF2D2010)],
      [const Color(0xFF060B0E), const Color(0xFF102030)],
      [const Color(0xFF0B060E), const Color(0xFF25102D)],
    ];
    final pair = palettes[idx % palettes.length];
    return Container(
      height: 200,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: pair,
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CustomPaint(painter: _GridPatternPainter()),
          Center(
            child: Text(
              symbol,
              style: TextStyle(
                fontSize: 140,
                color: _gold.withOpacity(0.07),
                fontWeight: FontWeight.w200,
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  symbol,
                  style: TextStyle(
                    fontSize: 56,
                    color: _gold.withOpacity(0.35),
                    fontWeight: FontWeight.w200,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  ['아프로디테', '아테나', '디오니소스'][idx % 3],
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 4,
                    color: _gold.withOpacity(0.4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String ko, String desc, String roman) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 32),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Container(height: 1, color: _gold.withOpacity(0.2)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  roman,
                  style: TextStyle(
                    fontSize: 20,
                    color: _gold.withOpacity(0.3),
                    fontWeight: FontWeight.w200,
                  ),
                ),
              ),
              Expanded(
                child: Container(height: 1, color: _gold.withOpacity(0.2)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            ko,
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 5,
              color: _gold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            desc,
            style: const TextStyle(
              fontSize: 12,
              letterSpacing: 1,
              color: _brown,
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildClosing() {
    return Container(
      color: _dark,
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 32),
      child: Column(
        children: [
          Text('Ω', style: TextStyle(fontSize: 80, color: _gold.withOpacity(0.15))),
          const SizedBox(height: 16),
          Text(
            'AION — 신들의 시간',
            style: TextStyle(fontSize: 10, letterSpacing: 4, color: _gold.withOpacity(0.5)),
          ),
          const SizedBox(height: 16),
          const Text(
            '당신의 이야기를\n향으로 새기다',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 24,
              letterSpacing: 2,
              color: Colors.white70,
              fontWeight: FontWeight.w200,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Αἰὼν παῖς ἐστι παίζων — 영원은 놀이하는 아이',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              color: _gold.withOpacity(0.35),
              fontStyle: FontStyle.italic,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────
// 격자 배경 패턴
// ──────────────────────────────────────────────────────
class _GridPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFC9A961).withOpacity(0.08)
      ..strokeWidth = 0.5;
    const step = 24.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}
