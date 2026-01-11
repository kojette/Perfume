import 'package:flutter/material.dart';
import 'package:aion_perfume_app/screens/home_screen.dart'; // 홈 화면으로 넘어가야 하니 import!
import '../theme/aion_theme.dart';

class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  @override
  void initState() {
    super.initState();
    // 2초 뒤에 메인 홈으로 자동 이동
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {//필요한 조건문인지(규원)
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const MainHomePage()),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFE8EADF), Color(0xFFF5F5F0)],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'E S S E N C E  O F  D I V I N E',
                style: TextStyle(fontSize: 10, color: Color(0xFFBC9E5D), letterSpacing: 4),
              ),
              const SizedBox(height: 15),
              const Text(
                'A  I  O  N',
                style: TextStyle(fontSize: 48, fontWeight: FontWeight.w100, letterSpacing: 18, color: Colors.black87),
              ),
              const SizedBox(height: 25),
              const Text(
                '영원한 그들의 향을 담다',
                style: TextStyle(fontSize: 15, color: Colors.black54, letterSpacing: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}