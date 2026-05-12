import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:gal/gal.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:device_info_plus/device_info_plus.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF1A1A1A);
const _grey = Color(0xFF8B8278);

// ─────────────────────────────────────────────────────────────
// 사용법: showScentCard(context, blend) 로 호출
// ListView 안에 넣지 말고 Navigator.push 방식의 오버레이로 표시
// ─────────────────────────────────────────────────────────────
void showScentCard(BuildContext context, Map<String, dynamic> blend) {
  Navigator.of(context).push(
    PageRouteBuilder(
      opaque: false,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.78),
      pageBuilder: (ctx, _, __) => _ScentCardPage(blend: blend),
      transitionsBuilder: (ctx, anim, _, child) =>
          FadeTransition(opacity: anim, child: child),
    ),
  );
}

// ── 페이지 (전체 화면 오버레이) ──────────────────────────────
class _ScentCardPage extends StatefulWidget {
  final Map<String, dynamic> blend;
  const _ScentCardPage({required this.blend});
  @override
  State<_ScentCardPage> createState() => _ScentCardPageState();
}

class _ScentCardPageState extends State<_ScentCardPage> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;
  bool _downloading = false;
  final _cardKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, dynamic> _buildPayload() {
    final items = (widget.blend['items'] as List? ?? []).map((item) {
      final m = Map<String, dynamic>.from(item as Map);
      m.putIfAbsent('ingredientName', () => m['name']?.toString() ?? '');
      final rawRatio = (m['ratio'] as num?)?.toDouble() ?? 0.0;
      m['ratio'] = rawRatio > 1 ? rawRatio / 100.0 : rawRatio;
      return m;
    }).toList();

    return {
      'name': widget.blend['name'] ?? '',
      'concentration': widget.blend['concentration'] ?? 'EDP',
      'volumeMl': widget.blend['volumeMl'] ?? 50,
      'items': items,
    };
  }

  Future<void> _fetchData() async {
    setState(() { _loading = true; _error = null; });
    try {
      final payload = _buildPayload();
      debugPrint('[ScentCard] 요청: ${jsonEncode(payload)}');

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/ai/gemini-scent-card'),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: jsonEncode({'blend': payload}),
      );

      debugPrint('[ScentCard] 응답 ${res.statusCode}: ${res.body.substring(0, math.min(200, res.body.length))}');

      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() { _data = json['data'] ?? json; _loading = false; });
      } else {
        String msg = '${res.statusCode}';
        try { final j = jsonDecode(res.body); msg = j['message'] ?? j['error'] ?? msg; } catch (_) {}
        if (mounted) setState(() { _error = '향 카드 생성 실패: $msg'; _loading = false; });
      }
    } catch (e) {
      if (mounted) setState(() { _error = '오류: $e'; _loading = false; });
    }
  }

Future<void> _download() async {
  if (_downloading) return;
  setState(() => _downloading = true);
  try {
    // 렌더 완료 대기
    await Future.delayed(const Duration(milliseconds: 150));

    final boundary = _cardKey.currentContext?.findRenderObject()
        as RenderRepaintBoundary?;
    if (boundary == null) {
      _snack('캡처 실패 - 잠시 후 다시 시도해주세요');
      return;
    }

    final image = await boundary.toImage(pixelRatio: 3.0);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) { _snack('이미지 변환 실패'); return; }

    final pngBytes = byteData.buffer.asUint8List();
    final fileName = '${(widget.blend['name'] ?? 'my-scent').toString().replaceAll(' ', '_')}_card.png';

    if (kIsWeb) {
      // ── 웹: 브라우저 다운로드 ──────────────────────────────
      // 웹은 html 패키지 사용
      _snack('웹에서는 저장이 지원되지 않습니다. 스크린샷을 이용해주세요.');

    } else if (Platform.isAndroid || Platform.isIOS) {
      // ── 모바일: 갤러리에 저장 ─────────────────────────────
      await _saveToGallery(pngBytes, fileName);

    } else {
      // ── 데스크탑: 문서 폴더에 저장 ───────────────────────
      await _saveToFile(pngBytes, fileName);
    }
  } catch (e) {
    debugPrint('[ScentCard] 다운로드 오류: $e');
    _snack('저장 실패: $e');
  } finally {
    if (mounted) setState(() => _downloading = false);
  }
}

