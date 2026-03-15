import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'screens/start_screen.dart';
import 'routes.dart';

// ──────────────────────────────────────────────────────────────
//  Supabase 키를 여기서 직접 입력하세요
//  (원래 supabase_config.dart 에 있던 값을 옮겨 붙여넣기)
// ──────────────────────────────────────────────────────────────
const _supabaseUrl     = 'https://wyjukvjpccxscbmlyabc.supabase.co';
const _supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5anVrdmpwY2N4c2NibWx5YWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjQzMDMsImV4cCI6MjA4Mzc0MDMwM30._3ho4KSQr7zaoR_-FGpekZDXmh9HH-yNNNvlN0JnLvs';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: _supabaseUrl,
    anonKey: _supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  runApp(const AionApp());
}

class AionApp extends StatelessWidget {
  const AionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'AION Perfume',
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFAF8F3),
        fontFamily: 'Pretendard',
        primaryColor: const Color(0xFFC9A961),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFC9A961),
          secondary: Color(0xFF2A2620),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: Color(0xFF2A2620)),
          titleTextStyle: TextStyle(
            color: Color(0xFF2A2620),
            fontSize: 12,
            letterSpacing: 3,
            fontWeight: FontWeight.w500,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2A2620),
            foregroundColor: Colors.white,
            shape: const RoundedRectangleBorder(),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
      home: const StartScreen(),
      routes: routes,
    );
  }
}
