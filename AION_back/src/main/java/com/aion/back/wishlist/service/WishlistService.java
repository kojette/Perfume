package com.aion.back.wishlist.service;

import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.repository.PerfumeRepository;
import com.aion.back.wishlist.dto.response.WishlistResponse;
import com.aion.back.wishlist.entity.Wishlist;
import com.aion.back.wishlist.repository.WishlistProjection;
import com.aion.back.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final PerfumeRepository perfumeRepository;
    private final MemberService memberService;

    // 1. 내 찜 목록 조회 (이미지 포함)
    public List<WishlistResponse> getMyWishlist(String token) {
        Member member = memberService.getMemberEntityByToken(token);

        List<WishlistProjection> projections = wishlistRepository.findWishlistWithImagesByUserId(member.getUserId());

        return projections.stream().map(proj ->
                WishlistResponse.builder()
                        .wishlistId(proj.getWishlistId())
                        .perfumeId(proj.getPerfumeId())
                        .name(proj.getName())
                        .price(proj.getPrice())
                        .imageUrl(proj.getImageUrl())
                        .build()
        ).collect(Collectors.toList());
    }

    // 2. 찜하기/취소하기 토글
    @Transactional
    public String toggleWishlist(String token, Long perfumeId) {
        Member member = memberService.getMemberEntityByToken(token);
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new RuntimeException("상품이 없습니다."));

        Optional<Wishlist> existing = wishlistRepository.findByMemberAndPerfume(member, perfume);

        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return "찜하기가 취소되었습니다.";
        } else {
            Wishlist newWishlist = Wishlist.builder()
                    .member(member)
                    .perfume(perfume)
                    .build();
            wishlistRepository.save(newWishlist);
            return "찜 목록에 추가되었습니다.";
        }
    }

    // 3. 찜 목록에서 삭제
    @Transactional
    public void deleteWishlist(String token, Long wishlistId) {
        Member member = memberService.getMemberEntityByToken(token);
        Wishlist wishlist = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new RuntimeException("해당 찜 내역이 존재하지 않습니다."));

        if (!wishlist.getMember().getUserId().equals(member.getUserId())) {
            throw new RuntimeException("본인의 찜 목록만 삭제할 수 있습니다.");
        }

        wishlistRepository.delete(wishlist);
    }
}