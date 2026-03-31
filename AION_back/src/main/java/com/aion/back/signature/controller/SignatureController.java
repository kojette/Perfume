package com.aion.back.signature.controller;
import com.aion.back.common.response.ApiResponse;
import com.aion.back.signature.dto.SignatureDetailResponse;
import com.aion.back.signature.dto.SignatureSaveRequest;
import com.aion.back.signature.dto.SignatureSummaryResponse;
import com.aion.back.signature.service.SignatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;
@RestController
@RequestMapping("/api/signature")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SignatureController {

    private final SignatureService signatureService;

    @GetMapping

    public ApiResponse<List<SignatureSummaryResponse>> getList(
            @RequestHeader("Authorization") String token) {
        return ApiResponse.success("시그니처 목록 조회 성공", signatureService.getList(token));
    }

    @GetMapping("/active")

    public ApiResponse<SignatureDetailResponse> getActive() {
        SignatureDetailResponse data = signatureService.getActive();
        if (data == null) {
            return ApiResponse.success("활성 시그니처 없음", null);
        }
        return ApiResponse.success("활성 시그니처 조회 성공", data);
    }

    @GetMapping("/{id}")

    public ApiResponse<SignatureDetailResponse> getDetail(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id) {
        return ApiResponse.success("시그니처 상세 조회 성공", signatureService.getDetail(token, id));
    }

    @PostMapping

    public ApiResponse<SignatureDetailResponse> create(
            @RequestHeader("Authorization") String token,
            @RequestBody SignatureSaveRequest request) {
        return ApiResponse.success("시그니처 생성 성공", signatureService.create(token, request));
    }

    @PutMapping("/{id}")

    public ApiResponse<SignatureDetailResponse> update(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id,
            @RequestBody SignatureSaveRequest request) {
        return ApiResponse.success("시그니처 수정 성공", signatureService.update(token, id, request));
    }

    @PatchMapping("/{id}/active")

    public ApiResponse<String> toggleActive(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id,
            @RequestParam boolean activate) {
        signatureService.toggleActive(token, id, activate);
        return ApiResponse.success(activate ? "활성화 성공" : "비활성화 성공", null);
    }

    @DeleteMapping("/{id}")

    public ApiResponse<String> delete(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id) {
        signatureService.delete(token, id);
        return ApiResponse.success("삭제 성공", "삭제되었습니다.");
    }
}