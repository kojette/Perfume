import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class NotificationPanelScreen extends StatefulWidget {
  const NotificationPanelScreen({super.key});

  @override
  State<NotificationPanelScreen> createState() =>
      _NotificationPanelScreenState();
}

class _NotificationPanelScreenState extends State<NotificationPanelScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  List<Map<String, dynamic>> _announcements = [];
  List<Map<String, dynamic>> _events = [];
  // key: event_id, value: {participated, won, participated_at}
  Map<String, Map<String, dynamic>> _participations = {};
  Map<String, bool> _loading = {};

  String _userEmail = '';
  bool _isLoggedIn = false;
  String? _accessToken;

  // 브랜드 색상
  static const Color kGold = Color(0xFFC9A961);
  static const Color kDarkText = Color(0xFF2A2620);
  static const Color kMutedText = Color(0xFF8B8278);
  static const Color kBackground = Color(0xFFFAF8F3);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSession();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userEmail = prefs.getString('userEmail') ?? '';
      _isLoggedIn = prefs.getBool('isLoggedIn') ?? false;
      _accessToken = prefs.getString('accessToken');
    });
    await _fetchAnnouncements();
    await _fetchEvents();
    if (_isLoggedIn) {
      await _fetchParticipations();
    }
  }

  Future<void> _fetchAnnouncements() async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    try {
      final data = await Supabase.instance.client
          .from('Announcements')
          .select('*')
          .or('start_date.is.null,start_date.lte.$today')
          .or('end_date.is.null,end_date.gte.$today')
          .order('is_pinned', ascending: false)
          .order('is_important', ascending: false)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _announcements = List<Map<String, dynamic>>.from(data);
        });
      }
    } catch (e) {
      debugPrint('공지사항 로드 실패: $e');
    }
  }

  Future<void> _fetchEvents() async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    try {
      final data = await Supabase.instance.client
          .from('Events')
          .select('*')
          .lte('start_date', today)
          .gte('end_date', today)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _events = List<Map<String, dynamic>>.from(data);
        });
      }
    } catch (e) {
      debugPrint('이벤트 로드 실패: $e');
    }
  }

  Future<void> _fetchParticipations() async {
    try {
      final data = await Supabase.instance.client
          .from('EventParticipations')
          .select('*')
          .eq('user_email', _userEmail);

      final map = <String, Map<String, dynamic>>{};
      for (final p in data) {
        map[p['event_id'].toString()] = {
          'participated': true,
          'won': p['won'],
          'participated_at': p['participated_at'],
        };
      }
      if (mounted) {
        setState(() {
          _participations = map;
        });
      }
    } catch (e) {
      debugPrint('참여 이력 로드 실패: $e');
    }
  }

  Future<void> _handleParticipate(Map<String, dynamic> event) async {
    if (!_isLoggedIn || _accessToken == null) {
      _showAlert('로그인이 필요한 서비스입니다.');
      return;
    }

    final eventId = event['id'].toString();

    if (_participations[eventId]?['participated'] == true) {
      _showAlert('이미 참여한 이벤트입니다!');
      return;
    }

    setState(() => _loading[eventId] = true);

    try {
      const baseUrl = String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://localhost:8080',
      );
      final uri = Uri.parse('$baseUrl/api/events/$eventId/participate');
      final response = await http.post(
        uri,
        headers: {
          'Authorization': 'Bearer $_accessToken',
          'Content-Type': 'application/json',
        },
      );

      if (!mounted) return;

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorData = jsonDecode(response.body);
        _showAlert(errorData['message'] ?? '이벤트 참여 중 오류가 발생했습니다.');
        return;
      }

      final result = jsonDecode(response.body);
      final won = result['data']['won'] as bool;

      await _fetchParticipations();

      if (mounted) {
        _showResultModal(event: event, won: won);
      }
    } catch (e) {
      debugPrint('참여 처리 중 오류: $e');
      if (mounted) _showAlert('서버와 통신할 수 없습니다.');
    } finally {
      if (mounted) setState(() => _loading[eventId] = false);
    }
  }

  void _showAlert(String message) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }

  void _showResultModal({
    required Map<String, dynamic> event,
    required bool won,
  }) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => _ResultModal(event: event, won: won),
    );
  }

  // ─── 이벤트 타입 헬퍼 ────────────────────────────────────────────────────────

  String _getEventTypeLabel(String? type) {
    const types = {
      'COUPON': '쿠폰 발행',
      'DISCOUNT': '상품 할인',
      'POINT': '포인트 지급',
    };
    return types[type] ?? (type ?? '');
  }

  Color _getEventTypeColor(String? type) {
    const colors = {
      'COUPON': Colors.blue,
      'DISCOUNT': Colors.red,
      'POINT': Colors.green,
    };
    return colors[type] ?? Colors.grey;
  }

  // ─── BUILD ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      appBar: AppBar(
        backgroundColor: kBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: kMutedText),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          '알림',
          style: TextStyle(
            color: kDarkText,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: _buildTabBar(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _AnnouncementsTab(announcements: _announcements),
          _EventsTab(
            events: _events,
            participations: _participations,
            loading: _loading,
            isLoggedIn: _isLoggedIn,
            onParticipate: _handleParticipate,
            getEventTypeLabel: _getEventTypeLabel,
            getEventTypeColor: _getEventTypeColor,
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: kGold.withOpacity(0.2)),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: kGold,
          borderRadius: BorderRadius.circular(3),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: kMutedText,
        labelStyle: const TextStyle(
          fontSize: 12,
          letterSpacing: 1.0,
          fontWeight: FontWeight.w500,
        ),
        tabs: const [
          Tab(text: '공지사항'),
          Tab(text: '이벤트'),
        ],
      ),
    );
  }
}

