import 'package:flutter/material.dart';

// 기본 장식 ornament
class Ornament extends StatelessWidget {
  const Ornament({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 40, height: 1, color: const Color(0xFFC9A961)),
        const SizedBox(width: 8),
        const Icon(Icons.auto_awesome, size: 12, color: Color(0xFFC9A961)),
        const SizedBox(width: 8),
        Container(width: 40, height: 1, color: const Color(0xFFC9A961)),
      ],
    );
  }
}

// 코너 장식 ornament
class CornerOrnament extends StatelessWidget {
  final String position;
  final double opacity;

  const CornerOrnament({
    super.key,
    this.position = 'top-left',
    this.opacity = 0.4,
  });

  @override
  Widget build(BuildContext context) {
    Widget ornamentWidget = Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Color(0xFFC9A961).withOpacity(opacity), width: 2),
          left: BorderSide(color: Color(0xFFC9A961).withOpacity(opacity), width: 2),
        ),
      ),
    );

    // 위치에 따라 회전
    double rotation = 0;
    switch (position) {
      case 'top-right':
        rotation = 1.5708; // 90도
        break;
      case 'bottom-left':
        rotation = -1.5708; // -90도
        break;
      case 'bottom-right':
        rotation = 3.14159; // 180도
        break;
    }

    if (rotation != 0) {
      ornamentWidget = Transform.rotate(
        angle: rotation,
        child: ornamentWidget,
      );
    }

    return Opacity(
      opacity: opacity,
      child: ornamentWidget,
    );
  }
}

// 구분선 장식
class DecorativeDivider extends StatelessWidget {
  const DecorativeDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFC9A961),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            '✦',
            style: TextStyle(color: Color(0xFFC9A961), fontSize: 14),
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  const Color(0xFFC9A961),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}