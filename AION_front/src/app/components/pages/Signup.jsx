import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Ornament} from '../Ornament';
import {supabase} from '../../supabaseClient';

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        agreeAll: false
    });

    const isPasswordMatch = formData.password === formData.confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 이름 확인
        if(!formData.name.trim()){
            return alert("이름을 입력해주세요.");
        }

        // 이메일 확인
        if(!formData.email.trim()){
            return alert("이메일 주소를 입력해주세요.");
        }

        //비밀번호 확인
        if(!formData.password){
            return alert("비밀번호를 입력해주세요.");
        }
        if(formData.password.length < 8){
            return alert("비밀번호는 8자 이상이어야 합니다.");
        }
        
        // 비밀번호 일치 확인
        if (!isPasswordMatch) {
            return alert("비밀번호가 일치하지 않습니다.");
        }

        // 전화번호 확인
        if(!formData.phone.trim()){
            return alert("전화번호를 입력해주세요.");
        }

        // 성별 확인
        if(!formData.gender){
            return alert("성별을 선택해주세요.");
        }

        // 생년월일 확인
        if(!formData.birthYear||!formData.birthMonth||!formData.birthDay){
            return alert("생년월일을 입력해주세요.");
        }

        // 약관 동의 확인
        if (!formData.agreeAll) {
            return alert("필수 약관에 동의해주세요.");
        }

        setLoading(true);

        try {
            // 생년월일 포맷팅
            const birthDate = formData.birthYear && formData.birthMonth && formData.birthDay
                ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
                : null;

            // 1. 기존 가입 여부 및 재가입 제한 기간(30일) 체크
            const { data: lastRecord, error: checkError } = await supabase
                .from('Users')
                .select('email, withdraw_date')
                .eq('email', formData.email)
                .order('withdraw_date', { ascending: false }) // 가장 최근 탈퇴일 기준
                .maybeSingle();

            if (lastRecord) {
                // A. 만약 withdraw_date가 null이라면 -> 현재 활동 중인 회원임
                if (lastRecord.withdraw_date == null) {
                    setLoading(false);
                    return alert("이미 사용 중인 계정입니다. 로그인 페이지를 이용해주세요.");
                }

                // B. withdraw_date가 있다면 -> 탈퇴한 회원임. 30일 체크 시작
                const withdrawnAt = new Date(lastRecord.withdraw_date);
                const now = new Date();
                
                // 날짜 차이 계산 (현재 시간 - 탈퇴 시간)
                const diffTime = now - withdrawnAt;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (diffDays < 30) {
                    setLoading(false);
                    // 남은 일수 계산 (예: 29.1일 남았으면 30일로 표시)
                    const remainingDays = Math.ceil(30 - diffDays);
                    return alert(`탈퇴 후 30일 이내에는 재가입이 불가능합니다. ${remainingDays}일 후에 다시 시도해주세요.`);
                }

                const { error: deleteError } = await supabase
                    .from('Users')
                    .delete()
                    .eq('email', formData.email);

                if (deleteError) {
                    console.error("기존 기록 삭제 중 오류:", deleteError);
                    setLoading(false);
                    return alert("재가입 처리 중 문제가 발생했습니다.");
                }
                
                console.log("30일 경과 확인: 재가입 절차를 진행합니다.");
            }

        
            const {data, error} = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone: formData.phone || null,
                        gender: formData.gender || 'UNDISCLOSED',
                        birth: birthDate
                    }
                }
            });
            

            if (error) {
                console.error('가입 에러:', error);

                if(error.message.includes("User already registered")){
                    alert("이미 가입된 이메일이거나, 탈퇴 처리가 진행 중인 계정입니다. 해당 계정으로 로그인을 시도하시거나, 문제가 지속되면 고객센터로 문의해주세요.");
                }
                else{
                    alert(`가입 실패: ${error.message}`);
                }
                setLoading(false);
                return;
            }

            try {
                const backendResponse = await fetch('http://localhost:8080/api/members/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type' : 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        name: formData.name,
                        phone: formData.phone,
                        gender: formData.gender,
                        birth: birthDate,
                        supabaseUid: data.user.id
                    })
                });

                if(!backendResponse.ok){
                    console.error('백엔드 DB 저장 실패');
                
                }
            } catch (backendErr){
                console.error('백엔드 서버 연결 에러:', backendErr);
            }

            alert("가입 신청 완료! 입력하신 이메일로 전송된 확인 링크를 클릭하여 인증을 완료해주세요.");
            navigate('/login');

        } catch (err) {
            console.error('예상치 못한 에러:', err);
            alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center">
            <div className="max-w-lg w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm">
                <div className="text-center mb-10">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">REGISTRATION</div>
                    <Ornament className="mb-6" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 이름 & 이메일 */}
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="text" 
                            placeholder="이름" 
                            required 
                            className="border-b border-[#c9a961]/30 py-2 outline-none text-sm" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        />
                        <input 
                            type="email" 
                            placeholder="이메일" 
                            required 
                            className="border-b border-[#c9a961]/30 py-2 outline-none text-sm"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        />
                    </div>

                    {/* 비밀번호 & 재확인 */}
                    <div className="space-y-2">
                        <input 
                            type="password" 
                            placeholder="비밀번호" 
                            required 
                            className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        />
                        <p className="text-[9px] text-[#8b8278] italic">
                            * 영문과 숫자를 혼합하여 8자 이상 입력해주세요.
                        </p>
                        <input 
                            type="password" 
                            placeholder="비밀번호 재입력" 
                            required 
                            className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                        />
                        {formData.confirmPassword && !isPasswordMatch && (
                            <p className="text-[10px] text-red-500 italic">비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>

                    {/* 전화번호 */}
                    <div className="space-y-2">
                        <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">PHONE NUMBER</label>
                        <input 
                            type="tel" 
                            placeholder="- 를 제외하고 입력해주세요" 
                            className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm bg-transparent focus:border-[#c9a961] transition-colors"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        />
                    </div>

                    {/* 성별 */}
                    <div className="space-y-2">
                        <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">GENDER</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] cursor-pointer appearance-none"
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            >
                                <option value="">성별 (선택)</option>
                                <option value="MALE">남성</option>
                                <option value="FEMALE">여성</option>
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
                            <select 
                                className="bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] appearance-none cursor-pointer"
                                value={formData.birthYear}
                                onChange={(e) => setFormData({...formData, birthYear: e.target.value})}>
                                <option value="">년</option>
                                {Array.from({ length: 100 }, (_, i) => 2026 - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            <select 
                                className="bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] appearance-none cursor-pointer"
                                value={formData.birthMonth}
                                onChange={(e) => setFormData({...formData, birthMonth: e.target.value})}>
                                <option value="">월</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <option key={month} value={month}>{month}월</option>
                                ))}
                            </select>

                            <select 
                                className="bg-transparent border-b border-[#c9a961]/30 py-2 text-xs text-[#555] outline-none focus:border-[#c9a961] appearance-none cursor-pointer"
                                value={formData.birthDay}
                                onChange={(e) => setFormData({...formData, birthDay: e.target.value})}>
                                <option value="">일</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>{day}일</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 약관 동의 */}
                    <div className="bg-[#faf8f3] p-4 space-y-2 mt-4">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-[#2a2620]">
                            <input 
                                type="checkbox"
                                checked={formData.agreeAll}
                                onChange={(e) => setFormData({...formData, agreeAll: e.target.checked})} 
                            /> 전체 동의
                        </label>
                        <p className="text-[9px] text-[#8b8278] pl-5 italic underline cursor-pointer">서비스 이용약관 동의 (필수)</p>
                        <p className="text-[9px] text-[#8b8278] pl-5 italic underline cursor-pointer">개인정보 수집 및 이용 동의 (필수)</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all tracking-[0.3em] text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? "PROCESSING..." : "CREATE ACCOUNT"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;