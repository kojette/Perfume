package com.aion.back.wishlist.repository;

import com.aion.back.member.entity.Member;
import com.aion.back.perfume.entity.Perfume;
import com.aion.back.wishlist.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByMember(Member member);
    Optional<Wishlist> findByMemberAndPerfume(Member member, Perfume perfume);

    @Query(value = "SELECT w.wishlist_id AS wishlistId, p.perfume_id AS perfumeId, " +
            "p.name AS name, p.price AS price, pi.image_url AS imageUrl " +
            "FROM \"Wishlists\" w " +
            "JOIN \"Perfumes\" p ON w.perfume_id = p.perfume_id " +
            "LEFT JOIN \"Perfume_Images\" pi ON p.perfume_id = pi.perfume_id AND pi.is_thumbnail = true " +
            "WHERE w.user_id = :userId", nativeQuery = true)
    List<WishlistProjection> findWishlistWithImagesByUserId(@Param("userId") Long userId);
}