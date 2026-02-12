import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AdminMembersScreen extends StatefulWidget {
  const AdminMembersScreen({super.key});
  @override
  State<AdminMembersScreen> createState() => _AdminMembersScreenState();
}

class _AdminMembersScreenState extends State<AdminMembersScreen> {
  List<Map<String, dynamic>> _members = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
  String _searchTerm = '';
  String _filterStatus = 'all'; // all, active, suspended, blacklist

  final _searchCtrl = TextEditingController();

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() { super.initState(); _fetch(); }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getAdminMembers();
      if (mounted && data != null) {
        setState(() {
          _members = List<Map<String, dynamic>>.from(data);
          _applyFilter();
        });
      }
    } catch (e) { _alert('로드 실패: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  void _applyFilter() {
    var result = List<Map<String, dynamic>>.from(_members);
    if (_searchTerm.isNotEmpty) {
      result = result.where((m) {
        final name = (m['name'] as String? ?? '').toLowerCase();
        final email = (m['email'] as String? ?? '').toLowerCase();
        return name.contains(_searchTerm.toLowerCase()) || email.contains(_searchTerm.toLowerCase());
      }).toList();
    }
    if (_filterStatus != 'all') {
      result = result.where((m) {
        final status = (m['accountStatus'] as String? ?? '').toLowerCase();
        return status == _filterStatus;
      }).toList();
    }
    setState(() => _filtered = result);
  }

  Future<void> _updateMemberStatus(int memberId, String status) async {
    try {
      final success = await ApiService.updateMemberStatus(memberId: memberId, status: status);
      if (success) { _alert('상태가 업데이트되었습니다.'); _fetch(); }
      else { _alert('업데이트 실패'); }
    } catch (e) { _alert('오류: $e'); }
  }

  void _showMemberDetail(Map<String, dynamic> member) {
    final status = member['accountStatus'] as String? ?? 'ACTIVE';
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(0))),
      backgroundColor: Colors.white,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('회원 상세 정보', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 2)),
          const SizedBox(height: 16),
          _detailRow('이름', member['name'] as String? ?? '-'),
          _detailRow('이메일', member['email'] as String? ?? '-'),
          _detailRow('전화번호', member['phone'] as String? ?? '-'),
          _detailRow('성별', member['gender'] == 'MALE' ? '남성' : member['gender'] == 'FEMALE' ? '여성' : '-'),
          _detailRow('가입일', _formatDate(member['createdAt'] as String? ?? '')),
          _detailRow('현재 상태', status),
          const SizedBox(height: 20),
          const Text('상태 변경', style: TextStyle(fontSize: 11, color: _grey, letterSpacing: 1)),
          const SizedBox(height: 10),
          Row(children: [
            _statusBtn('정상', 'ACTIVE', status == 'ACTIVE', Colors.green),
            const SizedBox(width: 8),
            _statusBtn('정지', 'SUSPENDED', status == 'SUSPENDED', Colors.orange),
            const SizedBox(width: 8),
            _statusBtn('블랙리스트', 'BLACKLISTED', status == 'BLACKLISTED', Colors.red),
          ]),
          const SizedBox(height: 8),
          _actionBtn('상태 변경 적용', () {
            Navigator.pop(context);
            _showStatusConfirm(member['id'] as int, status);
          }),
        ]),
      ),
    );
  }

  Widget _statusBtn(String label, String value, bool selected, Color color) {
    return Expanded(
      child: GestureDetector(
        onTap: () {},
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? color.withOpacity(0.15) : Colors.grey[100],
            border: Border.all(color: selected ? color : Colors.grey[300]!),
          ),
          child: Text(label, textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: selected ? color : Colors.grey, fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
        ),
      ),
    );
  }

  Widget _actionBtn(String label, VoidCallback onTap) {
    return SizedBox(width: double.infinity, child: ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(backgroundColor: _dark, padding: const EdgeInsets.symmetric(vertical: 14), shape: const RoundedRectangleBorder()),
      child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, letterSpacing: 1)),
    ));
  }

  void _showStatusConfirm(int memberId, String currentStatus) {
    String newStatus = currentStatus;
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('상태 변경', style: TextStyle(fontSize: 14)),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<String>(
              value: newStatus,
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('정상')),
                DropdownMenuItem(value: 'SUSPENDED', child: Text('정지')),
                DropdownMenuItem(value: 'BLACKLISTED', child: Text('블랙리스트')),
              ],
              onChanged: (v) => setS(() => newStatus = v ?? currentStatus),
            ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('취소', style: TextStyle(color: Colors.grey))),
            TextButton(onPressed: () { Navigator.pop(ctx); _updateMemberStatus(memberId, newStatus); },
                child: const Text('변경', style: TextStyle(color: _gold))),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'ACTIVE': return Colors.green;
      case 'SUSPENDED': return Colors.orange;
      case 'BLACKLISTED': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'ACTIVE': return '정상';
      case 'SUSPENDED': return '정지';
      case 'BLACKLISTED': return '블랙리스트';
      default: return '-';
    }
  }

  void _alert(String msg) {
    showDialog(context: context, builder: (_) => AlertDialog(
      content: Text(msg, style: const TextStyle(fontSize: 13)),
      actions: [TextButton(onPressed: () => Navigator.pop(context),
          child: const Text('확인', style: TextStyle(color: _gold)))],
    ));
  }

  String _formatDate(String iso) {
    if (iso.isEmpty) return '-';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.year}.${dt.month.toString().padLeft(2,'0')}.${dt.day.toString().padLeft(2,'0')}';
    } catch (_) { return iso; }
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        SizedBox(width: 70, child: Text(label, style: const TextStyle(fontSize: 11, color: _grey))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 12, color: _dark, fontWeight: FontWeight.w500))),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: _dark), onPressed: () => Navigator.pop(context)),
        title: const Text('고객 관리', style: TextStyle(color: _dark, fontSize: 14, letterSpacing: 2)),
        centerTitle: true,
      ),
      body: Column(children: [
        // 검색바
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: '이름 또는 이메일 검색',
              hintStyle: const TextStyle(fontSize: 12, color: Colors.black26),
              prefixIcon: const Icon(Icons.search, color: _grey, size: 20),
              filled: true, fillColor: _bg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(2), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
            onChanged: (v) { _searchTerm = v; _applyFilter(); },
          ),
        ),
        // 필터 탭
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              _filterChip('전체', 'all'),
              const SizedBox(width: 8),
              _filterChip('정상', 'ACTIVE'),
              const SizedBox(width: 8),
              _filterChip('정지', 'SUSPENDED'),
              const SizedBox(width: 8),
              _filterChip('블랙리스트', 'BLACKLISTED'),
            ]),
          ),
        ),
        // 회원 수
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('총 ${_filtered.length}명', style: const TextStyle(fontSize: 12, color: _grey)),
            IconButton(icon: const Icon(Icons.refresh, color: _gold, size: 20),
                onPressed: _fetch, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
          ]),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: _gold))
              : _filtered.isEmpty
                  ? const Center(child: Text('회원이 없습니다.', style: TextStyle(color: _grey)))
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final m = _filtered[i];
                        final status = m['accountStatus'] as String? ?? 'ACTIVE';
                        return GestureDetector(
                          onTap: () => _showMemberDetail(m),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white, border: Border.all(color: _gold.withOpacity(0.15)),
                            ),
                            child: Row(children: [
                              Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle, color: _bg,
                                  border: Border.all(color: _gold.withOpacity(0.3)),
                                ),
                                child: Center(child: Text(
                                  (m['name'] as String? ?? 'U').substring(0, 1),
                                  style: const TextStyle(fontSize: 16, color: _gold),
                                )),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(m['name'] as String? ?? '-',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _dark)),
                                const SizedBox(height: 2),
                                Text(m['email'] as String? ?? '-',
                                    style: const TextStyle(fontSize: 11, color: _grey)),
                              ])),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                color: _statusColor(status).withOpacity(0.12),
                                child: Text(_statusLabel(status),
                                    style: TextStyle(fontSize: 10, color: _statusColor(status))),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.chevron_right, color: _grey, size: 18),
                            ]),
                          ),
                        );
                      },
                    ),
        ),
      ]),
    );
  }

  Widget _filterChip(String label, String value) {
    final active = _filterStatus == value;
    return GestureDetector(
      onTap: () { _filterStatus = value; _applyFilter(); },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: active ? _gold.withOpacity(0.15) : Colors.grey[100],
          border: Border.all(color: active ? _gold : Colors.grey[300]!),
        ),
        child: Text(label, style: TextStyle(fontSize: 11, color: active ? _dark : _grey)),
      ),
    );
  }

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }
}
