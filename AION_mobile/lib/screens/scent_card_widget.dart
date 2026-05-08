
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF1A1A1A);

class ScentCardWidget extends StatefulWidget {
  final Map<String, dynamic> blend;
  final VoidCallback onClose;
  const ScentCardWidget({super.key, required this.blend, required this.onClose});
  @override State<ScentCardWidget> createState() => _ScentCardWidgetState();
}

class _ScentCardWidgetState extends State<ScentCardWidget> {
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

  Future<void> _fetchData() async {
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/ai/gemini-scent-card'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'blend': widget.blend}),
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() { _data = json['data']; _loading = false; });
      } else { if (mounted) setState(() { _error = '향 카드 생성 실패 (${res.statusCode})'; _loading = false; }); }
    } catch (e) {
      if (mounted) setState(() { _error = '네트워크 오류: $e'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext ctx) {
    return Material(
      color: Colors.black.withOpacity(0.78),
      child: InkWell(
        onTap: widget.onClose,
        child: SafeArea(child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          if (_loading) Column(children: [
            const CircularProgressIndicator(color: _gold),
            const SizedBox(height: 16),
            const Text('향 카드 생성 중...', style: TextStyle(fontSize: 12, letterSpacing: 4, color: _gold)),
            const Text('Gemini AI가 당신의 향을 분석합니다', style: TextStyle(fontSize: 10, color: Colors.white54)),
          ])
          else if (_error != null) Column(children: [
            Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: widget.onClose, style: OutlinedButton.styleFrom(side: const BorderSide(color: _gold), shape: const RoundedRectangleBorder()),
              child: const Text('닫기', style: TextStyle(color: _gold))),
          ])
          else if (_data != null) ...[
            // 카드
            RepaintBoundary(key: _cardKey, child: _PerfumeCard(blend: widget.blend, data: _data!)),
            const SizedBox(height: 16),
            // 다운로드 버튼
            GestureDetector(
              onTap: _downloading ? null : _download,
              child: Column(children: [
                _downloading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5))
                  : const Icon(Icons.download_outlined, color: _gold, size: 22),
                const SizedBox(height: 4),
                Text(_downloading ? 'SAVING...' : 'SAVE IMAGE',
                  style: TextStyle(fontSize: 9, letterSpacing: 4, color: _gold.withOpacity(0.8))),
              ]),
            ),
          ],
          const SizedBox(height: 12),
          GestureDetector(onTap: widget.onClose,
            child: const Icon(Icons.close, color: Colors.white54, size: 22)),
        ]))),
      ),
    );
  }

  Future<void> _download() async {
    setState(() => _downloading = true);
    try {
      final boundary = _cardKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes != null) {
        final p = await SharedPreferences.getInstance();
        await p.setString('last_scent_card_png', base64Encode(bytes.buffer.asUint8List()));
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('향 카드가 저장되었습니다 (공유 기능은 추후 업데이트)', style: TextStyle(color: _gold)), backgroundColor: _dark));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('저장에 실패했습니다.', style: TextStyle(color: Colors.redAccent)), backgroundColor: _dark));
    } finally { if (mounted) setState(() => _downloading = false); }
  }
}

// ── 카드 UI ──────────────────────────────────────────────────
class _PerfumeCard extends StatelessWidget {
  final Map<String, dynamic> blend;
  final Map<String, dynamic> data;
  const _PerfumeCard({required this.blend, required this.data});

