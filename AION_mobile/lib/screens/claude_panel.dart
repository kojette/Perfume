
import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

const _gold       = Color(0xFFC9A961);
const _dark       = Color(0xFF1A1A1A);
const _grey       = Color(0xFF8B8278);
const _cream      = Color(0xFFE8E2D6);
const _evalGreen  = Color(0xFF2A6049);
const _evalBg     = Color(0xFFF0F9F4);
const _evalBorder = Color(0xFFC9E8D5);

enum _Status { idle, extracting, searching, streaming, done, error }

class _SliderItem {
  final int? ingredientId;
  final String ingredientName, noteType;
  final String? reason;
  double ratio;
  _SliderItem({this.ingredientId, required this.ingredientName, required this.noteType, required this.ratio, this.reason});
  _SliderItem copyWith({double? ratio}) => _SliderItem(ingredientId: ingredientId, ingredientName: ingredientName, noteType: noteType, ratio: ratio ?? this.ratio, reason: reason);
}

class ClaudePanel extends StatefulWidget {
  const ClaudePanel({super.key});
  @override State<ClaudePanel> createState() => _ClaudePanelState();
}

class _ClaudePanelState extends State<ClaudePanel> {
  final List<Map<String, dynamic>> _msgs = [];
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  _Status _status = _Status.idle;

  Map<String, dynamic>? _recipe;
  List<_SliderItem>     _sliders = [];
  List<_SliderItem>     _prevSliders = [];
  String?               _eval;
  bool                  _evalLoading = false;
  Timer?                _evalTimer;

  http.Client? _sseClient;
  http.Client? _evalClient;

  bool get _busy => _status == _Status.extracting || _status == _Status.searching || _status == _Status.streaming;

  @override
  void initState() {
    super.initState();
    _initChat();
    _restoreFromCache();
  }

