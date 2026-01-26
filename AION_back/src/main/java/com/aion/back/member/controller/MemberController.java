package com.aion.back.member.controller;

import com.aion.back.member.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    @Autowired
    private MemberService userService;

    @GetMapping("/check-email")
    public boolean checkEmail(@RequestParam("email") String email) {
        return userService.isEmailDuplicated(email);
    }
}