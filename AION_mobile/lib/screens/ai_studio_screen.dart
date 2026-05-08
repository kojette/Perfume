import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'scent_blend_screen.dart';
import 'gemini_panel.dart';
import 'claude_panel.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF1A1A1A);
const _grey = Color(0xFF8B8278);

class AiScentStudioScreen extends StatefulWidget {
  const AiScentStudioScreen({super.key});
  @override State<AiScentStudioScreen> createState() => _AiScentStudioState();
}

class _AiScentStudioState extends State<AiScentStudioScreen> {
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _restoreTab();
  }

  Future<void> _restoreTab() async {
    final p = await SharedPreferences.getInstance();
    final t = p.getInt('studio_tab') ?? 0;
    if (mounted) setState(() => _tab = t);
  }

  void _setTab(int t) async {
    setState(() => _tab = t);
    final p = await SharedPreferences.getInstance();
    await p.setInt('studio_tab', t);
  }

  @override
  Widget build(BuildContext ctx) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F3),
      body: SafeArea(child: Column(children: [
        // 헤더
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          color: Colors.white,
          child: Column(children: [
            Stack(alignment: Alignment.center, children: [
              Align(alignment: Alignment.centerLeft,
                child: GestureDetector(onTap: () => Navigator.pop(ctx),
                  child: Icon(Icons.arrow_back_ios, size: 16, color: _grey.withOpacity(0.6)))),
              const Text('AI SCENT STUDIO', style: TextStyle(fontSize: 9, letterSpacing: 5, color: _gold, fontStyle: FontStyle.italic)),
            ]),
            const SizedBox(height: 8),
            // 탭 바 (프론트와 동일 3탭)
            Container(
              decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.3))),
              child: Row(children: [
                _tabBtn(0, Icons.science_outlined, '향 조합하기', 'My Scent Lab'),
                Container(width: 0.5, color: _gold.withOpacity(0.2)),
                _tabBtn(1, Icons.camera_alt_outlined, 'AI 소믈리에', 'Gemini Vision'),
                Container(width: 0.5, color: _gold.withOpacity(0.2)),
                _tabBtn(2, Icons.chat_bubble_outline, 'AI 조향사', 'Claude Chat'),
              ]),
            ),
            const SizedBox(height: 12),
          ]),
        ),

        // 탭 컨텐츠 — display:none 방식과 동일하게 IndexedStack 사용 (상태 보존)
        Expanded(child: IndexedStack(index: _tab, children: [
          // 탭 0: 향 조합하기
          const ScentBlendScreen(),
          // 탭 1: AI 소믈리에 (Gemini)
          GeminiPanel(onSaved: () => _setTab(0)),
          // 탭 2: AI 조향사 (Claude)
          const ClaudePanel(),
        ])),
      ])),
    );
  }

  Widget _tabBtn(int idx, IconData icon, String label, String sub) {
    final active = _tab == idx;
    return Expanded(child: GestureDetector(
      onTap: () => _setTab(idx),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(vertical: 10),
        color: active ? _dark : Colors.white,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 11, color: active ? _gold : _grey),
            const SizedBox(width: 5),
            Text(label, style: TextStyle(fontSize: 10, letterSpacing: 1, color: active ? _gold : _grey)),
          ]),
          const SizedBox(height: 3),
          Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            color: active ? _gold.withOpacity(0.2) : const Color(0xFFF0ECE4),
            child: Text(sub, style: TextStyle(fontSize: 8, color: active ? _gold : _grey))),
        ]),
      ),
    ));
  }
}