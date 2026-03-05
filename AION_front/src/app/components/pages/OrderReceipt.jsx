import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Ornament } from '../Ornament';

const OrderReceipt = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

    useEffect(() => {
        if (id) fetchOrderDetail();
    }, [id]);

    const fetchOrderDetail = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const json = await response.json();
                const orderData = json.data;

                // Supabase에서 상품 이미지 조회
                const perfumeIds = orderData.orderItems?.map(item => item.perfumeId) || [];
                if (perfumeIds.length > 0) {
                    const { data: images } = await supabase
                        .from('Perfume_Images')
                        .select('perfume_id, image_url')
                        .in('perfume_id', perfumeIds)
                        .eq('is_thumbnail', true);

                    const imageMap = {};
                    images?.forEach(img => { imageMap[img.perfume_id] = img.image_url; });

                    orderData.orderItems = orderData.orderItems.map(item => ({
                        ...item,
                        imageUrl: imageMap[item.perfumeId] || null
                    }));
                }

                setOrder(orderData);
            }
        } catch (error) {
            console.error('주문 상세 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return <div className="text-center pt-40 italic tracking-widest">ISSUING RECEIPT...</div>;
    if (!order)
        return <div className="text-center pt-40">주문 정보를 찾을 수 없습니다.</div>;

    // 백엔드 응답 필드명에 맞게 매핑
    const pointsEarned = order.pointsEarned ?? Math.floor((order.finalAmount || 0) * 0.001);
    const pointsUsed = order.pointsUsed ?? 0;
    const originalAmount = order.totalAmount ?? order.finalAmount ?? 0;  // totalAmount가 원가
    const discountAmount = order.discountAmount ?? 0;

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white border border-[#c9a961]/30 p-12 shadow-sm relative">

                {/* 상단 헤더 */}
                <div className="text-center mb-12">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">ORDER CONFIRMED</div>
                    <h2 className="text-3xl font-display tracking-[0.3em] text-[#1a1a1a] mb-2 uppercase italic">Receipt</h2>
                    <p className="text-[10px] text-[#8b8278] tracking-widest uppercase">NO. {order.orderNumber || order.orderId}</p>
                    <Ornament className="mt-8" />
                </div>

                {/* 배송 정보 */}
                <div className="mb-12 bg-[#fcfbf9] p-6 border-l-2 border-[#c9a961]">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase font-bold">Shipping Info</h3>
                    <div className="space-y-2">
                        <div className="flex text-xs">
                            <span className="w-20 text-[#8b8278]">Recipient</span>
                            <span className="text-[#1a1a1a] font-medium">{order.receiverName}</span>
                        </div>
                        <div className="flex text-xs">
                            <span className="w-20 text-[#8b8278]">Contact</span>
                            <span className="text-[#1a1a1a] font-medium">{order.receiverPhone}</span>
                        </div>
                        <div className="flex text-xs leading-relaxed">
                            <span className="w-20 text-[#8b8278]">Address</span>
                            <span className="flex-1 text-[#1a1a1a] font-medium">
                                ({order.shippingZipcode}) {order.shippingAddress}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 주문 상품 리스트 */}
                <div className="space-y-6 mb-10">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#8b8278] mb-2 uppercase font-bold">Items</h3>
                    {(order.orderItems || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-6 pb-6 border-b border-[#eee] last:border-0">
                            <div
                                className="w-20 h-24 bg-gray-50 bg-cover bg-center border border-[#eee]"
                                style={{ backgroundImage: `url(${item.imageUrl || 'https://via.placeholder.com/100'})` }}
                            ></div>
                            <div className="flex-1">
                                <p className="font-serif text-lg text-[#1a1a1a] mb-1">{item.perfumeNameSnapshot || item.name}</p>
                                <p className="text-[10px] text-[#8b8278] tracking-widest uppercase italic">
                                    50ML / {item.quantity} Unit(s)
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[#1a1a1a]">₩{(item.finalPrice || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 결제 금액 상세 */}
                <div className="border-t border-[#eee] pt-6 mb-2 space-y-3">
                    <div className="flex justify-between text-[11px] tracking-widest text-[#8b8278]">
                        <span>SUBTOTAL</span>
                        <span>₩{originalAmount.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-[11px] tracking-widest text-red-400">
                            <span>COUPON DISCOUNT</span>
                            <span>- ₩{discountAmount.toLocaleString()}</span>
                        </div>
                    )}
                    {pointsUsed > 0 && (
                        <div className="flex justify-between text-[11px] tracking-widest text-red-400">
                            <span>POINTS USED</span>
                            <span>- {pointsUsed.toLocaleString()}P</span>
                        </div>
                    )}
                </div>

                {/* 최종 결제 금액 */}
                <div className="border-t-2 border-[#1a1a1a] pt-6 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="font-serif italic text-[#c9a961] tracking-tighter text-xl">Total Amount</span>
                        <span className="text-2xl font-display tracking-tight font-bold">
                            ₩{(order.finalAmount || 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* 포인트 요약 */}
                <div className="bg-[#fcfbf9] border border-[#c9a961]/20 p-5 mb-10 space-y-2">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#8b8278] mb-3 uppercase font-bold">Points Summary</h3>
                    {pointsUsed > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-[#8b8278]">사용 포인트</span>
                            <span className="text-red-400 font-medium">- {pointsUsed.toLocaleString()}P</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs">
                        <span className="text-[#8b8278]">이번 주문 적립 (0.1%)</span>
                        <span className="text-[#c9a961] font-medium">+ {pointsEarned.toLocaleString()}P</span>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-5 bg-[#1a1a1a] text-white text-[10px] tracking-[0.4em] hover:bg-[#c9a961] transition-all duration-500 cursor-pointer uppercase"
                >
                    Continue Shopping
                </button>

                <div className="mt-12 text-center text-[10px] text-[#eee] tracking-[1em]">••••••••••••••••••••</div>
            </div>
        </div>
    );
};

export default OrderReceipt;