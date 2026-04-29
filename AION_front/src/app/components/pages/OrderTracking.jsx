import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';
import { Package, Truck, CheckCircle, Clock, MapPin, ExternalLink, ChevronLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const STATUS_STEPS = [
    { key: 'PENDING',    label: '주문 접수',   icon: Clock,        desc: '주문이 접수되었습니다.' },
    { key: 'CONFIRMED',  label: '결제 완료',   icon: CheckCircle,  desc: '결제가 확인되었습니다.' },
    { key: 'PREPARING',  label: '상품 준비중', icon: Package,      desc: '상품을 정성껏 준비하고 있습니다.' },
    { key: 'SHIPPED',    label: '배송 출발',   icon: Truck,        desc: '상품이 배송사에 인계되었습니다.' },
    { key: 'DELIVERED',  label: '배송 완료',   icon: MapPin,       desc: '상품이 안전하게 도착했습니다.' },
];

const STATUS_INDEX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.key, i]));

const CARRIER_TRACK_URLS = {
    '대한통운': 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
    'CJ대한통운': 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
    '로젠택배': 'https://www.logen.co.kr/m_tracking/index.php?invc_no=',
    '한진택배': 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnum=',
    '우체국택배': 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=',
    '롯데택배': 'https://www.lotteglogis.com/home/reservation/tracking/index?ItemCode=',
};

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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
            }
        } catch (e) {
            console.error('주문 조회 오류:', e);
        } finally {
            setLoading(false);
        }
    };

    const currentStepIdx = order ? (STATUS_INDEX[order.orderStatus] ?? 0) : 0;

    const getTrackUrl = () => {
        if (!order?.invoiceNumber || !order?.carrier?.carrierName) return null;
        const base = CARRIER_TRACK_URLS[order.carrier.carrierName];
        return base ? base + order.invoiceNumber : null;
    };

    const formatDate = (dt) => {
        if (!dt) return null;
        return new Date(dt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-[#c9a961] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#8b8278] text-xs tracking-widest">LOADING...</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
            <p className="text-[#8b8278]">주문 정보를 찾을 수 없습니다.</p>
        </div>
    );

    const trackUrl = getTrackUrl();

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6">
            <div className="max-w-2xl mx-auto">

                {/* 헤더 */}
                <div className="text-center mb-12">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">SHIPPING STATUS</div>
                    <Ornament className="mb-6" />
                    <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] uppercase">배송 추적</h1>
                    <p className="text-[10px] text-[#8b8278] tracking-widest mt-2">NO. {order.orderNumber}</p>
                </div>

                {/* 취소된 주문 */}
                {order.orderStatus === 'CANCELLED' && (
                    <div className="bg-red-50 border border-red-200 p-6 mb-8 text-center">
                        <p className="text-red-600 font-semibold mb-1">주문이 취소된 상태입니다.</p>
                        {order.cancelReason && <p className="text-red-400 text-xs">{order.cancelReason}</p>}
                    </div>
                )}

                {/* 스텝 타임라인 */}
                {order.orderStatus !== 'CANCELLED' && (
                    <div className="bg-white border border-[#c9a961]/20 p-8 mb-6 shadow-sm">
                        <div className="relative">
                            {/* 연결선 */}
                            <div className="absolute left-5 top-5 bottom-5 w-[2px] bg-[#e8e0d0]" />
                            <div
                                className="absolute left-5 top-5 w-[2px] bg-[#c9a961] transition-all duration-700"
                                style={{ height: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                            />

                            <div className="space-y-8">
                                {STATUS_STEPS.map((step, idx) => {
                                    const Icon = step.icon;
                                    const done = idx <= currentStepIdx;
                                    const current = idx === currentStepIdx;

                                    return (
                                        <div key={step.key} className="flex items-start gap-6 relative">
                                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0 ${
                                                done
                                                    ? 'bg-[#c9a961] border-[#c9a961] shadow-[0_0_12px_rgba(201,169,97,0.3)]'
                                                    : 'bg-white border-[#e8e0d0]'
                                            } ${current ? 'ring-4 ring-[#c9a961]/20' : ''}`}>
                                                <Icon size={16} className={done ? 'text-white' : 'text-[#ccc]'} />
                                            </div>
                                            <div className="pt-2">
                                                <p className={`text-sm font-bold tracking-wider mb-0.5 ${done ? 'text-[#2a2620]' : 'text-[#ccc]'}`}>
                                                    {step.label}
                                                    {current && <span className="ml-2 text-[9px] text-[#c9a961] tracking-widest uppercase">Current</span>}
                                                </p>
                                                <p className={`text-[11px] ${done ? 'text-[#8b8278]' : 'text-[#ddd]'}`}>{step.desc}</p>
                                                {/* 날짜 표시 */}
                                                {step.key === 'PENDING' && order.createdAt && done && (
                                                    <p className="text-[10px] text-[#c9a961] mt-1">{formatDate(order.createdAt)}</p>
                                                )}
                                                {step.key === 'SHIPPED' && order.shippedAt && done && (
                                                    <p className="text-[10px] text-[#c9a961] mt-1">{formatDate(order.shippedAt)}</p>
                                                )}
                                                {step.key === 'DELIVERED' && order.deliveredAt && done && (
                                                    <p className="text-[10px] text-[#c9a961] mt-1">{formatDate(order.deliveredAt)}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 운송장 정보 */}
                {order.invoiceNumber && (
                    <div className="bg-white border border-[#c9a961]/20 p-6 mb-6 shadow-sm">
                        <h3 className="text-[10px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase font-bold">Tracking Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[#8b8278] text-xs">택배사</span>
                                <span className="font-medium text-[#2a2620]">{order.carrier?.carrierName || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#8b8278] text-xs">운송장 번호</span>
                                <span className="font-mono font-bold text-[#2a2620]">{order.invoiceNumber}</span>
                            </div>
                        </div>
                        {trackUrl && (
                            <a
                                href={trackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all uppercase"
                            >
                                <ExternalLink size={12} />
                                택배사 사이트에서 확인
                            </a>
                        )}
                    </div>
                )}

                {/* 배송지 */}
                <div className="bg-white border border-[#c9a961]/20 p-6 mb-8 shadow-sm">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase font-bold">Delivery Address</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex gap-4">
                            <span className="w-16 text-[#8b8278] text-xs shrink-0">수령인</span>
                            <span className="text-[#2a2620] font-medium">{order.receiverName}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="w-16 text-[#8b8278] text-xs shrink-0">연락처</span>
                            <span className="text-[#2a2620] font-medium">{order.receiverPhone}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="w-16 text-[#8b8278] text-xs shrink-0">주소</span>
                            <span className="text-[#2a2620] font-medium flex-1">
                                ({order.shippingZipcode}) {order.shippingAddress}
                            </span>
                        </div>
                        {order.shippingMemo && (
                            <div className="flex gap-4">
                                <span className="w-16 text-[#8b8278] text-xs shrink-0">메모</span>
                                <span className="text-[#2a2620]">{order.shippingMemo}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-4 border border-[#c9a961] text-[#c9a961] text-[10px] tracking-[0.3em] hover:bg-[#c9a961] hover:text-white transition-all uppercase"
                    >
                        <ChevronLeft size={12} />
                        돌아가기
                    </button>
                    <button
                        onClick={() => navigate(`/orders/${id}`)}
                        className="flex-1 py-4 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all uppercase"
                    >
                        영수증 보기
                    </button>
                </div>

            </div>
        </div>
    );
};

export default OrderTracking;
