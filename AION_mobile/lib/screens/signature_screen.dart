import 'package:flutter/material.dart';

class SignatureScreen extends StatelessWidget {
  const SignatureScreen({super.key});

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'SIGNATURE',
          style: TextStyle(
            color: _dark,
            fontSize: 12,
            letterSpacing: 3,
            fontWeight: FontWeight.w500,
          ),
        ),
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildOrnament(),
              const SizedBox(height: 24),
              const Icon(
                Icons.auto_fix_high,
                size: 80,
                color: _gold,
              ),
              const SizedBox(height: 32),
              const Text(
                'SIGNATURE',
                style: TextStyle(
                  color: _dark,
                  fontSize: 24,
                  letterSpacing: 4,
                  fontWeight: FontWeight.w300,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                '시그니처 향수',
                style: TextStyle(
                  color: _grey,
                  fontSize: 14,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: _gold.withOpacity(0.3)),
                ),
                child: const Text(
                  '이 페이지는 현재 준비 중입니다.\n곧 당신만의 시그니처 향수를\n만나보실 수 있습니다.',
                  style: TextStyle(
                    color: _grey,
                    fontSize: 13,
                    height: 1.8,
                    letterSpacing: 1,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrnament() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 40, height: 1, color: _gold),
        const SizedBox(width: 8),
        const Icon(Icons.auto_awesome, size: 12, color: _gold),
        const SizedBox(width: 8),
        Container(width: 40, height: 1, color: _gold),
      ],
    );
  }
}