package com.aion.back.perfume.repository;

public interface PerfumeSearchProjection {
    Long getPerfumeId();
    String getName();
    Integer getPrice();
    String getBrandName();
    String getImageUrl();
}