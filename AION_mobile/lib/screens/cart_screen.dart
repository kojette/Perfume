import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  List<Map<String, dynamic>> cartItems = [];
  bool isLoading = true;
  int totalPrice = 0;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    _fetchCartItems();
  }

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken') ?? '';
  }

  Future<void> _fetchCartItems() async {
    setState(() => isLoading = true);
    try {
      final token = await _getToken();
      if (token.isEmpty) {
        if (mounted) Navigator.pushReplacementNamed(context, '/login');
        return;
      }

      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/cart'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        final items = (data['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        setState(() {
          cartItems = items;
          _calcTotal();
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('장바구니 불러오기 실패: $e')),
      );
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _calcTotal() {
    totalPrice = cartItems.fold<int>(0, (sum, item) {
      final price = (item['price'] as num?)?.toInt() ?? 0;
      final qty = (item['quantity'] as num?)?.toInt() ?? 1;
      return sum + price * qty;
    });
  }

  Future<void> _updateQuantity(int cartId, int currentQty, int change) async {
    final newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      final token = await _getToken();
      final res = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/$cartId'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'quantity': newQty}),
      );

      if (res.statusCode == 200) {
        setState(() {
          final idx = cartItems.indexWhere((i) => i['cartId'] == cartId);
          if (idx != -1) {
            cartItems[idx]['quantity'] = newQty;
            _calcTotal();
          }
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('수량 변경 실패: $e')),
      );
    }
  }

  Future<void> _removeItem(int cartId) async {
    try {
      final token = await _getToken();
      final res = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/$cartId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200) {
        setState(() {
          cartItems.removeWhere((i) => i['cartId'] == cartId);
          _calcTotal();
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('삭제 실패: $e')),
      );
    }
  }

  Future<void> _handleCheckout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('결제 확인'),
        content: const Text('장바구니에 담긴 상품을 정말 결제하시겠습니까?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('취소')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('확인', style: TextStyle(color: _gold))),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      final token = await _getToken();
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/orders/checkout'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'paymentMethod': 'CARD',
          'receiverName': '',
          'receiverPhone': '',
          'shippingAddress': '',
          'shippingZipcode': '',
        }),
      );

      if (res.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('주문이 완료되었습니다!')),
          );
          setState(() { cartItems = []; totalPrice = 0; });
        }
      } else {
        throw Exception('주문 처리 실패');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('주문 처리 중 오류: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F3),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text('CART',
            style: TextStyle(letterSpacing: 4, color: _dark, fontSize: 14, fontWeight: FontWeight.w400)),
        iconTheme: const IconThemeData(color: _dark),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : cartItems.isEmpty
              ? _buildEmptyCart()
              : _buildCartList(),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_bag_outlined, size: 80, color: _gold),
          const SizedBox(height: 16),
          const Text('장바구니가 비어있습니다.',
              style: TextStyle(fontSize: 16, color: _grey)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: _dark,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: const RoundedRectangleBorder(),
            ),
            child: const Text('SHOP NOW', style: TextStyle(letterSpacing: 2, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildCartList() {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: cartItems.length,
            itemBuilder: (_, i) => _buildCartItem(cartItems[i]),
          ),
        ),
        _buildCheckoutSection(),
      ],
    );
  }

  Widget _buildCartItem(Map<String, dynamic> item) {
    final price = (item['price'] as num?)?.toInt() ?? 0;
    final qty = (item['quantity'] as num?)?.toInt() ?? 1;
    final cartId = (item['cartId'] as num?)?.toInt() ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _gold.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 64, height: 80,
            color: Colors.grey[100],
            child: item['imageUrl'] != null
                ? Image.network(item['imageUrl'], fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.local_florist, color: _gold))
                : const Icon(Icons.local_florist, color: _gold),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['name'] ?? '',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _dark)),
                const SizedBox(height: 4),
                const Text('50ML / EAU DE PARFUM',
                    style: TextStyle(fontSize: 10, color: _grey, letterSpacing: 1.5)),
                const SizedBox(height: 10),
                Text('₩${_numFmt(price)}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _dark)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _qtyBtn(Icons.remove, () => _updateQuantity(cartId, qty, -1)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('$qty', style: const TextStyle(fontSize: 14)),
                    ),
                    _qtyBtn(Icons.add, () => _updateQuantity(cartId, qty, 1)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => _removeItem(cartId),
                      child: const Icon(Icons.close, size: 18, color: _grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text('₩${_numFmt(price * qty)}',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _dark)),
        ],
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 24, height: 24,
        decoration: BoxDecoration(border: Border.all(color: _gold)),
        child: Icon(icon, size: 16, color: _gold),
      ),
    );
  }

  Widget _buildCheckoutSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: _gold.withOpacity(0.3))),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total',
                  style: TextStyle(fontSize: 18, fontStyle: FontStyle.italic, color: _grey)),
              Text('₩${_numFmt(totalPrice)}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _dark)),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _handleCheckout,
              style: ElevatedButton.styleFrom(
                backgroundColor: _dark,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: const RoundedRectangleBorder(),
              ),
              child: const Text('CHECKOUT', style: TextStyle(letterSpacing: 3, fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }

  String _numFmt(int v) {
    return v.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}