package com.aion.back.inquiry.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class InquiryRequestDto {
    private String type;
    private String title;
    private String content;
}
