SET local check_function_bodies = off;

CREATE EXTENSION "pg_cron";

CREATE EXTENSION "pg_net" SCHEMA "extensions";

CREATE TABLE "public"."cs_questions" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "category"      text                     NOT NULL,
  "question"      text                     NOT NULL,
  "answer"        text                     NOT NULL,
  "choices"       text[],
  "correct_index" integer,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "question_type" text                     NOT NULL DEFAULT 'multiple-choice'::text,
  CONSTRAINT "cs_questions_category_check"
    CHECK ((category = ANY (ARRAY['network'::text, 'database'::text, 'os'::text, 'data-structure'::text, 'ai-llm'::text, 'frontend'::text]))),
  CONSTRAINT "cs_questions_pkey" PRIMARY KEY (id),
  CONSTRAINT "cs_questions_question_type_check" CHECK ((question_type = ANY (ARRAY['multiple-choice'::text, 'short-answer'::text]))),
  CONSTRAINT "cs_questions_type_fields_check" CHECK ((((question_type = 'multiple-choice'::text) AND (choices IS NOT NULL) AND (correct_index IS
    NOT NULL)) OR ((question_type = 'short-answer'::text) AND (choices IS NULL) AND (correct_index IS NULL))))
);

ALTER TABLE "public"."cs_questions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."document_reviews" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "title"           text                     NOT NULL,
  "type"            text                     NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'pending'::text,
  "version"         integer                  NOT NULL DEFAULT 1,
  "resume_question" text,
  "original_text"   text                     NOT NULL,
  "reviewed_text"   text,
  "versions"        jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "comments"        jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "document_reviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "document_reviews_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))),
  CONSTRAINT "document_reviews_type_check" CHECK ((type = ANY (ARRAY['resume'::text, 'portfolio'::text])))
);

ALTER TABLE "public"."document_reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."edge_function_error_logs" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "function_name" text                     NOT NULL,
  "message"       text                     NOT NULL,
  "context"       jsonb,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "edge_function_error_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."edge_function_error_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."instruments" (
  "id"   bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "name" text   NOT NULL,
  CONSTRAINT "instruments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."instruments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."job_collection_logs" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "source"      text                     NOT NULL,
  "status"      text                     NOT NULL,
  "item_count"  integer                  NOT NULL DEFAULT 0,
  "error"       text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "duration_ms" integer,
  CONSTRAINT "job_collection_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "job_collection_logs_status_check" CHECK ((status = ANY (ARRAY['success'::text, 'failure'::text, 'skipped'::text])))
);

ALTER TABLE "public"."job_collection_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."job_postings" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"        text                     NOT NULL,
  "company"      text                     NOT NULL,
  "location"     text                     NOT NULL,
  "career_level" text                     NOT NULL,
  "deadline"     date,
  "tags"         text[]                   NOT NULL DEFAULT '{}'::text[],
  "url"          text                     NOT NULL,
  "source_url"   text                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "source"       text                     NOT NULL DEFAULT 'jobkorea'::text,
  CONSTRAINT "job_postings_pkey" PRIMARY KEY (id),
  CONSTRAINT "job_postings_source_url_key" UNIQUE (source_url)
);

ALTER TABLE "public"."job_postings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."llm_response_cache" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid                     NOT NULL,
  "function_name" text                     NOT NULL,
  "cache_key"     text                     NOT NULL,
  "response"      jsonb                    NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "llm_response_cache_pkey" PRIMARY KEY (id),
  CONSTRAINT "llm_response_cache_user_id_function_name_cache_key_key" UNIQUE (user_id, function_name, cache_key)
);

ALTER TABLE "public"."llm_response_cache"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."news_collection_logs" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "source"      text                     NOT NULL,
  "status"      text                     NOT NULL,
  "item_count"  integer                  NOT NULL DEFAULT 0,
  "error"       text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "duration_ms" integer,
  CONSTRAINT "news_collection_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "news_collection_logs_status_check" CHECK ((status = ANY (ARRAY['success'::text, 'failure'::text, 'skipped'::text])))
);

