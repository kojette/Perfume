import React, { useEffect } from 'react';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* 상단 타이틀 영역 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif text-[#1a1a1a] tracking-[0.2em] mb-4">TERMS OF SERVICE</h2>
          <p className="text-[#c9a961] text-sm tracking-[0.4em] uppercase">이용약관</p>
          
          <div className="flex items-center justify-center mt-8">
            <div className="h-[1px] w-16 bg-[#c9a961]/40"></div>
            <div className="mx-4 text-[#c9a961]/40 text-lg">✦</div>
            <div className="h-[1px] w-16 bg-[#c9a961]/40"></div>
          </div>
        </div>

        <div className="bg-white border border-[#c9a961]/20 p-8 md:p-12 shadow-sm text-[#2a2620] leading-loose text-sm font-light space-y-12">
          
          {/* 시행일 안내 */}
          <div className="text-center italic text-[#8b8278] border-b border-[#c9a961]/20 pb-6">
            본 약관은 2026년 1월 1일부터 시행됩니다.
          </div>

          {/* 제 1 장 총칙 */}
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">제 1 장 총칙</h3>
            
            <div className="space-y-6">
              <article>
                <h4 className="font-medium text-[#c9a961] mb-2">제 1 조 (목적)</h4>
                <p className="text-justify text-[#555]">
                  본 약관은 OLYMPUS PARFUMS(이하 ‘회사’)가 운영하는 AION 온라인 스토어(이하 ‘스토어’)에서 제공하는 서비스와 관련하여, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
              </article>

              <article>
                <h4 className="font-medium text-[#c9a961] mb-2">제 2 조 (정의)</h4>
                <ol className="list-decimal list-inside space-y-2 text-[#555]">
                  <li><span className="font-medium">스토어</span>: 회사가 향수 등 상품을 이용자에게 제공하기 위하여 정보통신설비를 이용하여 상품을 거래할 수 있도록 설정한 영업장을 말합니다.</li>
                  <li><span className="font-medium">이용자</span>: 스토어에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                  <li><span className="font-medium">적립금</span>: 회원의 구매 활동, 이벤트 참여 등에 따라 회사가 회원에게 부여하는 것으로, 상품 구매 시 사용할 수 있는 할인 수단을 말합니다.</li>
                  <li><span className="font-medium">쿠폰</span>: 상품 구매 시 표시된 금액 또는 비율만큼 할인을 받을 수 있는 전자적 증표를 말합니다.</li>
                </ol>
              </article>
            </div>
          </section>

          {/* 제 2 장 지적 재산 및 이용 제한 */}
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">제 2 장 지적 재산 및 이용 제한</h3>
            
            <div className="space-y-6">
              <article>
                <h4 className="font-medium text-[#c9a961] mb-2">제 3 조 (지적 재산권의 귀속)</h4>
                <p className="text-justify text-[#555]">
                  스토어 내 모든 컨텐츠(텍스트, 이미지, 로고, 향수 설명, 그래픽 등)의 저작권 및 상표권은 회사 또는 라이선서에게 귀속됩니다. 이용자는 회사의 사전 승낙 없이 컨텐츠를 복제, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
                </p>
              </article>

              <article>
                <h4 className="font-medium text-[#c9a961] mb-2">제 4 조 (개인 용도의 제한)</h4>
                <p className="text-justify text-[#555]">
                  스토어에서 제공되는 모든 제품과 샘플은 개인 용도에 국한됩니다. 이용자는 회사로부터 수령한 제품을 상업적으로 재판매할 수 없으며, 재판매 목적의 구매로 판단될 경우 회사는 주문을 취소할 수 있습니다.
                </p>
              </article>
            </div>
          </section>

          {/* 제 3 장 쇼핑 및 결제 서비스*/}
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">제 3 장 쇼핑 및 결제 서비스</h3>
            
            <div className="space-y-6">
              <article>
                <h4 className="font-medium text-[#c9a961] mb-2">제 5 조 (결제 방법 및 포인트 사용)</h4>
                <ul className="list-disc list-inside space-y-2 text-[#555] ml-2">
                  <li>이용자는 신용카드, 계좌이체, 적립금 등을 결제 수단으로 사용할 수 있습니다.</li>
                  <li><span className="font-medium text-[#2a2620]">적립금 정책:</span> 상품 구매 시 실 결제 금액의 1%가 적립되며, 1적립금은 현금 1원과 동일한 가치를 가집니다.</li>
                  <li><span className="font-medium text-[#2a2620]">쿠폰 정책:</span> 쿠폰은 정해진 유효기간 내에만 사용 가능하며, 1회 주문 시 1개의 쿠폰만 적용 가능함을 원칙으로 합니다.</li>
                </ul>
              </article>
            </div>
          </section>

          {/* 제 4 장 취소 및 환불 */}
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">제 4 장 배송, 취소 및 환불</h3>
            
            <div className="space-y-6">
              <article>
                <h4 className="font-medium text-[#c9a961] mb-2">제 6 조 (청약철회 및 반품)</h4>
                <p className="text-justify text-[#555]">
                  이용자는 상품을 배송받은 날로부터 7일 이내에 청약 철회를 할 수 있습니다. 단, 하이엔드 향수의 특성상 개봉 방지 씰이 훼손되거나 포장을 개봉하여 상품 가치가 상실된 경우 단순 변심에 의한 반품 및 교환이 불가합니다.
                </p>
              </article>
            </div>
          </section>

          {/* 하단 브랜드 서명 영역 */}
          <div className="pt-8 border-t border-[#c9a961]/20 text-center mt-12">
            <h4 className="font-serif text-xl tracking-[0.2em] text-[#1a1a1a] mb-2">OLYMPUS PARFUMS</h4>
            <p className="text-[#8b8278] text-xs tracking-widest uppercase">Since 1847, 영원한 그들의 향을 담다.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Terms;