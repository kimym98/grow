-- Task 036: 마이그레이션 20260902090609에서 이미 제거했던 resume_question/reviewed_text 컬럼이
-- 이후 20260902093410_remote_schema.sql(로컬/원격 스키마 비교 중 의도치 않게 생성된 diff 마이그레이션)로
-- 다시 추가되었다. 이미 원격에 적용된 마이그레이션 파일은 수정하지 않는 원칙에 따라, 새 마이그레이션으로
-- 두 컬럼을 다시 제거해 Task 036 의도(첨삭본·문항 입력 산출물 완전 제거)를 복원한다.
alter table public.document_reviews
  drop column if exists resume_question,
  drop column if exists reviewed_text;
