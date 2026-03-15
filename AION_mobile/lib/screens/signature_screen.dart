import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF2A2620);
const _bg = Color(0xFFFAF8F3);
const _grey = Color(0xFF8B8278);

class SignatureScreen extends StatefulWidget {
  const SignatureScreen({super.key});
  @override
  State<SignatureScreen> createState() => _SignatureScreenState();
}

class _SignatureScreenState extends State<SignatureScreen> {
  Map<String, dynamic>? _signature;
  bool _loading = true;
  int _mediaIdx = 0;
  Timer? _slideTimer;

  @override
  void initState() {
    super.initState();
    _fetchSignature();
  }

  @override
  void dispose() {
    _slideTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchSignature() async {
    setState(() => _loading = true);
    try {
      final res = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/signature/active'));
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (json['success'] == true && json['data'] != null) {
          final data = json['data'] as Map<String, dynamic>;
          if (mounted) {
            setState(() => _signature = data);
            _startSlideTimer(data);
          }
        }
      }
    } catch (e) {
      debugPrint('시그니처 로드 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _startSlideTimer(Map<String, dynamic> data) {
    final mediaList = data['mediaList'] as List? ?? [];
    if (mediaList.length > 1) {
      _slideTimer = Timer.periodic(const Duration(seconds: 5), (_) {
        if (mounted) setState(() => _mediaIdx = (_mediaIdx + 1) % mediaList.length);
      });
    }
  }

  // 가격 포맷 (단 하나만 선언)
  String _formatPrice(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return '₩${n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: _bg,
        body: Center(child: CircularProgressIndicator(color: _gold)),
      );
    }

    final sig = _signature;
    final mediaList = sig?['mediaList'] as List? ?? [];
    final perfumes  = sig?['perfumes']  as List? ?? [];
    final textBlocks = sig?['textBlocks'] as List? ?? [];
    Color textColor;
    try {
      textColor = Color(int.parse((sig?['textColor'] ?? '#C9A961').replaceFirst('#', '0xFF')));
    } catch (_) {
      textColor = _gold;
    }

    return Scaffold(
      backgroundColor: _bg,
      body: CustomScrollView(
        slivers: [
          // ─ Hero 슬라이드 ─
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: _dark,
            flexibleSpace: FlexibleSpaceBar(
              background: _buildHero(mediaList, textBlocks, textColor, sig),
              title: Text(
                sig?['title'] ?? 'SIGNATURE',
                style: const TextStyle(color: _gold, fontSize: 10, letterSpacing: 4, fontWeight: FontWeight.w400),
              ),
              centerTitle: true,
            ),
          ),
          // ─ 섹션 헤더 ─
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 48, 24, 8),
              child: Column(
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(width: 40, height: 1, color: _gold.withOpacity(0.3)),
                    Padding(padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text('✦', style: TextStyle(color: _gold, fontSize: 10))),
                    Container(width: 40, height: 1, color: _gold.withOpacity(0.3)),
                  ]),
                  const SizedBox(height: 16),
                  Text(sig?['title'] ?? 'SIGNATURE',
                      style: const TextStyle(fontSize: 26, letterSpacing: 6, color: Color(0xFF2A2620), fontWeight: FontWeight.w300),
                      textAlign: TextAlign.center),
                  if (sig?['description'] != null) ...[
                    const SizedBox(height: 8),
                    Text(sig!['description'],
                        style: const TextStyle(fontSize: 12, color: _grey, fontStyle: FontStyle.italic, letterSpacing: 1),
                        textAlign: TextAlign.center),
                  ],
                ],
              ),
            ),
          ),
          // ─ 향수 그리드 ─
          if (perfumes.isEmpty)
            SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(60),
                  child: Text('준비 중입니다', style: TextStyle(color: _grey, fontStyle: FontStyle.italic)),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 80),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _buildPerfumeCard(perfumes[i] as Map<String, dynamic>),
                  childCount: perfumes.length,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, childAspectRatio: 0.72,
                  crossAxisSpacing: 12, mainAxisSpacing: 20,
                ),
              ),
            ),
          // ─ 클로징 ─
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 40),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Container(width: 40, height: 1, color: _gold.withOpacity(0.2)),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('✦', style: TextStyle(color: _gold.withOpacity(0.3), fontSize: 10))),
                Container(width: 40, height: 1, color: _gold.withOpacity(0.2)),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHero(List mediaList, List textBlocks, Color textColor, Map<String, dynamic>? sig) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (mediaList.isNotEmpty)
          ...mediaList.asMap().entries.map((e) {
            final m = e.value as Map<String, dynamic>;
            return AnimatedOpacity(
              opacity: e.key == _mediaIdx ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 1500),
              child: Image.network(m['mediaUrl'] ?? '',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(color: _dark)),
            );
          })
        else
          Container(decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight,
                  colors: [const Color(0xFF2A2620), const Color(0xFF3D3228)]))),
        Container(decoration: BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Colors.black.withOpacity(0.3), Colors.transparent, Colors.black.withOpacity(0.5)]))),
        if (textBlocks.isNotEmpty)
          ...textBlocks.map((b) {
            final block = b as Map<String, dynamic>;
            final px = _parsePct(block['positionX'] ?? '50%');
            final py = _parsePct(block['positionY'] ?? '50%');
            return Positioned(
              left: MediaQuery.of(context).size.width * px - 60,
              top: 280 * py - 20,
              child: SizedBox(
                width: 120,
                child: Text(block['content'] ?? '',
                    style: TextStyle(color: textColor,
                        fontSize: _fontSizePt(block['fontSize']),
                        fontWeight: _fontWeightVal(block['fontWeight']),
                        fontStyle: block['isItalic'] == true ? FontStyle.italic : FontStyle.normal,
                        letterSpacing: 3,
                        shadows: [Shadow(color: Colors.black.withOpacity(0.7), blurRadius: 8)]),
                    textAlign: TextAlign.center, maxLines: 3),
              ),
            );
          })
        else if (sig != null)
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 40),
              child: Text(sig['title'] ?? 'SIGNATURE',
                  style: TextStyle(color: textColor, fontSize: 36, letterSpacing: 8, fontWeight: FontWeight.w200,
                      shadows: [Shadow(color: Colors.black.withOpacity(0.7), blurRadius: 10)]),
                  textAlign: TextAlign.center),
            ),
          ),
        if (mediaList.length > 1)
          Positioned(
            bottom: 40, left: 0, right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: mediaList.asMap().entries.map((e) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: e.key == _mediaIdx ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: e.key == _mediaIdx ? _gold : Colors.white.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(3),
                ),
              )).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildPerfumeCard(Map<String, dynamic> p) {
    final thumbnail = p['thumbnail'];
    final name     = p['name']      ?? '';
    final brand    = p['brandName'] ?? '';
    final price    = p['price'];
    final salePrice = p['salePrice'];
    final saleRate  = p['saleRate'] ?? 0;
    final isFeatured = p['isFeatured'] ?? false;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.15)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                thumbnail != null
                    ? Image.network(thumbnail, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _placeholder(name))
                    : _placeholder(name),
                if (isFeatured)
                  Positioned(top: 8, left: 8,
                      child: Container(padding: const EdgeInsets.all(4), color: _gold,
                          child: const Icon(Icons.star, size: 10, color: Colors.white))),
                if ((saleRate as num) > 0)
                  Positioned(top: 8, right: 8,
                      child: Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3), color: Colors.red,
                          child: Text('${saleRate}% OFF',
                              style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold)))),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
            child: Column(children: [
              if (brand.isNotEmpty)
                Text(brand, style: TextStyle(fontSize: 9, color: _grey, letterSpacing: 1)),
              const SizedBox(height: 4),
              Text(name,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF2A2620), fontWeight: FontWeight.w500, letterSpacing: 0.5),
                  textAlign: TextAlign.center, maxLines: 2),
              const SizedBox(height: 6),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                if ((saleRate as num) > 0 && price != null)
                  Padding(padding: const EdgeInsets.only(right: 6),
                      child: Text(_formatPrice(price),
                          style: TextStyle(fontSize: 10, color: _grey, decoration: TextDecoration.lineThrough))),
                Text(
                  (saleRate as num) > 0 && salePrice != null
                      ? _formatPrice(salePrice)
                      : _formatPrice(price),
                  style: const TextStyle(fontSize: 13, color: _gold, fontWeight: FontWeight.w600),
                ),
              ]),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _placeholder(String name) {
    return Container(color: const Color(0xFFE8E2D6),
        child: Center(child: Text(name.isNotEmpty ? name[0] : '✦',
            style: TextStyle(fontSize: 40, color: _gold.withOpacity(0.2)))));
  }

  double _parsePct(String s) {
    return (double.tryParse(s.replaceAll('%', '')) ?? 50) / 100;
  }

  double _fontSizePt(String? size) {
    switch (size) {
      case 'small': return 12;
      case 'medium': return 16;
      case 'large': return 20;
      case 'xlarge': return 26;
      default: return 20;
    }
  }

  FontWeight _fontWeightVal(String? w) {
    switch (w) {
      case 'light': return FontWeight.w300;
      case 'normal': return FontWeight.w400;
      case 'medium': return FontWeight.w500;
      case 'bold': return FontWeight.w700;
      default: return FontWeight.w400;
    }
  }
}
