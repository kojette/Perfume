import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../services/api_service_extended.dart';
import '../models/perfume.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  List<Perfume> _wishlist = [];
  bool _loading = true;

  // 장바구니 담기 진행 중인 perfumeId(중복 클릭 방지)
  final Set<int> _addingToCart = {};

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  Future<void> _loadWishlist() async {
    setState(() => _loading = true);
    try {
      final wishlist = await ApiService.getWishlist();
      if (mounted) {
        setState(() => _wishlist = wishlist);
      }
    } catch (e) {
      debugPrint('위시리스트 로딩 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _removeFromWishlist(Perfume perfume) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('위시리스트에서 삭제', style: TextStyle(fontSize: 15)),
        content: Text(
          '${perfume.name}을(를) 위시리스트에서 삭제하시겠습니까?',
          style: const TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('삭제', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await ApiService.removeFromWishlist(perfume.id);
      if (success && mounted) {
        setState(() => _wishlist.removeWhere((p) => p.id == perfume.id));
        _snack('위시리스트에서 삭제되었습니다');
      } else if (mounted) {
        _snack('삭제 중 오류가 발생했습니다', isError: true);
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // 장바구니 담기 — /api/cart/add 호출 + 성공 시 이동 confirm 모달
  // (Wishlist.jsx의 handleAddToCart와 동일 동작)
  // ────────────────────────────────────────────────────────────
  Future<void> _addToCart(Perfume perfume) async {
    if (_addingToCart.contains(perfume.id)) return; // 중복 클릭 방지

    final token = await _getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      _snack('로그인이 필요한 서비스입니다');
      Navigator.pushNamed(context, '/login');
      return;
    }

    setState(() => _addingToCart.add(perfume.id));

    try {
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/cart/add'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'perfumeId': perfume.id,
          'quantity': 1,
        }),
      );

      if (!mounted) return;

      if (res.statusCode == 200 || res.statusCode == 201) {
        // 성공 시 — 장바구니 이동 confirm 모달
        final goCart = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            backgroundColor: Colors.white,
            title: const Text(
              '장바구니에 담겼습니다',
              style: TextStyle(fontSize: 15, color: _dark, fontWeight: FontWeight.w600),
            ),
            content: const Text(
              '장바구니로 이동하시겠습니까?',
              style: TextStyle(fontSize: 13, color: _grey),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('계속 둘러보기', style: TextStyle(color: _grey)),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('장바구니로 이동', style: TextStyle(color: _gold)),
              ),
            ],
          ),
        );

        if (goCart == true && mounted) {
          Navigator.pushNamed(context, '/cart');
        }
      } else {
        String msg = '장바구니 담기에 실패했습니다';
        try {
          final body = jsonDecode(utf8.decode(res.bodyBytes));
          if (body is Map && body['message'] is String) {
            msg = body['message'] as String;
          }
        } catch (_) {}
        _snack(msg, isError: true);
      }
    } catch (e) {
      debugPrint('장바구니 담기 오류: $e');
      if (mounted) _snack('네트워크 오류가 발생했습니다', isError: true);
    } finally {
      if (mounted) setState(() => _addingToCart.remove(perfume.id));
    }
  }

  void _snack(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red : _dark,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'MY WISHLIST',
          style: TextStyle(
            color: _dark,
            fontSize: 12,
            letterSpacing: 3,
            fontWeight: FontWeight.w500,
          ),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : _wishlist.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadWishlist,
                  color: _gold,
                  child: Column(
                    children: [
                      _buildHeader(),
                      Expanded(child: _buildWishlistGrid()),
                    ],
                  ),
                ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: _gold.withOpacity(0.2)),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.favorite, color: _gold, size: 20),
          const SizedBox(width: 8),
          Text(
            '${_wishlist.length}개의 향수',
            style: const TextStyle(
              color: _dark,
              fontSize: 13,
              letterSpacing: 1,
            ),
          ),
          const Spacer(),
          Text(
            '총 ${_formatPrice(_calculateTotal())}원',
            style: const TextStyle(
              color: _dark,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWishlistGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.6,
        crossAxisSpacing: 16,
        mainAxisSpacing: 20,
      ),
      itemCount: _wishlist.length,
      itemBuilder: (context, index) {
        return _buildWishlistCard(_wishlist[index]);
      },
    );
  }

  Widget _buildWishlistCard(Perfume perfume) {
    final isAdding = _addingToCart.contains(perfume.id);

    return GestureDetector(
      onTap: () {
        // 향수 상세 페이지 — 동적 라우트
        Navigator.pushNamed(context, '/perfumes/${perfume.id}');
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: _gold.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 이미지
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    color: _bg,
                    child: perfume.imageUrl != null
                        ? Image.network(
                            perfume.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _placeholderImage(),
                          )
                        : _placeholderImage(),
                  ),

                  // 삭제 버튼
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () => _removeFromWishlist(perfume),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.9),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.favorite,
                          color: Colors.red,
                          size: 18,
                        ),
                      ),
                    ),
                  ),

                  // 할인율 배지
                  if (perfume.isOnSale)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${perfume.saleRate}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // 정보
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (perfume.brandName != null)
                      Text(
                        perfume.brandName!,
                        style: const TextStyle(
                          color: _grey,
                          fontSize: 10,
                          letterSpacing: 1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 4),
                    Text(
                      perfume.name,
                      style: const TextStyle(
                        color: _dark,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),

                    // 가격
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (perfume.isOnSale)
                          Text(
                            '${_formatPrice(perfume.price)}원',
                            style: const TextStyle(
                              color: _grey,
                              fontSize: 10,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        Text(
                          '${_formatPrice(perfume.displayPrice)}원',
                          style: TextStyle(
                            color: perfume.isOnSale ? Colors.red : _dark,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 8),

                    // 장바구니 담기 버튼 — /api/cart/add 실제 호출
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isAdding ? null : () => _addToCart(perfume),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _dark,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: const RoundedRectangleBorder(),
                          disabledBackgroundColor: _grey.withOpacity(0.4),
                        ),
                        child: isAdding
                            ? const SizedBox(
                                height: 14,
                                width: 14,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 1.5,
                                ),
                              )
                            : const Text(
                                '장바구니',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  letterSpacing: 1,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.favorite_border,
            size: 80,
            color: _grey.withOpacity(0.5),
          ),
          const SizedBox(height: 24),
          const Text(
            '위시리스트가 비어있습니다',
            style: TextStyle(
              color: _grey,
              fontSize: 16,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            '마음에 드는 향수를 담아보세요',
            style: TextStyle(
              color: _grey,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              // 향수 둘러보기 — collections로 이동
              Navigator.pushNamed(context, '/collections');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _dark,
              padding: const EdgeInsets.symmetric(
                horizontal: 32,
                vertical: 14,
              ),
              shape: const RoundedRectangleBorder(),
            ),
            child: const Text(
              '향수 둘러보기',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                letterSpacing: 2,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholderImage() {
    return const Center(
      child: Icon(Icons.local_florist, size: 48, color: _gold),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
  }

  int _calculateTotal() {
    return _wishlist.fold(0, (sum, perfume) => sum + perfume.displayPrice);
  }
}
