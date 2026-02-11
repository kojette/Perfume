package com.aion.back.wishlist.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.repository.PerfumeRepository;
import com.aion.back.wishlist.entity.Wishlist;
import com.aion.back.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final PerfumeRepository perfumeRepository;
    private final MemberService memberService;

    // 내 찜 목록 조회 - GET /api/wishlist
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getMyWishlist(@RequestHeader("Authorization") String token){
        Member member = memberService.getMemberEntityByToken(token);

        System.out.println(member.getUserId());

        List<Wishlist> wishlists = wishlistRepository.findByMember(member);

        System.out.println(wishlists.size());

        List<Map<String, Object>> result = wishlists.stream().map(w -> {
            Map<String, Object> map = new HashMap<>();
            map.put("wishlistId", w.getWishlistId());
            map.put("perfumeId", w.getPerfume().getPerfumeId());
            map.put("name", w.getPerfume().getName());
            map.put("price", w.getPerfume().getPrice());
            map.put("imageUrl", "https://via.placeholder.com/150"); // 나중에 이미지 삽입 예정
            return map;
        }).collect(Collectors.toList());

        return ApiResponse.success("찜 목록 조회 성공", result);
    }

    // 찜하기 - POST /api/wishlist/toggle - 누르면 찜, 한 번 더 누르면 취소
    @PostMapping("/toggle")
    public ApiResponse<String> toggleWishlist(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Long> request
    ) {
        Member member = memberService.getMemberEntityByToken(token);
        Long perfumeId = request.get("perfumeId");

        Perfume perfume = perfumeRepository.findById(perfumeId).orElseThrow(() -> new RuntimeException("상품이 없습니다."));

        Optional<Wishlist> existing = wishlistRepository.findByMemberAndPerfume(member, perfume);

        if(existing.isPresent()){
            wishlistRepository.delete(existing.get());
            return ApiResponse.success("찜하기가 취소되었습니다.");
        } else {
            Wishlist newWishlist = Wishlist.builder()
                    .member(member)
                    .perfume(perfume)
                    .build();
            wishlistRepository.save(newWishlist);
            return ApiResponse.success("찜 목록에 추가되었습니다.");
        }
    }

    @DeleteMapping("/{wishlistId}")
    public ApiResponse<String> deleteWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long wishlistId
    ) {
        Member member = memberService.getMemberEntityByToken(token);

        Wishlist wishlist = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new RuntimeException("해당 찜 내역이 존재하지 않습니다."));

        if(!wishlist.getMember().getUserId().equals(member.getUserId())) {
            throw new RuntimeException("본인의 찜 목록만 삭제할 수 있습니다.");
        }

        wishlistRepository.delete(wishlist);
        return ApiResponse.success("찜 목록에서 삭제되었습니다.");
    }

}
