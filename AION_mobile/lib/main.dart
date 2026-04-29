import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'screens/start_screen.dart';
import 'routes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1) .env 로드 - 실패해도 앱은 계속 뜨도록
  try {
    await dotenv.load(fileName: ".env");
  } catch (e, st) {
    debugPrint('[main] dotenv.load 실패: $e');
    debugPrint('$st');
  }

  // 2) Supabase 초기화 - null 안전하게, 실패해도 앱은 계속 뜨도록
  final supabaseUrl = dotenv.env['SUPABASE_URL'];
  final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'];

  if (supabaseUrl != null &&
      supabaseUrl.isNotEmpty &&
      supabaseAnonKey != null &&
      supabaseAnonKey.isNotEmpty) {
    try {
      await Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
        ),
      );
    } catch (e, st) {
      debugPrint('[main] Supabase.initialize 실패: $e');
      debugPrint('$st');
    }
  } else {
    debugPrint('[main] SUPABASE_URL 또는 SUPABASE_ANON_KEY 누락');
  }

  // 3) Flutter 프레임워크 단의 에러를 잡아서 앱이 통째로 죽지 않게
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('[FlutterError] ${details.exception}');
  };

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
      onGenerateRoute: onGenerateRoute,
    );
  }
}