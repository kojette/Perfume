package com.aion.back.point.dto.response;
import lombok.Builder;
import lombok.Getter;
@Getter
@Builder
public class PointBalanceResponse {

    private int totalPoints;

    public static PointBalanceResponse of(int totalPoints) {
        return PointBalanceResponse.builder()
                .totalPoints(totalPoints)
                .build();
    }
}