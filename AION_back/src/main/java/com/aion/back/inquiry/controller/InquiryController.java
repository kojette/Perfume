package com.aion.back.inquiry.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.inquiry.dto.InquiryRequestDto;
import com.aion.back.inquiry.entity.Inquiry;
import com.aion.back.inquiry.repository.InquiryRepository;
import com.aion.back.inquiry.dto.InquiryResponseDto;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import com.aion.back.member.service.MemberService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InquiryController {
    private final MemberService memberService;
    private final InquiryRepository inquiryRepository;
    private final MemberRepository memberRepository;

    @GetMapping("/my")
    public ApiResponse<List<InquiryResponseDto>> getMyInquiries(@RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        List<Inquiry> inquiries = inquiryRepository.findByMemberOrderByCreatedAtDesc(member);

        List<InquiryResponseDto> dtos = inquiries.stream()
                .map(InquiryResponseDto::from)
                .collect(Collectors.toList());

        return ApiResponse.success("문의 내역 조회 성공", dtos);
    }

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

    @GetMapping("/admin/all")
    public ApiResponse<List<InquiryResponseDto>> getAllInquiries(@RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);

        if (!"ADMIN".equals(member.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다. 접근이 거부되었습니다.");
        }

        List<Inquiry> allInquiries = inquiryRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
        );

        List<InquiryResponseDto> dtos = allInquiries.stream()
                .map(InquiryResponseDto::from)
                .collect(Collectors.toList());

        return ApiResponse.success("전체 문의 조회 성공", dtos);
    }

    @PatchMapping("/admin/{id}/answer")
    @Transactional
    public ApiResponse<String> answerInquiry(@RequestHeader("Authorization") String token,
                                             @PathVariable Long id,
                                             @RequestBody String answerContent) {
        Member admin = memberService.getMemberEntityByToken(token);

        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다. 답변을 등록할 수 없습니다.");
        }

        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));

        inquiry.setAnswer(answerContent);
        inquiry.setAssignedTo(admin.getName());
        inquiry.setStatus("completed");
        inquiry.setRead(false);

        return ApiResponse.success("답변이 등록되었습니다.");
    }

    @PatchMapping("/admin/users/{userId}/warning/add")
    @Transactional
    public ApiResponse<String> addWarning(@RequestHeader("Authorization") String token,
                                          @PathVariable Long userId) {
        Member admin = memberService.getMemberEntityByToken(token);
        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다.");
        }

        Member target = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));

        int newCount = (target.getWarningCount() != null ? target.getWarningCount() : 0) + 1;
        target.setWarningCount(newCount);
        target.setWarningLevel(calcWarningLevel(newCount));

        return ApiResponse.success("경고가 추가되었습니다.");
    }

    @PatchMapping("/admin/users/{userId}/warning/reduce")
    @Transactional
    public ApiResponse<String> reduceWarning(@RequestHeader("Authorization") String token,
                                             @PathVariable Long userId) {
        Member admin = memberService.getMemberEntityByToken(token);
        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다.");
        }

        Member target = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));

        int newCount = Math.max(0, (target.getWarningCount() != null ? target.getWarningCount() : 0) - 1);
        target.setWarningCount(newCount);
        target.setWarningLevel(calcWarningLevel(newCount));

        return ApiResponse.success("경고가 감소되었습니다.");
    }

    @PatchMapping("/admin/users/{userId}/blacklist/remove")
    @Transactional
    public ApiResponse<String> removeBlacklist(@RequestHeader("Authorization") String token,
                                               @PathVariable Long userId) {
        Member admin = memberService.getMemberEntityByToken(token);
        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다.");
        }

        Member target = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));

        target.setWarningCount(0);
        target.setWarningLevel("normal");

        return ApiResponse.success("블랙리스트가 해제되었습니다.");
    }

    private String calcWarningLevel(int count) {
        if (count <= 0) return "normal";
        if (count == 1) return "warning";
        if (count == 2) return "danger";
        return "blacklist";
    }
}