  @override
  void dispose() {
    _evalTimer?.cancel();
    _sseClient?.close();
    _evalClient?.close();
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _initChat() {
    _msgs.add({'role': 'assistant', 'content': '안녕하세요. AI 조향사입니다. ✦\n\n원하시는 향수의 감성이나 상황을 자유롭게 말씀해 주세요.\n예: "비 오는 날 카페에서 책 읽는 따뜻한 느낌"', 'isStatus': false, 'isEval': false});
  }

  Future<void> _restoreFromCache() async {
    final p = await SharedPreferences.getInstance();
    final msgsStr = p.getString('studio_claude_messages');
    final recipeStr = p.getString('studio_claude_recipe');
    final slidersStr = p.getString('studio_claude_sliders');
    final evalStr = p.getString('studio_claude_eval');
    if (!mounted) return;
    setState(() {
      if (msgsStr != null) { final l = jsonDecode(msgsStr) as List; if (l.isNotEmpty) { _msgs.clear(); _msgs.addAll(l.cast<Map<String, dynamic>>()); } }
      if (recipeStr != null) _recipe = jsonDecode(recipeStr);
      if (slidersStr != null) {
        final l = jsonDecode(slidersStr) as List;
        _sliders = l.map<_SliderItem>((m) => _SliderItem(ingredientId: m['ingredientId'] as int?, ingredientName: m['ingredientName'] ?? '', noteType: m['noteType'] ?? 'top', ratio: (m['ratio'] as num?)?.toDouble() ?? 0, reason: m['reason']?.toString())).toList();
        _prevSliders = _sliders.map((s) => s.copyWith()).toList();
      }
      if (evalStr != null) _eval = evalStr;
    });
  }

  void _persistMsgs() async { final p = await SharedPreferences.getInstance(); await p.setString('studio_claude_messages', jsonEncode(_msgs.where((m) => m['isStatus'] != true).toList())); }
  void _persistRecipe() async { final p = await SharedPreferences.getInstance(); if (_recipe != null) await p.setString('studio_claude_recipe', jsonEncode(_recipe)); else await p.remove('studio_claude_recipe'); }
  void _persistSliders() async {
    final p = await SharedPreferences.getInstance();
    await p.setString('studio_claude_sliders', jsonEncode(_sliders.map((s) => {'ingredientId': s.ingredientId, 'ingredientName': s.ingredientName, 'noteType': s.noteType, 'ratio': s.ratio, 'reason': s.reason}).toList()));
  }
  void _persistEval() async { final p = await SharedPreferences.getInstance(); if (_eval != null) await p.setString('studio_claude_eval', _eval!); else await p.remove('studio_claude_eval'); }

  void _scrollBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
    if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
  });

  void _addStatus(String content) {
    if (!mounted) return;
    setState(() { _msgs.removeWhere((m) => m['isStatus'] == true); _msgs.add({'role': 'assistant', 'content': content, 'isStatus': true, 'isEval': false}); });
  }

  void _initSliders(Map<String, dynamic> parsed) {
    final items = <_SliderItem>[
      for (final n in (parsed['topNotes'] as List? ?? [])) _SliderItem(ingredientId: n['ingredientId'] as int?, ingredientName: n['ingredientName']?.toString() ?? '', noteType: 'top', ratio: (n['ratio'] as num?)?.toDouble() ?? 0, reason: n['reason']?.toString()),
      for (final n in (parsed['middleNotes'] as List? ?? [])) _SliderItem(ingredientId: n['ingredientId'] as int?, ingredientName: n['ingredientName']?.toString() ?? '', noteType: 'middle', ratio: (n['ratio'] as num?)?.toDouble() ?? 0, reason: n['reason']?.toString()),
      for (final n in (parsed['baseNotes'] as List? ?? [])) _SliderItem(ingredientId: n['ingredientId'] as int?, ingredientName: n['ingredientName']?.toString() ?? '', noteType: 'base', ratio: (n['ratio'] as num?)?.toDouble() ?? 0, reason: n['reason']?.toString()),
    ];
    // ratio 정규화
    final total = items.fold<double>(0, (s, i) => s + i.ratio);
    if (total > 0 && (total - 1.0).abs() > 0.005) { for (final i in items) i.ratio = i.ratio / total; }
    setState(() { _sliders = items; _prevSliders = items.map((s) => s.copyWith()).toList(); });
  }

  void _handleSliderChange(int idx, double v) {
    setState(() { _sliders[idx] = _sliders[idx].copyWith(ratio: v); });
    _persistSliders();
    _evalTimer?.cancel();
    _evalTimer = Timer(const Duration(seconds: 1), () { if (_prevSliders.isNotEmpty) _requestEval(_prevSliders, _sliders); _prevSliders = _sliders.map((s) => s.copyWith()).toList(); });
  }

  Future<void> _requestEval(List<_SliderItem> prev, List<_SliderItem> curr) async {
    setState(() => _evalLoading = true);
    _evalClient?.close(); _evalClient = http.Client();
    final client = _evalClient!;
    try {
      snap(List<_SliderItem> l, String t) => l.where((s) => s.noteType == t).map((s) => {'ingredientName': s.ingredientName, 'ratio': s.ratio}).toList();
      toSnap(List<_SliderItem> l) => {'topNotes': snap(l, 'top'), 'middleNotes': snap(l, 'middle'), 'baseNotes': snap(l, 'base')};
      final res = await client.post(Uri.parse('${ApiConfig.baseUrl}/api/ai/gemini-evaluate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'previousRecipe': toSnap(prev), 'currentRecipe': toSnap(curr)}));
      if (client != _evalClient) return;
      if (res.statusCode == 200) {
        final j = jsonDecode(utf8.decode(res.bodyBytes));
        final evalText = j['data']?.toString() ?? '';
        if (evalText.isNotEmpty && mounted) {
          setState(() { _eval = evalText; _msgs.add({'role': 'assistant', 'content': '🌿 조향 변화 평가\n$evalText', 'isStatus': false, 'isEval': true}); });
          _persistEval(); _scrollBottom();
        }
      }
    } catch (_) {} finally { if (mounted) setState(() => _evalLoading = false); }
  }

  Future<void> _saveBlend() async {
    final p = await SharedPreferences.getInstance();
    final tok = p.getString('accessToken');
    if (tok == null) { Navigator.pushNamed(context, '/login'); return; }
    if (_recipe == null || _sliders.isEmpty) return;
    try {
      final res = await http.post(Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {'Authorization': 'Bearer $tok', 'Content-Type': 'application/json'},
        body: jsonEncode({'name': _recipe!['perfumeName'] ?? 'AI 조향 레시피', 'concentration': _recipe!['concentration'] ?? 'EDP', 'volumeMl': 50, 'totalPrice': 0,
          'items': _sliders.map((s) => {'ingredientId': s.ingredientId, 'type': s.noteType.toUpperCase(), 'ratio': s.ratio}).toList()}));
      if (res.statusCode == 200 || res.statusCode == 201) {
        _snack('조향이 저장되었습니다!');
        }
      else _snack('저장에 실패했습니다.');
    } catch (_) { _snack('네트워크 오류'); }
  }

  Future<void> _sendChat() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _busy) return;
    _inputCtrl.clear();

    setState(() {
      _msgs.removeWhere((m) => m['isStatus'] == true);
      _msgs.add({'role': 'user', 'content': text, 'isStatus': false, 'isEval': false});
      _recipe = null; _sliders = []; _eval = null;
      _status = _Status.extracting;
    });
    _persistMsgs(); _persistRecipe(); _persistSliders(); _persistEval();
    _scrollBottom();
    _addStatus('✦ 향수 감성 키워드를 분석하고 있습니다...');

    _sseClient?.close(); _sseClient = http.Client();
    final client = _sseClient!;

    try {
      final contextMsgs = _msgs.where((m) => m['isStatus'] != true && m['isEval'] != true)
        .map((m) => {'role': m['role'], 'content': m['content']}).toList();
      final req = http.Request('POST', Uri.parse('${ApiConfig.baseUrl}/api/ai/claude-blend'));
      req.headers['Content-Type'] = 'application/json; charset=utf-8';
      req.body = jsonEncode({'userPrompt': text, 'messages': contextMsgs});
      final streamed = await client.send(req);
      final stream = streamed.stream.transform(utf8.decoder);

      String buffer = '', assistantContent = ''; bool assistantAdded = false;

      await for (final chunk in stream) {
        if (client != _sseClient) return;
        buffer += chunk;
        final lines = buffer.split('\n');
        buffer = lines.removeLast();
        for (final line in lines) {
          if (!line.startsWith('data:')) continue;
          try {
            final data = jsonDecode(line.substring(5).trim()) as Map<String, dynamic>;
            if (data['status'] == 'extracting_keywords') { if (mounted) setState(() => _status = _Status.extracting); _addStatus('✦ Gemini가 향수 재료 키워드를 추출하고 있습니다...'); }
            else if (data['status'] == 'searching_ingredients') { if (mounted) setState(() => _status = _Status.searching); _addStatus('✦ Supabase에서 매칭 재료를 검색하고 있습니다...'); }
            else if (data['status'] == 'ingredients_found') {
              if (mounted) setState(() => _status = _Status.streaming);
              _addStatus('✦ ${data['count'] ?? 0}개의 재료를 찾았습니다. Claude가 조향을 시작합니다...');
              if (!assistantAdded && mounted) {
                setState(() { _msgs.removeWhere((m) => m['isStatus'] == true); _msgs.add({'role': 'assistant', 'content': '', 'isStatus': false, 'isEval': false}); });
                assistantAdded = true; _scrollBottom();
              }
            } else if (data.containsKey('delta')) {
              final delta = data['delta'] as String? ?? '';
              if (delta.isNotEmpty) {
                assistantContent += delta;
                final display = assistantContent.replaceAll(RegExp(r'<recipe>[\s\S]*$'), '');
                if (mounted) setState(() {
                  final idx = _msgs.lastIndexWhere((m) => m['role'] == 'assistant' && m['isStatus'] != true);
                  if (idx >= 0) _msgs[idx] = {..._msgs[idx], 'content': display};
                });
                _scrollBottom();
              }
            } else if (data['done'] == true) {
              if (mounted) setState(() => _status = _Status.done);
              final rj = data['recipeJson'] as String?;
              if (rj != null && rj != '{}') {
                try { final parsed = jsonDecode(rj) as Map<String, dynamic>; if (mounted) { setState(() => _recipe = parsed); _initSliders(parsed); } _persistRecipe(); _persistSliders(); } catch (_) {}
              }
              _persistMsgs();
            } else if (data.containsKey('error')) throw Exception(data['error']);
          } catch (_) {}
        }
      }
      if (client == _sseClient) { client.close(); _sseClient = null; }
    } catch (e) {
      if (client != _sseClient) return;
      if (mounted) setState(() {
        _status = _Status.error;
        _msgs.removeWhere((m) => m['isStatus'] == true);
        _msgs.add({'role': 'assistant', 'content': '오류가 발생했습니다. 다시 시도해 주세요.', 'isStatus': false, 'isEval': false});
      });
      _persistMsgs();
    } finally { if (mounted) setState(() {}); }
  }

  void _resetAll() {
    _sseClient?.close(); _sseClient = null;
    _evalClient?.close(); _evalClient = null;
    _evalTimer?.cancel();
    setState(() {
      _msgs.clear(); _initChat(); _recipe = null; _sliders = []; _prevSliders = []; _eval = null;
      _status = _Status.idle; _inputCtrl.clear();
    });
    SharedPreferences.getInstance().then((p) {
      p.remove('studio_claude_messages'); p.remove('studio_claude_recipe');
      p.remove('studio_claude_sliders'); p.remove('studio_claude_eval');
    });
    _persistMsgs();
  }

  void _snack(String m) { if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m, style: const TextStyle(color: _gold)), backgroundColor: _dark, behavior: SnackBarBehavior.floating)); }

  // ════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext ctx) {
    return Column(children: [
      // 파이프라인 진행 표시
      if (_busy) Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(color: _gold.withOpacity(0.05), border: Border(bottom: BorderSide(color: _gold.withOpacity(0.2)))),
        child: Row(children: [
          const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)),
          const SizedBox(width: 8),
          Text(_status == _Status.extracting ? 'Gemini: 키워드 추출 중...' : _status == _Status.searching ? 'Supabase: 재료 검색 중...' : 'Claude: 조향 중...',
            style: const TextStyle(fontSize: 10, color: _gold, letterSpacing: 1)),
        ])),

      // 레시피 슬라이더 패널
      if (_recipe != null) _buildRecipePanel(),

      // 조향사 안내 + 초기화 버튼
      Container(color: Colors.white, padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Row(children: [
          Expanded(child: Text('조향사와 대화하며 나만의 향수를 설계해보세요',
            style: TextStyle(fontSize: 10, color: _grey.withOpacity(0.8), fontStyle: FontStyle.italic))),
          GestureDetector(onTap: _resetAll,
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(border: Border.all(color: _cream)),
              child: const Icon(Icons.refresh, size: 14, color: _grey))),
        ])),

      // 채팅 메시지
      Expanded(child: ListView.builder(
        controller: _scrollCtrl,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        itemCount: _msgs.length,
        itemBuilder: (_, i) {
          final msg = _msgs[i]; final isUser = msg['role'] == 'user';
          final isStatus = msg['isStatus'] == true; final isEval = msg['isEval'] == true;
          final isLast = i == _msgs.length - 1;
          final content = (msg['content'] ?? '').replaceAll(RegExp(r'<recipe>[\s\S]*?</recipe>'), '');
          if (isStatus) return Padding(padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [Container(width: 4, height: 4, decoration: const BoxDecoration(color: _gold, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Flexible(child: Text(content, style: const TextStyle(fontSize: 10, color: _grey, fontStyle: FontStyle.italic)))]));
          return Padding(padding: const EdgeInsets.only(bottom: 12),
            child: Row(mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isUser) ...[Container(width: 26, height: 26, color: isEval ? _evalGreen : _dark,
                    child: Center(child: Text(isEval ? '🌿' : '✦', style: const TextStyle(color: _gold, fontSize: 10)))), const SizedBox(width: 8)],
                Flexible(child: Container(padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isUser ? _dark : isEval ? _evalBg : Colors.white,
                    border: isUser ? null : Border.all(color: isEval ? _evalBorder : _cream)),
                  child: Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Flexible(child: Text(content, style: TextStyle(fontSize: 12, color: isUser ? Colors.white : isEval ? _evalGreen : _dark, height: 1.6))),
                    if (_busy && isLast && !isUser && !isStatus) Container(width: 2, height: 14, color: _gold, margin: const EdgeInsets.only(left: 2)),
                  ]))),
              ]));
        })),

      // 입력창
      Container(padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: _cream))),
        child: Row(children: [
          Expanded(child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: const Color(0xFFFAF8F3), border: Border.all(color: _cream)),
            child: TextField(controller: _inputCtrl, maxLines: null,
              style: const TextStyle(fontSize: 13, color: _dark),
              decoration: InputDecoration(hintText: _busy ? '조향 중입니다...' : '향수 감성을 자유롭게 입력하세요... (Enter 전송)',
                hintStyle: const TextStyle(fontSize: 12, color: _grey), border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero),
              enabled: !_busy,
              onSubmitted: (_) => _sendChat()))),
          const SizedBox(width: 8),
          GestureDetector(onTap: _busy ? null : _sendChat,
            child: Container(width: 42, height: 42, color: _busy ? _cream : _dark,
              child: _busy ? const Center(child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: _gold, strokeWidth: 1.5)))
                : const Icon(Icons.send_rounded, color: _gold, size: 17))),
        ])),

      const Padding(padding: EdgeInsets.only(bottom: 6),
        child: Text('Gemini → Supabase → Claude 3단계 파이프라인', style: TextStyle(fontSize: 9, color: _cream, letterSpacing: 1))),
    ]);
  }

  Widget _buildRecipePanel() {
    final total = _sliders.fold<double>(0, (s, i) => s + i.ratio);
    final isBalanced = (total - 1.0).abs() < 0.01;
    return Container(margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      decoration: BoxDecoration(color: _dark, border: Border.all(color: _gold.withOpacity(0.3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // 헤더
        Padding(padding: const EdgeInsets.all(14), child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('AI RECIPE', style: TextStyle(fontSize: 9, letterSpacing: 4, color: _gold)),
            const SizedBox(height: 2),
            Text(_recipe!['perfumeName'] ?? '', style: const TextStyle(fontSize: 13, color: Colors.white, letterSpacing: 1)),
            if (_recipe!['concept'] != null) Text(_recipe!['concept'], style: const TextStyle(fontSize: 10, color: _gold, fontStyle: FontStyle.italic)),
          ])),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(border: Border.all(color: isBalanced ? _gold.withOpacity(0.4) : Colors.red.withOpacity(0.4))),
            child: Text('합계 ${(total * 100).round()}%', style: TextStyle(fontSize: 9, color: isBalanced ? _gold : Colors.redAccent))),
          const SizedBox(width: 8),
          GestureDetector(onTap: () { setState(() { _recipe = null; _sliders = []; _eval = null; }); _persistRecipe(); _persistSliders(); _persistEval(); },
            child: const Icon(Icons.close, size: 16, color: _grey)),
        ])),

        // 슬라이더 목록
        ConstrainedBox(constraints: const BoxConstraints(maxHeight: 280),
          child: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              for (final noteType in ['top', 'middle', 'base']) ...[
                if (_sliders.any((s) => s.noteType == noteType)) ...[
                  Padding(padding: const EdgeInsets.only(bottom: 6, top: 4),
                    child: Text({'top': 'TOP', 'middle': 'MIDDLE', 'base': 'BASE'}[noteType]! + ' NOTE',
                      style: TextStyle(fontSize: 9, letterSpacing: 3, color: _gold.withOpacity(0.5)))),
                  for (int i = 0; i < _sliders.length; i++) if (_sliders[i].noteType == noteType)
                    Padding(padding: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Text(_sliders[i].ingredientName, style: const TextStyle(fontSize: 11, color: Colors.white70)),
                        Text('${(_sliders[i].ratio * 100).round()}%', style: const TextStyle(fontSize: 11, color: _gold)),
                      ]),
                      SliderTheme(data: SliderTheme.of(context).copyWith(
                        activeTrackColor: _gold, inactiveTrackColor: Colors.white10,
                        thumbColor: _gold, thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6), trackHeight: 3),
                        child: Slider(min: 0, max: 1, divisions: 100, value: _sliders[i].ratio,
                          onChanged: (v) => _handleSliderChange(i, v))),
                      if (_sliders[i].reason != null)
                        Text(_sliders[i].reason!, style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.3), fontStyle: FontStyle.italic)),
                    ])),
                ],
              ],
            ]))),

        // Gemini 평가
        if (_evalLoading || (_eval != null && _eval!.isNotEmpty))
          Container(margin: const EdgeInsets.fromLTRB(14, 0, 14, 10), padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.2))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('GEMINI EVALUATION', style: TextStyle(fontSize: 9, letterSpacing: 3, color: _gold)),
              const SizedBox(height: 6),
              if (_evalLoading) const Row(children: [SizedBox(width: 12, height: 12, child: CircularProgressIndicator(color: _gold, strokeWidth: 1.2)), SizedBox(width: 8), Text('평가 중...', style: TextStyle(fontSize: 10, color: _grey))])
              else if (_eval != null) Text(_eval!, style: const TextStyle(fontSize: 11, color: Colors.white60, height: 1.5, fontStyle: FontStyle.italic)),
            ])),

        // 메타 정보
        if ([_recipe!['concentration'], _recipe!['recommendedSeason'], _recipe!['recommendedOccasion']].any((v) => v != null))
          Padding(padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
            child: Wrap(spacing: 16, runSpacing: 4, children: [
              if (_recipe!['concentration'] != null) _meta('농도', _recipe!['concentration']),
              if (_recipe!['recommendedSeason'] != null) _meta('계절', _recipe!['recommendedSeason']),
              if (_recipe!['recommendedOccasion'] != null) _meta('TPO', _recipe!['recommendedOccasion']),
            ])),

        // 저장 버튼
        Padding(padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          child: SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _saveBlend,
            style: ElevatedButton.styleFrom(backgroundColor: _gold, foregroundColor: _dark, shape: const RoundedRectangleBorder(), padding: const EdgeInsets.symmetric(vertical: 12)),
            child: const Text('조향 저장하기', style: TextStyle(fontSize: 11, letterSpacing: 3, fontWeight: FontWeight.w600))))),
      ]));
  }

  Widget _meta(String label, String value) => RichText(text: TextSpan(children: [
    TextSpan(text: '$label  ', style: const TextStyle(fontSize: 9, color: _gold)),
    TextSpan(text: value, style: const TextStyle(fontSize: 10, color: Colors.white60)),
  ]));
}