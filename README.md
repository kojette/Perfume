## 1. 목차
- [1. 프로젝트 개요](#1-목차)
- [2. 사용 클라우드 및 서비스](#2-사용-클라우드-및-서비스)
- [3. 기능 구성도](#3-기능-구성도---docs)
- [4. API 명세서](#4-api-명세서---docs)
- [5. 코드 (Source Code)](#5-code---aion_front-aion_back-aion_mobile)
- [6. 앱 등록 및 설치](#6-앱-등록)
- [7. 시연 동영상](#7-시연-동영상)
- [8. 프로젝트 평가 및 비교](#8-우리팀-평가)

## 2. 사용 클라우드 및 서비스
| AWS | [http://aion-perfume.kro.kr](http://aion-frontend-967283278741-ap-northeast-2-an.s3-website.ap-northeast-2.amazonaws.com/) |
| Superbase | [http://aion-perfume.kro.kr](https://supabase.com/) |

## 3. 기능 구성도 
<details>
<summary>기능구성도 보기</summary>
<img width="636" height="702" alt="1" src="https://github.com/user-attachments/assets/722cc042-801b-470a-bb22-fdfe66d44673" />
<img width="752" height="892" alt="2" src="https://github.com/user-attachments/assets/84a1271d-d0b5-4a0b-addf-638f5474481e" />
<img width="442" height="287" alt="s" src="https://github.com/user-attachments/assets/5e93cb7a-04b7-44ab-947d-fb2fcb83cb21" />
</details>

## 4. API 명세서 
<details>
<summary>API 명세서 보기
인증
		
POST	/api/auth/login-record	로그인 기록 저장

회원
		
POST	/api/members/register	회원가입
GET	/api/members/profile	내 프로필 조회
PUT	/api/members/profile	프로필 수정
DELETE	/api/members/account	회원 탈퇴

향수
		
GET	/api/perfumes	향수 목록 조회
GET	/api/perfumes/{perfumeId}	향수 상세 조회
GET	/api/recommendations	향수 추천 목록 (필터/검색/정렬)
GET	/api/recommendations/{perfumeId}	향수 추천 상세
GET	/api/recommendations/category/{category}	카테고리별 추천
GET	/api/recommendations/age/{age}	연령대별 추천
GET	/api/collections/perfumes/{perfumeId}/notes	향수 노트 정보 조회
POST	/api/restock/notify	재입고 알림 신청






커스텀 디자인
		
GET	/api/custom/designs	내 커스텀 디자인 목록 조회
POST	/api/custom/designs	커스텀 디자인 저장
DELETE	/api/custom/designs/{designId}	커스텀 디자인 삭제

향 조합
		
GET	/api/custom/scents	향 원료 목록 조회
GET	/api/custom/scent-blends	내 향 조합 목록 조회
POST	/api/custom/scent-blends	향 조합 저장
DELETE	/api/custom/scent-blends/{blendId}	향 조합 삭제
POST	/api/cart/scent-blend	향 조합 장바구니 추가

시그니처 향수
		
GET	/api/signature	시그니처 향수 목록 조회
POST	/api/signature	시그니처 향수 등록
GET	/api/signature/active	활성 시그니처 향수 조회
PATCH	/api/signature/{id}/active	시그니처 향수 활성화
DELETE	/api/signature/{id}	시그니처 향수 삭제






장바구니
		
GET	/api/cart	장바구니 조회
POST	/api/cart/add	일반 상품 장바구니 추가
POST	/api/cart/custom	커스텀 디자인 장바구니 추가
POST	/api/cart/scent-blend	향 조합 장바구니 추가
PATCH	/api/cart/{itemId}	장바구니 수량 변경
DELETE	/api/cart/{itemId}	장바구니 항목 삭제

위시리스트
		
GET	/api/wishlist	위시리스트 조회
POST	/api/wishlist/toggle	위시리스트 토글 (추가/제거)
DELETE	/api/wishlist/{wishlistId}	위시리스트 항목 삭제

주문 
		
POST	/api/orders/checkout	주문 결제
GET	/api/orders/my	내 주문 목록 조회
GET	/api/orders/{orderId}	주문 상세 / 배송 추적
POST	/api/orders/return-exchange	반품/교환 신청






쿠폰 / 포인트 
		
GET	/api/coupons/my	내 쿠폰 목록 조회
POST	/api/coupons/register	쿠폰 등록
GET	/api/points/balance	포인트 잔액 조회
GET	/api/points/history	포인트 적립/사용 내역 조회

문의
		
GET	/api/inquiries/my	내 문의 목록 조회
POST	/api/inquiries	문의 등록
PATCH	/api/inquiries/{inquiryId}/read	문의 읽음 처리
DELETE	/api/inquiries/{inquiryId}/cancel	문의 취소
GET	/api/inquiries/admin/all	전체 문의 목록 (어드민)
PATCH	/api/inquiries/admin/{inquiryId}/answer	문의 답변 (어드민)
PATCH	/api/inquiries/admin/users/{userId}/warning/add	경고 부여 (어드민)
PATCH	/api/inquiries/admin/users/{userId}/warning/reduce	경고 감소 (어드민)
PATCH	/api/inquiries/admin/users/{userId}/blacklist/remove	블랙리스트 해제 (어드민)

공지사항 
		
GET	/api/announcements	공지사항 목록 조회
POST	/api/announcements	공지사항 작성 (어드민)
PUT	/api/announcements/{id}	공지사항 수정 (어드민)
DELETE	/api/announcements/{id}	공지사항 삭제 (어드민)


이벤트 
		
POST	/api/events/{eventId}/participate	이벤트 참여

스토리
		
GET	/api/stories/public	공개 스토리 목록 조회
GET	/api/stories/admin	전체 스토리 목록 (어드민)
PUT	/api/stories/{id}	스토리 수정 (어드민)
DELETE	/api/stories/{id}	스토리 삭제 (어드민)

검색
		
GET	/api/search/functions?keyword={keyword}	키워드 검색

AI
		
POST	/api/ai/image-to-scent	이미지 기반 향수 추천 (Gemini)
POST	/api/ai/gemini-evaluate	향 조합 AI 평가 (Gemini)
POST	/api/ai/gemini-scent-card	AI 향 카드 생성 (Gemini)
POST	/api/ai/claude-blend	향 조합 AI 설계 (Claude)





관리자 - 통계
		
GET	/api/admin/stats/summary	통계 요약
GET	/api/admin/stats/revenue/daily	일별 매출
GET	/api/admin/stats/perfumes	향수별 통계
GET	/api/admin/stats/perfumes/low-conversion	낮은 전환율 향수
GET	/api/admin/stats/ingredients	원료별 통계
GET	/api/admin/stats/brands	브랜드별 통계
GET	/api/admin/stats/customers/segments	고객 세그먼트
GET	/api/admin/stats/customers/demographics	고객 인구통계

관리자 - 쿠폰
		
POST	/api/admin/coupons	쿠폰 생성

관리자 - 재고
		
POST	/api/admin/stock/receive	재고 입고 처리

관리자 - 공병
		
GET	/api/custom/bottles	공병 목록 조회
GET	/api/custom/bottles/all	전체 공병 목록 조회
POST	/api/custom/bottles	공병 추가
PATCH	/api/custom/bottles/{bottleId}/toggle	공병 활성/비활성 토글
DELETE	/api/custom/bottles/{bottleId}	공병 삭제

</summary>

</details>
  
## 5. 코드
- [안드로이드](https://github.com/kojette/Perfume/tree/main/AION_mobile)
- [아이폰](https://github.com/kojette/Perfume/tree/main/AION_mobile)
- [리액트](https://github.com/kojette/Perfume/tree/main/AION_front)
- [백엔드](https://github.com/kojette/Perfume/tree/main/AION_back)
  
## 6. 앱 등록
App Store: [앱 링크]

## 7. 시연 동영상

- <img src="https://cdn-icons-png.flaticon.com/512/727/727245.png" width="18"/> 
  [안드로이드 시연 영상](https://youtu.be/q0Ugg9oJQJ8?si=mrcNaLWR9QJVmVOQ)

- <img src="https://cdn-icons-png.flaticon.com/512/727/727245.png" width="18"/> 
  [아이폰 시연 영상] https://youtu.be/RT6HO9mhY6w

- <img src="https://cdn-icons-png.flaticon.com/512/727/727245.png" width="18"/> 
  [리액트(PC) 시연 영상] https://youtu.be/FsEHbaUkvWA

- <img src="https://cdn-icons-png.flaticon.com/512/727/727245.png" width="18"/> 
  [리액트(모바일) 시연 영상] https://youtu.be/gKQLfjE2-Ps

## 8. 우리팀 평가
## 2025 우수팀 vs AION 비교

| 구분 | 황치즈 (최우수) | 황금토끼 (우수1) | 초신성 (우수2) | Prism (우수3) | **AION (우리)** |
|---|---|---|---|---|---|
| **주제** | 영상 요약 시스템 | 도메인 QA 자동 생성 프레임워크 | 정보 미공개 | 청각장애인 언어 학습 플랫폼 | **AI 향수 커머스 플랫폼** |
| **핵심 기술** | AI 영상 처리, 가중치 알고리즘 | GraphRAG, 지식그래프, 크롤링 | — | KoSpeech2(STT), Librosa, GPT 피드백 | **Claude SSE 스트리밍, Gemini 멀티모달, 실시간 조향 추론** |
| **AI 활용** | 영상 분석 모델 | OpenAI LLM (GraphRAG) | — | OpenAI GPT (텍스트 평가) | **Claude+Gemini 듀얼 LLM 협업, 이미지→향 매핑** |
| **플랫폼** | 반응형 웹 | 웹 (React+Flask) | — | 웹 (React+Spring+Flask) | **웹 + Flutter 모바일 (크로스 플랫폼)** |
| **사용자 인터랙션** | 비율 슬라이더 1개 | 자연어 질의응답 | — | 녹음 → 시각 피드백 | **공병 디자이너 (10가지 모양·그림판·스티커·각인), AI 채팅, 슬라이더 실시간 평가** |
| **커머스 요소** | 없음 | 없음 | — | 없음 | **장바구니/주문/결제/위시리스트/관리자 대시보드** |
| **차별성** | 알고리즘 비율 조절 | URL만으로 자동화 | — | 시각 피드백 특화 | **AI + 커스터마이징 + 풀스택 커머스 통합** |
| **기술 스택 폭** | JS/Python | React/Python/Flask | — | JS/Java/Python | **JS/Java(17)/Python/Dart, Supabase, 실시간 SSE** |
