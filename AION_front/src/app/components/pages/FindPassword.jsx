import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ornament } from "../Ornament";
import { supabase } from "../../supabaseClient";

const FindPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // ★ Supabase가 직접 비밀번호 재설정 메일 발송
      // redirectTo: 메일 링크 클릭 시 이동할 페이지
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // 👇 디버깅: 응답 확인
      console.log('=== Supabase 비밀번호 재설정 응답 ===');
      console.log('data:', data);
      console.log('error:', error);
      console.log('email:', email.trim());
      console.log('redirectTo:', `${window.location.origin}/reset-password`);
      console.log('=====================================');

      if (error) {
        // 에러 상세 정보 출력
        console.error('비밀번호 재설정 오류 상세:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // 실제 에러 메시지 표시 (디버깅용)
        alert(`오류 발생: ${error.message}`);
        return;
      }

      // 성공 메시지
      setMessage("비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.");
      console.log('✅ 메일 발송 성공!');

      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      console.error("비밀번호 찾기 예외 발생:", error);
      alert(`예외 발생: ${error.message || '비밀번호 찾기 중 오류가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center">
      <div className="max-w-md w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm relative">

        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            AUTHENTICATION
          </div>
          <Ornament className="mb-6" />
          <h2 className="font-display text-2xl tracking-[0.2em] text-[#2a2620]">
            비밀번호 찾기
          </h2>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 text-center">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-[#c9a964]/30 py-2 focus:border-[#c9a961] outline-none bg-transparent transition-colors text-sm"
              placeholder="가입하신 이메일을 입력해주세요"
              required
              disabled={loading}
            />
          </div>

          <div className="text-xs text-[#8b8278] italic leading-relaxed">
            <p>• 입력하신 이메일로 비밀번호 재설정 링크가 전송됩니다.</p>
            <p>• 이메일이 도착하지 않으면 스팸함을 확인해주세요.</p>
            <p className="text-red-500 mt-2">• [디버깅] 브라우저 콘솔(F12)을 열어 응답을 확인하세요.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "전송 중..." : "재설정 링크 전송"}
          </button>
        </form>

        <div className="mt-10 flex justify-center border-t border-[#c9a961]/10 pt-8">
          <button
            onClick={() => navigate("/login")}
            className="text-[10px] tracking-[0.2em] text-[#8b8278] hover:text-[#c9a961] transition-colors italic"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindPassword;