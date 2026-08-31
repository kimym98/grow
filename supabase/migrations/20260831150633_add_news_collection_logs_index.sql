-- Task 024: 소스별 실패율 집계 시 news_collection_logs를 (source, created_at) 기준으로
-- 자주 조회하게 되는데, job_collection_logs에는 이미 동일한 인덱스가 있으나
-- news_collection_logs에는 없어 조회 성능을 위해 추가한다.
CREATE INDEX news_collection_logs_source_created_at_idx
  ON public.news_collection_logs USING btree (source, created_at DESC);
