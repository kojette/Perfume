import React, { useState, useEffect } from 'react';
import { Ornament } from '../Ornament';
import { Plus, Edit2, Trash2, Gift, Coins, Check, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const CouponPointManagement = () => {
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' or 'points'
  const [coupons, setCoupons] = useState([]);
  const [pointRules, setPointRules] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showPointForm, setShowPointForm] = useState(false);
  
  const [couponData, setCouponData] = useState({
    code: '',
    discount_type: 'PERCENTAGE', // PERCENTAGE or FIXED
    discount_value: 0,
    min_purchase: 0,
    max_discount: null,
    expiry_date: '',
    usage_limit: 1,
    is_stackable: false
  });

  const [pointData, setPointData] = useState({
    rule_name: '',
    action_type: 'PURCHASE', // PURCHASE, REVIEW, EVENT
    point_rate: 0.1, // 0.1%
    max_points: 100, // 최대 포인트 비율
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
    fetchPointRules();
  }, []);

  // 쿠폰 목록 불러오기
  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('Coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('쿠폰 로드 에러:', error);
    } else {
      setCoupons(data);
    }
  };

  // 포인트 규칙 불러오기
  const fetchPointRules = async () => {
    const { data, error } = await supabase
      .from('PointRules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('포인트 규칙 로드 에러:', error);
    } else {
      setPointRules(data);
    }
  };

  // 쿠폰 저장
  const handleSaveCoupon = async () => {
    if (!couponData.code) {
      alert('쿠폰 코드를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('Coupons')
        .insert([couponData]);
      
      if (error) throw error;
      alert('쿠폰이 생성되었습니다.');
      resetCouponForm();
      fetchCoupons();
    } catch (error) {
      console.error('쿠폰 저장 에러:', error);
      alert('쿠폰 생성 중 오류가 발생했습니다.');
    }
  };

  // 포인트 규칙 저장
  const handleSavePointRule = async () => {
    if (!pointData.rule_name) {
      alert('규칙 이름을 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('PointRules')
        .insert([pointData]);
      
      if (error) throw error;
      alert('포인트 규칙이 생성되었습니다.');
      resetPointForm();
      fetchPointRules();
    } catch (error) {
      console.error('포인트 규칙 저장 에러:', error);
      alert('포인트 규칙 생성 중 오류가 발생했습니다.');
    }
  };

  // 쿠폰 삭제
  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('Coupons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('삭제 에러:', error);
    } else {
      alert('삭제되었습니다.');
      fetchCoupons();
    }
  };

  // 포인트 규칙 삭제
  const handleDeletePointRule = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('PointRules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('삭제 에러:', error);
    } else {
      alert('삭제되었습니다.');
      fetchPointRules();
    }
  };

  // 포인트 규칙 활성화/비활성화
  const togglePointRule = async (id, currentStatus) => {
    const { error } = await supabase
      .from('PointRules')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('업데이트 에러:', error);
    } else {
      fetchPointRules();
    }
  };

  const resetCouponForm = () => {
    setCouponData({
      code: '',
      discount_type: 'PERCENTAGE',
      discount_value: 0,
      min_purchase: 0,
      max_discount: null,
      expiry_date: '',
      usage_limit: 1,
      is_stackable: false
    });
    setShowCouponForm(false);
  };

  const resetPointForm = () => {
    setPointData({
      rule_name: '',
      action_type: 'PURCHASE',
      point_rate: 0.1,
      max_points: 100,
      is_active: true
    });
    setShowPointForm(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            ADMIN PANEL
          </div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-8">
            쿠폰 & 포인트 관리
          </h1>
          
          {/* 탭 메뉴 */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-8 py-3 text-xs tracking-[0.3em] transition-all ${
                activeTab === 'coupons'
                  ? 'bg-[#c9a961] text-white'
                  : 'bg-white text-[#8b8278] border border-[#c9a961]/20 hover:border-[#c9a961]'
              }`}
            >
              쿠폰 관리
            </button>
            <button
              onClick={() => setActiveTab('points')}
              className={`px-8 py-3 text-xs tracking-[0.3em] transition-all ${
                activeTab === 'points'
                  ? 'bg-[#c9a961] text-white'
                  : 'bg-white text-[#8b8278] border border-[#c9a961]/20 hover:border-[#c9a961]'
              }`}
            >
              포인트 규칙
            </button>
          </div>
        </div>

        {/* 쿠폰 관리 탭 */}
        {activeTab === 'coupons' && (
          <div>
            <button
              onClick={() => setShowCouponForm(!showCouponForm)}
              className="mb-6 px-6 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              새 쿠폰 생성
            </button>

            {showCouponForm && (
              <div className="bg-white p-8 rounded-lg border border-[#c9a961]/20 mb-8 shadow-sm">
                <h3 className="text-lg font-semibold text-[#2a2620] mb-6">새 쿠폰 생성</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">쿠폰 코드</label>
                      <input
                        type="text"
                        value={couponData.code}
                        onChange={(e) => setCouponData({...couponData, code: e.target.value.toUpperCase()})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                        placeholder="예: WELCOME2026"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">할인 유형</label>
                      <select
                        value={couponData.discount_type}
                        onChange={(e) => setCouponData({...couponData, discount_type: e.target.value})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none bg-white"
                      >
                        <option value="PERCENTAGE">퍼센트 할인</option>
                        <option value="FIXED">정액 할인</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">
                        할인 {couponData.discount_type === 'PERCENTAGE' ? '율 (%)' : '금액 (원)'}
                      </label>
                      <input
                        type="number"
                        value={couponData.discount_value}
                        onChange={(e) => setCouponData({...couponData, discount_value: Number(e.target.value)})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">최소 구매 금액</label>
                      <input
                        type="number"
                        value={couponData.min_purchase}
                        onChange={(e) => setCouponData({...couponData, min_purchase: Number(e.target.value)})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">최대 할인 금액</label>
                      <input
                        type="number"
                        value={couponData.max_discount || ''}
                        onChange={(e) => setCouponData({...couponData, max_discount: e.target.value ? Number(e.target.value) : null})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                        placeholder="무제한"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">만료일</label>
                      <input
                        type="date"
                        value={couponData.expiry_date}
                        onChange={(e) => setCouponData({...couponData, expiry_date: e.target.value})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">사용 횟수 제한</label>
                      <input
                        type="number"
                        value={couponData.usage_limit}
                        onChange={(e) => setCouponData({...couponData, usage_limit: Number(e.target.value)})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={couponData.is_stackable}
                        onChange={(e) => setCouponData({...couponData, is_stackable: e.target.checked})}
                        className="w-4 h-4"
                      />
                      다른 쿠폰과 중복 사용 가능
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveCoupon}
                      className="flex-1 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all"
                    >
                      생성 완료
                    </button>
                    <button
                      onClick={resetCouponForm}
                      className="flex-1 py-3 border border-[#c9a961] text-[#c9a961] text-xs tracking-[0.3em] hover:bg-[#faf8f3] transition-all"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 쿠폰 목록 */}
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="bg-white p-6 rounded-lg border border-[#c9a961]/20 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-4 py-1.5 bg-[#c9a961] text-white text-sm font-mono font-bold rounded">
                          {coupon.code}
                        </span>
                        <span className="px-2 py-1 bg-blue-500 text-white text-[9px] rounded">
                          {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}% 할인` : `${coupon.discount_value.toLocaleString()}원 할인`}
                        </span>
                        {coupon.is_stackable && (
                          <span className="px-2 py-1 bg-green-500 text-white text-[9px] rounded">중복 가능</span>
                        )}
                      </div>
                      <div className="text-sm text-[#555] space-y-1">
                        <p>최소 구매: {coupon.min_purchase.toLocaleString()}원</p>
                        {coupon.max_discount && <p>최대 할인: {coupon.max_discount.toLocaleString()}원</p>}
                        <p>만료일: {coupon.expiry_date}</p>
                        <p>사용 횟수: {coupon.usage_limit}회</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {coupons.length === 0 && (
                <div className="text-center py-20 text-[#8b8278]">
                  <Gift size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm italic">등록된 쿠폰이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 포인트 규칙 탭 */}
        {activeTab === 'points' && (
          <div>
            <button
              onClick={() => setShowPointForm(!showPointForm)}
              className="mb-6 px-6 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              새 포인트 규칙 생성
            </button>

            {showPointForm && (
              <div className="bg-white p-8 rounded-lg border border-[#c9a961]/20 mb-8 shadow-sm">
                <h3 className="text-lg font-semibold text-[#2a2620] mb-6">새 포인트 규칙 생성</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">규칙 이름</label>
                    <input
                      type="text"
                      value={pointData.rule_name}
                      onChange={(e) => setPointData({...pointData, rule_name: e.target.value})}
                      className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                      placeholder="예: 구매 시 포인트 적립"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">적용 행동</label>
                    <select
                      value={pointData.action_type}
                      onChange={(e) => setPointData({...pointData, action_type: e.target.value})}
                      className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none bg-white"
                    >
                      <option value="PURCHASE">구매</option>
                      <option value="REVIEW">리뷰 작성</option>
                      <option value="EVENT">이벤트 참여</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">적립 비율 (%)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={pointData.point_rate}
                        onChange={(e) => setPointData({...pointData, point_rate: Number(e.target.value)})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                        min="0"
                        max="100"
                      />
                      <p className="text-[9px] text-[#8b8278] mt-1 italic">
                        * 구매 금액의 {pointData.point_rate}%가 적립됩니다
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">최대 사용 비율 (%)</label>
                      <input
                        type="number"
                        value={pointData.max_points}
                        onChange={(e) => setPointData({...pointData, max_points: Number(e.target.value)})}
                        className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                        min="0"
                        max="100"
                      />
                      <p className="text-[9px] text-[#8b8278] mt-1 italic">
                        * 구매 금액의 최대 {pointData.max_points}%까지 사용 가능
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSavePointRule}
                      className="flex-1 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all"
                    >
                      생성 완료
                    </button>
                    <button
                      onClick={resetPointForm}
                      className="flex-1 py-3 border border-[#c9a961] text-[#c9a961] text-xs tracking-[0.3em] hover:bg-[#faf8f3] transition-all"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 포인트 규칙 목록 */}
            <div className="space-y-3">
              {pointRules.map((rule) => (
                <div key={rule.id} className="bg-white p-6 rounded-lg border border-[#c9a961]/20 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-[#2a2620]">{rule.rule_name}</h3>
                        <span className={`px-2 py-1 text-[9px] rounded ${rule.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                          {rule.is_active ? '활성화' : '비활성화'}
                        </span>
                        <span className="px-2 py-1 bg-blue-500 text-white text-[9px] rounded">
                          {rule.action_type === 'PURCHASE' ? '구매' : rule.action_type === 'REVIEW' ? '리뷰' : '이벤트'}
                        </span>
                      </div>
                      <div className="text-sm text-[#555] space-y-1">
                        <p>적립 비율: {rule.point_rate}%</p>
                        <p>최대 사용 비율: {rule.max_points}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePointRule(rule.id, rule.is_active)}
                        className={`p-2 rounded transition-all ${rule.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={rule.is_active ? '비활성화' : '활성화'}
                      >
                        {rule.is_active ? <X size={18} /> : <Check size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeletePointRule(rule.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pointRules.length === 0 && (
                <div className="text-center py-20 text-[#8b8278]">
                  <Coins size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm italic">등록된 포인트 규칙이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponPointManagement;
