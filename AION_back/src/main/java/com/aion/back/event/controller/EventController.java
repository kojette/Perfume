package com.aion.back.event.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.event.dto.EventParticipationResponseDto;
import com.aion.back.event.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    @PostMapping("/{eventId}/participate")
    public ApiResponse<EventParticipationResponseDto> participateEvent(
            @RequestHeader("Authorization") String token,
            @PathVariable Long eventId) {

        EventParticipationResponseDto result = eventService.participate(token, eventId);

        return ApiResponse.success("이벤트 참여가 완료되었습니다.", result);
    }
}