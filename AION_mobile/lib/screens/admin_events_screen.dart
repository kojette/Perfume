import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AdminEventsScreen extends StatefulWidget {
  const AdminEventsScreen({super.key});
  @override
  State<AdminEventsScreen> createState() => _AdminEventsScreenState();
}

class _AdminEventsScreenState extends State<AdminEventsScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _events = [];
  bool _loading = true;
  bool _showForm = false;
  int? _editingId;

  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _eventType = 'COUPON';
  String _startDate = '';
  String _endDate = '';
  final _discountRateCtrl = TextEditingController(text: '0');
  final _couponCodeCtrl = TextEditingController();
  final _pointAmountCtrl = TextEditingController(text: '0');
  final _maxParticipantsCtrl = TextEditingController();
  final _winProbCtrl = TextEditingController(text: '100');
  bool _priorityBuyers = false;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() { super.initState(); _fetch(); }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final data = await _supabase.from('Events').select('*').order('created_at', ascending: false);
      if (mounted) setState(() => _events = List<Map<String, dynamic>>.from(data));
    } catch (e) { _alert('로드 실패: $e'); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty || _eventType.isEmpty) {
      _alert('제목과 이벤트 유형을 입력해주세요.'); return;
    }
    if (_eventType == 'COUPON' && _couponCodeCtrl.text.trim().isEmpty) {
      _alert('쿠폰 코드를 입력해주세요.'); return;
    }
    final payload = {
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'event_type': _eventType,
      'start_date': _startDate.isEmpty ? null : _startDate,
      'end_date': _endDate.isEmpty ? null : _endDate,
      'discount_rate': double.tryParse(_discountRateCtrl.text) ?? 0,
      'coupon_code': _couponCodeCtrl.text.trim().isEmpty ? null : _couponCodeCtrl.text.trim(),
      'point_amount': int.tryParse(_pointAmountCtrl.text) ?? 0,
      'max_participants': _maxParticipantsCtrl.text.trim().isEmpty ? null : int.tryParse(_maxParticipantsCtrl.text),
      'win_probability': int.tryParse(_winProbCtrl.text) ?? 100,
      'priority_buyers': _priorityBuyers,
    };
    try {
      if (_editingId != null) {
        await _supabase.from('Events').update(payload).eq('id', _editingId!);
        _alert('이벤트가 수정되었습니다.');
      } else {
        await _supabase.from('Events').insert(payload);
        _alert('이벤트가 생성되었습니다.');
      }
      _resetForm(); _fetch();
    } catch (e) { _alert('저장 실패: $e'); }
  }

  Future<void> _delete(int id) async {
    _confirm('이벤트를 삭제하시겠습니까?', () async {
      await _supabase.from('Events').delete().eq('id', id);
      _fetch();
    });
  }

  void _openEdit(Map<String, dynamic> item) {
    _editingId = item['id'] as int;
    _titleCtrl.text = item['title'] as String? ?? '';
    _descCtrl.text = item['description'] as String? ?? '';
    _eventType = item['event_type'] as String? ?? 'COUPON';
    _startDate = item['start_date'] as String? ?? '';
    _endDate = item['end_date'] as String? ?? '';
    _discountRateCtrl.text = (item['discount_rate'] ?? 0).toString();
    _couponCodeCtrl.text = item['coupon_code'] as String? ?? '';
    _pointAmountCtrl.text = (item['point_amount'] ?? 0).toString();
    _maxParticipantsCtrl.text = item['max_participants']?.toString() ?? '';
    _winProbCtrl.text = (item['win_probability'] ?? 100).toString();
    _priorityBuyers = item['priority_buyers'] as bool? ?? false;
    setState(() => _showForm = true);
  }

  void _resetForm() {
    _editingId = null;
    _titleCtrl.clear(); _descCtrl.clear(); _eventType = 'COUPON';
    _startDate = ''; _endDate = ''; _discountRateCtrl.text = '0';
    _couponCodeCtrl.clear(); _pointAmountCtrl.text = '0';
    _maxParticipantsCtrl.clear(); _winProbCtrl.text = '100'; _priorityBuyers = false;
    setState(() => _showForm = false);
  }

  String _eventTypeLabel(String type) {
    switch (type) {
      case 'COUPON': return '쿠폰 지급';
      case 'DISCOUNT': return '할인 행사';
      case 'POINT': return '포인트 적립';
      default: return type;
    }
  }

  Color _eventTypeColor(String type) {
    switch (type) {
      case 'COUPON': return Colors.orange;
      case 'DISCOUNT': return Colors.blue;
      case 'POINT': return Colors.green;
      default: return Colors.grey;
    }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: _dark), onPressed: () => Navigator.pop(context)),
        title: const Text('이벤트 관리', style: TextStyle(color: _dark, fontSize: 14, letterSpacing: 2)),
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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_editingId != null ? '이벤트 수정' : '이벤트 생성',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark, letterSpacing: 1)),
          const SizedBox(height: 16),
          _field('이벤트 제목', _titleCtrl),
          const SizedBox(height: 12),
          _field('설명', _descCtrl, maxLines: 3),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _eventType,
            decoration: const InputDecoration(
              labelText: '이벤트 유형', labelStyle: TextStyle(fontSize: 12, color: _grey),
              enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
            ),
            items: const [
              DropdownMenuItem(value: 'COUPON', child: Text('쿠폰 지급', style: TextStyle(fontSize: 13))),
              DropdownMenuItem(value: 'DISCOUNT', child: Text('할인 행사', style: TextStyle(fontSize: 13))),
              DropdownMenuItem(value: 'POINT', child: Text('포인트 적립', style: TextStyle(fontSize: 13))),
            ],
            onChanged: (v) => setState(() => _eventType = v ?? 'COUPON'),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _datePicker('시작일', _startDate, (v) => setState(() => _startDate = v))),
            const SizedBox(width: 12),
            Expanded(child: _datePicker('종료일', _endDate, (v) => setState(() => _endDate = v))),
          ]),
          const SizedBox(height: 12),
          if (_eventType == 'COUPON') ...[
            _field('쿠폰 코드', _couponCodeCtrl, hint: 'SUMMER2025'),
            const SizedBox(height: 12),
          ],
          if (_eventType == 'DISCOUNT') ...[
            _field('할인율 (%)', _discountRateCtrl, keyboardType: TextInputType.number),
            const SizedBox(height: 12),
          ],
          if (_eventType == 'POINT') ...[
            _field('포인트 지급량', _pointAmountCtrl, keyboardType: TextInputType.number),
            const SizedBox(height: 12),
          ],
          Row(children: [
            Expanded(child: _field('최대 참여자 수', _maxParticipantsCtrl, hint: '제한 없음', keyboardType: TextInputType.number)),
            const SizedBox(width: 12),
            Expanded(child: _field('당첨 확률 (%)', _winProbCtrl, keyboardType: TextInputType.number)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Switch(value: _priorityBuyers, onChanged: (v) => setState(() => _priorityBuyers = v), activeColor: _gold),
            const Text('구매 고객 우선', style: TextStyle(fontSize: 12, color: _dark)),
          ]),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _save,
            style: ElevatedButton.styleFrom(backgroundColor: _dark, padding: const EdgeInsets.symmetric(vertical: 14), shape: const RoundedRectangleBorder()),
            child: const Text('저장', style: TextStyle(color: Colors.white, letterSpacing: 2)),
          )),
        ]),
      ),
    );
  }

  Widget _buildList() {
    if (_events.isEmpty) {
      return const Center(child: Text('등록된 이벤트가 없습니다.', style: TextStyle(color: _grey)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _events.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final e = _events[i];
        final type = e['event_type'] as String? ?? '';
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: _gold.withOpacity(0.15))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                color: _eventTypeColor(type).withOpacity(0.15),
                child: Text(_eventTypeLabel(type), style: TextStyle(fontSize: 9, color: _eventTypeColor(type), letterSpacing: 1)),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(e['title'] as String? ?? '',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _dark))),
              IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: _grey),
                  onPressed: () => _openEdit(e), padding: EdgeInsets.zero, constraints: const BoxConstraints()),
              const SizedBox(width: 4),
              IconButton(icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                  onPressed: () => _delete(e['id'] as int), padding: EdgeInsets.zero, constraints: const BoxConstraints()),
            ]),
            const SizedBox(height: 6),
            if (e['description'] != null && (e['description'] as String).isNotEmpty)
              Text(e['description'] as String, style: const TextStyle(fontSize: 12, color: _grey), maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text('${e['start_date'] ?? '-'} ~ ${e['end_date'] ?? '-'}',
                style: const TextStyle(fontSize: 11, color: _grey)),
          ]),
        );
      },
    );
  }

  Widget _field(String label, TextEditingController ctrl, {int maxLines = 1, String? hint, TextInputType keyboardType = TextInputType.text}) {
    return TextField(
      controller: ctrl, maxLines: maxLines, keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label, hintText: hint,
        labelStyle: const TextStyle(fontSize: 12, color: _grey),
        hintStyle: const TextStyle(fontSize: 12, color: Colors.black26),
        enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
        focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: _gold)),
      ),
      style: const TextStyle(fontSize: 13),
    );
  }

  Widget _datePicker(String label, String value, ValueChanged<String> onChanged) {
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
          labelText: label, labelStyle: const TextStyle(fontSize: 12, color: _grey),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
        ),
        child: Text(value.isEmpty ? '날짜 선택' : value, style: TextStyle(fontSize: 13, color: value.isEmpty ? Colors.grey : _dark)),
      ),
    );
  }

  @override
  void dispose() {
    _titleCtrl.dispose(); _descCtrl.dispose(); _discountRateCtrl.dispose();
    _couponCodeCtrl.dispose(); _pointAmountCtrl.dispose();
    _maxParticipantsCtrl.dispose(); _winProbCtrl.dispose();
    super.dispose();
  }
}
