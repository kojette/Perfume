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
            "gender = CAST(:gender AS user_gender) " +
            "WHERE email = :email",
            nativeQuery = true)
    void updateMemberProfile(
            @Param("name") String name,
            @Param("nickname") String nickname,
            @Param("phone") String phone,
            @Param("gender") String gender,
            @Param("email") String email
    );

    // 네이티브 쿼리로 계정 상태 변경 (타입 캐스팅 포함)
    @Modifying
    @Query(value = "UPDATE \"Users\" SET " +
            "account_status = CAST(:status AS user_account_status) " +
            "WHERE email = :email",
            nativeQuery = true)
    void updateAccountStatus(
            @Param("status") String status,
            @Param("email") String email
    );
}