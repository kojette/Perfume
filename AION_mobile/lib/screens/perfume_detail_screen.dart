import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart'; // pubspec에 없으면 Clipboard fallback 사용
import 'package:aion_perfume_app/config/api_config.dart';
// ─────────────────────────────────────────────────────────────────────────────
// 상수 & 헬퍼
// ─────────────────────────────────────────────────────────────────────────────


const Color kGold      = Color(0xFFC9A961);
const Color kDarkBrown = Color(0xFF2A1508);
const Color kMidBrown  = Color(0xFF8B6030);
const Color kBg        = Color(0xFFF5EDE0);
const Color kNavBg     = Color(0xFF1A0C04);

String fmtKRW(dynamic n) {
  if (n == null) return '-';
  final num val = n is num ? n : num.tryParse(n.toString()) ?? 0;
  return '₩${val.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';
}

// EWG 등급 → 색상
Color ewgColor(dynamic grade) {
  if (grade == null) return Colors.grey;
  final int g = (grade is num ? grade : double.tryParse(grade.toString()) ?? 0).round().clamp(1, 10);
  const colors = {
    1: Color(0xFF4CAF50), 2: Color(0xFF8BC34A), 3: Color(0xFFCDDC39),
    4: Color(0xFFFFEB3B), 5: Color(0xFFFFC107), 6: Color(0xFFFF9800),
    7: Color(0xFFF44336), 8: Color(0xFFE53935), 9: Color(0xFFC62828),
    10: Color(0xFFB71C1C),
  };
  return colors[g] ?? Colors.grey;
}

