import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ornament } from "../Ornament";

const FindPassword = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleNext = (e) => {
    e.preventDefault();

    const savedName = localStorage.getItem("userName");
    const savedEmail = localStorage.getItem("userEmail");

    if (!name.trim() || !email.trim()) {
      alert("이름과 이메일을 모두 입력해주세요.");
      return;
    }

    if (!savedName || !savedEmail) {
      alert("가입된 계정이 없습니다.");
      return;
    }

    if (name !== savedName || email !== savedEmail) {
      alert("가입 시 입력한 정보와 일치하지 않습니다.");
      return;
    }

    navigate("/reset-password");
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex flex-col items-center">
      {/* 비밀번호 찾기 박스 */}
      <div className="max-w-md w-full bg-white border border-[#c9a961]/20 p-10 shadow-sm relative">
        
        {/* 상단 타이틀 */}
        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            AUTHENTICATION
          </div>
          <Ornament className="mb-6" />
          <h2 className="font-display text-2xl tracking-[0.2em] text-[#2a2620]">
            비밀번호 찾기
          </h2>
        </div>

        <form onSubmit={handleNext} className="space-y-8">
          {/* 이름 입력 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">
              NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-[#c9a964]/30 py-2 focus:border-[#c9a961] outline-none bg-transparent transition-colors text-sm"
              placeholder="이름을 입력해주세요"
              required
            />
          </div>

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] italic">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-[#c9a964]/30 py-2 focus:border-[#c9a961] outline-none bg-transparent transition-colors text-sm"
              placeholder="이메일을 입력해주세요"
              required
            />
          </div>

          {/* 다음 버튼 */}
          <button
            type="submit"
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all duration-500 tracking-[0.3em] text-xs mt-4"
          >
            NEXT
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

export default FindPassword;
