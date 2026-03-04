package com.aion.back.point.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * 포인트 잔액 응답 DTO
 * - GET /api/points/balance 응답에 사용
 */
@Getter
@Builder
public class PointBalanceResponse {

    // 현재 보유 포인트 (Users.total_points)
    private int totalPoints;

    public static PointBalanceResponse of(int totalPoints) {
        return PointBalanceResponse.builder()
                .totalPoints(totalPoints)
                .build();
    }
}