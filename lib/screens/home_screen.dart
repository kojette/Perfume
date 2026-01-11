import 'package:flutter/material.dart';
import 'mypage_screen.dart';//마이페이지
import 'recommend_screen.dart';//추천페이지

// 1. StatefulWidget으로 시작해야 클릭 시 화면이 바뀝니다!
class MainHomePage extends StatefulWidget {
  const MainHomePage({super.key});

  @override
  State<MainHomePage> createState() => _MainHomePageState();
}

class _MainHomePageState extends State<MainHomePage> {
  // 현재 어떤 탭이 눌렸는지 기억하는 변수
  int _selectedIndex = 2; // 기본값은 '홈' (0:메뉴, 1:검색, 2:홈, 3:하트, 4:사람)

  // 탭을 누를 때 실행되는 함수
  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('A I O N', 
          style: TextStyle(color: Colors.black, fontSize: 16, letterSpacing: 5)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      
      // 📺 인덱스에 따라 다른 화면을 보여줌
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          const Center(child: Text('MENU PAGE')),      // 0
          const RecommendScreen(), //const Center(child: Text('SEARCH PAGE')),    // 1
          _buildHomeBody(),                            // 2 (홈 본문)
          const Center(child: Text('LIKE PAGE')),      // 3
          MyPageScreen(),//const Center(child: Text('MY PAGE')),        // 4
        ],
      ),

      // ✨ 하단 네비게이션 바 설정 (여기가 핵심!)
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed, // 아이콘 5개일 때 아이콘 위치 고정
        backgroundColor: Colors.white,
        selectedItemColor: Colors.black,     // 선택된 아이콘 검정색
        unselectedItemColor: Colors.grey,    // 선택 안된 건 회색
        showSelectedLabels: false,           // 텍스트 숨김 (럭셔리 감성)
        showUnselectedLabels: false,
        currentIndex: _selectedIndex,        // 현재 눌린 위치 표시
        onTap: _onItemTapped,                // 클릭 이벤트 연결
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.menu), label: 'Menu'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite_border), label: 'Like'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'My'),
        ],
      ),
    );
  }

  // 홈 화면 본문 (기존 웹 스타일 디자인)
  Widget _buildHomeBody() {
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            height: 400,
            width: double.infinity,
            color: const Color(0xFFF2F2F2),
            child: const Center(child: Text('Main Visual Image')),
          ),
          const SizedBox(height: 50),
          const Text('FOR YOU', style: TextStyle(fontSize: 18, letterSpacing: 4, fontWeight: FontWeight.w300)),
          const SizedBox(height: 30),
          _buildHorizontalList(),
          const SizedBox(height: 100), // 하단 바에 가려지지 않게 여유 공간
        ],
      ),
    );
  }

  Widget _buildHorizontalList() {
    return SizedBox(
      height: 250,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 20),
        itemCount: 4,
        itemBuilder: (context, index) => Container(
          width: 180,
          margin: const EdgeInsets.only(right: 20),
          color: const Color(0xFFF7F7F7),
          child: const Center(child: Icon(Icons.waves, color: Colors.black12)),
        ),
      ),
    );
  }
}