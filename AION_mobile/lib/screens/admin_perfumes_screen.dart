import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AdminPerfumesScreen extends StatefulWidget {
  const AdminPerfumesScreen({super.key});
  @override
  State<AdminPerfumesScreen> createState() => _AdminPerfumesScreenState();
}

class _AdminPerfumesScreenState extends State<AdminPerfumesScreen> {
  List<Map<String, dynamic>> _perfumes = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
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
      final data = await ApiService.getAdminPerfumes();
      if (mounted && data != null) {
        setState(() {
          _perfumes = List<Map<String, dynamic>>.from(data);
          _filtered = List<Map<String, dynamic>>.from(data);
        });
      }
    } catch (e) { _alert('로드 실패: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  void _applySearch(String query) {
    if (query.isEmpty) {
      setState(() => _filtered = List<Map<String, dynamic>>.from(_perfumes));
    } else {
      setState(() {
        _filtered = _perfumes.where((p) {
          final name = (p['name'] as String? ?? '').toLowerCase();
          final brand = (p['brandName'] as String? ?? '').toLowerCase();
          return name.contains(query.toLowerCase()) || brand.contains(query.toLowerCase());
        }).toList();
      });
    }
  }

  Future<void> _delete(int id) async {
    _confirm('향수를 삭제하시겠습니까?', () async {
      final success = await ApiService.deleteAdminPerfume(id);
      if (success) { _alert('삭제되었습니다.'); _fetch(); }
      else { _alert('삭제 실패'); }
    });
  }

  void _showDetail(Map<String, dynamic> perfume) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(),
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6, maxChildSize: 0.9, minChildSize: 0.4,
        expand: false,
        builder: (_, ctrl) => SingleChildScrollView(
          controller: ctrl,
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('향수 상세', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 2)),
              IconButton(icon: const Icon(Icons.close, color: _grey), onPressed: () => Navigator.pop(context)),
            ]),
            const SizedBox(height: 16),
            if (perfume['thumbnailUrl'] != null)
              Center(child: Container(
                width: 100, height: 100,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(border: Border.all(color: _gold.withOpacity(0.2))),
                child: Image.network(perfume['thumbnailUrl'] as String, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.science_outlined, color: _gold, size: 40)),
              )),
            _row('향수명', perfume['name'] as String? ?? '-'),
            _row('브랜드', perfume['brandName'] as String? ?? '-'),
            _row('가격', '₩${(perfume['price'] as num?)?.toStringAsFixed(0) ?? '-'}'),
            _row('재고', '${perfume['stockQuantity'] ?? 0}개'),
            _row('용량', '${perfume['volume'] ?? '-'}ml'),
            _row('등록일', _formatDate(perfume['createdAt'] as String? ?? '')),
            if (perfume['description'] != null) ...[
              const SizedBox(height: 12),
              const Text('설명', style: TextStyle(fontSize: 11, color: _grey)),
              const SizedBox(height: 4),
              Text(perfume['description'] as String, style: const TextStyle(fontSize: 12, color: _dark)),
            ],
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: OutlinedButton(
              onPressed: () { Navigator.pop(context); _delete(perfume['id'] as int); },
              style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red), shape: const RoundedRectangleBorder(), padding: const EdgeInsets.symmetric(vertical: 14)),
              child: const Text('삭제', style: TextStyle(color: Colors.red, letterSpacing: 2)),
            )),
          ]),
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        SizedBox(width: 60, child: Text(label, style: const TextStyle(fontSize: 11, color: _grey))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 12, color: _dark, fontWeight: FontWeight.w500))),
      ]),
    );
  }

  void _alert(String msg) {
    showDialog(context: context, builder: (_) => AlertDialog(
      content: Text(msg, style: const TextStyle(fontSize: 13)),
      actions: [TextButton(onPressed: () => Navigator.pop(context),
          child: const Text('확인', style: TextStyle(color: _gold)))],
    ));
  }

  void _confirm(String msg, VoidCallback onConfirm) {
    showDialog(context: context, builder: (_) => AlertDialog(
      content: Text(msg, style: const TextStyle(fontSize: 13)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('취소', style: TextStyle(color: Colors.grey))),
        TextButton(onPressed: () { Navigator.pop(context); onConfirm(); }, child: const Text('삭제', style: TextStyle(color: Colors.red))),
      ],
    ));
  }

  String _formatDate(String iso) {
    if (iso.isEmpty) return '-';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.year}.${dt.month.toString().padLeft(2,'0')}.${dt.day.toString().padLeft(2,'0')}';
    } catch (_) { return iso; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: _dark), onPressed: () => Navigator.pop(context)),
        title: const Text('향수 데이터 관리', style: TextStyle(color: _dark, fontSize: 14, letterSpacing: 1)),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: _gold), onPressed: _fetch),
        ],
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: '향수명 또는 브랜드 검색',
              hintStyle: const TextStyle(fontSize: 12, color: Colors.black26),
              prefixIcon: const Icon(Icons.search, color: _grey, size: 20),
              filled: true, fillColor: _bg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(2), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
            onChanged: _applySearch,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('총 ${_filtered.length}개', style: const TextStyle(fontSize: 12, color: _grey)),
          ]),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: _gold))
              : _filtered.isEmpty
                  ? const Center(child: Text('향수 데이터가 없습니다.', style: TextStyle(color: _grey)))
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final p = _filtered[i];
                        return GestureDetector(
                          onTap: () => _showDetail(p),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.15))),
                            child: Row(children: [
                              Container(
                                width: 50, height: 50,
                                decoration: BoxDecoration(
                                  color: _bg, border: Border.all(color: _gold.withOpacity(0.2)),
                                ),
                                child: p['thumbnailUrl'] != null
                                    ? Image.network(p['thumbnailUrl'] as String, fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => const Icon(Icons.science_outlined, color: _gold, size: 24))
                                    : const Icon(Icons.science_outlined, color: _gold, size: 24),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(p['name'] as String? ?? '-',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _dark)),
                                const SizedBox(height: 2),
                                Text(p['brandName'] as String? ?? '-',
                                    style: const TextStyle(fontSize: 11, color: _grey)),
                                const SizedBox(height: 2),
                                Text('₩${(p['price'] as num?)?.toStringAsFixed(0) ?? '-'} · 재고 ${p['stockQuantity'] ?? 0}',
                                    style: const TextStyle(fontSize: 11, color: _grey)),
                              ])),
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

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }
}
