import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function EventBanner() {
  const [banners, setBanners] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [bannerColors, setBannerColors] = useState({ bg: '#c9a961', text: '#2a2620' });

  const isAdmin = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    const fetchActiveBanner = async () => {
      const { data, error } = await supabase
        .from("banner_history")
        .select(`
          *,
          banner_items(text, icon)
        `)
        .eq("is_active", true)
        .single();

      if (data && data.banner_items?.length > 0) {
        setBanners(data.banner_items);
        setBannerColors({
          bg: data.bg_color || '#c9a961',
          text: data.text_color || '#2a2620',
        });
      } else {
        setBanners([{ text: "회원가입 시 10% 할인 쿠폰 지급", icon: "🎁" }]);
      }
      setLoading(false);
    };

    fetchActiveBanner();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) return null;

  return (
    <>
      <div
        className="w-full relative h-[44px] flex items-center overflow-hidden"
        style={{ backgroundColor: bannerColors.bg, color: bannerColors.text }}
      >
        {!loading && banners[currentIdx] && (
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-3 w-full">
            <span className="text-lg">{banners[currentIdx].icon}</span>
            <span className="text-sm tracking-[0.2em] font-medium transition-opacity duration-500">
              {banners[currentIdx].text}
            </span>
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => setEditorOpen(true)}
            className="absolute right-8 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/60 text-[#c9a961] border border-[#c9a961]/40 text-xs tracking-widest hover:bg-black z-10"
          >
            배너 편집
          </button>
        )}
      </div>

      {isAdmin && editorOpen && (
        <BannerEditor
          onClose={() => setEditorOpen(false)}
          currentBanners={banners}
          currentColors={bannerColors}
        />
      )}
    </>
  );
}

