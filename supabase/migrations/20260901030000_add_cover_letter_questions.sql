-- 지원 기업 관리 도메인: cover_letter_questions 테이블 신설
-- Task 047: 자소서 문항 등록·관리

CREATE TABLE "public"."cover_letter_questions" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "application_id" uuid                     NOT NULL,
  "order_index"    integer                  NOT NULL DEFAULT 0,
  "question_text"  text                     NOT NULL,
  "char_limit"     integer,
  "answer_text"    text,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cover_letter_questions_pkey" PRIMARY KEY (id),
  CONSTRAINT "cover_letter_questions_application_id_fkey"
    FOREIGN KEY (application_id) REFERENCES "public"."company_applications"(id) ON DELETE CASCADE
);

ALTER TABLE "public"."cover_letter_questions"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cover_letter_questions_owner_select" ON "public"."cover_letter_questions"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "cover_letter_questions_owner_insert" ON "public"."cover_letter_questions"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "cover_letter_questions_owner_update" ON "public"."cover_letter_questions"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "cover_letter_questions_owner_delete" ON "public"."cover_letter_questions"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE INDEX "cover_letter_questions_user_id_idx" ON "public"."cover_letter_questions" USING btree (user_id);
CREATE INDEX "cover_letter_questions_application_id_idx" ON "public"."cover_letter_questions" USING btree (application_id);
