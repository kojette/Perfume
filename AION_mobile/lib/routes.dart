import 'package:flutter/material.dart';

// ── 정적 라우트 (인자 없음) ─────────────────────────────────────
import 'screens/cart_screen.dart';
import 'screens/faq_screen.dart';
import 'screens/customer_inquiry_screen.dart';
import 'screens/store_screen.dart';
import 'screens/search_result_screen.dart';
import 'screens/recommend_screen.dart';
import 'screens/story_screen.dart';
import 'screens/customization_screen.dart';
import 'screens/terms_screen.dart';
import 'screens/privacy_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/find_password_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/profile_edit_screen.dart';
import 'screens/wishlist_screen.dart';
import 'screens/mypage_screen.dart';
import 'screens/bottle_editor_screen.dart';
import 'screens/signature_screen.dart';
import 'screens/collections_screen.dart';
import 'screens/notification_panel_screen.dart';
import 'screens/start_screen.dart';
import 'screens/main_screen.dart';

// ── 동적 라우트 (URL 인자) ─────────────────────────────────────
import 'screens/perfume_detail_screen.dart';
import 'screens/order_receipt_screen.dart';
import 'screens/order_tracking_screen.dart';
import 'screens/return_exchange_screen.dart';

/// ─────────────────────────────────────────────────────────────
/// 정적 라우트 — 인자 없이 진입 가능한 화면들
/// (bottle-editor는 인자 선택적: design map 전달 시 편집 모드)
/// ─────────────────────────────────────────────────────────────
final Map<String, WidgetBuilder> routes = {
  // 주의: '/' 라우트는 등록하지 않음.
  // main.dart의 MaterialApp.home이 StartScreen을 가리키고 있어,
  // routes에 '/'를 넣으면 redundant 에러 발생.
  // 명시적 진입이 필요할 땐 '/start'를 사용한다.
  '/main':              (_) => MainScreen(),
  '/start':             (_) => const StartScreen(),

  // 인증
  '/login':             (_) => const LoginScreen(),
  '/signup':            (_) => const SignupScreen(),
  '/find-password':     (_) => const FindPasswordScreen(),
  '/reset-password':    (_) => const ResetPasswordScreen(),

  // 마이페이지
  '/mypage':            (_) => const MyPageScreen(),
  '/profile/edit':      (_) => const ProfileEditScreen(),
  '/wishlist':          (_) => const WishlistScreen(),

  // 쇼핑
  '/cart':              (_) => const CartScreen(),
  '/store':             (_) => const StoreScreen(),
  '/search':            (_) => const SearchResultScreen(),
  '/recommend':         (_) => const RecommendScreen(),
  '/collections':       (_) => const CollectionsScreen(),
  '/signature':         (_) => const SignatureScreen(),

  // 콘텐츠
  '/story':             (_) => const StoryScreen(),
  '/notifications':     (_) => const NotificationPanelScreen(),

  // 커스터마이즈
  '/custom':            (_) => const CustomizationScreen(),
  '/bottle-editor':     (_) => const BottleEditorScreen(),

  // 고객센터
  '/faq':               (_) => const FAQScreen(),
  '/customer-inquiry':  (_) => const CustomerInquiryScreen(),

  // 정책
  '/terms':             (_) => const TermsScreen(),
  '/privacy':           (_) => const PrivacyScreen(),
};

/// ─────────────────────────────────────────────────────────────
/// 동적 라우트 — URL 안에 ID가 포함된 화면들
///
/// URL 패턴:
///   /perfumes/:id
///   /orders/:id              → 영수증
///   /orders/:id/tracking     → 배송추적
///   /orders/:id/return-exchange → 반품/교환
/// ─────────────────────────────────────────────────────────────
Route<dynamic>? onGenerateRoute(RouteSettings settings) {
  final name = settings.name ?? '';

  // /perfumes/:id
  final perfumeMatch = RegExp(r'^/perfumes/([^/]+)$').firstMatch(name);
  if (perfumeMatch != null) {
    final perfumeId = int.tryParse(perfumeMatch.group(1)!);
    if (perfumeId == null) return _notFound(settings);
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => PerfumeDetailScreen(perfumeId: perfumeId),
    );
  }

  // /orders/:id/tracking
  final trackingMatch = RegExp(r'^/orders/([^/]+)/tracking$').firstMatch(name);
  if (trackingMatch != null) {
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => OrderTrackingScreen(orderId: trackingMatch.group(1)!),
    );
  }

  // /orders/:id/return-exchange
  final returnMatch = RegExp(r'^/orders/([^/]+)/return-exchange$').firstMatch(name);
  if (returnMatch != null) {
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => ReturnExchangeScreen(orderId: returnMatch.group(1)!),
    );
  }

  // /orders/:id (영수증)
  final receiptMatch = RegExp(r'^/orders/([^/]+)$').firstMatch(name);
  if (receiptMatch != null) {
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => OrderReceiptScreen(orderId: receiptMatch.group(1)!),
    );
  }

  return null;
}

/// 잘못된 ID로 진입한 경우의 폴백
Route<dynamic> _notFound(RouteSettings settings) => MaterialPageRoute(
  settings: settings,
  builder: (_) => const Scaffold(
    body: Center(child: Text('잘못된 경로입니다.')),
  ),
);

/// ─────────────────────────────────────────────────────────────
/// 헬퍼 — MaterialPageRoute push가 필요한 곳에서 일관되게 사용
///
/// 사용 예:
///   Navigator.of(context).push(buildRoute(() => const ProfileEditScreen()));
///   Navigator.of(context).push(buildRoute(() => OrderReceiptScreen(orderId: id)));
///
/// 가능하면 named route(`Navigator.pushNamed`)를 우선 사용하고,
/// 위젯에 인자를 넘겨야 하는 경우에만 이 헬퍼를 사용한다.
/// ─────────────────────────────────────────────────────────────
PageRoute<T> buildRoute<T>(Widget Function() builder, {RouteSettings? settings}) {
  return MaterialPageRoute<T>(
    settings: settings,
    builder: (_) => builder(),
  );
}