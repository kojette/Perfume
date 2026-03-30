import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const INQUIRY_TYPES = [
  { value: 'product', label: '상품문의', icon: '🛍️' },
  { value: 'delivery', label: '배송문의', icon: '🚚'},
  { value: 'refund', label: '환불문의', icon: '💰' },
  { value: 'site', label: '사이트문의', icon: '🌐' },
  { value: 'company', label: '회사문의', icon: '🏢' },
  { value: 'newProduct', label: '신제품문의', icon: '✨' }
];

const CustomerInquiry = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new');
  const [formData, setFormData] = useState({type: '', title: '', content: ''});
  const [myInquiries, setMyInquiries] = useState([]);
  const [notifications, setNotifications] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchMyInquiries = useCallback(async () => {
    try {
      const { data: {session}} = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/inquiries/my`, {
        method: 'GET',
        headers: {
          'Authorization' : `Bearer ${session.access_token}`,
          'Content-Type' : 'application/json'
        }
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data;
        setMyInquiries(data);

        const answeredCount = data.filter(inq => inq.status === 'completed' && !inq.read).length ;
        setNotifications(answeredCount);
      } else {
        console.error("문의 내역 조회 실패");
      }
    } catch (error) {
        console.error('데이터 로드 에러: ', error);
    }
  }, []);

  useEffect(() => {
    fetchMyInquiries();
  }, [fetchMyInquiries]);

  useEffect(() => {
    window.scrollTo(0,0);
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.type || !formData.title || !formData.content) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const {data: {session}} = await supabase.auth.getSession();
      if (!session) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Authorization' : `Bearer ${session.access_token}`,
          'Content-Type' : 'application/json'
        }, 
        body : JSON.stringify({
          type : formData.type,
          title: formData.title,
          content : formData.content
        })
      });

      if (response.ok) {
        alert('문의가 접수되었습니다.');
        setFormData({type:'', title:'', content:''});
        setActiveTab('myInquiries');
        fetchMyInquiries();
      } else {
        alert('문의 접수 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('저장 에러: ', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (inquiryId) => {
    try {
      const {data: {session}} = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/inquiries/${inquiryId}/read`, {
        method : 'PATCH',
        headers : {
          'Authorization' : `Bearer ${session.access_token}`
        }
      });

      if (response.ok){
        fetchMyInquiries();
      }
    } catch (error) {
      console.error("읽음 처리 실패: ", error);
    }
  }

  const handleCancelInquiry = async (inquiryId) => {
    if(!window.confirm('정말 이 문의를 취소하시겠습니까?')) return;

    try {
      const {data: {session}} = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/inquiries/${inquiryId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization' : `Bearer ${session.access_token}`
        }
      });

      if(response.ok) {
        alert('문의가 취소되었습니다.');
        fetchMyInquiries();
      } else {
        alert('취소 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error("취소 실패: ", error);
    }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('문의 내역을 삭제하시겠습니까?')) return;

    try {
      const {data: {session}} = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization' : `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        alert('삭제되었습니다.');
        fetchMyInquiries();
      } else {
        alert('오류가 발생했습니다.');
      }
    } catch (error) {
      console.error("삭제 실패: ", error);
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'pending':
        return { label: '대기중', color: 'bg-amber-100 text-amber-800', icon: Clock };
      case 'processing':
        return { label: '처리중', color: 'bg-blue-100 text-blue-800', icon: AlertCircle };
      case 'completed':
        return { label: '답변완료', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      default:
        return { label: '대기중', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            CUSTOMER SERVICE
          </div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">
            고객센터
          </h1>
          <p className="text-sm text-[#8b8278] italic">무엇을 도와드릴까요?</p>
        </div>

        <div className="flex gap-2 mb-8 border-b border-[#c9a961]/20">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 text-xs tracking-[0.2em] transition-all relative cursor-pointer ${
              activeTab === 'new'
                ? 'text-[#c9a961] font-bold'
                : 'text-[#8b8278] hover:text-[#c9a961]'
            }`}
          >
            새 문의 작성
            {activeTab === 'new' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9a961]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('myInquiries')}
            className={`px-6 py-3 text-xs tracking-[0.2em] transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'myInquiries'
                ? 'text-[#c9a961] font-bold'
                : 'text-[#8b8278] hover:text-[#c9a961]'
            }`}
          >
            내 문의 내역
            {notifications > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
            {activeTab === 'myInquiries' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9a961]"></div>
            )}
          </button>
        </div>

        {activeTab === 'new' ? (

          <div className="max-w-2xl mx-auto bg-white border border-[#c9a961]/20 p-10 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">

              <div className="space-y-3">
                <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] mb-4">
                  문의 유형 선택
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {INQUIRY_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({...formData, type: type.value})}
                      className={`p-4 border-2 rounded-lg transition-all text-left cursor-pointer ${
                        formData.type === type.value
                          ? 'border-[#c9a961] bg-[#c9a961]/5'
                          : 'border-[#c9a961]/20 hover:border-[#c9a961]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <span className="text-sm tracking-wider text-[#2a2620]">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-[#c9a961]/10">
                  <button
                    type="button"
                    onClick={() => navigate('/faq')}
                    className="w-full p-4 border-2 border-[#7ba8d4]/30 bg-[#e8f4ff]/30 rounded-lg hover:border-[#7ba8d4] hover:bg-[#e8f4ff]/50 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">❓</span>
                        <div>
                          <span className="text-sm tracking-wider text-[#2a5580] font-medium">
                            자주 묻는 질문
                          </span>
                          <p className="text-xs text-[#6b8fae] mt-1">
                            빠른 답변이 필요하신가요?
                          </p>
                        </div>
                      </div>
                      <span className="text-[#7ba8d4] text-xs">→</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs tracking-[0.2em] text-[#8b8278]">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border-b border-[#c9a964]/30 py-3 focus:border-[#c9a961] outline-none bg-transparent transition-colors text-base"
                  placeholder="문의 제목을 입력해주세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs tracking-[0.2em] text-[#8b8278]">
                  문의 내용
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows="8"
                  className="w-full border border-[#c9a964]/30 p-4 focus:border-[#c9a961] outline-none bg-transparent transition-colors text-base resize-none rounded-lg"
                  placeholder="문의하실 내용을 자세히 입력해주세요"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? '접수 중...' : '문의 접수하기'}
              </button>
            </form>
          </div>
        ) : (

          <div className="space-y-4">
            {myInquiries.filter(inquiry => inquiry.status !== 'cancelled').length === 0 ? (
              <div className="bg-white p-16 text-center border border-[#c9a961]/10 rounded-lg">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#c9a961]/30" />
                <p className="text-sm text-[#8b8278] italic">문의 내역이 없습니다</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="mt-6 px-6 py-2 border border-[#c9a961] text-[#c9a961] text-xs tracking-wider hover:bg-[#c9a961] hover:text-white transition-all"
                >
                  새 문의 작성하기
                </button>
              </div>
            ) : (
              myInquiries
                .filter(inquiry => inquiry.status !== 'cancelled')
                .map(inquiry => {
                  const statusConfig = getStatusConfig(inquiry.status);
                  const StatusIcon = statusConfig.icon;
                  const typeInfo = INQUIRY_TYPES.find(t => t.value === inquiry.type) || { icon: '📝' };

                return (
                  <div
                    key={inquiry.inquiryId}
                    className="bg-white border border-[#c9a961]/20 p-6 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[#2a2620]">{inquiry.title}</h3>
                            {inquiry.status === 'completed' && !inquiry.read && (
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-xs text-[#8b8278]">{new Date(inquiry.createdAt).toLocaleString('ko-KR')}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 ${statusConfig.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="bg-[#faf8f3] p-4 rounded-lg mb-4">
                      <p className="text-sm text-[#555] leading-relaxed">{inquiry.content}</p>
                    </div>

                    {inquiry.status === 'completed' && inquiry.answer && (
                      <div className="mt-4 pt-4 border-t border-[#c9a961]/10">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#c9a961]/10 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-[#c9a961]" />
                          </div>
                          <div>
                            <p className="text-[10px] tracking-wider text-[#c9a961] font-medium">답변 완료</p>
                            <p className="text-[9px] text-[#8b8278]">{inquiry.assignedTo || '관리자'}</p>
                          </div>
                        </div>
                        <div className="bg-white border border-[#c9a961]/20 p-4 rounded-lg">
                          <p className="text-sm text-[#2a2620] leading-relaxed">{inquiry.answer}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          {!inquiry.read && (
                            <button
                              onClick={() => markAsRead(inquiry.inquiryId)}
                              className="text-xs text-[#c9a961] underline italic hover:text-[#b89851]"
                            >
                              확인 완료
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInquiry(inquiry.inquiryId)}
                            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                          </button>
                        </div>
                      </div>
                    )}

                    {(inquiry.status === 'pending'|| inquiry.status === 'processing') && (
                      <div className="mt-4 pt-4 border-t border-[#c9a961]/10 flex justify-end">
                        <button
                          onClick={() => handleCancelInquiry(inquiry.inquiryId)}
                          className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          문의 취소
                        </button>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInquiry;