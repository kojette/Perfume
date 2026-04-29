import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, CheckCircle, Clock, User, MessageSquare, RefreshCw, Send, AlertCircle, X } from 'lucide-react';
import { Ornament } from '../Ornament';
import { supabase } from '../../supabaseClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const INQUIRY_TYPES = [
  { value: 'product', label: '상품문의' },
  { value: 'refund', label: '환불문의' },
  { value: 'delivery', label: '배송문의' },
  { value: 'site', label: '사이트문의' },
  { value: 'company', label: '회사문의' },
  { value: 'faq', label: '자주묻는질문' },
  { value: 'newProduct', label: '신제품문의' }
];

const STATUS = {
  pending: { label: '대기중', color: 'bg-amber-100 text-amber-800', icon: Clock },
  processing: { label: '처리중', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  completed: { label: '답변완료', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: '취소됨', color: 'bg-gray-100 text-gray-400', icon: X }
};

const WARNING_LEVELS = {
  normal: { label: '정상', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' },
  warning: { label: '경고', color: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-800' },
  danger: { label: '주의', color: 'bg-orange-50 border-orange-300', badge: 'bg-orange-100 text-orange-800' },
  blacklist: { label: '블랙리스트', color: 'bg-red-50 border-red-400', badge: 'bg-red-100 text-red-800' }
};

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); 
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);

  const currentUser = sessionStorage.getItem('userName') || '관리자';

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const { data: {session} } = await supabase.auth.getSession();

      if (!session) {
        alert ("로그인이 필요합니다.");
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/inquiries/admin/all`, {
        method: 'GET',
        headers: {
          'Authorization' : `Bearer ${session.access_token}`,
          'Content-Type' : 'application/json'
        }
      });

      if (response.ok) {
        const json = await response.json();

        const mappedData = json.data.map(item => ({
          ...item,
          id : item.inquiryId,
          customerId : item.customerId || item.userId || item.memberId || null,
          customer : {
            id : item.customerId || item.userId || item.memberId || null,
            name : item.customerName || '알 수 없음',
            email : item.customerEmail || 'no-email',
            warningLevel : item.warningLevel || 'normal',
            warnings : item.warningCount || 0
          },
          hasNotification: false
        }));

        setInquiries(mappedData);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "데이터를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("데이터 로드 실패: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (inquiryId) => {
    if (!answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${API_BASE}/api/inquiries/admin/${inquiryId}/answer`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'text/plain'
        },
        body: answerText
      });

      if (response.ok) {
        alert('답변이 등록되었습니다.');
        setAnswerText('');

        setInquiries(prev => prev.map(inq => 
          inq.id === inquiryId 
          ? { ...inq, status: 'completed', answer: answerText, assignedTo: currentUser } 
          : inq
        ));

        setSelectedInquiry(prev => ({ 
          ...prev, 
          status: 'completed', 
          answer: answerText, 
          assignedTo: currentUser 
        }));

      } else {
        alert('답변 등록 실패');
      }
    } catch (error) {
      console.error("답변 전송 에러:", error);
    }
  };

  const handleClaimInquiry = (inquiryId) => {
    alert("문의 선점 기능은 추후 업데이트 될 예정입니다. (현재 바로 답변 가능)");

    setInquiries(prev => prev.map(inq => 
        inq.id === inquiryId ? { ...inq, status: 'processing', assignedTo: currentUser } : inq
    ));
  };

  const getWarningLevel = (count) => {
    if (count <= 0) return 'normal';
    if (count === 1) return 'warning';
    if (count === 2) return 'danger';
    return 'blacklist';
  };

  const handleAddWarning = async () => {
    if (!selectedInquiry) return;
    const customerId = selectedInquiry.customerId || selectedInquiry.customer?.id;
    if (!customerId) {
      alert('고객 ID를 찾을 수 없습니다.\n백엔드 응답에 customerId(또는 userId/memberId) 필드가 필요합니다.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/inquiries/admin/users/${customerId}/warning/add`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const newWarnings = (selectedInquiry.customer.warnings || 0) + 1;
        const newLevel = getWarningLevel(newWarnings);
        const updatedCustomer = { ...selectedInquiry.customer, warnings: newWarnings, warningLevel: newLevel };
        setSelectedInquiry(prev => ({ ...prev, customer: updatedCustomer }));
        setInquiries(prev => prev.map(inq =>
          inq.id === selectedInquiry.id ? { ...inq, customer: updatedCustomer } : inq
        ));
        alert(`경고가 추가되었습니다. (현재 ${newWarnings}회 / ${WARNING_LEVELS[newLevel].label})`);
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || '경고 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('경고 추가 에러:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  };

  const handleReduceWarning = async () => {
    if (!selectedInquiry) return;
    const customerId = selectedInquiry.customerId || selectedInquiry.customer?.id;
    if (!customerId) {
      alert('고객 ID를 찾을 수 없습니다.\n백엔드 응답에 customerId(또는 userId/memberId) 필드가 필요합니다.');
      return;
    }
    if ((selectedInquiry.customer.warnings || 0) <= 0) {
      alert('이미 경고가 없는 정상 고객입니다.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/inquiries/admin/users/${customerId}/warning/reduce`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const newWarnings = Math.max(0, (selectedInquiry.customer.warnings || 0) - 1);
        const newLevel = getWarningLevel(newWarnings);
        const updatedCustomer = { ...selectedInquiry.customer, warnings: newWarnings, warningLevel: newLevel };
        setSelectedInquiry(prev => ({ ...prev, customer: updatedCustomer }));
        setInquiries(prev => prev.map(inq =>
          inq.id === selectedInquiry.id ? { ...inq, customer: updatedCustomer } : inq
        ));
        alert(`경고가 감소되었습니다. (현재 ${newWarnings}회 / ${WARNING_LEVELS[newLevel].label})`);
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || '경고 감소에 실패했습니다.');
      }
    } catch (error) {
      console.error('경고 감소 에러:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveBlacklist = async () => {
    if (!selectedInquiry) return;
    const customerId = selectedInquiry.customerId || selectedInquiry.customer?.id;
    if (!customerId) {
      alert('고객 ID를 찾을 수 없습니다.\n백엔드 응답에 customerId(또는 userId/memberId) 필드가 필요합니다.');
      return;
    }
    if (!window.confirm('블랙리스트를 해제하시겠습니까?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/inquiries/admin/users/${customerId}/blacklist/remove`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const updatedCustomer = { ...selectedInquiry.customer, warnings: 0, warningLevel: 'normal' };
        setSelectedInquiry(prev => ({ ...prev, customer: updatedCustomer }));
        setInquiries(prev => prev.map(inq =>
          inq.id === selectedInquiry.id ? { ...inq, customer: updatedCustomer } : inq
        ));
        alert('블랙리스트가 해제되었습니다.');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || '블랙리스트 해제에 실패했습니다.');
      }
    } catch (error) {
      console.error('블랙리스트 해제 에러:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  };

  const filteredInquiries = useMemo(() => {
    let result = [...inquiries];

    if (activeTab === 'my') {
      result = result.filter(inq => inq.assignedTo === currentUser);
    } else if (activeTab === 'blacklist') {
      result = result.filter(inq => inq.customer.warningLevel === 'blacklist');
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(inq => 
        inq.title.toLowerCase().includes(lower) ||
        inq.customer.name.toLowerCase().includes(lower) ||
        inq.customer.email.toLowerCase().includes(lower)
      );
    }

    if (filterType !== 'all') result = result.filter(inq => inq.type === filterType);
    if (filterStatus !== 'all') result = result.filter(inq => inq.status === filterStatus);

    return result;
  }, [inquiries, activeTab, searchTerm, filterType, filterStatus, currentUser]);

  const notificationCount = inquiries.filter(inq => inq.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">CUSTOMER SUPPORT</div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">고객 관리</h1>
          <p className="text-sm text-[#8b8278] italic">Customer Inquiries Management</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 text-xs tracking-[0.2em] transition-all ${activeTab === 'all' ? 'bg-[#2a2620] text-white' : 'bg-white text-[#8b8278] border border-[#c9a961]/20'}`}>전체 문의</button>
            <button onClick={() => setActiveTab('my')} className={`px-6 py-2.5 text-xs tracking-[0.2em] transition-all ${activeTab === 'my' ? 'bg-[#2a2620] text-white' : 'bg-white text-[#8b8278] border border-[#c9a961]/20'}`}>내 담당 문의</button>
            <button onClick={() => setActiveTab('blacklist')} className={`px-6 py-2.5 text-xs tracking-[0.2em] transition-all ${activeTab === 'blacklist' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-300'}`}>블랙리스트</button>
          </div>
          <div className="relative">
            <button className="p-2.5 bg-white border border-[#c9a961]/20 rounded-lg hover:border-[#c9a961]">
              <Bell className="w-5 h-5 text-[#c9a961]" />
              {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{notificationCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8278]" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="고객명, 이메일, 제목 검색..." className="w-full pl-11 pr-4 py-3 border border-[#c9a961]/20 rounded-lg bg-white text-sm outline-none focus:border-[#c9a961]" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-3 border border-[#c9a961]/20 rounded-lg bg-white text-xs outline-none focus:border-[#c9a961]"><option value="all">모든 유형</option>{INQUIRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 border border-[#c9a961]/20 rounded-lg bg-white text-xs outline-none focus:border-[#c9a961]"><option value="all">모든 상태</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">

          <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
            {loading ? (
               <div className="bg-white p-12 text-center rounded-lg border border-[#c9a961]/10"><p className="text-sm text-[#8b8278]">로딩 중...</p></div>
            ) : filteredInquiries.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-lg border border-[#c9a961]/10"><MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#c9a961]/30" /><p className="text-sm text-[#8b8278] italic">문의가 없습니다</p></div>
            ) : (
              filteredInquiries.map(inquiry => {
                const warningConfig = WARNING_LEVELS[inquiry.customer.warningLevel];
                const statusInfo = STATUS[inquiry.status] || STATUS.pending;
                return (
                  <div key={inquiry.id} onClick={() => { setSelectedInquiry(inquiry); setAnswerText(''); }} 
                       className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${warningConfig.color} ${selectedInquiry?.id === inquiry.id ? 'ring-2 ring-[#c9a961]' : ''} hover:shadow-md`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-sm text-[#2a2620] mb-1">{inquiry.title}</h3>
                          <p className="text-xs text-[#8b8278]">{new Date(inquiry.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${warningConfig.badge}`}>{warningConfig.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#c9a961]/10">
                      <div className="flex items-center gap-2 text-xs text-[#8b8278]"><User className="w-3.5 h-3.5" /><span>{inquiry.customer.name}</span><span className="text-[#c9a961]/50">·</span><span>{inquiry.customer.email}</span></div>
                      {inquiry.assignedTo && <div className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full"><div className="w-2 h-2 bg-blue-600 rounded-full"></div>{inquiry.assignedTo}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedInquiry ? (
              <div className="bg-white rounded-lg border border-[#c9a961]/20 p-6 sticky top-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#c9a961]/10">
                  <h3 className="text-sm font-semibold tracking-wider text-[#2a2620]">문의 상세</h3>
                  <button onClick={() => setSelectedInquiry(null)} className="text-xs text-[#8b8278] hover:text-[#c9a961]">닫기</button>
                </div>

                <div className="space-y-6">

                  <div>
                    <div className="text-[9px] tracking-wider text-[#8b8278] mb-2">고객 정보</div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#c9a961]/10 flex items-center justify-center"><User className="w-5 h-5 text-[#c9a961]" /></div>
                      <div><p className="text-sm font-medium text-[#2a2620]">{selectedInquiry.customer.name}</p><p className="text-xs text-[#8b8278]">{selectedInquiry.customer.email}</p></div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-medium ${WARNING_LEVELS[selectedInquiry.customer.warningLevel].badge}`}>{WARNING_LEVELS[selectedInquiry.customer.warningLevel].label}</span>
                      <span className="text-[10px] text-[#8b8278]">경고 {selectedInquiry.customer.warnings}회</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] tracking-wider text-[#8b8278] mb-2">문의 내용</div>
                    <div className="bg-[#faf8f3] p-4 rounded-lg"><p className="text-sm text-[#2a2620] leading-relaxed">{selectedInquiry.content}</p></div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#c9a961]/10">

                    {selectedInquiry.answer ? (
                      <div className="bg-gray-50 border-l-4 border-green-500 p-4 rounded">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-green-700 flex items-center gap-1"><CheckCircle size={12}/> 답변 완료</span>
                            <span className="text-[10px] text-gray-400">{selectedInquiry.assignedTo}</span>
                        </div>
                        <p className="text-sm text-[#2a2620] whitespace-pre-wrap">{selectedInquiry.answer}</p>
                      </div>
                    ) : selectedInquiry.status === 'cancelled' ? (
                      <div className="p-4 bg-gray-100 text-center text-gray-500 text-sm rounded">취소된 문의입니다.</div>
                    ) : (

                      <div>
                        <div className="text-[9px] tracking-wider text-[#8b8278] mb-2 flex justify-between items-center">
                            <span>답변 작성</span>
                            {selectedInquiry.status === 'pending' && <button onClick={() => handleClaimInquiry(selectedInquiry.id)} className="text-[9px] text-blue-500 hover:underline">담당자 지정(선점)</button>}
                        </div>
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          rows="6"
                          className="w-full border border-[#c9a961]/30 p-3 rounded-lg text-sm outline-none focus:border-[#c9a961] resize-none"
                          placeholder="답변을 입력해주세요..."
                        />
                        <button
                          onClick={() => handleSubmitAnswer(selectedInquiry.id)}
                          className="w-full mt-2 py-3 bg-[#2a2620] text-white text-xs tracking-wider hover:bg-[#c9a961] transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" /> 답변 전송
                        </button>
                      </div>
                    )}

                    {selectedInquiry.status !== 'cancelled' && (
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#eee]">
                            <button onClick={() => handleAddWarning()} className="py-2 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] hover:bg-orange-100 rounded">경고 추가</button>
                            <button onClick={() => handleReduceWarning()} className="py-2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] hover:bg-blue-100 rounded">경고 감소</button>
                        </div>
                    )}
                    {selectedInquiry.customer.warningLevel === 'blacklist' && (
                        <button onClick={() => handleRemoveBlacklist()} className="w-full py-2 bg-red-600 text-white text-[10px] hover:bg-red-700 rounded mt-2">블랙리스트 해제</button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#c9a961]/20 p-12 text-center sticky top-6">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#c9a961]/30" />
                <p className="text-sm text-[#8b8278] italic">문의를 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;