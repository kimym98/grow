-- 지원 기업 관리 도메인: company_applications 테이블 신설
-- Task 045: 지원 기업 도메인 스키마 신설 및 지원 상태 관리

CREATE TABLE "public"."company_applications" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"               uuid                     NOT NULL,
  "company_name"          text                     NOT NULL,
  "company_key"           text                     NOT NULL,
  "position"              text,
  "apply_url"             text,
  "applied_at"            date,
  "status"                text                     NOT NULL DEFAULT '준비중'::text,
  "memo"                  text,
  "source_job_posting_id" uuid,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "company_applications_pkey" PRIMARY KEY (id),
  CONSTRAINT "company_applications_status_check"
    CHECK ((status = ANY (ARRAY['준비중'::text, '서류제출'::text, '서류합격'::text, '테스트'::text, '면접'::text, '최종합격'::text, '탈락'::text]))),
  CONSTRAINT "company_applications_source_job_posting_id_fkey"
    FOREIGN KEY (source_job_posting_id) REFERENCES "public"."job_postings"(id) ON DELETE SET NULL
);

ALTER TABLE "public"."company_applications"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_applications_owner_select" ON "public"."company_applications"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "company_applications_owner_insert" ON "public"."company_applications"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "company_applications_owner_update" ON "public"."company_applications"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "company_applications_owner_delete" ON "public"."company_applications"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE INDEX "company_applications_user_id_idx" ON "public"."company_applications" USING btree (user_id);
CREATE INDEX "company_applications_status_idx" ON "public"."company_applications" USING btree (status);
CREATE INDEX "company_applications_company_key_idx" ON "public"."company_applications" USING btree (company_key);
