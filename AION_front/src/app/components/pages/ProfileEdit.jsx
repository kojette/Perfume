import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';

const ProfileEdit = () => {
  const navigate = useNavigate();

  // localStorage에서 기존 회원정보 불러오기
  const [formData, setFormData] = useState({
    name: sessionStorage.getItem('userName') || '',
    email: sessionStorage.getItem('userEmail') || '',
    phone: sessionStorage.getItem('userPhone') || '',
    gender: sessionStorage.getItem('userGender') || '',
    birth: sessionStorage.getItem('userBirth') || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    // 수정된 정보 다시 저장
    sessionStorage.setItem('userName', formData.name);
    sessionStorage.setItem('userPhone', formData.phone);
    sessionStorage.setItem('userGender', formData.gender);
    sessionStorage.setItem('userBirth', formData.birth);

    alert('회원 정보가 수정되었습니다');
    navigate('/mypage');
    window.location.reload();
  };

  const handleDeleteAccount = () => {
    if(window.confirm("정말 계정을 삭제하시겠습니까? 삭제 후에는 복구가 불가능합니다.")) {
      sessionStorage.clear();
      localStorage.clear();
      alert("회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
      navigate('/');
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 px-6">
      <div className="max-w-md mx-auto bg-white p-10 border border-[#c9a961]/20 shadow-sm">

        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.4em] italic mb-4">
            PROFILE EDIT
          </div>
          <Ornament className="mb-4" />
          <h2 className="text-2xl tracking-[0.2em]">회원 정보 입력</h2>
        </div>

        <div className="space-y-6">
          {/* 이름 */}
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="이름"
            className="w-full border-b py-2 outline-none text-sm font-pretendard"
          />

          {/* 이메일 (수정 불가) */}
          <input
            value={formData.email}
            disabled
            className="w-full border-b py-2 text-gray-400 text-sm bg-transparent font-pretendard"
          />

          {/* 전화번호 */}
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="전화번호"
            className="w-full border-b py-2 outline-none text-sm font-pretendard"
          />

          {/* 성별 */}
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border-b py-2 text-sm bg-transparent outline-none font-pretendard"
          >
            <option value="">성별 선택</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>

          {/* 생년월일 */}
          <input
            type="date"
            name="birth"
            value={formData.birth}
            onChange={handleChange}
            className="w-full border-b py-2 text-sm outline-none font-pretendard"
          />

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all tracking-[0.3em] text-xs mt-6"
          >
            SAVE
          </button>

          {/* 계정 삭제 버튼 */}
          <button
            onClick = {handleDeleteAccount}
            className = "w-full text-[10px] text-[#8b8278] underline hover:text-red-500 transition-colors cursor-pointer tracking-widest iatalic" >
            계정 삭제하기
          </button>
        
        </div>

      </div>
    </div>
  );
};

export default ProfileEdit;
