# 달새김 (DalSaeGim) 프로젝트 컨텍스트

## 프로젝트 개요

"달새김"은 음력/양력 기념일을 등록하면 자동으로 양력 변환하고 미리 알림을 보내주는 웹앱이다.
기존 음력 앱들이 "달력 펼쳐서 찾아라"였다면, 달새김은 "내가 찾을 필요 없이 알아서 알려준다"가 핵심.

## 개발 방식

이 프로젝트는 3-Agent Harness 방식으로 개발한다.

- PLAN.md: 전체 기획 문서
- SPRINT_PLAN.md: 스프린트 계획
- TEST_CRITERIA.md: 스프린트별 완료 기준
- 코드 작성 전 반드시 해당 스프린트의 완료 기준을 확인할 것
- 코드 작성 후 반드시 테스트를 실행하고 통과 여부를 보고할 것

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 스타일링 | Tailwind CSS |
| 백엔드/DB | Supabase (PostgreSQL, Auth, Edge Functions) |
| 인증 | 카카오 로그인 + 구글 로그인 (Supabase Auth) |
| 음력 변환 | korean-lunar-calendar |
| 알림 | 카카오 REST API, Telegram Bot API, Google Calendar API |
| 버전 관리 | GitHub (프라이빗 리포) |
| 배포 | Vercel (GitHub 연동 자동 배포) |

## 개발/배포 파이프라인

```
로컬 개발 → GitHub Push (main) → Vercel 자동 빌드/배포
                                        ↕
                                  Supabase DB/Auth
```

- GitHub 리포: `dalsaegim` (프라이빗)
- Vercel: GitHub 리포 연결, main 브랜치 푸시 시 자동 배포
- Supabase: 환경 변수로 Vercel에 연결, DB 마이그레이션은 Supabase CLI

## 프로젝트 구조

```
dalsaegim/
├── CLAUDE.md
├── PLAN.md
├── SPRINT_PLAN.md
├── TEST_CRITERIA.md
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 (다가오는 기념일 목록)
│   │   ├── add/page.tsx          # 기념일 등록
│   │   ├── edit/[id]/page.tsx    # 기념일 수정
│   │   ├── calendar/page.tsx     # 달력 보기
│   │   ├── converter/page.tsx    # 음력↔양력 변환기
│   │   ├── settings/page.tsx     # 설정
│   │   ├── family/page.tsx       # 가족 그룹 관리
│   │   ├── invite/[code]/page.tsx # 초대 수락
│   │   ├── login/page.tsx        # 로그인
│   │   └── api/
│   │       ├── cron/notify/route.ts  # 알림 스케줄러
│   │       ├── auth/kakao/route.ts   # 카카오 OAuth
│   │       └── invite/route.ts       # 초대 링크 API
│   ├── components/               # 공통 컴포넌트
│   └── lib/
│       ├── supabase.ts           # Supabase 클라이언트
│       ├── lunar.ts              # 음력 변환 유틸리티
│       ├── anniversary.ts        # 기념일 비즈니스 로직
│       └── notifications/
│           ├── kakao.ts          # 카카오 알림
│           ├── telegram.ts       # 텔레그램 알림
│           └── google-calendar.ts # 구글 캘린더
├── supabase/
│   └── migrations/               # DB 마이그레이션
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## 규칙

1. 한 번에 하나의 스프린트만 진행
2. 테스트 통과 없이 다음 스프린트로 넘어가지 않음
3. UI 디자인은 AI 특유의 뻔한 패턴(보라색 그라데이션, 흰 카드)을 피함 — 미니멀하되 한눈에 정보 파악 가능한 디자인
4. 에러 발생 시 로그를 직접 읽고 분석 후 수정
5. 한글 파일명 및 한글 데이터 처리에 주의
6. 음력 변환 정확도를 항상 검증 (한국천문연구원 데이터 기준)
7. GitHub에 푸시할 때 환경 변수(.env)가 포함되지 않도록 주의

## 명령어

```bash
# 개발
npm run dev          # 로컬 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # 린트 검사

# Git
git add .
git commit -m "메시지"
git push origin main  # → Vercel 자동 배포 트리거

# Supabase
npx supabase init           # 초기 설정
npx supabase db push         # 마이그레이션 적용
npx supabase gen types       # TypeScript 타입 생성
```
