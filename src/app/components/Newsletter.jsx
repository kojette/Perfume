import { Ornament } from './Ornament';

export function Newsletter() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-[#2a2620] via-[#3a3530] to-[#2a2620] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-[#c9a961] text-6xl">✦</div>
        <div className="absolute top-32 right-20 text-[#c9a961] text-4xl">❖</div>
        <div className="absolute bottom-20 left-32 text-[#c9a961] text-5xl">✦</div>
        <div className="absolute bottom-40 right-40 text-[#c9a961] text-3xl">❖</div>
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="text-[#c9a961] text-xs tracking-[0.4em] mb-4 italic">NEWSLETTER</div>
        <Ornament />
        
        <h2 className="font-display text-4xl md:text-5xl tracking-[0.2em] my-8 text-[#c9a961]">
          신성한 소식을<br className="md:hidden"/> 전해드립니다
        </h2>
        
        <p className="text-sm text-[#e8dcc8] mb-10 italic leading-relaxed max-w-xl mx-auto">
          올림포스의 새로운 향기와 독점 혜택을<br/>
          가장 먼저 경험하실 수 있습니다
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center mb-10">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#c9a961]"></div>
          <div className="mx-4 text-[#c9a961] text-sm">✦</div>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#c9a961]"></div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <input
            type="email"
            placeholder="이메일 주소를 입력해주세요"
            className="flex-1 px-6 py-4 bg-transparent border-2 border-[#c9a961]/40 focus:border-[#c9a961] outline-none transition-colors text-center sm:text-left placeholder:text-[#8b8278] placeholder:italic"
          />
          <button className="px-10 py-4 bg-[#c9a961] text-[#2a2620] hover:bg-[#d4af37] transition-all duration-300 tracking-[0.3em] text-sm relative overflow-hidden group">
            <span className="relative z-10">구독하기</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>

        <p className="text-xs text-[#8b8278] mt-6 italic">
          신성한 개인정보는 안전하게 보호됩니다
        </p>
      </div>
    </section>
  );
}
