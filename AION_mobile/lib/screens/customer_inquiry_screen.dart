import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class CustomerInquiryScreen extends StatefulWidget {
  const CustomerInquiryScreen({super.key});

  @override
  State<CustomerInquiryScreen> createState() => _CustomerInquiryScreenState();
}

class _CustomerInquiryScreenState extends State<CustomerInquiryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  String? selectedType;
  final titleController = TextEditingController();
  final contentController = TextEditingController();

  List<Map<String, dynamic>> myInquiries = [];
  int notifications = 0;

  bool _submitting = false;
  bool _loadingList = false;

  final List<Map<String, String>> inquiryTypes = [
    {'value': 'product', 'label': '상품문의', 'icon': '🛍️'},
    {'value': 'delivery', 'label': '배송문의', 'icon': '🚚'},
    {'value': 'refund', 'label': '환불문의', 'icon': '💰'},
    {'value': 'site', 'label': '사이트문의', 'icon': '🌐'},
    {'value': 'company', 'label': '회사문의', 'icon': '🏢'},
    {'value': 'newProduct', 'label': '신제품문의', 'icon': '✨'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _checkLoginAndFetch();
  }

  @override
  void dispose() {
    _tabController.dispose();
    titleController.dispose();
    contentController.dispose();
    super.dispose();
  }

  // ────────────────────────────────────────────────────────────
  // 토큰 헬퍼 — 백엔드 API용 (Bearer token)
  // 다른 화면들과 동일하게 SharedPreferences 사용
  // ────────────────────────────────────────────────────────────
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  Map<String, String> _authHeaders(String token) => {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json; charset=utf-8',
  };

  Future<void> _checkLoginAndFetch() async {
    final token = await _getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      _snack('로그인이 필요합니다');
      Navigator.of(context).pop();
      return;
    }
    await _fetchMyInquiries();
  }

  // ────────────────────────────────────────────────────────────
  // 내 문의 목록 — GET /api/inquiries/my
  // ────────────────────────────────────────────────────────────
  Future<void> _fetchMyInquiries() async {
    final token = await _getToken();
    if (token == null || token.isEmpty) return;

    if (mounted) setState(() => _loadingList = true);

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/inquiries/my'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(utf8.decode(response.bodyBytes));
        final List data = (json['data'] as List?) ?? const [];
        if (!mounted) return;
        setState(() {
          myInquiries = data.cast<Map<String, dynamic>>();
          notifications = myInquiries
              .where((inq) => inq['status'] == 'completed' && inq['read'] == false)
              .length;
        });
      } else {
        debugPrint('문의 내역 조회 실패: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('데이터 로드 에러: $e');
    } finally {
      if (mounted) setState(() => _loadingList = false);
    }
  }

  // ────────────────────────────────────────────────────────────
  // 문의 접수 — POST /api/inquiries
  // ────────────────────────────────────────────────────────────
  Future<void> _handleSubmit() async {
    if (selectedType == null ||
        titleController.text.trim().isEmpty ||
        contentController.text.trim().isEmpty) {
      _snack('모든 항목을 입력해주세요');
      return;
    }

    final token = await _getToken();
    if (token == null || token.isEmpty) {
      _snack('로그인이 필요합니다');
      return;
    }

    setState(() => _submitting = true);
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/inquiries'),
        headers: _authHeaders(token),
        body: jsonEncode({
          'type': selectedType,
          'title': titleController.text.trim(),
          'content': contentController.text.trim(),
        }),
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        _snack('문의가 접수되었습니다');
        setState(() {
          selectedType = null;
          titleController.clear();
          contentController.clear();
        });
        _tabController.animateTo(1);
        await _fetchMyInquiries();
      } else {
        _snack('문의 접수 중 오류가 발생했습니다', isError: true);
      }
    } catch (e) {
      debugPrint('저장 에러: $e');
      if (mounted) _snack('서버 통신 중 오류가 발생했습니다', isError: true);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ────────────────────────────────────────────────────────────
  // 읽음 처리 — PATCH /api/inquiries/{id}/read
  // ────────────────────────────────────────────────────────────
  Future<void> _markAsRead(int inquiryId) async {
    final token = await _getToken();
    if (token == null || token.isEmpty) return;

    try {
      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/inquiries/$inquiryId/read'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        await _fetchMyInquiries();
      } else {
        debugPrint('읽음 처리 실패: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('읽음 처리 실패: $e');
    }
  }

  // ────────────────────────────────────────────────────────────
  // 문의 취소 — PATCH /api/inquiries/{id}/cancel
  // ────────────────────────────────────────────────────────────
  Future<void> _handleCancelInquiry(int inquiryId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('문의 취소'),
        content: const Text('정말 이 문의를 취소하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('아니오'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('예', style: TextStyle(color: Colors.orange)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    final token = await _getToken();
    if (token == null || token.isEmpty) return;

    try {
      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/inquiries/$inquiryId/cancel'),
        headers: _authHeaders(token),
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 204) {
        _snack('문의가 취소되었습니다');
        await _fetchMyInquiries();
      } else {
        _snack('취소 처리 중 오류가 발생했습니다', isError: true);
      }
    } catch (e) {
      debugPrint('취소 실패: $e');
      if (mounted) _snack('취소 처리 중 오류가 발생했습니다', isError: true);
    }
  }

  // ────────────────────────────────────────────────────────────
  // 문의 삭제 — DELETE /api/inquiries/{id}
  // ────────────────────────────────────────────────────────────
  Future<void> _handleDeleteInquiry(int inquiryId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('문의 삭제'),
        content: const Text('문의 내역을 삭제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('아니오'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('예', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    final token = await _getToken();
    if (token == null || token.isEmpty) return;

    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/inquiries/$inquiryId'),
        headers: _authHeaders(token),
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 204) {
        _snack('삭제되었습니다');
        await _fetchMyInquiries();
      } else {
        _snack('오류가 발생했습니다', isError: true);
      }
    } catch (e) {
      debugPrint('삭제 실패: $e');
      if (mounted) _snack('오류가 발생했습니다', isError: true);
    }
  }

  void _snack(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red : const Color(0xFF2A2620),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _getStatusLabel(String? status) {
    switch (status) {
      case 'pending': return '대기중';
      case 'processing': return '처리중';
      case 'completed': return '답변완료';
      default: return '대기중';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'pending': return Colors.amber;
      case 'processing': return Colors.blue;
      case 'completed': return Colors.green;
      default: return Colors.grey;
    }
  }

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('고객센터', style: TextStyle(letterSpacing: 4)),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFFC9A961),
          unselectedLabelColor: const Color(0xFF8B8278),
          indicatorColor: const Color(0xFFC9A961),
          tabs: [
            const Tab(text: '새 문의 작성'),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('내 문의 내역'),
                  if (notifications > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
                      child: Center(
                        child: Text(
                          '$notifications',
                          style: const TextStyle(color: Colors.white, fontSize: 10),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildNewInquiryTab(),
          _buildMyInquiriesTab(),
        ],
      ),
    );
  }

  Widget _buildNewInquiryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CUSTOMER SERVICE',
              style: TextStyle(fontSize: 10, letterSpacing: 4,
                  color: Color(0xFFC9A961), fontStyle: FontStyle.italic)),
          const SizedBox(height: 16),
          const Text('무엇을 도와드릴까요?',
              style: TextStyle(fontSize: 14, color: Color(0xFF8B8278), fontStyle: FontStyle.italic)),
          const SizedBox(height: 32),

          // 문의 유형
          const Text('문의 유형 선택',
              style: TextStyle(fontSize: 12, letterSpacing: 2, color: Color(0xFF8B8278))),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: inquiryTypes.length,
            itemBuilder: (context, index) {
              final type = inquiryTypes[index];
              final isSelected = selectedType == type['value'];
              return InkWell(
                onTap: () => setState(() => selectedType = type['value']),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFFC9A961)
                          : const Color(0xFFC9A961).withOpacity(0.2),
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(8),
                    color: isSelected
                        ? const Color(0xFFC9A961).withOpacity(0.05)
                        : Colors.transparent,
                  ),
                  child: Row(
                    children: [
                      Text(type['icon']!, style: const TextStyle(fontSize: 24)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(type['label']!,
                            style: const TextStyle(
                              fontSize: 14, letterSpacing: 1, color: Color(0xFF2A2620),
                            )),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),

          // FAQ 버튼
          InkWell(
            onTap: () => Navigator.of(context).pushNamed('/faq'),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF7BA8D4).withOpacity(0.3)),
                borderRadius: BorderRadius.circular(8),
                color: const Color(0xFFE8F4FF).withOpacity(0.3),
              ),
              child: Row(
                children: [
                  const Text('❓', style: TextStyle(fontSize: 24)),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('자주 묻는 질문',
                            style: TextStyle(
                              fontSize: 14, letterSpacing: 1,
                              color: Color(0xFF2A5580), fontWeight: FontWeight.w500,
                            )),
                        SizedBox(height: 4),
                        Text('빠른 답변이 필요하신가요?',
                            style: TextStyle(fontSize: 12, color: Color(0xFF6B8FAE))),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward, color: Color(0xFF7BA8D4), size: 16),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          // 제목
          const Text('제목',
              style: TextStyle(fontSize: 12, letterSpacing: 2, color: Color(0xFF8B8278))),
          const SizedBox(height: 8),
          TextField(
            controller: titleController,
            decoration: InputDecoration(
              hintText: '문의 제목을 입력해주세요',
              border: OutlineInputBorder(
                borderSide: BorderSide(color: const Color(0xFFC9A961).withOpacity(0.3)),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFFC9A961)),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // 내용
          const Text('문의 내용',
              style: TextStyle(fontSize: 12, letterSpacing: 2, color: Color(0xFF8B8278))),
          const SizedBox(height: 8),
          TextField(
            controller: contentController,
            maxLines: 8,
            decoration: InputDecoration(
              hintText: '문의하실 내용을 자세히 입력해주세요',
              border: OutlineInputBorder(
                borderSide: BorderSide(color: const Color(0xFFC9A961).withOpacity(0.3)),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFFC9A961)),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // 제출 버튼
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _submitting ? null : _handleSubmit,
              icon: _submitting
                  ? const SizedBox(
                      width: 14, height: 14,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5),
                    )
                  : const Icon(Icons.send, size: 16),
              label: Text(
                _submitting ? '접수 중...' : '문의 접수하기',
                style: const TextStyle(letterSpacing: 4, fontSize: 12),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2A2620),
                padding: const EdgeInsets.symmetric(vertical: 16),
                disabledBackgroundColor: const Color(0xFF8B8278),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyInquiriesTab() {
    if (_loadingList && myInquiries.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFC9A961)));
    }

    final activeInquiries =
        myInquiries.where((inq) => inq['status'] != 'cancelled').toList();

    if (activeInquiries.isEmpty) {
      return RefreshIndicator(
        onRefresh: _fetchMyInquiries,
        color: const Color(0xFFC9A961),
        child: ListView(
          children: [
            const SizedBox(height: 80),
            const Icon(Icons.chat_bubble_outline, size: 60, color: Color(0xFFC9A961)),
            const SizedBox(height: 16),
            const Center(
              child: Text('문의 내역이 없습니다',
                  style: TextStyle(fontSize: 14, color: Color(0xFF8B8278), fontStyle: FontStyle.italic)),
            ),
            const SizedBox(height: 24),
            Center(
              child: OutlinedButton(
                onPressed: () => _tabController.animateTo(0),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFC9A961)),
                ),
                child: const Text('새 문의 작성하기',
                    style: TextStyle(color: Color(0xFFC9A961), letterSpacing: 2, fontSize: 12)),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchMyInquiries,
      color: const Color(0xFFC9A961),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: activeInquiries.length,
        itemBuilder: (context, index) {
          final inquiry = activeInquiries[index];
          return _buildInquiryCard(inquiry);
        },
      ),
    );
  }

  Widget _buildInquiryCard(Map<String, dynamic> inquiry) {
    final typeInfo = inquiryTypes.firstWhere(
      (t) => t['value'] == inquiry['type'],
      orElse: () => {'icon': '❓', 'label': '기타'},
    );

    // 백엔드 API 응답 — id는 inquiryId로 올 수도 있음
    final inquiryId = (inquiry['inquiryId'] ?? inquiry['id']) as int;
    final status = inquiry['status'] as String?;
    final isUnread = status == 'completed' && inquiry['read'] == false;

    // 날짜 — createdAt(camel) 또는 created_at(snake) 모두 대응
    final createdAtRaw = inquiry['createdAt'] ?? inquiry['created_at'];
    String dateStr = '';
    if (createdAtRaw is String) {
      try {
        final dt = DateTime.parse(createdAtRaw);
        dateStr = dt.toString().substring(0, 19);
      } catch (_) {
        dateStr = createdAtRaw;
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2)),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(typeInfo['icon']!, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            inquiry['title'] ?? '',
                            style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600,
                              color: Color(0xFF2A2620),
                            ),
                          ),
                        ),
                        if (isUnread)
                          Container(
                            width: 8, height: 8,
                            decoration: const BoxDecoration(
                                color: Colors.red, shape: BoxShape.circle),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(dateStr,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF8B8278))),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _getStatusLabel(status),
                  style: TextStyle(
                    fontSize: 10, fontWeight: FontWeight.w600,
                    color: _getStatusColor(status),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFAF8F3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              inquiry['content'] ?? '',
              style: const TextStyle(
                fontSize: 14, color: Color(0xFF555555), height: 1.5,
              ),
            ),
          ),

          // 답변
          if (status == 'completed' && inquiry['answer'] != null) ...[
            const SizedBox(height: 16),
            const Divider(color: Color(0xFFC9A961)),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFC9A961).withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle,
                      size: 16, color: Color(0xFFC9A961)),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('답변 완료',
                        style: TextStyle(
                          fontSize: 10, letterSpacing: 1,
                          color: Color(0xFFC9A961), fontWeight: FontWeight.w500,
                        )),
                    Text(
                      (inquiry['assignedTo'] ?? '관리자').toString(),
                      style: const TextStyle(fontSize: 9, color: Color(0xFF8B8278)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                inquiry['answer'].toString(),
                style: const TextStyle(
                  fontSize: 14, color: Color(0xFF2A2620), height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                if (inquiry['read'] == false)
                  TextButton(
                    onPressed: () => _markAsRead(inquiryId),
                    child: const Text('확인 완료',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFFC9A961),
                          decoration: TextDecoration.underline,
                          fontStyle: FontStyle.italic,
                        )),
                  ),
                TextButton.icon(
                  onPressed: () => _handleDeleteInquiry(inquiryId),
                  icon: const Icon(Icons.delete, size: 14, color: Colors.red),
                  label: const Text('삭제',
                      style: TextStyle(fontSize: 12, color: Colors.red)),
                ),
              ],
            ),
          ],

          // 처리중/대기중 — 취소 버튼
          if (status == 'pending' || status == 'processing') ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => _handleCancelInquiry(inquiryId),
                icon: const Icon(Icons.close, size: 14, color: Colors.orange),
                label: const Text('문의 취소',
                    style: TextStyle(fontSize: 12, color: Colors.orange)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
