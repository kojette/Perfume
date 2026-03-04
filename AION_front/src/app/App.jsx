import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { Header } from "./components/Header";
import { EventBanner } from "./components/EventBanner";
import { Hero } from "./components/Hero";
import { FeaturedProducts } from "./components/FeaturedProducts";
import { About } from "./components/About";
import { Newsletter } from "./components/Newsletter";
import { Footer } from "./components/Footer";
import ScrollToTop from './components/ScrollToTop';

import Recommend from "./components/pages/Recommend";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import Mypage from "./components/pages/Mypage";
import FindPassword from "./components/pages/FindPassword";
import ProfileEdit from "./components/pages/ProfileEdit";
import ResetPassword from "./components/pages/ResetPassword";
import CustomerInquiry from "./components/pages/CustomerInquiry";
import CustomerSupport from "./components/pages/CustomerSupport";
import FAQ from "./components/pages/FAQ";
import PerfumeManagement from './components/pages/PerfumeManagement';
import Store from './components/pages/Store';
import Cart from './components/pages/Cart';
import Wishlist from './components/pages/Wishlist';
import SearchResult from './components/pages/SearchResult';
import OrderReceipt from "./components/pages/OrderReceipt";
import Terms from './components/pages/Terms';
import Privacy from './components/pages/Privacy';

import AdminDashboard from "./components/pages/AdminDashboard";
import AdminRoute from './components/AdminRoute';
import AnnouncementManagement from './components/pages/AnnouncementManagement';
import EventManagement from './components/pages/EventManagement';
import CouponPointManagement from './components/pages/CouponPointManagement';

import Collections from "./components/pages/Collections";
import Signature from "./components/pages/Signature";
import CollectionManagement from "./components/pages/CollectionManagement";

import Story from './components/pages/Story';
import StoryManagement from './components/pages/StoryManagement';

// 커스터마이징 관련 페이지
import Customization from './components/pages/Customization';
import BottleManagement from './components/pages/BottleManagement';

function AppLayout() {
  const location = useLocation();
  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef(null);

  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");

  // ResizeObserver로 헤더+배너 높이 변화 감지 → paddingTop 즉시 재계산
  useEffect(() => {
    if (!navRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight);
      }
    });

    resizeObserver.observe(navRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <>
      {/* 고정 상단 영역: 헤더 + 이벤트 배너 */}
      <div ref={navRef} className="fixed top-0 w-full z-50 shadow-lg">
        <Header />
        <EventBanner />
      </div>

      {/* 헤더 높이만큼 본문 밀어내기 */}
      <div style={{ paddingTop: `${navHeight}px` }}>
        {/* 홈 & 어드민 페이지에만 Hero 섹션 표시 */}
        {(isHome || isAdmin) && (
          <Hero
            isAdmin={isAdmin}
            navHeight={navHeight}
          />
        )}

        <main>
          <Routes>
            {/* ── 홈 ── */}
            <Route
              path="/"
              element={
                <>
                  <FeaturedProducts />
                  <About />
                  <Newsletter />
                </>
              }
            />

            {/* ── 향수 & 컬렉션 ── */}
            <Route path="/collections" element={<Collections />} />
            <Route path="/signature"   element={<Signature />} />
            <Route path="/recommend"   element={<Recommend />} />

            {/* ── 커스터마이징 ── */}
            <Route path="/custom" element={<Customization />} />

            {/* ── 스토리 ── */}
            <Route path="/story" element={<Story />} />

            {/* ── 매장 ── */}
            <Route path="/store" element={<Store />} />

            {/* ── 쇼핑 ── */}
            <Route path="/cart"          element={<Cart />} />
            <Route path="/wishlist"      element={<Wishlist />} />
            <Route path="/search"        element={<SearchResult />} />
            <Route path="/orders/:id"    element={<OrderReceipt />} />

            {/* ── 회원 ── */}
            <Route path="/login"          element={<Login />} />
            <Route path="/signup"         element={<Signup />} />
            <Route path="/mypage"         element={<Mypage />} />
            <Route path="/find-password"  element={<FindPassword />} />
            <Route path="/profile/edit"   element={<ProfileEdit />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── 고객센터 ── */}
            <Route path="/customer/inquiry" element={<CustomerInquiry />} />
            <Route path="/faq"              element={<FAQ />} />

            {/* ── 관리자 ── */}
            <Route path="/admin"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/support"        element={<AdminRoute><CustomerSupport /></AdminRoute>} />
            <Route path="/admin/perfumes"       element={<AdminRoute><PerfumeManagement /></AdminRoute>} />
            <Route path="/admin/collections"    element={<AdminRoute><CollectionManagement /></AdminRoute>} />
            <Route path="/admin/announcements"  element={<AdminRoute><AnnouncementManagement /></AdminRoute>} />
            <Route path="/admin/events"         element={<AdminRoute><EventManagement /></AdminRoute>} />
            <Route path="/admin/coupons"        element={<AdminRoute><CouponPointManagement /></AdminRoute>} />
            <Route path="/admin/story"          element={<AdminRoute><StoryManagement /></AdminRoute>} />
            {/* 커스터마이징 관리자: 공병 템플릿 추가/비활성/삭제 */}
            <Route path="/admin/bottles"        element={<AdminRoute><BottleManagement /></AdminRoute>} />
            
            {/* 페이지 하단부 */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
          </Routes>
        </main>
      </div>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen">
        <AppLayout />
      </div>
    </BrowserRouter>
  );
}