import 'package:flutter/material.dart';
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
}
