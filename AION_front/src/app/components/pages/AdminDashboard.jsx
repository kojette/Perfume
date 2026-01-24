import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Droplets, Megaphone, Calendar, Ticket, LogOut, BarChart3, Home } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const menuItems = [
        {title: '고객관리', icon: <Users />, path: '/admin/support', color: 'bg-blue-500'},
        {title: '향수 데이터 수정', icon: <Droplets />, path: '/admin/perfumes', color: 'bg-purple-500'},
        {title: '공지사항 관리', icon: <Megaphone />, path: '/admin/announcements', color: 'bg-orange-500'},
        {title: '이벤트 관리', icon: <Calendar />, path: '/admin/events', color: 'bg-green-500'},
        {title: '쿠폰/포인트 관리', icon: <Ticket />, path: '/admin/coupons', color: 'bg-red-500'},
    ];

    return (
        <div className = "min-h-screen bg-[#faf8f3] p-10">
            <h1 className = "text-2xl font-bold text-[#2a2620] mb-8 tracking-widest">ADMIN DASHBOARD</h1>
            <div className = "grid grid-cols-1 md:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <button
                        key = {item.path}
                        onClick = {() => navigate(item.path)}
                        className = "flex flex-col items-center justify-center p-8 bg-white border border-[#c9a961]/20 rounded-lg shadow-sm hover:shadow-md transition-all group">
                            <div className = {`p-4 rounded-full text-white mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>
                            <span className = "font-semibold text-[#2a2620]">{item.title}</span>
                        </button>
                ))}
            </div>

        </div>
    )
}

export default AdminDashboard;