String? ewgLabel(dynamic grade) {
  if (grade == null) return null;
  final int g = (grade is num ? grade : double.tryParse(grade.toString()) ?? 0).round();
  if (g <= 2) return '안전';
  if (g <= 6) return '보통';
  return '주의';
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 스크린
// ─────────────────────────────────────────────────────────────────────────────

class PerfumeDetailScreen extends StatefulWidget {
  final int perfumeId;
  const PerfumeDetailScreen({super.key, required this.perfumeId});

  @override
  State<PerfumeDetailScreen> createState() => _PerfumeDetailScreenState();
}

class _PerfumeDetailScreenState extends State<PerfumeDetailScreen> {
  // ── 데이터 상태 ──────────────────────────────────────────────────────────────
  Map<String, dynamic>?        _perfume;
  List<Map<String, dynamic>>   _images       = [];
  Map<String, List<String>>    _notes        = {'top': [], 'middle': [], 'base': []};
  List<Map<String, dynamic>>   _ingredients  = [];

  bool _loading             = true;
  bool _notesLoading        = true;
  bool _ingredientsLoading  = true;

  // ── UI 상태 ──────────────────────────────────────────────────────────────────
  int  _qty          = 1;
  bool _isWished     = false;
  bool _wishLoading  = false;
  bool _cartLoading  = false;
  bool _restockLoading = false;
  bool _restockDone    = false;

  String? _toast;

  // ── 세션 ────────────────────────────────────────────────────────────────────
  bool    _isLoggedIn  = false;
  String? _accessToken;

  @override
  void initState() {
    super.initState();
    _initSession();
  }

  Future<void> _initSession() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _isLoggedIn  = prefs.getBool('isLoggedIn') ?? false;
      _accessToken = prefs.getString('accessToken');
    });
    await _fetchPerfume();
    await _fetchIngredients();
    await _fetchNotes();
  }

  // ── Supabase: 향수 기본 정보 ─────────────────────────────────────────────────
  Future<void> _fetchPerfume() async {
    setState(() => _loading = true);
    try {
      final id = widget.perfumeId;
      final pData = await Supabase.instance.client
          .from('Perfumes')
          .select('perfume_id,name,name_en,description,price,sale_price,sale_rate,brand_id,gender,volume_ml,avg_rating,review_count,total_stock')
          .eq('perfume_id', id)
          .eq('is_active', true)
          .single();

      String brandName = '';
      if (pData['brand_id'] != null) {
        final bData = await Supabase.instance.client
            .from('Brands')
            .select('brand_name')
            .eq('brand_id', pData['brand_id'])
            .single();
        brandName = bData['brand_name'] ?? '';
      }

      final imgData = await Supabase.instance.client
          .from('Perfume_Images')
          .select('image_id,image_url,is_thumbnail,display_order')
          .eq('perfume_id', id)
          .order('display_order', ascending: true);

      final imgs = List<Map<String, dynamic>>.from(imgData);
      imgs.sort((a, b) {
        final aTh = a['is_thumbnail'] == true;
        final bTh = b['is_thumbnail'] == true;
        if (aTh && !bTh) return -1;
        if (!aTh && bTh) return 1;
        return ((a['display_order'] ?? 99) as int)
            .compareTo((b['display_order'] ?? 99) as int);
      });

      if (mounted) {
        setState(() {
          _perfume = {...pData, 'brand_name': brandName};
          _images  = imgs;
        });
      }
    } catch (e) {
      debugPrint('향수 상세 로드 실패: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ── Supabase: 전성분 ─────────────────────────────────────────────────────────
  Future<void> _fetchIngredients() async {
    setState(() => _ingredientsLoading = true);
    try {
      final data = await Supabase.instance.client
          .from('Perfume_Ingredients')
          .select('''
            ratio_percent,
            risk_level,
            Ingredients (
              ingredient_id, name, name_en,
              cas_number, ewg_grade,
              feature, description,
              is_allergen, is_natural, origin
            )
          ''')
          .eq('perfume_id', widget.perfumeId);

      final flat = List<Map<String, dynamic>>.from(data).map((row) {
        final ing = Map<String, dynamic>.from(row['Ingredients'] ?? {});
        return {
          'ratio_percent': row['ratio_percent'],
          'risk_level':    row['risk_level'],
          ...ing,
        };
      }).toList();

      // 화장품법: 함량 내림차순
      flat.sort((a, b) =>
          ((b['ratio_percent'] ?? 0.0) as num)
              .compareTo((a['ratio_percent'] ?? 0.0) as num));

      if (mounted) setState(() => _ingredients = flat);
    } catch (e) {
      debugPrint('전성분 로드 실패: $e');
    } finally {
      if (mounted) setState(() => _ingredientsLoading = false);
    }
  }

  // ── REST API: 노트 ────────────────────────────────────────────────────────────
  Future<void> _fetchNotes() async {
    setState(() => _notesLoading = true);
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/collections/perfumes/${widget.perfumeId}/notes'),
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        final data = json['data'] ?? {};
        if (mounted) {
          setState(() {
            _notes = {
              'top':    List<String>.from(data['top']    ?? []),
              'middle': List<String>.from(data['middle'] ?? []),
              'base':   List<String>.from(data['base']   ?? []),
            };
          });
        }
      }
    } catch (e) {
      debugPrint('노트 로드 실패: $e');
    } finally {
      if (mounted) setState(() => _notesLoading = false);
    }
  }

  // ── 액션: 위시리스트 ─────────────────────────────────────────────────────────
  Future<void> _handleWish() async {
    if (!_isLoggedIn) { _goLogin(); return; }
    setState(() => _wishLoading = true);
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/wishlist/toggle'),
        headers: _authHeaders,
        body: jsonEncode({'perfumeId': widget.perfumeId}),
      );
      if (res.statusCode == 200) {
        final newWished = !_isWished;
        setState(() => _isWished = newWished);
        _showToast(newWished ? '위시리스트에 담겼습니다' : '위시리스트에서 제거되었습니다');
      }
    } finally {
      if (mounted) setState(() => _wishLoading = false);
    }
  }

  // ── 액션: 장바구니 ───────────────────────────────────────────────────────────
  Future<void> _handleCart() async {
    if (!_isLoggedIn) { _goLogin(); return; }
    setState(() => _cartLoading = true);
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/add'),
        headers: _authHeaders,
        body: jsonEncode({'perfumeId': widget.perfumeId, 'quantity': _qty}),
      );
      if (res.statusCode == 200) _showToast('장바구니에 $_qty개 담겼습니다');
    } finally {
      if (mounted) setState(() => _cartLoading = false);
    }
  }

  // ── 액션: 바로구매 ───────────────────────────────────────────────────────────
  Future<void> _handleBuy() async {
    if (!_isLoggedIn) { _goLogin(); return; }
    await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/cart/add'),
      headers: _authHeaders,
      body: jsonEncode({'perfumeId': widget.perfumeId, 'quantity': _qty}),
    );
    if (mounted) Navigator.pushNamed(context, '/cart');
  }

  // ── 액션: 공유 ───────────────────────────────────────────────────────────────
  Future<void> _handleShare() async {
    final name = _perfume?['name'] ?? '';
    final url  = 'https://aion.app/perfumes/${widget.perfumeId}';
    try {
      await Share.share('$name\n$url');
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: url));
      _showToast('링크가 복사되었습니다');
    }
  }

  // ── 액션: 재입고 알림 ────────────────────────────────────────────────────────
  Future<void> _handleRestock() async {
    if (!_isLoggedIn) { _goLogin(); return; }
    setState(() => _restockLoading = true);
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/restock/notify'),
        headers: _authHeaders,
        body: jsonEncode({'perfumeId': widget.perfumeId}),
      );
      if (res.statusCode == 200) {
        setState(() => _restockDone = true);
        _showToast('재입고 알림이 신청되었습니다');
      } else {
        final err = jsonDecode(res.body);
        _showToast(err['message'] ?? '이미 신청하셨거나 오류가 발생했습니다');
      }
    } catch (_) {
      _showToast('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      if (mounted) setState(() => _restockLoading = false);
    }
  }

  // ── 헬퍼 ────────────────────────────────────────────────────────────────────
  Map<String, String> get _authHeaders => {
    'Authorization': 'Bearer $_accessToken',
    'Content-Type':  'application/json',
  };

  void _goLogin() => Navigator.pushNamed(context, '/login');

  void _showToast(String msg) {
    setState(() => _toast = msg);
    Future.delayed(const Duration(milliseconds: 2400), () {
      if (mounted) setState(() => _toast = null);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loading) return _buildLoadingScreen();
    if (_perfume == null) return const SizedBox.shrink();

    final p         = _perfume!;
    final saleRate  = (p['sale_rate'] ?? 0) as num;
    final price     = p['price'];
    final salePrice = p['sale_price'];
    final displayPrice = saleRate > 0 ? salePrice : price;
    final inStock   = ((p['total_stock'] ?? 1) as num) > 0;
    final hasNotes  = (_notes['top']?.isNotEmpty == true) ||
                      (_notes['middle']?.isNotEmpty == true) ||
                      (_notes['base']?.isNotEmpty == true);

    return Scaffold(
      backgroundColor: kBg,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              _buildAppBar(p),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 80),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 갤러리
                      _GalleryWidget(images: _images, name: p['name'] ?? ''),
                      const SizedBox(height: 28),

                      // 브랜드명
                      if ((p['brand_name'] ?? '').isNotEmpty)
                        Text(
                          (p['brand_name'] as String).toUpperCase(),
                          style: const TextStyle(
                            fontSize: 10, letterSpacing: 4,
                            color: kGold, fontWeight: FontWeight.w600,
                          ),
                        ),
                      const SizedBox(height: 6),

                      // 향수명
                      Text(
                        p['name'] ?? '',
                        style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.w400,
                          letterSpacing: 1.5, color: kDarkBrown,
                          fontFamily: 'Georgia', height: 1.25,
                        ),
                      ),
                      if ((p['name_en'] ?? '').isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          p['name_en'] ?? '',
                          style: const TextStyle(
                            fontSize: 13, color: kMidBrown,
                            fontStyle: FontStyle.italic, letterSpacing: 1.0,
                          ),
                        ),
                      ],

                      // 별점
                      if ((p['avg_rating'] ?? 0) > 0) ...[
                        const SizedBox(height: 12),
                        _StarRating(
                          rating: (p['avg_rating'] as num).toDouble(),
                          count:  (p['review_count'] ?? 0) as int,
                        ),
                      ],

                      const _GoldDivider(vertical: 16),

                      // 가격
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            fmtKRW(displayPrice),
                            style: const TextStyle(
                              fontSize: 26, fontWeight: FontWeight.w600,
                              color: kGold, letterSpacing: 0.5,
                            ),
                          ),
                          if (saleRate > 0) ...[
                            const SizedBox(width: 10),
                            Text(
                              fmtKRW(price),
                              style: const TextStyle(
                                fontSize: 16, color: Color(0xFFA39D8F),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              color: const Color(0xFFC94A4A),
                              child: Text(
                                '$saleRate% OFF',
                                style: const TextStyle(
                                  fontSize: 11, color: Colors.white,
                                  letterSpacing: 1.0, fontFamily: 'sans-serif',
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 18),

                      // 메타 태그 (성별 / 용량 / 품절)
                      Wrap(
                        spacing: 8, runSpacing: 6,
                        children: [
                          if (p['gender'] != null)
                            _MetaTag(label: _genderLabel(p['gender'])),
                          if (p['volume_ml'] != null)
                            _MetaTag(label: '${p['volume_ml']}ml'),
                          if (!inStock)
                            const _MetaTag(label: '품절', isAlert: true),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // 수량 + 위시리스트
                      Row(
                        children: [
                          _QtySelector(
                            qty: _qty,
                            onDecrement: () => setState(() => _qty = (_qty - 1).clamp(1, 99)),
                            onIncrement: () => setState(() => _qty = (_qty + 1).clamp(1, 99)),
                          ),
                          const SizedBox(width: 10),
                          _WishButton(
                            isWished:    _isWished,
                            isLoading:   _wishLoading,
                            onPressed:   _handleWish,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // 장바구니 / BUY NOW
                      Row(
                        children: [
                          Expanded(
                            child: _OutlineButton(
                              label: _cartLoading ? '담는 중…' : '장바구니',
                              icon: Icons.shopping_cart_outlined,
                              onPressed: (inStock && !_cartLoading) ? _handleCart : null,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _FilledButton(
                              label: inStock ? 'BUY NOW' : '품절',
                              onPressed: inStock ? _handleBuy : null,
                            ),
                          ),
                        ],
                      ),

                      // 재입고 알림 (품절 시만)
                      if (!inStock) ...[
                        const SizedBox(height: 10),
                        _RestockButton(
                          isLoading: _restockLoading,
                          isDone:    _restockDone,
                          onPressed: (!_restockLoading && !_restockDone) ? _handleRestock : null,
                        ),
                        const SizedBox(height: 6),
                        const Center(
                          child: Text(
                            '재입고 시 이메일로 알려드립니다',
                            style: TextStyle(
                              fontSize: 9, color: Color(0x73C9A961), letterSpacing: 1.0,
                            ),
                          ),
                        ),
                      ],

                      const _GoldDivider(vertical: 24),

                      // FRAGRANCE NOTES
                      _SectionLabel(label: 'FRAGRANCE NOTES'),
                      if (_notesLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 16, height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2, color: kGold,
                                ),
                              ),
                              SizedBox(width: 10),
                              Text('노트 로딩 중…',
                                style: TextStyle(fontSize: 12, color: kMidBrown, fontStyle: FontStyle.italic)),
                            ],
                          ),
                        )
                      else if (hasNotes) ...[
                        _NoteBadgeRow(label: 'TOP',    items: _notes['top']    ?? []),
                        _NoteBadgeRow(label: 'MIDDLE', items: _notes['middle'] ?? []),
                        _NoteBadgeRow(label: 'BASE',   items: _notes['base']   ?? []),
                      ] else
                        const Text('노트 정보가 없습니다',
                          style: TextStyle(
                            fontSize: 12, color: Color(0x73C9A961),
                            fontStyle: FontStyle.italic,
                          ),
                        ),

                      const _GoldDivider(vertical: 24),

                      // DESCRIPTION
                      if ((p['description'] ?? '').isNotEmpty) ...[
                        _SectionLabel(label: 'DESCRIPTION'),
                        const SizedBox(height: 10),
                        Text(
                          p['description'] ?? '',
                          style: const TextStyle(
                            fontSize: 13, color: Color(0xFF4A2C10),
                            height: 1.9, letterSpacing: 0.3,
                            fontStyle: FontStyle.italic, fontFamily: 'Georgia',
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // INGREDIENTS 아코디언
                      _SectionLabel(label: 'INGREDIENTS'),
                      const SizedBox(height: 10),
                      _IngredientsAccordion(
                        items:   _ingredients,
                        loading: _ingredientsLoading,
                      ),

                      const SizedBox(height: 40),
                      const _GoldDivider(vertical: 0),
                      const SizedBox(height: 16),
                      Center(
                        child: TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text(
                            '← FRAGRANCE LIBRARY 로 돌아가기',
                            style: TextStyle(
                              fontSize: 10, letterSpacing: 3,
                              color: kMidBrown,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // 토스트
          if (_toast != null)
            Positioned(
              bottom: 36,
              left: 0, right: 0,
              child: _ToastWidget(message: _toast!),
            ),
        ],
      ),
    );
  }

  Widget _buildLoadingScreen() {
    return const Scaffold(
      backgroundColor: kBg,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: kGold, strokeWidth: 2),
            SizedBox(height: 16),
            Text(
              '향수 정보를 불러오는 중…',
              style: TextStyle(
                fontSize: 13, color: kMidBrown,
                fontStyle: FontStyle.italic, letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar(Map<String, dynamic> p) {
    return SliverAppBar(
      backgroundColor: kNavBg,
      pinned: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: kGold, size: 18),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        'COLLECTIONS  /  ${(p['name'] ?? '').toUpperCase()}',
        style: const TextStyle(
          fontSize: 9, letterSpacing: 2.5,
          color: Color(0x73C9A961),
        ),
        maxLines: 1, overflow: TextOverflow.ellipsis,
      ),
      actions: [
        TextButton.icon(
          onPressed: _handleShare,
          icon: const Icon(Icons.share, size: 14, color: Color(0x99C9A961)),
          label: const Text(
            'SHARE',
            style: TextStyle(
              fontSize: 10, letterSpacing: 2, color: Color(0x99C9A961),
            ),
          ),
        ),
      ],
    );
  }

  String _genderLabel(String? g) {
    switch (g) {
      case 'MALE':   return '남성';
      case 'FEMALE': return '여성';
      default:       return '유니섹스';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 갤러리 위젯
// ─────────────────────────────────────────────────────────────────────────────

class _GalleryWidget extends StatefulWidget {
  final List<Map<String, dynamic>> images;
  final String name;
  const _GalleryWidget({required this.images, required this.name});

  @override
  State<_GalleryWidget> createState() => _GalleryWidgetState();
}

class _GalleryWidgetState extends State<_GalleryWidget> {
  int _activeIdx = 0;

  @override
  Widget build(BuildContext context) {
    final active = widget.images.isNotEmpty ? widget.images[_activeIdx] : null;

    return Column(
      children: [
        // 메인 이미지
        GestureDetector(
          onTap: active != null ? () => _showZoom(context, active) : null,
          child: AspectRatio(
            aspectRatio: 1,
            child: Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                  colors: [Color(0xFFF5F0E8), Color(0xFFE8DDC8)],
                ),
                border: Border.all(color: kGold.withOpacity(0.15)),
              ),
              child: active != null
                  ? CachedNetworkImage(
                      imageUrl: active['image_url'] ?? '',
                      fit: BoxFit.contain,
                      placeholder: (_, __) =>
                          const Center(child: CircularProgressIndicator(color: kGold, strokeWidth: 1.5)),
                      errorWidget: (_, __, ___) =>
                          const Center(child: Icon(Icons.broken_image_outlined, color: kGold, size: 48)),
                    )
                  : const Center(
                      child: Text('✦', style: TextStyle(fontSize: 48, color: Color(0x26C9A961))),
                    ),
            ),
          ),
        ),

        // 썸네일 행
        if (widget.images.length > 1) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: widget.images.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final img = widget.images[i];
                return GestureDetector(
                  onTap: () => setState(() => _activeIdx = i),
                  child: Container(
                    width: 64, height: 64,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: i == _activeIdx ? kGold : Colors.transparent,
                        width: 2,
                      ),
                      color: const Color(0xFFF5F0E8),
                    ),
                    child: CachedNetworkImage(
                      imageUrl: img['image_url'] ?? '',
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) =>
                          const Icon(Icons.broken_image_outlined, color: kGold),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  void _showZoom(BuildContext context, Map<String, dynamic> img) {
    showDialog(
      context: context,
      barrierColor: Colors.black87,
      builder: (_) => GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Stack(
          children: [
            Center(
              child: CachedNetworkImage(
                imageUrl: img['image_url'] ?? '',
                fit: BoxFit.contain,
              ),
            ),
            Positioned(
              top: 40, right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white54),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 전성분 아코디언
// ─────────────────────────────────────────────────────────────────────────────

class _IngredientsAccordion extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  final bool loading;
  const _IngredientsAccordion({required this.items, required this.loading});

  @override
  State<_IngredientsAccordion> createState() => _IngredientsAccordionState();
}

class _IngredientsAccordionState extends State<_IngredientsAccordion>
    with SingleTickerProviderStateMixin {
  bool _open = false;
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 380));
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _open = !_open);
    _open ? _ctrl.forward() : _ctrl.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final hasAllergen = widget.items.any((i) => i['is_allergen'] == true);

    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: kGold.withOpacity(0.22)),
      ),
      child: Column(
        children: [
          // 헤더
          InkWell(
            onTap: _toggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              color: _open ? kGold.withOpacity(0.07) : Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                children: [
                  Expanded(
                    child: Wrap(
                      spacing: 8, runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text('전성분 표기',
                          style: TextStyle(
                            fontSize: 9, letterSpacing: 4,
                            color: kGold, fontWeight: FontWeight.w500,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            border: Border.all(color: kGold.withOpacity(0.35)),
                          ),
                          child: const Text('화장품법 의무',
                            style: TextStyle(fontSize: 8, color: Color(0xB3C9A961), letterSpacing: 2)),
                        ),
                        if (hasAllergen)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.red.withOpacity(0.5)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.warning_amber_rounded, size: 9, color: Colors.red.withOpacity(0.8)),
                                const SizedBox(width: 3),
                                Text('알레르겐 포함',
                                  style: TextStyle(fontSize: 8, color: Colors.red.withOpacity(0.8), letterSpacing: 1)),
                              ],
                            ),
                          ),
                        if (widget.items.isNotEmpty)
                          Text('${widget.items.length}종',
                            style: const TextStyle(fontSize: 8, color: Color(0x73C9A961))),
                      ],
                    ),
                  ),
                  Icon(
                    _open ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    size: 16, color: kGold.withOpacity(0.7),
                  ),
                ],
              ),
            ),
          ),

          // 바디 (애니메이션)
          SizeTransition(
            sizeFactor: _anim,
            child: Container(
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: kGold.withOpacity(0.12))),
              ),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: widget.loading
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: CircularProgressIndicator(color: kGold, strokeWidth: 2),
                      ),
                    )
                  : widget.items.isEmpty
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '전성분 정보는 제품 용기 또는 포장재에 표기되어 있습니다.',
                              style: TextStyle(
                                fontSize: 11, color: Color(0x8C3C2814),
                                fontStyle: FontStyle.italic, height: 1.8,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '* 성분은 함량이 높은 순서로 기재됩니다. (화장품법 제10조 및 시행규칙 제19조)',
                              style: TextStyle(
                                fontSize: 9, color: kMidBrown.withOpacity(0.5),
                                letterSpacing: 1.0, fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 화장품법 표기 (쉼표 구분)
                            _buildCosmLawText(),
                            const SizedBox(height: 20),

                            // 상세 테이블
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: _buildIngredientTable(),
                            ),

                            // 법정 고지
                            const SizedBox(height: 16),
                            if (hasAllergen) ...[
                              Row(
                                children: [
                                  const Icon(Icons.warning_amber_rounded, size: 10, color: Color(0xB3C94A4A)),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      '빨간색 성분은 알레르겐으로 민감한 피부 주의가 필요합니다.',
                                      style: TextStyle(
                                        fontSize: 9, color: Colors.red.withOpacity(0.7),
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                            ],
                            Text(
                              '* 성분은 함량이 높은 순서로 기재됩니다. (화장품법 제10조 및 시행규칙 제19조)',
                              style: TextStyle(
                                fontSize: 9, color: kMidBrown.withOpacity(0.5),
                                letterSpacing: 1.2, fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCosmLawText() {
    return RichText(
      text: TextSpan(
        style: const TextStyle(
          fontSize: 12, color: Color(0xBF3C2814),
          height: 2.0, letterSpacing: 0.4, fontFamily: 'Georgia',
        ),
        children: [
          for (int i = 0; i < widget.items.length; i++) ...[
            TextSpan(
              text: widget.items[i]['name'] ?? '',
              style: TextStyle(
                color: widget.items[i]['is_allergen'] == true
                    ? const Color(0xFFC94A4A)
                    : const Color(0xBF3C2814),
              ),
            ),
            if ((widget.items[i]['name_en'] ?? '').isNotEmpty)
              TextSpan(
                text: ' (${widget.items[i]['name_en']})',
                style: const TextStyle(
                  fontSize: 10, color: Color(0x8C8B6030),
                ),
              ),
            if (i < widget.items.length - 1)
              const TextSpan(
                text: ', ',
                style: TextStyle(color: Color(0x598B6030)),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildIngredientTable() {
    const headers = ['성분명', 'CAS No.', 'EWG', '함량', '특성'];
    return Table(
      border: TableBorder(
        horizontalInside: BorderSide(color: kGold.withOpacity(0.08)),
        bottom: BorderSide(color: kGold.withOpacity(0.2)),
        top: BorderSide(color: kGold.withOpacity(0.2)),
      ),
      columnWidths: const {
        0: FixedColumnWidth(130),
        1: FixedColumnWidth(90),
        2: FixedColumnWidth(80),
        3: FixedColumnWidth(60),
        4: FixedColumnWidth(150),
      },
      children: [
        // 헤더 행
        TableRow(
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: kGold.withOpacity(0.2))),
          ),
          children: headers.map((h) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            child: Text(h,
              style: const TextStyle(
                fontSize: 9, letterSpacing: 2.5,
                color: Color(0xB38B6030), fontWeight: FontWeight.w400,
              ),
            ),
          )).toList(),
        ),
        // 데이터 행
        for (int i = 0; i < widget.items.length; i++)
          _buildIngRow(widget.items[i], i),
      ],
    );
  }

  TableRow _buildIngRow(Map<String, dynamic> ing, int i) {
    final isAllergen = ing['is_allergen'] == true;
    final isNatural  = ing['is_natural'];
    final ewgGrade   = ing['ewg_grade'];
    final ratio      = ing['ratio_percent'];
    final color      = ewgColor(ewgGrade);
    final label      = ewgLabel(ewgGrade);

    return TableRow(
      decoration: BoxDecoration(
        color: i.isEven ? kGold.withOpacity(0.02) : Colors.transparent,
      ),
      children: [
        // 성분명
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                ing['name'] ?? '',
                style: TextStyle(
                  fontSize: 11,
                  color: isAllergen ? const Color(0xFFC94A4A) : const Color(0xD92A1508),
                ),
              ),
              Row(
                children: [
                  if (isAllergen)
                    const Text('*알레르겐',
                      style: TextStyle(fontSize: 8, color: Color(0xB3C94444))),
                  if (isNatural == true)
                    const Text(' 천연',
                      style: TextStyle(fontSize: 8, color: Color(0xFF4A9E60))),
                  if (isNatural == false)
                    const Text(' 합성',
                      style: TextStyle(fontSize: 8, color: Colors.grey)),
                ],
              ),
            ],
          ),
        ),
        // CAS No.
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Text(
            ing['cas_number'] ?? '—',
            style: const TextStyle(
              fontSize: 10, fontFamily: 'monospace',
              color: Color(0x808B6030),
            ),
          ),
        ),
        // EWG
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: ewgGrade != null
              ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.13),
                    border: Border.all(color: color.withOpacity(0.33)),
                  ),
                  child: Text(
                    '$ewgGrade · $label',
                    style: TextStyle(fontSize: 10, color: color),
                  ),
                )
              : const Text('—', style: TextStyle(fontSize: 10, color: Colors.grey)),
        ),
        // 함량
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Text(
            ratio != null
                ? '${(ratio as num).toStringAsFixed(2)}%'
                : '—',
            style: const TextStyle(
              fontSize: 10, fontFamily: 'monospace',
              color: Color(0x8C3C2814),
            ),
          ),
        ),
        // 특성
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Text(
            ing['feature'] ?? ing['description'] ?? '—',
            style: const TextStyle(fontSize: 10, color: Color(0x803C2814)),
            maxLines: 2, overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 공통 소형 위젯들
// ─────────────────────────────────────────────────────────────────────────────

class _StarRating extends StatelessWidget {
  final double rating;
  final int    count;
  const _StarRating({required this.rating, required this.count});

  @override
  Widget build(BuildContext context) {
    final filled = rating.round().clamp(0, 5);
    return Row(
      children: [
        ...List.generate(5, (i) => Icon(
          Icons.star,
          size: 14,
          color: i < filled ? kGold : kGold.withOpacity(0.25),
        )),
        const SizedBox(width: 6),
        Text(
          '${rating.toStringAsFixed(1)} ($count개 리뷰)',
          style: const TextStyle(fontSize: 11, color: Color(0xB3C9A961)),
        ),
      ],
    );
  }
}

class _GoldDivider extends StatelessWidget {
  final double vertical;
  const _GoldDivider({this.vertical = 24});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: vertical),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Color(0x66C9A961)],
                ),
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Text('✦', style: TextStyle(fontSize: 10, color: Color(0x80C9A961))),
          ),
          Expanded(
            child: Container(
              height: 1,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0x66C9A961), Colors.transparent],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 9, letterSpacing: 5,
        color: kMidBrown, fontWeight: FontWeight.w400,
      ),
    );
  }
}