ALTER TABLE "public"."news_collection_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."quiz_sessions" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid                     NOT NULL,
  "category"      text                     NOT NULL,
  "total_count"   integer                  NOT NULL,
  "correct_count" integer                  NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "quiz_sessions_category_check"
    CHECK ((category = ANY (ARRAY['network'::text, 'database'::text, 'os'::text, 'data-structure'::text, 'ai-llm'::text, 'frontend'::text, 'mixed'::text]))),
  CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."quiz_sessions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."schedules" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid                     NOT NULL,
  "title"         text                     NOT NULL,
  "memo"          text,
  "date"          date                     NOT NULL,
  "time"          time without time zone,
  "reminder_time" time without time zone,
  "category"      text                     NOT NULL,
  "is_recurring"  boolean                  NOT NULL DEFAULT false,
  "checklist"     jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "schedules_category_check" CHECK ((category = ANY (ARRAY['interview'::text, 'deadline'::text, 'study'::text, 'etc'::text]))),
  CONSTRAINT "schedules_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."schedules"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tech_news_bookmarks" (
  "user_id"    uuid                     NOT NULL,
  "news_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "tech_news_bookmarks_pkey" PRIMARY KEY (user_id, news_id)
);

ALTER TABLE "public"."tech_news_bookmarks"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tech_news" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"        text                     NOT NULL,
  "summary"      text                     NOT NULL,
  "source"       text                     NOT NULL,
  "published_at" date                     NOT NULL,
  "url"          text                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "tech_news_pkey" PRIMARY KEY (id),
  CONSTRAINT "tech_news_url_key" UNIQUE (url)
);

ALTER TABLE "public"."tech_news"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_answers" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "quiz_session_id" uuid                     NOT NULL,
  "question_id"     uuid                     NOT NULL,
  "selected"        integer,
  "is_correct"      boolean                  NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "answer_text"     text,
  "ai_score"        integer,
  "ai_feedback"     text,
  CONSTRAINT "user_answers_ai_score_check" CHECK (((ai_score >= 0) AND (ai_score <= 100))),
  CONSTRAINT "user_answers_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_answers_session_question_unique" UNIQUE (quiz_session_id, question_id)
);

ALTER TABLE "public"."user_answers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_llm_keys" (
  "user_id"    uuid                     NOT NULL,
  "provider"   text                     NOT NULL,
  "secret_id"  uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_llm_keys_pkey" PRIMARY KEY (user_id, PROVIDER),
  CONSTRAINT "user_llm_keys_provider_check" CHECK ((provider = ANY (ARRAY['gemini'::text, 'anthropic'::text])))
);

