import React, { useState, useEffect } from 'react';
import { X, Gift, AlertCircle, Pin, Calendar, Loader2, PartyPopper, Frown } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState({});
  const [loading, setLoading] = useState({});
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  const userEmail = sessionStorage.getItem('userEmail') || '';
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const accessToken = sessionStorage.getItem('accessToken');

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
      fetchEvents();
      if (isLoggedIn) {
        fetchParticipations();
      }
    }
  }, [isOpen, isLoggedIn]);

  const fetchAnnouncements = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('Announcements')
      .select('*')
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('is_pinned', { ascending: false })
      .order('is_important', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (!error) {
      setAnnouncements(data || []);
    }
  };

  const fetchEvents = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false });
    
    if (!error) {
      setEvents(data || []);
    }
  };

  const fetchParticipations = async () => {
    const { data, error } = await supabase
      .from('EventParticipations')
      .select('*')
      .eq('user_email', userEmail);
    
    if (!error && data) {
      const participationMap = {};
      data.forEach(p => {
        participationMap[p.event_id] = {
          participated: true,
          won: p.won,
          participated_at: p.participated_at
        };
      });
      setParticipations(participationMap);
    }
  };

  const handleParticipate = async (event) => {
    if (!isLoggedIn || !accessToken) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }

    if (participations[event.id]?.participated){
      alert('이미 참여한 이벤트입니다!');
      return;
    }

    setLoading(prev => ({ ...prev, [event.id]: true}));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/events/${event.id}/participate`, {
        method: 'POST',
        headers: {
          'Authorization' : `Bearer ${accessToken}`,
          'Content-Type' : 'application/json'
        }
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || '이벤트 참여 중 오류가 발생했습니다.');
        return;
      }

      const result = await response.json();
      const won = result.data.won;

      setResultData({
        won,
        event,
        message: won
          ? `축하합니다! ${event.title}에 당첨되셨습니다! 🎉`
          : '아쉽게도 당첨되지 않았습니다. 다음 기회에! 😊'
      });

      setShowResultModal(true);
      fetchParticipations();

    } catch (error) {
      console.error('참여 처리 중 오류: ', error);
      alert('서버와 통신할 수 없습니다.');
      
    } finally {
      setLoading(prev => ({ ...prev, [event.id]: false}));
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setResultData(null);
  };

  if (!isOpen) return null;

  const getEventTypeLabel = (type) => {
    const types = {
      COUPON: '쿠폰 발행',
      DISCOUNT: '상품 할인',
      POINT: '포인트 지급'
    };
    return types[type] || type;
  };

  const getEventTypeColor = (type) => {
    const colors = {
      COUPON: 'bg-blue-500',
      DISCOUNT: 'bg-red-500',
      POINT: 'bg-green-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-start justify-end">
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
          <div className="bg-[#faf8f3] border-b border-[#c9a961]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#2a2620] tracking-wider">알림</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-full transition-all"
              >
                <X size={20} className="text-[#8b8278]" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`flex-1 py-2 text-xs tracking-wider transition-all ${
                  activeTab === 'announcements'
                    ? 'bg-[#c9a961] text-white'
                    : 'bg-white text-[#8b8278] hover:bg-[#c9a961]/10'
                }`}
              >
                공지사항
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex-1 py-2 text-xs tracking-wider transition-all ${
                  activeTab === 'events'
                    ? 'bg-[#c9a961] text-white'
                    : 'bg-white text-[#8b8278] hover:bg-[#c9a961]/10'
                }`}
              >
                이벤트
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'announcements' ? (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-white border border-[#c9a961]/20 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {announcement.is_pinned && (
                        <span className="px-2 py-0.5 bg-[#c9a961] text-white text-[8px] rounded flex items-center gap-1">
                          <Pin size={8} />
                          고정
                        </span>
                      )}
                      {announcement.is_important && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] rounded flex items-center gap-1">
                          <AlertCircle size={8} />
                          중요
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[#2a2620] mb-2 text-sm">
                      {announcement.title}
                    </h3>
                    <p className="text-xs text-[#555] leading-relaxed mb-3">
                      {announcement.content}
                    </p>
                    {(announcement.start_date || announcement.end_date) && (
                      <div className="flex items-center gap-1 text-[9px] text-[#8b8278]">
                        <Calendar size={10} />
                        {announcement.start_date || '상시'} ~ {announcement.end_date || '상시'}
                      </div>
                    )}
                  </div>
                ))}

                {announcements.length === 0 && (
                  <div className="text-center py-20 text-[#8b8278]">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm italic">등록된 공지사항이 없습니다.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const hasParticipated = participations[event.id]?.participated;
                  const hasWon = participations[event.id]?.won;

                  return (
                    <div
                      key={event.id}
                      className="bg-gradient-to-br from-white to-[#faf8f3] border border-[#c9a961]/30 rounded-lg p-4 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 ${getEventTypeColor(event.event_type)} text-white text-[9px] rounded flex items-center gap-1`}>
                          <Gift size={10} />
                          {getEventTypeLabel(event.event_type)}
                        </span>
                        {event.priority_buyers && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white text-[8px] rounded">
                            구매자 우선
                          </span>
                        )}
                        {hasParticipated && (
                          <span className={`px-2 py-0.5 text-white text-[8px] rounded ${hasWon ? 'bg-green-500' : 'bg-gray-400'}`}>
                            {hasWon ? '🎉 당첨!' : '참여 완료'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#2a2620] mb-2 text-base">
                        {event.title}
                      </h3>
                      <p className="text-xs text-[#555] leading-relaxed mb-3">
                        {event.description}
                      </p>
                      
                      <div className="space-y-1.5 text-[10px] text-[#8b8278] bg-white/80 rounded p-2.5 mb-3">
                        <div className="flex items-center justify-between">
                          <span>기간</span>
                          <span className="font-medium">{event.start_date} ~ {event.end_date}</span>
                        </div>
                        {event.event_type === 'COUPON' && event.coupon_code && (
                          <div className="flex items-center justify-between">
                            <span>쿠폰 코드</span>
                            <span className="font-mono font-bold text-[#c9a961]">{event.coupon_code}</span>
                          </div>
                        )}
                        {event.discount_rate > 0 && (
                          <div className="flex items-center justify-between">
                            <span>할인율</span>
                            <span className="font-semibold text-red-500">{event.discount_rate}%</span>
                          </div>
                        )}
                        {event.point_amount > 0 && (
                          <div className="flex items-center justify-between">
                            <span>포인트</span>
                            <span className="font-semibold text-green-500">{event.point_amount}P</span>
                          </div>
                        )}
                        {event.max_participants && (
                          <div className="flex items-center justify-between">
                            <span>참여 제한</span>
                            <span>{event.max_participants}명</span>
                          </div>
                        )}
                        {event.win_probability < 100 && (
                          <div className="flex items-center justify-between">
                            <span>당첨 확률</span>
                            <span className="font-semibold text-orange-500">{event.win_probability}%</span>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleParticipate(event)}
                        disabled={hasParticipated || loading[event.id]}
                        className={`w-full py-2 text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 ${
                          hasParticipated 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : loading[event.id]
                            ? 'bg-[#c9a961]/50 text-white cursor-wait'
                            : 'bg-[#c9a961] text-white hover:bg-[#b89851]'
                        }`}
                      >
                        {loading[event.id] ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            처리 중...
                          </>
                        ) : hasParticipated ? (
                          '참여 완료'
                        ) : (
                          '참여하기'
                        )}
                      </button>
                    </div>
                  );
                })}

                {events.length === 0 && (
                  <div className="text-center py-20 text-[#8b8278]">
                    <Gift size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm italic">진행 중인 이벤트가 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeResultModal}
          />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-scale-in">
            <div className="text-center">
              <div className="mb-6">
                {resultData.won ? (
                  <PartyPopper size={64} className="mx-auto text-[#c9a961] animate-bounce" />
                ) : (
                  <Frown size={64} className="mx-auto text-gray-400" />
                )}
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${resultData.won ? 'text-[#c9a961]' : 'text-gray-600'}`}>
                {resultData.won ? '축하합니다! 🎉' : '아쉽네요 😢'}
              </h3>
              <p className="text-[#555] mb-2 leading-relaxed">
                {resultData.message}
              </p>
              {resultData.won && (
                <div className="mt-4 p-4 bg-[#faf8f3] rounded-lg">
                  <p className="text-sm text-[#2a2620] mb-2">
                    <strong>당첨 혜택:</strong>
                  </p>
                  {resultData.event.event_type === 'COUPON' && (
                    <p className="text-xs text-[#555]">
                      쿠폰 코드: <span className="font-mono font-bold text-[#c9a961]">{resultData.event.coupon_code}</span>
                    </p>
                  )}
                  {resultData.event.event_type === 'DISCOUNT' && (
                    <p className="text-xs text-[#555]">
                      할인율: <span className="font-bold text-red-500">{resultData.event.discount_rate}%</span>
                    </p>
                  )}
                  {resultData.event.event_type === 'POINT' && (
                    <p className="text-xs text-[#555]">
                      포인트: <span className="font-bold text-green-500">{resultData.event.point_amount}P</span>
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={closeResultModal}
                className="mt-6 px-8 py-3 bg-[#c9a961] text-white text-sm tracking-wider hover:bg-[#b89851] transition-all rounded-lg"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPanel;