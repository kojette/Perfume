import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: '', // 이메일 필드 추가
    name: '',
    nickname: '',
    phone: '',
    gender: '',
    profileImage: ''
  });

  // 컴포넌트 마운트 시 현재 정보 불러오기
  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  const fetchCurrentProfile = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('accessToken');
      
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8080/api/members/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('프로필 조회 실패');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setFormData({
          email: result.data.email || '', // 데이터 바인딩
          name: result.data.name || '',
          nickname: result.data.nickname || '',
          phone: result.data.phone || '',
          gender: result.data.gender || '',
          profileImage: result.data.profileImage || ''
        });
      }

    } catch (err) {
      console.error('프로필 조회 에러:', err);
      alert('프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) return alert('이름을 입력해주세요.');
      if (!formData.phone.trim()) return alert('전화번호를 입력해주세요.');
      if (!formData.gender) return alert('성별을 선택해주세요.');

      setSaving(true);
      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8080/api/members/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname || null,
          phone: formData.phone,
          gender: formData.gender,
          profileImage: formData.profileImage || null
        }) // PUT 요청 시 이메일은 제외하고 전송 (수정 불가 항목이므로)
      });

      if (!response.ok) throw new Error('프로필 수정 실패');

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem('userName', formData.name);
        alert('회원 정보가 수정되었습니다.');
        navigate('/mypage');
      } else {
        throw new Error(result.message || '수정 실패');
      }

    } catch (err) {
      alert(`회원 정보 수정에 실패했습니다.\n에러: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // 1. 먼저 탈퇴 사유를 묻습니다.
    const reason = window.prompt(
      "탈퇴 사유를 입력해 주세요.\n(예: 서비스 불만족, 개인정보 보호, 장기간 미사용 등)"
    );

    // 취소를 눌렀거나 사유가 너무 짧으면 중단
    if (reason === null) return; 
    if (reason.trim().length < 2) {
      alert("탈퇴 사유를 최소 2자 이상 입력해 주세요.");
      return;
    }

    // 2. 최종 확인
    if (!window.confirm("정말 계정을 삭제하시겠습니까?\n삭제 후에는 30일 내 동일 이메일로 재가입이 제한될 수 있습니다.")) return;

    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/api/members/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // ★ 백엔드 softDeleteMember 쿼리에 전달할 사유(reason)를 Body에 담아 보냅니다.
        body: JSON.stringify({ reason: reason }) 
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || '계정 삭제 실패');
      }

      const result = await response.json();
      if (result.success) {
        sessionStorage.clear();
        localStorage.clear();
        alert('그동안 이용해 주셔서 감사합니다. 회원 탈퇴가 처리되었습니다.');
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      alert(`회원 탈퇴 처리에 실패했습니다.\n에러: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="text-[#c9a961] text-sm tracking-[0.3em] animate-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6 font-pretendard">
      <div className="max-w-md mx-auto bg-white p-10 border border-[#c9a961]/20 shadow-sm">

        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.4em] italic mb-4 uppercase">
            Profile Account
          </div>
          <Ornament className="mb-4" />
          <h2 className="text-2xl tracking-[0.1em] text-[#2a2620]">회원 정보 수정</h2>
        </div>

        <div className="space-y-6">
          
          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border border-[#c9a961]/30 overflow-hidden bg-[#faf8f3] flex items-center justify-center">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-display text-[#c9a961]">
                    {formData.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#2a2620] rounded-full flex items-center justify-center text-white border-2 border-white cursor-pointer hover:bg-[#c9a961] transition-colors shadow-lg">
                <span className="text-lg font-bold">+</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-[9px] text-[#c9a961] mt-3 tracking-[0.2em] uppercase font-bold">Change Photo</p>
          </div>

          {/* 이메일 (Read Only) */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278]">
              EMAIL ADDRESS (UNALTERABLE)
            </label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className="w-full bg-[#f0ece4]/30 border-b border-[#c9a961]/10 py-2 outline-none text-sm text-[#8b8278] cursor-not-allowed italic"
            />
            <p className="text-[9px] text-[#c9a961]/70 italic mt-1">* 이메일은 변경할 수 없습니다.</p>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278]">
              NAME
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름"
              className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm focus:border-[#c9a961] transition-colors"
            />
          </div>

          {/* 닉네임 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278]">
              NICKNAME
            </label>
            <input
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="닉네임"
              className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm focus:border-[#c9a961] transition-colors"
            />
          </div>

          {/* 전화번호 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278]">
              PHONE NUMBER
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="전화번호 (- 제외)"
              className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm focus:border-[#c9a961] transition-colors"
            />
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278]">
              GENDER
            </label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-[#c9a961]/30 py-2 text-sm outline-none focus:border-[#c9a961] cursor-pointer appearance-none"
              >
                <option value="">성별 선택</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#c9a961] text-[8px]">
                ▼
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all tracking-[0.3em] text-xs disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE'}
            </button>

            <button
              onClick={() => navigate('/mypage')}
              className="w-full py-4 border border-[#c9a961]/30 text-[#8b8278] hover:bg-[#faf8f3] transition-all tracking-[0.3em] text-xs"
            >
              CANCEL
            </button>
          </div>

          <button
            onClick={handleDeleteAccount}
            className="w-full text-[10px] text-[#8b8278]/60 underline hover:text-red-400 transition-colors cursor-pointer tracking-widest italic mt-8"
          >
            DELETE ACCOUNT
          </button>
        
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;