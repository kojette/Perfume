import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> cartItems = [];
  bool isLoading = true;
  int totalPrice = 0;

  @override
  void initState() {
    super.initState();
    _fetchCartItems();
  }

  Future<void> _fetchCartItems() async {
    setState(() => isLoading = true);

    try {
      final session = supabase.auth.currentSession;
      if (session == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('로그인이 필요합니다.')),
          );
          Navigator.of(context).pop();
        }
        return;
      }

      final response = await supabase.functions.invoke(
        'get-cart',
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );

      if (response.status == 200) {
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        
        setState(() {
          cartItems = items;
          totalPrice = items.fold<int>(
            0,
            (sum, item) => sum + ((item['price'] as int) * (item['quantity'] as int)),
          );
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('장바구니 불러오기 실패: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _updateQuantity(int cartId, int currentQuantity, int change) async {
    final newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      final session = supabase.auth.currentSession;
      if (session == null) return;

      final response = await supabase.functions.invoke(
        'update-cart-quantity',
        body: {
          'cartId': cartId,
          'quantity': newQuantity,
        },
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );

      if (response.status == 200) {
        setState(() {
          final index = cartItems.indexWhere((item) => item['cartId'] == cartId);
          if (index != -1) {
            cartItems[index]['quantity'] = newQuantity;
            totalPrice = cartItems.fold<int>(
              0,
              (sum, item) => sum + ((item['price'] as int) * (item['quantity'] as int)),
            );
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('수량 변경 실패: $e')),
        );
      }
    }
  }

  Future<void> _handleCheckout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('결제 확인'),
        content: const Text('장바구니에 담긴 상품을 정말 결제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('확인'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final session = supabase.auth.currentSession;
      if (session == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('로그인이 필요합니다.')),
          );
        }
        return;
      }

      final response = await supabase.functions.invoke(
        'checkout',
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );

      if (response.status == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('주문이 성공적으로 완료되었습니다!')),
          );
          setState(() {
            cartItems = [];
            totalPrice = 0;
          });
        }
      } else {
        throw Exception('주문 처리 실패');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('주문 처리 중 문제가 발생했습니다: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('CART', style: TextStyle(letterSpacing: 4)),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
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
          const Icon(
            Icons.shopping_bag_outlined,
            size: 80,
            color: Color(0xFFC9A961),
          ),
          const SizedBox(height: 16),
          const Text(
            '장바구니가 비어있습니다.',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF8B8278),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A1A1A),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: const Text(
              'SHOP NOW',
              style: TextStyle(letterSpacing: 2, fontSize: 12),
            ),
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
            itemBuilder: (context, index) {
              final item = cartItems[index];
              return _buildCartItem(item);
            },
          ),
        ),
        _buildCheckoutSection(),
      ],
    );
  }

  Widget _buildCartItem(Map<String, dynamic> item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 이미지
          Container(
            width: 64,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              image: item['imageUrl'] != null
                  ? DecorationImage(
                      image: NetworkImage(item['imageUrl']),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
          ),
          const SizedBox(width: 16),
          // 상품 정보
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['name'] ?? '',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  '50ML / EAU DE PARFUM',
                  style: TextStyle(
                    fontSize: 10,
                    color: Color(0xFF8B8278),
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  '₩${(item['price'] as int).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                // 수량 조절
                Row(
                  children: [
                    _buildQuantityButton(
                      icon: Icons.remove,
                      onPressed: () => _updateQuantity(
                        item['cartId'],
                        item['quantity'],
                        -1,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        '${item['quantity']}',
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                    _buildQuantityButton(
                      icon: Icons.add,
                      onPressed: () => _updateQuantity(
                        item['cartId'],
                        item['quantity'],
                        1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // 총 가격
          Text(
            '₩${((item['price'] as int) * (item['quantity'] as int)).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFC9A961)),
        ),
        child: Icon(
          icon,
          size: 16,
          color: const Color(0xFFC9A961),
        ),
      ),
    );
  }

  Widget _buildCheckoutSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(
            color: const Color(0xFFC9A961).withOpacity(0.3),
          ),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 18,
                  fontStyle: FontStyle.italic,
                  color: Color(0xFF8B8278),
                ),
              ),
              Text(
                '₩${totalPrice.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A1A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _handleCheckout,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1A1A1A),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'CHECKOUT',
                style: TextStyle(
                  letterSpacing: 3,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
