/**
 * Customization.jsx
 * 위치: src/components/pages/Customization.jsx
 *
 * 내 커스텀 디자인 목록 페이지.
 * 모든 데이터는 백엔드 API (http://localhost:8080/api/custom/...) 를 통해 처리.
 * Supabase 직접 접근 없음.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';
import CustomizationEditor from './CustomizationEditor';
import { ShoppingBag, Plus, Trash2, Edit3 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080';

const Customization = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState(null);

  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const token = sessionStorage.getItem('accessToken');
  const userId = sessionStorage.getItem('userId');

  useEffect(() => {
    fetchMyDesigns();
  }, []);

  // ── 내 디자인 목록 조회 ─────────────────────────────────────────────
  // GET /api/custom/designs  (Header: X-User-Id)
  const fetchMyDesigns = async () => {
    setLoading(true);
    try {
      if (!userId) { setLoading(false); return; }

      const res = await fetch(`${API_BASE_URL}/api/custom/designs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId,
        },
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

  // ── 디자인 삭제 ────────────────────────────────────────────────────
  // DELETE /api/custom/designs/{designId}  (Header: X-User-Id)
  const handleDelete = async (designId) => {
    if (!window.confirm('이 디자인을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/designs/${designId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId,
        },
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

  // ── 장바구니에 커스텀 디자인 담기 ─────────────────────────────────
  // POST /api/cart/custom  (기존 Cart API에 커스텀 타입 추가 필요)
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

  // 에디터 저장 완료 후 목록 갱신
  const handleEditorSave = async () => {
    setEditorOpen(false);
    await fetchMyDesigns();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
      <div className="text-center italic tracking-widest text-[#8b8278]">PREPARING YOUR STUDIO...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* 페이지 헤더 */}
        <div className="text-center mb-16">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">CREATE YOUR SIGNATURE</div>
          <Ornament className="mb-6" />
          <h2 className="text-3xl font-serif text-[#1a1a1a] tracking-[0.3em] mb-4">CUSTOMIZING</h2>
          <p className="text-[#8b8278] text-sm tracking-widest italic">나만의 향수 공병을 디자인하세요</p>
        </div>

        {/* 새 디자인 추가 버튼 */}
        <div className="flex justify-center mb-12">
          <button
            onClick={openNewEditor}
            className="flex items-center gap-3 px-10 py-4 border-2 border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all duration-500 tracking-[0.3em] text-sm group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            내 향수 디자인 추가
          </button>
        </div>

        {/* 디자인 목록 */}
        {designs.length === 0 ? (
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
                {/* 미리보기 이미지 */}
                <div className="h-56 bg-[#f0ece4] flex items-center justify-center overflow-hidden">
                  {design.previewImageUrl ? (
                    <img src={design.previewImageUrl} alt={design.name} className="h-full object-contain" />
                  ) : (
                    <div className="text-[#c9a961]/40 text-xs tracking-widest italic">NO PREVIEW</div>
                  )}
                </div>

                {/* 디자인 정보 */}
                <div className="p-6">
                  <h3 className="font-serif text-lg text-[#1a1a1a] mb-1">{design.name}</h3>
                  <p className="text-[#c9a961] text-xs tracking-widest mb-4">₩{(design.totalPrice || 0).toLocaleString()}</p>

                  {/* 가격 상세 */}
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

                  {/* 액션 버튼 */}
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
      </div>

      {/* 디자인 에디터 모달 */}
      {editorOpen && (
        <CustomizationEditor
          onClose={() => setEditorOpen(false)}
          onSave={handleEditorSave}
          initialData={editingDesign}
        />
      )}
    </div>
  );
};

export default Customization;
