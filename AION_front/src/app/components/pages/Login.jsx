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
            const {data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if(error) {
                console.error('로그인 에러:', error);
                alert('이메일 또는 비밀번호가 일치하지 않습니다.');
                return;
            }

            const {data: userData, error: userError} = await supabase
                .from('Users')
                .select('*')
                .eq('email', email)
                .single();

            if(userError){
                console.error('사용자 정보 조회 에러:', userError);
                alert('환영합니다!');
                navigate('/');
            }

            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userEmail', userData.email);
            sessionStorage.setItem('userName', userData.name);
            sessionStorage.setItem('userPhone', userData.phone);
            sessionStorage.setItem('userGender', userData.gender);
            sessionStorage.setItem('userBirth', userData.birth);

            alert(`${userData.name}님, 환영합니다!`);
            navigate('/');
            window.location.reload();
        } catch(err){
            console.error('예상치 못한 에러:', err);
            alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally{
            setLoading(false);
        }

    };

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-16 pb-20 px-6 flex flex-col items-center">
            {/* 로그인 박스 */}
            <div className="max-w-md w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm relative">
                {/* 상단 장식 및 타이틀 */}
                <div className="text-center mb-10">
                    <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">AUTHENTICATION</div>
                    <Ornament className="mb-6" />
                    
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    {/* 이메일 입력창 */}
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

                    {/* 비밀번호 입력창 */}
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

                    {/* 로그인 버튼 */}
                    <button 
                        type="submit"
                        className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs mt-4">
                        SIGN IN
                    </button>
                </form>

                {/* 하단 링크 (회원가입/비번찾기) */}
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