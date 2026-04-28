import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

// ════════════════════════════════════════════════════════════════
// 영속화 헬퍼 (AiScentStudio.jsx의 SS 객체와 동일 역할)
// SharedPreferences를 통해 Gemini 결과/Claude 채팅/레시피/슬라이더를
// 앱 재시작·탭 전환 후에도 보존한다.
// 키 prefix는 'studio_'로 통일 — 충돌 방지.
// ════════════════════════════════════════════════════════════════
class _SP {
  static const _prefix = 'studio_';

  static Future<Map<String, dynamic>?> getJson(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_prefix$key');
      if (raw == null) return null;
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) { return null; }
  }

  static Future<List<dynamic>?> getList(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_prefix$key');
      if (raw == null) return null;
      final decoded = jsonDecode(raw);
      return decoded is List ? decoded : null;
    } catch (_) { return null; }
  }

  static Future<String?> getString(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('$_prefix$key');
    } catch (_) { return null; }
  }

  static Future<void> setJson(String key, dynamic value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (value == null) {
        await prefs.remove('$_prefix$key');
      } else {
        await prefs.setString('$_prefix$key', jsonEncode(value));
      }
    } catch (_) { /* 용량 초과/직렬화 실패 시 무시 */ }
  }

  static Future<void> remove(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_prefix$key');
    } catch (_) {}
  }

  /// 여러 키 일괄 삭제 (초기화용)
  static Future<void> removeAll(List<String> keys) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final k in keys) {
        await prefs.remove('$_prefix$k');
      }
    } catch (_) {}
  }
}

/// 같은 이미지 재분석 방지용 캐시 키
/// (이름+크기+수정일이 동일하면 동일 이미지로 간주)
String _imageCacheKey(File file) {
  final name = file.path.split(Platform.pathSeparator).last;
  final size = file.lengthSync();
  final modified = file.lastModifiedSync().millisecondsSinceEpoch;
  return 'gemini_img_${name}_${size}_$modified';
}

/// 웹 환경(byte 데이터)용 캐시 키 — XFile 정보 활용
String _webImageCacheKey(String name, int size, int? lastModified) {
  return 'gemini_img_${name}_${size}_${lastModified ?? 0}';
}

const _gold  = Color(0xFFC9A961);
const _dark  = Color(0xFF1A1A1A);
const _bg    = Color(0xFFFAF8F3);
const _grey  = Color(0xFF8B8278);
const _light = Color(0xFFF0ECE4);
const _cream = Color(0xFFE8E2D6);
const _evalGreen = Color(0xFF2A6049);
const _evalBg    = Color(0xFFF0F9F4);
const _evalBorder = Color(0xFFC9E8D5);

// ── 파이프라인 상태 ──────────────────────────────────────────────
enum _PipelineStatus { idle, extracting, searching, streaming, done, error }

// ── 슬라이더 재료 모델 ──────────────────────────────────────────
class _SliderItem {
  final int?   ingredientId;
  final String ingredientName;
  final String noteType; // 'top' | 'middle' | 'base'
  double ratio;
  final String? reason;

  _SliderItem({
    this.ingredientId,
    required this.ingredientName,
    required this.noteType,
    required this.ratio,
    this.reason,
  });

  _SliderItem copyWith({double? ratio}) => _SliderItem(
    ingredientId: ingredientId,
    ingredientName: ingredientName,
    noteType: noteType,
    ratio: ratio ?? this.ratio,
    reason: reason,
  );
}

class CustomizationScreen extends StatefulWidget {
  const CustomizationScreen({super.key});
  @override
  State<CustomizationScreen> createState() => _CustomizationScreenState();
}

