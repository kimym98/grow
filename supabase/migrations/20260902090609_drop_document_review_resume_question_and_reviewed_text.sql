-- Task 036: 업로드 문서 유형 2종(이력서/포트폴리오) 한정 및 첨삭본 산출물 제거
-- resume_question(자소서 문항 입력)과 reviewed_text(전체 첨삭본)는 더 이상 생성되지 않으므로 컬럼을 제거한다.
-- type CHECK 제약은 이미 resume/portfolio 2종만 허용하므로 별도 변경이 필요 없다.
alter table public.document_reviews
  drop column if exists resume_question,
  drop column if exists reviewed_text;