class _NoteBadgeRow extends StatelessWidget {
  final String       label;
  final List<String> items;
  const _NoteBadgeRow({required this.label, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10, letterSpacing: 4,
              color: kGold, fontWeight: FontWeight.w600,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6, runSpacing: 6,
            children: items.map((item) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: kGold.withOpacity(0.28)),
                color: kGold.withOpacity(0.06),
              ),
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 11, color: kDarkBrown, letterSpacing: 0.6,
                ),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _MetaTag extends StatelessWidget {
  final String label;
  final bool   isAlert;
  const _MetaTag({required this.label, this.isAlert = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(
          color: isAlert
              ? const Color(0xFFC94A4A).withOpacity(0.6)
              : kMidBrown.withOpacity(0.35),
        ),
        color: isAlert
            ? const Color(0xFFC94A4A).withOpacity(0.05)
            : kMidBrown.withOpacity(0.05),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10, letterSpacing: 1.2,
          color: isAlert ? const Color(0xFFC94A4A) : kMidBrown,
        ),
      ),
    );
  }
}

class _QtySelector extends StatelessWidget {
  final int      qty;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  const _QtySelector({required this.qty, required this.onDecrement, required this.onIncrement});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: kGold.withOpacity(0.35)),
      ),
      child: Row(
        children: [
          _QtyBtn(label: '−', onTap: onDecrement),
          SizedBox(
            width: 40,
            child: Center(
              child: Text(
                '$qty',
                style: const TextStyle(fontSize: 14, color: kDarkBrown),
              ),
            ),
          ),
          _QtyBtn(label: '+', onTap: onIncrement),
        ],
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final String   label;
  final VoidCallback onTap;
  const _QtyBtn({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        width: 36, height: 44,
        child: Center(
          child: Text(
            label,
            style: const TextStyle(fontSize: 18, color: kMidBrown),
          ),
        ),
      ),
    );
  }
}