ALTER TABLE "public"."user_llm_keys"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.delete_user_llm_key (
  p_provider text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'vault'
  AS $function$
declare
  v_user_id uuid := auth.uid();
  v_secret_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select secret_id into v_secret_id
  from public.user_llm_keys
  where user_id = v_user_id and provider = p_provider;

  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_random_quiz_questions (
  p_count    integer,
  p_category text    DEFAULT NULL::text
)
  RETURNS SETOF public.cs_questions
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
  select * from cs_questions
  where p_category is null or category = p_category
  order by random()
  limit p_count;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_llm_key (
  p_provider text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'vault'
  AS $function$
declare
  v_user_id uuid := auth.uid();
  v_api_key text;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select decrypted_secret into v_api_key
  from vault.decrypted_secrets ds
  join public.user_llm_keys k on k.secret_id = ds.id
  where k.user_id = v_user_id and k.provider = p_provider;

  return v_api_key;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_llm_key (
  p_provider text,
  p_api_key  text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'vault'
  AS $function$
declare
  v_user_id uuid := auth.uid();
  v_secret_id uuid;
  v_existing_secret_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_provider not in ('gemini', 'anthropic') then
    raise exception 'unsupported provider: %', p_provider;
  end if;

  select secret_id into v_existing_secret_id
  from public.user_llm_keys
  where user_id = v_user_id and provider = p_provider;

  if v_existing_secret_id is not null then
    perform vault.update_secret(v_existing_secret_id, p_api_key);
    v_secret_id := v_existing_secret_id;
  else
    v_secret_id := vault.create_secret(p_api_key, format('llm_key:%s:%s', v_user_id, p_provider));

    insert into public.user_llm_keys (user_id, provider, secret_id)
    values (v_user_id, p_provider, v_secret_id);
  end if;

  update public.user_llm_keys
  set updated_at = now()
  where user_id = v_user_id and provider = p_provider;
end;
$function$;

ALTER TABLE "public"."document_reviews"
  ADD CONSTRAINT "document_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."llm_response_cache"
  ADD CONSTRAINT "llm_response_cache_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."quiz_sessions"
  ADD CONSTRAINT "quiz_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."schedules"
  ADD CONSTRAINT "schedules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."tech_news_bookmarks"
  ADD CONSTRAINT "tech_news_bookmarks_news_id_fkey" FOREIGN KEY (news_id) REFERENCES public.tech_news(id) ON DELETE CASCADE;

ALTER TABLE "public"."tech_news_bookmarks"
  ADD CONSTRAINT "tech_news_bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."user_answers"
  ADD CONSTRAINT "user_answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.cs_questions(id);

ALTER TABLE "public"."user_answers"
  ADD CONSTRAINT "user_answers_quiz_session_id_fkey" FOREIGN KEY (quiz_session_id) REFERENCES public.quiz_sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_llm_keys"
  ADD CONSTRAINT "user_llm_keys_secret_id_fkey" FOREIGN KEY (secret_id) REFERENCES vault.secrets(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_llm_keys"
  ADD CONSTRAINT "user_llm_keys_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE VIEW "public"."user_llm_key_status" WITH (security_invoker=true) AS  SELECT user_id,
    provider,
    created_at,
    updated_at
   FROM public.user_llm_keys;

CREATE INDEX cs_questions_category_idx ON public.cs_questions USING btree (category);

CREATE INDEX document_reviews_user_id_updated_at_idx ON public.document_reviews USING btree (user_id, updated_at DESC);

CREATE INDEX job_collection_logs_source_created_at_idx ON public.job_collection_logs USING btree (source, created_at DESC);

CREATE INDEX job_postings_deadline_idx ON public.job_postings USING btree (deadline);

CREATE INDEX job_postings_tags_idx ON public.job_postings USING gin (tags);

CREATE INDEX quiz_sessions_user_id_created_at_idx ON public.quiz_sessions USING btree (user_id, created_at DESC);

CREATE INDEX schedules_user_id_date_idx ON public.schedules USING btree (user_id, date);

CREATE INDEX user_answers_question_id_is_correct_idx ON public.user_answers USING btree (question_id, is_correct);

CREATE INDEX user_answers_quiz_session_id_idx ON public.user_answers USING btree (quiz_session_id);

CREATE POLICY "cs_questions_select_public" ON "public"."cs_questions"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "document_reviews_owner_delete" ON "public"."document_reviews"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "document_reviews_owner_insert" ON "public"."document_reviews"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "document_reviews_owner_select" ON "public"."document_reviews"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "document_reviews_owner_update" ON "public"."document_reviews"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "edge_function_error_logs_service_role_all" ON "public"."edge_function_error_logs"
  FOR ALL
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public can read instruments" ON "public"."instruments"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "job_collection_logs_service_role_all" ON "public"."job_collection_logs"
  FOR ALL
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "job_postings_insert_service_role" ON "public"."job_postings"
  FOR INSERT
  TO "service_role"
  WITH CHECK (true);

CREATE POLICY "job_postings_select_public" ON "public"."job_postings"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "job_postings_update_service_role" ON "public"."job_postings"
  FOR UPDATE
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "llm_response_cache_owner_insert" ON "public"."llm_response_cache"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "llm_response_cache_owner_select" ON "public"."llm_response_cache"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "llm_response_cache_owner_update" ON "public"."llm_response_cache"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "news_collection_logs_service_role_all" ON "public"."news_collection_logs"
  FOR ALL
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "quiz_sessions_owner_delete" ON "public"."quiz_sessions"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "quiz_sessions_owner_insert" ON "public"."quiz_sessions"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "quiz_sessions_owner_select" ON "public"."quiz_sessions"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "quiz_sessions_owner_update" ON "public"."quiz_sessions"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "schedules_owner_delete" ON "public"."schedules"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "schedules_owner_insert" ON "public"."schedules"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "schedules_owner_select" ON "public"."schedules"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "schedules_owner_update" ON "public"."schedules"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "tech_news_insert_service_role" ON "public"."tech_news"
  FOR INSERT
  TO "service_role"
  WITH CHECK (true);

CREATE POLICY "tech_news_select_public" ON "public"."tech_news"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "tech_news_update_service_role" ON "public"."tech_news"
  FOR UPDATE
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tech_news_bookmarks_owner_delete" ON "public"."tech_news_bookmarks"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "tech_news_bookmarks_owner_insert" ON "public"."tech_news_bookmarks"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "tech_news_bookmarks_owner_select" ON "public"."tech_news_bookmarks"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "user_answers_owner_insert" ON "public"."user_answers"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.quiz_sessions s
  WHERE ((s.id = user_answers.quiz_session_id) AND (s.user_id = auth.uid())))));

CREATE POLICY "user_answers_owner_select" ON "public"."user_answers"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.quiz_sessions s
  WHERE ((s.id = user_answers.quiz_session_id) AND (s.user_id = auth.uid())))));

