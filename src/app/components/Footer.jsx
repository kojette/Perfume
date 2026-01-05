export function Footer() {
  return (
    <footer className="bg-[#faf8f3] border-t-2 border-[#c9a961]/20 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Top decorative line */}
        <div className="flex items-center justify-center mb-12">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"></div>
          <div className="mx-4 text-[#c9a961] text-lg">✦</div>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl tracking-[0.4em] mb-4 text-[#c9a961]">
              OLYMPUS
            </h3>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              신들의 향기를 담은<br />
              하이엔드 프래그런스<br />
              <span className="text-[#c9a961] not-italic tracking-[0.2em] block mt-3">Since 1847</span>
            </p>
          </div>

          {/* Shopping */}
          <div>
            <h4 className="tracking-[0.2em] mb-6 text-sm border-b border-[#c9a961]/20 pb-3">신성한 쇼핑</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">전체 컬렉션</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">신들의 시그니처</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">한정판 에디션</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">신성한 선물 세트</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="tracking-[0.2em] mb-6 text-sm border-b border-[#c9a961]/20 pb-3">고객 지원</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">자주 묻는 질문</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">배송 안내</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">반품 및 교환</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">향수 상담</a></li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="tracking-[0.2em] mb-6 text-sm border-b border-[#c9a961]/20 pb-3">신전 위치</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">서울 올림포스점</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">부산 아테네점</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">제주 델포이점</a></li>
              <li><a href="#" className="hover:text-[#c9a961] transition-colors italic">전체 매장 보기</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#c9a961]/30 to-transparent my-10"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="text-[#c9a961] text-xs">✦</div>
            <p className="italic">© 2025 OLYMPUS PARFUMS. All rights reserved.</p>
            <div className="text-[#c9a961] text-xs">✦</div>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">개인정보처리방침</a>
            <a href="#" className="hover:text-[#c9a961] transition-colors italic">이용약관</a>
          </div>
        </div>

        {/* Final ornament */}
        <div className="flex items-center justify-center mt-10">
          <div className="text-[#c9a961]/40 text-2xl">❖</div>
        </div>
      </div>
    </footer>
  );
}
