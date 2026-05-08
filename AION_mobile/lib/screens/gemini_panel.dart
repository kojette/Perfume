
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


const _gold  = Color(0xFFC9A961);
const _dark  = Color(0xFF1A1A1A);
const _grey  = Color(0xFF8B8278);
const _cream = Color(0xFFE8E2D6);
const _bg    = Color(0xFFFAF8F3);

class GeminiPanel extends StatefulWidget {
  final VoidCallback? onSaved;
  const GeminiPanel({super.key, this.onSaved});
  @override State<GeminiPanel> createState() => _GeminiPanelState();
}

class _GeminiPanelState extends State<GeminiPanel> {
  // 이미지
  File?       _imgFile;
  Uint8List?  _imgBytes;
  String?     _imgName;
  bool        _loading = false;
  String?     _error;

  // 결과
  Map<String, dynamic>? _result;

  // 직접 조향 패널
  bool _showBlend = false;
  List<_BlendSlider> _sliders = [];
  String _blendName = '';
  final _nameCtrl = TextEditingController();
  bool _saving = false;
  bool _savedOk = false;

  // Gemini 평가
  String? _evaluation;
  bool _evalLoading = false;
  http.Client? _client;

  @override void dispose() { _nameCtrl.dispose(); _client?.close(); super.dispose(); }

