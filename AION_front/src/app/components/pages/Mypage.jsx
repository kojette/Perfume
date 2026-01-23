import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';
import { Gift, Coins, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const Mypage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [coupons, setCoupons] = useState([]);
  const [points, setPoints] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [eventParticipations, setEventParticipations] = useState([]);

  const userEmail = localStorage.getItem('userEmail') || '정보 없음';
  const userName = localStorage.getItem('userName') || '고객';

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'points') {
      fetchPoints();
    } else if (activeTab === 'events') {
      fetchEventParticipations();
    }
  }, [activeTab]);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('UserCoupons')
      .select(`
        *,
        coupon:coupon_id (
          id,
          code,
          discount_type,
          discount_value,
          expiry_date
        )
      `)
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // null인 coupon도 포함하여 표시
      setCoupons(data);
    }
  };

  const fetchPoints = async () => {
    const { data, error } = await supabase
      .from('UserPoints')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPoints(data);
      const total = data.reduce((sum, p) => sum + p.points, 0);
      setTotalPoints(total);
    }
  };

  const fetchEventParticipations = async () => {
    const { data, error } = await supabase
      .from('EventParticipations')
      .select(`
        *,
        event:event_id (*)
      `)
      .eq('user_email', userEmail)
      .order('participated_at', { ascending: false });

    if (!error && data) {
      setEventParticipations(data);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    alert("로그아웃 되었습니다.");
    navigate('/');
    window.location.reload();
  };

  const handleDeleteAccount = () => {
    if (window.confirm("정말 탈퇴하시겠습니까?")) {
      localStorage.clear();
      alert("회원 탈퇴가 완료되었습니다.");
      navigate('/');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-16 pb-20 px-10">
      <div className="text-center mb-16">
        <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">MY ACCOUNT</div>
        <Ornament className="mb-6" />
        <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620]">My Account</h1>
      </div>

      <div className="max-w-6xl mx-auto flex gap-16">
        {/* 사이드바 */}
        <aside className="w-64">
          <nav className="flex flex-col gap-1 border-t border-[#c9a961]/20 pt-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-[11px] tracking-[0.2em] text-left border-b border-[#c9a961]/10 transition-colors ${
                activeTab === 'overview' ? 'text-[#2a2620] font-bold' : 'text-[#8b8278] hover:text-[#c9a961]'
              }`}
            >
              OVERVIEW
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`py-3 text-[11px] tracking-[0.2em] text-left border-b border-[#c9a961]/10 transition-colors ${
                activeTab === 'coupons' ? 'text-[#2a2620] font-bold' : 'text-[#8b8278] hover:text-[#c9a961]'
              }`}
            >
              MY COUPONS
            </button>
            <button 
              onClick={() => setActiveTab('points')}
              className={`py-3 text-[11px] tracking-[0.2em] text-left border-b border-[#c9a961]/10 transition-colors ${
                activeTab === 'points' ? 'text-[#2a2620] font-bold' : 'text-[#8b8278] hover:text-[#c9a961]'
              }`}
            >
              MY POINTS
            </button>
            <button 
              onClick={() => setActiveTab('events')}
              className={`py-3 text-[11px] tracking-[0.2em] text-left border-b border-[#c9a961]/10 transition-colors ${
                activeTab === 'events' ? 'text-[#2a2620] font-bold' : 'text-[#8b8278] hover:text-[#c9a961]'
              }`}
            >
              EVENT HISTORY
            </button>
            <button 
              onClick={() => navigate('/profile/edit')}
              className="py-3 text-[11px] tracking-[0.2em] text-[#8b8278] text-left border-b border-[#c9a961]/10 hover:text-[#c9a961] transition-colors"
            >
              ACCOUNT PROFILE
            </button>
            <button className="py-3 text-[11px] tracking-[0.2em] text-[#8b8278] text-left border-b border-[#c9a961]/10 hover:text-[#c9a961] transition-colors">
              ORDER HISTORY
            </button>
            
            <button 
              onClick={handleLogout}
              className="mt-12 w-full py-4 border border-[#c9a961] text-[#c9a961] text-[10px] tracking-[0.2em] hover:bg-[#c9a961] hover:text-white transition-all duration-500 italic"
            >
              SIGN OUT
            </button>

            <button
              onClick={handleDeleteAccount}
              className="mt-4 w-full py-3 text-red-500 text-[10px] tracking-[0.2em] underline"
            >
              DELETE ACCOUNT
            </button>
          </nav>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1">
          <div className="flex items-center gap-6 mb-12">
            <div className="flex-1 h-[1px] bg-[#c9a961]/20"></div>
            <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#c9a961]">
              {activeTab === 'overview' && 'MY DETAILS'}
              {activeTab === 'coupons' && 'MY COUPONS'}
              {activeTab === 'points' && 'MY POINTS'}
              {activeTab === 'events' && 'EVENT HISTORY'}
            </h2>
            <div className="flex-1 h-[1px] bg-[#c9a961]/20"></div>
          </div>

          {/* OVERVIEW 탭 */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-6 bg-white p-8 border border-[#c9a961]/10 shadow-sm">
                <div className="flex justify-between items-end border-b border-[#c9a961]/20 pb-2">
                  <h3 className="text-[11px] font-bold tracking-[0.1em] text-[#2a2620]">PROFILE</h3>
                  <button
                    className="text-[9px] text-[#c9a961] underline italic"
                    onClick={() => navigate('/profile/edit')}
                  >
                    VIEW ALL
                  </button>
                </div>
                <div className="text-[12px] leading-relaxed text-[#555] space-y-2">
                  <p><span className="text-[#8b8278] mr-2">Name:</span> {userName}</p>
                  <p><span className="text-[#8b8278] mr-2">Email:</span> {userEmail}</p>
                </div>
              </div>

              <div className="space-y-6 bg-white p-8 border border-[#c9a961]/10 shadow-sm">
                <div className="flex justify-between items-end border-b border-[#c9a961]/20 pb-2">
                  <h3 className="text-[11px] font-bold tracking-[0.1em] text-[#2a2620]">ORDERS</h3>
                  <button className="text-[9px] text-[#c9a961] underline italic">VIEW ALL</button>
                </div>
                <div className="text-[12px] text-[#8b8278]">
                  <p>최근 주문 내역이 없습니다.</p>
                  <p className="mt-2 underline cursor-pointer text-[#2a2620] font-medium">쇼핑 계속하기</p>
                </div>
              </div>
            </div>
          )}

          {/* 쿠폰함 탭 */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              {coupons.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[#c9a961]/10 rounded-lg">
                  <Gift size={48} className="mx-auto mb-4 text-[#c9a961]/30" />
                  <p className="text-sm text-[#8b8278] italic">보유 중인 쿠폰이 없습니다</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-2 border border-[#c9a961] text-[#c9a961] text-xs tracking-wider hover:bg-[#c9a961] hover:text-white transition-all"
                  >
                    이벤트 참여하러 가기
                  </button>
                </div>
              ) : (
                coupons.map((userCoupon) => (
                  <div
                    key={userCoupon.id}
                    className="bg-white border border-[#c9a961]/20 rounded-lg p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Gift className="w-6 h-6 text-[#c9a961]" />
                          <div>
                            <p className="text-xs text-[#8b8278]">쿠폰 코드</p>
                            <p className="font-mono font-bold text-lg text-[#2a2620]">
                              {userCoupon.coupon?.code || '이벤트 당첨 쿠폰'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-[#555] space-y-1">
                          {userCoupon.coupon && (
                            <>
                              <p>할인: {userCoupon.coupon.discount_type === 'PERCENTAGE' 
                                ? `${userCoupon.coupon.discount_value}%` 
                                : `${userCoupon.coupon.discount_value.toLocaleString()}원`}
                              </p>
                              {userCoupon.coupon.expiry_date && (
                                <p className="flex items-center gap-2">
                                  <Calendar size={12} />
                                  만료일: {userCoupon.coupon.expiry_date}
                                </p>
                              )}
                            </>
                          )}
                          <p className="flex items-center gap-2">
                            <Calendar size={12} />
                            발급일: {new Date(userCoupon.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      {userCoupon.used_at ? (
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                          사용완료
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-[#c9a961] text-white text-xs rounded">
                          사용가능
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 포인트 내역 탭 */}
          {activeTab === 'points' && (
            <div>
              <div className="bg-gradient-to-br from-[#c9a961] to-[#b89851] text-white p-8 rounded-lg mb-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90 mb-2">총 보유 포인트</p>
                    <p className="text-4xl font-bold">{totalPoints.toLocaleString()}P</p>
                  </div>
                  <Coins size={64} className="opacity-20" />
                </div>
              </div>

              <div className="space-y-3">
                {points.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-[#c9a961]/10 rounded-lg">
                    <Coins size={48} className="mx-auto mb-4 text-[#c9a961]/30" />
                    <p className="text-sm text-[#8b8278] italic">포인트 내역이 없습니다</p>
                  </div>
                ) : (
                  points.map((point) => (
                    <div
                      key={point.id}
                      className="bg-white border border-[#c9a961]/20 rounded-lg p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-[#2a2620] mb-1">
                            {point.description || '포인트 적립'}
                          </p>
                          <p className="text-xs text-[#8b8278]">
                            {new Date(point.created_at).toLocaleString('ko-KR')}
                          </p>
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-[9px] rounded">
                            {point.action_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${point.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {point.points > 0 ? '+' : ''}{point.points.toLocaleString()}P
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 이벤트 참여 내역 탭 */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {eventParticipations.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[#c9a961]/10 rounded-lg">
                  <CheckCircle size={48} className="mx-auto mb-4 text-[#c9a961]/30" />
                  <p className="text-sm text-[#8b8278] italic">참여한 이벤트가 없습니다</p>
                </div>
              ) : (
                eventParticipations.map((participation) => (
                  <div
                    key={participation.id}
                    className="bg-white border border-[#c9a961]/20 rounded-lg p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[#2a2620]">
                            {participation.event?.title || '이벤트'}
                          </h3>
                          {participation.won ? (
                            <span className="px-2 py-1 bg-green-500 text-white text-[9px] rounded">
                              🎉 당첨
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-400 text-white text-[9px] rounded">
                              미당첨
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8b8278] mb-2">
                          참여일: {new Date(participation.participated_at).toLocaleString('ko-KR')}
                        </p>
                        {participation.event?.description && (
                          <p className="text-xs text-[#555]">
                            {participation.event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Mypage;