import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Droplets, Megaphone, Calendar, Ticket, BarChart2, BookOpen, Package } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const menuItems = [
        { title: '고객 관리',        icon: <Users />,     path: '/admin/support'       },
        { title: '향수 데이터 수정',  icon: <Droplets />,  path: '/admin/perfumes'      },
        { title: '공지사항 관리',     icon: <Megaphone />, path: '/admin/announcements' },
        { title: '이벤트 관리',       icon: <Calendar />,  path: '/admin/events'        },
        { title: '쿠폰/포인트 관리',  icon: <Ticket />,    path: '/admin/coupons'       },
        { title: '스토리 관리',       icon: <BookOpen />,  path: '/admin/story'         },
        { title: '공병 관리',         icon: <Package />,   path: '/admin/bottles'       },
    ];

    return (
        <div className="min-h-screen bg-[#faf8f3] p-10">
            <h1 className="text-2xl font-bold text-[#2a2620] mb-8 tracking-widest">ADMIN DASHBOARD</h1>

            {/* 통계 카드 — 상단 강조 */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/statistics')}
                    className="w-full flex items-center gap-5 px-8 py-6 rounded-2xl shadow-md hover:shadow-lg transition-all group border-2"
                    style={{
                        background: 'linear-gradient(135deg, #0e1610 0%, #1b271d 60%, #243022 100%)',
                        borderColor: '#1b271d',
                    }}
                >
                    <div className="p-3.5 rounded-2xl bg-white/20 group-hover:scale-110 transition-transform">
                        <BarChart2 size={28} className="text-white" />
                    </div>
                    <div className="text-left">
                        <div className="text-white font-bold text-lg tracking-widest">통계 대시보드</div>
                        <div className="text-[#7a9e84] text-xs mt-0.5 tracking-wide">
                            매출 · 향수 분석 · 조향 트렌드 · 고객 세그먼트 · 전환율
                        </div>
                    </div>
                    <div className="ml-auto font-bold text-[#7a9e84] text-xl">→</div>
                </button>
            </div>

            {/* 나머지 관리 메뉴 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="flex flex-col items-center justify-center p-8 bg-white border border-[#c9a961]/20 rounded-lg shadow-sm hover:shadow-md transition-all group"
                    >
                        <div
                            className="p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: '#1b271d' }}
                        >
                            <span style={{ color: '#ffffff' }}>{item.icon}</span>
                        </div>
                        <span className="font-semibold text-[#2a2620]">{item.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;