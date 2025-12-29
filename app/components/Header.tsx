import { ShoppingBag, Heart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              className="lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-2xl tracking-[0.3em]">ESSENCE</h1>
          </div>

          <nav className="hidden lg:flex items-center gap-8 tracking-wider">
            <a href="#" className="hover:opacity-70 transition-opacity">컬렉션</a>
            <a href="#" className="hover:opacity-70 transition-opacity">시그니처</a>
            <a href="#" className="hover:opacity-70 transition-opacity">스토리</a>
            <a href="#" className="hover:opacity-70 transition-opacity">매장</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:opacity-70 transition-opacity">
              <Search size={20} />
            </button>
            <button className="p-2 hover:opacity-70 transition-opacity">
              <Heart size={20} />
            </button>
            <button className="p-2 hover:opacity-70 transition-opacity">
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="lg:hidden pt-4 pb-2 flex flex-col gap-4 tracking-wider">
            <a href="#" className="hover:opacity-70 transition-opacity">컬렉션</a>
            <a href="#" className="hover:opacity-70 transition-opacity">시그니처</a>
            <a href="#" className="hover:opacity-70 transition-opacity">스토리</a>
            <a href="#" className="hover:opacity-70 transition-opacity">매장</a>
          </nav>
        )}
      </div>
    </header>
  );
}
