package com.aion.back.announcement.service;

import com.aion.back.announcement.dto.AnnouncementRequest;
import com.aion.back.announcement.dto.AnnouncementResponse;
import com.aion.back.announcement.entity.Announcement;
import com.aion.back.announcement.repository.AnnouncementRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final MemberService memberService;

    private void validateAdmin(String token) {
        Member member = memberService.getMemberEntityByToken(token);
        if (!"ADMIN".equals(member.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다.");
        }
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAll() {
        return announcementRepository.findAllByOrderByIsPinnedDescCreatedAtDesc()
                .stream()
                .map(AnnouncementResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementResponse create(String token, AnnouncementRequest req) {
        validateAdmin(token);

        Announcement announcement = Announcement.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .isPinned(req.getIsPinned() != null ? req.getIsPinned() : false)
                .isImportant(req.getIsImportant() != null ? req.getIsImportant() : false)
                .linkedEventId(req.getLinkedEventId())
                .build();

        return AnnouncementResponse.from(announcementRepository.save(announcement));
    }

    @Transactional
    public AnnouncementResponse update(String token, Long id, AnnouncementRequest req) {
        validateAdmin(token);

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));

        announcement.setTitle(req.getTitle());
        announcement.setContent(req.getContent());
        announcement.setStartDate(req.getStartDate());
        announcement.setEndDate(req.getEndDate());
        announcement.setIsPinned(req.getIsPinned() != null ? req.getIsPinned() : false);
        announcement.setIsImportant(req.getIsImportant() != null ? req.getIsImportant() : false);
        announcement.setLinkedEventId(req.getLinkedEventId());

        return AnnouncementResponse.from(announcement);
    }

    @Transactional
    public void delete(String token, Long id) {
        validateAdmin(token);

        if (!announcementRepository.existsById(id)) {
            throw new RuntimeException("공지사항을 찾을 수 없습니다.");
        }
        announcementRepository.deleteById(id);
    }
}