import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, CheckCircle, Clock, User, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { Ornament } from '../Ornament';

// 문의 유형 정의
const INQUIRY_TYPES = [
  { value: 'product', label: '상품문의', icon: '🛍️' },
  { value: 'refund', label: '환불문의', icon: '💰' },
  { value: 'site', label: '사이트문의', icon: '🌐' },
  { value: 'company', label: '회사문의', icon: '🏢' },
  { value: 'faq', label: '자주묻는질문', icon: '❓' },
  { value: 'newProduct', label: '신제품문의', icon: '✨' }
];

// 문의 상태
const STATUS = {
  pending: { label: '대기중', color: 'bg-amber-100 text-amber-800', icon: Clock },
  processing: { label: '처리중', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  completed: { label: '완료', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

// 고객 경고 레벨
const WARNING_LEVELS = {
  normal: { label: '정상', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800' },
  warning: { label: '경고', color: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-800' },
  danger: { label: '주의', color: 'bg-orange-50 border-orange-300', badge: 'bg-orange-100 text-orange-800' },
  blacklist: { label: '블랙리스트', color: 'bg-red-50 border-red-400', badge: 'bg-red-100 text-red-800' }
};

const CustomerSupport = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // all, my, blacklist
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [answerText, setAnswerText] = useState('');
  
  // 현재 로그인한 관리자 (실제로는 로그인 시스템에서 가져와야 함)
  const currentUser = sessionStorage.getItem('userName') || '관리자';
  const isAdmin = true; // 실제로는 권한 체크 필요

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if(!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }

    // 관리자 권한 체크
    if (!isAdmin) {
      alert('관리자 권한이 필요합니다.');
      navigate('/');
      return;
    }

    // localStorage에서 모든 문의 불러오기
    loadInquiries();
  }, []);

  const loadInquiries = () => {
    const allInquiries = JSON.parse(localStorage.getItem('userInquiries') || '[]');
    
    // 고객별 경고 레벨 추가 (목업 - 실제로는 백엔드에서 관리)
    const inquiriesWithWarnings = allInquiries.map(inq => ({
      ...inq,
      customer: {
        name: inq.customerName,
        email: inq.customerEmail,
        warningLevel: getCustomerWarningLevel(inq.customerEmail),
        warnings: getCustomerWarningCount(inq.customerEmail)
      }
    }));
    
    setInquiries(inquiriesWithWarnings);
  };

  // 고객 경고 레벨 계산 (목업)
  const getCustomerWarningLevel = (email) => {
    const warningCount = getCustomerWarningCount(email);
    if (warningCount >= 5) return 'blacklist';
    if (warningCount >= 3) return 'danger';
    if (warningCount >= 1) return 'warning';
    return 'normal';
  };

  const getCustomerWarningCount = (email) => {
    // 실제로는 백엔드에서 관리
    const warnings = JSON.parse(localStorage.getItem('customerWarnings') || '{}');
    return warnings[email] || 0;
  };

  // 문의 선점
  const handleClaimInquiry = (inquiryId) => {
    const allInquiries = JSON.parse(localStorage.getItem('userInquiries') || '[]');
    const updated = allInquiries.map(inq => 
      inq.id === inquiryId 
        ? { ...inq, status: 'processing', assignedTo: currentUser }
        : inq
    );
    localStorage.setItem('userInquiries', JSON.stringify(updated));
    loadInquiries();
    
    // 선점된 문의 자동 선택
    const claimed = updated.find(inq => inq.id === inquiryId);
    if (claimed) {
      setSelectedInquiry({
        ...claimed,
        customer: {
          name: claimed.customerName,
          email: claimed.customerEmail,
          warningLevel: getCustomerWarningLevel(claimed.customerEmail),
          warnings: getCustomerWarningCount(claimed.customerEmail)
        }
      });
    }
  };

  // 답변 제출 및 문의 완료
  const handleSubmitAnswer = (inquiryId) => {
    if (!answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    const allInquiries = JSON.parse(localStorage.getItem('userInquiries') || '[]');
    const updated = allInquiries.map(inq => 
      inq.id === inquiryId 
        ? { ...inq, status: 'completed', answer: answerText, answeredAt: new Date().toLocaleString('ko-KR') }
        : inq
    );
    localStorage.setItem('userInquiries', JSON.stringify(updated));
    
    setAnswerText('');
    loadInquiries();
    setSelectedInquiry(null);
    alert('답변이 전송되었습니다.');
  };

  // 경고 추가
  const handleAddWarning = (email) => {
    if (window.confirm('이 고객에게 경고를 추가하시겠습니까?')) {
      const warnings = JSON.parse(localStorage.getItem('customerWarnings') || '{}');
      warnings[email] = (warnings[email] || 0) + 1;
      localStorage.setItem('customerWarnings', JSON.stringify(warnings));
      loadInquiries();
      
      // 선택된 문의 업데이트
      if (selectedInquiry && selectedInquiry.customer.email === email) {
        const updatedInquiry = {
          ...selectedInquiry,
          customer: {
            ...selectedInquiry.customer,
            warnings: warnings[email],
            warningLevel: getCustomerWarningLevel(email)
          }
        };
        setSelectedInquiry(updatedInquiry);
      }
      
      alert('경고가 추가되었습니다.');
    }
  };

  // 경고 감소
  const handleReduceWarning = (email) => {
    const warnings = JSON.parse(localStorage.getItem('customerWarnings') || '{}');
    const currentWarnings = warnings[email] || 0;
    
    if (currentWarnings === 0) {
      alert('경고 횟수가 이미 0입니다.');
      return;
    }
    
    if (window.confirm('이 고객의 경고를 1회 감소하시겠습니까?')) {
      warnings[email] = currentWarnings - 1;
      localStorage.setItem('customerWarnings', JSON.stringify(warnings));
      loadInquiries();
      
      // 선택된 문의 업데이트
      if (selectedInquiry && selectedInquiry.customer.email === email) {
        const updatedInquiry = {
          ...selectedInquiry,
          customer: {
            ...selectedInquiry.customer,
            warnings: warnings[email],
            warningLevel: getCustomerWarningLevel(email)
          }
        };
        setSelectedInquiry(updatedInquiry);
      }
      
      alert('경고가 감소되었습니다.');
    }
  };

  // 블랙리스트 해제
  const handleRemoveBlacklist = (email) => {
    if (window.confirm('블랙리스트를 해제하시겠습니까?')) {
      const warnings = JSON.parse(localStorage.getItem('customerWarnings') || '{}');
      warnings[email] = 0;
      localStorage.setItem('customerWarnings', JSON.stringify(warnings));
      loadInquiries();
      
      // 선택된 문의 업데이트
      if (selectedInquiry && selectedInquiry.customer.email === email) {
        const updatedInquiry = {
          ...selectedInquiry,
          customer: {
            ...selectedInquiry.customer,
            warnings: 0,
            warningLevel: 'normal'
          }
        };
        setSelectedInquiry(updatedInquiry);
      }
      
      alert('블랙리스트가 해제되었습니다.');
    }
  };

  // 필터링된 문의 목록
  const filteredInquiries = useMemo(() => {
    let result = [...inquiries];

    // 탭 필터
    if (activeTab === 'my') {
      result = result.filter(inq => inq.assignedTo === currentUser);
    } else if (activeTab === 'blacklist') {
      result = result.filter(inq => inq.customer.warningLevel === 'blacklist');
    }

    // 검색
    if (searchTerm) {
      result = result.filter(inq => 
        inq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 유형 필터
    if (filterType !== 'all') {
      result = result.filter(inq => inq.type === filterType);
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      result = result.filter(inq => inq.status === filterStatus);
    }

    return result;
  }, [inquiries, activeTab, searchTerm, filterType, filterStatus, currentUser]);

  // 알림 카운트
  const notificationCount = inquiries.filter(inq => 
    inq.hasNotification && inq.status === 'pending'
  ).length;

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            CUSTOMER SUPPORT
          </div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">
            고객센터 관리
          </h1>
          <p className="text-sm text-[#8b8278] italic">Customer Inquiries Management</p>
        </div>

        {/* Tabs & Notification */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2.5 text-xs tracking-[0.2em] transition-all ${
                activeTab === 'all'
                  ? 'bg-[#2a2620] text-white'
                  : 'bg-white text-[#8b8278] border border-[#c9a961]/20 hover:border-[#c9a961]'
              }`}
            >
              전체 문의
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-2.5 text-xs tracking-[0.2em] transition-all ${
                activeTab === 'my'
                  ? 'bg-[#2a2620] text-white'
                  : 'bg-white text-[#8b8278] border border-[#c9a961]/20 hover:border-[#c9a961]'
              }`}
            >
              내 담당 문의
            </button>
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`px-6 py-2.5 text-xs tracking-[0.2em] transition-all ${
                activeTab === 'blacklist'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-red-600 border border-red-300 hover:border-red-500'
              }`}
            >
              블랙리스트
            </button>
          </div>

          <div className="relative">
            <button className="p-2.5 bg-white border border-[#c9a961]/20 rounded-lg hover:border-[#c9a961] transition-all relative">
              <Bell className="w-5 h-5 text-[#c9a961]" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8278]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="고객명, 이메일, 제목 검색..."
              className="w-full pl-11 pr-4 py-3 border border-[#c9a961]/20 rounded-lg bg-white text-sm outline-none focus:border-[#c9a961] transition-colors"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-[#c9a961]/20 rounded-lg bg-white text-xs tracking-wider outline-none focus:border-[#c9a961] cursor-pointer"
          >
            <option value="all">모든 유형</option>
            {INQUIRY_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-[#c9a961]/20 rounded-lg bg-white text-xs tracking-wider outline-none focus:border-[#c9a961] cursor-pointer"
          >
            <option value="all">모든 상태</option>
            {Object.entries(STATUS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inquiry List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredInquiries.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-lg border border-[#c9a961]/10">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#c9a961]/30" />
                <p className="text-sm text-[#8b8278] italic">문의가 없습니다</p>
              </div>
            ) : (
              filteredInquiries.map(inquiry => {
                const warningConfig = WARNING_LEVELS[inquiry.customer.warningLevel];
                
                return (
                  <div
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`
                      p-5 rounded-lg border-2 cursor-pointer transition-all
                      ${warningConfig.color}
                      ${selectedInquiry?.id === inquiry.id ? 'ring-2 ring-[#c9a961]' : ''}
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {INQUIRY_TYPES.find(t => t.value === inquiry.type)?.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-[#2a2620]">
                              {inquiry.title}
                            </h3>
                            {inquiry.hasNotification && inquiry.status === 'pending' && (
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-xs text-[#8b8278]">{inquiry.createdAt}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${STATUS[inquiry.status].color}`}>
                          {STATUS[inquiry.status].label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${warningConfig.badge}`}>
                          {warningConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#c9a961]/10">
                      <div className="flex items-center gap-2 text-xs text-[#8b8278]">
                        <User className="w-3.5 h-3.5" />
                        <span>{inquiry.customer.name}</span>
                        <span className="text-[#c9a961]/50">·</span>
                        <span className="text-[10px]">{inquiry.customer.email}</span>
                        {inquiry.customer.warnings > 0 && (
                          <>
                            <span className="text-[#c9a961]/50">·</span>
                            <span className="text-orange-600 font-medium">
                              경고 {inquiry.customer.warnings}회
                            </span>
                          </>
                        )}
                      </div>

                      {inquiry.assignedTo && (
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          {inquiry.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedInquiry ? (
              <div className="bg-white rounded-lg border border-[#c9a961]/20 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#c9a961]/10">
                  <h3 className="text-sm font-semibold tracking-wider text-[#2a2620]">
                    문의 상세
                  </h3>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="text-xs text-[#8b8278] hover:text-[#c9a961]"
                  >
                    닫기
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <div className="text-[9px] tracking-wider text-[#8b8278] mb-2">고객 정보</div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#c9a961]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#c9a961]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2a2620]">
                          {selectedInquiry.customer.name}
                        </p>
                        <p className="text-xs text-[#8b8278]">
                          {selectedInquiry.customer.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-medium ${
                        WARNING_LEVELS[selectedInquiry.customer.warningLevel].badge
                      }`}>
                        {WARNING_LEVELS[selectedInquiry.customer.warningLevel].label}
                      </span>
                      <span className="text-[10px] text-[#8b8278]">
                        경고 {selectedInquiry.customer.warnings}회
                      </span>
                    </div>
                    {/* 경고 수준 안내 */}
                    <div className="mt-3 p-2 bg-[#faf8f3] rounded text-[9px] text-[#8b8278] leading-relaxed">
                      <p className="font-medium mb-1">경고 시스템:</p>
                      <p>• 정상: 0회 | 경고: 1-2회 | 주의: 3-4회</p>
                      <p>• 블랙리스트: 5회 이상</p>
                    </div>
                  </div>

                  {/* Inquiry Content */}
                  <div>
                    <div className="text-[9px] tracking-wider text-[#8b8278] mb-2">문의 내용</div>
                    <div className="bg-[#faf8f3] p-4 rounded-lg">
                      <p className="text-sm text-[#2a2620] leading-relaxed">
                        {selectedInquiry.content}
                      </p>
                    </div>
                  </div>

                  {/* Answer Section (for processing status) */}
                  {selectedInquiry.status === 'processing' && selectedInquiry.assignedTo === currentUser && (
                    <div>
                      <div className="text-[9px] tracking-wider text-[#8b8278] mb-2">답변 작성</div>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        rows="6"
                        className="w-full border border-[#c9a961]/30 p-3 rounded-lg text-sm outline-none focus:border-[#c9a961] resize-none"
                        placeholder="답변을 입력해주세요..."
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-[#c9a961]/10">
                    {selectedInquiry.status === 'pending' && !selectedInquiry.assignedTo && (
                      <button
                        onClick={() => handleClaimInquiry(selectedInquiry.id)}
                        className="w-full py-3 bg-[#c9a961] text-white text-xs tracking-wider hover:bg-[#b89851] transition-colors"
                      >
                        문의 선점하기
                      </button>
                    )}

                    {selectedInquiry.status === 'processing' && selectedInquiry.assignedTo === currentUser && (
                      <button
                        onClick={() => handleSubmitAnswer(selectedInquiry.id)}
                        className="w-full py-3 bg-green-600 text-white text-xs tracking-wider hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        답변 전송 및 완료
                      </button>
                    )}

                    {/* 경고 관리 섹션 */}
                    {selectedInquiry.customer.warningLevel !== 'blacklist' && (
                      <div className="space-y-2 pt-3 mt-3 border-t border-[#c9a961]/10">
                        <div className="text-[9px] tracking-wider text-[#8b8278] mb-2">고객 경고 관리</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAddWarning(selectedInquiry.customer.email)}
                            className="py-2 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] tracking-wider hover:bg-orange-100 transition-colors rounded"
                          >
                            ⚠️ 경고 추가
                          </button>
                          <button
                            onClick={() => handleReduceWarning(selectedInquiry.customer.email)}
                            className="py-2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] tracking-wider hover:bg-blue-100 transition-colors rounded"
                            disabled={selectedInquiry.customer.warnings === 0}
                          >
                            ✓ 경고 감소
                          </button>
                        </div>
                        <p className="text-[9px] text-[#8b8278] italic text-center">
                          현재 경고: {selectedInquiry.customer.warnings}회 
                          {selectedInquiry.customer.warnings >= 5 && ' (블랙리스트 수준)'}
                        </p>
                      </div>
                    )}

                    {/* 블랙리스트 고객 전용 섹션 */}
                    {selectedInquiry.customer.warningLevel === 'blacklist' && (
                      <div className="space-y-2 pt-3 mt-3 border-t border-red-200">
                        <div className="text-[9px] tracking-wider text-red-600 mb-2 font-bold">⛔ 블랙리스트 고객</div>
                        <button
                          onClick={() => handleRemoveBlacklist(selectedInquiry.customer.email)}
                          className="w-full py-3 bg-red-600 text-white text-xs tracking-wider hover:bg-red-700 transition-colors rounded"
                        >
                          블랙리스트 해제
                        </button>
                        <p className="text-[9px] text-red-600 italic text-center">
                          경고 {selectedInquiry.customer.warnings}회 누적
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#c9a961]/20 p-12 text-center sticky top-6">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#c9a961]/30" />
                <p className="text-sm text-[#8b8278] italic">
                  문의를 선택하세요
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-4 rounded-lg border border-[#c9a961]/10 text-center">
            <div className="text-2xl font-bold text-[#c9a961] mb-1">
              {inquiries.filter(i => i.status === 'pending').length}
            </div>
            <div className="text-xs text-[#8b8278] tracking-wider">대기중</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#c9a961]/10 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {inquiries.filter(i => i.status === 'processing').length}
            </div>
            <div className="text-xs text-[#8b8278] tracking-wider">처리중</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[#c9a961]/10 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {inquiries.filter(i => i.status === 'completed').length}
            </div>
            <div className="text-xs text-[#8b8278] tracking-wider">완료</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;