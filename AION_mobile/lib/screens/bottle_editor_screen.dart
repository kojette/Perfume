// ════════════════════════════════════════════════════════════════
// bottle_editor_screen.dart
//
// 공병 디자인 에디터 — CustomizationEditor.jsx(1714줄)의 모바일 포팅.
// 프론트와 달리 Flutter는 데스크톱/모바일 분기가 필요 없어 단일 레이아웃.
//
// 기능:
//  - 10가지 병 모양 (round/cylinder/square/flat/teardrop/hexagon/
//    artdeco/arch/dome/rectangle) — CustomPainter로 SVG 1:1 포팅
//  - 6개 탭: 공병 / 그림판 / 이미지 / 스티커 / 각인 / 저장
//  - 그림판 (펜/지우개 + 색상/굵기)
//  - 이미지/스티커 객체 드래그/리사이즈/삭제
//  - 가격 자동 계산: 공병 base + 프린팅(5,000) + 스티커(3,000×개수) + 각인(8,000)
//  - Supabase Stickers 테이블 + Admin 등록 공병 로드 (전역 캐시)
//  - /api/custom/bottles GET / /api/custom/designs POST·PUT
//  - 편집 모드: 라우트 arguments로 design 전달받음
//  - 미리보기 이미지 생성 → Base64 dataURL로 백엔드 전송
// ════════════════════════════════════════════════════════════════

import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/api_config.dart';

// ── 색상 팔레트 (다른 화면들과 통일) ─────────────────────────────
const _gold       = Color(0xFFC9A961);
const _goldDark   = Color(0xFFA08040);
const _dark       = Color(0xFF1A1A1A);
const _bg         = Color(0xFFFAF8F3);
const _grey       = Color(0xFF8B8278);
const _light      = Color(0xFFF0ECE4);
const _cream      = Color(0xFFE8E2D6);
const _bottleFill = Color(0xFFE8DCC8);

// ── 가격 ────────────────────────────────────────────────────────
const int _PRICE_PRINTING   = 5000;
const int _PRICE_STICKER    = 3000;
const int _PRICE_ENGRAVING  = 8000;

// ════════════════════════════════════════════════════════════════
// 모델
// ════════════════════════════════════════════════════════════════

class _Bottle {
  final String id;
  final String name;
  final String shape;
  final int basePrice;
  const _Bottle({
    required this.id,
    required this.name,
    required this.shape,
    required this.basePrice,
  });
}

const List<_Bottle> _DEFAULT_BOTTLES = [
  _Bottle(id: 'classic-round',  name: '클래식 라운드', shape: 'round',     basePrice: 15000),
  _Bottle(id: 'tall-cylinder',  name: '슬림 실린더',   shape: 'cylinder',  basePrice: 18000),
  _Bottle(id: 'square-bold',    name: '스퀘어 볼드',   shape: 'square',    basePrice: 16000),
  _Bottle(id: 'vintage-flat',   name: '빈티지 플랫',   shape: 'flat',      basePrice: 20000),
  _Bottle(id: 'teardrop',       name: '티어드롭',      shape: 'teardrop',  basePrice: 22000),
  _Bottle(id: 'hexagon',        name: '헥사곤',        shape: 'hexagon',   basePrice: 25000),
  _Bottle(id: 'art-deco',       name: '아르데코',      shape: 'artdeco',   basePrice: 28000),
  _Bottle(id: 'modern-arch',    name: '모던 아치',     shape: 'arch',      basePrice: 19000),
  _Bottle(id: 'dome',           name: '돔형',          shape: 'dome',      basePrice: 17000),
  _Bottle(id: 'rectangular',    name: '레트앵귤러',    shape: 'rectangle', basePrice: 14000),
];

/// 캔버스 위에 올라가는 객체 (이미지/스티커/이모지)
class _CanvasObject {
  final int id;
  final String type; // 'image' | 'sticker'
  final String? src;  // image URL / dataURL / file path
  final String? text; // 이모지/텍스트 스티커
  double x, y, w, h;
  _CanvasObject({
    required this.id,
    required this.type,
    this.src,
    this.text,
    required this.x,
    required this.y,
    required this.w,
    required this.h,
  });
}

/// 그림판 스트로크 한 획 (선분의 연속)
class _Stroke {
  final List<Offset> points;
  final Color color;
  final double width;
  final bool eraser;
  _Stroke({
    required this.points,
    required this.color,
    required this.width,
    required this.eraser,
  });
}

// ════════════════════════════════════════════════════════════════
// 스티커 전역 캐시 (CustomizationEditor.jsx의 _stickerCache 동일 역할)
// ════════════════════════════════════════════════════════════════
List<Map<String, dynamic>>? _stickerCache;
Future<List<Map<String, dynamic>>>? _stickerFetchFuture;

Future<List<Map<String, dynamic>>> _fetchStickersOnce() {
  if (_stickerCache != null) return Future.value(_stickerCache);
  _stickerFetchFuture ??= () async {
    try {
      final supa = Supabase.instance.client;
      final res = await supa
          .from('Stickers')
          .select('id, name, image_url, category, sort_order')
          .eq('is_active', true)
          .order('sort_order', ascending: true);
      _stickerCache = (res as List).cast<Map<String, dynamic>>();
      return _stickerCache!;
    } catch (e) {
      _stickerFetchFuture = null; // 다음 호출 때 재시도 가능하게
      rethrow;
    }
  }();
  return _stickerFetchFuture!;
}

// ════════════════════════════════════════════════════════════════
// 메인 위젯
// ════════════════════════════════════════════════════════════════

class BottleEditorScreen extends StatefulWidget {
  const BottleEditorScreen({super.key});

  @override
  State<BottleEditorScreen> createState() => _BottleEditorScreenState();
}

class _BottleEditorScreenState extends State<BottleEditorScreen> {
  // 캔버스 좌표계 (병 그리기 영역) — 프론트와 동일
  static const double W = 200;
  static const double H = 280;

  int _activeTab = 0; // 0=공병,1=그림판,2=이미지,3=스티커,4=각인,5=저장

  // 공병
  List<_Bottle> _adminBottles = [];
  late _Bottle _selectedBottle;
  Color _bottleColor = _bottleFill;

