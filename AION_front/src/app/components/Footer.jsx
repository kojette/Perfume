import { Link } from 'react-router-dom';

export function Footer() {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

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
          <div>
            <h3 className="font-display text-2xl tracking-[0.4em] mb-4 text-[#c9a961]">
              AION
            </h3>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              영원한 그들의 향을 담은<br />
              하이엔드 프래그런스<br />
              <span className="text-[#c9a961] not-italic tracking-[0.2em] block mt-3">
                Since 1847
              </span>
            </p>
          </div>

          {/* Shopping */}
          <div>
            <h4 className="tracking-[0.2em] mb-6 text-sm border-b border-[#c9a961]/20 pb-3">
              신성한 쇼핑
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-[#c9a961] italic">전체 컬렉션</Link></li>
              <li><Link to="/signature" className="hover:text-[#c9a961] italic">신들의 시그니처</Link></li>
              <li><Link to="/limited" className="hover:text-[#c9a961] italic">한정판 에디션</Link></li>
              <li><Link to="/gift" className="hover:text-[#c9a961] italic">신성한 선물 세트</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="tracking-[0.2em] mb-6 text-sm border-b border-[#c9a961]/20 pb-3">
              고객 지원
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/faq" className="hover:text-[#c9a961] italic">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link to="/customer/inquiry" className="hover:text-[#c9a961] italic">
                  1:1 문의하기
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-[#c9a961] italic">
                  배송 안내
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-[#c9a961] italic">
                  반품 및 교환
                </Link>
              </li>

              {/* 관리자 전용 */}
              {isAdmin && (
                <li className="pt-2 mt-2 border-t border-[#c9a961]/10">
                  <Link
                    to="/admin/support"
                    className="text-red-600 hover:text-red-700 italic"
                  >
                    관리자 고객센터
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="tracking-[0.2em] mb-6 text-sm border-b border-[#c9a961]/20 pb-3">
              신전 위치
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="italic">서울 올림포스점</li>
              <li className="italic">부산 아테네점</li>
              <li className="italic">제주 델포이점</li>
              <li>
                <Link to='/store' className="hover:text-[#c9a961] italic transition-colors">
                  전체 매장 보기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#c9a961]/30 to-transparent my-10"></div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <p className="italic">
            © 2025 OLYMPUS PARFUMS. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-[#c9a961] italic">
              개인정보처리방침
            </Link>
            <Link to="/terms" className="hover:text-[#c9a961] italic">
              이용약관
            </Link>
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
