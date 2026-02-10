package com.aion.back.member.repository;

import com.aion.back.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    boolean existsByEmail(String email);

    Optional<Member> findByEmail(String email);

    Optional<Member> findBySupabaseUid(String supabaseUid);

    // 네이티브 쿼리로 회원 정보 수정 (타입 캐스팅 포함)
    @Modifying
    @Query(value = "UPDATE \"Users\" SET " +
            "name = :name, " +
            "nickname = :nickname, " +
            "phone = :phone, " +
            "gender = CAST(:gender AS user_gender), " +
            "profile_image = :profileImage " +
            "WHERE email = :email",
            nativeQuery = true)
    void updateMemberProfile(
            @Param("name") String name,
            @Param("nickname") String nickname,
            @Param("phone") String phone,
            @Param("gender") String gender,
            @Param("profileImage") String profileImage,
            @Param("email") String email
    );

    // 네이티브 쿼리로 계정 상태 변경 (타입 캐스팅 포함)
    @Modifying
    @Query(value = "UPDATE \"Users\" SET " +
            "account_status = CAST(:status AS user_account_status), " +
            "withdraw_reason = :reason, " +
            "withdraw_date = NOW() " + // PostgreSQL의 현재 시간을 바로 저장
            "WHERE email = :email",
            nativeQuery = true)
    void softDeleteMember(
            @Param("status") String status,
            @Param("reason") String reason,
            @Param("email") String email
    );
}