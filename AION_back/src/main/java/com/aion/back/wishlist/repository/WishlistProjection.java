package com.aion.back.wishlist.repository;

public interface WishlistProjection {
    Long getWishlistId();
    Long getPerfumeId();
    String getName();
    Integer getPrice();
    String getImageUrl();
}