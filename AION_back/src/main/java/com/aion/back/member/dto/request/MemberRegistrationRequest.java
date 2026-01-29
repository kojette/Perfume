package com.aion.back.member.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberRegistrationRequest {
    private String supabaseUid;
    private String email;
    private String name;
    private String nickname;
    private String phone;
    private String gender;
}
