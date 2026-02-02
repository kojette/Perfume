import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function HeroAdminOverlay({ onClose, currentData, onSave }) {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState(currentData?.title || "AION");
  const [subtitle, setSubtitle] = useState(currentData?.subtitle || "영원한 그들의 향을 담다");
  const [tagline, setTagline] = useState(currentData?.tagline || "ESSENCE OF DIVINE");
  const [recordTitle, setRecordTitle] = useState("");
  
  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 변경 기록 불러오기
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("hero_history")
        .select(`
          *,
          hero_images(image_url)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setHistoryList(data);
      }
    };

    fetchHistory();
  }, []);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, {
          preview: reader.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!recordTitle.trim()) {
      alert("저장 제목을 입력하세요");
      return;
    }

    const saveData = {
      recordTitle,
      title,
      subtitle,
      tagline,
      images: images.map(img => img.preview),
      savedAt: new Date().toISOString()
    };

    onSave(saveData);
  };

  // 기록 선택하여 적용
  const handleApplyHistory = async (historyId) => {
    try {
      // 1. 모든 Hero 비활성화
      await supabase
        .from("hero_history")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // 2. 선택한 Hero 활성화
      const { error } = await supabase
        .from("hero_history")
        .update({ is_active: true })
        .eq("id", historyId);

      if (error) throw error;

      alert("테마가 적용되었습니다!");
      window.location.reload();
    } catch (error) {
      console.error("테마 적용 실패:", error);
      alert("적용에 실패했습니다: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center overflow-y-auto py-8">
      <div className="w-full max-w-4xl bg-[#1f1c17] text-[#e8dcc8] p-8 relative border border-[#c9a961]/30 my-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="tracking-[0.3em] text-[#c9a961]">
            HERO BANNER EDITOR
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
            {/* 이미지 업로드 */}
            <div
              className="border-2 border-dashed border-[#c9a961]/40 rounded-lg p-6 text-center mb-6 cursor-pointer hover:bg-white/5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => document.getElementById("hero-upload").click()}
            >
              <p className="tracking-widest text-sm text-[#c9a961] mb-2">
                이미지를 드래그하거나 클릭하세요
              </p>
              <p className="text-xs opacity-70">
                JPG / PNG · 여러 장 가능
              </p>

              <input
                id="hero-upload"
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* 미리보기 */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.preview}
                      alt="preview"
                      className="h-32 w-full object-cover border border-[#c9a961]/20"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/80 text-red-400 px-2 py-1 text-xs"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 텍스트 수정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs tracking-widest text-[#c9a961]">
                  태그라인
                </label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2"
                  placeholder="ESSENCE OF DIVINE"
                />
              </div>
              
              <div>
                <label className="text-xs tracking-widest text-[#c9a961]">
                  메인 타이틀
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#c9a961]">
                서브 문구
              </label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2"
              />
            </div>

            {/* 저장 제목 */}
            <div className="mb-6">
              <label className="text-xs tracking-widest text-[#c9a961]">
                저장 제목 (관리용)
              </label>
              <input
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
                placeholder="예: 2026 봄 시즌 메인 배너"
                className="w-full mt-1 bg-black/40 border border-[#c9a961]/30 px-3 py-2"
              />
            </div>

            {/* 버튼 */}
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

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[#c9a961]/70">타이틀:</span>
                      <p className="mt-1">{history.title}</p>
                    </div>
                    <div>
                      <span className="text-[#c9a961]/70">서브:</span>
                      <p className="mt-1">{history.subtitle}</p>
                    </div>
                    <div>
                      <span className="text-[#c9a961]/70">태그라인:</span>
                      <p className="mt-1">{history.tagline}</p>
                    </div>
                  </div>

                  {/* 이미지 미리보기 */}
                  {history.hero_images?.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {history.hero_images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.image_url}
                          alt={`preview ${idx}`}
                          className="h-16 w-full object-cover border border-[#c9a961]/20"
                        />
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