import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class Bottle {
  final String id;
  final String name;
  final String shape;
  final int basePrice;

  Bottle({required this.id, required this.name, required this.shape, required this.basePrice});
}

class BottleEditorScreen extends StatefulWidget {
  const BottleEditorScreen({super.key});

  @override
  State<BottleEditorScreen> createState() => _BottleEditorScreenState();
}

class _BottleEditorScreenState extends State<BottleEditorScreen> {
  final List<Bottle> _bottles = [
    Bottle(id: 'classic-round', name: '클래식 라운드', shape: 'round', basePrice: 15000),
    Bottle(id: 'tall-cylinder', name: '슬림 실린더', shape: 'cylinder', basePrice: 18000),
    Bottle(id: 'square-bold', name: '스퀘어 볼드', shape: 'square', basePrice: 16000),
    Bottle(id: 'vintage-flat', name: '빈티지 플랫', shape: 'flat', basePrice: 20000),
    Bottle(id: 'teardrop', name: '티어드롭', shape: 'teardrop', basePrice: 22000),
    Bottle(id: 'hexagon', name: '헥사곤', shape: 'hexagon', basePrice: 25000),
    Bottle(id: 'art-deco', name: '아르데코', shape: 'artdeco', basePrice: 28000),
    Bottle(id: 'modern-arch', name: '모던 아치', shape: 'arch', basePrice: 24000),
    Bottle(id: 'dome-classic', name: '돔 클래식', shape: 'dome', basePrice: 19000),
    Bottle(id: 'rectangle', name: '렉탱글', shape: 'rectangle', basePrice: 17000),
  ];

  late Bottle _selectedBottle;
  bool _hasPrinting = false;
  int _stickerCount = 0;
  bool _hasEngraving = false;

  @override
  void initState() {
    super.initState();
    _selectedBottle = _bottles[0]; 
  }

  int get _totalPrice {
    int total = _selectedBottle.basePrice;
    if (_hasPrinting) total += 5000;
    total += (_stickerCount * 3000);
    if (_hasEngraving) total += 8000;
    return total;
  }

  Future<void> _saveDesign() async {
    try {
      final url = Uri.parse('http://localhost:8080/api/custom/designs'); 
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'bottleId': _selectedBottle.id,
          'totalPrice': _totalPrice,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        _showMsg("✅ 저장 성공!");
      } else {
        _showMsg("❌ 실패: ${response.statusCode}");
      }
    } catch (e) {
      _showMsg("⚠️ 서버 연결 실패");
    }
  }

  void _showMsg(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("공병 디자인 에디터")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            height: 100,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(10)),
            child: Text("선택된 병: ${_selectedBottle.name}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 20),
          DropdownButton<Bottle>(
            isExpanded: true,
            value: _selectedBottle,
            items: _bottles.map((b) => DropdownMenuItem(value: b, child: Text("${b.name} (₩${b.basePrice})"))).toList(),
            onChanged: (val) => setState(() => _selectedBottle = val!),
          ),
          CheckboxListTile(
            title: const Text("프린팅/이미지 (+5,000)"),
            value: _hasPrinting,
            onChanged: (val) => setState(() => _hasPrinting = val!),
          ),
          CheckboxListTile(
            title: const Text("각인 서비스 (+8,000)"),
            value: _hasEngraving,
            onChanged: (val) => setState(() => _hasEngraving = val!),
          ),
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("최종 합계", style: TextStyle(fontSize: 18)),
              Text("₩$_totalPrice", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.blue)),
            ],
          ),
          const SizedBox(height: 20),
          ElevatedButton(onPressed: _saveDesign, child: const Text("AWS 저장하기")),
        ],
      ),
    );
  }
}