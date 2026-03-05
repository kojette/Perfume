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

/**
 * 포인트 관련 API
 *
 * GET  /api/points/balance  → 현재 보유 포인트 조회
 * GET  /api/points/history  → 포인트 적립/사용 내역 조회
 *
 * NOTE: 포인트 적립/차감은 OrderService 내부에서 자동 처리됩니다.
 *       별도의 POST /use, POST /earn API는 제공하지 않습니다.
 */
@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;
    private final MemberService memberService;

    /**
     * 보유 포인트 잔액 조회
     * GET /api/points/balance
     */
    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<PointBalanceResponse>> getBalance(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {

        Member member = memberService.getMemberEntityByToken(token);
        PointBalanceResponse balanceResponse = pointService.getBalance(member);

        return ResponseEntity.ok(ApiResponse.success("포인트 잔액 조회 성공", balanceResponse));
    }

    /**
     * 포인트 적립/사용 내역 조회
     * GET /api/points/history
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PointHistoryResponse>>> getHistory(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String token) {

        Member member = memberService.getMemberEntityByToken(token);
        List<PointHistoryResponse> history = pointService.getPointHistory(member.getUserId());

        return ResponseEntity.ok(ApiResponse.success("포인트 내역 조회 성공", history));
    }
}