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
import 'screens/terms_screen.dart';
import 'screens/privacy_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/find_password_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/profile_edit_screen.dart';
import 'screens/wishlist_screen.dart';
import 'screens/mypage_screen.dart';

import 'screens/signature_screen.dart';
import 'screens/collections_screen.dart';

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

  '/signature': (context) => const SignatureScreen(),
  '/collections': (context) => const CollectionsScreen(),
};