function BannerEditor({ onClose, currentBanners, currentColors }) {
  const [banners, setBanners] = useState(currentBanners);
  const [newText, setNewText] = useState("");
  const [newIcon, setNewIcon] = useState("🎁");
  const [recordTitle, setRecordTitle] = useState("");
  const [bgColor, setBgColor] = useState(currentColors?.bg || '#c9a961');
  const [textColor, setTextColor] = useState(currentColors?.text || '#2a2620');

  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("banner_history")
        .select(`*, banner_items(text, icon)`)
        .order("created_at", { ascending: false });
      if (data) setHistoryList(data);
    };
    fetchHistory();
  }, []);

  const handleAdd = () => {
    if (!newText.trim()) { alert("배너 텍스트를 입력하세요"); return; }
    setBanners([...banners, { text: newText, icon: newIcon }]);
    setNewText("");
    setNewIcon("🎁");
  };

  const handleRemove = (index) => setBanners(banners.filter((_, i) => i !== index));

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const b = [...banners];
    [b[index - 1], b[index]] = [b[index], b[index - 1]];
    setBanners(b);
  };

  const handleMoveDown = (index) => {
    if (index === banners.length - 1) return;
    const b = [...banners];
    [b[index], b[index + 1]] = [b[index + 1], b[index]];
    setBanners(b);
  };

  const handleSave = async () => {
    if (!recordTitle.trim()) { alert("저장 제목을 입력하세요"); return; }
    try {
      await supabase
        .from("banner_history")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const { data: newBanner, error: bannerError } = await supabase
        .from("banner_history")
        .insert({
          record_title: recordTitle,
          is_active: true,
          bg_color: bgColor,
          text_color: textColor,
        })
        .select()
        .single();

      if (bannerError) throw bannerError;

      if (banners.length > 0) {
        const { error: itemError } = await supabase
          .from("banner_items")
          .insert(banners.map(item => ({ banner_id: newBanner.id, text: item.text, icon: item.icon })));
        if (itemError) throw itemError;
      }

      alert("배너가 저장되었습니다!");
      window.location.reload();
    } catch (error) {
      console.error("배너 저장 실패:", error);
      alert("저장에 실패했습니다: " + error.message);
    }
  };

  const handleApplyHistory = async (historyId) => {
    try {
      await supabase
        .from("banner_history")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const { error } = await supabase
        .from("banner_history")
        .update({ is_active: true })
        .eq("id", historyId);

      if (error) throw error;
      alert("배너가 적용되었습니다!");
      window.location.reload();
    } catch (error) {
      console.error("배너 적용 실패:", error);
      alert("적용에 실패했습니다: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-8">
      <div className="w-full max-w-3xl bg-[#1f1c17] text-[#e8dcc8] p-8 relative border border-[#c9a961]/30 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="tracking-[0.3em] text-[#c9a961]">EVENT BANNER EDITOR</h2>
          <button onClick={onClose} className="text-sm hover:text-white">✕ 닫기</button>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 mb-6 border-b border-[#c9a961]/20">
          {[['새로 만들기', false], [`변경 기록 (${historyList.length})`, true]].map(([label, val]) => (
            <button
              key={String(val)}
              onClick={() => setShowHistory(val)}
              className={`pb-2 px-4 text-sm tracking-widest transition-colors ${
                showHistory === val
                  ? "text-[#c9a961] border-b-2 border-[#c9a961]"
                  : "text-[#e8dcc8]/60 hover:text-[#e8dcc8]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 새로 만들기 탭 */}
        {!showHistory && (
          <>
            {/* 새 배너 추가 */}
            <div className="border border-[#c9a961]/40 p-4 mb-6">
              <h3 className="text-xs tracking-widest text-[#c9a961] mb-3">새 배너 추가</h3>
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
              <h3 className="text-xs tracking-widest text-[#c9a961] mb-3">현재 배너 목록 ({banners.length}개)</h3>
              <div className="space-y-2">
                {banners.map((banner, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/40 border border-[#c9a961]/20 p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{banner.icon}</span>
                      <span className="text-sm">{banner.text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className={`px-2 py-0.5 text-xs border transition-colors ${
                            idx === 0
                              ? 'text-[#c9a961]/30 border-[#c9a961]/20 cursor-not-allowed'
                              : 'text-[#c9a961] border-[#c9a961]/40 hover:bg-[#c9a961]/10'
                          }`}
                        >▲</button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === banners.length - 1}
                          className={`px-2 py-0.5 text-xs border transition-colors ${
                            idx === banners.length - 1
                              ? 'text-[#c9a961]/30 border-[#c9a961]/20 cursor-not-allowed'
                              : 'text-[#c9a961] border-[#c9a961]/40 hover:bg-[#c9a961]/10'
                          }`}
                        >▼</button>
                      </div>
                      <button
                        onClick={() => handleRemove(idx)}
                        className="px-3 py-1 text-xs text-red-400 border border-red-400/40 hover:bg-red-400/10"
                      >삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 색상 설정 */}
            <div className="mb-6 border border-[#c9a961]/40 p-4">
              <h3 className="text-xs tracking-widest text-[#c9a961] mb-3">배너 색상</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#c9a961]/70 block mb-1">배경 색상</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 cursor-pointer border border-[#c9a961]/30 bg-transparent rounded-none"
                    />
                    <input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2 text-sm font-mono"
                      placeholder="#c9a961"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#c9a961]/70 block mb-1">텍스트 색상</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 cursor-pointer border border-[#c9a961]/30 bg-transparent rounded-none"
                    />
                    <input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2 text-sm font-mono"
                      placeholder="#2a2620"
                    />
                  </div>
                </div>
              </div>
              {/* 실시간 미리보기 */}
              <div
                className="mt-3 px-4 py-2 flex items-center justify-center gap-3 text-sm tracking-[0.2em] transition-all duration-300"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                <span>🎁</span>
                <span>배너 미리보기 — {banners[0]?.text || '배너 텍스트'}</span>
              </div>
            </div>

            {/* 저장 제목 */}
            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#c9a961]">저장 제목 (관리용)</label>
              <input
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
                placeholder="예: 2026년 봄 시즌 이벤트 배너"
                className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={onClose} className="px-6 py-2 border border-[#c9a961]/40 text-sm">취소</button>
              <button onClick={handleSave} className="px-6 py-2 bg-[#c9a961] text-[#2a2620] text-sm tracking-widest">저장 및 적용</button>
            </div>
          </>
        )}

        {/* 변경 기록 탭 */}
        {showHistory && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {historyList.length === 0 ? (
              <p className="text-center text-[#e8dcc8]/60 py-8">저장된 기록이 없습니다</p>
            ) : (
              historyList.map((history) => (
                <div
                  key={history.id}
                  className={`border p-4 ${history.is_active ? "border-[#c9a961] bg-[#c9a961]/10" : "border-[#c9a961]/20 bg-black/20"}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#c9a961]">
                        {history.record_title}
                        {history.is_active && (
                          <span className="ml-2 text-xs text-[#c9a961] border border-[#c9a961] px-2 py-0.5">현재 적용중</span>
                        )}
                      </h3>
                      <p className="text-xs text-[#e8dcc8]/60 mt-1">
                        {new Date(history.created_at).toLocaleString('ko-KR')}
                      </p>
                      {/* 색상 미리보기 뱃지 */}
                      {(history.bg_color || history.text_color) && (
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-5 h-5 border border-white/20 rounded-sm"
                            style={{ backgroundColor: history.bg_color || '#c9a961' }}
                            title={`배경: ${history.bg_color || '#c9a961'}`}
                          />
                          <div
                            className="w-5 h-5 border border-white/20 rounded-sm"
                            style={{ backgroundColor: history.text_color || '#2a2620' }}
                            title={`텍스트: ${history.text_color || '#2a2620'}`}
                          />
                          <span className="text-xs text-[#e8dcc8]/40 font-mono">
                            {history.bg_color || '#c9a961'} / {history.text_color || '#2a2620'}
                          </span>
                        </div>
                      )}
                    </div>
                    {!history.is_active && (
                      <button
                        onClick={() => handleApplyHistory(history.id)}
                        className="px-4 py-1 bg-[#c9a961]/20 border border-[#c9a961]/40 text-xs text-[#c9a961] hover:bg-[#c9a961]/30"
                      >
                        적용하기
                      </button>
                    )}
                  </div>

                  {/* 배너 아이템 미리보기 — 실제 색상으로 */}
                  {history.banner_items?.length > 0 && (
                    <div
                      className="mt-2 px-3 py-2 flex items-center gap-2 text-xs tracking-[0.15em]"
                      style={{
                        backgroundColor: history.bg_color || '#c9a961',
                        color: history.text_color || '#2a2620',
                      }}
                    >
                      <span>{history.banner_items[0].icon}</span>
                      <span>{history.banner_items[0].text}</span>
                      {history.banner_items.length > 1 && (
                        <span className="opacity-60">외 {history.banner_items.length - 1}개</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}