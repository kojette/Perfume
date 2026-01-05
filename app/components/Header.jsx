import { ShoppingBag, Heart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-[#faf8f3]/98 backdrop-blur-sm border-b border-[#c9a961]/20">
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
              className="lg:hidden text-[#c9a961]"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="font-display text-2xl tracking-[0.4em] text-[#c9a961]">
              OLYMPUS
            </h1>
          </div>

          <nav className="hidden lg:flex items-center gap-8 tracking-[0.2em] text-sm">
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">컬렉션</a>
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">시그니처</a>
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">스토리</a>
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">매장</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:text-[#c9a961] transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2 hover:text-[#c9a961] transition-colors">
              <Heart size={20} />
            </button>
            <button className="p-2 hover:text-[#c9a961] transition-colors">
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="lg:hidden pt-6 pb-2 flex flex-col gap-4 tracking-[0.2em] text-sm border-t border-[#c9a961]/20 mt-4">
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">컬렉션</a>
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">시그니처</a>
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">스토리</a>
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">매장</a>
          </nav>
        )}
      </div>
    </header>
  );
}
