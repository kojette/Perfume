import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { CornerOrnament } from './Ornament';

import img11 from "../../assets/11.png";
import img12 from "../../assets/12.jpg";
import img13 from "../../assets/13.jpg";

export function Hero() {
  const images = [img11, img12, img13];
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prevIdx) => (prevIdx + 1) % images.length);
    }, 5000); 

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Images with Cross-fade */}
      <div className="absolute inset-0 z-0 bg-[#2a2620]">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[3000ms] ease-in-out ${
              index === currentIdx ? 'opacity-100' : 'opacity-0'
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

      {/* Decorative Corners */}
      <CornerOrnament position="top-left" className="opacity-60" />
      <CornerOrnament position="top-right" className="opacity-60" />
      <CornerOrnament position="bottom-left" className="opacity-60" />
      <CornerOrnament position="bottom-right" className="opacity-60" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#c9a961]"></div>
          <div className="mx-4 text-[#c9a961] text-xl">✦</div>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#c9a961]"></div>
        </div>

        <div className="text-[#c9a961] text-sm tracking-[0.4em] mb-4 italic">
          ESSENCE OF DIVINE
        </div>
        
        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl tracking-[0.3em] mb-6 text-white drop-shadow-lg">
          AION
        </h1>
        
        <p className="text-lg md:text-xl tracking-[0.3em] mb-4 text-[#e8dcc8] italic">
          영원한 그들의 향을 담다
        </p>

        <div className="flex items-center justify-center my-8">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#c9a961]"></div>
          <div className="mx-3 text-[#c9a961] text-sm">❖</div>
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#c9a961]"></div>
        </div>

        <button className="px-10 py-4 border-2 border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all duration-500 tracking-[0.3em] text-sm relative overflow-hidden group">
          <span className="relative z-10">신성한 컬렉션 둘러보기</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#c9a961] animate-bounce">
        <div className="text-xs tracking-[0.3em]">SCROLL</div>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[#c9a961] to-transparent"></div>
      </div>
    </section>
  );
}