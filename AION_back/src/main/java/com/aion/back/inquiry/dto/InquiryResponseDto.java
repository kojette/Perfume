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
    private String type;
    private String title;
    private String content;
    private String customerName;
    private String customerEmail;
    private String status;
    private boolean read;
    private String answer;
    private String assignedTo;
    private LocalDateTime createdAt;

    public static InquiryResponseDto from(Inquiry inquiry) {
        return InquiryResponseDto.builder()
                .inquiryId(inquiry.getInquiryId())
                .type(inquiry.getType())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .customerName(inquiry.getCustomerName())
                .customerEmail(inquiry.getCustomerEmail())
                .status(inquiry.getStatus())
                .read(inquiry.isRead())
                .answer(inquiry.getAnswer())
                .assignedTo(inquiry.getAssignedTo())
                .createdAt(inquiry.getCreatedAt())
                .build();
    }
}