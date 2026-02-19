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
    const [discountPrice, setDiscountPrice] = useState(0);

    const API_BASE_URL = 'http://localhost:8080';

    useEffect(() => {
        fetchCartItems();
        fetchAvailableCoupons();
    }, []);

    // 1. 사용 가능한 쿠폰 가져오기
    const fetchAvailableCoupons = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/coupons/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                // 사용하지 않은 쿠폰만 필터링
                setAvailableCoupons(result.data.filter(c => !c.isUsed));
            }
        } catch (error) {
            console.error("쿠폰 로드 에러:", error);
        }
    };

    // 2. 장바구니 아이템 조회
    const fetchCartItems = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            if (!token) {
                alert("로그인이 필요합니다.");
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/cart`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json',
                },
            });

            if (response.ok) {
                const json = await response.json();
                let items = json.data;

                if (items && items.length > 0) {
                    const perfumeIds = items.map(item => item.perfumeId);
                    const { data: images } = await supabase
                        .from('Perfume_Images')
                        .select('perfume_id, image_url')
                        .in('perfume_id', perfumeIds)
                        .eq('is_thumbnail', true);

                    const imageMap = {};
                    images?.forEach(img => {
                        imageMap[img.perfume_id] = img.image_url;
                    });

                    items = items.map(item => ({
                        ...item,
                        imageUrl: imageMap[item.perfumeId] || item.imageUrl || 'https://via.placeholder.com/100?text=No+Image'
                    }));
                }

                setCartItems(items);
                const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setTotalPrice(total);
            }
        } catch (error) {
            console.error("에러 발생:", error);
        } finally {
            setLoading(false);
        }
    };

    // 3. 쿠폰 선택 시 할인액 계산
    const handleCouponChange = (e) => {
        const userCouponId = e.target.value;
        if (!userCouponId) {
            setSelectedCoupon(null);
            setDiscountPrice(0);
            return;
        }

        const coupon = availableCoupons.find(c => c.userCouponId === parseInt(userCouponId));
        setSelectedCoupon(coupon);

        let calculatedDiscount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            calculatedDiscount = totalPrice * (coupon.discountValue / 100);
        } else {
            calculatedDiscount = coupon.discountValue;
        }
        setDiscountPrice(calculatedDiscount);
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
                const total = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setTotalPrice(total);
                // 수량 변경 시 쿠폰 할인액 재계산 필요하면 여기서 처리
            }
        } catch (error) {
            console.error("에러 발생:", error);
        }
    };

    const handleCheckout = async () => {
        if (!window.confirm("선택하신 쿠폰을 적용하여 결제를 진행하시겠습니까?")) return;

        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userCouponId: selectedCoupon?.userCouponId || null
                }),
            });

            if (response.ok) {
                const json = await response.json();
                const newOrderId = json.data.orderId;
                if (newOrderId) {
                    alert("주문이 성공적으로 완료되었습니다.");
                    navigate(`/orders/${newOrderId}`);
                }
            } else {
                alert("주문 처리 중 문제가 발생하였습니다.");
            }
        } catch (error) {
            console.error("주문 에러:", error);
        }
    };

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
                                                    <div className="w-16 h-20 bg-gray-100 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }}></div>
                                                    <div>
                                                        <p className="text-[#1a1a1a] font-serif text-lg">{item.name}</p>
                                                        <p className="text-[9px] text-[#c9a961] tracking-widest mt-1 uppercase">Eau De Parfum</p>
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

                        {/* 쿠폰 선택 구역 */}
                        <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <h3 className="text-[10px] tracking-[0.2em] font-bold text-[#2a2620] mb-4 uppercase">Select a Coupon</h3>
                                    <select 
                                        onChange={handleCouponChange}
                                        className="w-full max-w-md p-3 border border-[#c9a961]/20 text-[11px] focus:outline-none bg-[#faf8f3]"
                                    >
                                        <option value="">적용 가능한 쿠폰을 선택해 주세요</option>
                                        {availableCoupons.map(c => (
                                            <option key={c.userCouponId} value={c.userCouponId}>
                                                [{c.couponCode}] {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}원`} 할인
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* 요약 정보 */}
                                <div className="w-full md:w-64 space-y-3 pt-6 md:pt-0">
                                    <div className="flex justify-between text-[11px] tracking-widest text-[#8b8278]">
                                        <span>SUBTOTAL</span>
                                        <span>₩{totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] tracking-widest text-red-400">
                                        <span>DISCOUNT</span>
                                        <span>- ₩{discountPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="h-[1px] bg-[#c9a961]/20 my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-serif italic text-[#c9a961]">Total</span>
                                        <span className="text-xl font-bold text-[#1a1a1a]">₩{(totalPrice - discountPrice).toLocaleString()}</span>
                                    </div>
                                    <button 
                                        onClick={handleCheckout}
                                        className="w-full mt-6 py-4 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all font-bold uppercase"
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