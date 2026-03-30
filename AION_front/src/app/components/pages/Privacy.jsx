import React, { useEffect } from 'react';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-24 pb-20 px-6">
      
      <div className="max-w-4xl mx-auto">
        
        
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif text-[#1a1a1a] tracking-[0.2em] mb-4">PRIVACY POLICY</h2>
          <p className="text-[#c9a961] text-sm tracking-[0.4em] uppercase">개인정보처리방침</p>
          
          <div className="flex items-center justify-center mt-8">
            <div className="h-[1px] w-16 bg-[#c9a961]/40"></div>
            <div className="mx-4 text-[#c9a961]/40 text-lg">✦</div>
            <div className="h-[1px] w-16 bg-[#c9a961]/40"></div>
          </div>
        </div>

        
        <div className="bg-white border border-[#c9a961]/20 p-8 md:p-12 shadow-sm text-[#2a2620] leading-loose text-sm font-light space-y-12">
          
          <div className="text-center italic text-[#8b8278] border-b border-[#c9a961]/20 pb-6">
            시행일: 2026년 3월 4일
          </div>

          <section>
            <p className="text-justify text-[#555] mb-8">
              OLYMPUS PARFUMS(이하 "회사")는 고객님의 프라이버시를 존중하고 당사와 고객님의 관계를 소중하게 생각합니다. 회사는 「개인정보 보호법」 등 관련 법령을 준수하며, 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>
          </section>

          
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">1. 수집하는 개인정보 항목 및 수집 방법</h3>
            <div className="space-y-6">
              <article>
                <h4 className="font-medium text-[#c9a961] mb-2">가. 수집하는 개인정보 항목</h4>
                <ul className="list-disc list-inside space-y-2 text-[#555] ml-2">
                  <li><span className="font-medium">회원 가입 시:</span> (필수) 이메일(ID), 비밀번호, 이름, 닉네임, 연락처, 성별</li>
                  <li><span className="font-medium">상품 구매 및 결제 시:</span> 주문자 정보, 배송지 정보(주소, 연락처), 결제 수단 정보, 적립금/쿠폰 사용 내역</li>
                  <li><span className="font-medium">자동 수집 정보:</span> 서비스 이용기록, IP 주소, 쿠키, 방문 일시, 불량 이용기록</li>
                </ul>
              </article>
            </div>
          </section>

          
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">2. 개인정보의 수집 및 이용 목적</h3>
            <div className="space-y-2 text-[#555]">
              <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
              <ul className="list-decimal list-inside space-y-2 ml-2">
                <li><span className="font-medium">서비스 제공 및 계약 이행:</span> 상품 배송, 결제 처리, 장바구니 및 적립금/쿠폰 서비스 제공</li>
                <li><span className="font-medium">회원 관리:</span> 본인 확인, 개인 식별, 불량 회원의 부정 이용 방지와 비인가 사용 방지, 고객 상담 및 분쟁 처리</li>
                <li><span className="font-medium">마케팅 및 광고:</span> 신규 향수 컬렉션 안내, 이벤트 정보 제공 (마케팅 수신 동의자에 한함)</li>
              </ul>
            </div>
          </section>

          
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">3. 개인정보의 보유 및 이용 기간</h3>
            <div className="space-y-4 text-[#555]">
              <p>회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 법령에서 정한 일정한 기간 동안 개인정보를 보관합니다.</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>계약 또는 청약철회 등에 관한 기록: <span className="font-medium text-[#2a2620]">5년 (전자상거래법)</span></li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: <span className="font-medium text-[#2a2620]">5년 (전자상거래법)</span></li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: <span className="font-medium text-[#2a2620]">3년 (전자상거래법)</span></li>
                <li>웹사이트 방문 기록: <span className="font-medium text-[#2a2620]">3개월 (통신비밀보호법)</span></li>
              </ul>
            </div>
          </section>

          
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">4. 개인정보의 취급 위탁</h3>
            <p className="text-justify text-[#555] mb-4">
              회사는 원활한 서비스 이행을 위해 아래와 같이 외부 전문업체에 업무를 위탁하여 운영하고 있습니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-[#c9a961]/20">
                <thead>
                  <tr className="bg-[#faf8f3] text-[#2a2620] text-xs tracking-widest uppercase">
                    <th className="border border-[#c9a961]/20 p-3 font-medium">수탁자</th>
                    <th className="border border-[#c9a961]/20 p-3 font-medium">위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody className="text-[#555] text-sm">
                  <tr>
                    <td className="border border-[#c9a961]/20 p-3">CJ대한통운</td>
                    <td className="border border-[#c9a961]/20 p-3">고객 대상 제품 배송 업무</td>
                  </tr>
                  <tr>
                    <td className="border border-[#c9a961]/20 p-3">나이스평가정보㈜</td>
                    <td className="border border-[#c9a961]/20 p-3">실명확인, 본인인증</td>
                  </tr>
                  <tr>
                    <td className="border border-[#c9a961]/20 p-3">토스페이먼츠</td>
                    <td className="border border-[#c9a961]/20 p-3">구매대금 및 요금 결제</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">5. 이용자의 권리와 그 행사방법</h3>
            <p className="text-justify text-[#555]">
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 가입 해지(회원탈퇴)를 요청할 수 있습니다. 개인정보 조회 및 수정은 '마이페이지 &gt; 프로필 수정'에서 가능하며, 가입 해지는 '회원탈퇴' 메뉴를 클릭하여 본인 확인 절차를 거치신 후 직접 처리할 수 있습니다.
            </p>
          </section>

          
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">6. 개인정보 자동수집 장치(쿠키 등)의 설치, 운영 및 거부</h3>
            <p className="text-justify text-[#555] mb-4">
              회사는 이용자에게 개인화되고 맞춤화된 서비스를 제공하기 위해 이용자의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#555] ml-2">
              <li><span className="font-medium">쿠키의 사용 목적:</span> 이용자의 접속 빈도나 방문 시간 분석, 장바구니 이용 내역 추적 등을 통한 타겟 마케팅 및 개인 맞춤 서비스 제공</li>
              <li><span className="font-medium">쿠키 설정 거부:</span> 웹 브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 있을 수 있습니다.</li>
            </ul>
          </section>

          
          <section>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-4">7. 개인정보 보호책임자</h3>
            <p className="text-justify text-[#555] mb-2">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-[#faf8f3] p-6 border border-[#c9a961]/20 mt-4 text-[#2a2620]">
              <p><span className="font-medium">▶ 개인정보 보호책임자</span></p>
              <p className="mt-2 text-[#555]">- 성명: 아 이온</p>
              <p className="text-[#555]">- 이메일: aion@aion-parfums.com</p>
              <p className="text-[#555]">- 전화번호: 010-2023-2026</p>
            </div>
          </section>

          <div className="pt-8 border-t border-[#c9a961]/20 text-center mt-12">
            <h4 className="font-serif text-xl tracking-[0.2em] text-[#1a1a1a] mb-2">OLYMPUS PARFUMS</h4>
            <p className="text-[#8b8278] text-xs tracking-widest uppercase">Since 1847, 영원한 그들의 향을 담다.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Privacy;