/*import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'screens/start_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: SupabaseConfig.supabaseUrl,
    anonKey: SupabaseConfig.supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce, // 🔥 Web 필수
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
      title: 'AION',
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFAF8F3),
        fontFamily: 'Pretendard',
        primaryColor: const Color(0xFFC9A961),
        colorScheme: ColorScheme.light(
          primary: const Color(0xFFC9A961),
          secondary: const Color(0xFF2A2620),
        ),
      ),
      home: const StartScreen(),
    );
  }
}*/
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'screens/start_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Supabase 초기화 (Hero, 이벤트 배너 등에 필요)
  await Supabase.initialize(
    url: SupabaseConfig.supabaseUrl,
    anonKey: SupabaseConfig.supabaseAnonKey,
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
        scaffoldBackgroundColor: const Color(0xFFFAF8F3), // 베이지 배경
        fontFamily: 'Pretendard', // 폰트가 있으면 유지, 없으면 제거
        primaryColor: const Color(0xFFC9A961), // 골드
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFC9A961),     // 골드
          secondary: Color(0xFF2A2620),   // 다크 브라운
        ),
        // AppBar 기본 테마
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
        // 버튼 테마
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2A2620),
            foregroundColor: Colors.white,
            shape: const RoundedRectangleBorder(),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
      home: const StartScreen(), // 로그인 → MainScreen으로 이동
    );
  }
}