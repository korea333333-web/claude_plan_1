-- 1. anniversaries 테이블에 alarms JSONB 컬럼 추가
ALTER TABLE anniversaries
ADD COLUMN IF NOT EXISTS alarms jsonb
DEFAULT '[{"enabled":true,"daysBefore":7,"hour":9,"minute":0},{"enabled":true,"daysBefore":3,"hour":9,"minute":0},{"enabled":true,"daysBefore":0,"hour":9,"minute":0}]'::jsonb;

-- 2. 알림 발송 기록 테이블 (중복 발송 방지)
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anniversary_id uuid NOT NULL REFERENCES anniversaries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  alarm_index integer NOT NULL,        -- 0=1차, 1=2차, 2=3차
  target_date date NOT NULL,           -- 기념일 양력 날짜
  channel text NOT NULL CHECK (channel IN ('telegram', 'google_calendar')),
  sent_at timestamptz DEFAULT now(),
  UNIQUE(anniversary_id, alarm_index, target_date, channel)
);

-- 인덱스: 크론잡이 빠르게 조회할 수 있도록
CREATE INDEX IF NOT EXISTS idx_notification_log_lookup
ON notification_log(anniversary_id, target_date, channel);

-- RLS (서비스 클라이언트로만 접근)
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
