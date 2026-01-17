import { useState } from "react";

export function HeroAdminOverlay({ onClose, currentData, onSave }) {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState(currentData?.title || "AION");
  const [subtitle, setSubtitle] = useState(currentData?.subtitle || "영원한 그들의 향을 담다");
  const [tagline, setTagline] = useState(currentData?.tagline || "ESSENCE OF DIVINE");
  const [recordTitle, setRecordTitle] = useState("");

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, {
          preview: reader.result, // base64 문자열로 저장
          name: file.name
        }]);
      };
      reader.readAsDataURL(file); // base64로 변환
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
      images: images.map(img => img.preview), // base64 문자열 배열로 저장
      savedAt: new Date().toISOString()
    };

    onSave(saveData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-4xl bg-[#1f1c17] text-[#e8dcc8] p-8 relative border border-[#c9a961]/30">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="tracking-[0.3em] text-[#c9a961]">
            HERO BANNER EDITOR
          </h2>
          <button onClick={onClose} className="text-sm hover:text-white">
            ✕ 닫기
          </button>
        </div>

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
              <img
                key={idx}
                src={img.preview}
                alt="preview"
                className="h-32 w-full object-cover border border-[#c9a961]/20"
              />
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
            전체 저장
          </button>
        </div>
      </div>
    </div>
  );
}
