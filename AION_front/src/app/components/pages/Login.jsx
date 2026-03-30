import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Ornament} from '../Ornament';
import {supabase} from '../../supabaseClient';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert('이메일 또는 비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        const accessToken = data.session.access_token;


        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/login-record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    email: email,
                    loginMethod: 'EMAIL'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                

                if (errorData.message && errorData.message.includes("탈퇴")) {
                    alert("이미 탈퇴 처리된 계정입니다. 고객센터에 문의해주세요.");
                } else {
                    alert(errorData.message || "로그인 처리 중 오류가 발생했습니다.");
                }


                await supabase.auth.signOut();
                sessionStorage.clear();
                setLoading(false);
                return; 
            }
        } catch (backendError) {
            console.error('백엔드 체크 통신 에러:', backendError);

            await supabase.auth.signOut();
            alert("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
            setLoading(false);
            return;
        }


        try {
            const profileResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/members/profile`, {
                method: 'GET',
                headers: {
                    'Authorization' : `Bearer ${accessToken}`,
                    'Content-Type' : 'application/json'
                }
            });

            if (profileResponse.ok) {
                const json = await profileResponse.json();
                const userData = json.data;

                const isAdmin = String(userData.role) === 'ADMIN';

                sessionStorage.setItem('accessToken', accessToken);
                sessionStorage.setItem('isLoggedIn', true);
                sessionStorage.setItem('userEmail', userData.email);
                sessionStorage.setItem('userName', userData.name || '사용자');
                sessionStorage.setItem('isAdmin', isAdmin.toString());

                if (userData.role) {
                    sessionStorage.setItem('userRole', userData.role);
                }

                if (isAdmin) {
                    alert('관리자로 접속합니다.');
                    navigate('/admin');
                } else {
                    alert (`${userData.name}님, 환영합니다!`);
                    navigate('/');
                }

                window.location.reload();

            } else {
                throw new Error("회원 정보를 불러오지 못했습니다.");
            }
        } catch (profileError) {
            console.error("프로필 조회 실패: ", profileError);
            await supabase.auth.signOut();
            alert("회원 정보를 확인하는 중 오류가 발생했습니다.");
            setLoading(false);
        }

    } catch (err) {
        console.error('예상치 못한 에러:', err);
        alert('로그인 중 오류가 발생했습니다.');
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-16 pb-20 px-6 flex flex-col items-center">
            
            <div className="max-w-md w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm relative">
                
                <div className="text-center mb-10">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">AUTHENTICATION</div>
                    <Ornament className="mb-6" />
                    
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    
                    <div className="space-y-2">
                        <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] font-pretendard">EMAIL ADDRESS</label>
                        <input
                            type = "email"
                            value = {email}
                            onChange = {(e) => setEmail(e.target.value)}
                            className = "w-full font-pretendard border-b border-[#c9a964]/30 py-2 focus:border-[#c9a961] outline-none bg-transparent transition-colors text-sm"
                            placeholder = "이메일을 입력해주세요"
                            required />
                    </div>

                    
                    <div className = "space-y-2">
                        <label className ="block font-pretendard text-[10px] tracking-[0.2em] text-[#8b8278]">PASSWORD</label>
                        <input
                            type = "password"
                            value = {password}
                            onChange = {(e) => setPassword(e.target.value)}
                            className = "w-full font-pretendard border-b border-[#c9a964]/30 py-2 focus:border-[#c9a961] outline-none bg-transparent transition-colors text-sm"
                            placeholder = "비밀번호를 입력해주세요"
                            required />
                    </div>

                    
                    <button 
                        type="submit"
                        className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs mt-4">
                        SIGN IN
                    </button>
                </form>

                
                <div className="mt-10 flex flex-col items-center gap-4 border-t border-[#c9a961]/10 pt-8">
                    <button 
                        onClick = {() => navigate('/signup')}
                        className = "font-pretendard text-[10px] tracking-[0.2em] text-[#c9a961] hover:text-[#2a2620] transition-colors"
                        >
                            계정 생성하기
                        </button>
                        <button
                        onClick={() => navigate('/find-password')}
                        className="font-pretendard text-[10px] tracking-[0.2em] text-[#8b8278] hover:text-[#c9a961] transition-colors"
                        >
                            비밀번호 찾기
                        </button>
                </div>

            </div>
        </div>
    )
    
}


export default Login;