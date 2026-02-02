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

import AdminDashboard from "./components/pages/AdminDashboard";
import AdminRoute from './components/AdminRoute';
import AnnouncementManagement from './components/pages/AnnouncementManagement';
import EventManagement from './components/pages/EventManagement';
import CouponPointManagement from './components/pages/CouponPointManagement';

function AppLayout() {
  const location = useLocation();
  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef(null);

  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");

  // [수정] ResizeObserver를 사용하여 내부 요소(배너 등)가 변하면 즉시 다시 측정
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
      <div ref={navRef} className="fixed top-0 w-full z-50 shadow-lg">
        <Header />
        <EventBanner />
      </div>

      {/* Hero가 배너 뒤로 겹치게 하기 위해 padding-top을 navHeight보다 약간 적게 잡을 수도 있습니다 */}
      <div style={{ paddingTop: `${navHeight}px` }}>
        {(isHome || isAdmin) && (
          <Hero 
            isAdmin={isAdmin} 
            navHeight={navHeight} 
          />
        )}

        <main>
          <Routes>
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
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/mypage" element={<Mypage />} />
            <Route path="/find-password" element={<FindPassword />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/store" element={<Store />} />
            <Route path="/customer/inquiry" element={<CustomerInquiry />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/support" element={<AdminRoute><CustomerSupport /></AdminRoute>} />
            <Route path="/admin/perfumes" element={<AdminRoute><PerfumeManagement /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AnnouncementManagement /></AdminRoute>} />
            <Route path="/admin/events" element={<AdminRoute><EventManagement /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><CouponPointManagement /></AdminRoute>} />
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