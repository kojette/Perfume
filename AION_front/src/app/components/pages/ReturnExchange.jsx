import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Ornament } from '../Ornament';
import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const REQUEST_TYPES = [
    { value: 'RETURN',   label: '반품 (환불)' },
    { value: 'EXCHANGE', label: '교환 (재발송)' },
];

const REASONS = [
    { value: 'DEFECTIVE',        label: '상품 불량/파손' },
    { value: 'WRONG_ITEM',       label: '오배송 (다른 상품 도착)' },
    { value: 'CHANGE_OF_MIND',   label: '단순 변심' },
    { value: 'SIZE_COLOR_ISSUE', label: '색상/용량 불만족' },
    { value: 'LATE_DELIVERY',    label: '배송 지연' },
    { value: 'OTHER',            label: '기타' },
];

const ReturnExchange = () => {
    const { id } = useParams();         // orderId
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [selectedItemId, setSelectedItemId] = useState(searchParams.get('itemId') || '');
    const [requestType, setRequestType] = useState('RETURN');
    const [reason, setReason] = useState('');
    const [detailReason, setDetailReason] = useState('');

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const token = sessionStorage.getItem('accessToken');
            if (!token) { navigate('/login'); return; }

            const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setOrder(json.data);
                // 단일 상품이면 자동 선택
                if (json.data.orderItems?.length === 1 && !selectedItemId) {
                    setSelectedItemId(String(json.data.orderItems[0].orderItemId));
                }
            }
        } catch (e) {
            console.error('주문 조회 오류:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedItemId) { alert('상품을 선택해주세요.'); return; }
        if (!reason) { alert('사유를 선택해주세요.'); return; }

        setSubmitting(true);
        try {
            const token = sessionStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_URL}/api/orders/return-exchange`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderItemId: parseInt(selectedItemId),
                    requestType,
                    reason,
                    detailReason: detailReason.trim() || null,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const err = await res.json();
                alert(err.message || '신청 중 오류가 발생했습니다.');
            }
        } catch (e) {
            console.error('신청 오류:', e);
            alert('서버 통신 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#c9a961] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6 flex flex-col items-center justify-center">
            <div className="max-w-lg w-full bg-white border border-[#c9a961]/20 p-12 shadow-sm text-center">
                <div className="w-16 h-16 bg-[#c9a961]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-[#c9a961]" size={32} />
                </div>
                <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-2 italic uppercase">Request Submitted</div>
                <Ornament className="mb-6" />
                <h2 className="text-2xl font-display tracking-[0.2em] text-[#2a2620] mb-4">
                    {requestType === 'RETURN' ? '반품 신청' : '교환 신청'} 완료
                </h2>
                <p className="text-sm text-[#8b8278] leading-relaxed mb-8">
                    신청이 접수되었습니다.<br />
                    영업일 기준 1~3일 내로 담당자가 연락드립니다.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/mypage')}
                        className="w-full py-4 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all uppercase"
                    >
                        마이페이지로
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 border border-[#c9a961]/30 text-[#8b8278] text-[10px] tracking-[0.3em] hover:bg-[#faf8f3] transition-all uppercase"
                    >
                        홈으로
                    </button>
                </div>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
            <p className="text-[#8b8278]">주문 정보를 찾을 수 없습니다.</p>
        </div>
    );

    // 반품/교환 불가 상태
    const nonRefundableStatuses = ['CANCELLED', 'PENDING'];
    const isBlocked = nonRefundableStatuses.includes(order.orderStatus);

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6">
            <div className="max-w-2xl mx-auto">

                <div className="text-center mb-12">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">CUSTOMER SERVICE</div>
                    <Ornament className="mb-6" />
                    <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] uppercase">반품 / 교환 신청</h1>
                    <p className="text-[10px] text-[#8b8278] tracking-widest mt-2">NO. {order.orderNumber}</p>
                </div>

                {isBlocked ? (
                    <div className="bg-amber-50 border border-amber-200 p-6 text-center">
                        <AlertCircle className="mx-auto mb-3 text-amber-500" size={28} />
                        <p className="text-amber-700 font-medium text-sm">현재 주문 상태에서는 반품/교환 신청이 불가합니다.</p>
                        <p className="text-amber-500 text-xs mt-1">배송 출발 이후 신청 가능합니다.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-[#c9a961]/20 p-8 shadow-sm space-y-8">

                        {/* 신청 유형 */}
                        <div>
                            <label className="block text-[10px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase font-bold">신청 유형</label>
                            <div className="grid grid-cols-2 gap-3">
                                {REQUEST_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setRequestType(t.value)}
                                        className={`py-3 text-sm border transition-all ${
                                            requestType === t.value
                                                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                                                : 'border-[#c9a961]/30 text-[#555] hover:border-[#c9a961]'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 상품 선택 */}
                        <div>
                            <label className="block text-[10px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase font-bold">신청 상품 선택</label>
                            <div className="space-y-3">
                                {(order.orderItems || []).map(item => (
                                    <label
                                        key={item.orderItemId}
                                        className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                                            selectedItemId === String(item.orderItemId)
                                                ? 'border-[#c9a961] bg-[#faf8f3]'
                                                : 'border-[#eee] hover:border-[#c9a961]/50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="orderItem"
                                            value={item.orderItemId}
                                            checked={selectedItemId === String(item.orderItemId)}
                                            onChange={() => setSelectedItemId(String(item.orderItemId))}
                                            className="accent-[#c9a961]"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[#2a2620]">{item.perfumeNameSnapshot || item.name}</p>
                                            <p className="text-[10px] text-[#8b8278] mt-0.5">
                                                {item.volumeMl}ml · {item.quantity}개 · ₩{(item.finalPrice || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 사유 선택 */}
                        <div>
                            <label className="block text-[10px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase font-bold">신청 사유</label>
                            <select
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full p-3 border border-[#c9a961]/30 text-sm bg-[#faf8f3] focus:outline-none focus:border-[#c9a961]"
                            >
                                <option value="">사유를 선택해주세요</option>
                                {REASONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* 상세 사유 */}
                        <div>
                            <label className="block text-[10px] tracking-[0.3em] text-[#8b8278] mb-2 uppercase font-bold">
                                상세 내용 <span className="text-[#bbb] font-normal">(선택)</span>
                            </label>
                            <textarea
                                value={detailReason}
                                onChange={e => setDetailReason(e.target.value)}
                                rows={4}
                                maxLength={500}
                                placeholder="추가적으로 전달하고 싶은 내용을 적어주세요."
                                className="w-full p-4 border border-[#c9a961]/30 text-sm bg-[#faf8f3] resize-none focus:outline-none focus:border-[#c9a961]"
                            />
                            <p className="text-right text-[10px] text-[#bbb] mt-1">{detailReason.length}/500</p>
                        </div>

                        {/* 안내 */}
                        <div className="bg-[#faf8f3] border border-[#c9a961]/10 p-4 text-[11px] text-[#8b8278] space-y-1 leading-relaxed">
                            <p className="font-bold text-[#555] mb-2">반품/교환 안내</p>
                            <p>• 단순 변심 반품은 수령 후 7일 이내에 신청 가능합니다.</p>
                            <p>• 상품 불량/오배송의 경우 수령 후 30일 이내 신청 가능합니다.</p>
                            <p>• 개봉 또는 사용된 상품은 반품이 불가합니다.</p>
                            <p>• 교환은 동일 상품(동일 용량)으로만 가능합니다.</p>
                        </div>

                        {/* 제출 버튼 */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-6 py-4 border border-[#c9a961]/30 text-[#8b8278] text-[10px] tracking-widest hover:bg-[#faf8f3] transition-all uppercase"
                            >
                                <ChevronLeft size={12} />
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 py-4 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? '신청 중...' : `${requestType === 'RETURN' ? '반품' : '교환'} 신청하기`}
                            </button>
                        </div>

                    </div>
                )}

                {/* 하단 버튼 */}
                <div className="mt-4">
                    <button
                        onClick={() => navigate('/mypage')}
                        className="w-full py-4 border border-[#c9a961]/20 text-[#8b8278] text-[10px] tracking-widest hover:bg-white transition-all uppercase"
                    >
                        마이페이지로 돌아가기
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReturnExchange;
