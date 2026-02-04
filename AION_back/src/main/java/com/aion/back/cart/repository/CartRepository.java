package com.aion.back.cart.repository;

import com.aion.back.cart.entity.Cart;
import com.aion.back.member.entity.Member;
import com.aion.back.perfume.entity.Perfume;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long>{
    List<Cart> findByMember(Member member);

    Optional<Cart> findByMemberAndPerfume(Member member, Perfume perfume);
}
