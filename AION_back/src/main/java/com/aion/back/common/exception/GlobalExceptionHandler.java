package com.aion.back.common.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        Map<String, String> response = new HashMap<>();
        // 여기서 e.getMessage()가 "탈퇴 처리된 계정입니다..."를 담아서 나갑니다.
        response.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}