  // 그림판
  final List<_Stroke> _strokes = [];
  List<Offset> _currentStrokePoints = [];
  Color _penColor = _gold;
  double _penSize = 4;
  String _drawMode = 'pen'; // 'pen' | 'eraser'

  // 객체 (이미지/스티커)
  final List<_CanvasObject> _objects = [];
  int? _selectedObjId;

  // 각인
  bool _engravingEnabled = false;
  String _engravingText = '';
  final _engravingCtrl = TextEditingController();

  // 저장
  String _designName = '';
  final _designNameCtrl = TextEditingController();
  bool _saving = false;
  int? _editingDesignId; // 편집 모드일 때만 not-null

  // 스티커 로딩
  List<Map<String, dynamic>> _stickers = [];
  String _stickerLoadState = 'loading'; // loading | done | error

  // 미리보기 캡처용 RepaintBoundary 키
  final GlobalKey _previewKey = GlobalKey();

  bool _initialDataApplied = false;

  // ────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _selectedBottle = _DEFAULT_BOTTLES[0];
    _loadAdminBottles();
    _loadStickers();
  }

  @override
  void dispose() {
    _engravingCtrl.dispose();
    _designNameCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // 라우트 arguments로 design이 전달된 경우 편집 모드로 진입
    if (_initialDataApplied) return;
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map) {
      _applyInitialData(Map<String, dynamic>.from(args));
    }
    _initialDataApplied = true;
  }

  /// 편집 모드: 기존 design 데이터를 상태에 반영
  void _applyInitialData(Map<String, dynamic> d) {
    setState(() {
      _designName = (d['name'] ?? '').toString();
      _designNameCtrl.text = _designName;
      final colorStr = (d['bottleColor'] ?? '').toString();
      if (colorStr.startsWith('#') && colorStr.length == 7) {
        _bottleColor = Color(int.parse('FF${colorStr.substring(1)}', radix: 16));
      }
      final eng = d['engravingText'];
      if (eng is String && eng.isNotEmpty) {
        _engravingEnabled = true;
        _engravingText = eng;
        _engravingCtrl.text = eng;
      }
      // 병 매칭
      final key = (d['bottleKey'] ?? '').toString();
      if (key.isNotEmpty) {
        final all = [..._DEFAULT_BOTTLES, ..._adminBottles];
        final found = all.where((b) => b.id == key);
        if (found.isNotEmpty) _selectedBottle = found.first;
      }
      // objects 복원
      final objsJson = d['objectsJson'];
      if (objsJson is String && objsJson.isNotEmpty) {
        try {
          final list = jsonDecode(objsJson) as List;
          for (final o in list) {
            final m = o as Map<String, dynamic>;
            _objects.add(_CanvasObject(
              id: (m['id'] is int) ? m['id'] : DateTime.now().microsecondsSinceEpoch,
              type: (m['type'] ?? 'image').toString(),
              src: m['src']?.toString(),
              text: m['text']?.toString(),
              x: (m['x'] as num?)?.toDouble() ?? 60,
              y: (m['y'] as num?)?.toDouble() ?? 80,
              w: (m['w'] as num?)?.toDouble() ?? 80,
              h: (m['h'] as num?)?.toDouble() ?? 80,
            ));
          }
        } catch (e) {
          debugPrint('objectsJson 파싱 오류: $e');
        }
      }
      // designId — 백엔드가 PUT 사용
      final id = d['designId'];
      if (id is int) _editingDesignId = id;
      else if (id is String) _editingDesignId = int.tryParse(id);
    });
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  /// 관리자 등록 공병 로드 (없으면 기본만 사용)
  Future<void> _loadAdminBottles() async {
    final token = await _getToken();
    if (token == null || token.isEmpty) return;
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/bottles'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode != 200 || !mounted) return;
      final json = jsonDecode(utf8.decode(res.bodyBytes));
      final list = (json['data'] as List?) ?? const [];
      setState(() {
        _adminBottles = list.map<_Bottle>((b) {
          final m = b as Map<String, dynamic>;
          return _Bottle(
            id: 'admin-${m['bottleId']}',
            name: m['name']?.toString() ?? '',
            shape: m['shape']?.toString() ?? 'round',
            basePrice: (m['basePrice'] as num?)?.toInt() ?? 0,
          );
        }).toList();
      });
    } catch (e) {
      debugPrint('공병 목록 로드 오류: $e');
    }
  }

  Future<void> _loadStickers() async {
    if (_stickerCache != null) {
      setState(() {
        _stickers = _stickerCache!;
        _stickerLoadState = 'done';
      });
      return;
    }
    try {
      final data = await _fetchStickersOnce();
      if (!mounted) return;
      setState(() {
        _stickers = data;
        _stickerLoadState = 'done';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _stickerLoadState = 'error');
    }
  }

  // ────────────────────────────────────────────────────────────
  // 가격 계산
  // ────────────────────────────────────────────────────────────

  Map<String, int> get _prices {
    final hasImage = _objects.any((o) => o.type == 'image');
    final stickerCount = _objects.where((o) => o.type == 'sticker').length;
    final hasDrawing = _strokes.isNotEmpty;
    // 프린팅: 이미지가 있거나 그림이 있으면 부과 (중복 부과 안 함)
    final printingPrice = (hasImage || hasDrawing) ? _PRICE_PRINTING : 0;
    final stickerPrice = stickerCount * _PRICE_STICKER;
    final engravingPrice = (_engravingEnabled && _engravingText.isNotEmpty) ? _PRICE_ENGRAVING : 0;
    final bottlePrice = _selectedBottle.basePrice;
    final total = bottlePrice + printingPrice + stickerPrice + engravingPrice;
    return {
      'bottle': bottlePrice,
      'printing': printingPrice,
      'sticker': stickerPrice,
      'engraving': engravingPrice,
      'stickerCount': stickerCount,
      'total': total,
    };
  }

  // ────────────────────────────────────────────────────────────
  // 객체 조작
  // ────────────────────────────────────────────────────────────

  void _addEmojiSticker(String emoji) {
    setState(() {
      _objects.add(_CanvasObject(
        id: DateTime.now().microsecondsSinceEpoch,
        type: 'sticker', text: emoji,
        x: 80, y: 100, w: 60, h: 60,
      ));
      _selectedObjId = _objects.last.id;
    });
  }

  void _addImageSticker(String url) {
    setState(() {
      _objects.add(_CanvasObject(
        id: DateTime.now().microsecondsSinceEpoch,
        type: 'image', src: url,
        x: 70, y: 90, w: 80, h: 80,
      ));
      _selectedObjId = _objects.last.id;
    });
  }

  Future<void> _pickImageForCanvas() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked == null || !mounted) return;
    final bytes = await picked.readAsBytes();
    final dataUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
    setState(() {
      _objects.add(_CanvasObject(
        id: DateTime.now().microsecondsSinceEpoch,
        type: 'image', src: dataUrl,
        x: 60, y: 80, w: 120, h: 120,
      ));
      _selectedObjId = _objects.last.id;
      _activeTab = 0; // 미리보기 탭으로
    });
  }

  void _resizeObject(int id, double delta) {
    setState(() {
      final idx = _objects.indexWhere((o) => o.id == id);
      if (idx < 0) return;
      final o = _objects[idx];
      o.w = (o.w + delta).clamp(30, W);
      o.h = (o.h + delta).clamp(30, H);
    });
  }

  void _deleteObject(int id) {
    setState(() {
      _objects.removeWhere((o) => o.id == id);
      if (_selectedObjId == id) _selectedObjId = null;
    });
  }

  void _clearDrawing() {
    setState(() {
      _strokes.clear();
      _currentStrokePoints.clear();
    });
  }

  // ────────────────────────────────────────────────────────────
  // 미리보기 이미지 생성 — RepaintBoundary로 캡처 → JPEG Base64 dataURL
  // (jsx의 generatePreviewImage와 동일 역할, 백엔드 전송용)
  // ────────────────────────────────────────────────────────────
  Future<String?> _capturePreview() async {
    try {
      final boundary = _previewKey.currentContext
          ?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return null;
      final image = await boundary.toImage(pixelRatio: 1.5);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return null;
      final bytes = byteData.buffer.asUint8List();
      // 너무 크면 백엔드에서 거절될 수 있음 (jsx와 동일 제한)
      if (bytes.length > 400000) {
        // PNG 그대로는 무거움 — 그래도 시도. 실제로 추가 압축이 필요하면 image 패키지 도입 필요
        return null;
      }
      return 'data:image/png;base64,${base64Encode(bytes)}';
    } catch (e) {
      debugPrint('미리보기 캡처 오류: $e');
      return null;
    }
  }

  // ────────────────────────────────────────────────────────────
  // 디자인 저장 — POST(신규) / PUT(편집)
  // ────────────────────────────────────────────────────────────
  Future<void> _saveDesign() async {
    if (_designName.trim().isEmpty) {
      _snack('디자인 이름을 입력해주세요'); return;
    }
    final token = await _getToken();
    if (token == null || token.isEmpty) {
      _snack('로그인이 필요합니다');
      if (mounted) Navigator.pushNamed(context, '/login');
      return;
    }
    setState(() => _saving = true);
    try {
      final preview = await _capturePreview();
      final p = _prices;
      final body = jsonEncode({
        'name': _designName.trim(),
        'bottleKey': _selectedBottle.id,
        'bottleColor': '#${_bottleColor.value.toRadixString(16).padLeft(8, '0').substring(2)}',
        'engravingText': (_engravingEnabled && _engravingText.isNotEmpty) ? _engravingText : null,
        'objectsJson': jsonEncode(_objects.map((o) => {
          'id': o.id, 'type': o.type, 'src': o.src, 'text': o.text,
          'x': o.x, 'y': o.y, 'w': o.w, 'h': o.h,
        }).toList()),
        'previewImageUrl': preview,
        'bottlePrice': p['bottle'],
        'printingPrice': p['printing'],
        'stickerPrice': p['sticker'],
        'engravingPrice': p['engraving'],
        'totalPrice': p['total'],
      });
      final isEdit = _editingDesignId != null;
      final uri = isEdit
          ? Uri.parse('${ApiConfig.baseUrl}/api/custom/designs/$_editingDesignId')
          : Uri.parse('${ApiConfig.baseUrl}/api/custom/designs');
      final res = isEdit
          ? await http.put(uri,
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json; charset=utf-8',
              }, body: body)
          : await http.post(uri,
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json; charset=utf-8',
              }, body: body);
      if (!mounted) return;
      if (res.statusCode == 200 || res.statusCode == 201) {
        _snack('디자인이 저장되었습니다!');
        await Future.delayed(const Duration(milliseconds: 600));
        if (mounted) Navigator.pop(context, true);
      } else {
        String msg = '저장에 실패했습니다';
        try {
          final body = jsonDecode(utf8.decode(res.bodyBytes));
          if (body is Map && body['message'] is String) msg = body['message'];
        } catch (_) {}
        _snack(msg, isError: true);
      }
    } catch (e) {
      debugPrint('저장 오류: $e');
      if (mounted) _snack('저장 중 오류가 발생했습니다', isError: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _snack(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? Colors.red : _dark,
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 2),
    ));
  }

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    final p = _prices;
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(children: [
          _buildHeader(),
          _buildTabBar(),
          // 미리보기 — 항상 상단에 고정
          _buildPreviewPanel(p),
          // 탭 컨텐츠
          Expanded(child: _buildTabContent()),
          // 하단 가격 바
          _buildPriceBar(p),
        ]),
      ),
    );
  }

  Widget _buildHeader() => Container(
    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
    decoration: const BoxDecoration(
      color: Colors.white,
      border: Border(bottom: BorderSide(color: _cream)),
    ),
    child: Row(children: [
      GestureDetector(
        onTap: () => Navigator.pop(context),
        child: const Icon(Icons.close, color: _grey, size: 22),
      ),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('DESIGN STUDIO',
            style: TextStyle(fontSize: 8, letterSpacing: 4, color: _gold, fontStyle: FontStyle.italic)),
        const SizedBox(height: 2),
        Text(_editingDesignId != null ? 'EDIT DESIGN' : 'CUSTOMIZING',
            style: const TextStyle(fontSize: 14, letterSpacing: 4, color: _dark)),
      ]),
    ]),
  );

  Widget _buildTabBar() {
    final tabs = [
      ['공병', Icons.local_drink_outlined],
      ['그림판', Icons.brush_outlined],
      ['이미지', Icons.image_outlined],
      ['스티커', Icons.emoji_emotions_outlined],
      ['각인', Icons.text_fields_outlined],
      ['저장', Icons.save_outlined],
    ];
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: _cream)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: List.generate(tabs.length, (i) {
          final active = _activeTab == i;
          return GestureDetector(
            onTap: () => setState(() => _activeTab = i),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: active ? _gold : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              child: Row(children: [
                Icon(tabs[i][1] as IconData, size: 14,
                    color: active ? _gold : _grey),
                const SizedBox(width: 5),
                Text(tabs[i][0] as String,
                    style: TextStyle(
                      fontSize: 11, letterSpacing: 1.5,
                      color: active ? _gold : _grey,
                    )),
              ]),
            ),
          );
        })),
      ),
    );
  }

  // ── 병 미리보기 (200×280, RepaintBoundary로 감싸 캡처 가능) ──
  Widget _buildPreviewPanel(Map<String, int> p) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(
        color: _light,
        border: Border(bottom: BorderSide(color: _cream)),
      ),
      child: Column(children: [
        RepaintBoundary(
          key: _previewKey,
          child: Container(
            width: W, height: H,
            color: _light,
            child: Stack(children: [
              // 병 본체
              Positioned.fill(
                child: CustomPaint(
                  painter: _BottlePainter(
                    shape: _selectedBottle.shape,
                    fillColor: _bottleColor,
                  ),
                ),
              ),
              // 그림판 스트로크 — 병 영역 클리핑
              Positioned.fill(
                child: ClipPath(
                  clipper: _BottleBodyClipper(_selectedBottle.shape),
                  child: CustomPaint(
                    painter: _StrokesPainter(_strokes, _currentStrokePoints, _penColor, _penSize, _drawMode),
                  ),
                ),
              ),
              // 객체 (이미지/스티커) — 병 영역 클리핑
              Positioned.fill(
                child: ClipPath(
                  clipper: _BottleBodyClipper(_selectedBottle.shape),
                  child: Stack(
                    children: _objects.map((o) {
                      final isSelected = _selectedObjId == o.id;
                      return Positioned(
                        left: o.x, top: o.y,
                        width: o.w, height: o.h,
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedObjId = o.id),
                          onPanUpdate: (d) => setState(() {
                            o.x = (o.x + d.delta.dx).clamp(-20.0, W - 10);
                            o.y = (o.y + d.delta.dy).clamp(-20.0, H - 10);
                          }),
                          child: Container(
                            decoration: BoxDecoration(
                              border: isSelected
                                  ? Border.all(color: _gold, width: 1.2, style: BorderStyle.solid)
                                  : null,
                            ),
                            child: o.type == 'image' && o.src != null
                                ? _buildObjectImage(o.src!)
                                : Center(
                                    child: Text(
                                      o.text ?? '',
                                      style: TextStyle(fontSize: o.w * 0.7, height: 1),
                                    ),
                                  ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              // 각인 텍스트
              if (_engravingEnabled && _engravingText.isNotEmpty)
                Positioned(
                  left: 0, right: 0, bottom: 36,
                  child: Center(
                    child: Text(
                      _engravingText,
                      style: const TextStyle(
                        fontSize: 11, color: _goldDark,
                        fontStyle: FontStyle.italic, letterSpacing: 2,
                      ),
                    ),
                  ),
                ),
              // 그림판 탭일 때만 — 병 위에 직접 그리기 GestureDetector
              if (_activeTab == 1)
                Positioned.fill(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onPanStart: (d) {
                      setState(() {
                        _currentStrokePoints = [d.localPosition];
                      });
                    },
                    onPanUpdate: (d) {
                      setState(() {
                        _currentStrokePoints = [..._currentStrokePoints, d.localPosition];
                      });
                    },
                    onPanEnd: (_) {
                      if (_currentStrokePoints.length < 2) {
                        setState(() => _currentStrokePoints = []);
                        return;
                      }
                      setState(() {
                        _strokes.add(_Stroke(
                          points: List.from(_currentStrokePoints),
                          color: _penColor,
                          width: _penSize,
                          eraser: _drawMode == 'eraser',
                        ));
                        _currentStrokePoints = [];
                      });
                    },
                  ),
                ),
              // 선택된 객체 컨트롤 버튼 (스티커/이미지 탭에서만)
              if (_selectedObjId != null && (_activeTab == 2 || _activeTab == 3))
                ..._buildSelectedObjectControls(),
            ]),
          ),
        ),
        const SizedBox(height: 8),
        Text(_selectedBottle.name,
            style: const TextStyle(fontSize: 11, letterSpacing: 2, color: _grey)),
        Text('₩${_fmt(_selectedBottle.basePrice)}',
            style: const TextStyle(fontSize: 10, color: _gold)),
      ]),
    );
  }

  // 선택된 객체 위에 표시할 X / + / - 버튼 3개
  List<Widget> _buildSelectedObjectControls() {
    final obj = _objects.firstWhere(
      (o) => o.id == _selectedObjId,
      orElse: () => _CanvasObject(id: -1, type: 'sticker', x: 0, y: 0, w: 0, h: 0),
    );
    if (obj.id == -1) return const [];
    return [
      // 삭제 (오른쪽 위)
      Positioned(
        left: obj.x + obj.w - 12, top: obj.y - 12,
        child: GestureDetector(
          onTap: () => _deleteObject(obj.id),
          child: Container(
            width: 22, height: 22,
            decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
            child: const Icon(Icons.close, size: 14, color: Colors.white),
          ),
        ),
      ),
      // 확대 (오른쪽 아래)
      Positioned(
        left: obj.x + obj.w - 12, top: obj.y + obj.h - 12,
        child: GestureDetector(
          onTap: () => _resizeObject(obj.id, 12),
          child: Container(
            width: 22, height: 22,
            decoration: const BoxDecoration(color: _gold, shape: BoxShape.circle),
            child: const Icon(Icons.add, size: 14, color: Colors.white),
          ),
        ),
      ),
      // 축소 (왼쪽 아래)
      Positioned(
        left: obj.x - 10, top: obj.y + obj.h - 12,
        child: GestureDetector(
          onTap: () => _resizeObject(obj.id, -12),
          child: Container(
            width: 22, height: 22,
            decoration: const BoxDecoration(color: _grey, shape: BoxShape.circle),
            child: const Icon(Icons.remove, size: 14, color: Colors.white),
          ),
        ),
      ),
    ];
  }

  Widget _buildObjectImage(String src) {
    if (src.startsWith('data:image')) {
      try {
        final base64Str = src.split(',').last;
        return Image.memory(base64Decode(base64Str), fit: BoxFit.contain);
      } catch (_) {
        return const SizedBox();
      }
    }
    if (!kIsWeb && (src.startsWith('/') || src.contains(Platform.pathSeparator))) {
      try { return Image.file(File(src), fit: BoxFit.contain); }
      catch (_) { return const SizedBox(); }
    }
    return Image.network(src,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => const SizedBox());
  }

  // ── 탭 컨텐츠 분기 ────────────────────────────────────────
  Widget _buildTabContent() {
    switch (_activeTab) {
      case 0: return _buildBottleTab();
      case 1: return _buildDrawTab();
      case 2: return _buildImageTab();
      case 3: return _buildStickerTab();
      case 4: return _buildEngravingTab();
      case 5: return _buildSaveTab();
      default: return _buildBottleTab();
    }
  }

  // ── 공병 선택 탭 ──────────────────────────────────────────
  Widget _buildBottleTab() {
    final all = [..._DEFAULT_BOTTLES, ..._adminBottles];
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('공병 디자인 선택',
            style: TextStyle(fontSize: 11, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            childAspectRatio: 0.65,
            crossAxisSpacing: 10, mainAxisSpacing: 10,
          ),
          itemCount: all.length,
          itemBuilder: (_, i) {
            final b = all[i];
            final selected = b.id == _selectedBottle.id;
            return GestureDetector(
              onTap: () => setState(() => _selectedBottle = b),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: selected ? _gold.withOpacity(0.05) : Colors.white,
                  border: Border.all(
                    color: selected ? _gold : _gold.withOpacity(0.2),
                    width: selected ? 1.5 : 1,
                  ),
                ),
                child: Column(children: [
                  Expanded(
                    child: CustomPaint(
                      painter: _BottlePainter(shape: b.shape, fillColor: _bottleColor),
                      size: const Size(double.infinity, double.infinity),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(b.name,
                      style: const TextStyle(fontSize: 10, color: _dark),
                      overflow: TextOverflow.ellipsis),
                  Text('₩${_fmt(b.basePrice)}',
                      style: const TextStyle(fontSize: 9, color: _gold)),
                ]),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _cream),
          ),
          child: Row(children: [
            const Text('병 색상',
                style: TextStyle(fontSize: 11, letterSpacing: 2, color: _grey)),
            const Spacer(),
            ..._presetColors.map((c) {
              final sel = _bottleColor.value == c.value;
              return GestureDetector(
                onTap: () => setState(() => _bottleColor = c),
                child: Container(
                  margin: const EdgeInsets.only(left: 6),
                  width: 26, height: 26,
                  decoration: BoxDecoration(
                    color: c, shape: BoxShape.circle,
                    border: Border.all(
                      color: sel ? _gold : Colors.black.withOpacity(0.1),
                      width: sel ? 2 : 1,
                    ),
                  ),
                ),
              );
            }),
          ]),
        ),
      ]),
    );
  }

  static const List<Color> _presetColors = [
    _bottleFill, // 베이지
    Color(0xFFFFFFFF), Color(0xFF1A1A1A), Color(0xFFC9A961),
    Color(0xFF7BA8D4), Color(0xFFD47B7B), Color(0xFF2A6049),
  ];

  // ── 그림판 탭 ────────────────────────────────────────────
  Widget _buildDrawTab() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('GUIDE',
          style: TextStyle(fontSize: 9, letterSpacing: 3, color: _gold)),
      const SizedBox(height: 4),
      const Text('병 미리보기 위에 직접 그릴 수 있습니다',
          style: TextStyle(fontSize: 11, color: _grey, fontStyle: FontStyle.italic)),
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
        child: Column(children: [
          Row(children: [
            _modeBtn('pen', Icons.edit_outlined, '펜'),
            const SizedBox(width: 8),
            _modeBtn('eraser', Icons.format_color_reset_outlined, '지우개'),
            const Spacer(),
            GestureDetector(
              onTap: _clearDrawing,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(border: Border.all(color: Colors.red.shade200)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.refresh, size: 12, color: Colors.red.shade400),
                  const SizedBox(width: 4),
                  Text('전체 지우기',
                      style: TextStyle(fontSize: 11, color: Colors.red.shade400)),
                ]),
              ),
            ),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            const Text('굵기',
                style: TextStyle(fontSize: 11, color: _grey)),
            const SizedBox(width: 8),
            Expanded(
              child: SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: _gold, thumbColor: _gold, trackHeight: 3,
                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                ),
                child: Slider(
                  min: 1, max: 20, divisions: 19, value: _penSize,
                  onChanged: (v) => setState(() => _penSize = v),
                ),
              ),
            ),
            Text('${_penSize.round()}px',
                style: const TextStyle(fontSize: 11, color: _gold)),
          ]),
          const SizedBox(height: 8),
          const Text('빠른 색상',
              style: TextStyle(fontSize: 10, color: _grey)),
          const SizedBox(height: 6),
          Wrap(spacing: 6, runSpacing: 6,
            children: const [
              Color(0xFFC9A961), Color(0xFF1A1A1A), Color(0xFFFFFFFF),
              Color(0xFF8B8278), Color(0xFFFF6B6B), Color(0xFF74B9FF),
              Color(0xFF55EFC4), Color(0xFFFD79A8), Color(0xFFA29BFE),
            ].map((c) {
              final sel = _penColor.value == c.value && _drawMode == 'pen';
              return GestureDetector(
                onTap: () => setState(() {
                  _penColor = c; _drawMode = 'pen';
                }),
                child: Container(
                  width: 26, height: 26,
                  decoration: BoxDecoration(
                    color: c, shape: BoxShape.circle,
                    border: Border.all(
                      color: sel ? _gold : Colors.black.withOpacity(0.1),
                      width: sel ? 2 : 1,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ]),
      ),
    ]),
  );

  Widget _modeBtn(String mode, IconData icon, String label) {
    final active = _drawMode == mode;
    return GestureDetector(
      onTap: () => setState(() => _drawMode = mode),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? _dark : Colors.white,
          border: Border.all(color: active ? _dark : _cream),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 13, color: active ? _gold : _grey),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(fontSize: 11, color: active ? _gold : _grey)),
        ]),
      ),
    );
  }

  // ── 이미지 탭 ─────────────────────────────────────────────
  Widget _buildImageTab() {
    final images = _objects.where((o) => o.type == 'image').toList();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('이미지 업로드',
            style: TextStyle(fontSize: 11, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 4),
        const Text('병 윤곽 외 부분은 잘립니다',
            style: TextStyle(fontSize: 10, color: Colors.redAccent, fontStyle: FontStyle.italic)),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _pickImageForCanvas,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 30),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(
                color: _gold.withOpacity(0.4), width: 1.5,
                style: BorderStyle.solid,
              ),
            ),
            child: const Column(children: [
              Icon(Icons.cloud_upload_outlined, color: _gold, size: 36),
              SizedBox(height: 8),
              Text('이미지 선택',
                  style: TextStyle(fontSize: 11, letterSpacing: 2, color: _grey)),
              SizedBox(height: 2),
              Text('PNG, JPG, WEBP',
                  style: TextStyle(fontSize: 9, color: _gold, fontStyle: FontStyle.italic)),
            ]),
          ),
        ),
        if (images.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('업로드된 이미지',
              style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 2)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: images.map((o) {
            final selected = _selectedObjId == o.id;
            return Stack(children: [
              GestureDetector(
                onTap: () => setState(() => _selectedObjId = o.id),
                child: Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    border: Border.all(color: selected ? _gold : _cream, width: selected ? 2 : 1),
                  ),
                  child: o.src != null ? _buildObjectImage(o.src!) : const SizedBox(),
                ),
              ),
              Positioned(
                top: 0, right: 0,
                child: GestureDetector(
                  onTap: () => _deleteObject(o.id),
                  child: Container(
                    width: 16, height: 16,
                    color: Colors.redAccent,
                    child: const Icon(Icons.close, size: 11, color: Colors.white),
                  ),
                ),
              ),
            ]);
          }).toList()),
        ],
      ]),
    );
  }

  // ── 스티커 탭 ─────────────────────────────────────────────
  Widget _buildStickerTab() {
    // 카테고리별 그룹핑
    final Map<String, List<Map<String, dynamic>>> grouped = {};
    for (final s in _stickers) {
      final cat = (s['category'] ?? '기타').toString();
      grouped.putIfAbsent(cat, () => []).add(s);
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('스티커',
            style: TextStyle(fontSize: 11, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 12),

        // 기본 이모지 스티커 (오프라인에도 사용 가능)
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('✦ 기본 스티커',
                style: TextStyle(fontSize: 10, letterSpacing: 2, color: _gold)),
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 6,
              children: ['✿', '★', '♥', '♣', '♠', '♦', '☀', '☾', '✦', '✧',
                         '🌹', '🌸', '🍃', '🌿', '🌙', '⭐', '💫', '✨', '🦋', '🌷']
                  .map((emoji) => GestureDetector(
                onTap: () => _addEmojiSticker(emoji),
                child: Container(
                  width: 38, height: 38,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(border: Border.all(color: _cream)),
                  child: Text(emoji, style: const TextStyle(fontSize: 20)),
                ),
              )).toList(),
            ),
          ]),
        ),
        const SizedBox(height: 12),

        // DB 스티커
        if (_stickerLoadState == 'loading')
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: Text('스티커 로딩 중...',
                style: TextStyle(fontSize: 10, color: _grey, fontStyle: FontStyle.italic))),
          ),
        if (_stickerLoadState == 'error')
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text('스티커를 불러오지 못했습니다',
                style: TextStyle(fontSize: 10, color: Colors.redAccent)),
          ),
        if (_stickerLoadState == 'done' && _stickers.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text('등록된 스티커가 없습니다',
                style: TextStyle(fontSize: 10, color: _grey, fontStyle: FontStyle.italic)),
          ),
        ...grouped.entries.map((e) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(e.key,
                style: const TextStyle(fontSize: 10, letterSpacing: 2, color: _gold)),
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 6,
              children: e.value.map((s) {
                final url = s['image_url']?.toString() ?? '';
                return GestureDetector(
                  onTap: () => _addImageSticker(url),
                  child: Container(
                    width: 50, height: 50,
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(border: Border.all(color: _cream)),
                    child: Image.network(url, fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, size: 18, color: _grey)),
                  ),
                );
              }).toList(),
            ),
          ]),
        )),
      ]),
    );
  }

  // ── 각인 탭 ────────────────────────────────────────────────
  Widget _buildEngravingTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('각인 (Engraving)',
            style: TextStyle(fontSize: 11, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
          child: Column(children: [
            Row(children: [
              SizedBox(
                width: 22, height: 22,
                child: Checkbox(
                  value: _engravingEnabled,
                  activeColor: _gold,
                  onChanged: (v) => setState(() => _engravingEnabled = v ?? false),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '각인 추가하기 (+₩${_fmt(_PRICE_ENGRAVING)})',
                  style: const TextStyle(fontSize: 12, color: _dark, letterSpacing: 1),
                ),
              ),
            ]),
            if (_engravingEnabled) ...[
              const SizedBox(height: 14),
              TextField(
                controller: _engravingCtrl,
                maxLength: 20,
                onChanged: (v) => setState(() => _engravingText = v),
                decoration: const InputDecoration(
                  hintText: '예: My Signature...',
                  hintStyle: TextStyle(fontSize: 12, color: _grey),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: _cream),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: _gold),
                  ),
                ),
              ),
            ],
          ]),
        ),
      ]),
    );
  }

  // ── 저장 탭 ────────────────────────────────────────────────
  Widget _buildSaveTab() {
    final p = _prices;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('저장 및 가격',
            style: TextStyle(fontSize: 11, letterSpacing: 3, color: _grey)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('디자인 이름 *',
                style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 1)),
            const SizedBox(height: 6),
            TextField(
              controller: _designNameCtrl,
              onChanged: (v) => _designName = v,
              decoration: const InputDecoration(
                hintText: '나만의 디자인 이름',
                hintStyle: TextStyle(fontSize: 12, color: _grey),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _cream)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _gold)),
              ),
            ),
            const SizedBox(height: 18),
            const Text('가격 내역',
                style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 2)),
            const SizedBox(height: 8),
            _priceRow('공병 (${_selectedBottle.name})', p['bottle']!),
            if ((p['printing'] ?? 0) > 0) _priceRow('이미지/프린팅', p['printing']!),
            if ((p['sticker']  ?? 0) > 0) _priceRow('스티커 (${p['stickerCount']}개)', p['sticker']!),
            if ((p['engraving']?? 0) > 0) _priceRow('각인', p['engraving']!),
            const Divider(color: _cream, height: 24),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Total',
                  style: TextStyle(fontSize: 13, color: _gold, fontStyle: FontStyle.italic)),
              Text('₩${_fmt(p['total']!)}',
                  style: const TextStyle(fontSize: 18, color: _dark, fontWeight: FontWeight.bold)),
            ]),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _saving ? null : _saveDesign,
                icon: _saving
                    ? const SizedBox(width: 14, height: 14,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5))
                    : const Icon(Icons.save_outlined, size: 16, color: Colors.white),
                label: Text(
                  _saving
                      ? '저장 중...'
                      : (_editingDesignId != null ? 'UPDATE DESIGN' : 'SAVE DESIGN'),
                  style: const TextStyle(fontSize: 11, letterSpacing: 3, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _dark,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const RoundedRectangleBorder(),
                  disabledBackgroundColor: _grey,
                ),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _priceRow(String label, int v) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(fontSize: 11, color: _dark)),
      Text('₩${_fmt(v)}', style: const TextStyle(fontSize: 11, color: _dark)),
    ]),
  );

  // ── 하단 가격 바 ──────────────────────────────────────────
  Widget _buildPriceBar(Map<String, int> p) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
    decoration: const BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: _cream)),
    ),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      const Text('현재 예상 금액',
          style: TextStyle(fontSize: 11, color: _grey, letterSpacing: 2)),
      Text('₩${_fmt(p['total']!)}',
          style: const TextStyle(fontSize: 14, color: _gold, fontWeight: FontWeight.bold)),
    ]),
  );

  static String _fmt(int n) => n.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}

