# 달새김 스프린트 계획

## 개발 원칙
- 한 번에 하나의 스프린트만 진행
- 각 스프린트 완료 기준을 통과해야 다음으로 이동
- 스프린트마다 실행 가능한 결과물이 나와야 함

## 개발/배포 워크플로우
```
로컬 개발 → GitHub Push → Vercel 자동 배포 → Supabase 연동
```
- 코드 변경 → GitHub main 브랜치 푸시 → Vercel이 자동 빌드/배포
- DB 스키마 변경 → Supabase CLI로 마이그레이션 적용

---

## Sprint 1: 기반 구축 (Foundation)

**목표:** 프로젝트 세팅, 인증, DB 스키마, 음력 변환 엔진 구축

**구현 항목:**
- GitHub 리포지토리 생성 (`dalsaegim`, 프라이빗)
- Next.js 14 프로젝트 초기 세팅 (App Router, Tailwind CSS)
- Vercel 프로젝트 생성 및 GitHub 리포 연결 (자동 배포 설정)
- Supabase 프로젝트 생성 및 Vercel 환경 변수 등록
- Supabase 프로젝트 연결 및 DB 스키마 설계
  - users 테이블
  - anniversaries 테이블 (음력/양력 구분, 반복 주기, 카테고리)
  - family_groups 테이블
  - family_members 테이블
  - memos 테이블
  - notification_settings 테이블
- Supabase Auth 설정 (카카오 로그인 + 구글 로그인)
- 음력 ↔ 양력 변환 유틸리티 함수 구현 (korean-lunar-calendar 활용)
- 기본 내장 기념일 데이터 (설날, 추석, 석가탄신일, 정월대보름, 단오)
- D-Day 계산 함수
- 회차 계산 함수 (나이/주년 자동 계산)

**산출물:**
- `/src/lib/lunar.ts` — 음력 변환 유틸리티
- `/src/lib/supabase.ts` — Supabase 클라이언트
- `/src/lib/anniversary.ts` — 기념일 관련 비즈니스 로직
- `/supabase/migrations/` — DB 마이그레이션 파일
- 로그인/로그아웃 동작 확인

---

## Sprint 2: 핵심 UI (Core Interface)

**목표:** 메인 화면, 기념일 등록/수정/삭제, 기본 내장 기념일 표시

**구현 항목:**
- 메인 화면: 다가오는 기념일 목록
  - 월별 그룹핑
  - D-Day 카운트다운 표시
  - 회차 표시 (칠순, 10주년 등)
  - 음력 기념일은 양력 변환 날짜 병기
- 기념일 등록 화면
  - 음력/양력 선택
  - 카테고리 선택 (생일, 제사, 기념일, 기타)
  - 반복 주기 (매년, 매달, 일회성)
  - 시작 연도 입력 (회차 계산용)
  - 알림 시점 설정 (3회)
- 기념일 상세/수정/삭제
- 기본 내장 기념일 표시 (on/off 가능)
- 하단 탭 네비게이션 (홈, 달력, 변환, 설정)
- 모바일 우선 반응형 레이아웃

**산출물:**
- `/src/app/page.tsx` — 메인 화면
- `/src/app/add/page.tsx` — 기념일 등록
- `/src/app/edit/[id]/page.tsx` — 기념일 수정
- `/src/components/` — 공통 컴포넌트
- 모바일/데스크톱 반응형 완성

---

## Sprint 3: 달력 & 변환기 (Calendar & Converter)

**목표:** 보조 기능인 달력 보기와 음력↔양력 변환기 구현

**구현 항목:**
- 달력 보기 화면
  - 월별 달력 그리드
  - 각 날짜에 음력 날짜 작게 표시
  - 등록된 기념일 하이라이트 + 이름 표시
  - 이전/다음 월 이동
  - 날짜 클릭 시 해당일 기념일 상세 보기
