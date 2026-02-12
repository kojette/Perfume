import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AdminAnnouncementsScreen extends StatefulWidget {
  const AdminAnnouncementsScreen({super.key});
  @override
  State<AdminAnnouncementsScreen> createState() => _AdminAnnouncementsScreenState();
}

class _AdminAnnouncementsScreenState extends State<AdminAnnouncementsScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  bool _showForm = false;
  int? _editingId;

  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  String _startDate = '';
  String _endDate = '';
  bool _isPinned = false;
  bool _isImportant = false;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() { super.initState(); _fetch(); }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final data = await _supabase
          .from('Announcements')
          .select('*')
          .order('is_pinned', ascending: false)
          .order('created_at', ascending: false);
      if (mounted) setState(() => _items = List<Map<String, dynamic>>.from(data));
    } catch (e) { _alert('로드 실패: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty || _contentCtrl.text.trim().isEmpty) {
      _alert('제목과 내용을 입력해주세요.'); return;
    }
    final payload = {
      'title': _titleCtrl.text.trim(),
      'content': _contentCtrl.text.trim(),
      'start_date': _startDate.isEmpty ? null : _startDate,
      'end_date': _endDate.isEmpty ? null : _endDate,
      'is_pinned': _isPinned,
      'is_important': _isImportant,
    };
    try {
      if (_editingId != null) {
        await _supabase.from('Announcements').update(payload).eq('id', _editingId!);
        _alert('공지사항이 수정되었습니다.');
      } else {
        await _supabase.from('Announcements').insert(payload);
        _alert('공지사항이 작성되었습니다.');
      }
      _resetForm(); _fetch();
    } catch (e) { _alert('저장 실패: $e'); }
  }

  Future<void> _delete(int id) async {
    _confirm('정말 삭제하시겠습니까?', () async {
      try {
        await _supabase.from('Announcements').delete().eq('id', id);
        _fetch();
      } catch (e) { _alert('삭제 실패: $e'); }
    });
  }

  void _openEdit(Map<String, dynamic> item) {
    _editingId = item['id'] as int;
    _titleCtrl.text = item['title'] as String? ?? '';
    _contentCtrl.text = item['content'] as String? ?? '';
    _startDate = item['start_date'] as String? ?? '';
    _endDate = item['end_date'] as String? ?? '';
    _isPinned = item['is_pinned'] as bool? ?? false;
    _isImportant = item['is_important'] as bool? ?? false;
    setState(() => _showForm = true);
  }

  void _resetForm() {
    _editingId = null;
    _titleCtrl.clear(); _contentCtrl.clear();
    _startDate = ''; _endDate = '';
    _isPinned = false; _isImportant = false;
    setState(() => _showForm = false);
  }

  void _alert(String msg, [VoidCallback? cb]) {
    showDialog(context: context, builder: (_) => AlertDialog(
      content: Text(msg, style: const TextStyle(fontSize: 13)),
      actions: [TextButton(
        onPressed: () { Navigator.pop(context); cb?.call(); },
        child: const Text('확인', style: TextStyle(color: _gold)),
      )],
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: _dark), onPressed: () => Navigator.pop(context)),
        title: const Text('공지사항 관리', style: TextStyle(color: _dark, fontSize: 14, letterSpacing: 2)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(_showForm ? Icons.close : Icons.add, color: _gold),
            onPressed: () => _showForm ? _resetForm() : setState(() => _showForm = true),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : Column(children: [
              if (_showForm) _buildForm(),
              Expanded(child: _buildList()),
            ]),
    );
  }

  Widget _buildForm() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(_editingId != null ? '공지사항 수정' : '공지사항 작성',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 1)),
        const SizedBox(height: 16),
        _field('제목', _titleCtrl),
        const SizedBox(height: 12),
        _field('내용', _contentCtrl, maxLines: 4),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _dateField('시작일', _startDate, (v) => setState(() => _startDate = v))),
          const SizedBox(width: 12),
          Expanded(child: _dateField('종료일', _endDate, (v) => setState(() => _endDate = v))),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _toggle('고정', _isPinned, (v) => setState(() => _isPinned = v)),
          const SizedBox(width: 20),
          _toggle('중요', _isImportant, (v) => setState(() => _isImportant = v)),
        ]),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity,
          child: ElevatedButton(
            onPressed: _save,
            style: ElevatedButton.styleFrom(
              backgroundColor: _dark, padding: const EdgeInsets.symmetric(vertical: 14),
              shape: const RoundedRectangleBorder(),
            ),
            child: const Text('저장', style: TextStyle(color: Colors.white, letterSpacing: 2)),
          ),
        ),
      ]),
    );
  }

  Widget _buildList() {
    if (_items.isEmpty) {
      return const Center(child: Text('공지사항이 없습니다.', style: TextStyle(color: _grey)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final item = _items[i];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _gold.withOpacity(0.15)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              if (item['is_pinned'] == true) ...[
                const Icon(Icons.push_pin, size: 14, color: _gold),
                const SizedBox(width: 4),
              ],
              if (item['is_important'] == true) ...[
                const Icon(Icons.priority_high, size: 14, color: Colors.red),
                const SizedBox(width: 4),
              ],
              Expanded(child: Text(item['title'] as String? ?? '',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _dark))),
              IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: _grey),
                  onPressed: () => _openEdit(item), padding: EdgeInsets.zero, constraints: const BoxConstraints()),
              const SizedBox(width: 8),
              IconButton(icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                  onPressed: () => _delete(item['id'] as int), padding: EdgeInsets.zero, constraints: const BoxConstraints()),
            ]),
            const SizedBox(height: 6),
            Text(item['content'] as String? ?? '',
                style: const TextStyle(fontSize: 12, color: _grey),
                maxLines: 2, overflow: TextOverflow.ellipsis),
            if (item['start_date'] != null || item['end_date'] != null) ...[
              const SizedBox(height: 6),
              Text('${item['start_date'] ?? ''} ~ ${item['end_date'] ?? ''}',
                  style: const TextStyle(fontSize: 10, color: _grey)),
            ],
          ]),
        );
      },
    );
  }

  Widget _field(String label, TextEditingController ctrl, {int maxLines = 1}) {
    return TextField(
      controller: ctrl, maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label, labelStyle: const TextStyle(fontSize: 12, color: _grey),
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: _gold)),
      ),
      style: const TextStyle(fontSize: 13),
    );
  }

  Widget _dateField(String label, String value, ValueChanged<String> onChanged) {
    return GestureDetector(
      onTap: () async {
        final picked = await showDatePicker(
          context: context, initialDate: DateTime.now(),
          firstDate: DateTime(2020), lastDate: DateTime(2030),
          builder: (ctx, child) => Theme(
            data: ThemeData.light().copyWith(colorScheme: const ColorScheme.light(primary: _gold)),
            child: child!,
          ),
        );
        if (picked != null) onChanged('${picked.year}-${picked.month.toString().padLeft(2,'0')}-${picked.day.toString().padLeft(2,'0')}');
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label, labelStyle: const TextStyle(fontSize: 11, color: _grey),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
        ),
        child: Text(value.isEmpty ? '날짜 선택' : value,
            style: TextStyle(fontSize: 13, color: value.isEmpty ? Colors.grey : _dark)),
      ),
    );
  }

  Widget _toggle(String label, bool value, ValueChanged<bool> onChanged) {
    return Row(children: [
      Switch(value: value, onChanged: onChanged, activeColor: _gold),
      Text(label, style: const TextStyle(fontSize: 12, color: _dark)),
    ]);
  }

  @override
  void dispose() {
    _titleCtrl.dispose(); _contentCtrl.dispose(); super.dispose();
  }
}
