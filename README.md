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
<summary>기능구성도 보기(▶ 기호 클릭하면 내용이 펼쳐집니다.)</summary>
<img width="636" height="702" alt="1" src="https://github.com/user-attachments/assets/722cc042-801b-470a-bb22-fdfe66d44673" />
<img width="752" height="892" alt="2" src="https://github.com/user-attachments/assets/84a1271d-d0b5-4a0b-addf-638f5474481e" />
<img width="442" height="287" alt="s" src="https://github.com/user-attachments/assets/5e93cb7a-04b7-44ab-947d-fb2fcb83cb21" />
</details>

## 4. API 명세서
<details>
<summary> API 명세서 전체 보기(▶ 기호 클릭하면 내용이 펼쳐집니다.)</summary>

### 🔐 인증 및 회원
| 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login-record` | 로그인 기록 저장 |
| `POST` | `/api/members/register` | 회원가입 |
| `GET` | `/api/members/profile` | 내 프로필 조회 |
| `PUT` | `/api/members/profile` | 프로필 수정 |
| `DELETE` | `/api/members/account` | 회원 탈퇴 |

### 🧴 향수 및 추천
| 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- |
| `GET` | `/api/perfumes` | 향수 목록 조회 |
| `GET` | `/api/perfumes/{perfumeId}` | 향수 상세 조회 |
| `GET` | `/api/recommendations` | 향수 추천 목록 (필터/검색/정렬) |
| `GET` | `/api/recommendations/category/{category}` | 카테고리별 추천 |
| `POST` | `/api/restock/notify` | 재입고 알림 신청 |

### 🎨 커스텀 및 AI 서비스
| 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- |
| `POST` | `/api/custom/designs` | 커스텀 디자인 저장 |
| `POST` | `/api/custom/scent-blends` | 향 조합 저장 |
| `POST` | `/api/ai/image-to-scent` | **Gemini** 이미지 기반 향수 추천 |
| `POST` | `/api/ai/gemini-evaluate` | **Gemini** 향 조합 AI 평가 |
| `POST` | `/api/ai/claude-blend` | **Claude** 향 조합 AI 설계 |

### 🛒 쇼핑 (장바구니/주문/위시)
| 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- |
| `GET` | `/api/cart` | 장바구니 조회 |
| `POST` | `/api/orders/checkout` | 주문 결제 |
| `POST` | `/api/wishlist/toggle` | 위시리스트 토글 |
| `GET` | `/api/points/balance` | 포인트 잔액 조회 |

### 🛠 관리자 기능
| 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats/summary` | 통계 요약 (매출/전환율) |
| `PATCH` | `/api/inquiries/admin/{id}/answer` | 1:1 문의 답변 |
| `POST` | `/api/admin/stock/receive` | 재고 입고 처리 |

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

| 항목 | 🌟 AION | 🏆 최우수 | 🥈 우수 1 | 🥉 우수 2 | 🏅 우수 3 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Code** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Doc** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **영상** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **화면** | iOS / Android / Web | Web | Web | Web | Web |
| **AppStore/GooglePlay** | ✅ | ❌ | ❌ | ❌ | ❌ |

최우수: 황치즈https://github.com/HwangCheese/VideoSummary

우수1: 황금토끼 https://github.com/GolddBunny/Domain_QA_Gen

우수2: 초신성 https://github.com/kola0709/2025Capstone/tree/master

우수3: Prism https://github.com/hsu-capstone-prism/DamSeol

