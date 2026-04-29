import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Ornament } from '../Ornament';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const Cart = () => {
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);

    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);

    const [myTotalPoints, setMyTotalPoints] = useState(0);
    const [pointsInput, setPointsInput] = useState('');
    const [pointsToUse, setPointsToUse] = useState(0);

    const [shippingInfo, setShippingInfo] = useState({
        zipcode: '',
        address: '',
        addressDetail: '',
        name: '',
        phone: '',
    });
    const [shippingLoaded, setShippingLoaded] = useState(false);

    const [isEditingShipping, setIsEditingShipping] = useState(false);
    const [tempShipping, setTempShipping] = useState({
        zipcode: '', address: '', addressDetail: '', name: '', phone: '',
    });

    const [expandedItems, setExpandedItems] = useState({});
    const toggleExpand = (cartId) => setExpandedItems(prev => ({ ...prev, [cartId]: !prev[cartId] }));

    // 선택 구매
    const [selectedIds, setSelectedIds] = useState(new Set());
    const toggleSelect = (cartId) => setSelectedIds(prev => {
        const next = new Set(prev);
        next.has(cartId) ? next.delete(cartId) : next.add(cartId);
        return next;
    });
    const toggleSelectAll = () => {
        if (selectedIds.size === cartItems.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(cartItems.map(i => i.cartId)));
    };
    const isAllSelected = cartItems.length > 0 && selectedIds.size === cartItems.length;

    // 기본 배송지로 저장 체크박스
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    const isScentBlend = (item) => item.isCustom && item.name?.startsWith('[향조합]');
    const getBlendDisplayName = (item) => item.name?.replace('[향조합] ', '') || item.name;
    const getBlendMeta = (item) => {
        try {
            if (item.imageUrl?.startsWith('__blend__')) {
                return JSON.parse(item.imageUrl.replace('__blend__', ''));
            }
        } catch {}
        return null;
    };

    useEffect(() => {
        fetchCartItems();
        fetchAvailableCoupons();
        fetchMyPoints();
        fetchShippingInfo();
    }, []);

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

    const fetchCartItems = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            if (!token) {
                alert('로그인이 필요한 서비스입니다.');
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
                setSelectedIds(new Set(items.map(i => i.cartId)));
            }
        } catch (error) {
            console.error('장바구니 조회 에러:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleCheckout = async () => {

        if (selectedIds.size === 0) {
            alert('구매할 상품을 선택해주세요.');
            return;
        }

        if (!shippingInfo.address) {
            const goToProfile = window.confirm(
                '등록된 배송지가 없습니다.\n프로필에서 배송지를 먼저 등록해주세요.\n\n프로필 페이지로 이동하시겠습니까?'
            );
            if (goToProfile) navigate('/profile/edit');
            return;
        }

        const selectedTotal = cartItems
            .filter(i => selectedIds.has(i.cartId))
            .reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const finalAmt = Math.max(0, selectedTotal - couponDiscount - pointsToUse);
        const fullAddress = `(${shippingInfo.zipcode}) ${shippingInfo.address}${shippingInfo.addressDetail ? ' ' + shippingInfo.addressDetail : ''}`;
        const msg = `선택 상품: ${selectedIds.size}개\n결제 금액: ₩${finalAmt.toLocaleString()}\n쿠폰 할인: -₩${couponDiscount.toLocaleString()}\n포인트 사용: -${pointsToUse.toLocaleString()}P\n\n배송지: ${fullAddress}\n\n결제를 진행하시겠습니까?`;
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
                    cartItemIds: Array.from(selectedIds),
                    userCouponId: selectedCoupon?.userCouponId || null,
                    pointsToUse: pointsToUse,
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

    const selectedTotal = cartItems
        .filter(i => selectedIds.has(i.cartId))
        .reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const finalAmount = Math.max(0, selectedTotal - couponDiscount - pointsToUse);
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
                        <button onClick={() => navigate('/collections')} className="mt-8 px-8 py-3 bg-[#1a1a1a] text-white text-xs tracking-widest hover:bg-[#c9a961] transition-colors">SHOP NOW</button>
                    </div>
                ) : (
                    <div className="space-y-8">

                        <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f0ebe0]">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 accent-[#c9a961] cursor-pointer"
                                    />
                                    <span className="text-[10px] tracking-[0.2em] text-[#555] uppercase">
                                        전체 선택 ({selectedIds.size}/{cartItems.length})
                                    </span>
                                </label>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#c9a961]/30 text-[10px] tracking-widest text-[#8b8278]">
                                        <th className="pb-4 w-6"></th>
                                        <th className="pb-4 pl-2 font-normal uppercase">Product</th>
                                        <th className="pb-4 font-normal text-center uppercase">Price</th>
                                        <th className="pb-4 font-normal text-center uppercase">Qty</th>
                                        <th className="pb-4 pr-2 font-normal text-right uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item) => (
                                        <tr key={item.cartId} className={`border-b border-[#eee] last:border-0 transition-opacity ${selectedIds.has(item.cartId) ? 'opacity-100' : 'opacity-40'}`}>
                                            <td className="py-6 w-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(item.cartId)}
                                                    onChange={() => toggleSelect(item.cartId)}
                                                    className="w-4 h-4 accent-[#c9a961] cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-6 pl-2">
                                                <div className="flex items-center gap-6">
                                                    <div
                                                        className="w-16 h-20 bg-cover bg-center flex items-center justify-center shrink-0"
                                                        style={{
                                                            backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                                                            backgroundColor: item.imageUrl ? 'transparent' : '#f5f0e8'
                                                        }}
                                                    >
                                                        {!item.imageUrl && <span className="text-[#c9a961] text-xl">✦</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[#1a1a1a] font-serif text-lg">
                                                            {isScentBlend(item) ? getBlendDisplayName(item) : item.name}
                                                        </p>
                                                        <p className="text-[9px] text-[#c9a961] tracking-widest mt-1 uppercase">
                                                            {isScentBlend(item) ? '나만의 향 조합' : item.isCustom ? 'Custom Design' : 'Eau De Parfum'}
                                                        </p>

                                                        {isScentBlend(item) && (
                                                            <div className="mt-2">
                                                                <button
                                                                    onClick={() => toggleExpand(item.cartId)}
                                                                    className="flex items-center gap-1 text-[9px] text-[#8b8278] hover:text-[#c9a961] tracking-widest transition-colors"
                                                                >
                                                                    구성 보기
                                                                    {expandedItems[item.cartId]
                                                                        ? <ChevronUp size={10} />
                                                                        : <ChevronDown size={10} />
                                                                    }
                                                                </button>
                                                                {expandedItems[item.cartId] && (() => {
                                                                    const meta = getBlendMeta(item);
                                                                    return (
                                                                        <div className="mt-2 text-[10px] text-[#8b8278] bg-[#faf8f3] px-3 py-2.5 border-l-2 border-[#c9a961]/40 space-y-1.5">
                                                                            <div className="text-[9px] tracking-wider text-[#c9a961] mb-2 uppercase">Blend Details</div>
                                                                            {meta ? (<>

                                                                                <div>
                                                                                    <span className="text-[#8b8278]/70">향료</span>
                                                                                    <div className="mt-0.5 flex flex-wrap gap-1">
                                                                                        {meta.ingredients?.map((ing, i) => (
                                                                                            <span key={i} className="bg-white border border-[#c9a961]/20 px-1.5 py-0.5 rounded text-[9px] text-[#2a2620]">{ing}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="h-[1px] bg-[#c9a961]/10 my-1" />

                                                                                <div className="flex justify-between"><span className="text-[#8b8278]/70">농도</span><span className="text-[#2a2620]">{meta.concentration}</span></div>
                                                                                <div className="flex justify-between"><span className="text-[#8b8278]/70">용량</span><span className="text-[#2a2620]">{meta.volume}</span></div>
                                                                                <div className="flex justify-between"><span className="text-[#8b8278]/70">병</span><span className="text-[#2a2620]">{meta.bottle}</span></div>
                                                                                <div className="h-[1px] bg-[#c9a961]/10 my-1" />

                                                                                <div className="flex justify-between"><span className="text-[#8b8278]/70">기본 가격</span><span className="text-[#2a2620]">₩{meta.prices?.base?.toLocaleString()}</span></div>
                                                                                {meta.prices?.volume > 0 && <div className="flex justify-between"><span className="text-[#8b8278]/70">추가 용량</span><span className="text-[#2a2620]">+₩{meta.prices?.volume?.toLocaleString()}</span></div>}
                                                                                {meta.prices?.bottle > 0 && <div className="flex justify-between"><span className="text-[#8b8278]/70">커스텀 병</span><span className="text-[#2a2620]">+₩{meta.prices?.bottle?.toLocaleString()}</span></div>}
                                                                            </>) : (
                                                                                <div className="text-[#8b8278]/60 italic text-[9px]">구성 정보를 불러올 수 없습니다.</div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
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
                                            <td className="py-6 pr-2 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span>₩{(item.price * item.quantity).toLocaleString()}</span>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.cartId)}
                                                        className="text-[#c9a961]/40 hover:text-red-400 transition-colors"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

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
                                    {/* 기본 배송지로 저장 */}
                                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                                        <input
                                            type="checkbox"
                                            checked={saveAsDefault}
                                            onChange={e => setSaveAsDefault(e.target.checked)}
                                            className="w-4 h-4 accent-[#c9a961]"
                                        />
                                        <span className="text-[10px] text-[#555] tracking-wider">기본 배송지로 저장</span>
                                    </label>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={async () => {
                                                if (!tempShipping.name.trim()) return alert('수령인을 입력해주세요.');
                                                if (!tempShipping.address.trim()) return alert('주소를 입력해주세요.');
                                                setShippingInfo({ ...tempShipping });
                                                setIsEditingShipping(false);
                                                if (saveAsDefault) {
                                                    try {
                                                        const token = sessionStorage.getItem('accessToken');
                                                        await fetch(`${API_BASE_URL}/api/members/profile`, {
                                                            method: 'PATCH',
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json',
                                                            },
                                                            body: JSON.stringify({
                                                                zipcode:       tempShipping.zipcode,
                                                                address:       tempShipping.address,
                                                                addressDetail: tempShipping.addressDetail,
                                                            }),
                                                        });
                                                    } catch (e) {
                                                        console.error('기본 배송지 저장 실패:', e);
                                                    }
                                                    setSaveAsDefault(false);
                                                }
                                            }}
                                            className="flex-1 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all uppercase"
                                        >
                                            이 주소로 배송
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTempShipping({ ...shippingInfo });
                                                setIsEditingShipping(false);
                                                setSaveAsDefault(false);
                                            }}
                                            className="px-6 py-3 border border-[#c9a961]/30 text-[#8b8278] text-[10px] tracking-widest hover:bg-[#faf8f3] transition-all uppercase"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-10">

                                <div className="flex-1 space-y-8">

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

                                <div className="w-full md:w-64 space-y-3 border-t md:border-t-0 md:border-l border-[#c9a961]/10 pt-6 md:pt-0 md:pl-10">
                                    <div className="flex justify-between text-[11px] tracking-widest text-[#8b8278]">
                                        <span>SUBTOTAL</span>
                                        <span>₩{selectedTotal.toLocaleString()}</span>
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