package com.aion.back.member.dto.response;

import com.aion.back.member.entity.AccountStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyPageResponse {
    private String email;
    private String nickname;
    private String name;
    private String gender;
    private String profileImage;
    private AccountStatus accountStatus;
}