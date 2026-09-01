-- 지원 기업 관리 도메인: cover_letter_questions 피드백 컬럼 추가
-- Task 048: 기업 분석 기반 자소서 피드백 (feedback-cover-letter-question)

ALTER TABLE "public"."cover_letter_questions"
  ADD COLUMN "feedback_status" text NOT NULL DEFAULT 'idle'::text,
  ADD COLUMN "feedback_text" text,
  ADD COLUMN "feedback_error_message" text,
  ADD COLUMN "feedback_generated_at" timestamp with time zone;

ALTER TABLE "public"."cover_letter_questions"
  ADD CONSTRAINT "cover_letter_questions_feedback_status_check"
    CHECK ((feedback_status = ANY (ARRAY['idle'::text, 'processing'::text, 'completed'::text, 'failed'::text])));
