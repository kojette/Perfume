import 'package:flutter/material.dart';
import 'admin_announcements_screen.dart';
import 'admin_coupons_screen.dart';
import 'admin_events_screen.dart';
import 'admin_members_screen.dart';
import 'admin_perfumes_screen.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);

  @override
  Widget build(BuildContext context) {
    final menus = [
      _AdminMenu(
        title: '고객 관리',
        subtitle: 'Customer Support',
        icon: Icons.people_outline,
        color: const Color(0xFF4A90D9),
        screen: const AdminMembersScreen(),
      ),
      _AdminMenu(
        title: '향수 데이터',
        subtitle: 'Perfume Management',
        icon: Icons.science_outlined,
        color: const Color(0xFF9B59B6),
        screen: const AdminPerfumesScreen(),
      ),
      _AdminMenu(
        title: '공지사항',
        subtitle: 'Announcements',
        icon: Icons.campaign_outlined,
        color: const Color(0xFFE67E22),
        screen: const AdminAnnouncementsScreen(),
      ),
      _AdminMenu(
        title: '이벤트 관리',
        subtitle: 'Event Management',
        icon: Icons.celebration_outlined,
        color: const Color(0xFF27AE60),
        screen: const AdminEventsScreen(),
      ),
      _AdminMenu(
        title: '쿠폰 / 포인트',
        subtitle: 'Coupons & Points',
        icon: Icons.local_offer_outlined,
        color: const Color(0xFFE74C3C),
        screen: const AdminCouponsScreen(),
      ),
    ];

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'ADMIN DASHBOARD',
          style: TextStyle(color: _dark, fontSize: 13, letterSpacing: 4, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: _gold.withOpacity(0.2)),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            const Text(
              'MANAGEMENT',
              style: TextStyle(color: _gold, fontSize: 9, letterSpacing: 4, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 4),
            const Text(
              'Admin Panel',
              style: TextStyle(color: _dark, fontSize: 24, letterSpacing: 1),
            ),
            const SizedBox(height: 24),

            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
                childAspectRatio: 1.1,
                children: menus.map((m) => _AdminMenuCard(menu: m)).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── 메뉴 카드 ───────────────────────────────────────────────

class _AdminMenu {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Widget screen;
  const _AdminMenu({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.screen,
  });
}

class _AdminMenuCard extends StatelessWidget {
  final _AdminMenu menu;
  const _AdminMenuCard({super.key, required this.menu});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => menu.screen),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: menu.color,
                shape: BoxShape.circle,
              ),
              child: Icon(menu.icon, color: Colors.white, size: 26),
            ),
            const SizedBox(height: 12),
            Text(
              menu.title,
              style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF2A2620), letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              menu.subtitle,
              style: const TextStyle(fontSize: 9, color: Color(0xFF8B8278), letterSpacing: 0.5),
            ),
          ],
        ),
      ),
    );
  }
}
