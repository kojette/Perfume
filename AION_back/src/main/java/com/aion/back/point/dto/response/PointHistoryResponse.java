package com.aion.back.point.dto.response;

import com.aion.back.point.entity.Point;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 포인트 내역 응답 DTO
 * - Points_History 테이블 데이터를 프론트에 전달
 */
@Getter
@Builder
public class PointHistoryResponse {

    private Long pointHistoryId;

    // 변동량 (양수: 적립 / 음수: 사용)
    private int amount;

    // 변동 후 잔액
    private int balanceAfter;

    // 사유
    private String reason;
    private String reasonDetail;

    // 연관 주문 ID
    private Long relatedOrderId;

    // 상태 (AVAILABLE / USED / EXPIRED)
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime expireAt;
    private LocalDateTime usedAt;

    public static PointHistoryResponse from(Point point) {
        return PointHistoryResponse.builder()
                .pointHistoryId(point.getPointHistoryId())
                .amount(point.getAmount())
                .balanceAfter(point.getBalanceAfter())
                .reason(point.getReason())
                .reasonDetail(point.getReasonDetail())
                .relatedOrderId(point.getRelatedOrderId())
                .status(point.getStatus() != null ? point.getStatus().name() : "AVAILABLE")
                .createdAt(point.getCreatedAt())
                .expireAt(point.getExpireAt())
                .usedAt(point.getUsedAt())
                .build();
    }
}