Future<void> _saveToGallery(Uint8List bytes, String fileName) async {
  if (Platform.isAndroid) {
    final sdkInt = await _getAndroidSdkInt();
    if (sdkInt < 33) {
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        _snack('저장소 권한이 필요합니다. 설정에서 허용해주세요.');
        return;
      }
    }
  }

  try {
    await Gal.putImageBytes(bytes);
    _snack('갤러리에 저장되었습니다!');
  } catch (e) {
    debugPrint('[ScentCard] 갤러리 저장 오류: $e');
    _snack('갤러리 저장 실패. 다시 시도해주세요.');
  }
}

Future<void> _saveToFile(Uint8List bytes, String fileName) async {
  final dir = await getApplicationDocumentsDirectory();
  final filePath = '${dir.path}/$fileName';
  final file = File(filePath);
  await file.writeAsBytes(bytes);
  _snack('💾 저장됨: $filePath');
  debugPrint('[ScentCard] 파일 저장: $filePath');
}

Future<int> _getAndroidSdkInt() async {
  try {
    // Android SDK 버전 확인
    if (Platform.isAndroid) {
      final info = await DeviceInfoPlugin().androidInfo;
      return info.version.sdkInt;
    }
  } catch (_) {}
  return 0;
}

  void _snack(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(m, style: const TextStyle(color: _gold)),
      backgroundColor: _dark, behavior: SnackBarBehavior.floating));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: GestureDetector(
        // 카드 바깥 탭하면 닫기 (프론트와 동일)
        onTap: () => Navigator.of(context).pop(),
        child: Container(
          color: Colors.transparent,
          width: double.infinity,
          height: double.infinity,
          child: SafeArea(
            child: Stack(
              children: [
                // ── 닫기 버튼 (우상단 고정) ──────────────────
                Positioned(
                  top: 12, right: 16,
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.close,
                          color: Colors.white.withOpacity(0.7), size: 20),
                    ),
                  ),
                ),

                // ── 중앙 컨텐츠 ──────────────────────────────
                Center(
                  child: GestureDetector(
                    onTap: () {}, // 카드 영역 탭은 닫기 방지
                    child: _buildContent(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(
          width: 36, height: 36,
          child: CircularProgressIndicator(color: _gold, strokeWidth: 2),
        ),
        const SizedBox(height: 16),
        const Text('향 카드 생성 중...',
            style: TextStyle(fontSize: 12, letterSpacing: 4, color: _gold)),
        const SizedBox(height: 6),
        Text('Gemini AI가 당신의 향을 분석합니다',
            style: TextStyle(fontSize: 10, letterSpacing: 2,
                color: Colors.white.withOpacity(0.45))),
      ]);
    }

    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('✦', style: TextStyle(fontSize: 28, color: _gold)),
          const SizedBox(height: 12),
          Text(_error!, textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.redAccent, fontSize: 13, height: 1.6)),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _outlineBtn('다시 시도', _fetchData),
            const SizedBox(width: 12),
            _outlineBtn('닫기', () => Navigator.of(context).pop()),
          ]),
        ]),
      );
    }

    if (_data != null) {
      return SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          // ── 카드 본체 ──────────────────────────────────────
          RepaintBoundary(
            key: _cardKey,
            child: _PerfumeCard(blend: widget.blend, data: _data!),
          ),
          const SizedBox(height: 20),
          // ── 다운로드 버튼 ──────────────────────────────────
          GestureDetector(
            onTap: _downloading ? null : _download,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              _downloading
                ? const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5))
                : Icon(Icons.download_outlined,
                    color: _gold.withOpacity(0.8), size: 22),
              const SizedBox(height: 4),
              Text(_downloading ? 'SAVING...' : 'SAVE IMAGE',
                  style: TextStyle(fontSize: 9, letterSpacing: 4,
                      color: _gold.withOpacity(0.75))),
            ]),
          ),
        ]),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _outlineBtn(String label, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.5))),
      child: Text(label, style: const TextStyle(fontSize: 11, color: _gold, letterSpacing: 2)),
    ),
  );
}

// ── 카드 UI (프론트 PerfumeCard 동일 구조) ───────────────────
class _PerfumeCard extends StatelessWidget {
  final Map<String, dynamic> blend;
  final Map<String, dynamic> data;
  const _PerfumeCard({required this.blend, required this.data});