class _WishButton extends StatelessWidget {
  final bool         isWished;
  final bool         isLoading;
  final VoidCallback onPressed;
  const _WishButton({required this.isWished, required this.isLoading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isLoading ? null : onPressed,
      child: Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          border: Border.all(color: kGold.withOpacity(0.4)),
          color: isWished ? kGold.withOpacity(0.15) : Colors.transparent,
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 14, height: 14,
                  child: CircularProgressIndicator(strokeWidth: 1.5, color: kGold),
                )
              : Icon(
                  isWished ? Icons.favorite : Icons.favorite_border,
                  size: 16, color: kGold,
                ),
        ),
      ),
    );
  }
}

class _OutlineButton extends StatelessWidget {
  final String   label;
  final IconData icon;
  final VoidCallback? onPressed;
  const _OutlineButton({required this.label, required this.icon, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 13, color: onPressed != null ? kGold : Colors.grey),
      label: Text(
        label,
        style: TextStyle(
          fontSize: 11, letterSpacing: 2,
          color: onPressed != null ? kGold : Colors.grey,
        ),
      ),
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: onPressed != null ? kGold.withOpacity(0.55) : Colors.grey.withOpacity(0.3)),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: const RoundedRectangleBorder(),
        backgroundColor: Colors.transparent,
        disabledBackgroundColor: Colors.transparent,
      ),
    );
  }
}