  @override
  Widget build(BuildContext ctx) {
    final symbolColor = _hexColor(data['symbolColor'] ?? '#C9A961');
    final tagline = data['tagline'] ?? '';
    final ingredientColors = (data['ingredientColors'] as List? ?? [])
        .map((c) => _hexColor(c.toString())).toList();
    final items = (blend['items'] as List? ?? []);
    final totalRatio = items.fold<double>(0, (s, i) => s + ((i['ratio'] as num?)?.toDouble() ?? 1));
    final ingredients = items.asMap().entries.map((e) => (
      name: (e.value['ingredientName'] ?? 'Item ${e.key + 1}').toString(),
      color: e.key < ingredientColors.length ? ingredientColors[e.key] : _gold,
      ratio: ((e.value['ratio'] as num?)?.toDouble() ?? 1),
    )).toList();

    final rgb = _colorToRgb(symbolColor);
    final bgLight = symbolColor.withOpacity(0.06);
    final bgMid = symbolColor.withOpacity(0.03);

    return Container(
      width: 320, height: 560,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [bgLight, const Color(0xFFFAF8F4), bgMid]),
        boxShadow: [BoxShadow(color: symbolColor.withOpacity(0.18), blurRadius: 48, offset: const Offset(0, 8)),
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12)],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(children: [
          // 상단 장식선
          Container(height: 3, decoration: BoxDecoration(gradient: LinearGradient(
            colors: [Colors.transparent, symbolColor, Colors.transparent]))),
          const SizedBox(height: 14),
          // 브랜드명
          Text('My Signature Scent', style: TextStyle(fontSize: 9, letterSpacing: 5, color: symbolColor.withOpacity(0.7), fontStyle: FontStyle.italic)),
          const SizedBox(height: 4),
          // 향수 이름
          Padding(padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(blend['name'] ?? '', textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, letterSpacing: 2, color: _dark.withOpacity(0.6), fontWeight: FontWeight.bold))),
          const SizedBox(height: 8),
          // 꽃잎 그래픽
          SizedBox(width: 280, height: 280,
            child: CustomPaint(painter: _PetalPainter(ingredients: ingredients, symbolColor: symbolColor))),
          const SizedBox(height: 6),
          // 장식선 + 태그라인
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(width: 28, height: 1, decoration: BoxDecoration(gradient: LinearGradient(colors: [Colors.transparent, symbolColor]))),
          ]),
          const SizedBox(height: 8),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(tagline, textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: symbolColor, height: 1.5, letterSpacing: 0.5))),
          const SizedBox(height: 8),
          // 노트 정보
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(children: [
              _noteCol('Top', (data['topNotes'] as List? ?? []).cast<String>(), symbolColor),
              Container(width: 1, height: 50, decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Colors.transparent, symbolColor.withOpacity(0.3), Colors.transparent]))),
              _noteCol('Middle', (data['middleNotes'] as List? ?? []).cast<String>(), symbolColor),
              Container(width: 1, height: 50, decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
                colors: [Colors.transparent, symbolColor.withOpacity(0.3), Colors.transparent]))),
              _noteCol('Base', (data['baseNotes'] as List? ?? []).cast<String>(), symbolColor),
            ])),
          const Spacer(),
          // 재료 점들
          Wrap(spacing: 6, children: ingredients.map((i) => Container(
            width: 7, height: 7, decoration: BoxDecoration(color: i.color.withOpacity(0.6), shape: BoxShape.circle))).toList()),
          const SizedBox(height: 6),
          Text('AION PARFUMS', style: TextStyle(fontSize: 8, letterSpacing: 5, color: Colors.brown.withOpacity(0.4))),
          const SizedBox(height: 12),
          Container(height: 2, decoration: BoxDecoration(gradient: LinearGradient(
            colors: [Colors.transparent, symbolColor.withOpacity(0.5), Colors.transparent]))),
        ]),
      ),
    );
  }

  Widget _noteCol(String label, List<String> items, Color color) => Expanded(
    child: Column(children: [
      Text(label, style: TextStyle(fontSize: 8, letterSpacing: 3, color: color, fontStyle: FontStyle.italic)),
      const SizedBox(height: 4),
      ...items.map((n) => Text(n, style: const TextStyle(fontSize: 9, color: _dark, height: 1.4))),
    ]));

  Color _hexColor(String hex) {
    try {
      final h = hex.startsWith('#') ? hex.substring(1) : hex;
      return Color(int.parse('FF$h', radix: 16));
    } catch (_) { return _gold; }
  }

  List<int> _colorToRgb(Color c) => [c.red, c.green, c.blue];
}

// ── 꽃잎 CustomPainter ────────────────────────────────────────
class _PetalPainter extends CustomPainter {
  final List<({String name, Color color, double ratio})> ingredients;
  final Color symbolColor;
  const _PetalPainter({required this.ingredients, required this.symbolColor});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2; final cy = size.height / 2;
    final n = ingredients.length; if (n == 0) return;
    final petalLen = size.width * (n <= 3 ? 0.38 : n <= 6 ? 0.35 : 0.30);
    final petalW = petalLen * (n <= 4 ? 0.52 : 0.44);
    final totalRatio = ingredients.fold<double>(0, (s, i) => s + i.ratio);
    final centerR = size.width * 0.12;

    // 꽃잎
    for (int i = 0; i < n; i++) {
      final ing = ingredients[i];
      final angle = (360 / n) * i - 90;
      final opacity = 0.3 + (ing.ratio / totalRatio) * 0.5;
      final paint = Paint()
        ..shader = ui.Gradient.radial(Offset(cx, cy), petalLen,
          [ing.color.withOpacity(0.9), ing.color.withOpacity(0.2)])
        ..style = PaintingStyle.fill;
      canvas.drawPath(_petalPath(cx, cy, petalLen, petalW, angle), Paint()
        ..color = ing.color.withOpacity(opacity)
        ..style = PaintingStyle.fill
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1.5));
      canvas.drawPath(_petalPath(cx, cy, petalLen, petalW, angle), Paint()
        ..color = ing.color.withOpacity(0.25)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.6);
    }

    // 중앙 오라
    final auraPaint = Paint()..shader = ui.Gradient.radial(
      Offset(cx, cy), centerR * 2.2,
      [symbolColor.withOpacity(0.45), Colors.transparent]);
    canvas.drawCircle(Offset(cx, cy), centerR * 2.2, auraPaint);
    // 중앙 원
    canvas.drawCircle(Offset(cx, cy), centerR, Paint()..color = symbolColor.withOpacity(0.82));
    canvas.drawCircle(Offset(cx, cy), centerR * 0.42, Paint()..color = Colors.white.withOpacity(0.55));
  }

  Path _petalPath(double cx, double cy, double len, double w, double angleDeg) {
    final rad = angleDeg * math.pi / 180;
    final cos = math.cos(rad); final sin = math.sin(rad);
    Offset rot(double x, double y) => Offset(cx + x * cos - y * sin, cy + x * sin + y * cos);
    final tip = rot(0, -len);
    final cl = rot(-w / 2, -len * 0.45);
    final cr = rot(w / 2, -len * 0.45);
    final o = Offset(cx, cy);
    return Path()
      ..moveTo(o.dx, o.dy)
      ..cubicTo(cl.dx, cl.dy, tip.dx, tip.dy, tip.dx, tip.dy)
      ..cubicTo(tip.dx, tip.dy, cr.dx, cr.dy, o.dx, o.dy)
      ..close();
  }

  @override bool shouldRepaint(covariant _PetalPainter o) =>
    o.ingredients != ingredients || o.symbolColor != symbolColor;
}