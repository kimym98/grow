-- Task 037: 이력서/포트폴리오 예상 면접 질문 저장 컬럼 추가
-- LLM 분석 결과의 코멘트(comments)와 동일한 jsonb 배열 패턴으로 저장한다.
alter table public.document_reviews
  add column interview_questions jsonb not null default '[]'::jsonb;