  Color _hex(String? raw) {
    if (raw == null) return _gold;
    try {
      final h = raw.startsWith('#') ? raw.substring(1) : raw;
      if (h.length == 6) return Color(int.parse('FF$h', radix: 16));
    } catch (_) {}
    return _gold;
  }

  @override
  Widget build(BuildContext ctx) {
    final symbolColor = _hex(data['symbolColor']?.toString());
    final tagline = data['tagline']?.toString() ?? '';
    final colorList = (data['ingredientColors'] as List? ?? []);
    final ingredientColors = colorList.map((c) => _hex(c?.toString())).toList();

    final rawItems = (blend['items'] as List? ?? []);
    final ingredients = rawItems.asMap().entries.map((e) {
      final item = e.value as Map;
      final name = (item['ingredientName']?.toString().isNotEmpty == true)
          ? item['ingredientName'].toString()
          : item['name']?.toString() ?? 'Item ${e.key + 1}';
      final color = e.key < ingredientColors.length
          ? ingredientColors[e.key] : _gold;
      final rawRatio = (item['ratio'] as num?)?.toDouble() ?? 1.0;
      final ratio = rawRatio > 1 ? rawRatio / 100.0 : rawRatio;
      return (name: name, color: color, ratio: ratio);
    }).toList();

    final totalRatio = ingredients.fold<double>(0, (s, i) => s + i.ratio);

    // 배경색 (프론트 bgLight/bgMid 동일)
    final bgLight = symbolColor.withOpacity(0.06);
    final bgMid   = symbolColor.withOpacity(0.03);

    return Container(
      width: 320,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [bgLight, const Color(0xFFFAF8F4), bgMid],
        ),
        boxShadow: [
          BoxShadow(color: symbolColor.withOpacity(0.18), blurRadius: 48, offset: const Offset(0, 8)),
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Column(mainAxisSize: MainAxisSize.min, children: [

          // 상단 장식선
          Container(height: 3, decoration: BoxDecoration(
              gradient: LinearGradient(colors: [
                Colors.transparent, symbolColor, Colors.transparent]))),

          const SizedBox(height: 16),

          // 브랜드
          Text('My Signature Scent',
              style: TextStyle(fontSize: 9, letterSpacing: 5,
                  color: symbolColor.withOpacity(0.7), fontStyle: FontStyle.italic)),

          const SizedBox(height: 6),

          // 향수 이름
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(blend['name']?.toString() ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, letterSpacing: 2,
                    color: _dark.withOpacity(0.65), fontWeight: FontWeight.bold)),
          ),

          const SizedBox(height: 10),

          // 꽃잎 그래픽
          SizedBox(
            width: 280, height: 280,
            child: CustomPaint(painter: _PetalPainter(
                ingredients: ingredients, symbolColor: symbolColor, totalRatio: totalRatio)),
          ),

          // 농도/용량
          Text('${blend['concentration'] ?? 'EDP'} · ${blend['volumeMl'] ?? 50}ml',
              style: TextStyle(fontSize: 9, letterSpacing: 2,
                  color: symbolColor.withOpacity(0.55))),

          const SizedBox(height: 10),

          // 장식선
          Container(width: 28, height: 1, decoration: BoxDecoration(
              gradient: LinearGradient(colors: [
                Colors.transparent, symbolColor, Colors.transparent]))),

          const SizedBox(height: 10),

          // 태그라인 (프론트 동일)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(tagline,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold,
                    color: symbolColor, height: 1.55, letterSpacing: 0.5)),
          ),

          const SizedBox(height: 14),

          // 장식선
          Container(width: 28, height: 1, decoration: BoxDecoration(
              gradient: LinearGradient(colors: [
                Colors.transparent, symbolColor, Colors.transparent]))),

          const SizedBox(height: 14),

          // 노트 3컬럼 (Top / Middle / Base)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _noteCol('Top',
                  (data['topNotes'] as List? ?? []).map((e) => e.toString()).toList(),
                  symbolColor),
              Container(width: 1, height: 60, color: symbolColor.withOpacity(0.2)),
              _noteCol('Middle',
                  (data['middleNotes'] as List? ?? []).map((e) => e.toString()).toList(),
                  symbolColor),
              Container(width: 1, height: 60, color: symbolColor.withOpacity(0.2)),
              _noteCol('Base',
                  (data['baseNotes'] as List? ?? []).map((e) => e.toString()).toList(),
                  symbolColor),
            ]),
          ),

          const SizedBox(height: 14),

          // 재료 색 점들 (프론트 동일)
          Wrap(
            spacing: 5,
            children: ingredients.map((i) {
              final opacity = (0.55 + (totalRatio > 0 ? (i.ratio / totalRatio) * 0.4 : 0.2)).clamp(0.0, 1.0);
              return Container(
                width: 6, height: 6,
                decoration: BoxDecoration(
                    color: i.color.withOpacity(opacity), shape: BoxShape.circle));
            }).toList(),
          ),

          const SizedBox(height: 6),

          Text('AION PARFUMS',
              style: TextStyle(fontSize: 8, letterSpacing: 4,
                  color: const Color(0xFF8B8278).withOpacity(0.45))),

          const SizedBox(height: 12),

          // 하단 장식선
          Container(height: 2, decoration: BoxDecoration(
              gradient: LinearGradient(colors: [
                Colors.transparent, symbolColor.withOpacity(0.45), Colors.transparent]))),
        ]),
      ),
    );
  }

  Widget _noteCol(String label, List<String> items, Color color) => Expanded(
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(label.toUpperCase(),
            style: TextStyle(fontSize: 8, letterSpacing: 3,
                color: color.withOpacity(0.8), fontStyle: FontStyle.italic)),
        const SizedBox(height: 5),
        ...items.map((n) => Padding(
          padding: const EdgeInsets.only(bottom: 2),
          child: Text(n, textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 9, color: _dark, height: 1.35)),
        )),
      ]),
    ),
  );
}

