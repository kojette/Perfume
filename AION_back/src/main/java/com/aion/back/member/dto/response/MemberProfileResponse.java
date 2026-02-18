package com.aion.back.member.dto.response;

import lombok.*;
import com.aion.back.member.entity.AccountStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberProfileResponse {
    private String email;
    private String name;
    private String nickname;
    private String phone;
    private String gender;
    private String profileImage;
    private AccountStatus accountStatus;
    private String role;
}