import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ornament } from "../Ornament";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isMatch = password === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      alert("비밀번호를 모두 입력해주세요.");
      return;
    }

    if (!isMatch) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // ✅ 아직 실제 변경 X (목업)
    alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    navigate("/login");
  };

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
              className="w-full border-b border-[#c9a964]/30 py-2 outline-none bg-transparent transition-colors text-sm"
            />
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
              className="w-full border-b border-[#c9a964]/30 py-2 outline-none bg-transparent transition-colors text-sm"
            />
          </div>

          {/* 불일치 메시지 */}
          {confirmPassword && !isMatch && (
            <p className="text-[10px] text-red-500 italic">
              비밀번호가 일치하지 않습니다.
            </p>
          )}

          {/* 버튼 */}
          <button
            type="submit"
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs"
          >
            RESET PASSWORD
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