class _FilledButton extends StatelessWidget {
  final String   label;
  final VoidCallback? onPressed;
  const _FilledButton({required this.label, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor:         onPressed != null ? kGold : const Color(0xFFA39D8F),
        disabledBackgroundColor: const Color(0xFFA39D8F),
        foregroundColor:         kDarkBrown,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: const RoundedRectangleBorder(),
        elevation: 0,
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, letterSpacing: 2.5, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _RestockButton extends StatelessWidget {
  final bool isDone;
  final bool isLoading;
  final VoidCallback? onPressed;
  const _RestockButton({required this.isDone, required this.isLoading, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Text(isDone ? '✓' : '🔔', style: const TextStyle(fontSize: 13)),
        label: Text(
          isLoading ? '신청 중…' : isDone ? '재입고 알림 신청 완료' : '재입고 알림 신청',
          style: TextStyle(
            fontSize: 10, letterSpacing: 2.5,
            color: isDone ? kGold : kGold.withOpacity(0.7),
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: kGold.withOpacity(0.4)),
          backgroundColor: isDone ? kGold.withOpacity(0.08) : Colors.transparent,
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: const RoundedRectangleBorder(),
        ),
      ),
    );
  }
}

class _ToastWidget extends StatelessWidget {
  final String message;
  const _ToastWidget({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
        decoration: BoxDecoration(
          color: kNavBg,
          border: Border.all(color: kGold.withOpacity(0.5)),
          boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 20)],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check, size: 14, color: kGold),
            const SizedBox(width: 10),
            Text(
              message,
              style: const TextStyle(
                fontSize: 12, color: Color(0xFFFAF6EF), letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}