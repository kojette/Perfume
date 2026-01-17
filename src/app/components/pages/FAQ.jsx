import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

// FAQ 데이터
const FAQ_DATA = [
  {
    id: 1,
    category: '주문/배송',
    question: '배송은 얼마나 걸리나요?',
    answer: '주문 확인 후 영업일 기준 2-3일 내에 배송됩니다. 제주도 및 도서산간 지역은 추가 1-2일이 소요될 수 있습니다. 배송 시작 시 문자 또는 이메일로 송장번호를 안내해드립니다.'
  },
  {
    id: 2,
    category: '주문/배송',
    question: '배송비는 얼마인가요?',
    answer: '50,000원 이상 구매 시 무료배송입니다. 50,000원 미만 주문 시 배송비 3,000원이 부과됩니다. 제주도 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.'
  },
  {
    id: 3,
    category: '주문/배송',
    question: '주문 후 배송지 변경이 가능한가요?',
    answer: '배송 준비 중 단계까지는 고객센터로 연락주시면 배송지 변경이 가능합니다. 이미 배송이 시작된 경우에는 택배사에 직접 연락하여 변경을 요청하셔야 합니다.'
  },
  {
    id: 4,
    category: '교환/환불',
    question: '교환 및 환불은 어떻게 하나요?',
    answer: '제품 수령 후 7일 이내에 고객센터로 연락주시면 됩니다. 단, 제품 개봉 후 사용한 향수는 교환 및 환불이 불가능합니다. 미개봉 상태의 제품만 교환 및 환불이 가능합니다.'
  },
  {
    id: 5,
    category: '교환/환불',
    question: '환불은 언제 처리되나요?',
    answer: '반품 상품 확인 후 영업일 기준 3-5일 내에 환불이 처리됩니다. 카드 결제의 경우 카드사 정책에 따라 추가 시일이 소요될 수 있습니다.'
  },
  {
    id: 6,
    category: '제품',
    question: '향수 샘플을 받을 수 있나요?',
    answer: '온라인 구매 고객님께는 주문 시 샘플 2종을 무료로 제공해드립니다. 또한 매장 방문 시 테스트가 가능하며, 원하시는 향의 샘플을 받아가실 수 있습니다.'
  },
  {
    id: 7,
    category: '제품',
    question: '향수 보관은 어떻게 해야 하나요?',
    answer: '직사광선을 피하고 서늘한 곳에 보관하시는 것이 좋습니다. 욕실처럼 온도와 습도 변화가 큰 곳은 피해주세요. 개봉 후에는 1-2년 내에 사용하시는 것을 권장합니다.'
  },
  {
    id: 8,
    category: '제품',
    question: '제품 성분을 알 수 있나요?',
    answer: '모든 제품의 상세 페이지에서 전성분을 확인하실 수 있습니다. 알레르기가 있으신 경우 구매 전 반드시 성분을 확인해주시기 바랍니다.'
  },
  {
    id: 9,
    category: '회원/혜택',
    question: '회원 등급 혜택이 있나요?',
    answer: '구매 금액에 따라 실버, 골드, 플래티넘 등급으로 나뉘며, 등급별로 할인율과 적립률이 달라집니다. 또한 생일 쿠폰 등 다양한 혜택을 제공해드립니다.'
  },
  {
    id: 10,
    category: '회원/혜택',
    question: '적립금은 어떻게 사용하나요?',
    answer: '적립금은 1,000원 이상부터 사용 가능하며, 상품 금액의 최대 30%까지 사용하실 수 있습니다. 적립금은 제품 구매 시에만 사용 가능하며, 배송비 결제에는 사용할 수 없습니다.'
  }
];

const FAQ = () => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', '주문/배송', '교환/환불', '제품', '회원/혜택'];
  const categoryLabels = {
    'all': '전체',
    '주문/배송': '주문/배송',
    '교환/환불': '교환/환불',
    '제품': '제품',
    '회원/혜택': '회원/혜택'
  };

  const filteredFAQ = selectedCategory === 'all' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">
            자주 묻는 질문
          </h1>
          <p className="text-sm text-[#8b8278] italic">
            고객님들이 자주 궁금해하시는 내용을 모았습니다
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 text-xs tracking-wider transition-all ${
                selectedCategory === category
                  ? 'bg-[#c9a961] text-white'
                  : 'bg-white text-[#8b8278] border border-[#c9a961]/20 hover:border-[#c9a961]'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQ.map((faq) => (
            <div
              key={faq.id}
              className="bg-white border border-[#c9a961]/20 rounded-lg overflow-hidden transition-all hover:shadow-md"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#faf8f3] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2.5 py-1 bg-[#c9a961]/10 text-[#c9a961] text-[9px] tracking-wider font-medium rounded">
                      {faq.category}
                    </span>
                    <span className="text-[#c9a961] text-xs font-bold">Q</span>
                  </div>
                  <h3 className="text-[#2a2620] font-medium text-base">
                    {faq.question}
                  </h3>
                </div>
                <div className="ml-4">
                  {openId === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-[#c9a961]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#8b8278]" />
                  )}
                </div>
              </button>

              {openId === faq.id && (
                <div className="px-6 pb-5 pt-2 bg-[#faf8f3] border-t border-[#c9a961]/10">
                  <div className="flex gap-3">
                    <span className="text-[#c9a961] text-xs font-bold flex-shrink-0">A</span>
                    <p className="text-[#555] text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 문의하기 CTA */}
        <div className="mt-12 p-8 bg-white border border-[#c9a961]/20 rounded-lg text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-4 text-[#c9a961]" />
          <h3 className="text-lg font-semibold text-[#2a2620] mb-2">
            찾으시는 답변이 없으신가요?
          </h3>
          <p className="text-sm text-[#8b8278] mb-6">
            고객센터를 통해 문의해주시면 빠르게 답변해드리겠습니다.
          </p>
          <button
            onClick={() => navigate('/customer/inquiry')}
            className="px-8 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all"
          >
            문의하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;