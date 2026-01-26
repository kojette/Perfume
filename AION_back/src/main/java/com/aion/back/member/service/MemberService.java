package com.aion.back.member.service;

import com.aion.back.member.dto.response.MyPageResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

    @Autowired
    private MemberRepository userRepository;

    // 중복 이메일 체크
    public boolean isEmailDuplicated(String email) {
        return userRepository.existsByEmail(email);
    }

    // 마이페이지 정보 조회 전용 메서드
    public MyPageResponse getMyPageInfo(Long userId) {
        Member member = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        return MyPageResponse.builder()
                .email(member.getEmail())
                .nickname(member.getNickname())
                .name(member.getName())
                .gender(member.getGender())
                .profileImage(member.getProfileImage())
                .accountStatus(member.getAccountStatus())
                .build();
    }
}