- 음력 ↔ 양력 간편 변환기
  - 음력 → 양력 변환
  - 양력 → 음력 변환
  - 연도 지정 가능
  - 변환 결과 즉시 표시

**산출물:**
- `/src/app/calendar/page.tsx` — 달력 화면
- `/src/app/converter/page.tsx` — 변환기 화면
- `/src/components/Calendar.tsx` — 달력 컴포넌트

---

## Sprint 4: 알림 시스템 (Notifications)

**목표:** 카카오톡, 텔레그램, 구글 캘린더 알림 연동

**구현 항목:**
- 알림 설정 화면
  - 채널별 연결/해제 UI
  - 기본 알림 시점 설정 (1차, 2차, 3차)
- 카카오톡 "나에게 보내기" 연동
  - Kakao REST API 연결
  - OAuth 토큰 관리 (갱신 포함)
  - 알림 메시지 템플릿 설계
- 텔레그램 봇 연동
  - 봇 생성 및 사용자 연결 플로우
  - 메시지 발송 기능
- 구글 캘린더 연동
  - Google OAuth 인증
  - 기념일 일정 자동 등록/갱신
- 스케줄러 구축
  - Vercel Cron 또는 Supabase Edge Function
  - 매일 알림 대상 체크
  - 채널별 알림 발송

**산출물:**
- `/src/app/settings/page.tsx` — 설정 화면
- `/src/lib/notifications/kakao.ts` — 카카오 알림
- `/src/lib/notifications/telegram.ts` — 텔레그램 알림
- `/src/lib/notifications/google-calendar.ts` — 구글 캘린더
- `/src/app/api/cron/notify/route.ts` — 알림 스케줄러
- `/src/app/api/auth/kakao/route.ts` — 카카오 OAuth

---

## Sprint 5: 가족 공유 & 메모 (Social & Memo)

**목표:** 가족 그룹, 초대, 공유 기념일, 메모 기능 완성

**구현 항목:**
- 가족 그룹 생성
- 카카오톡 초대 링크 생성 및 공유
- 초대 수락 플로우
- 공유 기념일 vs 개인 기념일 구분
- 그룹 내 기념일 동기화 (한 명이 등록 → 전원 알림)
- 기념일별 메모 CRUD
- 연도별 메모 히스토리 보기
- 가족 그룹 관리 (멤버 보기, 나가기)

**산출물:**
- `/src/app/family/page.tsx` — 가족 그룹 관리
- `/src/app/invite/[code]/page.tsx` — 초대 수락 페이지
- `/src/components/Memo.tsx` — 메모 컴포넌트
- `/src/app/api/invite/route.ts` — 초대 링크 API

---

## Sprint 6: 마무리 & 배포 (Polish & Deploy)

**목표:** UI 다듬기, 테스트, 성능 최적화, Vercel 배포

**구현 항목:**
- UI/UX 전체 점검 및 다듬기
  - 로딩 상태, 에러 상태 처리
  - 빈 화면 안내 (기념일 없을 때)
  - 애니메이션/트랜지션
- 반응형 최종 점검 (320px ~ 1440px)
- SEO 메타 태그
- PWA 설정 (홈 화면 추가 가능)
- 성능 최적화 (이미지, 번들 사이즈)
- Vercel 배포
- 도메인 연결 (선택)
- 최종 QA

**산출물:**
- 배포된 프로덕션 URL
- PWA manifest
- 성능 리포트

---

## 중요 제약사항

1. **음력 변환 정확도**: korean-lunar-calendar 라이브러리의 지원 범위 확인 필요 (보통 1900~2100년)
2. **카카오 API 토큰**: 사용자 토큰은 유효기간이 있으므로 갱신 로직 필수
3. **Supabase 무료 티어 한계**: 500MB DB, 2GB 파일 스토리지, 50K MAU
4. **Vercel Cron 무료 티어**: 하루 1회 실행 제한 → 알림 시각 정밀도에 영향
5. **윤달 처리**: 음력 윤달이 있는 해의 기념일 처리 로직 주의 필요
