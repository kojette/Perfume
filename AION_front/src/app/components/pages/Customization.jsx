import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';
import { ShoppingBag, Plus, Trash2, Edit3 } from 'lucide-react';
import ScentBlend from './ScentBlend';
import CustomizationEditor from './CustomizationEditor';
import AiScentStudio from './AiScentStudio';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const Customization = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('bottle');
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState(null);

  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const token = sessionStorage.getItem('accessToken');

  useEffect(() => {
    fetchMyDesigns();
  }, []);

  const fetchMyDesigns = async () => {
    setLoading(true);
    try {
      if (!token) { setLoading(false); return; }
      const res = await fetch(`${API_BASE_URL}/api/custom/designs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setDesigns(json.data || []);
      }
    } catch (e) {
      console.error('디자인 목록 로드 오류:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (designId) => {
    if (!window.confirm('이 디자인을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/designs/${designId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setDesigns(prev => prev.filter(d => d.designId !== designId));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (e) {
      console.error('삭제 오류:', e);
    }
  };

  const handleAddToCart = async (design) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart/custom`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customDesignId: design.designId,
          name: design.name,
          price: design.totalPrice,
          quantity: 1,
          imageUrl: design.previewImageUrl,
        }),
      });
      if (res.ok) {
        alert('장바구니에 담겼습니다!');
      } else {
        alert('장바구니 추가에 실패했습니다.');
      }
    } catch (e) {
      console.error('장바구니 오류:', e);
    }
  };

  const openNewEditor = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setEditingDesign(null);
    setEditorOpen(true);
  };

  const openEditEditor = (design) => {
    setEditingDesign(design);
    setEditorOpen(true);
  };

  const handleEditorSave = async () => {
    setEditorOpen(false);
    await fetchMyDesigns();
  };

  if (editorOpen) {
    return (
      <div className="min-h-screen bg-[#faf8f3]">

        <div className="sticky top-0 z-10 bg-white border-b border-[#c9a961]/20 px-6 py-3 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setEditorOpen(false)}
            className="flex items-center gap-2 text-[11px] tracking-widest text-[#8b8278] hover:text-[#c9a961] transition-colors"
          >
            ← 목록으로
          </button>
          <span className="text-[10px] tracking-[0.3em] text-[#c9a961] italic">
            {editingDesign ? 'EDIT DESIGN' : 'NEW DESIGN'}
          </span>
        </div>

        <InlineEditor
          onClose={() => setEditorOpen(false)}
          onSave={handleEditorSave}
          initialData={editingDesign}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">CREATE YOUR SIGNATURE</div>
          <Ornament className="mb-6" />
          <h2 className="text-3xl font-serif text-[#1a1a1a] tracking-[0.3em] mb-4">CUSTOMIZING</h2>
          <p className="text-[#8b8278] text-sm tracking-widest italic">나만의 향수를 완성하세요</p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="flex border border-[#c9a961]/40 overflow-hidden">
            <button
              onClick={() => setActiveMode('bottle')}
              className={`flex items-center gap-2.5 px-8 py-4 text-[11px] tracking-[0.25em] transition-all duration-300 ${
                activeMode === 'bottle'
                  ? 'bg-[#1a1a1a] text-[#c9a961]'
                  : 'bg-white text-[#8b8278] hover:text-[#2a2620] hover:bg-[#faf8f3]'
              }`}
            >

              <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="0" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
                <rect x="3" y="3" width="8" height="3" rx="1" fill="currentColor" opacity="0.5"/>
                <ellipse cx="7" cy="13" rx="6" ry="7" fill="currentColor" opacity="0.9"/>
              </svg>
              향수 공병 디자인
            </button>

            <div className="w-px bg-[#c9a961]/30" />

            <button
              onClick={() => setActiveMode('scent')}
              className={`flex items-center gap-2.5 px-8 py-4 text-[11px] tracking-[0.25em] transition-all duration-300 ${
                activeMode === 'scent'
                  ? 'bg-[#1a1a1a] text-[#c9a961]'
                  : 'bg-white text-[#8b8278] hover:text-[#2a2620] hover:bg-[#faf8f3]'
              }`}
            >

              <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2 C5 5 3 8 3 11 C3 14.5 5.2 17 8 17 C10.8 17 13 14.5 13 11 C13 8 11 5 8 2Z" fill="currentColor" opacity="0.85"/>
                <path d="M8 2 C6 4 5 6 5 8 C5 10 6.2 11.5 8 11.5" stroke="currentColor" strokeWidth="0.8" opacity="0.4" fill="none"/>
                <path d="M7 0 Q8 1 9 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6"/>
              </svg>
              나만의 향 조합하기
            </button>
          </div>
        </div>

        {activeMode === 'bottle' && (
          <>

            <div className="flex justify-center mb-10">
              <button
                onClick={openNewEditor}
                className="flex items-center gap-3 px-10 py-4 border-2 border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all duration-500 tracking-[0.3em] text-sm group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                내 향수 디자인 추가
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20 italic tracking-widest text-[#8b8278]">LOADING...</div>
            ) : designs.length === 0 ? (
              <div className="text-center py-20 text-[#8b8278] border-t border-b border-[#c9a961]/20">
                <p className="italic mb-2">아직 저장된 디자인이 없습니다.</p>
                <p className="text-xs tracking-widest">위 버튼을 눌러 첫 번째 디자인을 만들어보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {designs.map(design => (
                  <div
                    key={design.designId}
                    className="bg-white border border-[#c9a961]/20 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="h-56 bg-[#f0ece4] flex items-center justify-center overflow-hidden">
                      {design.previewImageUrl ? (
                        <img src={design.previewImageUrl} alt={design.name} className="h-full object-contain" />
                      ) : (
                        <div className="text-[#c9a961]/40 text-xs tracking-widest italic">NO PREVIEW</div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="font-serif text-lg text-[#1a1a1a] mb-1">{design.name}</h3>
                      <p className="text-[#c9a961] text-xs tracking-widest mb-4">₩{(design.totalPrice || 0).toLocaleString()}</p>

                      <div className="text-[10px] tracking-wider text-[#8b8278] space-y-1 mb-5 border-t border-[#c9a961]/10 pt-3">
                        {design.bottlePrice > 0 && (
                          <div className="flex justify-between"><span>공병</span><span>₩{design.bottlePrice.toLocaleString()}</span></div>
                        )}
                        {design.printingPrice > 0 && (
                          <div className="flex justify-between"><span>프린팅</span><span>₩{design.printingPrice.toLocaleString()}</span></div>
                        )}
                        {design.stickerPrice > 0 && (
                          <div className="flex justify-between"><span>스티커</span><span>₩{design.stickerPrice.toLocaleString()}</span></div>
                        )}
                        {design.engravingPrice > 0 && (
                          <div className="flex justify-between"><span>각인</span><span>₩{design.engravingPrice.toLocaleString()}</span></div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(design)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-widest hover:bg-[#c9a961] transition-all"
                        >
                          <ShoppingBag size={12} />
                          CART
                        </button>
                        <button
                          onClick={() => openEditEditor(design)}
                          className="px-3 py-3 border border-[#c9a961]/30 text-[#c9a961] hover:bg-[#c9a961] hover:text-white transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(design.designId)}
                          className="px-3 py-3 border border-red-200 text-red-300 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeMode === 'scent' && (
          <div className="space-y-6">
            <div className="border border-[#c9a961]/20 bg-white px-8 py-6 text-center">
              <p className="text-[9px] tracking-[0.6em] text-[#c9a961] mb-2">POWERED BY GEMINI & CLAUDE</p>
              <h3 className="font-serif text-xl text-[#1a1a1a] tracking-wider mb-2">AI SCENT STUDIO</h3>
              <p className="text-sm text-[#8b8278] italic leading-relaxed">
                AI가 이미지나 감성 키워드를 분석해 향수를 추천하고,<br />
                전문 조향사 AI와의 대화로 세상에 하나뿐인 향수를 설계합니다.
              </p>
            </div>
            <AiScentStudio />
          </div>
        )}

      </div>
    </div>
  );
};

const InlineEditor = ({ onClose, onSave, initialData }) => {
  return (
    <div className="customization-inline-wrapper">
      <style>{`
        .customization-inline-wrapper .fixed.inset-0 {
          position: relative !important;
          background: transparent !important;
          backdrop-filter: none !important;
          display: block !important;
          padding: 0 !important;
        }
        .customization-inline-wrapper .fixed.inset-0 > div {
          max-height: none !important;
          height: auto !important;
          min-height: calc(100vh - 56px) !important;
          box-shadow: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
          border-top: none !important;
          max-width: 100% !important;
          width: 100% !important;
        }
      `}</style>
      <CustomizationEditor
        onClose={onClose}
        onSave={onSave}
        initialData={initialData}
      />
    </div>
  );
};

export default Customization;