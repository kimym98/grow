-- 지원 기업 관리 도메인: application_documents 연결 테이블 신설
-- Task 049: 지원 기업별 제출 서류(이력서/포트폴리오) 보관
-- 기존 document_reviews(이력서/포트폴리오 PDF)를 재사용하면서 company_applications와 다대다로 연결한다.
-- 같은 이력서를 여러 기업에 제출하는 케이스를 지원하기 위해 문서를 복제 저장하지 않고 연결 테이블만 신설한다.

CREATE TABLE "public"."application_documents" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"            uuid                     NOT NULL,
  "application_id"     uuid                     NOT NULL,
  "document_review_id" uuid                     NOT NULL,
  "submitted_at"       date,
  "memo"               text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "application_documents_pkey" PRIMARY KEY (id),
  CONSTRAINT "application_documents_application_id_fkey"
    FOREIGN KEY (application_id) REFERENCES "public"."company_applications"(id) ON DELETE CASCADE,
  CONSTRAINT "application_documents_document_review_id_fkey"
    FOREIGN KEY (document_review_id) REFERENCES "public"."document_reviews"(id) ON DELETE CASCADE,
  CONSTRAINT "application_documents_unique" UNIQUE (application_id, document_review_id)
);

ALTER TABLE "public"."application_documents"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_documents_owner_select" ON "public"."application_documents"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "application_documents_owner_insert" ON "public"."application_documents"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "application_documents_owner_update" ON "public"."application_documents"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "application_documents_owner_delete" ON "public"."application_documents"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE INDEX "application_documents_user_id_idx" ON "public"."application_documents" USING btree (user_id);
CREATE INDEX "application_documents_application_id_idx" ON "public"."application_documents" USING btree (application_id);
CREATE INDEX "application_documents_document_review_id_idx" ON "public"."application_documents" USING btree (document_review_id);
