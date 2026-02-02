package com.aion.back.perfume.service;

import com.aion.back.perfume.entity.*;
import com.aion.back.perfume.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerfumeService {

    private final PerfumeRepository perfumeRepository;

    /**
     * 향수 목록 조회 (기본)
     */
    public Page<Perfume> getPerfumes(Pageable pageable) {
        return perfumeRepository.findAll(pageable);
    }

    /**
     * 향수 상세 조회
     */
    public Perfume getPerfumeDetail(Long perfumeId) {
        return perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new RuntimeException("향수를 찾을 수 없습니다."));
    }

    /**
     * 향수 저장
     */
    @Transactional
    public Perfume savePerfume(Perfume perfume) {
        return perfumeRepository.save(perfume);
    }

    /**
     * 향수 삭제
     */
    @Transactional
    public void deletePerfume(Long perfumeId) {
        perfumeRepository.deleteById(perfumeId);
    }
}