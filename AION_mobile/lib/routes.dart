import 'screens/cart_screen.dart';
import 'screens/faq_screen.dart';
import 'screens/customer_inquiry_screen.dart';
import 'screens/store_screen.dart';
import 'screens/search_result_screen.dart';
import 'screens/recommend_screen.dart';



final routes = {
  '/cart': (context) => const CartScreen(),
  '/faq': (context) => const FAQScreen(),
  '/customer-inquiry': (context) => const CustomerInquiryScreen(),
  '/store': (context) => const StoreScreen(),
  '/search': (context) => const SearchResultScreen(),
  '/recommend': (context) => const RecommendScreen(),
};