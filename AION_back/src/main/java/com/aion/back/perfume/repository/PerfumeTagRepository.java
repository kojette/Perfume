package com.aion.back.perfume.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// PerfumeTag 엔티티가 만들어지면 활성화
// @Repository
// public interface PerfumeTagRepository extends JpaRepository<PerfumeTag, Long> {
//     List<PerfumeTag> findByPerfume(Perfume perfume);
// }

// 임시 더미 Repository - 엔티티 준비 전까지 비활성화
// @Repository
// public interface PerfumeTagRepository extends JpaRepository<Object, Long> {
// }