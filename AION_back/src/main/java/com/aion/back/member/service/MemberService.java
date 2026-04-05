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

    public boolean isEmailDuplicated(String email) {
        return memberRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public void checkEmailAvailability(String email) {
        Optional<Member> memberOpt = memberRepository.findByEmail(email);

        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();

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

    @Transactional
    public void registerMember(MemberRegistrationRequest request) {
        checkEmailAvailability(request.getEmail());

        Optional<Member> existingMember = memberRepository.findByEmail(request.getEmail());

        if (existingMember.isPresent()) {
            Member member = existingMember.get();

            if (AccountStatus.DELETED.equals(member.getAccountStatus())) {
                memberRepository.delete(member);
                memberRepository.flush();
            }
        }

        Member member = new Member();
        member.setSupabaseUid(request.getSupabaseUid());
        member.setEmail(request.getEmail());
        member.setName(request.getName());
        member.setNickname(request.getNickname() != null ? request.getNickname() : request.getName());
        member.setPhone(request.getPhone());
        member.setGender(request.getGender());
        member.setAccountStatus(AccountStatus.ACTIVE);
        member.setJoinDate(LocalDateTime.now());
        member.setCreatedAt(LocalDateTime.now());

        memberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public MemberProfileResponse getProfileByToken(String token) {
        try {
            String actualToken = token.replace("Bearer ", "");
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
                    .totalPoints(member.getTotalPoints())
                    .zipcode(member.getZipcode())
                    .address(member.getAddress())
                    .addressDetail(member.getAddressDetail())
                    .build();
        } catch (Exception e) {
            log.error("프로필 조회 실패", e);
            throw new RuntimeException("프로필 조회 실패: " + e.getMessage());
        }
    }

    @Transactional
    public MemberProfileResponse updateProfile(String token, ProfileUpdateRequest request) {
        try {
            String actualToken = token.replace("Bearer ", "");
            String email = jwtValidator.validateAndGetEmail(actualToken);

            log.info("회원 정보 수정 시작 - 이메일: {}", email);
            log.info("수정 요청 데이터: name={}, nickname={}, phone={}, gender={}",
                    request.getName(), request.getNickname(), request.getPhone(), request.getGender());

            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            memberRepository.updateMemberProfile(
                    request.getName() != null ? request.getName() : member.getName(),
                    request.getNickname(),
                    request.getPhone() != null ? request.getPhone() : member.getPhone(),
                    request.getGender() != null ? request.getGender() : member.getGender(),
                    request.getProfileImage(),
                    request.getZipcode(),
                    request.getAddress(),
                    request.getAddressDetail(),
                    email
            );

            log.info("회원 정보 수정 완료: {}", email);

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
                    .totalPoints(updated.getTotalPoints())
                    .zipcode(updated.getZipcode())
                    .address(updated.getAddress())
                    .addressDetail(updated.getAddressDetail())
                    .build();
        } catch (Exception e) {
            log.error("회원 정보 수정 실패", e);
            throw new RuntimeException("회원 정보 수정 실패: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteAccount(String token, String reason) {
        try {
            String actualToken = token.replace("Bearer ", "");
            String email = jwtValidator.validateAndGetEmail(actualToken);

            log.info("회원 탈퇴 시작 - 이메일: {}, 사유: {}", email, reason);

            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

            memberRepository.softDeleteMember("DELETED", reason, email);

            log.info("회원 탈퇴 처리 완료: {}", email);
        } catch (Exception e) {
            log.error("회원 탈퇴 실패", e);
            throw new RuntimeException("회원 탈퇴 실패: " + e.getMessage());
        }
    }
    @Transactional(readOnly = true)
    public Member getMemberEntityByToken(String token) {
        String actualToken = token.replace("Bearer ", "");
        String email = jwtValidator.validateAndGetEmail(actualToken);
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }
}