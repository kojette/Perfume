import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function EventBanner() {
  const [banners, setBanners] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);

  const isAdmin = window.location.pathname.startsWith("/admin");

  // DB에서 활성화된 배너 데이터 가져오기
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
      } else {
        // 기본 배너
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
      <div className="w-full bg-[#c9a961] text-[#2a2620] relative min-h-[44px] flex items-center"> 
        {/* min-h를 줘서 로딩 중에도 높이를 잡게 합니다 */}
        {!loading && banners[currentIdx] && (
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-3 w-full">
            <span className="text-lg">{banners[currentIdx].icon}</span>
            <span className="text-sm tracking-[0.2em] font-medium">
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
        />
      )}
    </>
  );
}

function BannerEditor({ onClose, currentBanners }) {
  const [banners, setBanners] = useState(currentBanners);
  const [newText, setNewText] = useState("");
  const [newIcon, setNewIcon] = useState("🎁");
  const [recordTitle, setRecordTitle] = useState("");
  
  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 변경 기록 불러오기
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("banner_history")
        .select(`
          *,
          banner_items(text, icon)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setHistoryList(data);
      }
    };

    fetchHistory();
  }, []);

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

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newBanners = [...banners];
    [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    setBanners(newBanners);
  };

  const handleMoveDown = (index) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    setBanners(newBanners);
  };

  const handleSave = async () => {
    if (!recordTitle.trim()) {
      alert("저장 제목을 입력하세요");
      return;
    }

    try {
      // 1. 모든 기존 배너를 비활성화
      await supabase
        .from("banner_history")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // 2. 새 배너 레코드 생성
      const { data: newBanner, error: bannerError } = await supabase
        .from("banner_history")
        .insert({
          record_title: recordTitle,
          is_active: true
        })
        .select()
        .single();

      if (bannerError) throw bannerError;

      // 3. 배너 아이템들 저장
      if (banners.length > 0) {
        const itemInserts = banners.map(item => ({
          banner_id: newBanner.id,
          text: item.text,
          icon: item.icon
        }));

        const { error: itemError } = await supabase
          .from("banner_items")
          .insert(itemInserts);

        if (itemError) throw itemError;
      }

      alert("배너가 저장되었습니다!");
      window.location.reload();
    } catch (error) {
      console.error("배너 저장 실패:", error);
      alert("저장에 실패했습니다: " + error.message);
    }
  };

  // 기록 선택하여 적용
  const handleApplyHistory = async (historyId) => {
    try {
      // 1. 모든 배너 비활성화
      await supabase
        .from("banner_history")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // 2. 선택한 배너 활성화
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
          <h2 className="tracking-[0.3em] text-[#c9a961]">
            EVENT BANNER EDITOR
          </h2>
          <button onClick={onClose} className="text-sm hover:text-white">
            ✕ 닫기
          </button>
        </div>

        {/* 탭 전환 */}
        <div className="flex gap-4 mb-6 border-b border-[#c9a961]/20">
          <button
            onClick={() => setShowHistory(false)}
            className={`pb-2 px-4 text-sm tracking-widest transition-colors ${
              !showHistory 
                ? "text-[#c9a961] border-b-2 border-[#c9a961]" 
                : "text-[#e8dcc8]/60 hover:text-[#e8dcc8]"
            }`}
          >
            새로 만들기
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`pb-2 px-4 text-sm tracking-widest transition-colors ${
              showHistory 
                ? "text-[#c9a961] border-b-2 border-[#c9a961]" 
                : "text-[#e8dcc8]/60 hover:text-[#e8dcc8]"
            }`}
          >
            변경 기록 ({historyList.length})
          </button>
        </div>

        {/* 새로 만들기 탭 */}
        {!showHistory && (
          <>
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
                    
                    <div className="flex items-center gap-2">
                      {/* 순서 변경 버튼 */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className={`px-2 py-0.5 text-xs border transition-colors ${
                            idx === 0
                              ? 'text-[#c9a961]/30 border-[#c9a961]/20 cursor-not-allowed'
                              : 'text-[#c9a961] border-[#c9a961]/40 hover:bg-[#c9a961]/10'
                          }`}
                          title="위로 이동"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === banners.length - 1}
                          className={`px-2 py-0.5 text-xs border transition-colors ${
                            idx === banners.length - 1
                              ? 'text-[#c9a961]/30 border-[#c9a961]/20 cursor-not-allowed'
                              : 'text-[#c9a961] border-[#c9a961]/40 hover:bg-[#c9a961]/10'
                          }`}
                          title="아래로 이동"
                        >
                          ▼
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemove(idx)}
                        className="px-3 py-1 text-xs text-red-400 border border-red-400/40 hover:bg-red-400/10"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 저장 제목 */}
            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#c9a961]">
                저장 제목 (관리용)
              </label>
              <input
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
                placeholder="예: 2026년 봄 시즌 이벤트 배너"
                className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2"
              />
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
          </>
        )}

        {/* 변경 기록 탭 */}
        {showHistory && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {historyList.length === 0 ? (
              <p className="text-center text-[#e8dcc8]/60 py-8">
                저장된 기록이 없습니다
              </p>
            ) : (
              historyList.map((history) => (
                <div
                  key={history.id}
                  className={`border p-4 ${
                    history.is_active 
                      ? "border-[#c9a961] bg-[#c9a961]/10" 
                      : "border-[#c9a961]/20 bg-black/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#c9a961]">
                        {history.record_title}
                        {history.is_active && (
                          <span className="ml-2 text-xs text-[#c9a961] border border-[#c9a961] px-2 py-0.5">
                            현재 적용중
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[#e8dcc8]/60 mt-1">
                        {new Date(history.created_at).toLocaleString('ko-KR')}
                      </p>
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

                  {/* 배너 아이템 미리보기 */}
                  {history.banner_items?.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {history.banner_items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-black/20 px-3 py-2 text-xs"
                        >
                          <span>{item.icon}</span>
                          <span>{item.text}</span>
                        </div>
                      ))}
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