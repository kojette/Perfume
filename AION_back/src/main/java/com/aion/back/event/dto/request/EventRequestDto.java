package com.aion.back.event.dto.request;

import lombok.Getter;
import java.time.LocalDate;

@Getter
public class EventRequestDto {
    private String title;
    private String description;
    private String eventType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer discountRate;
    private String couponCode;
    private Integer pointAmount;
    private Integer maxParticipants;
    private Boolean priorityBuyers;
    private Double winProbability;
}