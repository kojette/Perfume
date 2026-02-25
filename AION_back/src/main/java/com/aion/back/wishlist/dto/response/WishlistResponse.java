package com.aion.back.wishlist.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WishlistResponse {
    private Long wishlistId;
    private Long perfumeId;
    private String name;
    private Integer price;
    private String imageUrl;
}