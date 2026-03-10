package com.aion.back.member.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {
    private String name;
    private String nickname;
    private String phone;
    private String gender;
    private String profileImage;
    private String zipcode;
    private String address;
    private String addressDetail;
}