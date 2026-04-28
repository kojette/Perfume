import 'package:flutter/material.dart';

import 'screens/cart_screen.dart';
import 'screens/faq_screen.dart';
import 'screens/customer_inquiry_screen.dart';
import 'screens/store_screen.dart';
import 'screens/search_result_screen.dart';
import 'screens/recommend_screen.dart';
import 'screens/story_screen.dart';
import 'screens/customization_screen.dart';
import 'screens/order_receipt_screen.dart';
import 'screens/order_tracking_screen.dart';
import 'screens/return_exchange_screen.dart';
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
import 'screens/perfume_detail_screen.dart';
import 'screens/notification_panel_screen.dart';

/// 정적 라우트 (인자 없는 화면들)
final Map<String, WidgetBuilder> routes = {
  '/cart':               (context) => const CartScreen(),
  '/faq':                (context) => const FAQScreen(),
  '/customer-inquiry':   (context) => const CustomerInquiryScreen(),
  '/store':              (context) => const StoreScreen(),
  '/search':             (context) => const SearchResultScreen(),
  '/recommend':          (context) => const RecommendScreen(),
  '/story':              (context) => const StoryScreen(),
  '/custom':             (context) => const CustomizationScreen(),
  '/terms':              (context) => const TermsScreen(),
  '/privacy':            (context) => const PrivacyScreen(),
  '/login':              (context) => const LoginScreen(),
  '/signup':             (context) => const SignupScreen(),
  '/find-password':      (context) => const FindPasswordScreen(),
  '/reset-password':     (context) => const ResetPasswordScreen(),
  '/profile/edit':       (context) => const ProfileEditScreen(),
  '/wishlist':           (context) => const WishlistScreen(),
  '/mypage':             (context) => const MyPageScreen(),
  '/bottle-editor':      (context) => const BottleEditorScreen(),

  '/signature':          (context) => const SignatureScreen(),
  '/collections':        (context) => const CollectionsScreen(),
  '/notifications':      (context) => const NotificationPanelScreen(),
};

Route<dynamic>? onGenerateRoute(RouteSettings settings) {
  final name = settings.name ?? '';

  // /perfumes/:id
  final perfumeMatch = RegExp(r'^/perfumes/([^/]+)$').firstMatch(name);
  if (perfumeMatch != null) {
    final perfumeId = int.tryParse(perfumeMatch.group(1)!);
    if (perfumeId == null) return null; // 숫자가 아니면 404 처리
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => PerfumeDetailScreen(perfumeId: perfumeId),
    );
  }

  // /orders/:id/tracking
  final trackingMatch = RegExp(r'^/orders/([^/]+)/tracking$').firstMatch(name);
  if (trackingMatch != null) {
    final orderId = trackingMatch.group(1)!;
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => OrderTrackingScreen(orderId: orderId),
    );
  }

  // /orders/:id/return-exchange
  final returnMatch = RegExp(r'^/orders/([^/]+)/return-exchange$').firstMatch(name);
  if (returnMatch != null) {
    final orderId = returnMatch.group(1)!;
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => ReturnExchangeScreen(orderId: orderId),
    );
  }

  // /orders/:id (영수증)
  final receiptMatch = RegExp(r'^/orders/([^/]+)$').firstMatch(name);
  if (receiptMatch != null) {
    final orderId = receiptMatch.group(1)!;
    return MaterialPageRoute(
      settings: settings,
      builder: (_) => OrderReceiptScreen(orderId: orderId),
    );
  }

  return null;
}