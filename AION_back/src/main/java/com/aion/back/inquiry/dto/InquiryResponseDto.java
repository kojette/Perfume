package com.aion.back.inquiry.dto;

import com.aion.back.inquiry.entity.Inquiry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InquiryResponseDto {
    private Long inquiryId;
    private Long customerId;       // 추가: 고객 ID (경고 기능에 필요)
    private String type;
    private String title;
    private String content;
    private String customerName;
    private String customerEmail;
    private Integer warningCount;  // 추가: 경고 횟수
    private String warningLevel;   // 추가: 경고 레벨 (normal/warning/danger/blacklist)
    private String status;
    private boolean read;
    private String answer;
    private String assignedTo;
    private LocalDateTime createdAt;

    public static InquiryResponseDto from(Inquiry inquiry) {
        return InquiryResponseDto.builder()
                .inquiryId(inquiry.getInquiryId())
                .customerId(inquiry.getMember().getUserId())
                .type(inquiry.getType())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .customerName(inquiry.getCustomerName())
                .customerEmail(inquiry.getCustomerEmail())
                .warningCount(inquiry.getMember().getWarningCount() != null ? inquiry.getMember().getWarningCount() : 0)
                .warningLevel(inquiry.getMember().getWarningLevel() != null ? inquiry.getMember().getWarningLevel() : "normal")
                .status(inquiry.getStatus())
                .read(inquiry.isRead())
                .answer(inquiry.getAnswer())
                .assignedTo(inquiry.getAssignedTo())
                .createdAt(inquiry.getCreatedAt())
                .build();
    }
}