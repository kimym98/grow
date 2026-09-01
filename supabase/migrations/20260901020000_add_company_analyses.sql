-- 지원 기업 관리 도메인: company_analyses 테이블 신설
-- Task 046: 지원 기업 LLM 분석 (analyze-company)

CREATE TABLE "public"."company_analyses" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"               uuid                     NOT NULL,
  "application_id"        uuid                     NOT NULL,
  "status"                text                     NOT NULL DEFAULT 'processing'::text,
  "summary"               text,
  "culture_fit"           text,
  "business_domain"       text,
  "tech_stack"            text,
  "expected_questions"    jsonb,
  "input_snapshot"        jsonb,
  "cache_key"             text,
  "error_message"         text,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "company_analyses_pkey" PRIMARY KEY (id),
  CONSTRAINT "company_analyses_status_check"
    CHECK ((status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text]))),
  CONSTRAINT "company_analyses_application_id_fkey"
    FOREIGN KEY (application_id) REFERENCES "public"."company_applications"(id) ON DELETE CASCADE
);

ALTER TABLE "public"."company_analyses"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_analyses_owner_select" ON "public"."company_analyses"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "company_analyses_owner_insert" ON "public"."company_analyses"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "company_analyses_owner_update" ON "public"."company_analyses"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "company_analyses_owner_delete" ON "public"."company_analyses"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE INDEX "company_analyses_user_id_idx" ON "public"."company_analyses" USING btree (user_id);
CREATE INDEX "company_analyses_application_id_idx" ON "public"."company_analyses" USING btree (application_id);
