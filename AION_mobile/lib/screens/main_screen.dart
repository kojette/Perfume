import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'recommend_screen.dart';
import 'wishlist_screen.dart';
import 'collections_screen.dart';
import 'signature_screen.dart';
import 'mypage_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);

  final List<Widget> _screens = [
    const HomeScreen(),
    const RecommendScreen(),
    const CollectionsScreen(),
    const WishlistScreen(),
    const MyPageScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: _gold,
        unselectedItemColor: _dark.withOpacity(0.4),
        selectedLabelStyle: const TextStyle(
          fontSize: 10,
          letterSpacing: 1,
          fontWeight: FontWeight.w500,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 10,
          letterSpacing: 1,
        ),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'HOME',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            activeIcon: Icon(Icons.search),
            label: 'SEARCH',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.collections_bookmark_outlined),
            activeIcon: Icon(Icons.collections_bookmark),
            label: 'COLLECTION',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_border),
            activeIcon: Icon(Icons.favorite),
            label: 'WISHLIST',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'MY PAGE',
          ),
        ],
      ),
    );
  }
}