import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
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

      console.log('프로필 조회 시작...');

      // 백엔드에서 현재 정보 가져오기
      const response = await fetch('http://localhost:8080/api/members/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('에러 응답:', errorText);
        throw new Error('프로필 조회 실패');
      }

      const result = await response.json();
      console.log('프로필 데이터:', result);
      
      if (result.success && result.data) {
        setFormData({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      // 유효성 검사
      if (!formData.name.trim()) {
        return alert('이름을 입력해주세요.');
      }

      if (!formData.phone.trim()) {
        return alert('전화번호를 입력해주세요.');
      }

      if (!formData.gender) {
        return alert('성별을 선택해주세요.');
      }

      setSaving(true);

      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      console.log('수정 요청 데이터:', formData);

      // 백엔드 API 호출
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
        })
      });

      console.log('수정 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('에러 응답:', errorText);
        throw new Error('프로필 수정 실패');
      }

      const result = await response.json();
      console.log('수정 결과:', result);

      if (result.success) {
        // sessionStorage 업데이트 (옵션)
        sessionStorage.setItem('userName', formData.name);
        
        alert('회원 정보가 수정되었습니다.');
        navigate('/mypage');
      } else {
        throw new Error(result.message || '수정 실패');
      }

    } catch (err) {
      console.error('프로필 수정 에러:', err);
      alert(`회원 정보 수정에 실패했습니다.\n에러: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말 계정을 삭제하시겠습니까?\n삭제 후에는 복구가 불가능합니다.")) {
      return;
    }

    try {
      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      console.log('계정 삭제 요청...');

      // 백엔드 API 호출
      const response = await fetch('http://localhost:8080/api/members/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('삭제 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('에러 응답:', errorText);
        throw new Error('계정 삭제 실패');
      }

      const result = await response.json();
      console.log('삭제 결과:', result);

      if (result.success) {
        sessionStorage.clear();
        localStorage.clear();
        alert('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
        navigate('/');
        window.location.reload();
      } else {
        throw new Error(result.message || '탈퇴 실패');
      }

    } catch (err) {
      console.error('계정 삭제 에러:', err);
      alert(`회원 탈퇴 처리에 실패했습니다.\n에러: ${err.message}`);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3] pt-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#c9a961] text-sm tracking-wider">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 px-6">
      <div className="max-w-md mx-auto bg-white p-10 border border-[#c9a961]/20 shadow-sm">

        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.4em] italic mb-4">
            PROFILE EDIT
          </div>
          <Ornament className="mb-4" />
          <h2 className="text-2xl tracking-[0.2em]">회원 정보 수정</h2>
        </div>

        <div className="space-y-6">
          
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
              className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm font-pretendard focus:border-[#c9a961] transition-colors"
            />
          </div>

          {/* 닉네임 */}
          <div className="space-y-2">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278]">
              NICKNAME (선택)
            </label>
            <input
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="닉네임"
              className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm font-pretendard focus:border-[#c9a961] transition-colors"
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
              className="w-full border-b border-[#c9a961]/30 py-2 outline-none text-sm font-pretendard focus:border-[#c9a961] transition-colors"
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
                className="w-full bg-transparent border-b border-[#c9a961]/30 py-2 text-sm outline-none focus:border-[#c9a961] cursor-pointer appearance-none font-pretendard"
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

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all tracking-[0.3em] text-xs mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'SAVING...' : 'SAVE'}
          </button>

          {/* 취소 버튼 */}
          <button
            onClick={() => navigate('/mypage')}
            className="w-full py-4 border border-[#c9a961]/30 text-[#8b8278] hover:bg-[#faf8f3] transition-all tracking-[0.3em] text-xs"
          >
            CANCEL
          </button>

          {/* 계정 삭제 버튼 */}
          <button
            onClick={handleDeleteAccount}
            className="w-full text-[10px] text-[#8b8278] underline hover:text-red-500 transition-colors cursor-pointer tracking-widest italic mt-4"
          >
            계정 삭제하기
          </button>
        
        </div>

      </div>
    </div>
  );
};

export default ProfileEdit;