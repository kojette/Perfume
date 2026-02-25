package com.aion.back.wishlist.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.wishlist.dto.response.WishlistResponse;
import com.aion.back.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<List<WishlistResponse>> getMyWishlist(@RequestHeader("Authorization") String token) {
        List<WishlistResponse> result = wishlistService.getMyWishlist(token);
        return ApiResponse.success("찜 목록 조회 성공", result);
    }

    @PostMapping("/toggle")
    public ApiResponse<String> toggleWishlist(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Long> request
    ) {
        Long perfumeId = request.get("perfumeId");
        String message = wishlistService.toggleWishlist(token, perfumeId);
        return ApiResponse.success(message);
    }

    @DeleteMapping("/{wishlistId}")
    public ApiResponse<String> deleteWishlist(
            @RequestHeader("Authorization") String token,
            @PathVariable Long wishlistId
    ) {
        wishlistService.deleteWishlist(token, wishlistId);
        return ApiResponse.success("찜 목록에서 삭제되었습니다.");
    }
}