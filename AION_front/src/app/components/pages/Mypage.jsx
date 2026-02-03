import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ornament } from '../Ornament';

const Mypage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 백엔드에서 가져올 사용자 정보
  const [userInfo, setUserInfo] = useState({
    email: '',
    name: '',
    nickname: '',
    phone: '',
    gender: '',
    profileImage: null,
    accountStatus: ''
  });

  // 컴포넌트 마운트 시 백엔드에서 데이터 가져오기
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // sessionStorage에서 토큰 가져오기
      const token = sessionStorage.getItem('accessToken');
      
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      // 백엔드 API 호출
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
        setUserInfo(result.data);
      } else {
        throw new Error(result.message || '데이터를 불러올 수 없습니다.');
      }

    } catch (err) {
      console.error('프로필 조회 에러:', err);
      setError(err.message);
      alert('프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      sessionStorage.clear();
      localStorage.clear();
      alert('로그아웃 되었습니다.');
      navigate('/');
      window.location.reload();
    }
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  // 성별 한글 변환
  const getGenderText = (gender) => {
    if (gender === 'MALE') return '남성';
    if (gender === 'FEMALE') return '여성';
    return '미설정';
  };

  // 계정 상태 한글 변환
  const getStatusText = (status) => {
    if (status === 'ACTIVE') return '정상';
    if (status === 'SUSPENDED') return '정지됨';
    if (status === 'DELETED') return '탈퇴됨';
    return '알 수 없음';
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

  // 에러 발생
  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8f3] pt-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-sm mb-4">{error}</div>
          <button 
            onClick={() => navigate('/login')}
            className="text-[#c9a961] text-xs underline"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 px-6">
      <div className="max-w-2xl mx-auto bg-white p-10 border border-[#c9a961]/20 shadow-sm">
        
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.4em] italic mb-4">
            MY PAGE
          </div>
          <Ornament className="mb-4" />
          <h2 className="text-2xl tracking-[0.2em]">회원 정보</h2>
        </div>

        {/* 프로필 이미지 (선택사항) */}
        {userInfo.profileImage && (
          <div className="flex justify-center mb-8">
            <img 
              src={userInfo.profileImage} 
              alt="프로필" 
              className="w-24 h-24 rounded-full object-cover border-2 border-[#c9a961]/30"
            />
          </div>
        )}

        {/* 정보 표시 */}
        <div className="space-y-6">
          
          {/* 이메일 */}
          <div className="border-b border-[#c9a961]/20 pb-4">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] mb-2">
              EMAIL
            </label>
            <p className="text-sm font-pretendard">{userInfo.email}</p>
          </div>

          {/* 이름 */}
          <div className="border-b border-[#c9a961]/20 pb-4">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] mb-2">
              NAME
            </label>
            <p className="text-sm font-pretendard">{userInfo.name}</p>
          </div>

          {/* 닉네임 */}
          {userInfo.nickname && (
            <div className="border-b border-[#c9a961]/20 pb-4">
              <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] mb-2">
                NICKNAME
              </label>
              <p className="text-sm font-pretendard">{userInfo.nickname}</p>
            </div>
          )}

          {/* 전화번호 */}
          <div className="border-b border-[#c9a961]/20 pb-4">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] mb-2">
              PHONE
            </label>
            <p className="text-sm font-pretendard">{userInfo.phone}</p>
          </div>

          {/* 성별 */}
          <div className="border-b border-[#c9a961]/20 pb-4">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] mb-2">
              GENDER
            </label>
            <p className="text-sm font-pretendard">{getGenderText(userInfo.gender)}</p>
          </div>

          {/* 계정 상태 */}
          <div className="border-b border-[#c9a961]/20 pb-4">
            <label className="block text-[10px] tracking-[0.2em] text-[#8b8278] mb-2">
              ACCOUNT STATUS
            </label>
            <p className={`text-sm font-pretendard ${
              userInfo.accountStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
            }`}>
              {getStatusText(userInfo.accountStatus)}
            </p>
          </div>

        </div>

        {/* 버튼들 */}
        <div className="mt-10 space-y-4">
          
          {/* 회원정보 수정 버튼 */}
          <button
            onClick={handleEditProfile}
            className="w-full py-4 bg-[#2a2620] text-white hover:bg-[#c9a961] transition-all tracking-[0.3em] text-xs"
          >
            EDIT PROFILE
          </button>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full py-4 border border-[#c9a961]/30 text-[#8b8278] hover:bg-[#faf8f3] transition-all tracking-[0.3em] text-xs"
          >
            LOGOUT
          </button>

        </div>

      </div>
    </div>
  );
};

export default Mypage;