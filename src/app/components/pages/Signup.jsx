import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Ornament} from '../Ornament';

const Signup = () => {
    const navigate = useNavigate();

    // 입력값 관리 (이메일, 비밀번호, 닉네임, 약관동의)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: '',
        birth: '',
        agreeAll: false
    });

    // 비밀번호 일치 여부 확인 로직
    const isPasswordMatch = formData.password === formData.confirmPassword;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isPasswordMatch) return alert("비밀번호가 일치하지 않습니다.");
        // 나머지 유효성 검사
        alert(`${formData.name}님, 가입을 축하합니다!`);
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center">
            <div className="max-w-lg w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm">
                <div className="text-center mb-10">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">REGISTRATION</div>
                    <Ornament className="mb-6" />
                    <h2 className="font-display text-3xl tracking-[0.2em] text-[#2a2620]">계정 생성</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 이름 & 이메일 */}
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="이름" required className="border-b border-[#c9a961]/30 py-2 outline-none text-sm" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        <input type="email" placeholder="이메일" required className="border-b border-[#c9a961]/30 py-2 outline-none text-sm" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>

                    {/* 비밀번호 & 재확인 */}
                    <div className="grid grid-cols-2 gap-4">
                        <input type="password" placeholder="비밀번호" required className="border-b border-[#c9a961]/30 py-2 outline-none text-sm" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        <input type="password" placeholder="비밀번호 재입력" required className="border-b border-[#c9a961]/30 py-2 outline-none text-sm" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                    {formData.confirmPassword && !isPasswordMatch && <p className="text-[10px] text-red-500 italic">비밀번호가 일치하지 않습니다.</p>}

                    {/* 전화번호 */}
                    <div className="space-y-2">
                        <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">PHONE NUMBER</label>
                        <input 
                            type="tel" 
                            placeholder="" 
                            className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm bg-transparent focus:border-[#c9a961] transition-colors" 
                            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        />
                    </div>

                    {/* 성별 */}
                    <div className="space-y-2">
                        <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">GENDER</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] cursor-pointer appearance-none"
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            >
                                <option value="">성별 (선택)</option>
                                <option value="male">남성 </option>
                                <option value="female">여성 </option>
                            </select>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#c9a961] text-[8px]">
                                ▼
                            </div>
                        </div>
                    </div>

                    {/* 생년월일 */}
                    <div className="space-y-2">
                        <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">BIRTH DATE</label>
                        <div className="grid grid-cols-3 gap-2">
                            {/* 년 */}
                            <select 
                                className="bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] appearance-none cursor-pointer"
                                onChange={(e) => setFormData({...formData, birthYear: e.target.value})}>
                                <option value="">년</option>
                                {Array.from({ length: 100 }, (_, i) => 2026 - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            {/* 월 */}
                            <select 
                                className="bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] appearance-none cursor-pointer"
                                onChange={(e) => setFormData({...formData, birthMonth: e.target.value})}>
                                <option value="">월</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <option key={month} value={month}>{month}월</option>
                                ))}
                            </select>

                            {/* 일 */}
                            <select 
                                className="bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] appearance-none cursor-pointer"
                                onChange={(e) => setFormData({...formData, birthDay: e.target.value})}>
                                <option value="">일</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>{day}일</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 약관 동의 리스트 */}
                    <div className="bg-[#faf8f3] p-4 space-y-2 mt-4">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-[#2a2620]">
                            <input type="checkbox" onChange={(e) => setFormData({...formData, agreeAll: e.target.checked})} /> 전체 동의
                        </label>
                        <p className="text-[9px] text-[#8b8278] pl-5 italic underline cursor-pointer">서비스 이용약관 동의 (필수)</p>
                        <p className="text-[9px] text-[#8b8278] pl-5 italic underline cursor-pointer">개인정보 수집 및 이용 동의 (필수)</p>
                    </div>
                    <button type="submit" className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all tracking-[0.3em] text-xs">CREATE ACCOUNT</button>
                </form>

            </div>
        </div>
    );
};

export default Signup;