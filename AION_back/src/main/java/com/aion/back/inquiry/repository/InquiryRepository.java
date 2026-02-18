package com.aion.back.inquiry.repository;

import com.aion.back.inquiry.entity.Inquiry;
import com.aion.back.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByMemberOrderByCreatedAtDesc(Member member);
}
