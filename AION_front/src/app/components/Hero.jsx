import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CornerOrnament } from "./Ornament";
import { HeroAdminOverlay } from "./HeroAdminOverlay";
import { supabase } from "../supabaseClient";

import img11 from "../../assets/11.png";
import img12 from "../../assets/12.jpg";
import img13 from "../../assets/13.jpg";

// App.js에서 계산된 navHeight를 전달받습니다.
export function Hero({ navHeight = 0 }) {
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);

  const isAdmin = window.location.pathname.startsWith("/admin");

  /**
   * [핵심] 겹침 강도 설정
   * 사용자의 요청대로 배너 전체 높이의 20%를 계산합니다.
   * 이 값만큼 Hero 섹션을 위로(-marginTop) 끌어올립니다.
   */
  const overlapHeight = navHeight * 0.02;

  useEffect(() => {
    const fetchActiveHero = async () => {
      const { data, error } = await supabase
        .from("hero_history")
        .select(`
          *,
          hero_images(image_url)
        `)
        .eq("is_active", true)
        .single();

      if (data) {
        setHeroData({
          title: data.title,
          subtitle: data.subtitle,
          tagline: data.tagline,
          images: data.hero_images?.map(img => img.image_url) || []
        });
      }
      setLoading(false);
    };

    fetchActiveHero();
  }, []);

  const images = heroData?.images?.length > 0 ? heroData.images : [img11, img12, img13];
  const displayTitle = heroData?.title || "AION";
  const displaySubtitle = heroData?.subtitle || "영원한 그들의 향을 담다";
  const displayTagline = heroData?.tagline || "ESSENCE OF DIVINE";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prevIdx) => (prevIdx + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  const handleSave = async (saveData) => {
    try {
      await supabase
        .from("hero_history")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      const { data: newHero, error: heroError } = await supabase
        .from("hero_history")
        .insert({
          record_title: saveData.recordTitle,
          title: saveData.title,
          subtitle: saveData.subtitle,
          tagline: saveData.tagline,
          is_active: true
        })
        .select()
        .single();

      if (heroError) throw heroError;

      if (saveData.images?.length > 0) {
        const imageInserts = saveData.images.map(imgUrl => ({
          hero_id: newHero.id,
          image_url: imgUrl
        }));

        const { error: imgError } = await supabase
          .from("hero_images")
          .insert(imageInserts);

        if (imgError) throw imgError;
      }

      alert("Hero 배너가 저장되었습니다!");
      window.location.reload();
    } catch (error) {
      console.error("Hero 저장 실패:", error);
      alert("저장에 실패했습니다: " + error.message);
    }
  };

  return (
    <section 
      className="relative flex items-center justify-center overflow-hidden"
      style={{ 
        // 1. 배너의 2%만큼 위로 강제 이동
        marginTop: `-${overlapHeight}px`, 
        // 2. 위로 올라간 만큼 하단이 비지 않도록 높이 보정
        height: `calc(100vh + ${overlapHeight}px)`,
        // 3. 배너보다 뒤에 위치하도록 설정 (배너는 z-50임)
        zIndex: 1
      }}
    >
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
        {/* 상단 겹치는 부분의 자연스러움을 위해 그라데이션 강화 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2620]/90 via-[#2a2620]/40 to-[#2a2620]/70" />
      </div>

      {/* ================= 장식 ================= */}
      <CornerOrnament position="top-left" className="opacity-60" />
      <CornerOrnament position="top-right" className="opacity-60" />
      <CornerOrnament position="bottom-left" className="opacity-60" />
      <CornerOrnament position="bottom-right" className="opacity-60" />

      {/* ================= 콘텐츠 ================= */}
      <div 
        className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        // 배너 뒤로 겹쳐지는 만큼 텍스트가 가려지지 않게 안쪽 여백 추가
        style={{ paddingTop: `${overlapHeight}px` }} 
      >
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
          {displaySubtitle}
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

      {isAdmin && (
        <button
          onClick={() => setEditorOpen(true)}
           style={{ transform: `translateY(calc(${overlapHeight}px - 4px))` }}
          className="absolute top-8 right-8 z-20 px-4 py-2 bg-black/60 text-[#c9a961] border border-[#c9a961]/40 text-sm tracking-widest hover:bg-black"
        >
          Hero 편집
        </button>
      )}

      {isAdmin && editorOpen && (
        <HeroAdminOverlay 
          onClose={() => setEditorOpen(false)} 
          currentData={{
            title: displayTitle,
            subtitle: displaySubtitle,
            tagline: displayTagline
          }}
          onSave={handleSave}
        />
      )}
    </section>
  );
}