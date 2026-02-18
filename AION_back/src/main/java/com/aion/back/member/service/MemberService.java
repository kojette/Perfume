package com.aion.back.member.service;

import com.aion.back.common.config.SupabaseJwtValidator;
import com.aion.back.member.dto.request.MemberRegistrationRequest;
import com.aion.back.member.dto.request.ProfileUpdateRequest;
import com.aion.back.member.dto.response.MemberProfileResponse;
import com.aion.back.member.dto.response.MyPageResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import lombok.extern.slf4j.Slf4j;
import com.aion.back.member.entity.AccountStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

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

    @Transactional(readOnly = true)
    public void checkEmailAvailability(String email) {
        Optional<Member> memberOpt = memberRepository.findByEmail(email);

        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();

            // ★ 수정: String "DELETED" 대신 Enum 타입인 AccountStatus.DELETED와 비교해야 함
            if (AccountStatus.DELETED.equals(member.getAccountStatus())) {
                LocalDateTime withdrawDate = member.getWithdrawDate();
                if (withdrawDate != null) {
                    long daysSinceWithdraw = ChronoUnit.DAYS.between(withdrawDate, LocalDateTime.now());
                    if (daysSinceWithdraw < 30) {
                        throw new RuntimeException("탈퇴 후 30일 이내에는 재가입이 불가능합니다. (" + (30 - daysSinceWithdraw) + "일 남음)");
                    }
                }
            } else {
                throw new RuntimeException("이미 등록된 이메일입니다.");
            }
        }
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

    @Transactional // ★ 수정: 가입 로직에는 Transactional을 붙여주는 것이 안전합니다.
    public void registerMember(MemberRegistrationRequest request) {
        // ★ 수정: 가입 전 검증 로직을 위에 만든 checkEmailAvailability로 통합 호출
        checkEmailAvailability(request.getEmail());

        // 1. 이메일로 기존 회원 정보 조회
        Optional<Member> existingMember = memberRepository.findByEmail(request.getEmail());

        if (existingMember.isPresent()) {
            Member member = existingMember.get();

            // ★ 수정: Enum 비교 방식으로 수정
            if (AccountStatus.DELETED.equals(member.getAccountStatus())) {
                // 30일이 지났다면 기존의 탈퇴 데이터를 삭제 (새로운 가입 허용)
                memberRepository.delete(member);
                memberRepository.flush();
            }
        }

        // 2. 새로운 회원 정보 생성 및 저장
        Member member = new Member();
        member.setSupabaseUid(request.getSupabaseUid());
        member.setEmail(request.getEmail());
        member.setName(request.getName());
        // ★ 참고: 닉네임이 request에 없다면 이름을 기본값으로 쓰거나 null 처리
        member.setNickname(request.getNickname() != null ? request.getNickname() : request.getName());
        member.setPhone(request.getPhone());
        member.setGender(request.getGender());
        member.setAccountStatus(AccountStatus.ACTIVE);
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
                    .role(member.getRole())
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
                    request.getProfileImage(),
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
    public void deleteAccount(String token, String reason) { // reason 파라미터 추가
        try {
            String actualToken = token.replace("Bearer ", "");
            String email = jwtValidator.validateAndGetEmail(actualToken);

            log.info("회원 탈퇴 시작 - 이메일: {}, 사유: {}", email, reason);

            // 존재 확인
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            // 소프트 삭제 실행
            memberRepository.softDeleteMember("DELETED", reason, email);

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