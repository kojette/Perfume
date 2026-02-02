package com.aion.back.auth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRecordRequest {
    private String email;
    private String loginMethod;  // EMAIL, KAKAO, GOOGLE 등
    private String ipAddress;
    private String userAgent;
}