-- Task 026: document_reviews 워치독
-- review-document Edge Function이 강제 종료/크래시되어 정상 catch 경로(status='failed' 전환)를
-- 타지 못하는 경우, document_reviews.status='processing'이 영구히 남을 수 있다.
-- pg_cron으로 주기 실행되는 SQL이 처리 시간이 임계치(10분)를 넘긴 processing 레코드를
-- failed로 전환하고, review-document/index.ts의 catch 블록과 동일한 셰이프로
-- versions(jsonb)에 실패 로그를 append한다.
--
-- 임계 시간(10분)/실행 주기(5분)는 전체 재시도 예산(90초, Task 026 별도 작업)보다
-- 충분히 여유를 둔 값이다.
SELECT cron.schedule_in_database('document-reviews-watchdog', '*/5 * * * *', '
  update public.document_reviews
  set
    status = ''failed'',
    versions = versions || jsonb_build_object(
      ''version'', version,
      ''createdAt'', now(),
      ''summary'', ''첨삭 실패: 처리 시간 초과(워치독)''
    )
  where status = ''processing''
    and updated_at < now() - interval ''10 minutes'';
  ', 'postgres', NULL, true);
