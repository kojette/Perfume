import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ornament } from "../Ornament";
import { supabase } from "../../supabaseClient";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(null); // null=확인중, true=준비됨, false=실패

  const isMatch = password === confirmPassword;

  useEffect(() => {
    // ★ 핵심: Supabase가 메일 링크 클릭 시 URL에 access_token을 담아 리다이렉트함
    // onAuthStateChange로 세션이 자동 수립되는 걸 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // 비밀번호 재설정용 세션이 수립됨 → 입력 폼 표시
        setSessionReady(true);
      } else if (event === "SIGNED_IN" && session) {
        // 이미 로그인된 상태로 진입한 경우도 허용
        setSessionReady(true);
      }
    });

    // 이미 세션이 있는 경우 처리 (새로고침 등)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // 5초 대기 후에도 세션 없으면 실패 처리
        setTimeout(() => {
          setSessionReady((prev) => {
            if (prev === null) {
              alert("유효하지 않은 접근입니다. 비밀번호 찾기를 다시 진행해주세요.");
              navigate("/find-password");
              return false;
            }
            return prev;
          });
        }, 5000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.");
      return;
    }

    try {
      setLoading(true);

      // ★ Supabase Auth 비밀번호 변경 (세션 기반으로 자동 처리)
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      alert("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
      
      // 로그아웃 후 로그인 페이지로
      await supabase.auth.signOut();
      navigate("/login");

    } catch (error) {
      console.error("비밀번호 재설정 에러:", error);
      alert(error.message || "비밀번호 재설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 세션 확인 중
  if (sessionReady === null) {
    return (
      <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4"></div>
          <p className="text-[#8b8278] italic">링크를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (sessionReady === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center">
      <div className="max-w-md w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm">

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

          {confirmPassword && !isMatch && (
            <p className="text-[10px] text-red-500 italic">
              비밀번호가 일치하지 않습니다.
            </p>
          )}

          {confirmPassword && isMatch && password.length >= 8 && (
            <p className="text-[10px] text-green-600 italic">
              ✓ 비밀번호가 일치합니다.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isMatch || password.length < 8}
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "처리 중..." : "비밀번호 변경"}
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

export default ResetPassword;