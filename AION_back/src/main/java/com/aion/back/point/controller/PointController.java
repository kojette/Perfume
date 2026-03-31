package com.aion.back.point.controller;
import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.point.dto.response.PointBalanceResponse;
import com.aion.back.point.dto.response.PointHistoryResponse;
import com.aion.back.point.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;

    private final MemberService memberService;

    @GetMapping("/balance")

    public ResponseEntity<ApiResponse<PointBalanceResponse>> getBalance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Member member = memberService.getMemberEntityByToken(token);
        PointBalanceResponse balanceResponse = pointService.getBalance(member);
        return ResponseEntity.ok(ApiResponse.success("포인트 잔액 조회 성공", balanceResponse));
    }

    @GetMapping("/history")

    public ResponseEntity<ApiResponse<List<PointHistoryResponse>>> getHistory(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        Member member = memberService.getMemberEntityByToken(token);
        List<PointHistoryResponse> history = pointService.getPointHistory(member.getUserId());
        return ResponseEntity.ok(ApiResponse.success("포인트 내역 조회 성공", history));
    }
}