package com.aion.back.announcement.controller;

import com.aion.back.announcement.dto.AnnouncementRequest;
import com.aion.back.announcement.dto.AnnouncementResponse;
import com.aion.back.announcement.service.AnnouncementService;
import com.aion.back.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    // 목록 조회 (전체 공개)
    @GetMapping
    public ApiResponse<List<AnnouncementResponse>> getAll() {
        return ApiResponse.success("공지사항 목록 조회 성공", announcementService.getAll());
    }

    // 생성 (관리자)
    @PostMapping
    public ApiResponse<AnnouncementResponse> create(
            @RequestHeader("Authorization") String token,
            @RequestBody AnnouncementRequest request) {
        return ApiResponse.success("공지사항이 작성되었습니다.", announcementService.create(token, request));
    }

    // 수정 (관리자)
    @PutMapping("/{id}")
    public ApiResponse<AnnouncementResponse> update(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestBody AnnouncementRequest request) {
        return ApiResponse.success("공지사항이 수정되었습니다.", announcementService.update(token, id, request));
    }

    // 삭제 (관리자)
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        announcementService.delete(token, id);
        return ApiResponse.success("삭제되었습니다.");
    }
}