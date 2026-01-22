import 'package:flutter/material.dart';
import 'package:aion_perfume_app/widgets/ornament.dart';

class AboutSection extends StatelessWidget {
  const AboutSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      child: Column(
        children: [
          // 이미지
          Container(
            height: 300,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFC9A961).withOpacity(0.2), width: 4),
            ),
            child: Stack(
              children: [
                Image.network(
                  'https://images.unsplash.com/photo-1608656218680-e8be81ce71d7?w=800',
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: const Color(0xFFF7F7F7),
                      child: const Center(
                        child: Icon(Icons.image, size: 50, color: Colors.black12),
                      ),
                    );
                  },
                ),
                // 코너 장식
                const Positioned(top: 0, left: 0, child: CornerOrnament(position: 'top-left')),
                const Positioned(top: 0, right: 0, child: CornerOrnament(position: 'top-right')),
                const Positioned(bottom: 0, left: 0, child: CornerOrnament(position: 'bottom-left')),
                const Positioned(bottom: 0, right: 0, child: CornerOrnament(position: 'bottom-right')),
              ],
            ),
          ),
          
          const SizedBox(height: 40),

          // 175 YEARS 배지
          Container(
            padding: const EdgeInsets.all(24),
            color: const Color(0xFFC9A961),
            child: const Column(
              children: [
                Text(
                  '175',
                  style: TextStyle(
                    fontSize: 36,
                    color: Colors.white,
                    fontWeight: FontWeight.w300,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'YEARS OF\nEXCELLENCE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 3,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 40),

          // 텍스트 콘텐츠
          const Text(
            'OUR LEGACY',
            style: TextStyle(
              color: Color(0xFFC9A961),
              fontSize: 10,
              letterSpacing: 4,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 16),
          const Ornament(),
          const SizedBox(height: 24),

          const Text(
            '천년의 향기,\n영원의 예술',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 32,
              letterSpacing: 3,
              color: Color(0xFF2A2620),
              height: 1.3,
            ),
          ),

          const SizedBox(height: 30),

          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                Text(
                  'OLYMPUS는 1847년 그리스 아테네에서 시작된 전통 조향 하우스입니다.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF666666),
                    fontStyle: FontStyle.italic,
                    height: 1.8,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  '파르테논 신전의 대리석처럼 순수하고, 에게해의 석양처럼 찬란한 향수를 만들어온 175년의 유산을 이어가고 있습니다.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF666666),
                    fontStyle: FontStyle.italic,
                    height: 1.8,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  '고대 그리스의 신화와 철학에서 영감을 받아, 각 향수는 하나의 서사시가 되어 당신만의 이야기를 써내려갑니다.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF666666),
                    fontStyle: FontStyle.italic,
                    height: 1.8,
                  ),
                ),
                SizedBox(height: 24),
                Text(
                  '"향기는 영혼의 언어다" - 플라톤',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFFC9A961),
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 30),
          const DecorativeDivider(),
          const SizedBox(height: 30),

          // 버튼
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              side: const BorderSide(color: Color(0xFFC9A961), width: 2),
              shape: const RoundedRectangleBorder(),
            ),
            child: const Text(
              '브랜드 여정 탐험하기',
              style: TextStyle(
                color: Color(0xFFC9A961),
                fontSize: 12,
                letterSpacing: 3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}