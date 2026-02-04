package com.aion.back.member.service;

import com.aion.back.common.config.SupabaseJwtValidator;
import com.aion.back.member.dto.request.MemberRegistrationRequest;
import com.aion.back.member.dto.request.ProfileUpdateRequest;
import com.aion.back.member.dto.response.MemberProfileResponse;
import com.aion.back.member.dto.response.MyPageResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
public class MemberService {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private SupabaseJwtValidator jwtValidator;

    // ===== 기존 메서드들 (그대로 유지) =====

    public boolean isEmailDuplicated(String email) {
        return memberRepository.existsByEmail(email);
    }

    public MyPageResponse getMyPageInfo(Long userId) {
        Member member = memberRepository.findById(userId)
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

    public void registerMember(MemberRegistrationRequest request){
        if(memberRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("이미 등록된 이메일입니다.");
        }

        Member member = new Member();
        member.setSupabaseUid(request.getSupabaseUid());
        member.setEmail(request.getEmail());
        member.setName(request.getName());
        member.setNickname(request.getNickname());
        member.setPhone(request.getPhone());
        member.setGender(request.getGender());
        member.setAccountStatus("ACTIVE");
        member.setJoinDate(LocalDateTime.now());
        member.setCreatedAt(LocalDateTime.now());

        memberRepository.save(member);
    }

    // ===== 새로 추가하는 메서드들 =====

    /**
     * 토큰으로 회원 정보 조회
     */
    @Transactional(readOnly = true)
    public MemberProfileResponse getProfileByToken(String token) {
        try {
            // Bearer 제거
            String actualToken = token.replace("Bearer ", "");

            // 토큰에서 이메일 추출
            String email = jwtValidator.validateAndGetEmail(actualToken);

            log.info("프로필 조회 - 이메일: {}", email);

            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            return MemberProfileResponse.builder()
                    .email(member.getEmail())
                    .name(member.getName())
                    .nickname(member.getNickname())
                    .phone(member.getPhone())
                    .gender(member.getGender())
                    .profileImage(member.getProfileImage())
                    .accountStatus(member.getAccountStatus())
                    .build();
        } catch (Exception e) {
            log.error("프로필 조회 실패", e);
            throw new RuntimeException("프로필 조회 실패: " + e.getMessage());
        }
    }

    /**
     * 회원 정보 수정 - Repository 네이티브 쿼리 사용
     */
    @Transactional
    public MemberProfileResponse updateProfile(String token, ProfileUpdateRequest request) {
        try {
            // Bearer 제거
            String actualToken = token.replace("Bearer ", "");

            // 토큰에서 이메일 추출
            String email = jwtValidator.validateAndGetEmail(actualToken);

            log.info("회원 정보 수정 시작 - 이메일: {}", email);
            log.info("수정 요청 데이터: name={}, nickname={}, phone={}, gender={}",
                    request.getName(), request.getNickname(), request.getPhone(), request.getGender());

            // 현재 회원 정보 조회
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            // 네이티브 쿼리로 업데이트 (타입 캐스팅 포함)
            memberRepository.updateMemberProfile(
                    request.getName() != null ? request.getName() : member.getName(),
                    request.getNickname(),
                    request.getPhone() != null ? request.getPhone() : member.getPhone(),
                    request.getGender() != null ? request.getGender() : member.getGender(),
                    email
            );

            log.info("회원 정보 수정 완료: {}", email);

            // 업데이트된 정보 다시 조회
            Member updated = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            return MemberProfileResponse.builder()
                    .email(updated.getEmail())
                    .name(updated.getName())
                    .nickname(updated.getNickname())
                    .phone(updated.getPhone())
                    .gender(updated.getGender())
                    .profileImage(updated.getProfileImage())
                    .accountStatus(updated.getAccountStatus())
                    .build();
        } catch (Exception e) {
            log.error("회원 정보 수정 실패", e);
            throw new RuntimeException("회원 정보 수정 실패: " + e.getMessage());
        }
    }

    /**
     * 회원 탈퇴 - Repository 네이티브 쿼리 사용
     */
    @Transactional
    public void deleteAccount(String token) {
        try {
            // Bearer 제거
            String actualToken = token.replace("Bearer ", "");

            // 토큰에서 이메일 추출
            String email = jwtValidator.validateAndGetEmail(actualToken);

            log.info("회원 탈퇴 시작 - 이메일: {}", email);

            // 회원 존재 여부 확인
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            // 네이티브 쿼리로 상태 변경 (타입 캐스팅 포함)
            memberRepository.updateAccountStatus("DELETED", email);

            log.info("회원 탈퇴 처리 완료: {}", email);
        } catch (Exception e) {
            log.error("회원 탈퇴 실패", e);
            throw new RuntimeException("회원 탈퇴 실패: " + e.getMessage());
        }
    }

    public Member getMemberEntityByToken(String token){
        String actualToken = token.replace("Bearer ", "");
        String email = jwtValidator.validateAndGetEmail(actualToken);
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }
}