package com.aion.back.wishlist.repository;

import com.aion.back.member.entity.Member;
import com.aion.back.perfume.entity.Perfume;
import com.aion.back.wishlist.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    // 찜 목록 다 가져오기
    List<Wishlist> findByMember(Member member);

    // 이미 찜했는지 확인 (토글 기능용)
    Optional<Wishlist> findByMemberAndPerfume(Member member, Perfume perfume);
}
