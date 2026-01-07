import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Ornament} from '../Ornament';

const Mypage = () => {
    const navigate = useNavigate();

    const userEmail = localStorage.getItem('userEmail') || '정보 없음';
    const userName = localStorage.getItem('userName') || '고객';

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        alert("로그아웃 되었습니다.");
        navigate('/');
        window.location.reload();
    };

    const handleDeleteAccount = () => {
        if (window.confirm("정말 탈퇴하시겠습니까?")) {
            localStorage.clear();
            alert("회원 탈퇴가 완료되었습니다.");
            navigate('/');
            window.location.reload();
        }
    };


    return (
        <div className="min-h-screen bg-[#faf8f3] pt-44 pb-20 px-10">
            <div className="text-center mb-16">
                <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">MY ACCOUNT</div>
                <Ornament className="mb-6" />
                <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620]">My Account</h1>
            </div>

            <div className="max-w-6xl mx-auto flex gap-16">
        
                <aside className="w-64">
                    <nav className="flex flex-col gap-1 border-t border-[#c9a961]/20 pt-6">
                        <button className="py-3 text-[11px] tracking-[0.2em] text-[#2a2620] font-bold text-left border-b border-[#c9a961]/10">OVERVIEW</button>
                        <button className="py-3 text-[11px] tracking-[0.2em] text-[#8b8278] text-left border-b border-[#c9a961]/10 hover:text-[#c9a961] transition-colors">ACCOUNT PROFILE</button>
                        <button className="py-3 text-[11px] tracking-[0.2em] text-[#8b8278] text-left border-b border-[#c9a961]/10 hover:text-[#c9a961] transition-colors">ORDER HISTORY</button>
                        <button className="py-3 text-[11px] tracking-[0.2em] text-[#8b8278] text-left border-b border-[#c9a961]/10 hover:text-[#c9a961] transition-colors">PAST PURCHASES</button>
                        
                        <button 
                            onClick={handleLogout}
                            className="mt-12 w-full py-4 border border-[#c9a961] text-[#c9a961] text-[10px] tracking-[0.2em] hover:bg-[#c9a961] hover:text-white transition-all duration-500 italic">
                            SIGN OUT
                        </button>

                        <button
                        onClick={handleDeleteAccount}
                        className="mt-4 w-full py-3 text-red-500 text-[10px] tracking-[0.2em] underline"
                        >
                            DELETE ACCOUNT
                        </button>

                    </nav>
                </aside>

                <main className="flex-1">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="flex-1 h-[1px] bg-[#c9a961]/20"></div>
                        <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#c9a961]">MY DETAILS</h2>
                        <div className="flex-1 h-[1px] bg-[#c9a961]/20"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-6 bg-white p-8 border border-[#c9a961]/10 shadow-sm">
                            <div className="flex justify-between items-end border-b border-[#c9a961]/20 pb-2">
                                <h3 className="text-[11px] font-bold tracking-[0.1em] text-[#2a2620]">PROFILE</h3>
                                <button
                                className="text-[9px] text-[#c9a961] underline italic"
                                onClick={() => navigate('/profile/edit')}
                                >
                                    VIEW ALL
                                </button>

                            </div>
                            <div className="text-[12px] leading-relaxed text-[#555] space-y-2">
                                <p><span className="text-[#8b8278] mr-2">Name:</span> {userName}</p>
                                <p><span className="text-[#8b8278] mr-2">Email:</span> {userEmail}</p>
                            </div>
                        </div>

                        <div className="space-y-6 bg-white p-8 border border-[#c9a961]/10 shadow-sm">
                            <div className="flex justify-between items-end border-b border-[#c9a961]/20 pb-2">
                                <h3 className="text-[11px] font-bold tracking-[0.1em] text-[#2a2620]">ORDERS</h3>
                                <button className="text-[9px] text-[#c9a961] underline italic">VIEW ALL</button>
                            </div>
                            <div className="text-[12px] text-[#8b8278]">
                                <p>최근 주문 내역이 없습니다.</p>
                                <p className="mt-2 underline cursor-pointer text-[#2a2620] font-medium">쇼핑 계속하기</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Mypage;