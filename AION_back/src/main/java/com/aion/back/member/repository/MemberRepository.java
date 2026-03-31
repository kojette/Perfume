package com.aion.back.member.repository;

import com.aion.back.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    boolean existsByEmail(String email);

    Optional<Member> findByEmail(String email);

    Optional<Member> findBySupabaseUid(String supabaseUid);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "UPDATE \"Users\" SET " +
            "name = :name, " +
            "nickname = :nickname, " +
            "phone = :phone, " +
            "gender = CAST(:gender AS user_gender), " +
            "profile_image = :profileImage, " +
            "zipcode = :zipcode, " +
            "address = :address, " +
            "address_detail = :addressDetail " +
            "WHERE email = :email",
            nativeQuery = true)
    void updateMemberProfile(
            @Param("name") String name,
            @Param("nickname") String nickname,
            @Param("phone") String phone,
            @Param("gender") String gender,
            @Param("profileImage") String profileImage,
            @Param("zipcode") String zipcode,
            @Param("address") String address,
            @Param("addressDetail") String addressDetail,
            @Param("email") String email
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "UPDATE \"Users\" SET " +
            "account_status = CAST(:status AS user_account_status), " +
            "withdraw_reason = :reason, " +
            "withdraw_date = NOW() " +
            "WHERE email = :email",
            nativeQuery = true)
    void softDeleteMember(
            @Param("status") String status,
            @Param("reason") String reason,
            @Param("email") String email
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "UPDATE \"Users\" SET password_hash = :passwordHash WHERE user_id = :userId",
           nativeQuery = true)
    int updatePassword(@Param("userId") Long userId, @Param("passwordHash") String passwordHash);
}