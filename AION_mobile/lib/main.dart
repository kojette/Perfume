import 'package:flutter/material.dart';
// 아래 경로는 프로젝트 이름이 aion_app일 때 기준입니다!
import 'package:aion_perfume_app/screens/start_screen.dart'; 

void main() => runApp(const AionApp());

class AionApp extends StatelessWidget {
  const AionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'AION',
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: Colors.white,
      ),
      home: const StartScreen(), // 시작 화면으로 연결
    );
  }
}