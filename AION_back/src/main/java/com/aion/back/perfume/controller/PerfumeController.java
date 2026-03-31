package com.aion.back.perfume.controller;

import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.service.PerfumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfumes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PerfumeController {

    private final PerfumeService perfumeService;

    @GetMapping
    public ResponseEntity<Page<Perfume>> getPerfumes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Perfume> perfumes = perfumeService.getPerfumes(pageable);
        return ResponseEntity.ok(perfumes);
    }

    @GetMapping("/{perfumeId}")
    public ResponseEntity<Perfume> getPerfumeDetail(@PathVariable Long perfumeId) {
        Perfume perfume = perfumeService.getPerfumeDetail(perfumeId);
        return ResponseEntity.ok(perfume);
    }

    @PostMapping
    public ResponseEntity<Perfume> createPerfume(@RequestBody Perfume perfume) {
        Perfume saved = perfumeService.savePerfume(perfume);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{perfumeId}")
    public ResponseEntity<Void> deletePerfume(@PathVariable Long perfumeId) {
        perfumeService.deletePerfume(perfumeId);
        return ResponseEntity.ok().build();
    }
}