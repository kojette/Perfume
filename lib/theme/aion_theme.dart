import 'package:flutter/material.dart';

class AionTheme {
  static ThemeData get light {
    return ThemeData(
      scaffoldBackgroundColor: Colors.white,
      fontFamily: 'NotoSerif',
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: Colors.black,
          letterSpacing: 5,
          fontSize: 16,
        ),
      ),
    );
  }

  static const gold = Color(0xFFC9A961);
  static const dark = Color(0xFF2A2620);
}
