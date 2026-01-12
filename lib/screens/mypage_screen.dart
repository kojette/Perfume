import 'package:flutter/material.dart';

// 웹의 Mypage.jsx 대응 화면
class MyPageScreen extends StatelessWidget {
  MyPageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'MY PAGE',
                style: TextStyle(
                  fontSize: 18,
                  letterSpacing: 4,
                  fontWeight: FontWeight.w300,
                ),
              ),
              SizedBox(height: 30),
              Text('사용자 정보 영역'),
              SizedBox(height: 20),
              Text('로그아웃 / 설정 / 기타 메뉴'),
            ],
          ),
        ),
      ),
    );
  }
}
