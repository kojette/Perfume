import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Ornament } from '../Ornament';

const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);

    // 쿠폰 관련 상태
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);

    // 포인트 관련 상태
    const [myTotalPoints, setMyTotalPoints] = useState(0);
    const [pointsInput, setPointsInput] = useState('');
    const [pointsToUse, setPointsToUse] = useState(0);

    // 배송지 상태 (프로필에서 불러옴)
    const [shippingInfo, setShippingInfo] = useState({
        zipcode: '',
        address: '',
        addressDetail: '',
        name: '',
        phone: '',
    });
    const [shippingLoaded, setShippingLoaded] = useState(false);

    // 인라인 배송지 수정 상태
    const [isEditingShipping, setIsEditingShipping] = useState(false);
    const [tempShipping, setTempShipping] = useState({
        zipcode: '', address: '', addressDetail: '', name: '', phone: '',
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

    useEffect(() => {
        fetchCartItems();
        fetchAvailableCoupons();
        fetchMyPoints();
        fetchShippingInfo();
    }, []);

    // 프로필에서 배송지 정보 불러오기
    const fetchShippingInfo = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/members/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const info = {
                        zipcode: result.data.zipcode || '',
                        address: result.data.address || '',
                        addressDetail: result.data.addressDetail || '',
                        name: result.data.name || '',
                        phone: result.data.phone || '',
                    };
                    setShippingInfo(info);
                    setTempShipping(info);
                    setShippingLoaded(true);
                }
            }
        } catch (error) {
            console.error('배송지 조회 에러:', error);
        }
    };

    // 보유 포인트 조회
    const fetchMyPoints = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/points/balance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                setMyTotalPoints(result.data?.totalPoints || 0);
            }
        } catch (error) {
            console.error('포인트 조회 에러:', error);
        }
    };

    // 사용 가능한 쿠폰 조회
    const fetchAvailableCoupons = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/coupons/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                setAvailableCoupons(result.data.filter(c => !c.isUsed));
            }
        } catch (error) {
            console.error('쿠폰 로드 에러:', error);
        }
    };

    // 장바구니 아이템 조회
    const fetchCartItems = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            if (!token) {
                alert('로그인이 필요합니다.');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const json = await response.json();
                let items = json.data;

                if (items && items.length > 0) {
                    const normalItems = items.filter(item => !item.isCustom && item.perfumeId);
                    let imageMap = {};

                    if (normalItems.length > 0) {
                        const perfumeIds = normalItems.map(item => item.perfumeId);
                        const { data: images } = await supabase
                            .from('Perfume_Images')
                            .select('perfume_id, image_url')
                            .in('perfume_id', perfumeIds)
                            .eq('is_thumbnail', true);

                        images?.forEach(img => { imageMap[img.perfume_id] = img.image_url; });
                    }

                    items = items.map(item => ({
                        ...item,
                        imageUrl: item.isCustom
                            ? (item.imageUrl || null)
                            : (imageMap[item.perfumeId] || null)
                    }));
                }

                setCartItems(items);
                const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setTotalPrice(total);
            }
        } catch (error) {
            console.error('장바구니 조회 에러:', error);
        } finally {
            setLoading(false);
        }
    };

    // 쿠폰 선택
    const handleCouponChange = (e) => {
        const userCouponId = e.target.value;
        if (!userCouponId) {
            setSelectedCoupon(null);
            setCouponDiscount(0);
            return;
        }
        const coupon = availableCoupons.find(c => c.userCouponId === parseInt(userCouponId));
        setSelectedCoupon(coupon);

        let discount = 0;
        if (coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'PERCENT') {
            discount = Math.floor(totalPrice * (coupon.discountValue / 100));
        } else {
            discount = coupon.discountValue;
        }
        setCouponDiscount(discount);
    };

    // 포인트 입력 처리
    const handlePointsInput = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        setPointsInput(raw);

        const parsed = parseInt(raw) || 0;
        const maxUsable = Math.min(myTotalPoints, Math.max(0, totalPrice - couponDiscount));
        const actual = Math.min(parsed, maxUsable);
        setPointsToUse(actual);
    };

    const handleUseAllPoints = () => {
        const maxUsable = Math.min(myTotalPoints, Math.max(0, totalPrice - couponDiscount));
        setPointsInput(String(maxUsable));
        setPointsToUse(maxUsable);
    };

    const handleClearPoints = () => {
        setPointsInput('');
        setPointsToUse(0);
    };

    // 수량 변경
    const updateQuantity = async (cartId, currentQuantity, change) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity < 1) return;

        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/cart/${cartId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity: newQuantity })
            });

            if (response.ok) {
                const updatedItems = cartItems.map(item =>
                    item.cartId === cartId ? { ...item, quantity: newQuantity } : item
                );
                setCartItems(updatedItems);
                const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setTotalPrice(newTotal);

                if (pointsToUse > 0) {
                    const maxUsable = Math.min(myTotalPoints, Math.max(0, newTotal - couponDiscount));
                    if (pointsToUse > maxUsable) {
                        setPointsInput(String(maxUsable));
                        setPointsToUse(maxUsable);
                    }
                }
            }
        } catch (error) {
            console.error('수량 변경 에러:', error);
        }
    };

    // 장바구니 상품 삭제
    const handleRemoveItem = async (cartId) => {
        if (!window.confirm('장바구니에서 이 상품을 삭제하시겠습니까?')) return;

        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/cart/${cartId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const updatedItems = cartItems.filter(item => item.cartId !== cartId);
                setCartItems(updatedItems);

                const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setTotalPrice(newTotal);

                if (pointsToUse > 0) {
                    const maxUsable = Math.min(myTotalPoints, Math.max(0, newTotal - couponDiscount));
                    if (pointsToUse > maxUsable) {
                        setPointsInput(String(maxUsable));
                        setPointsToUse(maxUsable);
                    }
                }
            } else {
                alert('삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('삭제 에러:', error);
        }
    };

    // 결제
    const handleCheckout = async () => {
        // 배송지 검증
        if (!shippingInfo.address) {
            const goToProfile = window.confirm(
                '등록된 배송지가 없습니다.\n프로필에서 배송지를 먼저 등록해주세요.\n\n프로필 페이지로 이동하시겠습니까?'
            );
            if (goToProfile) navigate('/mypage/edit');
            return;
        }

        const finalAmount = Math.max(0, totalPrice - couponDiscount - pointsToUse);
        const fullAddress = `(${shippingInfo.zipcode}) ${shippingInfo.address}${shippingInfo.addressDetail ? ' ' + shippingInfo.addressDetail : ''}`;
        const msg = `결제 금액: ₩${finalAmount.toLocaleString()}\n쿠폰 할인: -₩${couponDiscount.toLocaleString()}\n포인트 사용: -${pointsToUse.toLocaleString()}P\n\n배송지: ${fullAddress}\n\n결제를 진행하시겠습니까?`;
        if (!window.confirm(msg)) return;

        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userCouponId: selectedCoupon?.userCouponId || null,
                    pointsToUse: pointsToUse,
                    // 배송지 정보 포함
                    receiverName: shippingInfo.name,
                    receiverPhone: shippingInfo.phone,
                    shippingZipcode: shippingInfo.zipcode,
                    shippingAddress: shippingInfo.address
                        ? `${shippingInfo.address}${shippingInfo.addressDetail ? ' ' + shippingInfo.addressDetail : ''}`
                        : '',
                }),
            });

            if (response.ok) {
                const json = await response.json();
                const newOrderId = json.data.orderId;
                if (newOrderId) {
                    navigate(`/orders/${newOrderId}`);
                }
            } else {
                const errData = await response.json();
                alert(errData.message || '주문 처리 중 문제가 발생하였습니다.');
            }
        } catch (error) {
            console.error('주문 에러:', error);
            alert('주문 처리 중 오류가 발생했습니다.');
        }
    };

    const finalAmount = Math.max(0, totalPrice - couponDiscount - pointsToUse);
    const estimatedEarn = Math.floor(finalAmount * 0.001);

    if (loading) return <div className="text-center pt-40 italic tracking-widest">PREPARING YOUR BAG...</div>;

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-16">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">YOUR SHOPPING BAG</div>
                    <Ornament className="mb-6" />
                    <h2 className="text-3xl font-serif text-[#1a1a1a]">CART</h2>
                </div>

                {cartItems.length === 0 ? (
                    <div className="text-center py-20 text-[#8b8278] border-t border-b border-[#c9a961]/20">
                        <p className="italic">장바구니가 비어있습니다.</p>
                        <button onClick={() => navigate('/perfumes')} className="mt-8 px-8 py-3 bg-[#1a1a1a] text-white text-xs tracking-widest hover:bg-[#c9a961] transition-colors">SHOP NOW</button>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* 상품 리스트 */}
                        <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#c9a961]/30 text-[10px] tracking-widest text-[#8b8278]">
                                        <th className="pb-4 pl-2 font-normal uppercase">Product</th>
                                        <th className="pb-4 font-normal text-center uppercase">Price</th>
                                        <th className="pb-4 font-normal text-center uppercase">Qty</th>
                                        <th className="pb-4 pr-2 font-normal text-right uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item) => (
                                        <tr key={item.cartId} className="border-b border-[#eee] last:border-0">
                                            <td className="py-6 pl-2">
                                                <div className="flex items-center gap-6">
                                                    <div
                                                        className="w-16 h-20 bg-cover bg-center flex items-center justify-center"
                                                        style={{
                                                            backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                                                            backgroundColor: item.imageUrl ? 'transparent' : '#f5f0e8'
                                                        }}
                                                    >
                                                        {!item.imageUrl && <span className="text-[#c9a961] text-xl">✦</span>}
                                                    </div>
                                                    <div>
                                                        <p className="text-[#1a1a1a] font-serif text-lg">{item.name}</p>
                                                        <p className="text-[9px] text-[#c9a961] tracking-widest mt-1 uppercase">{item.isCustom ? 'Custom Design' : 'Eau De Parfum'}</p>
                                                        <button
                                                            onClick={() => handleRemoveItem(item.cartId)}
                                                            className="text-[9px] text-gray-400 hover:text-red-400 mt-3 tracking-[0.2em] uppercase transition-colors cursor-pointer"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 text-center text-sm font-light">₩{item.price.toLocaleString()}</td>
                                            <td className="py-6 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => updateQuantity(item.cartId, item.quantity, -1)} className="w-5 h-5 border border-[#c9a961]/30 text-[#c9a961] flex items-center justify-center hover:bg-[#c9a961] hover:text-white transition-colors">-</button>
                                                    <span className="text-xs w-4">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.cartId, item.quantity, 1)} className="w-5 h-5 border border-[#c9a961]/30 text-[#c9a961] flex items-center justify-center hover:bg-[#c9a961] hover:text-white transition-colors">+</button>
                                                </div>
                                            </td>
                                            <td className="py-6 pr-2 text-right text-sm font-medium">₩{(item.price * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 배송지 정보 */}
                        <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] tracking-[0.2em] font-bold text-[#2a2620] uppercase">Shipping Address</h3>
                                {!isEditingShipping ? (
                                    <button
                                        onClick={() => {
                                            setTempShipping({ ...shippingInfo });
                                            setIsEditingShipping(true);
                                        }}
                                        className="text-[9px] text-[#c9a961] tracking-widest hover:underline uppercase transition-colors"
                                    >
                                        변경 →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingShipping(false)}
                                        className="text-[9px] text-[#8b8278] tracking-widest hover:underline uppercase transition-colors"
                                    >
                                        취소 ×
                                    </button>
                                )}
                            </div>

                            {/* 보기 모드 */}
                            {!isEditingShipping && (
                                shippingLoaded && shippingInfo.address ? (
                                    <div className="bg-[#fcfbf9] border-l-2 border-[#c9a961] p-4 space-y-1">
                                        <p className="text-xs text-[#1a1a1a] font-medium">{shippingInfo.name} · {shippingInfo.phone}</p>
                                        <p className="text-xs text-[#8b8278]">
                                            ({shippingInfo.zipcode}) {shippingInfo.address}
                                            {shippingInfo.addressDetail && ` ${shippingInfo.addressDetail}`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-[#fcfbf9] border border-dashed border-[#c9a961]/30 p-4 text-center">
                                        <p className="text-xs text-[#8b8278] mb-2">등록된 배송지가 없습니다.</p>
                                        <button
                                            onClick={() => {
                                                setTempShipping({ zipcode: '', address: '', addressDetail: '', name: '', phone: '' });
                                                setIsEditingShipping(true);
                                            }}
                                            className="text-[10px] text-[#c9a961] tracking-widest hover:underline uppercase"
                                        >
                                            + 배송지 직접 입력하기
                                        </button>
                                    </div>
                                )
                            )}

                            {/* 편집 모드 */}
                            {isEditingShipping && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <p className="text-[10px] text-[#c9a961] italic tracking-wide">
                                        * 이번 주문에만 일시적으로 적용됩니다. 프로필 배송지는 변경되지 않습니다.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] tracking-[0.2em] text-[#8b8278] uppercase">수령인</label>
                                            <input
                                                value={tempShipping.name}
                                                onChange={e => setTempShipping(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="수령인 이름"
                                                className="w-full border-b border-[#c9a961]/30 py-2 text-sm outline-none focus:border-[#c9a961] bg-transparent transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] tracking-[0.2em] text-[#8b8278] uppercase">연락처</label>
                                            <input
                                                value={tempShipping.phone}
                                                onChange={e => setTempShipping(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="전화번호 (- 제외)"
                                                className="w-full border-b border-[#c9a961]/30 py-2 text-sm outline-none focus:border-[#c9a961] bg-transparent transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] tracking-[0.2em] text-[#8b8278] uppercase">우편번호</label>
                                        <input
                                            value={tempShipping.zipcode}
                                            onChange={e => setTempShipping(prev => ({ ...prev, zipcode: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) }))}
                                            placeholder="우편번호 (5자리)"
                                            maxLength={5}
                                            className="w-full border-b border-[#c9a961]/30 py-2 text-sm outline-none focus:border-[#c9a961] bg-transparent transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] tracking-[0.2em] text-[#8b8278] uppercase">기본주소</label>
                                        <input
                                            value={tempShipping.address}
                                            onChange={e => setTempShipping(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="시/도, 시/군/구, 도로명"
                                            className="w-full border-b border-[#c9a961]/30 py-2 text-sm outline-none focus:border-[#c9a961] bg-transparent transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] tracking-[0.2em] text-[#8b8278] uppercase">상세주소</label>
                                        <input
                                            value={tempShipping.addressDetail}
                                            onChange={e => setTempShipping(prev => ({ ...prev, addressDetail: e.target.value }))}
                                            placeholder="동/호수 등"
                                            className="w-full border-b border-[#c9a961]/30 py-2 text-sm outline-none focus:border-[#c9a961] bg-transparent transition-colors"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                if (!tempShipping.name.trim()) return alert('수령인을 입력해주세요.');
                                                if (!tempShipping.address.trim()) return alert('주소를 입력해주세요.');
                                                setShippingInfo({ ...tempShipping });
                                                setIsEditingShipping(false);
                                            }}
                                            className="flex-1 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all uppercase"
                                        >
                                            이 주소로 배송
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTempShipping({ ...shippingInfo });
                                                setIsEditingShipping(false);
                                            }}
                                            className="px-6 py-3 border border-[#c9a961]/30 text-[#8b8278] text-[10px] tracking-widest hover:bg-[#faf8f3] transition-all uppercase"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 쿠폰 + 포인트 + 결제 요약 */}
                        <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-10">

                                {/* 왼쪽: 쿠폰 + 포인트 */}
                                <div className="flex-1 space-y-8">

                                    {/* 쿠폰 선택 */}
                                    <div>
                                        <h3 className="text-[10px] tracking-[0.2em] font-bold text-[#2a2620] mb-3 uppercase">Select a Coupon</h3>
                                        <select
                                            onChange={handleCouponChange}
                                            className="w-full p-3 border border-[#c9a961]/20 text-[11px] focus:outline-none bg-[#faf8f3]"
                                        >
                                            <option value="">적용 가능한 쿠폰을 선택해 주세요</option>
                                            {availableCoupons.map(c => (
                                                <option key={c.userCouponId} value={c.userCouponId}>
                                                    [{c.couponCode}]{' '}
                                                    {(c.discountType === 'PERCENTAGE' || c.discountType === 'PERCENT')
                                                        ? `${c.discountValue}%`
                                                        : `${c.discountValue.toLocaleString()}원`} 할인
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 포인트 사용 */}
                                    <div>
                                        <h3 className="text-[10px] tracking-[0.2em] font-bold text-[#2a2620] mb-1 uppercase">Use Points</h3>
                                        <p className="text-[10px] text-[#8b8278] mb-3">
                                            보유 포인트: <span className="font-bold text-[#c9a961]">{myTotalPoints.toLocaleString()}P</span>
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={pointsInput}
                                                onChange={handlePointsInput}
                                                placeholder="사용할 포인트 입력"
                                                className="flex-1 p-3 border border-[#c9a961]/20 text-[11px] focus:outline-none bg-[#faf8f3]"
                                            />
                                            <button
                                                onClick={handleUseAllPoints}
                                                className="px-3 py-2 text-[10px] border border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-white transition-colors tracking-widest whitespace-nowrap"
                                            >
                                                전액 사용
                                            </button>
                                            {pointsToUse > 0 && (
                                                <button
                                                    onClick={handleClearPoints}
                                                    className="px-3 py-2 text-[10px] border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors"
                                                >
                                                    취소
                                                </button>
                                            )}
                                        </div>
                                        {pointsToUse > 0 && (
                                            <p className="text-[10px] text-green-600 mt-2">
                                                ✓ {pointsToUse.toLocaleString()}P 사용 적용됨
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 오른쪽: 결제 요약 */}
                                <div className="w-full md:w-64 space-y-3 border-t md:border-t-0 md:border-l border-[#c9a961]/10 pt-6 md:pt-0 md:pl-10">
                                    <div className="flex justify-between text-[11px] tracking-widest text-[#8b8278]">
                                        <span>SUBTOTAL</span>
                                        <span>₩{totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] tracking-widest text-red-400">
                                        <span>COUPON</span>
                                        <span>- ₩{couponDiscount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] tracking-widest text-red-400">
                                        <span>POINTS</span>
                                        <span>- {pointsToUse.toLocaleString()}P</span>
                                    </div>
                                    <div className="h-[1px] bg-[#c9a961]/20 my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-serif italic text-[#c9a961]">Total</span>
                                        <span className="text-xl font-bold text-[#1a1a1a]">₩{finalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-[#8b8278]">
                                        <span>예상 적립</span>
                                        <span className="text-[#c9a961] font-medium">+ {estimatedEarn.toLocaleString()}P</span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full mt-4 py-4 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all font-bold uppercase"
                                    >
                                        Complete Purchase
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;