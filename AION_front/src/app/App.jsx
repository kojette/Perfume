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
import OrderTracking from "./components/pages/OrderTracking";
import ReturnExchange from "./components/pages/ReturnExchange";
import Terms from './components/pages/Terms';
import Privacy from './components/pages/Privacy';

import AdminDashboard from "./components/pages/AdminDashboard";
import AdminRoute from './components/AdminRoute';
import AnnouncementManagement from './components/pages/AnnouncementManagement';
import EventManagement from './components/pages/EventManagement';
import CouponPointManagement from './components/pages/CouponPointManagement';

import Collections from "./components/pages/Collections";
import Signature from "./components/pages/Signature";

import Story from './components/pages/Story';
import StoryManagement from './components/pages/StoryManagement';

import Customization from './components/pages/Customization';
import BottleManagement from './components/pages/BottleManagement';

import AdminStatistics from './components/pages/AdminStatistics';
import StockManagement from './components/pages/StockManagement';

import PerfumeDetail from "./components/pages/PerfumeDetail";

// Hero를 표시할 경로 (정확히 일치하는 경로만)
const HERO_PATHS = ['/', '/admin'];

function AppLayout() {
  const location = useLocation();
  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef(null);

  const isAdmin = location.pathname.startsWith("/admin");
  const showHero = HERO_PATHS.includes(location.pathname);

  useEffect(() => {
    if (!navRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (navRef.current) setNavHeight(navRef.current.offsetHeight);
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

      <div style={{ paddingTop: `${navHeight}px` }}>
        {showHero && <Hero isAdmin={isAdmin} navHeight={navHeight} />}

        <main>
          <Routes>
            <Route path="/" element={<><FeaturedProducts /><About /><Newsletter /></>} />

            <Route path="/collections" element={<Collections />} />
            <Route path="/perfumes/:id" element={<PerfumeDetail />} />
            <Route path="/signature"   element={<Signature />} />
            <Route path="/recommend"   element={<Recommend />} />

            <Route path="/custom" element={<Customization />} />

            <Route path="/story" element={<Story />} />

            <Route path="/store" element={<Store />} />

            <Route path="/cart"       element={<Cart />} />
            <Route path="/wishlist"   element={<Wishlist />} />
            <Route path="/search"     element={<SearchResult />} />
            <Route path="/orders/:id" element={<OrderReceipt />} />
            <Route path="/orders/:id/tracking" element={<OrderTracking />} />
            <Route path="/orders/:id/return-exchange" element={<ReturnExchange />} />

            <Route path="/login"          element={<Login />} />
            <Route path="/signup"         element={<Signup />} />
            <Route path="/mypage"         element={<Mypage />} />
            <Route path="/find-password"  element={<FindPassword />} />
            <Route path="/profile/edit"   element={<ProfileEdit />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/customer/inquiry" element={<CustomerInquiry />} />
            <Route path="/faq"              element={<FAQ />} />

            <Route path="/admin"               element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/support"       element={<AdminRoute><CustomerSupport /></AdminRoute>} />
            <Route path="/admin/perfumes"      element={<AdminRoute><PerfumeManagement /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AnnouncementManagement /></AdminRoute>} />
            <Route path="/admin/events"        element={<AdminRoute><EventManagement /></AdminRoute>} />
            <Route path="/admin/coupons"       element={<AdminRoute><CouponPointManagement /></AdminRoute>} />
            <Route path="/admin/story"         element={<AdminRoute><StoryManagement /></AdminRoute>} />
            <Route path="/admin/bottles"       element={<AdminRoute><BottleManagement /></AdminRoute>} />
            <Route path="/admin/statistics"    element={<AdminRoute><AdminStatistics /></AdminRoute>} />
            <Route path="/admin/stock"         element={<AdminRoute><StockManagement /></AdminRoute>} />

            <Route path="/terms"   element={<Terms />} />
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