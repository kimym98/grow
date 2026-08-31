-- `supabase db diff --linked` 결과 잔여 diff 정리.
-- delete_user_llm_key/get_user_llm_key/set_user_llm_key의 anon 권한은 원격에서는 이미 없는 상태이지만,
-- pg-delta 진단 결과 로컬 마이그레이션 적용본과 정확히 동일한 최종 상태를 명시적으로 보장하기 위해 추가한다.
-- 보안에 영향 없음(권한을 넓히는 게 아니라 anon 접근을 명시적으로 재차 차단하는 방향).
SET local check_function_bodies = off;

REVOKE ALL ON FUNCTION "public"."delete_user_llm_key"(text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."get_user_llm_key"(text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."set_user_llm_key"(text, text) FROM "anon";