// ── 꽃잎 CustomPainter ────────────────────────────────────────
class _PetalPainter extends CustomPainter {
  final List<({String name, Color color, double ratio})> ingredients;
  final Color symbolColor;
  final double totalRatio;
  const _PetalPainter({
    required this.ingredients,
    required this.symbolColor,
    required this.totalRatio,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final n  = ingredients.length;
    if (n == 0) return;

    final petalLen = size.width * (n <= 3 ? 0.38 : n <= 6 ? 0.35 : n <= 9 ? 0.32 : 0.28);
    final petalW   = petalLen * (n <= 4 ? 0.52 : 0.44);
    final centerR  = size.width * 0.13;

    // ── 꽃잎 ──
    for (int i = 0; i < n; i++) {
      final ing    = ingredients[i];
      final angle  = (360.0 / n) * i - 90;
      final opacity = (0.35 + (totalRatio > 0 ? (ing.ratio / totalRatio) * 0.5 : 0.3)).clamp(0.0, 1.0);

      canvas.drawPath(_petal(cx, cy, petalLen, petalW, angle),
          Paint()
            ..color = ing.color.withOpacity(opacity)
            ..style = PaintingStyle.fill
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1.5));

      canvas.drawPath(_petal(cx, cy, petalLen, petalW, angle),
          Paint()
            ..color = ing.color.withOpacity(0.28)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 0.6);
    }

    // ── 중앙 오라 ──
    canvas.drawCircle(Offset(cx, cy), centerR * 2.2,
        Paint()..shader = ui.Gradient.radial(
          Offset(cx, cy), centerR * 2.2,
          [symbolColor.withOpacity(0.45), Colors.transparent]));

    // ── 중앙 원 ──
    canvas.drawCircle(Offset(cx, cy), centerR,
        Paint()..color = symbolColor.withOpacity(0.82));
    canvas.drawCircle(Offset(cx, cy), centerR * 0.42,
        Paint()..color = Colors.white.withOpacity(0.55));
  }

  Path _petal(double cx, double cy, double len, double w, double deg) {
    final rad = deg * math.pi / 180;
    final cos = math.cos(rad);
    final sin = math.sin(rad);
    Offset rot(double x, double y) =>
        Offset(cx + x * cos - y * sin, cy + x * sin + y * cos);
    final tip = rot(0, -len);
    final cl  = rot(-w / 2, -len * 0.45);
    final cr  = rot( w / 2, -len * 0.45);
    final o   = Offset(cx, cy);
    return Path()
      ..moveTo(o.dx, o.dy)
      ..cubicTo(cl.dx, cl.dy, tip.dx, tip.dy, tip.dx, tip.dy)
      ..cubicTo(tip.dx, tip.dy, cr.dx, cr.dy, o.dx, o.dy)
      ..close();
  }

  @override
  bool shouldRepaint(covariant _PetalPainter o) =>
      o.ingredients != ingredients || o.symbolColor != symbolColor;
}