class _CustomizationScreenState extends State<CustomizationScreen>
    with SingleTickerProviderStateMixin {

  int _activeMode = 0; // 0=공병, 1=향조합, 2=AI

  // ── 공병 ────────────────────────────────────────────────────
  List<Map<String, dynamic>> _designs = [];
  bool _loading = true;

  // ── 향 조합 ─────────────────────────────────────────────────
  List<Map<String, dynamic>> _categories    = [];
  bool                       _loadingScents = true;
  String?                    _scentsError;
  final Map<String, List<Map<String, dynamic>>> _selected = {
    'top': [], 'middle': [], 'base': [],
  };
  bool _blendSaved = false;

  // ── 향 탭 검색 ───────────────────────────────────────────────
  final _scentSearchCtrl  = TextEditingController();
  String _scentSearchQuery = '';

  // ── AI 소믈리에 (Gemini) — 이미지 분석 ─────────────────────
  File?      _pickedImage;
  Uint8List? _pickedImageBytes;
  Map<String, dynamic>? _geminiResult;
  bool   _geminiLoading = false;
  String? _geminiError;

  // ── AI 조향사 (Claude) — 파이프라인 ────────────────────────────
  final List<Map<String, dynamic>> _chatMessages = [];
  final _chatCtrl    = TextEditingController();
  bool  _chatLoading = false;
  _PipelineStatus _pipelineStatus = _PipelineStatus.idle;
  List<Map<String, dynamic>> _foundIngredients = [];

  // ── 레시피 / 슬라이더 ────────────────────────────────────────
  Map<String, dynamic>? _recipe;
  bool  _recipeLoading = false;
  List<_SliderItem> _sliders    = [];
  List<_SliderItem> _prevSliders = [];
  String? _evaluation;
  bool    _evalLoading = false;
  Timer?  _evalTimer;

  // ── 진행 중 fetch 중단용 클라이언트 (AbortController 대체) ──
  // Claude SSE 스트림 / Gemini 분석 / Gemini 평가 모두 이 클라이언트를
  // 통해 송신 — dispose나 reset 시 close()로 일괄 중단한다.
  http.Client? _claudeClient;
  http.Client? _geminiClient;
  http.Client? _evalClient;

  // ── 같은 이미지 재분석 방지용 현재 캐시 키 ──
  String? _currentImageCacheKey;

  // ── sessionStorage 영속화 복원 완료 플래그 ──
  bool _restoredFromCache = false;

  final _scrollCtrl = ScrollController();

  // ────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    // ★ 비동기 병렬 초기화: 공병·향 재료 동시 로드
    Future.wait([_fetchDesigns(), _fetchScents()]);

    _scentSearchCtrl.addListener(
        () => setState(() => _scentSearchQuery = _scentSearchCtrl.text.toLowerCase()));

    _chatMessages.add({
      'role': 'assistant',
      'content': '안녕하세요. AI 조향사입니다. ✦\n\n원하시는 향수의 감성이나 상황을 자유롭게 말씀해 주세요.\n예: "비 오는 날 카페에서 책 읽는 따뜻한 느낌"',
      'isStatus': false,
      'isEval': false,
    });

    // ★ 영속 데이터 복원 (Gemini 결과 / Claude 채팅 / 레시피 / 슬라이더)
    _restoreFromCache();
  }

  // ────────────────────────────────────────────────────────────
  // SharedPreferences에서 이전 세션 데이터 복원
  // (AiScentStudio.jsx의 useState 초기값 로드와 동일 역할)
  // ────────────────────────────────────────────────────────────
  Future<void> _restoreFromCache() async {
    try {
      // Gemini 결과
      final geminiResult = await _SP.getJson('gemini_result');

      // Claude 채팅 메시지
      final claudeMessages = await _SP.getList('claude_messages');

      // Claude 레시피
      final recipe = await _SP.getJson('claude_recipe');

      // Claude 슬라이더 (List<Map>로 직렬화돼 있음)
      final slidersRaw = await _SP.getList('claude_sliders');

      // Claude 평가
      final evalText = await _SP.getString('claude_eval');

      // 활성 탭 (0=공병, 1=향조합, 2=AI)
      final activeMode = await _SP.getString('active_mode');

      if (!mounted) return;
      setState(() {
        if (geminiResult != null) _geminiResult = geminiResult;
        if (claudeMessages != null && claudeMessages.isNotEmpty) {
          _chatMessages
            ..clear()
            ..addAll(claudeMessages.cast<Map<String, dynamic>>());
        }
        if (recipe != null) _recipe = recipe;
        if (slidersRaw != null && slidersRaw.isNotEmpty) {
          _sliders = slidersRaw.map<_SliderItem>((m) {
            final mp = m as Map<String, dynamic>;
            return _SliderItem(
              ingredientId: mp['ingredientId'] as int?,
              ingredientName: mp['ingredientName']?.toString() ?? '',
              noteType: mp['noteType']?.toString() ?? 'top',
              ratio: (mp['ratio'] as num?)?.toDouble() ?? 0.0,
              reason: mp['reason']?.toString(),
            );
          }).toList();
          _prevSliders = List.from(_sliders.map((s) => s.copyWith()));
        }
        if (evalText != null && evalText.isNotEmpty) _evaluation = evalText;

        if (activeMode != null) {
          final idx = int.tryParse(activeMode);
          if (idx != null && idx >= 0 && idx <= 2) _activeMode = idx;
        }
        _restoredFromCache = true;
      });
    } catch (e) {
      debugPrint('영속 데이터 복원 오류: $e');
    }
  }

  // ────────────────────────────────────────────────────────────
  // 영속화 저장 헬퍼 — 상태 변경 후 호출
  // ────────────────────────────────────────────────────────────
  void _persistGeminiResult() {
    _SP.setJson('gemini_result', _geminiResult);
  }
  void _persistClaudeMessages() {
    // status / eval 메시지는 휘발성이라 제외
    final saved = _chatMessages
        .where((m) => m['isStatus'] != true)
        .toList();
    _SP.setJson('claude_messages', saved);
  }
  void _persistRecipe() {
    _SP.setJson('claude_recipe', _recipe);
  }
  void _persistSliders() {
    final list = _sliders.map((s) => {
      'ingredientId': s.ingredientId,
      'ingredientName': s.ingredientName,
      'noteType': s.noteType,
      'ratio': s.ratio,
      'reason': s.reason,
    }).toList();
    _SP.setJson('claude_sliders', list);
  }
  void _persistEvaluation() {
    _SP.setJson('claude_eval', _evaluation);
  }
  void _persistActiveMode() {
    _SP.setJson('active_mode', _activeMode.toString());
  }

  @override
  void dispose() {
    _evalTimer?.cancel();
    // ★ 진행 중인 모든 HTTP 요청 중단 (AbortController.abort() 대체)
    _claudeClient?.close();
    _geminiClient?.close();
    _evalClient?.close();
    _scentSearchCtrl.dispose();
    _chatCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  // ────────────────────────────────────────────────────────────
  // API 헬퍼
  // ────────────────────────────────────────────────────────────

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  // ★ 비동기: 공병 로드
  Future<void> _fetchDesigns() async {
    if (mounted) setState(() => _loading = true);
    final token = await _getToken();
    if (token == null || token.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/designs'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) setState(() =>
            _designs = List<Map<String, dynamic>>.from(json['data'] ?? []));
      }
    } catch (e) {
      debugPrint('디자인 로드 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ★ 비동기: 향 재료 로드
  Future<void> _fetchScents() async {
    if (mounted) setState(() { _loadingScents = true; _scentsError = null; });
    try {
      final res = await http.get(Uri.parse('${ApiConfig.baseUrl}/api/custom/scents'));
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        final data = (json['data'] ?? json) as List? ?? [];
        if (mounted) setState(() => _categories = data.cast<Map<String, dynamic>>());
      } else {
        if (mounted) setState(() => _scentsError = '향 재료 목록을 불러오지 못했습니다.');
      }
    } catch (_) {
      if (mounted) setState(() => _scentsError = '향 재료 목록을 불러오지 못했습니다.');
    } finally {
      if (mounted) setState(() => _loadingScents = false);
    }
  }

  Future<void> _deleteDesign(int designId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('삭제 확인', style: TextStyle(fontSize: 14, color: _dark)),
        content: Text('"$name"을 삭제하시겠습니까?',
            style: const TextStyle(fontSize: 13, color: _grey)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
              child: const Text('취소', style: TextStyle(color: _grey))),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('삭제', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirmed != true) return;
    final token = await _getToken();
    if (token == null) return;
    try {
      final res = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/designs/$designId'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200 && mounted) {
        setState(() => _designs.removeWhere((d) => d['designId'] == designId));
        _snack('디자인이 삭제되었습니다');
      }
    } catch (_) {}
  }

  Future<void> _addToCart(Map<String, dynamic> design) async {
    final token = await _getToken();
    if (token == null) { if (mounted) Navigator.pushNamed(context, '/login'); return; }
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/custom'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'customDesignId': design['designId'],
          'name':          design['name'],
          'price':         design['totalPrice'],
          'quantity':      1,
          'imageUrl':      design['previewImageUrl'],
        }),
      );
      if (res.statusCode == 200 && mounted) _snack('장바구니에 담겼습니다');
    } catch (_) {}
  }

  Future<void> _saveBlend() async {
    final token = await _getToken();
    if (token == null) { if (mounted) Navigator.pushNamed(context, '/login'); return; }
    final hasAny = _selected.values.any((l) => l.isNotEmpty);
    if (!hasAny) { _snack('최소 1개 이상의 노트를 선택해주세요'); return; }
    try {
      final items = _selected.entries.expand((e) => e.value.map((ing) => {
        'ingredientId': ing['ingredientId'],
        'type':         e.key.toUpperCase(),
      })).toList();
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'ingredients': items}),
      );
    } catch (_) {}
    setState(() => _blendSaved = true);
    _snack('향 조합이 저장되었습니다!');
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _blendSaved = false);
  }

  // ────────────────────────────────────────────────────────────
  // Gemini AI 분석 (이미지 단일 모드)
  // ────────────────────────────────────────────────────────────

  Future<void> _analyzeImage() async {
    if (_pickedImageBytes == null && _pickedImage == null) {
      _snack('이미지를 선택해주세요'); return;
    }

    // ★ 같은 이미지 재분석 방지 — 캐시에 결과 있으면 즉시 복원
    if (_currentImageCacheKey != null) {
      final cached = await _SP.getJson(_currentImageCacheKey!);
      if (cached != null) {
        if (mounted) setState(() {
          _geminiResult = cached;
          _geminiError = null;
        });
        _persistGeminiResult();
        return;
      }
    }

    setState(() { _geminiLoading = true; _geminiResult = null; _geminiError = null; });

    // 이전 요청 중단
    _geminiClient?.close();
    _geminiClient = http.Client();
    final client = _geminiClient!;

    try {
      final req = http.MultipartRequest(
          'POST', Uri.parse('${ApiConfig.baseUrl}/api/ai/image-to-scent'));
      if (kIsWeb && _pickedImageBytes != null) {
        req.files.add(http.MultipartFile.fromBytes(
          'image', _pickedImageBytes!,
          filename: 'image.jpg',
          contentType: MediaType('image', 'jpeg'),
        ));
      } else {
        final path   = _pickedImage!.path;
        final ext    = path.split('.').last.toLowerCase();
        final subtype = (ext == 'png') ? 'png' : (ext == 'webp') ? 'webp' : 'jpeg';
        req.files.add(await http.MultipartFile.fromPath(
          'image', path, contentType: MediaType('image', subtype)));
      }
      final streamed = await client.send(req);
      final res      = await http.Response.fromStream(streamed);
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        final data = json['data'] ?? json;
        if (mounted) setState(() => _geminiResult = data);
        // ★ 이미지 캐시에 결과 저장
        if (_currentImageCacheKey != null) {
          await _SP.setJson(_currentImageCacheKey!, data);
        }
        _persistGeminiResult();
      } else {
        if (mounted) setState(() => _geminiError = '분석 실패 (${res.statusCode})');
      }
    } catch (e) {
      // 중단된 클라이언트면 무시
      if (client != _geminiClient) return;
      if (mounted) setState(() => _geminiError = '네트워크 오류: $e');
    } finally {
      if (mounted) setState(() => _geminiLoading = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null || !mounted) return;

    final bytes = await picked.readAsBytes();
    final file = kIsWeb ? null : File(picked.path);

    // ★ 캐시 키 생성 (재분석 방지)
    String cacheKey;
    if (kIsWeb) {
      // 웹은 path 접근 불가 — XFile 정보만 사용
      cacheKey = _webImageCacheKey(picked.name, bytes.length, null);
    } else {
      cacheKey = _imageCacheKey(file!);
    }

    // ★ 캐시에 결과 있으면 즉시 복원 (분석 스킵)
    final cached = await _SP.getJson(cacheKey);

    if (!mounted) return;
    setState(() {
      _pickedImageBytes = bytes;
      _pickedImage = file;
      _currentImageCacheKey = cacheKey;
      if (cached != null) {
        _geminiResult = cached;
        _geminiError = null;
      } else {
        _geminiResult = null;
      }
    });

    if (cached != null) _persistGeminiResult();
  }

  // ────────────────────────────────────────────────────────────
  // Claude 파이프라인 채팅 (SSE 3단계)
  // ────────────────────────────────────────────────────────────

  bool get _isBusy =>
      _pipelineStatus == _PipelineStatus.extracting ||
      _pipelineStatus == _PipelineStatus.searching  ||
      _pipelineStatus == _PipelineStatus.streaming;

  /// 상태 메시지 추가 (기존 status 메시지 제거 후 삽입)
  void _addStatusMsg(String content) {
    if (!mounted) return;
    setState(() {
      _chatMessages.removeWhere((m) => m['isStatus'] == true);
      _chatMessages.add({
        'role': 'assistant', 'content': content,
        'isStatus': true, 'isEval': false,
      });
    });
  }

  Future<void> _sendChat() async {
    final text = _chatCtrl.text.trim();
    if (text.isEmpty || _isBusy) return;
    _chatCtrl.clear();

    setState(() {
      _chatMessages.removeWhere((m) => m['isStatus'] == true);
      _chatMessages.add({'role': 'user', 'content': text, 'isStatus': false, 'isEval': false});
      _recipe    = null;
      _sliders   = [];
      _evaluation = null;
      _pipelineStatus = _PipelineStatus.extracting;
      _chatLoading    = true;
    });
    _persistClaudeMessages();
    _persistRecipe();
    _persistSliders();
    _persistEvaluation();
    _scrollToBottom();
    _addStatusMsg('✦ 향수 감성 키워드를 분석하고 있습니다...');

    // ★ 이전 진행 중 SSE 스트림 중단 후 새 클라이언트 생성
    _claudeClient?.close();
    _claudeClient = http.Client();
    final client = _claudeClient!;

    try {
      // ★ 컨텍스트용 메시지 (status/eval 제외)
      final contextMsgs = _chatMessages
          .where((m) => m['isStatus'] != true && m['isEval'] != true)
          .map((m) => {'role': m['role'], 'content': m['content']})
          .toList();

      final request = http.Request(
          'POST', Uri.parse('${ApiConfig.baseUrl}/api/ai/claude-blend'));
      request.headers['Content-Type'] = 'application/json; charset=utf-8';
      request.body = jsonEncode({
        'userPrompt': text,
        'messages':   contextMsgs,
      });

      final streamed = await client.send(request);
      final stream   = streamed.stream.transform(utf8.decoder);

      String buffer           = '';
      String assistantContent = '';
      bool   assistantAdded   = false;

      await for (final chunk in stream) {
        // 중단 감지 — client가 교체됐으면 즉시 종료
        if (client != _claudeClient) return;

        buffer += chunk;
        final lines = buffer.split('\n');
        buffer = lines.removeLast(); // 불완전한 마지막 줄 유지

        for (final line in lines) {
          if (!line.startsWith('data:')) continue;
          final raw = line.substring(5).trim();
          try {
            final data = jsonDecode(raw) as Map<String, dynamic>;

            // ── 파이프라인 상태 ────────────────────────────────
            if (data['status'] == 'extracting_keywords') {
              if (mounted) setState(() => _pipelineStatus = _PipelineStatus.extracting);
              _addStatusMsg('✦ Gemini가 향수 재료 키워드를 추출하고 있습니다...');

            } else if (data['status'] == 'searching_ingredients') {
              if (mounted) setState(() => _pipelineStatus = _PipelineStatus.searching);
              _addStatusMsg('✦ Supabase에서 매칭 재료를 검색하고 있습니다...');

            } else if (data['status'] == 'ingredients_found') {
              final count = data['count'] as int? ?? 0;
              if (mounted) setState(() {
                _foundIngredients = List<Map<String, dynamic>>.from(data['ingredients'] ?? []);
                _pipelineStatus   = _PipelineStatus.streaming;
              });
              _addStatusMsg('✦ ${count}개의 재료를 찾았습니다. Claude가 조향을 시작합니다...');

              // Claude 스트리밍용 빈 말풍선 삽입
              if (!assistantAdded && mounted) {
                setState(() {
                  _chatMessages.removeWhere((m) => m['isStatus'] == true);
                  _chatMessages.add({
                    'role': 'assistant', 'content': '',
                    'isStatus': false, 'isEval': false,
                  });
                });
                assistantAdded = true;
                _scrollToBottom();
              }

            // ── Claude 토큰 스트리밍 ─────────────────────────
            } else if (data.containsKey('delta')) {
              final delta = data['delta'] as String? ?? '';
              if (delta.isNotEmpty) {
                assistantContent += delta;
                // <recipe> 태그 이전 텍스트만 표시
                final display = assistantContent
                    .replaceAll(RegExp(r'<recipe>[\s\S]*$'), '');
                if (mounted) setState(() {
                  final idx = _chatMessages.lastIndexWhere(
                      (m) => m['role'] == 'assistant' && m['isStatus'] != true);
                  if (idx >= 0) {
                    _chatMessages[idx] = {..._chatMessages[idx], 'content': display};
                  }
                });
                _scrollToBottom();
              }

            // ── 완료: 레시피 파싱 → 슬라이더 초기화 ─────────
            } else if (data['done'] == true) {
              if (mounted) setState(() => _pipelineStatus = _PipelineStatus.done);
              final recipeJson = data['recipeJson'] as String?;
              if (recipeJson != null && recipeJson != '{}') {
                try {
                  final parsed = jsonDecode(recipeJson) as Map<String, dynamic>;
                  if (mounted) setState(() {
                    _recipe = parsed;
                    _initSliders(parsed);
                  });
                  _persistRecipe();
                  _persistSliders();
                } catch (e) {
                  debugPrint('레시피 파싱 오류: $e');
                }
              }
              // 스트리밍 종료 — 최종 메시지 영속화
              _persistClaudeMessages();

            } else if (data.containsKey('error')) {
              throw Exception(data['error']);
            }
          } catch (_) {
            // 불완전한 JSON 청크 무시
          }
        }
      }
      // 정상 종료 시에만 close — 중간에 교체된 경우는 위에서 이미 return됨
      if (client == _claudeClient) {
        client.close();
        _claudeClient = null;
      }

    } catch (e) {
      // 중단된 클라이언트면 조용히 무시
      if (client != _claudeClient) return;

      if (mounted) setState(() {
        _pipelineStatus = _PipelineStatus.error;
        _chatMessages.removeWhere((m) => m['isStatus'] == true);
        _chatMessages.add({
          'role': 'assistant',
          'content': '오류가 발생했습니다. 다시 시도해 주세요.',
          'isStatus': false, 'isEval': false,
        });
      });
      _persistClaudeMessages();
    } finally {
      if (mounted) setState(() => _chatLoading = false);
    }
  }

  // ── 레시피 파싱 → 슬라이더 초기화 ──────────────────────────
  void _initSliders(Map<String, dynamic> parsed) {
    final items = <_SliderItem>[
      for (final n in (parsed['topNotes']    as List? ?? []))
        _SliderItem(
          ingredientId:   n['ingredientId'] as int?,
          ingredientName: n['ingredientName']?.toString() ?? '',
          noteType: 'top',
          ratio:    (n['ratio'] as num?)?.toDouble() ?? 0.0,
          reason:   n['reason']?.toString(),
        ),
      for (final n in (parsed['middleNotes'] as List? ?? []))
        _SliderItem(
          ingredientId:   n['ingredientId'] as int?,
          ingredientName: n['ingredientName']?.toString() ?? '',
          noteType: 'middle',
          ratio:    (n['ratio'] as num?)?.toDouble() ?? 0.0,
          reason:   n['reason']?.toString(),
        ),
      for (final n in (parsed['baseNotes']   as List? ?? []))
        _SliderItem(
          ingredientId:   n['ingredientId'] as int?,
          ingredientName: n['ingredientName']?.toString() ?? '',
          noteType: 'base',
          ratio:    (n['ratio'] as num?)?.toDouble() ?? 0.0,
          reason:   n['reason']?.toString(),
        ),
    ];
    _sliders     = items;
    _prevSliders = List.from(items.map((s) => s.copyWith()));
  }

  // ── 슬라이더 값 변경 + 디바운스 Gemini 평가 ─────────────────
  void _handleSliderChange(int index, double newRatio) {
    setState(() {
      _sliders = List.from(_sliders);
      _sliders[index] = _sliders[index].copyWith(ratio: newRatio);
    });
    _persistSliders();

    // ★ 1초 디바운스 후 Gemini 평가 요청
    _evalTimer?.cancel();
    _evalTimer = Timer(const Duration(seconds: 1), () {
      if (_prevSliders.isNotEmpty) {
        _requestGeminiEvaluation(_prevSliders, _sliders);
      }
      _prevSliders = List.from(_sliders.map((s) => s.copyWith()));
    });
  }

  // ── Gemini 비율 변경 평가 ────────────────────────────────────
  Future<void> _requestGeminiEvaluation(
      List<_SliderItem> prev, List<_SliderItem> curr) async {
    if (mounted) setState(() => _evalLoading = true);

    // 이전 평가 요청 중단
    _evalClient?.close();
    _evalClient = http.Client();
    final client = _evalClient!;

    try {
      Map<String, dynamic> toSnapshot(List<_SliderItem> list) => {
        'topNotes':    list.where((s) => s.noteType == 'top')
            .map((s) => {'ingredientName': s.ingredientName, 'ratio': s.ratio}).toList(),
        'middleNotes': list.where((s) => s.noteType == 'middle')
            .map((s) => {'ingredientName': s.ingredientName, 'ratio': s.ratio}).toList(),
        'baseNotes':   list.where((s) => s.noteType == 'base')
            .map((s) => {'ingredientName': s.ingredientName, 'ratio': s.ratio}).toList(),
      };

      final res = await client.post(
        Uri.parse('${ApiConfig.baseUrl}/api/ai/gemini-evaluate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'previousRecipe': toSnapshot(prev),
          'currentRecipe':  toSnapshot(curr),
        }),
      );
      // 중단된 요청이면 무시
      if (client != _evalClient) return;

      if (res.statusCode == 200) {
        final json     = jsonDecode(utf8.decode(res.bodyBytes));
        final evalText = json['data'] as String? ?? '';
        if (evalText.isNotEmpty && mounted) {
          setState(() => _evaluation = evalText);
          // 평가 결과를 채팅에도 추가
          setState(() {
            _chatMessages.add({
              'role': 'assistant',
              'content': '🌿 조향 변화 평가\n$evalText',
              'isStatus': false, 'isEval': true,
            });
          });
          _persistEvaluation();
          // eval 메시지는 휘발성이라 _persistClaudeMessages는 호출하지 않음
          // (이미 _persistClaudeMessages는 isEval/isStatus를 자동 제외)
          _scrollToBottom();
        }
      }
    } catch (e) {
      if (client != _evalClient) return;
      debugPrint('Gemini 평가 오류: $e');
    } finally {
      if (mounted) setState(() => _evalLoading = false);
    }
  }

  // ── AI 조향 저장 ─────────────────────────────────────────────
  Future<void> _saveAiBlend() async {
    final token = await _getToken();
    if (token == null) { _snack('로그인이 필요합니다.'); return; }
    if (_recipe == null || _sliders.isEmpty) return;
    try {
      final items = _sliders.map((s) => {
        'ingredientId': s.ingredientId,
        'type':         s.noteType.toUpperCase(),
        'ratio':        s.ratio,
      }).toList();
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'name':          _recipe!['perfumeName'] ?? 'AI 조향 레시피',
          'concentration': _recipe!['concentration'] ?? 'EDP',
          'volumeMl':      50,
          'totalPrice':    0,
          'ingredients':   items,
        }),
      );
      if (res.statusCode == 200) {
        _snack('조향이 저장되었습니다!');
      } else {
        _snack('저장에 실패했습니다.');
      }
    } catch (_) { _snack('네트워크 오류'); }
  }

  Future<void> _generateRecipe() async {
    if (_chatMessages.where((m) => m['isStatus'] != true).length < 3) {
      _snack('조향사와 충분히 대화 후 생성해주세요'); return;
    }
    setState(() => _recipeLoading = true);
    final allIngredients = _categories
        .expand((cat) => (cat['ingredients'] as List? ?? []).cast<Map>())
        .map((i) => i['name']?.toString() ?? '')
        .where((s) => s.isNotEmpty)
        .take(20)
        .toList();
    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/ai/claude-recipe'),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: jsonEncode({'messages': _chatMessages, 'availableIngredients': allIngredients}),
      );
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        if (mounted) {
          final parsed = json['data'] ?? json;
          setState(() {
            _recipe = parsed;
            _initSliders(parsed as Map<String, dynamic>);
          });
          _persistRecipe();
          _persistSliders();
        }
      }
    } catch (_) { _snack('레시피 생성에 실패했습니다'); }
    finally { if (mounted) setState(() => _recipeLoading = false); }
  }

  void _resetChat() {
    // ★ 진행 중인 Claude SSE 스트림 중단
    _claudeClient?.close();
    _claudeClient = null;
    // 평가도 진행 중이라면 중단
    _evalClient?.close();
    _evalClient = null;
    _evalTimer?.cancel();

    setState(() {
      _chatMessages
        ..clear()
        ..add({
          'role': 'assistant',
          'content': '새로운 조향을 시작합니다. ✦\n\n어떤 향수를 원하시나요?',
          'isStatus': false, 'isEval': false,
        });
      _recipe     = null;
      _sliders    = [];
      _prevSliders = [];
      _evaluation = null;
      _pipelineStatus = _PipelineStatus.idle;
      _chatLoading    = false;
      _foundIngredients = [];
    });

    // ★ Claude 관련 영속 데이터 일괄 삭제
    _SP.removeAll([
      'claude_messages', 'claude_recipe', 'claude_sliders', 'claude_eval',
    ]);
    _persistClaudeMessages(); // 초기 메시지로 덮어쓰기
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(color: _gold)),
      backgroundColor: _dark,
      behavior: SnackBarBehavior.floating,
    ));
  }

  String _numFmt(dynamic v) {
    final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(child: Column(children: [
        _buildHeader(),
        _buildTabSwitcher(),
        Expanded(child: IndexedStack(
          index: _activeMode,
          children: [
            _buildBottleTab(),
            _buildScentTab(),
            _buildAiTab(),
          ],
        )),
      ])),
    );
  }

  Widget _buildHeader() => Container(
    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
    color: Colors.white,
    child: Column(children: [
      Stack(alignment: Alignment.center, children: [
        Align(
          alignment: Alignment.centerLeft,
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Icon(Icons.arrow_back_ios, size: 16, color: _grey.withOpacity(0.6)),
          ),
        ),
        const Text('CREATE YOUR SIGNATURE',
            style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold, fontStyle: FontStyle.italic)),
      ]),
      const SizedBox(height: 6),
      const Text('CUSTOMIZING',
          style: TextStyle(fontSize: 20, letterSpacing: 8, color: _dark, fontWeight: FontWeight.w300)),
      const SizedBox(height: 4),
      const Text('나만의 향수를 완성하세요',
          style: TextStyle(fontSize: 11, letterSpacing: 2, color: _grey, fontStyle: FontStyle.italic)),
      const SizedBox(height: 12),
      Container(height: 0.5, color: _gold.withOpacity(0.3)),
    ]),
  );

  Widget _buildTabSwitcher() => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
    child: Container(
      decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.4))),
      child: Row(children: [
        _tabBtn(0, Icons.local_drink_outlined, '공병 디자인'),
        Container(width: 0.5, color: _gold.withOpacity(0.3)),
        _tabBtn(1, Icons.water_drop_outlined, '향 조합'),
        Container(width: 0.5, color: _gold.withOpacity(0.3)),
        _tabBtn(2, Icons.auto_awesome_outlined, 'AI 조향'),
      ]),
    ),
  );

  Widget _tabBtn(int idx, IconData icon, String label) {
    final active = _activeMode == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _activeMode = idx);
          _persistActiveMode();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 11),
          color: active ? _dark : Colors.white,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 15, color: active ? _gold : _grey),
            const SizedBox(height: 3),
            Text(label, style: TextStyle(fontSize: 9, letterSpacing: 0.8,
                color: active ? _gold : _grey)),
          ]),
        ),
      ),
    );
  }

  // ════════════════ 공병 탭 ════════════════════════════════════

  Widget _buildBottleTab() => Column(children: [
    Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: GestureDetector(
        onTap: () async {
          final token = await _getToken();
          // 로그인 안 되어 있으면 로그인 페이지로 이동
          if (token == null && mounted) {
            Navigator.pushNamed(context, '/login');
            return;
          }

          // 에디터 화면으로 이동
          if (mounted) {
            Navigator.pushNamed(context, '/bottle-editor');
          }
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(border: Border.all(color: _gold, width: 1.5)),
          child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.add, color: _gold, size: 16),
            SizedBox(width: 8),
            Text('내 향수 디자인 추가',
                style: TextStyle(color: _gold, fontSize: 12, letterSpacing: 2)),
          ]),
        ),
      ),
    ),
    const SizedBox(height: 12),
    Expanded(
      child: _loading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : _designs.isEmpty
              ? _emptyState(Icons.local_drink_outlined,
                  '아직 저장된 디자인이 없습니다.\n위 버튼을 눌러 첫 번째 디자인을 만들어보세요.')
              : GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, childAspectRatio: 0.72,
                    crossAxisSpacing: 12, mainAxisSpacing: 16,
                  ),
                  itemCount: _designs.length,
                  itemBuilder: (_, i) => _buildDesignCard(_designs[i]),
                ),
    ),
  ]);

  Widget _buildDesignCard(Map<String, dynamic> d) {
    final preview  = d['previewImageUrl'] as String?;
    final name     = d['name'] ?? '';
    final price    = d['totalPrice'] ?? 0;
    final designId = d['designId'];
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Column(children: [
        Expanded(child: Container(color: _light,
          child: preview != null
              ? Image.network(preview, fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Center(
                      child: Text('NO PREVIEW',
                          style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 2))))
              : const Center(child: Text('NO PREVIEW',
                  style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 2))),
        )),
        Padding(padding: const EdgeInsets.all(10), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name.toString(), style: const TextStyle(fontSize: 13, color: _dark),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text('₩${_numFmt(price)}', style: const TextStyle(fontSize: 11, color: _gold)),
            const SizedBox(height: 6),
            Row(children: [
              Expanded(child: GestureDetector(
                onTap: () => _addToCart(d),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8), color: _dark,
                  child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.shopping_bag_outlined, size: 12, color: Colors.white),
                    SizedBox(width: 4),
                    Text('CART', style: TextStyle(fontSize: 9, color: Colors.white, letterSpacing: 2)),
                  ]),
                ),
              )),
              const SizedBox(width: 4),
              // 수정 버튼
              GestureDetector(
                onTap: () {
                  Navigator.pushNamed(
                    context,
                    '/bottle-editor',
                    arguments: d, // 기존 데이터 전달
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: _gold),
                  ),
                  child: const Icon(Icons.edit, size: 14, color: _gold),
                ),
              ),

              const SizedBox(width: 4),
              
              GestureDetector(
                onTap: () => _deleteDesign(designId, name.toString()),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  decoration: BoxDecoration(border: Border.all(color: Colors.red.shade200)),
                  child: Icon(Icons.delete_outline, size: 14, color: Colors.red.shade300),
                ),
              ),
            ]),
          ],
        )),
      ]),
    );
  }

  // ════════════════ 향 조합 탭 ════════════════════════════════

  Widget _buildScentTab() {
    if (_loadingScents) return const Center(child: CircularProgressIndicator(color: _gold));
    if (_scentsError != null) return Center(child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(_scentsError!, style: const TextStyle(color: _grey, fontSize: 13)),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _fetchScents,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(border: Border.all(color: _gold)),
            child: const Text('다시 시도', style: TextStyle(color: _gold, fontSize: 12)),
          ),
        ),
      ],
    ));

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: double.infinity, padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.2))),
          child: const Column(children: [
            Text('MY SCENT LAB', style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold)),
            SizedBox(height: 4),
            Text('원하는 향을 조합하세요', style: TextStyle(fontSize: 14, color: _dark, letterSpacing: 2)),
            SizedBox(height: 4),
            Text('각 계열별 최대 5개 선택',
                style: TextStyle(fontSize: 11, color: _grey, fontStyle: FontStyle.italic)),
          ]),
        ),
        const SizedBox(height: 12),

        // 재료 검색
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
          child: Row(children: [
            const Icon(Icons.search, size: 16, color: _grey),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _scentSearchCtrl,
                style: const TextStyle(fontSize: 13, color: _dark),
                decoration: const InputDecoration(
                  hintText: '재료 이름 검색 (예: 로즈, 베르가못)',
                  hintStyle: TextStyle(fontSize: 12, color: _grey),
                  border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero,
                ),
              ),
            ),
            if (_scentSearchQuery.isNotEmpty)
              GestureDetector(
                onTap: () { _scentSearchCtrl.clear(); setState(() => _scentSearchQuery = ''); },
                child: const Icon(Icons.close, size: 16, color: _grey),
              ),
          ]),
        ),
        const SizedBox(height: 12),

        if (_scentSearchQuery.isNotEmpty)
          _buildSearchResults()
        else ...[
          _buildNoteSection('top',    'TOP NOTE',    '첫인상 · 15–30분'),
          const SizedBox(height: 12),
          _buildNoteSection('middle', 'MIDDLE NOTE', '핵심 · 2–4시간'),
          const SizedBox(height: 12),
          _buildNoteSection('base',   'BASE NOTE',   '잔향 · 4시간+'),
        ],
        const SizedBox(height: 20),
        if (_selected.values.any((l) => l.isNotEmpty)) _buildBlendSummary(),
      ]),
    );
  }

  Widget _buildSearchResults() {
    final allIngredients = _categories.expand((cat) {
      final catName = cat['categoryName'] ?? '';
      return (cat['ingredients'] as List? ?? [])
          .cast<Map<String, dynamic>>()
          .map((i) => {...i, 'categoryName': catName});
    }).where((i) => (i['name'] ?? '').toString().toLowerCase().contains(_scentSearchQuery)).toList();

    if (allIngredients.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
        child: Center(child: Text('"$_scentSearchQuery" 검색 결과가 없습니다',
            style: const TextStyle(fontSize: 12, color: _grey, fontStyle: FontStyle.italic))),
      );
    }

    return Container(
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
      padding: const EdgeInsets.all(12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('검색 결과 ${allIngredients.length}개',
            style: TextStyle(fontSize: 9, letterSpacing: 2, color: _gold.withOpacity(0.8))),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8,
          children: allIngredients.map((ing) {
            final name  = ing['name'] ?? '';
            final ingId = ing['ingredientId'];
            final isAnySelected = _selected.values.any((l) => l.any((s) => s['ingredientId'] == ingId));
            final catLabel = ing['categoryName'] ?? '';
            return GestureDetector(
              onTap: () => _showNoteSelectionSheet(ing),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: isAnySelected ? _dark : Colors.transparent,
                  border: Border.all(color: isAnySelected ? _dark : _gold.withOpacity(0.4)),
                ),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(name.toString(),
                      style: TextStyle(fontSize: 12, color: isAnySelected ? _gold : _dark)),
                  Text(catLabel,
                      style: TextStyle(fontSize: 8, color: isAnySelected ? _gold.withOpacity(0.7) : _grey)),
                ]),
              ),
            );
          }).toList(),
        ),
      ]),
    );
  }

  void _showNoteSelectionSheet(Map<String, dynamic> ing) {
    final ingId = ing['ingredientId'];
    final name  = ing['name'] ?? '';
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name.toString(), style: const TextStyle(fontSize: 16, color: _dark, letterSpacing: 2)),
          const SizedBox(height: 4),
          const Text('어느 노트에 추가할까요?', style: TextStyle(fontSize: 12, color: _grey)),
          const SizedBox(height: 20),
          Row(children: ['top', 'middle', 'base'].map((key) {
            final label  = {'top': 'TOP', 'middle': 'MIDDLE', 'base': 'BASE'}[key]!;
            final isIn   = _selected[key]!.any((s) => s['ingredientId'] == ingId);
            final isFull = _selected[key]!.length >= 5;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    if (isIn) {
                      _selected[key]!.removeWhere((s) => s['ingredientId'] == ingId);
                    } else if (!isFull) {
                      _selected[key]!.add(ing);
                    }
                  });
                  Navigator.pop(context);
                },
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: isIn ? _dark : Colors.transparent,
                    border: Border.all(color: isIn ? _dark : _cream),
                  ),
                  child: Column(children: [
                    Text(label, style: TextStyle(fontSize: 11, letterSpacing: 2,
                        color: isIn ? _gold : _dark)),
                    if (isFull && !isIn)
                      const Text('가득참', style: TextStyle(fontSize: 9, color: _grey)),
                  ]),
                ),
              ),
            );
          }).toList()),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }

  Widget _buildNoteSection(String key, String title, String subtitle) {
    final sel = _selected[key]!;
    return Container(
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: _gold.withOpacity(0.15)))),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontSize: 11, letterSpacing: 4, color: _dark)),
              Text(subtitle, style: TextStyle(fontSize: 9, color: _grey.withOpacity(0.7),
                  fontStyle: FontStyle.italic)),
            ]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: sel.isNotEmpty ? _gold.withOpacity(0.1) : Colors.transparent,
                border: Border.all(color: _gold.withOpacity(0.3)),
              ),
              child: Text('${sel.length}/5',
                  style: TextStyle(fontSize: 10, color: sel.isNotEmpty ? _gold : _grey)),
            ),
          ]),
        ),
        if (sel.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
            child: Wrap(spacing: 6, runSpacing: 6,
              children: sel.map((ing) {
                final name = ing['name'] ?? '';
                return GestureDetector(
                  onTap: () => setState(() => sel.remove(ing)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                        color: _gold.withOpacity(0.12), border: Border.all(color: _gold)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(name, style: const TextStyle(fontSize: 11, color: _gold)),
                      const SizedBox(width: 4),
                      const Icon(Icons.close, size: 10, color: _gold),
                    ]),
                  ),
                );
              }).toList(),
            ),
          ),
        ..._categories.map((cat) {
          final catName     = cat['categoryName'] ?? '';
          final ingredients = (cat['ingredients'] as List? ?? []).cast<Map<String, dynamic>>();
          if (ingredients.isEmpty) return const SizedBox.shrink();
          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
              child: Text(catName, style: TextStyle(fontSize: 9, letterSpacing: 3,
                  color: _gold.withOpacity(0.8), fontStyle: FontStyle.italic)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: Wrap(spacing: 6, runSpacing: 6,
                children: ingredients.map((ing) {
                  final name       = ing['name'] ?? '';
                  final ingId      = ing['ingredientId'];
                  final isSelected = sel.any((s) => s['ingredientId'] == ingId);
                  return GestureDetector(
                    onTap: () => setState(() {
                      if (isSelected) {
                        sel.removeWhere((s) => s['ingredientId'] == ingId);
                      } else if (sel.length < 5) {
                        sel.add(ing);
                      }
                    }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? _dark : Colors.transparent,
                        border: Border.all(color: isSelected ? _dark : _grey.withOpacity(0.35)),
                      ),
                      child: Text(name, style: TextStyle(fontSize: 11, letterSpacing: 0.5,
                          color: isSelected ? Colors.white : _dark.withOpacity(0.7))),
                    ),
                  );
                }).toList(),
              ),
            ),
          ]);
        }),
      ]),
    );
  }

  Widget _buildBlendSummary() => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(color: _dark, border: Border.all(color: _gold.withOpacity(0.3))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('MY SCENT BLEND', style: TextStyle(fontSize: 10, letterSpacing: 4, color: _gold)),
      const SizedBox(height: 14),
      ..._selected.entries.where((e) => e.value.isNotEmpty).map((e) {
        final label = {'top': 'Top', 'middle': 'Middle', 'base': 'Base'}[e.key]!;
        final notes = e.value.map((n) => n['name'] ?? '').join(', ');
        return Padding(padding: const EdgeInsets.only(bottom: 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 52, child: Text(label,
                style: TextStyle(fontSize: 10, color: _gold.withOpacity(0.7), fontStyle: FontStyle.italic))),
            Expanded(child: Text(notes,
                style: const TextStyle(fontSize: 11, color: Colors.white70, height: 1.5))),
          ]),
        );
      }),
      const SizedBox(height: 14),
      SizedBox(width: double.infinity,
        child: GestureDetector(
          onTap: _blendSaved ? null : _saveBlend,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 14),
            color: _blendSaved ? _gold.withOpacity(0.5) : _gold,
            child: Text(_blendSaved ? '저장됨 ✓' : '향 조합 저장하기',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, letterSpacing: 2,
                    fontWeight: FontWeight.w600, color: _dark)),
          ),
        ),
      ),
    ]),
  );

  // ════════════════ AI 탭 ══════════════════════════════════════

  Widget _buildAiTab() => DefaultTabController(
    length: 2,
    child: Column(children: [
      Container(
        color: Colors.white,
        child: TabBar(
          labelColor: _gold,
          unselectedLabelColor: _grey,
          indicatorColor: _gold,
          indicatorWeight: 1.5,
          labelStyle: const TextStyle(fontSize: 10, letterSpacing: 2),
          tabs: const [
            Tab(icon: Icon(Icons.image_search_outlined, size: 16), text: 'AI 소믈리에'),
            Tab(icon: Icon(Icons.chat_bubble_outline, size: 16),   text: 'AI 조향사'),
          ],
        ),
      ),
      Expanded(child: TabBarView(children: [
        _buildGeminiSubTab(),
        _buildClaudeSubTab(),
      ])),
    ]),
  );

  // ── Gemini 소믈리에 탭 ────────────────────────────────────────

  Widget _buildGeminiSubTab() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // 헤더
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.2))),
        child: const Column(children: [
          Text('AI SOMMELIER',
              style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold)),
          SizedBox(height: 4),
          Text('이미지로 향수 찾기',
              style: TextStyle(fontSize: 14, color: _dark, letterSpacing: 2)),
          SizedBox(height: 4),
          Text('사진 속 분위기에 어울리는 기성 향수를 추천해드립니다',
              style: TextStyle(fontSize: 11, color: _grey, fontStyle: FontStyle.italic)),
        ]),
      ),
      const SizedBox(height: 16),

      // ── 이미지 업로드 영역 ─────────────────────────────────
      // (키워드 분석 모드는 사용성 저하로 제거 — 이미지 분석 단일 모드)
      const Text('UPLOAD YOUR IMAGE',
          style: TextStyle(fontSize: 9, letterSpacing: 4, color: _grey)),
      const SizedBox(height: 8),
      GestureDetector(
        onTap: _pickImage,
        child: Container(
          height: 220, width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _gold.withOpacity(0.3), width: 1.5),
          ),
          child: (_pickedImageBytes != null || _pickedImage != null)
              ? Stack(fit: StackFit.expand, children: [
                  kIsWeb && _pickedImageBytes != null
                      ? Image.memory(_pickedImageBytes!, fit: BoxFit.cover)
                      : Image.file(_pickedImage!, fit: BoxFit.cover),
                  Positioned(top: 8, right: 8,
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _pickedImage = null;
                        _pickedImageBytes = null;
                        _currentImageCacheKey = null;
                      }),
                      child: Container(
                        width: 28, height: 28,
                        color: Colors.white.withOpacity(0.9),
                        child: const Icon(Icons.close, size: 16, color: _grey),
                      ),
                    ),
                  ),
                ])
              : const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.add_photo_alternate_outlined, color: _gold, size: 42),
                  SizedBox(height: 10),
                  Text('이미지 선택', style: TextStyle(fontSize: 12, color: _grey, letterSpacing: 2)),
                  SizedBox(height: 4),
                  Text('JPG, PNG · 최대 10MB', style: TextStyle(fontSize: 10, color: _cream)),
                ]),
        ),
      ),
      const SizedBox(height: 16),
      _geminiAnalyzeBtn(_analyzeImage),

      if (_geminiError != null)
        Padding(padding: const EdgeInsets.only(top: 8),
          child: Text(_geminiError!, style: const TextStyle(fontSize: 11, color: Colors.red))),

      if (_geminiResult != null) ...[
        const SizedBox(height: 20),
        _buildGeminiResult(_geminiResult!),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () {
            setState(() {
              _geminiResult = null;
              _pickedImage = null;
              _pickedImageBytes = null;
              _currentImageCacheKey = null;
            });
            _SP.remove('gemini_result');
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(border: Border.all(color: _cream)),
            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.refresh, size: 14, color: _grey),
              SizedBox(width: 6),
              Text('다시 분석하기', style: TextStyle(fontSize: 11, color: _grey, letterSpacing: 2)),
            ]),
          ),
        ),
      ],
    ]),
  );

  Widget _geminiAnalyzeBtn(VoidCallback onTap) => GestureDetector(
    onTap: _geminiLoading ? null : onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 15),
      color: _geminiLoading ? _cream : _dark,
      child: _geminiLoading
          ? const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              SizedBox(width: 16, height: 16,
                  child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)),
              SizedBox(width: 10),
              Text('분석 중...', style: TextStyle(fontSize: 11, color: _grey, letterSpacing: 2)),
            ])
          : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.auto_awesome_outlined, color: _gold, size: 15),
              SizedBox(width: 8),
              Text('AI 향수 분석 시작', style: TextStyle(fontSize: 11, color: _gold, letterSpacing: 2)),
            ]),
    ),
  );

  Widget _buildGeminiResult(Map<String, dynamic> result) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        width: double.infinity, padding: const EdgeInsets.all(16), color: _dark,
        child: Column(children: [
          const Text('AI ANALYSIS', style: TextStyle(fontSize: 9, letterSpacing: 4, color: _gold)),
          const SizedBox(height: 8),
          Text(result['mood'] ?? '',
              style: const TextStyle(fontSize: 15, color: Colors.white, letterSpacing: 1)),
          const SizedBox(height: 8),
          Text(result['analysisText'] ?? '',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.white60, height: 1.6, fontStyle: FontStyle.italic)),
        ]),
      ),
      const SizedBox(height: 12),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        for (final entry in [
          {'label': 'TOP',    'desc': '15분', 'items': result['topNotes']},
          {'label': 'MIDDLE', 'desc': '2-4h', 'items': result['middleNotes']},
          {'label': 'BASE',   'desc': '4h+',  'items': result['baseNotes']},
        ]) Expanded(
          child: Container(
            margin: const EdgeInsets.only(right: 6),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(entry['label'] as String,
                  style: const TextStyle(fontSize: 8, letterSpacing: 2, color: _gold)),
              Text(entry['desc'] as String,
                  style: const TextStyle(fontSize: 8, color: _grey)),
              const SizedBox(height: 6),
              for (final n in (entry['items'] as List? ?? []))
                Padding(padding: const EdgeInsets.only(bottom: 3),
                  child: Text(n.toString(), style: const TextStyle(fontSize: 10, color: _dark))),
            ]),
          ),
        ),
      ]),
      const SizedBox(height: 12),
      if ((result['recommendedPerfumes'] as List? ?? []).isNotEmpty) ...[
        const Text('RECOMMENDED FOR YOU',
            style: TextStyle(fontSize: 9, letterSpacing: 4, color: _grey)),
        const SizedBox(height: 8),
        for (final p in (result['recommendedPerfumes'] as List))
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
            child: Row(children: [
              Container(
                width: 48, height: 48, color: _light,
                child: p['imageUrl'] != null
                    ? Image.network(p['imageUrl'], fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const SizedBox())
                    : const SizedBox(),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p['name'] ?? '', style: const TextStyle(fontSize: 12, color: _dark)),
                Text(p['brand'] ?? '', style: const TextStyle(fontSize: 10, color: _gold, fontStyle: FontStyle.italic)),
                if (p['matchReason'] != null)
                  Text(p['matchReason'],
                      style: const TextStyle(fontSize: 9, color: _grey),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
              ])),
              Text('₩${_numFmt(p['price'] ?? 0)}',
                  style: const TextStyle(fontSize: 11, color: _gold)),
            ]),
          ),
      ],
    ],
  );

  // ── Claude 조향사 탭 ─────────────────────────────────────────

  Widget _buildClaudeSubTab() => Column(children: [

    // ── 파이프라인 진행 표시 ─────────────────────────────────
    if (_isBusy)
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: _gold.withOpacity(0.05),
          border: Border(bottom: BorderSide(color: _gold.withOpacity(0.2))),
        ),
        child: Row(children: [
          const SizedBox(width: 14, height: 14,
              child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)),
          const SizedBox(width: 10),
          Text(
            _pipelineStatus == _PipelineStatus.extracting
                ? 'Gemini: 키워드 추출 중...'
                : _pipelineStatus == _PipelineStatus.searching
                    ? 'Supabase: 재료 검색 중...'
                    : 'Claude: 조향 중...',
            style: const TextStyle(fontSize: 10, color: _gold, letterSpacing: 1),
          ),
        ]),
      ),

    // ── 레시피 카드 + 슬라이더 패널 ─────────────────────────
    if (_recipe != null) _buildRecipeSliderPanel(),

    // ── 레시피 생성 버튼 (대화 내용 기반) ────────────────────
    Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(children: [
        Expanded(child: Text(
          '조향사와 대화하며 나만의 향수를 설계해보세요',
          style: TextStyle(fontSize: 10, color: _grey.withOpacity(0.8), fontStyle: FontStyle.italic),
        )),
        Row(children: [
          // 초기화 버튼
          GestureDetector(
            onTap: _resetChat,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(border: Border.all(color: _cream)),
              child: const Icon(Icons.refresh, size: 14, color: _grey),
            ),
          ),
          const SizedBox(width: 6),
          // 레시피 생성 버튼
          GestureDetector(
            onTap: _recipeLoading ? null : _generateRecipe,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.5))),
              child: _recipeLoading
                  ? const SizedBox(width: 14, height: 14,
                      child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5))
                  : const Text('조향지 생성', style: TextStyle(fontSize: 10, color: _gold, letterSpacing: 1)),
            ),
          ),
        ]),
      ]),
    ),

    // ── 채팅 메시지 ──────────────────────────────────────────
    Expanded(
      child: ListView.builder(
        controller: _scrollCtrl,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        itemCount: _chatMessages.length,
        itemBuilder: (_, i) {
          final msg    = _chatMessages[i];
          final isUser = msg['role'] == 'user';
          final isStatus = msg['isStatus'] == true;
          final isEval   = msg['isEval'] == true;
          final isLast   = i == _chatMessages.length - 1;
          final rawContent = msg['content'] ?? '';
          final content    = rawContent.replaceAll(
              RegExp(r'<recipe>[\s\S]*?</recipe>'), '');

          // 상태 메시지 (이탤릭 소형)
          if (isStatus) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                Container(width: 4, height: 4, decoration: const BoxDecoration(
                    color: _gold, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Flexible(child: Text(content,
                    style: const TextStyle(fontSize: 10, color: _grey,
                        fontStyle: FontStyle.italic))),
              ]),
            );
          }

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isUser) ...[
                  Container(
                    width: 26, height: 26,
                    color: isEval ? _evalGreen : _dark,
                    child: Center(child: Text(isEval ? '🌿' : '✦',
                        style: const TextStyle(color: _gold, fontSize: 10))),
                  ),
                  const SizedBox(width: 8),
                ],
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser
                          ? _dark
                          : isEval
                              ? _evalBg
                              : Colors.white,
                      border: isUser
                          ? null
                          : Border.all(color: isEval ? _evalBorder : _cream),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Flexible(child: Text(content,
                          style: TextStyle(
                            fontSize: 12,
                            color: isUser
                                ? Colors.white
                                : isEval
                                    ? _evalGreen
                                    : _dark,
                            height: 1.6,
                          ),
                        )),
                        // 스트리밍 커서
                        if (_chatLoading && isLast && !isUser && !isStatus)
                          Container(width: 2, height: 14, color: _gold,
                              margin: const EdgeInsets.only(left: 2)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    ),

    // ── 입력 바 ───────────────────────────────────────────────
    Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: _cream)),
      ),
      child: Row(children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: _bg, border: Border.all(color: _cream)),
            child: TextField(
              controller: _chatCtrl,
              maxLines: null,
              style: const TextStyle(fontSize: 13, color: _dark),
              decoration: InputDecoration(
                hintText: _isBusy ? '조향 중입니다...' : '향수 감성을 자유롭게 입력하세요...',
                hintStyle: const TextStyle(fontSize: 12, color: _grey),
                border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero,
              ),
              enabled: !_isBusy,
              onSubmitted: (_) => _sendChat(),
            ),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: _isBusy ? null : _sendChat,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 42, height: 42,
            color: _isBusy ? _cream : _dark,
            child: _isBusy
                ? const Center(child: SizedBox(width: 14, height: 14,
                    child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)))
                : const Icon(Icons.send_rounded, color: _gold, size: 17),
          ),
        ),
      ]),
    ),

    const Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Text('Gemini → Supabase → Claude 3단계 파이프라인',
          style: TextStyle(fontSize: 9, color: _cream, letterSpacing: 1)),
    ),
  ]);

  // ── 레시피 슬라이더 패널 (JSX 우측 패널 → 모바일 상단 카드) ──
  Widget _buildRecipeSliderPanel() {
    final totalRatio = _sliders.fold<double>(0, (s, item) => s + item.ratio);
    final isBalanced = (totalRatio - 1.0).abs() < 0.01;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      decoration: BoxDecoration(
        color: _dark,
        border: Border.all(color: _gold.withOpacity(0.3)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // 헤더
        Container(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: _gold.withOpacity(0.2)))),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('AI RECIPE',
                  style: TextStyle(fontSize: 9, letterSpacing: 4, color: _gold)),
              const SizedBox(height: 2),
              Text(_recipe!['perfumeName'] ?? '',
                  style: const TextStyle(fontSize: 13, color: Colors.white, letterSpacing: 1)),
              if (_recipe!['concept'] != null)
                Text(_recipe!['concept'],
                    style: const TextStyle(fontSize: 10, color: _gold, fontStyle: FontStyle.italic)),
            ])),
            // 비율 합계 표시
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: isBalanced ? _gold.withOpacity(0.4) : Colors.red.withOpacity(0.4)),
              ),
              child: Text('합계 ${(totalRatio * 100).round()}%',
                  style: TextStyle(fontSize: 9, color: isBalanced ? _gold : Colors.redAccent, letterSpacing: 1)),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                setState(() { _recipe = null; _sliders = []; _evaluation = null; });
                _SP.removeAll(['claude_recipe', 'claude_sliders', 'claude_eval']);
              },
              child: const Icon(Icons.close, size: 16, color: _grey),
            ),
          ]),
        ),

        // 슬라이더 목록
        ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 300),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: ['top', 'middle', 'base'].expand((noteType) {
                final noteItems = _sliders
                    .asMap()
                    .entries
                    .where((e) => e.value.noteType == noteType)
                    .toList();
                if (noteItems.isEmpty) return <Widget>[];
                final label = {'top': 'TOP', 'middle': 'MIDDLE', 'base': 'BASE'}[noteType]!;
                return [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6, top: 4),
                    child: Text('$label NOTE',
                        style: TextStyle(fontSize: 9, letterSpacing: 3,
                            color: _gold.withOpacity(0.5))),
                  ),
                  ...noteItems.map((entry) {
                    final idx  = entry.key;
                    final item = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text(item.ingredientName,
                              style: const TextStyle(fontSize: 11, color: Colors.white70)),
                          Text('${(item.ratio * 100).round()}%',
                              style: const TextStyle(fontSize: 11, color: _gold)),
                        ]),
                        const SizedBox(height: 6),
                        // ★ 슬라이더 (비율 조절)
                        SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            activeTrackColor: _gold,
                            inactiveTrackColor: Colors.white10,
                            thumbColor: _gold,
                            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                            overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                            trackHeight: 3,
                          ),
                          child: Slider(
                            value: item.ratio,
                            min: 0, max: 1,
                            divisions: 100,
                            onChanged: (v) => _handleSliderChange(idx, v),
                          ),
                        ),
                        if (item.reason != null)
                          Text(item.reason!,
                              style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.3),
                                  fontStyle: FontStyle.italic)),
                      ]),
                    );
                  }),
                ];
              }).toList(),
            ),
          ),
        ),

        // Gemini 평가 결과
        if (_evalLoading || _evaluation != null)
          Container(
            margin: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.2))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('GEMINI EVALUATION',
                  style: TextStyle(fontSize: 9, letterSpacing: 3, color: _gold)),
              const SizedBox(height: 6),
              if (_evalLoading)
                const Row(children: [
                  SizedBox(width: 12, height: 12,
                      child: CircularProgressIndicator(color: _gold, strokeWidth: 1.2)),
                  SizedBox(width: 8),
                  Text('평가 중...', style: TextStyle(fontSize: 10, color: _grey)),
                ])
              else if (_evaluation != null)
                Text(_evaluation!,
                    style: const TextStyle(fontSize: 11, color: Colors.white60,
                        height: 1.5, fontStyle: FontStyle.italic)),
            ]),
          ),

        // 메타 정보
        if ([_recipe!['concentration'], _recipe!['recommendedSeason'], _recipe!['recommendedOccasion']]
            .any((v) => v != null))
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
            child: Wrap(spacing: 16, runSpacing: 4,
              children: [
                if (_recipe!['concentration'] != null)
                  _metaChip('농도', _recipe!['concentration']),
                if (_recipe!['recommendedSeason'] != null)
                  _metaChip('계절', _recipe!['recommendedSeason']),
                if (_recipe!['recommendedOccasion'] != null)
                  _metaChip('TPO',  _recipe!['recommendedOccasion']),
              ],
            ),
          ),

        // 저장 버튼
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          child: GestureDetector(
            onTap: _saveAiBlend,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              color: _gold,
              child: const Text('조향 저장하기',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, letterSpacing: 3,
                      fontWeight: FontWeight.w600, color: _dark)),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _metaChip(String label, String value) => RichText(
    text: TextSpan(children: [
      TextSpan(text: '$label  ', style: const TextStyle(fontSize: 9, color: _gold)),
      TextSpan(text: value,      style: const TextStyle(fontSize: 10, color: Colors.white60)),
    ]),
  );

  Widget _emptyState(IconData icon, String msg) => Center(
    child: Padding(padding: const EdgeInsets.all(40),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 56, color: _gold.withOpacity(0.3)),
        const SizedBox(height: 20),
        Text(msg, textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: _grey, height: 1.7, fontStyle: FontStyle.italic)),
      ]),
    ),
  );

  Widget _priceRow(String label, dynamic val) => Padding(
    padding: const EdgeInsets.only(bottom: 2),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(fontSize: 9, color: _grey)),
      Text('₩${_numFmt(val)}', style: const TextStyle(fontSize: 9, color: _grey)),
    ]),
  );
}