// ════════════════════════════════════════════════════════════════
// CustomPainter — 10가지 병 모양
// CustomizationEditor.jsx의 BottleSVG 컴포넌트와 좌표/구조 1:1 매칭
// ════════════════════════════════════════════════════════════════

class _BottlePainter extends CustomPainter {
  final String shape;
  final Color fillColor;
  final Color strokeColor;
  static const double _refW = 200;
  static const double _refH = 280;

  _BottlePainter({
    required this.shape,
    required this.fillColor,
    this.strokeColor = _gold,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / _refW;
    final sy = size.height / _refH;
    canvas.save();
    canvas.scale(sx, sy);

    final fill = Paint()..color = fillColor..style = PaintingStyle.fill;
    final stroke = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final cap = Paint()..color = _goldDark..style = PaintingStyle.fill;
    final capStroke = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final highlight = Paint()..color = Colors.white.withOpacity(0.18);

    // 모든 병의 cx 중심
    const cx = _refW / 2;

    // 모양별 본체 path
    final bodyPath = _bodyPathForShape(shape, cx);

    // 1) 캡과 넥 (모양별로 약간씩 다름)
    final capRects = _capForShape(shape, cx);
    for (final r in capRects.necks) {
      canvas.drawRRect(r, fill);
      canvas.drawRRect(r, capStroke);
    }
    for (final r in capRects.caps) {
      canvas.drawRRect(r, cap);
      canvas.drawRRect(r, capStroke);
    }

    // 2) 본체
    canvas.drawPath(bodyPath, fill);
    canvas.drawPath(bodyPath, stroke);

    // 3) 하이라이트(빛 반사)
    final hl = _highlightForShape(shape, cx);
    if (hl != null) canvas.drawPath(hl, highlight);

    canvas.restore();
  }

  /// 본체 path (200×280 좌표계)
  static Path _bodyPathForShape(String shape, double cx) {
    final p = Path();
    switch (shape) {
      case 'round':
        p.addOval(Rect.fromCenter(center: Offset(cx, 185), width: 136, height: 210));
        break;
      case 'cylinder':
        p.addRRect(RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 50, 66, 100, 190),
          const Radius.circular(20),
        ));
        break;
      case 'square':
        p.addRRect(RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 60, 60, 120, 190),
          const Radius.circular(8),
        ));
        break;
      case 'flat':
        p.addRRect(RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 70, 62, 140, 170),
          const Radius.circular(6),
        ));
        break;
      case 'teardrop':
        p.moveTo(cx, 62);
        p.cubicTo(cx + 70, 80, cx + 80, 180, cx, 260);
        p.cubicTo(cx - 80, 180, cx - 70, 80, cx, 62);
        p.close();
        break;
      case 'hexagon':
        p.moveTo(cx, 62);
        p.lineTo(cx + 62, 95);
        p.lineTo(cx + 62, 195);
        p.lineTo(cx, 228);
        p.lineTo(cx - 62, 195);
        p.lineTo(cx - 62, 95);
        p.close();
        break;
      case 'artdeco':
        p.moveTo(cx - 30, 58);
        p.lineTo(cx + 30, 58);
        p.lineTo(cx + 55, 110);
        p.lineTo(cx + 55, 250);
        p.lineTo(cx - 55, 250);
        p.lineTo(cx - 55, 110);
        p.close();
        break;
      case 'arch':
        p.moveTo(cx - 58, 260);
        p.lineTo(cx - 58, 130);
        p.quadraticBezierTo(cx - 58, 58, cx, 58);
        p.quadraticBezierTo(cx + 58, 58, cx + 58, 130);
        p.lineTo(cx + 58, 260);
        p.close();
        break;
      case 'dome':
        p.moveTo(cx - 65, 260);
        p.lineTo(cx - 65, 175);
        p.quadraticBezierTo(cx - 65, 60, cx, 60);
        p.quadraticBezierTo(cx + 65, 60, cx + 65, 175);
        p.lineTo(cx + 65, 260);
        p.close();
        break;
      case 'rectangle':
        p.addRRect(RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 55, 58, 110, 200),
          const Radius.circular(4),
        ));
        break;
      default:
        p.addOval(Rect.fromCenter(center: Offset(cx, 185), width: 136, height: 210));
    }
    return p;
  }

  /// 캡(뚜껑) + 넥(목) RRect 배열
  static _CapRects _capForShape(String shape, double cx) {
    // 기본값
    RRect neck = RRect.fromRectAndRadius(
      Rect.fromLTWH(cx - 18, 30, 36, 40), const Radius.circular(8));
    RRect cap = RRect.fromRectAndRadius(
      Rect.fromLTWH(cx - 22, 18, 44, 20), const Radius.circular(5));
    switch (shape) {
      case 'cylinder':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 12, 28, 24, 38), const Radius.circular(5));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 16, 16, 32, 18), const Radius.circular(4));
        break;
      case 'square':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 14, 24, 28, 36), const Radius.circular(4));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 20, 14, 40, 16), const Radius.circular(3));
        break;
      case 'flat':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 10, 30, 20, 32), const Radius.circular(4));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 18, 20, 36, 16), const Radius.circular(3));
        break;
      case 'teardrop':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 12, 26, 24, 36), const Radius.circular(6));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 18, 14, 36, 18), const Radius.circular(5));
        break;
      case 'hexagon':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 12, 26, 24, 34), const Radius.circular(5));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 18, 14, 36, 18), const Radius.circular(4));
        break;
      case 'artdeco':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 10, 22, 20, 36), const Radius.circular(3));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 22, 12, 44, 16), const Radius.circular(2));
        break;
      case 'arch':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 11, 26, 22, 32), const Radius.circular(5));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 18, 16, 36, 16), const Radius.circular(4));
        break;
      case 'dome':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 13, 28, 26, 32), const Radius.circular(5));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 19, 18, 38, 16), const Radius.circular(4));
        break;
      case 'rectangle':
        neck = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 11, 26, 22, 32), const Radius.circular(3));
        cap = RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 20, 16, 40, 16), const Radius.circular(2));
        break;
    }
    return _CapRects(necks: [neck], caps: [cap]);
  }

  static Path? _highlightForShape(String shape, double cx) {
    final p = Path();
    switch (shape) {
      case 'round':
        p.addOval(Rect.fromCenter(center: Offset(cx - 22, 140), width: 24, height: 56));
        return p;
      case 'cylinder':
        p.addRRect(RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 35, 80, 18, 160), const Radius.circular(8)));
        return p;
      case 'square':
        p.addRect(Rect.fromLTWH(cx - 48, 74, 20, 160));
        return p;
      case 'flat':
        p.addRect(Rect.fromLTWH(cx - 58, 75, 14, 144));
        return p;
      case 'teardrop':
        p.addOval(Rect.fromCenter(center: Offset(cx - 20, 150), width: 20, height: 70));
        return p;
      case 'arch':
        p.addRRect(RRect.fromRectAndRadius(
          Rect.fromLTWH(cx - 44, 80, 14, 170), const Radius.circular(5)));
        return p;
      case 'dome':
        p.addOval(Rect.fromCenter(center: Offset(cx - 25, 160), width: 22, height: 84));
        return p;
      default:
        return null;
    }
  }

  @override
  bool shouldRepaint(covariant _BottlePainter old) =>
      old.shape != shape || old.fillColor != fillColor;
}

