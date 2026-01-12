import 'package:flutter/material.dart';

// 1. StatefulWidget으로 시작해야 클릭 시 화면이 바뀝니다!
class MainHomePage extends StatefulWidget {
  const MainHomePage({super.key});

  @override
  State<MainHomePage> createState() => _MainHomePageState();
}

class _MainHomePageState extends State<MainHomePage> {
  // 메인 비주얼 이미지 리스트
  final List<String> _heroImages = [
    'assets/11.png',
    'assets/12.jpg',
    'assets/13.jpg',
  ];
  int _currentImageIndex = 0;

    @override
  void initState() {
    super.initState();
    _startImageRotation();
  }

  void _startImageRotation() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 5));
      if (!mounted) return false;
      setState(() {
        _currentImageIndex =
            (_currentImageIndex + 1) % _heroImages.length;
      });
      return true;
    });
  }// 여기까지 홈 이미지 관련 메서드


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
          const Center(child: Text('SEARCH PAGE')),    // 1
          _buildHomeBody(),                            // 2 (홈 본문)
          const Center(child: Text('LIKE PAGE')),      // 3
          const Center(child: Text('MY PAGE')),        // 4
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

  Widget _buildHeroSection() {// 프론트와 동일한 홈 화면을 위함.
    return SizedBox(
      height: 400,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 🖼 Background Images (Cross-fade)
          ...List.generate(_heroImages.length, (index) {
            return AnimatedOpacity(
              opacity: index == _currentImageIndex ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 3000),
              curve: Curves.easeInOut,
              child: Image.asset(
                _heroImages[index],
                fit: BoxFit.cover,
              ),
            );
          }),

          // 🌫 Overlay
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  const Color(0xFF2A2620).withOpacity(0.6),
                  const Color(0xFF2A2620).withOpacity(0.4),
                  const Color(0xFF2A2620).withOpacity(0.6),
                ],
              ),
            ),
          ),

          // ✨ 중앙 텍스트
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Text(
                  'ESSENCE OF DIVINE',
                  style: TextStyle(
                    color: Color(0xFFC9A961),
                    letterSpacing: 4,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'AION',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 48,
                    letterSpacing: 8,
                    fontWeight: FontWeight.w300,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 홈 화면 본문 (기존 웹 스타일 디자인)
  Widget _buildHomeBody() {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildHeroSection(),
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