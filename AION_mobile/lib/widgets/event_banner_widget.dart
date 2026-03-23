import 'package:flutter/material.dart';
import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';

class EventBannerWidget extends StatefulWidget {
  const EventBannerWidget({super.key});

  @override
  State<EventBannerWidget> createState() => _EventBannerWidgetState();
}

class _EventBannerWidgetState extends State<EventBannerWidget> {
  List<Map<String, String>> _banners = [];
  Color _bgColor = const Color(0xFFC9A961);
  Color _textColor = const Color(0xFF2A2620);
  int _currentIdx = 0;
  Timer? _timer;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadBanner();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadBanner() async {
    try {
      final supabase = Supabase.instance.client;

      final data = await supabase
          .from('banner_history')
          .select('*, banner_items(text, icon)')
          .eq('is_active', true)
          .limit(1);

      if (data != null && (data as List).isNotEmpty) {
        final item = data[0];
        final items = item['banner_items'] as List? ?? [];

        if (items.isNotEmpty) {
          setState(() {
            _banners = items
                .map<Map<String, String>>((b) => {
                      'text': b['text'] ?? '',
                      'icon': b['icon'] ?? '',
                    })
                .toList();

            // 색상 파싱
            _bgColor = _parseColor(item['bg_color'], const Color(0xFFC9A961));
            _textColor = _parseColor(item['text_color'], const Color(0xFF2A2620));
          });

          // 여러 배너면 5초마다 슬라이드
          if (_banners.length > 1) {
            _timer = Timer.periodic(const Duration(seconds: 5), (_) {
              if (mounted) {
                setState(() {
                  _currentIdx = (_currentIdx + 1) % _banners.length;
                });
              }
            });
          }
        }
      }
    } catch (e) {
      debugPrint('배너 로드 오류: $e');
      // fallback 기본 배너
      setState(() {
        _banners = [
          {'text': '회원가입 시 10% 할인 쿠폰 지급', 'icon': '🎁'}
        ];
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _parseColor(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    try {
      final cleaned = hex.replaceAll('#', '');
      return Color(int.parse('FF$cleaned', radix: 16));
    } catch (_) {
      return fallback;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _banners.isEmpty) return const SizedBox.shrink();

    final banner = _banners[_currentIdx];

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: double.infinity,
      height: 40,
      color: _bgColor,
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (banner['icon']?.isNotEmpty == true) ...[
              Text(banner['icon']!, style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 8),
            ],
            Text(
              banner['text'] ?? '',
              style: TextStyle(
                color: _textColor,
                fontSize: 12,
                letterSpacing: 1.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}