package com.aion.back.point.service;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import com.aion.back.point.dto.response.PointBalanceResponse;
import com.aion.back.point.dto.response.PointHistoryResponse;
import com.aion.back.point.entity.Point;
import com.aion.back.point.repository.PointHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class PointService {

    private final PointHistoryRepository pointHistoryRepository;

    private final MemberRepository memberRepository;

    @Transactional

    public void usePoints(Member member, int pointsToUse, Long orderId) {
        if (pointsToUse <= 0) return;
        int currentBalance = member.getTotalPoints();
        if (currentBalance < pointsToUse) {
            throw new IllegalArgumentException("보유 포인트가 부족합니다. (보유: "
                    + currentBalance + "P, 요청: " + pointsToUse + "P)");
        }
        int balanceAfter = currentBalance - pointsToUse;
        Point useRecord = Point.builder()
                .member(member)
                .amount(-pointsToUse)
                .balanceAfter(balanceAfter)
                .reason("포인트 사용")
                .reasonDetail("주문 결제 포인트 차감 (주문 ID: " + orderId + ")")
                .relatedOrderId(orderId)
                .status(Point.PointStatus.USED)
                .usedAt(LocalDateTime.now())
                .build();
        pointHistoryRepository.save(useRecord);
        member.deductPoints(pointsToUse);
        memberRepository.save(member);
    }

    @Transactional

    public int earnPoints(Member member, int finalAmount, Long orderId) {
        int pointsToEarn = (int) Math.floor(finalAmount * 0.001);
        if (pointsToEarn <= 0) return 0;
        int currentBalance = member.getTotalPoints();
        int balanceAfter = currentBalance + pointsToEarn;
        Point earnRecord = Point.builder()
                .member(member)
                .amount(pointsToEarn)
                .balanceAfter(balanceAfter)
                .reason("주문 포인트 적립")
                .reasonDetail("결제 금액 ₩" + String.format("%,d", finalAmount)
                        + "의 0.1% 적립 (주문 ID: " + orderId + ")")
                .relatedOrderId(orderId)
                .status(Point.PointStatus.AVAILABLE)
                .expireAt(LocalDateTime.now().plusYears(1))
                .build();
        pointHistoryRepository.save(earnRecord);
        member.addPoints(pointsToEarn);
        memberRepository.save(member);
        return pointsToEarn;
    }

    @Transactional(readOnly = true)

    public List<PointHistoryResponse> getPointHistory(Long userId) {
        return pointHistoryRepository
                .findByMemberUserId(userId)
                .stream()
                .map(PointHistoryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)

    public PointBalanceResponse getBalance(Member member) {
        return PointBalanceResponse.of(member.getTotalPoints());
    }
}