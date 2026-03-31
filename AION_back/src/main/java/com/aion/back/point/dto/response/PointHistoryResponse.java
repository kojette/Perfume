package com.aion.back.point.dto.response;
import com.aion.back.point.entity.Point;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
@Getter
@Builder
public class PointHistoryResponse {

    private Long pointHistoryId;

    private int amount;

    private int balanceAfter;

    private String reason;

    private String reasonDetail;

    private Long relatedOrderId;

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