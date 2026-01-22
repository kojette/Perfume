import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { Header } from "./components/Header";
import { EventBanner } from "./components/EventBanner"; // 추가(규)
import { Hero } from "./components/Hero";
import { FeaturedProducts } from "./components/FeaturedProducts";
import { About } from "./components/About";
import { Newsletter } from "./components/Newsletter";
import { Footer } from "./components/Footer";

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

function AppLayout() {
  const location = useLocation();

  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      <div className="fixed top-0 w-full z-50">
        <Header />
        <EventBanner />
      </div>

      {/* Hero는 조건부 공통 렌더 */}
      <div className="pt-[160px]">
        {(isHome || isAdmin) && <Hero isAdmin={isAdmin} />}

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

            {/* 고객센터 */}
            <Route path="/customer/inquiry" element={<CustomerInquiry />} />
            <Route path="/admin/support" element={<CustomerSupport />} />
            <Route path="/admin/perfumes" element={<PerfumeManagement />} />
            <Route path="/faq" element={<FAQ />} />
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
      <div className="min-h-screen">
        <AppLayout />
      </div>
    </BrowserRouter>
  );
}