  Future<String?> _tok() async => (await SharedPreferences.getInstance()).getString('accessToken');

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null || !mounted) return;
    final bytes = await picked.readAsBytes();
    setState(() {
      _imgBytes = bytes;
      _imgFile = kIsWeb ? null : File(picked.path);
      _imgName = picked.name;
      _result = null; _showBlend = false; _sliders = []; _blendName = ''; _savedOk = false;
    });
  }

  Future<void> _analyze() async {
    if (_imgBytes == null && _imgFile == null) return;
    setState(() { _loading = true; _error = null; _result = null; _showBlend = false; _sliders = []; });
    _client?.close(); _client = http.Client();
    try {
      final req = http.MultipartRequest('POST', Uri.parse('${ApiConfig.baseUrl}/api/ai/image-to-scent'));
      if (kIsWeb && _imgBytes != null) {
        req.files.add(http.MultipartFile.fromBytes('image', _imgBytes!, filename: _imgName ?? 'image.jpg',
          contentType: MediaType('image', 'jpeg')));
      } else if (_imgFile != null) {
        final ext = _imgFile!.path.split('.').last.toLowerCase();
        req.files.add(await http.MultipartFile.fromPath('image', _imgFile!.path,
          contentType: MediaType('image', ext == 'png' ? 'png' : 'jpeg')));
      }
      final streamed = await _client!.send(req);
      final res = await http.Response.fromStream(streamed);
      if (res.statusCode == 200) {
        final json = jsonDecode(utf8.decode(res.bodyBytes));
        final data = json['data'] ?? json;
        if (mounted) { setState(() { _result = data; }); _initSliders(data); }
      } else { if (mounted) setState(() => _error = '분석 실패 (${res.statusCode})'); }
    } catch (e) { if (mounted) setState(() => _error = '네트워크 오류'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  void _initSliders(Map<String, dynamic> data) {
    final sliders = <_BlendSlider>[];
    for (final n in (data['topNotes'] as List? ?? [])) sliders.add(_BlendSlider(name: n['name'], noteType: 'top', ratio: ((n['ratio'] as num?)?.toDouble() ?? 0) * 100));
    for (final n in (data['middleNotes'] as List? ?? [])) sliders.add(_BlendSlider(name: n['name'], noteType: 'middle', ratio: ((n['ratio'] as num?)?.toDouble() ?? 0) * 100));
    for (final n in (data['baseNotes'] as List? ?? [])) sliders.add(_BlendSlider(name: n['name'], noteType: 'base', ratio: ((n['ratio'] as num?)?.toDouble() ?? 0) * 100));
    if (sliders.isEmpty) return;
    setState(() { _sliders = sliders; if (data['mood'] != null) { _blendName = '${data['mood']} 향수'; _nameCtrl.text = _blendName; } });
  }

  Future<void> _requestEval() async {
    if (_sliders.isEmpty) return;
    setState(() => _evalLoading = true);
    try {
      snap(String t) => _sliders.where((s) => s.noteType == t).map((s) => {'ingredientName': s.name, 'ratio': s.ratio / 100}).toList();
      final res = await http.post(Uri.parse('${ApiConfig.baseUrl}/api/ai/gemini-evaluate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'previousRecipe': null, 'currentRecipe': {'topNotes': snap('top'), 'middleNotes': snap('middle'), 'baseNotes': snap('base')}}));
      if (res.statusCode == 200) { final j = jsonDecode(utf8.decode(res.bodyBytes)); if (mounted) setState(() => _evaluation = j['data']?.toString()); }
    } catch (_) {} finally { if (mounted) setState(() => _evalLoading = false); }
  }

  Future<void> _saveBlend() async {
    final tok = await _tok();
    if (tok == null) { Navigator.pushNamed(context, '/login'); return; }
    if (_blendName.trim().isEmpty) { _snack('향 이름을 입력해주세요'); return; }
    setState(() => _saving = true);
    try {
      final sum = _sliders.fold<double>(0, (s, i) => s + i.ratio);
      final items = _sliders.map((s) => {'ingredientName': s.name, 'type': s.noteType.toUpperCase(), 'ratio': sum > 0 ? (s.ratio / sum * 100) : 0.0}).toList();
      final res = await http.post(Uri.parse('${ApiConfig.baseUrl}/api/custom/scent-blends'),
        headers: {'Authorization': 'Bearer $tok', 'Content-Type': 'application/json'},
        body: jsonEncode({'name': _blendName.trim(), 'concentration': 'EDP', 'volumeMl': 50, 'totalPrice': 0, 'ingredients': items}));
      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() => _savedOk = true);
        await Future.delayed(const Duration(milliseconds: 800));
        widget.onSaved?.call();
      } else { _snack('저장에 실패했습니다.'); }
    } catch (_) { _snack('네트워크 오류'); } finally { if (mounted) setState(() => _saving = false); }
  }

  void _reset() {
    _client?.close();
    setState(() { _result = null; _imgFile = null; _imgBytes = null; _imgName = null; _error = null;
      _showBlend = false; _sliders = []; _blendName = ''; _nameCtrl.clear(); _savedOk = false; _evaluation = null; });
  }

  void _snack(String m) { if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m, style: const TextStyle(color: _gold)), backgroundColor: _dark, behavior: SnackBarBehavior.floating)); }

  @override
  Widget build(BuildContext ctx) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      // 헤더
      Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.2))),
        child: const Column(children: [
          Text('AI SOMMELIER', style: TextStyle(fontSize: 9, letterSpacing: 6, color: _gold)),
          SizedBox(height: 4),
          Text('이미지로 향수 찾기', style: TextStyle(fontSize: 14, letterSpacing: 2, color: _dark, fontWeight: FontWeight.w300)),
          SizedBox(height: 4),
          Text('사진 속 분위기에 어울리는 기성 향수를 추천하고, 직접 조향도 할 수 있습니다',
            textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: _grey, fontStyle: FontStyle.italic)),
        ])),
      const SizedBox(height: 16),

      // 이미지 영역
      if (_imgBytes == null && _imgFile == null)
        GestureDetector(onTap: _pickImage,
          child: Container(height: 200, decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.3), width: 1.5, style: BorderStyle.solid), color: Colors.white),
            child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.add_photo_alternate_outlined, color: _gold, size: 40),
              SizedBox(height: 8),
              Text('이미지를 탭하여 업로드', style: TextStyle(fontSize: 12, color: _grey, letterSpacing: 2)),
              SizedBox(height: 4),
              Text('JPG, PNG, WEBP · 최대 10MB', style: TextStyle(fontSize: 9, color: _cream)),
            ])))
      else
        Stack(children: [
          Container(height: 220, width: double.infinity,
            child: kIsWeb && _imgBytes != null
              ? Image.memory(_imgBytes!, fit: BoxFit.contain)
              : Image.file(_imgFile!, fit: BoxFit.contain)),
          Positioned(top: 8, right: 8, child: GestureDetector(onTap: () => setState(() { _imgFile = null; _imgBytes = null; }),
            child: Container(width: 28, height: 28, color: Colors.white.withOpacity(0.9),
              child: const Icon(Icons.close, size: 16, color: _grey)))),
        ]),
      const SizedBox(height: 12),

      if (_error != null) Text(_error!, style: const TextStyle(fontSize: 11, color: Colors.redAccent)),

      // 분석 버튼
      if (_result == null && (_imgBytes != null || _imgFile != null))
        ElevatedButton.icon(
          onPressed: _loading ? null : _analyze,
          icon: _loading ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 1.5, color: _gold))
            : const Icon(Icons.auto_awesome_outlined, size: 14),
          label: Text(_loading ? 'ANALYZING...' : 'AI 향수 분석 시작',
            style: const TextStyle(fontSize: 11, letterSpacing: 2)),
          style: ElevatedButton.styleFrom(backgroundColor: _dark, foregroundColor: _gold,
            shape: const RoundedRectangleBorder(), padding: const EdgeInsets.symmetric(vertical: 14))),

      // 분석 결과
      if (_result != null) ...[
        const SizedBox(height: 16),
        // 분위기 카드
        Container(padding: const EdgeInsets.all(16), color: _dark, child: Column(children: [
          const Text('AI ANALYSIS', style: TextStyle(fontSize: 9, letterSpacing: 4, color: _gold)),
          const SizedBox(height: 8),
          Text(_result!['mood'] ?? '', style: const TextStyle(fontSize: 15, color: Colors.white, letterSpacing: 1)),
          const SizedBox(height: 8),
          Text(_result!['analysisText'] ?? '', textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: Colors.white60, height: 1.6, fontStyle: FontStyle.italic)),
        ])),
        const SizedBox(height: 12),

        // 노트 3컬럼
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          for (final entry in [
            ('TOP NOTE', 'topNotes'), ('MIDDLE NOTE', 'middleNotes'), ('BASE NOTE', 'baseNotes')
          ]) Expanded(child: Container(
            margin: const EdgeInsets.only(right: 6),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(entry.$1, style: const TextStyle(fontSize: 8, letterSpacing: 2, color: _gold)),
              const SizedBox(height: 6),
              for (final n in (_result![entry.$2] as List? ?? []))
                Padding(padding: const EdgeInsets.only(bottom: 3),
                  child: Text(n['name']?.toString() ?? '', style: const TextStyle(fontSize: 10, color: _dark))),
            ])))]),
        const SizedBox(height: 12),

        // 직접 조향하기 버튼
        if (!_showBlend) OutlinedButton.icon(
          onPressed: () { setState(() => _showBlend = true); _requestEval(); },
          icon: const Icon(Icons.tune, size: 13, color: _gold),
          label: const Text('이 향수로 직접 조향하기', style: TextStyle(fontSize: 11, letterSpacing: 2, color: _gold)),
          style: OutlinedButton.styleFrom(side: const BorderSide(color: _gold), shape: const RoundedRectangleBorder(),
            padding: const EdgeInsets.symmetric(vertical: 12))),

        // 조향 슬라이더 패널
        if (_showBlend && _sliders.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildBlendPanel(),
        ],

        // 추천 향수
        if ((_result!['recommendedPerfumes'] as List? ?? []).isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('RECOMMENDED FOR YOU', style: TextStyle(fontSize: 9, letterSpacing: 4, color: _grey)),
          const SizedBox(height: 8),
          for (final p in (_result!['recommendedPerfumes'] as List))
            Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _cream)),
              child: Row(children: [
                Container(width: 48, height: 48, color: const Color(0xFFF0ECE4),
                  child: p['imageUrl'] != null ? Image.network(p['imageUrl'], fit: BoxFit.cover, errorBuilder: (_,__,___) => const SizedBox()) : const SizedBox()),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(p['name'] ?? '', style: const TextStyle(fontSize: 12, color: _dark)),
                  Text(p['brand'] ?? '', style: const TextStyle(fontSize: 10, color: _gold, fontStyle: FontStyle.italic)),
                ])),
                Text('₩${_f(p['price'] ?? 0)}', style: const TextStyle(fontSize: 11, color: _gold)),
              ])),
        ],

        const SizedBox(height: 12),
        OutlinedButton.icon(onPressed: _reset,
          icon: const Icon(Icons.refresh, size: 12, color: _grey),
          label: const Text('다시 분석하기', style: TextStyle(fontSize: 11, color: _grey)),
          style: OutlinedButton.styleFrom(side: const BorderSide(color: _cream), shape: const RoundedRectangleBorder())),
      ],
    ]);
  }

  Widget _buildBlendPanel() {
    final total = _sliders.fold<double>(0, (s, i) => s + i.ratio);
    final isBalanced = (total - 100).abs() < 2;
    return Container(
      decoration: BoxDecoration(color: _dark, border: Border.all(color: _gold.withOpacity(0.3))),
      child: Column(children: [
        // 헤더
        Padding(padding: const EdgeInsets.all(14), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('MY BLEND RECIPE', style: TextStyle(fontSize: 9, letterSpacing: 4, color: _gold)),
            const Text('비율 미세 조율', style: TextStyle(fontSize: 13, color: Colors.white, letterSpacing: 1)),
          ]),
          Row(children: [
            Text('합계 ${total.round()}%', style: TextStyle(fontSize: 10, color: isBalanced ? _gold : Colors.redAccent)),
            const SizedBox(width: 8),
            GestureDetector(onTap: () => setState(() => _showBlend = false),
              child: const Icon(Icons.close, size: 16, color: Colors.white54)),
          ]),
        ])),

        // 슬라이더 목록
        ConstrainedBox(constraints: const BoxConstraints(maxHeight: 320),
          child: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              for (final noteType in ['top', 'middle', 'base']) ...[
                if (_sliders.any((s) => s.noteType == noteType)) ...[
                  Padding(padding: const EdgeInsets.only(bottom: 6, top: 4),
                    child: Text({'top': 'TOP', 'middle': 'MIDDLE', 'base': 'BASE'}[noteType]! + ' NOTE',
                      style: TextStyle(fontSize: 9, letterSpacing: 3, color: _gold.withOpacity(0.5)))),
                  for (int i = 0; i < _sliders.length; i++) if (_sliders[i].noteType == noteType)
                    Padding(padding: const EdgeInsets.only(bottom: 10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Text(_sliders[i].name, style: const TextStyle(fontSize: 11, color: Colors.white70)),
                        Text('${_sliders[i].ratio.round()}%', style: const TextStyle(fontSize: 11, color: _gold)),
                      ]),
                      SliderTheme(data: SliderTheme.of(context).copyWith(
                        activeTrackColor: _gold, inactiveTrackColor: Colors.white10,
                        thumbColor: _gold, thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6), trackHeight: 3),
                        child: Slider(min: 0, max: 100, divisions: 100, value: _sliders[i].ratio,
                          onChanged: (v) { setState(() => _sliders[i].ratio = v); Future.delayed(const Duration(milliseconds: 1200), _requestEval); })),
                    ])),
                ],
              ],
            ]))),

        // Gemini 평가
        if (_evalLoading || (_evaluation != null && _evaluation!.isNotEmpty))
          Container(margin: const EdgeInsets.fromLTRB(14, 0, 14, 12), padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.2))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('GEMINI EVALUATION', style: TextStyle(fontSize: 9, letterSpacing: 3, color: _gold)),
              const SizedBox(height: 6),
              if (_evalLoading) const Row(children: [SizedBox(width: 12, height: 12, child: CircularProgressIndicator(color: _gold, strokeWidth: 1.2)), SizedBox(width: 8), Text('평가 중...', style: TextStyle(fontSize: 10, color: _grey))])
              else if (_evaluation != null) Text(_evaluation!, style: const TextStyle(fontSize: 11, color: Colors.white60, height: 1.5, fontStyle: FontStyle.italic)),
            ])),

        // 이름 입력 + 저장 버튼
        Padding(padding: const EdgeInsets.fromLTRB(14, 0, 14, 14), child: Column(children: [
          TextField(controller: _nameCtrl, onChanged: (v) => setState(() => _blendName = v),
            style: const TextStyle(fontSize: 13, color: Colors.white),
            decoration: const InputDecoration(hintText: '나만의 향 이름을 입력하세요', hintStyle: TextStyle(color: Colors.white30, fontSize: 12),
              enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
              focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _gold)), isDense: true)),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: (_saving || _savedOk || _blendName.trim().isEmpty) ? null : _saveBlend,
            icon: _savedOk ? const Icon(Icons.check, size: 13) : _saving
              ? const SizedBox(width: 13, height: 13, child: CircularProgressIndicator(strokeWidth: 1.5, color: _dark))
              : const Icon(Icons.add, size: 13),
            label: Text(_savedOk ? '저장됨' : _saving ? '저장 중...' : '향 조합에 추가하기',
              style: const TextStyle(fontSize: 11, letterSpacing: 2)),
            style: ElevatedButton.styleFrom(
              backgroundColor: _savedOk ? const Color(0xFF2a6049) : _gold,
              foregroundColor: _savedOk ? const Color(0xFFC9E8D5) : _dark,
              shape: const RoundedRectangleBorder(), padding: const EdgeInsets.symmetric(vertical: 12),
              disabledBackgroundColor: _gold.withOpacity(0.3)))),
        ])),
      ]),
    );
  }

  String _f(dynamic v) { final n = (v is int) ? v : int.tryParse(v.toString()) ?? 0;
    return n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},'); }
}

class _BlendSlider { final String name, noteType; double ratio;
  _BlendSlider({required this.name, required this.noteType, required this.ratio}); }