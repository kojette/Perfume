/*import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // 백엔드 Spring Boot 서버 URL
  // 웹(Chrome): localhost:8080
  // 에뮬레이터: 10.0.2.2:8080
  // 실기기: 192.168.x.x:8080
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080'; // ✅ 웹에서는 localhost 사용
    }
    return 'http://10.0.2.2:8080'; // 안드로이드 에뮬레이터
  }
}*/
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String get baseUrl {
    final String? envUrl = dotenv.env['API_BASE_URL'];

    if (envUrl != null && envUrl.isNotEmpty) {//.env 파일 값 우선 적용. 
      return envUrl;
    }
    if (kIsWeb) {//.env에 값이 없을 경우 기존 로직대로 작동
      return 'http://localhost:8080';
    }
    // 안드로이드 에뮬레이터 기본값
    return 'http://10.0.2.2:8080';
  }
}