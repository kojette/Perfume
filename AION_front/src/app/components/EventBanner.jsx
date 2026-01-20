// src/components/EventBanner.jsx
import { useState, useEffect } from "react";

export function EventBanner() {
  const savedBanners = JSON.parse(localStorage.getItem("eventBanners") || "[]");
  
  const defaultBanners = savedBanners.length > 0 
    ? savedBanners 
    : [{ text: "회원가입 시 10% 할인 쿠폰 지급", icon: "🎁" }];
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [banners] = useState(defaultBanners);
  const isAdmin = window.location.pathname.startsWith("/admin");
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <>
      <div className="fixed top-[108px] w-full z-40 bg-[#c9a961] text-[#2a2620] py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3">
          <span className="text-lg">{banners[currentIdx].icon}</span>
          <span className="text-sm tracking-[0.2em] font-medium">
            {banners[currentIdx].text}
          </span>
        </div>

        {isAdmin && (
          <button
            onClick={() => setEditorOpen(true)}
            className="absolute right-8 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/60 text-[#c9a961] border border-[#c9a961]/40 text-xs tracking-widest hover:bg-black"
          >
            배너 편집
          </button>
        )}
      </div>

      {isAdmin && editorOpen && (
        <BannerEditor 
          onClose={() => setEditorOpen(false)}
          currentBanners={banners}
        />
      )}
    </>
  );
}

function BannerEditor({ onClose, currentBanners }) {
  const [banners, setBanners] = useState(currentBanners);
  const [newText, setNewText] = useState("");
  const [newIcon, setNewIcon] = useState("🎁");

  const handleAdd = () => {
    if (!newText.trim()) {
      alert("배너 텍스트를 입력하세요");
      return;
    }

    setBanners([...banners, { text: newText, icon: newIcon }]);
    setNewText("");
    setNewIcon("🎁");
  };

  const handleRemove = (index) => {
    setBanners(banners.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    localStorage.setItem("eventBanners", JSON.stringify(banners));
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-3xl bg-[#1f1c17] text-[#e8dcc8] p-8 relative border border-[#c9a961]/30 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="tracking-[0.3em] text-[#c9a961]">
            EVENT BANNER EDITOR
          </h2>
          <button onClick={onClose} className="text-sm hover:text-white">
            ✕ 닫기
          </button>
        </div>

        {/* 새 배너 추가 */}
        <div className="border border-[#c9a961]/40 p-4 mb-6">
          <h3 className="text-xs tracking-widest text-[#c9a961] mb-3">
            새 배너 추가
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="md:col-span-1">
              <label className="text-xs text-[#c9a961]/70">아이콘</label>
              <input
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2 text-center text-xl"
                placeholder="🎁"
                maxLength={2}
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="text-xs text-[#c9a961]/70">배너 텍스트</label>
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2"
                placeholder="예: 신규 회원 가입 시 15% 할인"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-2 bg-[#c9a961]/20 border border-[#c9a961]/40 text-sm text-[#c9a961] hover:bg-[#c9a961]/30"
          >
            + 추가하기
          </button>
        </div>

        {/* 현재 배너 목록 */}
        <div className="mb-6">
          <h3 className="text-xs tracking-widest text-[#c9a961] mb-3">
            현재 배너 목록 ({banners.length}개)
          </h3>
          
          <div className="space-y-2">
            {banners.map((banner, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-black/40 border border-[#c9a961]/20 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{banner.icon}</span>
                  <span className="text-sm">{banner.text}</span>
                </div>
                
                <button
                  onClick={() => handleRemove(idx)}
                  className="px-3 py-1 text-xs text-red-400 border border-red-400/40 hover:bg-red-400/10"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#c9a961]/40 text-sm"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#c9a961] text-[#2a2620] text-sm tracking-widest"
          >
            저장 및 적용
          </button>
        </div>
      </div>
    </div>
  );
}