// ─── 공지사항 탭 ──────────────────────────────────────────────────────────────

class _AnnouncementsTab extends StatelessWidget {
  final List<Map<String, dynamic>> announcements;
  const _AnnouncementsTab({required this.announcements});

  static const Color kGold = Color(0xFFC9A961);
  static const Color kDarkText = Color(0xFF2A2620);
  static const Color kMutedText = Color(0xFF8B8278);

  @override
  Widget build(BuildContext context) {
    if (announcements.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.notifications_none,
                size: 48, color: kMutedText.withOpacity(0.3)),
            const SizedBox(height: 12),
            const Text(
              '등록된 공지사항이 없습니다.',
              style: TextStyle(
                color: kMutedText,
                fontSize: 13,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: announcements.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _AnnouncementCard(item: announcements[i]),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final Map<String, dynamic> item;
  const _AnnouncementCard({required this.item});

  static const Color kGold = Color(0xFFC9A961);
  static const Color kDarkText = Color(0xFF2A2620);
  static const Color kMutedText = Color(0xFF8B8278);

  @override
  Widget build(BuildContext context) {
    final isPinned = item['is_pinned'] == true;
    final isImportant = item['is_important'] == true;
    final startDate = item['start_date'] as String?;
    final endDate = item['end_date'] as String?;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: kGold.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 배지 행
          Row(
            children: [
              if (isPinned) ...[
                _Badge(label: '고정', icon: Icons.push_pin, color: kGold),
                const SizedBox(width: 6),
              ],
              if (isImportant)
                _Badge(
                  label: '중요',
                  icon: Icons.error_outline,
                  color: Colors.red,
                ),
            ],
          ),
          if (isPinned || isImportant) const SizedBox(height: 8),

          // 제목
          Text(
            item['title'] ?? '',
            style: const TextStyle(
              color: kDarkText,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),

          // 내용
          Text(
            item['content'] ?? '',
            style: const TextStyle(
              color: Color(0xFF555555),
              fontSize: 11,
              height: 1.5,
            ),
          ),

          // 날짜
          if (startDate != null || endDate != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 10, color: kMutedText),
                const SizedBox(width: 4),
                Text(
                  '${startDate ?? '상시'} ~ ${endDate ?? '상시'}',
                  style: const TextStyle(fontSize: 9, color: kMutedText),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ─── 이벤트 탭 ────────────────────────────────────────────────────────────────

class _EventsTab extends StatelessWidget {
  final List<Map<String, dynamic>> events;
  final Map<String, Map<String, dynamic>> participations;
  final Map<String, bool> loading;
  final bool isLoggedIn;
  final Future<void> Function(Map<String, dynamic>) onParticipate;
  final String Function(String?) getEventTypeLabel;
  final Color Function(String?) getEventTypeColor;

  const _EventsTab({
    required this.events,
    required this.participations,
    required this.loading,
    required this.isLoggedIn,
    required this.onParticipate,
    required this.getEventTypeLabel,
    required this.getEventTypeColor,
  });

  static const Color kMutedText = Color(0xFF8B8278);

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.card_giftcard,
                size: 48, color: kMutedText.withOpacity(0.3)),
            const SizedBox(height: 12),
            const Text(
              '진행 중인 이벤트가 없습니다.',
              style: TextStyle(
                color: kMutedText,
                fontSize: 13,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final event = events[i];
        final eventId = event['id'].toString();
        return _EventCard(
          event: event,
          participation: participations[eventId],
          isLoading: loading[eventId] ?? false,
          onParticipate: () => onParticipate(event),
          getEventTypeLabel: getEventTypeLabel,
          getEventTypeColor: getEventTypeColor,
        );
      },
    );
  }
}

class _EventCard extends StatelessWidget {
  final Map<String, dynamic> event;
  final Map<String, dynamic>? participation;
  final bool isLoading;
  final VoidCallback onParticipate;
  final String Function(String?) getEventTypeLabel;
  final Color Function(String?) getEventTypeColor;

  const _EventCard({
    required this.event,
    required this.participation,
    required this.isLoading,
    required this.onParticipate,
    required this.getEventTypeLabel,
    required this.getEventTypeColor,
  });

  static const Color kGold = Color(0xFFC9A961);
  static const Color kDarkText = Color(0xFF2A2620);
  static const Color kMutedText = Color(0xFF8B8278);
  static const Color kBackground = Color(0xFFFAF8F3);

  bool get hasParticipated => participation?['participated'] == true;
  bool get hasWon => participation?['won'] == true;

  @override
  Widget build(BuildContext context) {
    final eventType = event['event_type'] as String?;
    final priorityBuyers = event['priority_buyers'] == true;
    final discountRate = event['discount_rate'];
    final pointAmount = event['point_amount'];
    final maxParticipants = event['max_participants'];
    final winProbability = event['win_probability'];
    final couponCode = event['coupon_code'];

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, kBackground],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kGold.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 배지 행
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                _Badge(
                  label: getEventTypeLabel(eventType),
                  icon: Icons.card_giftcard,
                  color: getEventTypeColor(eventType),
                ),
                if (priorityBuyers)
                  const _Badge(
                    label: '구매자 우선',
                    icon: Icons.star,
                    color: Colors.purple,
                  ),
                if (hasParticipated)
                  _Badge(
                    label: hasWon ? '🎉 당첨!' : '참여 완료',
                    color: hasWon ? Colors.green : Colors.grey,
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // 이벤트 제목
            Text(
              event['title'] ?? '',
              style: const TextStyle(
                color: kDarkText,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),

            // 설명
            Text(
              event['description'] ?? '',
              style: const TextStyle(
                color: Color(0xFF555555),
                fontSize: 11,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 10),

            // 상세 정보 박스
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                children: [
                  _InfoRow(
                    label: '기간',
                    value: '${event['start_date']} ~ ${event['end_date']}',
                  ),
                  if (eventType == 'COUPON' && couponCode != null)
                    _InfoRow(
                      label: '쿠폰 코드',
                      value: couponCode.toString(),
                      valueColor: kGold,
                      isMono: true,
                    ),
                  if (discountRate != null && (discountRate as num) > 0)
                    _InfoRow(
                      label: '할인율',
                      value: '$discountRate%',
                      valueColor: Colors.red,
                    ),
                  if (pointAmount != null && (pointAmount as num) > 0)
                    _InfoRow(
                      label: '포인트',
                      value: '${pointAmount}P',
                      valueColor: Colors.green,
                    ),
                  if (maxParticipants != null)
                    _InfoRow(
                      label: '참여 제한',
                      value: '${maxParticipants}명',
                    ),
                  if (winProbability != null &&
                      (winProbability as num) < 100)
                    _InfoRow(
                      label: '당첨 확률',
                      value: '$winProbability%',
                      valueColor: Colors.orange,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // 참여 버튼
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (hasParticipated || isLoading)
                    ? null
                    : onParticipate,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      hasParticipated ? Colors.grey[300] : kGold,
                  disabledBackgroundColor:
                      hasParticipated ? Colors.grey[300] : kGold.withOpacity(0.5),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  elevation: 0,
                ),
                child: isLoading
                    ? const SizedBox(
                        height: 14,
                        width: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        hasParticipated ? '참여 완료' : '참여하기',
                        style: TextStyle(
                          fontSize: 10,
                          letterSpacing: 1.2,
                          color: hasParticipated
                              ? Colors.grey[600]
                              : Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── 결과 모달 ────────────────────────────────────────────────────────────────

class _ResultModal extends StatelessWidget {
  final Map<String, dynamic> event;
  final bool won;

  const _ResultModal({required this.event, required this.won});

  static const Color kGold = Color(0xFFC9A961);

  @override
  Widget build(BuildContext context) {
    final eventType = event['event_type'] as String?;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 아이콘
            won
                ? const Icon(Icons.celebration,
                    size: 64, color: kGold)
                : const Icon(Icons.sentiment_dissatisfied,
                    size: 64, color: Colors.grey),
            const SizedBox(height: 16),

            // 제목
            Text(
              won ? '축하합니다! 🎉' : '아쉽네요 😢',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: won ? kGold : Colors.grey[700],
              ),
            ),
            const SizedBox(height: 10),

            // 메시지
            Text(
              won
                  ? '${event['title']}에 당첨되셨습니다!'
                  : '아쉽게도 당첨되지 않았습니다.\n다음 기회에! 😊',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF555555),
                fontSize: 13,
                height: 1.5,
              ),
            ),

            // 당첨 혜택
            if (won) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFAF8F3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '당첨 혜택',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2A2620),
                      ),
                    ),
                    const SizedBox(height: 6),
                    if (eventType == 'COUPON')
                      Text.rich(
                        TextSpan(
                          text: '쿠폰 코드: ',
                          style: const TextStyle(fontSize: 11),
                          children: [
                            TextSpan(
                              text: event['coupon_code']?.toString() ?? '',
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                color: kGold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (eventType == 'DISCOUNT')
                      Text.rich(
                        TextSpan(
                          text: '할인율: ',
                          style: const TextStyle(fontSize: 11),
                          children: [
                            TextSpan(
                              text: '${event['discount_rate']}%',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (eventType == 'POINT')
                      Text.rich(
                        TextSpan(
                          text: '포인트: ',
                          style: const TextStyle(fontSize: 11),
                          children: [
                            TextSpan(
                              text: '${event['point_amount']}P',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: kGold,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  elevation: 0,
                ),
                child: const Text(
                  '확인',
                  style: TextStyle(fontSize: 13, letterSpacing: 1.2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── 공통 위젯 ────────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color color;

  const _Badge({required this.label, this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 9, color: Colors.white),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool isMono;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isMono = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF8B8278),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: valueColor ?? const Color(0xFF2A2620),
              fontFamily: isMono ? 'monospace' : null,
            ),
          ),
        ],
      ),
    );
  }
}