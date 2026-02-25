package com.aion.back.event.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.event.dto.request.EventRequestDto;
import com.aion.back.event.entity.Event;
import com.aion.back.event.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventAdminController {

    private final EventService eventService;

    @GetMapping
    public ApiResponse<List<Event>> getAllEvents() {
        return ApiResponse.success("이벤트 목록 조회 성공", eventService.getAllEvents());
    }

    @PostMapping
    public ApiResponse<Event> createEvent(@RequestBody EventRequestDto dto) {
        return ApiResponse.success("이벤트 생성 성공", eventService.createEvent(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Event> updateEvent(@PathVariable Long id, @RequestBody EventRequestDto dto) {
        return ApiResponse.success("이벤트 수정 성공", eventService.updateEvent(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ApiResponse.success("이벤트 삭제 성공", null);
    }
}