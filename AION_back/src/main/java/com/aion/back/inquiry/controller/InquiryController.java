package com.aion.back.inquiry.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.inquiry.dto.InquiryRequestDto;
import com.aion.back.inquiry.entity.Inquiry;
import com.aion.back.inquiry.repository.InquiryRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InquiryController {
    private final MemberService memberService;
    private final InquiryRepository inquiryRepository;

    // 내 문의 내역 조회
    @GetMapping("/my")
    public ApiResponse<List<Inquiry>> getMyInquiries(@RequestParam(defaultValue = "1") Integer page, @RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        List<Inquiry> inquiries = inquiryRepository.findByMemberOrderByCreatedAtDesc(member);
        return ApiResponse.success("문의 내역 조회 성공", inquiries);
    }

    // 문의 등록
    @PostMapping
    @Transactional
    public ApiResponse<String> createdInquiry(@RequestHeader("Authorization") String token, @RequestBody InquiryRequestDto request) {
        Member member = memberService.getMemberEntityByToken(token);

        Inquiry inquiry = Inquiry.builder()
                .member(member)
                .customerName(member.getName())
                .customerEmail(member.getEmail())
                .type(request.getType())
                .title(request.getTitle())
                .content(request.getContent())
                .status("pending")
                .read(false)
                .build();

        inquiryRepository.save(inquiry);
        return ApiResponse.success("문의가 성공적으로 등록되었습니다.");
    }

    // 읽음 처리
    @PatchMapping("/{id}/read")
    @Transactional
    public ApiResponse<String> markAsRead(@RequestHeader("Authorization") String token, @PathVariable Long id) {
        Member member = memberService.getMemberEntityByToken(token);
        Inquiry inquiry = inquiryRepository.findById(id).orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));

        if (!inquiry.getMember().getUserId().equals(member.getUserId())) {
            throw new RuntimeException("본인의 문의만 수정할 수 있습니다.");
        }

        inquiry.setRead(true);
        return ApiResponse.success("읽음 처리되었습니다.");
    }

    // 문의 취소
    @PatchMapping("/{id}/cancel")
    @Transactional
    public ApiResponse<String> cancelInquiry(@RequestHeader("Authorization") String token,
                                             @PathVariable Long id) {
        Member member = memberService.getMemberEntityByToken(token);
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));

        if (!inquiry.getMember().getUserId().equals(member.getUserId())) {
            throw new RuntimeException("본인의 문의만 취소할 수 있습니다.");
        }

        inquiry.setStatus("cancelled");
        return ApiResponse.success("문의가 취소되었습니다.");
    }

    // 문의 삭제
    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<String> deleteInquiry(@RequestHeader("Authorization") String token,
                                             @PathVariable Long id) {
        Member member = memberService.getMemberEntityByToken(token);
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));

        if (!inquiry.getMember().getUserId().equals(member.getUserId())) {
            throw new RuntimeException("본인의 문의만 삭제할 수 있습니다.");
        }

        inquiryRepository.delete(inquiry);
        return ApiResponse.success("문의가 삭제되었습니다.");
    }
}
