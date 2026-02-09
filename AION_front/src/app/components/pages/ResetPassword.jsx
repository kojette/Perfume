import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Ornament } from "../Ornament";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [tokenValid, setTokenValid] = useState(null);

  const isMatch = password === confirmPassword;

  useEffect(() => {
    // URL에서 토큰 추출
    const tokenFromUrl = searchParams.get('token');
    
    if (!tokenFromUrl) {
      alert('유효하지 않은 접근입니다. 비밀번호 찾기를 다시 진행해주세요.');
      navigate('/find-password');
      return;
    }

    setToken(tokenFromUrl);
    verifyToken(tokenFromUrl);
  }, [searchParams, navigate]);

  // 토큰 유효성 검증
  const verifyToken = async (tokenValue) => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenValue })
      });

      const data = await response.json();

      if (!response.ok) {
        setTokenValid(false);
        alert('만료되었거나 유효하지 않은 링크입니다. 비밀번호 찾기를 다시 진행해주세요.');
        navigate('/find-password');
        return;
      }

      setTokenValid(true);
    } catch (error) {
      console.error('토큰 검증 에러:', error);
      setTokenValid(false);
      alert('토큰 검증 중 오류가 발생했습니다.');
      navigate('/find-password');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      alert("비밀번호를 모두 입력해주세요.");
      return;
    }

    if (!isMatch) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 강도 검증 (최소 8자, 영문+숫자 포함)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.");
      return;
    }

    try {
      setLoading(true);

      // 백엔드 API 호출
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '비밀번호 재설정에 실패했습니다.');
      }

      alert("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
      navigate("/login");

    } catch (error) {
      console.error('비밀번호 재설정 에러:', error);
      alert(error.message || "비밀번호 재설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 토큰 검증 중
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4"></div>
          <p className="text-[#8b8278] italic">링크를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 토큰 유효하지 않음
  if (tokenValid === false) {
    return null; // 이미 navigate로 리다이렉트됨
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center">
      <div className="max-w-md w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm">
        {/* 상단 타이틀 */}
        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            AUTHENTICATION
          </div>
          <Ornament className="mb-6" />
          <h2 className="font-display text-2xl tracking-[0.2em] text-[#2a2620]">
            비밀번호 재설정
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 새 비밀번호 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">
              NEW PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호를 입력해주세요"
              className="w-full border-b border-[#c9a964]/30 py-2 outline-none bg-transparent transition-colors text-sm focus:border-[#c9a961]"
              disabled={loading}
              required
            />
            <p className="text-[9px] text-[#8b8278] italic mt-1">
              * 최소 8자 이상, 영문과 숫자를 포함해주세요
            </p>
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력해주세요"
              className="w-full border-b border-[#c9a964]/30 py-2 outline-none bg-transparent transition-colors text-sm focus:border-[#c9a961]"
              disabled={loading}
              required
            />
          </div>

          {/* 불일치 메시지 */}
          {confirmPassword && !isMatch && (
            <p className="text-[10px] text-red-500 italic">
              비밀번호가 일치하지 않습니다.
            </p>
          )}

          {/* 일치 메시지 */}
          {confirmPassword && isMatch && password.length >= 8 && (
            <p className="text-[10px] text-green-600 italic">
              ✓ 비밀번호가 일치합니다.
            </p>
          )}

          {/* 버튼 */}
          <button
            type="submit"
            disabled={loading || !isMatch || password.length < 8}
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "처리 중..." : "비밀번호 변경"}
          </button>
        </form>

        {/* 하단 링크 */}
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

export default ResetPassword;