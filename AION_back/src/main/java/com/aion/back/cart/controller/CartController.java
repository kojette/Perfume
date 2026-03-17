package com.aion.back.cart.controller;

import com.aion.back.cart.entity.Cart;
import com.aion.back.cart.repository.CartRepository;
import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.repository.PerfumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CartController {

    private final CartRepository cartRepository;
    private final PerfumeRepository perfumeRepository;
    private final MemberService memberService;

    @PostMapping("/add")
    public ApiResponse<String> addToCart(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> request
    ){
        Member member = memberService.getMemberEntityByToken(token);
        Long perfumeId = ((Number) request.get("perfumeId")).longValue();
        int quantity = ((Number) request.get("quantity")).intValue();

        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new RuntimeException("상품이 없습니다."));

        Optional<Cart> existingCart = cartRepository.findByMemberAndPerfume(member, perfume);

        if (existingCart.isPresent()){
            Cart cart = existingCart.get();
            cart.setQuantity(cart.getQuantity() + quantity);
            cartRepository.save(cart);
        } else {
            Cart newCart = new Cart();
            newCart.setMember(member);
            newCart.setPerfume(perfume);
            newCart.setQuantity(quantity);
            newCart.setItemType("PERFUME");
            newCart.setIsCustom(false);
            cartRepository.save(newCart);
        }

        return ApiResponse.success("장바구니에 담았습니다.");
    }

    @PostMapping("/custom")
    public ApiResponse<String> addCustomToCart(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> request
    ) {
        Member member = memberService.getMemberEntityByToken(token);

        Long customDesignId = ((Number) request.get("customDesignId")).longValue();
        String name = (String) request.get("name");
        Integer price = ((Number) request.get("price")).intValue();
        int quantity = request.get("quantity") != null ? ((Number) request.get("quantity")).intValue() : 1;
        String imageUrl = (String) request.get("imageUrl");

        Optional<Cart> existing = cartRepository.findByMemberAndCustomDesignId(member, customDesignId);

        if (existing.isPresent()) {
            Cart cart = existing.get();
            cart.setQuantity(cart.getQuantity() + quantity);
            cartRepository.save(cart);
        } else {
            Cart newCart = new Cart();
            newCart.setMember(member);
            newCart.setQuantity(quantity);
            newCart.setItemType("CUSTOM");
            newCart.setIsCustom(true);
            newCart.setCustomDesignId(customDesignId);
            newCart.setCustomName(name);
            newCart.setCustomPrice(price);
            newCart.setCustomImageUrl(imageUrl);
            cartRepository.save(newCart);
        }

        return ApiResponse.success("커스텀 디자인이 장바구니에 담겼습니다.");
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getMyCart(@RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        List<Cart> carts = cartRepository.findByMember(member);

        List<Map<String, Object>> result = carts.stream().map(cart -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("cartId", cart.getCartId());
            map.put("quantity", cart.getQuantity());
            map.put("isCustom", cart.getIsCustom());

            if (Boolean.TRUE.equals(cart.getIsCustom())) {
                map.put("perfumeId", null);
                map.put("customDesignId", cart.getCustomDesignId());
                map.put("name", cart.getCustomName());
                map.put("price", cart.getCustomPrice());
                map.put("imageUrl", cart.getCustomImageUrl());
                map.put("brand", null);
            } else {
                if (cart.getPerfume() == null) return null;
                map.put("perfumeId", cart.getPerfume().getPerfumeId());
                map.put("customDesignId", null);
                map.put("name", cart.getPerfume().getName());
                map.put("brand", cart.getPerfume().getBrand() != null ? cart.getPerfume().getBrand().getBrandId() : null);
                map.put("price", cart.getPerfume().getSalePrice() != null ? cart.getPerfume().getSalePrice() : cart.getPerfume().getPrice());
                map.put("imageUrl", "https://via.placeholder.com/150");
            }

            return map;
        }).filter(Objects::nonNull).collect(Collectors.toList());

        return ApiResponse.success("장바구니 조회 성공", result);
    }

    @PostMapping("/scent-blend")
    public ApiResponse<String> addScentBlendToCart(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, Object> request
    ) {
        Member member = memberService.getMemberEntityByToken(token);

        String name     = (String) request.get("name");
        Integer price   = ((Number) request.get("price")).intValue();
        int quantity    = request.get("quantity") != null
                ? ((Number) request.get("quantity")).intValue() : 1;
        String imageUrl = (String) request.get("imageUrl");

        // custom_design_id 는 Custom_Designs FK 제약이 있어 향조합 ID를 넣을 수 없음 → null 고정
        Cart newCart = new Cart();
        newCart.setMember(member);
        newCart.setQuantity(quantity);
        newCart.setItemType("CUSTOM");
        newCart.setIsCustom(true);
        newCart.setCustomDesignId(null);
        newCart.setCustomName(name);
        newCart.setCustomPrice(price);
        newCart.setCustomImageUrl(imageUrl);
        cartRepository.save(newCart);

        return ApiResponse.success("향 조합이 장바구니에 담겼습니다.");
    }

    @PatchMapping("/{cartId}")
    public ApiResponse<String> updateQuantity(
            @RequestHeader("Authorization") String token,
            @PathVariable Long cartId,
            @RequestBody Map<String, Integer> request
    ) {
        Member member = memberService.getMemberEntityByToken(token);
        int newQuantity = request.get("quantity");

        if(newQuantity < 1){
            return ApiResponse.error("수량은 1개 이상이어야 합니다.");
        }

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("장바구니 상품을 찾을 수 없습니다."));

        if (!cart.getMember().getEmail().equals(member.getEmail())){
            throw new RuntimeException("권한이 없습니다.");
        }

        cart.setQuantity(newQuantity);
        cartRepository.save(cart);

        return ApiResponse.success("수량이 변경되었습니다.");
    }

    @DeleteMapping("/{cartId}")
    public ApiResponse<String> removeCartItem(
            @RequestHeader("Authorization") String token,
            @PathVariable Long cartId
    ) {
        Member member = memberService.getMemberEntityByToken(token);
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("장바구니 상품을 찾을 수 없습니다."));

        if (!cart.getMember().getEmail().equals(member.getEmail())){
            throw new RuntimeException("권한이 없습니다.");
        }

        cartRepository.delete(cart);
        return ApiResponse.success("장바구니에서 성공적으로 삭제되었습니다.");
    }
}