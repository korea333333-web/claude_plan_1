# 달새김 테스트 기준

## Sprint 1 완료 기준

### TC-1.1: 프로젝트 세팅 & 배포 파이프라인
- [ ] GitHub 리포지토리(`dalsaegim`)에 코드가 푸시되어 있음
- [ ] GitHub에 푸시하면 Vercel이 자동으로 빌드/배포됨
- [ ] Vercel 배포 URL에서 Next.js 기본 페이지가 정상 로딩됨
- [ ] Supabase 환경 변수가 Vercel에 등록되어 있음
- [ ] 로컬 `npm run dev`로 개발 서버가 정상 실행됨

### TC-1.2: 인증 (카카오 + 구글 로그인)
- [ ] 카카오 로그인 버튼 클릭 → 카카오 OAuth 화면 → 로그인 성공 → 앱으로 돌아옴
- [ ] 구글 로그인 버튼 클릭 → 구글 OAuth 화면 → 로그인 성공 → 앱으로 돌아옴
- [ ] 로그인 후 사용자 정보가 Supabase users 테이블에 저장됨
- [ ] 로그아웃 버튼 클릭 → 세션 종료 → 로그인 화면으로 이동
- [ ] 비로그인 상태에서 보호된 페이지 접근 시 로그인 화면으로 리다이렉트

### TC-1.3: DB 스키마
- [ ] users 테이블: id, email, name, provider, created_at
- [ ] anniversaries 테이블: id, user_id, name, date_type(lunar/solar), month, day, category, repeat_type, start_year, is_shared, created_at
- [ ] family_groups 테이블: id, name, owner_id, invite_code, created_at
- [ ] family_members 테이블: id, group_id, user_id, joined_at
- [ ] memos 테이블: id, anniversary_id, user_id, year, content, created_at
- [ ] notification_settings 테이블: id, user_id, channel_type, is_enabled, config, created_at
- [ ] Row Level Security(RLS) 정책이 적용되어, 본인 데이터만 조회/수정 가능

### TC-1.4: 음력 ↔ 양력 변환 엔진
- [ ] 음력 날짜 입력 → 특정 연도의 양력 날짜 반환 (정확도 검증)
- [ ] 양력 날짜 입력 → 음력 날짜 반환
- [ ] 검증 케이스: 2026년 설날(음력 1/1) = 양력 2/17 확인
- [ ] 검증 케이스: 2026년 추석(음력 8/15) = 양력 10/4 확인
- [ ] 윤달이 있는 해의 변환이 정상 동작
- [ ] 변환 속도 100ms 이내

### TC-1.5: D-Day 및 회차 계산
- [ ] 오늘 기준으로 다음 기념일까지 남은 일수 정확 계산
- [ ] 음력 기념일: 올해 양력 변환 후 D-Day 계산, 지났으면 내년 양력 변환
- [ ] 양력 기념일: 올해 날짜 기준, 지났으면 내년
- [ ] 시작 연도가 있는 기념일: 회차 자동 계산 (예: 1957년생 → 2026년 = 70세)
- [ ] 한국식 나이/만 나이 구분 가능

### TC-1.6: 기본 내장 기념일
- [ ] 설날, 추석, 석가탄신일, 정월대보름, 단오 데이터가 존재
- [ ] 각 내장 기념일의 2026년 양력 날짜가 정확함
- [ ] 내장 기념일은 신규 사용자 가입 시 자동 등록됨

---

## Sprint 2 완료 기준
> Sprint 2 시작 전에 작성합니다.

## Sprint 3 완료 기준
> Sprint 3 시작 전에 작성합니다.

## Sprint 4 완료 기준
> Sprint 4 시작 전에 작성합니다.

## Sprint 5 완료 기준
> Sprint 5 시작 전에 작성합니다.

## Sprint 6 완료 기준
> Sprint 6 시작 전에 작성합니다.