CREATE POLICY "user_answers_owner_update" ON "public"."user_answers"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.quiz_sessions s
  WHERE ((s.id = user_answers.quiz_session_id) AND (s.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.quiz_sessions s
  WHERE ((s.id = user_answers.quiz_session_id) AND (s.user_id = auth.uid())))));

CREATE POLICY "user_llm_keys_owner_delete" ON "public"."user_llm_keys"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "user_llm_keys_owner_select" ON "public"."user_llm_keys"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "documents_owner_delete" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "documents_owner_insert" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "documents_owner_select" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."job_postings";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tech_news";

COMMENT ON EXTENSION "pg_cron" IS 'Job scheduler for PostgreSQL';

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';

REVOKE ALL ON FUNCTION "public"."delete_user_llm_key"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."delete_user_llm_key"(text) TO "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_random_quiz_questions"(integer, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_user_llm_key"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_user_llm_key"(text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."set_user_llm_key"(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."set_user_llm_key"(text, text) TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cs_questions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."document_reviews" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."edge_function_error_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."instruments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."job_collection_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."job_postings" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."llm_response_cache" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."news_collection_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."quiz_sessions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."schedules" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tech_news" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tech_news_bookmarks" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_answers" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_llm_keys" TO "anon";

REVOKE ALL ON TABLE "public"."user_llm_keys" FROM "authenticated";

GRANT DELETE, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."user_llm_keys" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_llm_keys" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_llm_key_status" TO "anon", "authenticated", "postgres", "service_role";

SELECT cron.schedule_in_database('collect-job-postings-evening', '0 9 * * *', '
  select net.http_post(
    url := ''https://ciyscihtgpiikouxtblw.supabase.co/functions/v1/collect-job-postings'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''apiKey'', (select decrypted_secret from vault.decrypted_secrets where name = ''collect_job_postings_service_key'')
    ),
    body := ''{}''::jsonb
  );
  ', 'postgres', NULL, true);

SELECT cron.schedule_in_database('collect-job-postings-morning', '0 0 * * *', '
  select net.http_post(
    url := ''https://ciyscihtgpiikouxtblw.supabase.co/functions/v1/collect-job-postings'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''apiKey'', (select decrypted_secret from vault.decrypted_secrets where name = ''collect_job_postings_service_key'')
    ),
    body := ''{}''::jsonb
  );
  ', 'postgres', NULL, true);

SELECT cron.schedule_in_database('collect-tech-news-evening', '0 9 * * *', '
  select net.http_post(
    url := ''https://ciyscihtgpiikouxtblw.supabase.co/functions/v1/collect-tech-news'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''apiKey'', (select decrypted_secret from vault.decrypted_secrets where name = ''collect_job_postings_service_key'')
    ),
    body := ''{}''::jsonb
  );
  ', 'postgres', NULL, true);

SELECT cron.schedule_in_database('collect-tech-news-morning', '0 0 * * *', '
  select net.http_post(
    url := ''https://ciyscihtgpiikouxtblw.supabase.co/functions/v1/collect-tech-news'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''apiKey'', (select decrypted_secret from vault.decrypted_secrets where name = ''collect_job_postings_service_key'')
    ),
    body := ''{}''::jsonb
  );
  ', 'postgres', NULL, true);

