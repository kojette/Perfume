import React, { useState, useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import { Ornament } from '../Ornament';
import { Gift, Coins, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const CouponCard = ({ coupon }) => {
  const isPercentage = coupon.discountType === 'PERCENTAGE';
  const discountValue = coupon.discountValue || 0;

  return (
    <div className={`bg-white border ${coupon.isUsed ? 'border-gray-200' : 'border-[#c9a961]/20'} rounded-lg p-6 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Gift className={`w-6 h-6 ${coupon.isUsed ? 'text-gray-400' : 'text-[#c9a961]'}`} />
            <div>
              <p className="text-xs text-[#8b8278]">쿠폰 코드</p>
              <p className={`font-mono font-bold text-lg ${coupon.isUsed ? 'text-gray-400' : 'text-[#2a2620]'}`}>
                {coupon.couponCode}
              </p>
            </div>
          </div>
          <div className="text-xs text-[#555] space-y-1">
            
            <p className="font-medium">
              혜택: <span className="text-[#c9a961] font-bold">
                {isPercentage 
                  ? `${discountValue}% 할인` 
                  : `${discountValue.toLocaleString()}원 할인`}
              </span>
            </p>
            
            {coupon.expiryDate && (
              <p className="flex items-center gap-2 text-[11px] text-[#8b8278]">
                <Calendar size={12} /> 만료일: {new Date(coupon.expiryDate).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 text-[10px] rounded font-bold ${coupon.isUsed ? 'bg-gray-100 text-gray-500' : 'bg-[#c9a961] text-white'}`}>
          {coupon.isUsed ? '사용완료' : '사용가능'}
        </span>
      </div>
    </div>
  );
};

const Mypage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userInfo, setUserInfo] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [points, setPoints] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [eventParticipations, setEventParticipations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
  const initMypage = async () => {
    await fetchUserProfile(); 
    await fetchCoupons();     
    await fetchOrders();      
  };
  initMypage();
}, []);

  useEffect(() => {
    if (!userInfo) return;
    if (activeTab === 'overview') fetchOrders();
    else if (activeTab === 'coupons') fetchCoupons();
    else if (activeTab === 'points') fetchPoints();
    else if (activeTab === 'events') fetchEventParticipations();
    else if (activeTab === 'orders') fetchOrders();
  }, [activeTab, userInfo]);


  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/members/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('프로필 정보를 불러오는데 실패했습니다.');
      const result = await response.json();
      if (result.success) {
        setUserInfo(result.data);
        setTotalPoints(result.data.totalPoints || 0);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Profile Fetch Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const fetchCoupons = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/coupons/my`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        setCoupons(result.data);
      }
    } catch (error) {
      console.error('쿠폰 조회 중 에러 발생:', error);
    }
  };

  const [couponInput, setCouponInput] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);


  const handleRegisterCoupon = async () => {
    if (!couponInput.trim()) {
      alert('쿠폰 코드를 입력해주세요.');
      return;
    }

    try {
      setRegisterLoading(true);
      const token = sessionStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/api/coupons/register`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ couponCode: couponInput })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('쿠폰이 성공적으로 등록되었습니다!');
        setCouponInput('');
        fetchCoupons();
      } else {
        alert(result.message || '유효하지 않은 쿠폰 코드입니다.');
      }
    } catch (error) {
      console.error('쿠폰 등록 에러:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setRegisterLoading(false);
    }
  };


  const fetchPoints = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/points/history`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        setPoints(result.data || []);
      }
    } catch (error) {
      console.error('포인트 조회 에러: ', error);
    }
  };


  const fetchEventParticipations = async () => {
    const { data, error } = await supabase
      .from('EventParticipations')
      .select(`*, event:event_id (*)`)
      .eq('user_email', userInfo?.email)
      .order('participated_at', { ascending: false });
    if (!error && data) setEventParticipations(data);
  };


  const fetchOrders = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/orders/my`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        setOrders(result.data);
      }
    } catch (error) {
      console.error('주문 내역 로드 에러: ', error);
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      sessionStorage.clear();
      localStorage.clear();
      alert('로그아웃 되었습니다.');
      navigate('/');
      window.location.reload();
    }
  };

  const handleWithdrawal = async () => {
    const reason = window.prompt('탈퇴 사유를 입력해주세요. (최소 5자)');
    if (reason === null) return;
    if (reason.trim().length < 5) { alert('탈퇴 사유를 상세히 입력해주세요 (5자 이상).'); return; }
    if (!window.confirm('정말로 탈퇴하시겠습니까? 탈퇴 후 30일간 재가입이 불가능할 수 있습니다.')) return;
    try {
      setLoading(true);
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/members/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        alert('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');
        sessionStorage.clear();
        await supabase.auth.signOut();
        navigate('/');
        window.location.reload();
      } else {
        const errData = await response.json();
        throw new Error(errData.message || '탈퇴 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGenderText = (gender) => {
    if (gender === 'MALE') return '남성';
    if (gender === 'FEMALE') return '여성';
    return '미설정';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#c9a961] mb-4" size={40} />
        <p className="text-[#c9a961] text-xs tracking-widest uppercase">Loading your account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-10">
      <div className="text-center mb-16">
        <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic uppercase">My Account</div>
        <Ornament className="mb-6" />
        <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620]">My Account</h1>
      </div>

      <div className="max-w-6xl mx-auto flex gap-16">
        <aside className="w-48">
          <nav className="flex flex-col gap-1 border-t border-[#c9a961]/20 pt-6">
            {[
              { id: 'overview', label: 'OVERVIEW' },
              { id: 'coupons', label: 'MY COUPONS' },
              { id: 'points', label: 'MY POINTS' },
              { id: 'events', label: 'EVENT HISTORY' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-[11px] tracking-[0.2em] text-left border-b border-[#c9a961]/10 transition-colors cursor-pointer ${
                  activeTab === tab.id ? 'text-[#2a2620] font-bold' : 'text-[#8b8278] hover:text-[#c9a961]'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => navigate('/profile/edit')}
              className="py-3 text-[11px] tracking-[0.2em] text-[#8b8278] text-left border-b border-[#c9a961]/10 hover:text-[#c9a961] transition-colors cursor-pointer"
            >
              ACCOUNT PROFILE
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 text-[11px] tracking-[0.2em] text-left border-b border-[#c9a961]/10 transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'text-[#2a2620] font-bold' : 'text-[#8b8278] hover:text-[#c9a961]'
              }`}
            >
              ORDER HISTORY
            </button>
            <button
              onClick={handleLogout}
              className="mt-12 w-full py-4 border border-[#c9a961] text-[#c9a961] text-[10px] tracking-[0.2em] hover:bg-[#c9a961] hover:text-white transition-all duration-500 cursor-pointer"
            >
              SIGN OUT
            </button>
          </nav>
        </aside>

        <main className="flex-1">
          <div className="flex items-center gap-6 mb-12">
            <div className="flex-1 h-[1px] bg-[#c9a961]/20"></div>
            <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#c9a961] uppercase">
              {activeTab === 'overview' ? 'My Details' : activeTab.replace('_', ' ')}
            </h2>
            <div className="flex-1 h-[1px] bg-[#c9a961]/20"></div>
          </div>

          
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="relative overflow-hidden bg-white border border-[#c9a961]/20 p-10 shadow-sm group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Ornament />
                </div>
                <div className="flex items-center gap-10">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border border-[#c9a961]/30 flex items-center justify-center bg-[#faf8f3] overflow-hidden shadow-inner">
                      {userInfo?.profileImage ? (
                        <img src={userInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-display text-[#c9a961]">
                          {userInfo?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/profile/edit')}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#2a2620] rounded-full flex items-center justify-center text-white border-2 border-white cursor-pointer hover:bg-[#c9a961] transition-colors"
                    >
                      <span className="text-[10px]">EDIT</span>
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-[#c9a961]/10 text-[#c9a961] text-[9px] tracking-widest uppercase">Member Profile</span>
                      <div className="h-[1px] w-12 bg-[#c9a961]/30"></div>
                    </div>
                    <h2 className="text-4xl font-display tracking-tight text-[#2a2620] mb-2">
                      {userInfo?.nickname || userInfo?.name}
                    </h2>
                    <p className="text-[11px] text-[#8b8278] tracking-[0.1em] italic">Welcome back to your curated space.</p>
                  </div>
                  <div className="flex gap-12 border-l border-[#c9a961]/10 pl-12">
                    
                    <div 
                      onClick={() => setActiveTab('points')}
                      className="text-center cursor-pointer transition-transform hover:-translate-y-1"
                    >
                      <p className="text-[9px] text-[#8b8278] tracking-widest mb-1 hover:text-[#c9a961] transition-colors">
                        POINTS
                      </p>
                      <p className="text-lg font-bold text-[#2a2620] hover:text-[#c9a961] transition-colors font-pretendard">
                        {totalPoints.toLocaleString()}P
                      </p>
                    </div>

                    
                    <div 
                      onClick={() => setActiveTab('coupons')}
                      className="text-center cursor-pointer transition-transform hover:-translate-y-1"
                    >
                      <p className="text-[9px] text-[#8b8278] tracking-widest mb-1 hover:text-[#c9a961] transition-colors">
                        COUPONS
                      </p>
                      <p className="text-lg font-bold text-[#2a2620] hover:text-[#c9a961] transition-colors font-pretendard">
                        {coupons.filter(c => !c.isUsed).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                
                <div className="bg-white p-8 border border-[#c9a961]/10 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#c9a961] mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961]"></div>
                    CONTACT DETAILS
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Full Name', value: userInfo?.name },
                      { label: 'Email Address', value: userInfo?.email },
                      { label: 'Phone', value: userInfo?.phone || '-' },
                      { label: 'Gender', value: getGenderText(userInfo?.gender) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center border-b border-[#faf8f3] pb-3">
                        <span className="text-[11px] text-[#8b8278] uppercase">{label}</span>
                        <span className="text-[12px] text-[#2a2620] font-medium  font-pretendard">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                
                <div className="bg-white p-8 border border-[#c9a961]/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#c9a961] mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961]"></div>
                      SHIPPING ADDRESS
                    </h3>
                    {userInfo?.address ? (
                      <div className="space-y-3">
                        <div className="bg-[#fcfbf9] border-l-2 border-[#c9a961] p-4 space-y-1.5">
                          <p className="text-[11px] text-[#8b8278] uppercase tracking-widest">수령인</p>
                          <p className="text-[13px] text-[#2a2620] font-medium">{userInfo?.name}</p>
                          {userInfo?.phone && (
                            <p className="text-[12px] text-[#555]">{userInfo.phone}</p>
                          )}
                        </div>
                        <div className="bg-[#fcfbf9] border-l-2 border-[#c9a961]/40 p-4 space-y-1">
                          {userInfo?.zipcode && (
                            <p className="text-[11px] text-[#8b8278]">({userInfo.zipcode})</p>
                          )}
                          <p className="text-[12px] text-[#2a2620] font-medium leading-relaxed">{userInfo.address}</p>
                          {userInfo?.addressDetail && (
                            <p className="text-[12px] text-[#555]">{userInfo.addressDetail}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-[#c9a961]/30 bg-[#faf8f3]/50 p-6 text-center rounded-sm">
                        <p className="text-[12px] text-[#8b8278] italic leading-relaxed mb-3">
                          등록된 배송지가 없습니다.<br />
                          배송지를 등록하면 주문 시 자동으로 사용됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="mt-6 text-[10px] text-[#2a2620] tracking-[0.4em] uppercase border-b border-[#c9a961]/30 pb-1 w-fit hover:text-[#c9a961] hover:border-[#c9a961] transition-all cursor-pointer font-bold"
                  >
                    {userInfo?.address ? 'Edit Address →' : '+ Register Address →'}
                  </button>
                </div>

                
                <div className="col-span-2 bg-white p-8 border border-[#c9a961]/10 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#2a2620] mb-8 flex items-center gap-2 uppercase">
                      <div className="w-1 h-3 bg-[#c9a961]"></div>
                      ORDER HISTORY
                    </h3>
                    {orders.length === 0 ? (
                      <div className="py-6 text-center border border-dashed border-[#c9a961]/20 bg-[#faf8f3]/50 rounded-sm">
                        <p className="text-[12px] text-[#8b8278] italic leading-relaxed">
                          최근 구매 내역이 없습니다.<br />
                          당신만을 위해 큐레이션된 새로운 컬렉션을 만나보세요.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[
                          { label: 'Order Date', value: new Date(orders[0].createdAt).toLocaleDateString('ko-KR') },
                          { label: 'Order No.', value: orders[0].orderNumber, mono: true },
                          { label: 'Total Amount', value: `₩${orders[0].finalAmount?.toLocaleString()}` },
                        ].map(({ label, value, mono }) => (
                          <div key={label} className="flex justify-between items-center border-b border-[#faf8f3] pb-3">
                            <span className="text-[11px] text-[#8b8278] uppercase">{label}</span>
                            <span className={`text-[12px] text-[#2a2620] font-pretendard font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center border-b border-[#faf8f3] pb-3">
                          <span className="text-[11px] text-[#8b8278] uppercase">Status</span>
                          <span className="text-[10px] text-[#c9a961] bg-[#c9a961]/10 px-2 py-1 rounded tracking-widest uppercase font-bold">
                            {orders[0].orderStatus || 'COMPLETED'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => orders.length === 0 ? navigate('/') : setActiveTab('orders')}
                    className="mt-8 text-[10px] text-[#2a2620] tracking-[0.4em] uppercase border-b border-[#c9a961]/30 pb-1 w-fit hover:text-[#c9a961] hover:border-[#c9a961] transition-all cursor-pointer font-bold"
                  >
                    {orders.length === 0 ? 'Explore Now →' : 'View All Orders →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          
          {activeTab === 'coupons' && (
            <div className="space-y-10 animate-in fade-in duration-700">
              
              
              <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#2a2620] mb-6 flex items-center gap-2 uppercase">
                  <div className="w-1 h-3 bg-[#c9a961]"></div>
                  Register New Coupon
                </h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRegisterCoupon()}
                    placeholder="쿠폰 코드를 입력하세요 (예: WELCOME2026)"
                    className="flex-1 bg-[#faf8f3] border border-[#c9a961]/10 px-4 py-3 text-xs tracking-widest focus:outline-none focus:border-[#c9a961] transition-colors"
                  />
                  <button
                    onClick={handleRegisterCoupon}
                    disabled={registerLoading}
                    className="px-8 py-3 bg-[#2a2620] text-white text-[10px] tracking-[0.2em] font-bold hover:bg-[#c9a961] transition-all duration-300 disabled:opacity-50 cursor-pointer"
                  >
                    {registerLoading ? 'REGISTERING...' : 'REGISTER'}
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-[#8b8278] italic font-light">
                  * 대소문자를 구분하여 정확히 입력해 주세요.
                </p>
              </div>

              
              <div className="space-y-12">
                {coupons.length === 0 ? (
                  
                  <div className="text-center py-20 bg-white border border-[#c9a961]/10 rounded-lg">
                    <Gift size={48} className="mx-auto mb-4 text-[#c9a961]/30" />
                    <p className="text-sm text-[#8b8278] italic">보유 중인 쿠폰이 없습니다</p>
                    <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 border border-[#c9a961] text-[#c9a961] text-xs tracking-wider hover:bg-[#c9a961] hover:text-white transition-all cursor-pointer">
                      이벤트 참여하러 가기
                    </button>
                  </div>
                ) : (
                  
                  <>
                    
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#c9a961] uppercase">Available Coupons</h3>
                        <div className="flex-1 h-[1px] bg-[#c9a961]/10"></div>
                      </div>
                      <div className="space-y-4">
                        {coupons.filter(c => !c.isUsed).length > 0 ? (
                          coupons.filter(c => !c.isUsed).map((userCoupon) => (
                            <CouponCard key={userCoupon.userCouponId} coupon={userCoupon} />
                          ))
                        ) : (
                          <p className="text-[11px] text-[#8b8278] italic py-4 text-center">사용 가능한 쿠폰이 없습니다.</p>
                        )}
                      </div>
                    </section>

                    
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#8b8278] uppercase">Used / Expired</h3>
                        <div className="flex-1 h-[1px] bg-[#c9a961]/10"></div>
                      </div>
                      <div className="space-y-4 opacity-60">
                        {coupons.filter(c => c.isUsed).length > 0 ? (
                          coupons.filter(c => c.isUsed).map((userCoupon) => (
                            <CouponCard key={userCoupon.userCouponId} coupon={userCoupon} />
                          ))
                        ) : (
                          <p className="text-[11px] text-[#8b8278] italic py-4 text-center">사용 완료된 내역이 없습니다.</p>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          )}

          
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
                    <div key={point.pointHistoryId} className="bg-white border border-[#c9a961]/20 rounded-lg p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-[#2a2620] mb-1">{point.reason || '포인트 변동'}</p>
                          {point.reasonDetail && (
                            <p className="text-xs text-[#8b8278] mb-1">{point.reasonDetail}</p>
                          )}
                          <p className="text-xs text-[#8b8278]">
                            {new Date(point.createdAt).toLocaleString('ko-KR')}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-1 text-[9px] rounded uppercase ${
                            point.status === 'AVAILABLE' ? 'bg-green-50 text-green-700' :
                            point.status === 'USED' ? 'bg-gray-100 text-gray-500' :
                            'bg-red-50 text-red-400'
                          }`}>
                            {point.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${point.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {point.amount > 0 ? '+' : ''}{point.amount.toLocaleString()}P
                          </p>
                          <p className="text-xs text-[#8b8278] mt-1">
                            잔액 {point.balanceAfter.toLocaleString()}P
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          
          {activeTab === 'events' && (
            <div className="space-y-4">
              {eventParticipations.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[#c9a961]/10 rounded-lg">
                  <CheckCircle size={48} className="mx-auto mb-4 text-[#c9a961]/30" />
                  <p className="text-sm text-[#8b8278] italic">참여한 이벤트가 없습니다</p>
                </div>
              ) : (
                eventParticipations.map((participation) => (
                  <div key={participation.id} className="bg-white border border-[#c9a961]/20 rounded-lg p-6 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[#2a2620]">{participation.event?.title || '이벤트'}</h3>
                          <span className={`px-2 py-1 text-white text-[9px] rounded ${participation.won ? 'bg-green-500' : 'bg-gray-400'}`}>
                            {participation.won ? '🎉 당첨' : '미당첨'}
                          </span>
                        </div>
                        <p className="text-xs text-[#8b8278] mb-2">참여일: {new Date(participation.participated_at).toLocaleString('ko-KR')}</p>
                        {participation.event?.description && <p className="text-xs text-[#555]">{participation.event.description}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-700">
              {orders.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[#c9a961]/10 rounded-lg">
                  <p className="text-sm text-[#8b8278] italic">주문 내역이 없습니다.</p>
                  <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 border border-[#c9a961] text-[#c9a961] text-xs tracking-wider hover:bg-[#c9a961] hover:text-white transition-all cursor-pointer">
                    쇼핑하러 가기
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.orderId} className="bg-white border border-[#c9a961]/20 rounded-lg p-6 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between border-b border-[#faf8f3] pb-4 mb-4">
                      <div>
                        <p className="text-xs text-[#8b8278] mb-1">
                          {new Date(order.createdAt).toLocaleDateString('ko-KR')} 결제
                        </p>
                        <p className="font-mono font-bold text-sm text-[#2a2620]">{order.orderNumber}</p>
                      </div>
                      <span className="px-3 py-1 bg-[#c9a961]/10 text-[#c9a961] text-[10px] tracking-widest rounded uppercase">
                        {order.orderStatus || 'COMPLETED'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[11px] text-[#8b8278] uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-lg font-bold text-[#2a2620]">₩{order.finalAmount?.toLocaleString()}</p>
                        
                        {(order.pointsUsed > 0 || order.pointsEarned > 0) && (
                          <div className="flex gap-3 mt-1">
                            {order.pointsUsed > 0 && (
                              <span className="text-[10px] text-red-400">-{order.pointsUsed.toLocaleString()}P 사용</span>
                            )}
                            {order.pointsEarned > 0 && (
                              <span className="text-[10px] text-[#c9a961]">+{order.pointsEarned.toLocaleString()}P 적립</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/orders/${order.orderId}`)}
                          className="text-[10px] text-white bg-[#1a1a1a] px-4 py-2 hover:bg-[#c9a961] transition-colors cursor-pointer tracking-widest"
                        >
                          영수증 보기
                        </button>
                        <button
                          onClick={() => toggleOrderDetails(order.orderId)}
                          className="text-[10px] text-[#c9a961] border border-[#c9a961] px-4 py-2 hover:bg-[#c9a961] hover:text-white transition-colors cursor-pointer tracking-widest"
                        >
                          {expandedOrderId === order.orderId ? '닫기 ×' : '상세 보기'}
                        </button>
                      </div>
                    </div>

                    {expandedOrderId === order.orderId && (
                      <div className="mt-6 pt-6 border-t border-dashed border-[#c9a961]/30 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#2a2620] mb-4 flex items-center gap-2">
                          <div className="w-1 h-3 bg-[#c9a961]"></div>
                          SHIPPING DETAILS
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs text-[#555]">
                          <div>
                            <p className="text-[#8b8278] mb-1 uppercase tracking-widest text-[9px]">Receiver</p>
                            <p className="font-medium text-[#2a2620]">{order.receiverName}</p>
                          </div>
                          <div>
                            <p className="text-[#8b8278] mb-1 uppercase tracking-widest text-[9px]">Phone</p>
                            <p className="font-medium text-[#2a2620]">{order.receiverPhone}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[#8b8278] mb-1 uppercase tracking-widest text-[9px]">Address</p>
                            <p className="font-medium text-[#2a2620]">[{order.shippingZipcode}] {order.shippingAddress}</p>
                          </div>
                          <div className="col-span-2 mt-2 pt-2 border-t border-[#faf8f3]">
                            <p className="text-[#8b8278] mb-1 uppercase tracking-widest text-[9px]">Payment Method</p>
                            <p className="font-medium text-[#2a2620]">{order.paymentMethod || 'CARD'}</p>
                          </div>
                        </div>
                      </div>
                    )}
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