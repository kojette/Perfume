import { ShoppingBag, Heart, Search, Menu, X, User, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from './pages/NotificationPanel';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();

  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

  const handleUserClick = () => {
    if(isLoggedIn) {
      navigate('/mypage');
    } else{
      navigate('/login');
    }
  };

  return (
    <>
      <header className="relative z-[100] w-full bg-[#faf8f3]/98 backdrop-blur-sm border-b border-[#c9a961]/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Top decorative line */}
          <div className="flex items-center justify-center mb-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"></div>
            <div className="mx-3 text-[#c9a961] text-xs">✦</div>
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button 
                className="lg:hidden text-[#c9a961] p-2 cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setMenuOpen(!menuOpen)}
                style = {{ pointerEvents: 'auto' }}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="font-display text-2xl tracking-[0.4em] text-[#c9a961] cursor-pointer"
                onClick = { () => navigate('/')}>
                AION
              </h1>
            </div>

            <nav className="hidden lg:flex items-center gap-8 text-[13px] tracking-[0.2em] text-[#2a2620]">
              <a href="/collections" className="hover:text-[#c9a961] transition-colors italic">
                컬렉션
              </a>
              <a href="/signature" className="hover:text-[#c9a961] transition-colors italic">
                시그니처
              </a>
              <a href="/recommend" className="hover:text-[#c9a961] transition-colors italic">
                추천
              </a>
              <a href="/custom" className="hover:text-[#c9a961] transition-colors italic">
                커스터마이징
              </a>
              <a href="/story" className="hover:text-[#c9a961] transition-colors italic">
                스토리
              </a>
              <a href="/store" className="hover:text-[#c9a961] transition-colors italic">
                매장
              </a>
              <a href="/customer/inquiry" className="hover:text-[#c9a961] transition-colors italic">
                고객센터
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:text-[#c9a961] transition-colors cursor-pointer">
                <Search size={20} />
              </button>
              {/* 공지/이벤트 확성기 아이콘 */}
              <button 
                onClick={() => setNotificationOpen(true)}
                className="p-2 hover:text-[#c9a961] transition-colors relative cursor-pointer"
                title="공지사항 & 이벤트"
              >
                <Megaphone size={20} />
                {/* 새 알림 표시 점 (옵션) */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={handleUserClick}
                className="p-2 hover:text-[#c9a961] transition-colors cursor-pointer"
                title="내 계정">
                  <User size={20} />
              </button>
              <button 
                onClick = {() => navigate('/wishlist')}
                className="p-2 hover:text-[#c9a961] transition-colors cursor-pointer">
                <Heart size={20} />
              </button>
              <button 
                onClick = {() => navigate('/cart')}
                className="p-2 hover:text-[#c9a961] transition-colors cursor-pointer"
                title = "장바구니">
                <ShoppingBag size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <nav className="lg:hidden mt-6 pt-6 border-t border-[#c9a961]/20 flex flex-col gap-4 text-[13px] tracking-[0.2em] text-[#2a2620]">
              <a href="/collections" className="hover:text-[#c9a961] transition-colors italic" onClick={() => setMenuOpen(false)}>
                컬렉션
              </a>
              <a href="/signature" className="hover:text-[#c9a961] transition-colors italic" onClick={() => setMenuOpen(false)}>
                시그니처
              </a>
              <a href="/recommend" className="hover:text-[#c9a961] transition-colors italic" onClick={() => setMenuOpen(false)}>
                추천
              </a>
              <a href="/custom" className="hover:text-[#c9a961] transition-colors italic" onClick={() => setMenuOpen(false)}>
                커스터마이징
              </a>
              <a href="/story" className="hover:text-[#c9a961] transition-colors italic" onClick={() => setMenuOpen(false)}>
                스토리
              </a>
              <a href="/store" className="hover:text-[#c9a961] transition-colors italic" onClick={() => setMenuOpen(false)}>
                매장
              </a>
              <a href="/customer/inquiry" className="hover:text-[#c9a961] transition-colors italic" onClick={() => setMenuOpen(false)}>
                고객센터
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* 공지/이벤트 패널 */}
      <NotificationPanel 
        isOpen={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />
    </>
  );
}
