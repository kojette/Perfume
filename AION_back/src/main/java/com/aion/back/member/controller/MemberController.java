package com.aion.back.member.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.dto.response.MyPageResponse;
import com.aion.back.member.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    @Autowired
    private MemberService userService;

    @GetMapping("/check-email")
    public ApiResponse<Boolean> checkEmail(@RequestParam("email") String email) {
        boolean isDuplicated = userService.isEmailDuplicated(email);

        // ApiResponse 객체에 담아서 반환
        return ApiResponse.success("이메일 중복 체크 결과입니다.", isDuplicated);
    }

    // 마이페이지 조회
    @GetMapping("/mypage")
    public ApiResponse<MyPageResponse> getMyPage(@RequestParam("userId") Long userId) {
        // 실제로는 토큰에서 ID를 꺼내야 하지만, 테스트를 위해 파라미터로 받습니다.
        MyPageResponse response = userService.getMyPageInfo(userId);
        return ApiResponse.success("마이페이지 정보를 성공적으로 불러왔습니다.", response);
    }
}