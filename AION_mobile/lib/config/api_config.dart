import 'package:flutter/foundation.dart' show kIsWeb;

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
}