class _CapRects {
  final List<RRect> necks;
  final List<RRect> caps;
  _CapRects({required this.necks, required this.caps});
}

// ════════════════════════════════════════════════════════════════
// Clipper — 본체 영역만 그림/객체가 보이도록 클리핑
// ════════════════════════════════════════════════════════════════

class _BottleBodyClipper extends CustomClipper<Path> {
  final String shape;
  _BottleBodyClipper(this.shape);

  @override
  Path getClip(Size size) {
    final sx = size.width / _BottlePainter._refW;
    final sy = size.height / _BottlePainter._refH;
    final bodyPath = _BottlePainter._bodyPathForShape(shape, _BottlePainter._refW / 2);
    final m = Matrix4.identity()..scale(sx, sy);
    return bodyPath.transform(m.storage);
  }

  @override
  bool shouldReclip(covariant _BottleBodyClipper old) => old.shape != shape;
}

// ════════════════════════════════════════════════════════════════
// 그림판 painter — 누적된 stroke + 현재 그리는 중인 점들
// ════════════════════════════════════════════════════════════════

class _StrokesPainter extends CustomPainter {
  final List<_Stroke> strokes;
  final List<Offset> currentPoints;
  final Color currentColor;
  final double currentWidth;
  final String currentMode;

  _StrokesPainter(this.strokes, this.currentPoints, this.currentColor, this.currentWidth, this.currentMode);

  @override
  void paint(Canvas canvas, Size size) {
    // 누적된 스트로크
    for (final s in strokes) {
      _drawStroke(canvas, s.points, s.color, s.width, s.eraser);
    }
    // 현재 그리는 중인 스트로크
    if (currentPoints.length >= 2) {
      _drawStroke(canvas, currentPoints, currentColor, currentWidth, currentMode == 'eraser');
    }
  }

  void _drawStroke(Canvas canvas, List<Offset> pts, Color color, double width, bool eraser) {
    if (pts.length < 2) return;
    final paint = Paint()
      ..color = eraser ? Colors.white : color
      ..strokeWidth = width
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;
    if (eraser) paint.blendMode = BlendMode.clear;
    final path = Path()..moveTo(pts.first.dx, pts.first.dy);
    for (var i = 1; i < pts.length; i++) {
      path.lineTo(pts[i].dx, pts[i].dy);
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _StrokesPainter old) =>
      old.strokes.length != strokes.length ||
      old.currentPoints.length != currentPoints.length ||
      old.currentColor != currentColor ||
      old.currentWidth != currentWidth ||
      old.currentMode != currentMode;
}
