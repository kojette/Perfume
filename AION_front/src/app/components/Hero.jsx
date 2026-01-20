import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CornerOrnament } from "./Ornament";
import { HeroAdminOverlay } from "./HeroAdminOverlay";

import img11 from "../../assets/11.png";
import img12 from "../../assets/12.jpg";
import img13 from "../../assets/13.jpg";

export function Hero() {
 // ✅ localStorage에서 저장된 데이터 불러오기
const savedData = localStorage.getItem("heroData");
const heroData = savedData ? JSON.parse(savedData) : null;

// 저장된 이미지가 있으면 사용, 없으면 기본 이미지
const images = heroData?.images || [img11, img12, img13];
const displayTitle = heroData?.title || "AION";
const displaySubtitle = heroData?.subtitle || "영원한 그들의 향을 담다";
const displayTagline = heroData?.tagline || "ESSENCE OF DIVINE";

  const [currentIdx, setCurrentIdx] = useState(0);

  // ✅ 관리자 여부 (URL 경로 기반)
const isAdmin = window.location.pathname.startsWith("/admin");
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prevIdx) => (prevIdx + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* ================= 배경 이미지 ================= */}
      <div className="absolute inset-0 z-0 bg-[#2a2620]">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[3000ms] ease-in-out ${
              index === currentIdx ? "opacity-100" : "opacity-0"
            }`}
          >
            <ImageWithFallback
              src={img}
              alt={`Background ${index}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2620]/60 via-[#2a2620]/40 to-[#2a2620]/60" />
      </div>

      {/* ================= 장식 ================= */}
      <CornerOrnament position="top-left" className="opacity-60" />
      <CornerOrnament position="top-right" className="opacity-60" />
      <CornerOrnament position="bottom-left" className="opacity-60" />
      <CornerOrnament position="bottom-right" className="opacity-60" />

      {/* ================= 콘텐츠 ================= */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#c9a961]" />
          <div className="mx-4 text-[#c9a961] text-xl">✦</div>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#c9a961]" />
        </div>

        <div className="text-[#c9a961] text-sm tracking-[0.4em] mb-4 italic">
          {displayTagline}
        </div>

        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl tracking-[0.3em] mb-6 text-white drop-shadow-lg">
          {displayTitle}
        </h1>

        <p className="text-lg md:text-xl tracking-[0.3em] mb-4 text-[#e8dcc8] italic">
          영원한 그들의 향을 담다
        </p>

        <div className="flex items-center justify-center my-8">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#c9a961]" />
          <div className="mx-3 text-[#c9a961] text-sm">❖</div>
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#c9a961]" />
        </div>

        <button className="px-10 py-4 border-2 border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all duration-500 tracking-[0.3em] text-sm relative overflow-hidden group">
          <span className="relative z-10">신성한 컬렉션 둘러보기</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
      </div>

      {/* ================= 스크롤 표시 ================= */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#c9a961] animate-bounce">
        <div className="text-xs tracking-[0.3em]">SCROLL</div>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#c9a961] to-transparent" />
      </div>

      {/* ================= 관리자 버튼 ================= */}
      {isAdmin && (
        <button
          onClick={() => setEditorOpen(true)}
          className="absolute top-32 right-8 z-20 px-4 py-2 bg-black/60 text-[#c9a961] border border-[#c9a961]/40 text-sm tracking-widest hover:bg-black"
        >
          전체 편집
        </button>
      )}

      {/* ================= 관리자 오버레이 ================= */}
      {isAdmin && editorOpen && (
        <HeroAdminOverlay 
          onClose={() => setEditorOpen(false)} 
          currentData={{
            title: displayTitle,
            subtitle: displaySubtitle,
            tagline: displayTagline
          }}
          onSave={(data) => {
            localStorage.setItem("heroData", JSON.stringify(data));
            window.location.reload(); // 저장 후 페이지 새로고침으로 즉시 반영
          }}
        />
      )}
    </section>
  );
}
