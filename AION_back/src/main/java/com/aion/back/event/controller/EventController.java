package com.aion.back.event.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.event.dto.response.EventParticipationResponseDto;
import com.aion.back.event.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/my-participations")
    public ApiResponse<List<Map<String, Object>>> getMyParticipations(
            @RequestHeader("Authorization") String token) {
        List<Map<String, Object>> result = eventService.getMyParticipations(token);
        return ApiResponse.success("내 이벤트 참여 내역 조회 성공", result);
    }
}