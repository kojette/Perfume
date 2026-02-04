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

        //request에서 데이터 꺼내기
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
            Cart newCart = Cart.builder()
                    .member(member)
                    .perfume(perfume)
                    .quantity(quantity)
                    .build();
            cartRepository.save(newCart);
        }

        return ApiResponse.success("장바구니에 담았습니다.");
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getMyCart(@RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        List<Cart> carts = cartRepository.findByMember(member);

        List<Map<String, Object>> result = carts.stream().map(cart -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("cartId", cart.getCartId());
            map.put("perfumeId", cart.getPerfume().getPerfumeId());
            map.put("name", cart.getPerfume().getName());
            map.put("brand", cart.getPerfume().getBrand() != null ? cart.getPerfume().getBrand().getBrandId() : null);
            map.put("price", cart.getPerfume().getSalePrice() != null ? cart.getPerfume().getSalePrice() : cart.getPerfume().getPrice());
            map.put("quantity", cart.getQuantity());
            map.put("imageUrl", "https://via.placeholder.com/150");

            return map;
        }).collect(Collectors.toList());

        return ApiResponse.success("장바구니 조회 성공", result);
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
}
